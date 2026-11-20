"""HTTP clients for external football data providers.

- football-data.org (primary): competitions, fixtures, results, standings,
  scorers, teams/squads, player profiles. Free tier: 10 requests/minute,
  delayed scores, no lineups/events/odds.
- TheSportsDB (enrichment): player photos and physical details. The public
  free key is used unless THESPORTSDB_API_KEY is set.

Every outbound request is recorded in ``api_request_logs`` for admin monitoring.
"""

from __future__ import annotations

import asyncio
import logging
import os
import time
from collections import deque
from typing import Any, Callable

import httpx
from starlette.concurrency import run_in_threadpool

logger = logging.getLogger(__name__)


class ProviderError(Exception):
    """Base error for provider failures. ``status_code`` is the HTTP status to return."""

    status_code = 502
    public_message = "Football data provider is unavailable. Please try again shortly."


class ProviderNotConfigured(ProviderError):
    status_code = 503
    public_message = "Football data provider is not configured on the server."


class ProviderRateLimited(ProviderError):
    status_code = 503
    public_message = "Football data rate limit reached. Please try again in a minute."


class ProviderNotFound(ProviderError):
    status_code = 404
    public_message = "Requested football data was not found."


class ProviderForbidden(ProviderError):
    status_code = 403
    public_message = "This data is not available on the current football data plan."


class SlidingWindowLimiter:
    """Allow at most ``limit`` calls per ``window`` seconds.

    Waits up to ``max_wait`` seconds for a slot; beyond that raises
    ProviderRateLimited so the caller can serve stale cache instead of hanging.
    """

    def __init__(self, limit: int, window: float = 60.0, max_wait: float = 8.0) -> None:
        self.limit = limit
        self.window = window
        self.max_wait = max_wait
        self._calls: deque[float] = deque()
        self._lock = asyncio.Lock()

    async def acquire(self) -> None:
        async with self._lock:
            now = time.monotonic()
            while self._calls and now - self._calls[0] >= self.window:
                self._calls.popleft()
            if len(self._calls) >= self.limit:
                wait = self.window - (now - self._calls[0])
                if wait > self.max_wait:
                    raise ProviderRateLimited()
                await asyncio.sleep(wait)
                self._calls.popleft()
            self._calls.append(time.monotonic())


RequestLogger = Callable[[dict[str, Any]], None]


def supabase_request_logger(client: Any) -> RequestLogger:
    state = {"enabled": True}

    def log(row: dict[str, Any]) -> None:
        if not state["enabled"]:
            return
        try:
            client.table("api_request_logs").insert(row).execute()
        except Exception as exc:
            state["enabled"] = False
            logger.warning(
                "api_request_logs table unavailable (%s); request logging disabled. "
                "Run backend/supabase_football_api.sql to enable it.",
                exc,
            )

    return log


class BaseProvider:
    name = "provider"
    base_url = ""

    def __init__(
        self,
        *,
        transport: httpx.AsyncBaseTransport | None = None,
        request_logger: RequestLogger | None = None,
        limiter: SlidingWindowLimiter | None = None,
    ) -> None:
        self._transport = transport
        self._client: httpx.AsyncClient | None = None
        self._log = request_logger
        self._limiter = limiter

    def _headers(self) -> dict[str, str]:
        return {}

    def _url(self, path: str) -> str:
        return f"{self.base_url}/{path.lstrip('/')}"

    def _get_client(self) -> httpx.AsyncClient:
        if self._client is None:
            self._client = httpx.AsyncClient(timeout=15.0, transport=self._transport)
        return self._client

    async def aclose(self) -> None:
        if self._client is not None:
            await self._client.aclose()
            self._client = None

    async def _record(self, endpoint: str, status_code: int | None, ok: bool, started: float, error: str | None) -> None:
        if self._log is None:
            return
        row = {
            "provider": self.name,
            "endpoint": endpoint[:300],
            "status_code": status_code,
            "ok": ok,
            "latency_ms": int((time.monotonic() - started) * 1000),
            "error": (error or None) and error[:500],
        }
        try:
            await run_in_threadpool(self._log, row)
        except Exception:  # logging must never break a request
            logger.debug("Request log write failed", exc_info=True)

    async def get(self, path: str, params: dict[str, Any] | None = None) -> Any:
        headers = self._headers()
        if self._limiter is not None:
            try:
                await self._limiter.acquire()
            except ProviderRateLimited:
                await self._record(path, 429, False, time.monotonic(), "local rate limit")
                raise

        started = time.monotonic()
        clean_params = {k: v for k, v in (params or {}).items() if v is not None}
        try:
            resp = await self._get_client().get(self._url(path), params=clean_params, headers=headers)
        except httpx.HTTPError as exc:
            await self._record(path, None, False, started, type(exc).__name__)
            raise ProviderError() from exc

        ok = resp.status_code == 200
        await self._record(path, resp.status_code, ok, started, None if ok else resp.text[:200])

        if resp.status_code == 200:
            try:
                return resp.json()
            except ValueError as exc:
                raise ProviderError() from exc
        if resp.status_code == 404:
            raise ProviderNotFound()
        if resp.status_code == 429:
            raise ProviderRateLimited()
        if resp.status_code in (401, 403):
            logger.warning("%s returned %s for %s", self.name, resp.status_code, path)
            raise ProviderForbidden()
        raise ProviderError()


class FootballDataProvider(BaseProvider):
    name = "football-data.org"
    base_url = "https://api.football-data.org/v4"

    def __init__(self, api_key: str | None = None, **kwargs: Any) -> None:
        kwargs.setdefault("limiter", SlidingWindowLimiter(limit=int(os.getenv("FOOTBALL_DATA_RATE_LIMIT", "9"))))
        super().__init__(**kwargs)
        self._api_key = api_key

    def _headers(self) -> dict[str, str]:
        key = self._api_key or os.getenv("FOOTBALL_DATA_API_KEY")
        if not key:
            raise ProviderNotConfigured()
        return {"X-Auth-Token": key}


class TheSportsDbProvider(BaseProvider):
    name = "thesportsdb"

    def __init__(self, api_key: str | None = None, **kwargs: Any) -> None:
        kwargs.setdefault("limiter", SlidingWindowLimiter(limit=25))
        super().__init__(**kwargs)
        self._api_key = api_key

    @property
    def base_url(self) -> str:  # type: ignore[override]
        key = self._api_key or os.getenv("THESPORTSDB_API_KEY") or "123"
        return f"https://www.thesportsdb.com/api/v1/json/{key}"
