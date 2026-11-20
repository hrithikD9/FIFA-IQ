"""Two-level cache for external football API responses.

Level 1 is an in-process dict (fast, per worker). Level 2 is the Supabase
``api_cache`` table (shared across workers and restarts). If the provider call
fails, the most recent stale copy is served instead of an error, so the UI keeps
working when the free-tier rate limit is hit or the provider is down.

If the ``api_cache`` table does not exist yet, the Supabase level is disabled
after the first failure and the cache keeps working in memory only.
"""

from __future__ import annotations

import asyncio
import logging
import time
from dataclasses import dataclass
from datetime import datetime, timedelta, timezone
from typing import Any, Awaitable, Callable, Protocol

from starlette.concurrency import run_in_threadpool

logger = logging.getLogger(__name__)

TtlSpec = int | Callable[[Any], int]


@dataclass
class CacheEntry:
    payload: Any
    fetched_at: float
    expires_at: float

    @property
    def is_fresh(self) -> bool:
        return time.time() < self.expires_at


@dataclass
class CacheResult:
    payload: Any
    fetched_at: float
    stale: bool


class PersistentStore(Protocol):
    def get(self, key: str) -> CacheEntry | None: ...

    def set(self, key: str, provider: str, entry: CacheEntry) -> None: ...


class SupabaseStore:
    """Persistent cache level backed by the public.api_cache table."""

    def __init__(self, client: Any) -> None:
        self._client = client
        self.enabled = True

    def _disable(self, exc: Exception) -> None:
        if self.enabled:
            logger.warning(
                "api_cache table unavailable (%s). Falling back to in-memory cache only. "
                "Run backend/supabase_football_api.sql to enable persistent caching.",
                exc,
            )
        self.enabled = False

    def get(self, key: str) -> CacheEntry | None:
        if not self.enabled:
            return None
        try:
            resp = (
                self._client.table("api_cache")
                .select("payload, fetched_at, expires_at")
                .eq("cache_key", key)
                .limit(1)
                .execute()
            )
        except Exception as exc:  # table missing, network, etc.
            self._disable(exc)
            return None
        rows = resp.data or []
        if not rows:
            return None
        row = rows[0]
        return CacheEntry(
            payload=row["payload"],
            fetched_at=_parse_ts(row["fetched_at"]),
            expires_at=_parse_ts(row["expires_at"]),
        )

    def set(self, key: str, provider: str, entry: CacheEntry) -> None:
        if not self.enabled:
            return
        try:
            self._client.table("api_cache").upsert(
                {
                    "cache_key": key,
                    "provider": provider,
                    "payload": entry.payload,
                    "fetched_at": _to_iso(entry.fetched_at),
                    "expires_at": _to_iso(entry.expires_at),
                },
                on_conflict="cache_key",
            ).execute()
        except Exception as exc:
            self._disable(exc)


def _parse_ts(value: str) -> float:
    return datetime.fromisoformat(value.replace("Z", "+00:00")).timestamp()


def _to_iso(ts: float) -> str:
    return datetime.fromtimestamp(ts, tz=timezone.utc).isoformat()


class ApiCache:
    _MAX_MEMORY_ENTRIES = 1000

    def __init__(self, store: PersistentStore | None = None) -> None:
        self._memory: dict[str, CacheEntry] = {}
        self._store = store
        self._locks: dict[str, asyncio.Lock] = {}

    def clear_memory(self) -> None:
        self._memory.clear()

    def _remember(self, key: str, entry: CacheEntry) -> None:
        if len(self._memory) >= self._MAX_MEMORY_ENTRIES and key not in self._memory:
            oldest = min(self._memory, key=lambda k: self._memory[k].fetched_at)
            self._memory.pop(oldest, None)
        self._memory[key] = entry

    async def get_or_fetch(
        self,
        key: str,
        provider: str,
        ttl: TtlSpec,
        fetcher: Callable[[], Awaitable[Any]],
    ) -> CacheResult:
        entry = self._memory.get(key)
        if entry and entry.is_fresh:
            return CacheResult(entry.payload, entry.fetched_at, stale=False)

        # One in-flight fetch per key: concurrent requests wait for the first one.
        lock = self._locks.setdefault(key, asyncio.Lock())
        async with lock:
            entry = self._memory.get(key)
            if entry and entry.is_fresh:
                return CacheResult(entry.payload, entry.fetched_at, stale=False)

            if self._store is not None:
                stored = await run_in_threadpool(self._store.get, key)
                if stored is not None:
                    self._remember(key, stored)
                    if stored.is_fresh:
                        return CacheResult(stored.payload, stored.fetched_at, stale=False)
                    entry = stored

            try:
                payload = await fetcher()
            except Exception:
                if entry is not None:
                    logger.warning("Serving stale cache for %s after provider error", key)
                    return CacheResult(entry.payload, entry.fetched_at, stale=True)
                raise

            seconds = ttl(payload) if callable(ttl) else ttl
            now = time.time()
            fresh = CacheEntry(payload=payload, fetched_at=now, expires_at=now + seconds)
            self._remember(key, fresh)
            if self._store is not None:
                await run_in_threadpool(self._store.set, key, provider, fresh)
            return CacheResult(payload, now, stale=False)


def ttl_seconds(*, minutes: int = 0, hours: int = 0, days: int = 0) -> int:
    return int(timedelta(minutes=minutes, hours=hours, days=days).total_seconds())
