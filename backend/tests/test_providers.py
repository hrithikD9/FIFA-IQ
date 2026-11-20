import asyncio

import httpx
import pytest

from app.services.providers import (
    FootballDataProvider,
    ProviderForbidden,
    ProviderNotConfigured,
    ProviderNotFound,
    ProviderRateLimited,
    SlidingWindowLimiter,
)


def provider(status_code, body=None, logs=None, key="secret"):
    def handler(request):
        assert request.headers["X-Auth-Token"] == key
        return httpx.Response(status_code, json=body or {})

    return FootballDataProvider(
        api_key=key,
        transport=httpx.MockTransport(handler),
        request_logger=(logs.append if logs is not None else None),
        limiter=SlidingWindowLimiter(limit=100),
    )


def test_success_returns_json_and_logs_without_key():
    logs = []
    data = asyncio.run(provider(200, {"x": 1}, logs).get("teams/81"))
    assert data == {"x": 1}
    assert logs[0]["ok"] is True and logs[0]["endpoint"] == "teams/81"
    assert "secret" not in str(logs)


@pytest.mark.parametrize(
    "code,exc",
    [(404, ProviderNotFound), (429, ProviderRateLimited), (403, ProviderForbidden), (500, Exception)],
)
def test_error_status_mapping(code, exc):
    with pytest.raises(exc):
        asyncio.run(provider(code).get("x"))


def test_missing_key_is_not_configured(monkeypatch):
    monkeypatch.delenv("FOOTBALL_DATA_API_KEY", raising=False)
    p = FootballDataProvider(transport=httpx.MockTransport(lambda r: httpx.Response(200, json={})))
    with pytest.raises(ProviderNotConfigured):
        asyncio.run(p.get("x"))


def test_limiter_rejects_when_wait_too_long():
    limiter = SlidingWindowLimiter(limit=2, window=60, max_wait=0.1)

    async def main():
        await limiter.acquire()
        await limiter.acquire()
        await limiter.acquire()

    with pytest.raises(ProviderRateLimited):
        asyncio.run(main())
