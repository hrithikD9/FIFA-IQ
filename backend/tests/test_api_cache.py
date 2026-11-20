import asyncio
import time

import pytest

from app.services.api_cache import ApiCache, CacheEntry


class FakeStore:
    def __init__(self):
        self.rows: dict[str, CacheEntry] = {}

    def get(self, key):
        return self.rows.get(key)

    def set(self, key, provider, entry):
        self.rows[key] = entry


class Counter:
    def __init__(self, value="data", fail=False):
        self.calls = 0
        self.value = value
        self.fail = fail

    async def __call__(self):
        self.calls += 1
        if self.fail:
            raise RuntimeError("provider down")
        return {"value": self.value, "n": self.calls}


def run(coro):
    return asyncio.run(coro)


def test_fresh_entry_is_served_without_refetch():
    cache, fetch = ApiCache(), Counter()
    first = run(cache.get_or_fetch("k", "p", 60, fetch))
    second = run(cache.get_or_fetch("k", "p", 60, fetch))
    assert fetch.calls == 1
    assert first.payload == second.payload
    assert not second.stale


def test_expired_entry_is_refetched():
    cache, fetch = ApiCache(), Counter()
    run(cache.get_or_fetch("k", "p", 0, fetch))
    run(cache.get_or_fetch("k", "p", 0, fetch))
    assert fetch.calls == 2


def test_stale_copy_served_when_provider_fails():
    cache = ApiCache()
    run(cache.get_or_fetch("k", "p", 0, Counter("old")))
    result = run(cache.get_or_fetch("k", "p", 60, Counter(fail=True)))
    assert result.stale
    assert result.payload["value"] == "old"


def test_error_raised_when_nothing_cached():
    with pytest.raises(RuntimeError):
        run(ApiCache().get_or_fetch("k", "p", 60, Counter(fail=True)))


def test_callable_ttl_uses_payload():
    cache, fetch = ApiCache(), Counter()
    run(cache.get_or_fetch("k", "p", lambda payload: 0 if payload["n"] == 1 else 60, fetch))
    run(cache.get_or_fetch("k", "p", 60, fetch))
    assert fetch.calls == 2


def test_persistent_store_survives_memory_clear():
    store = FakeStore()
    cache, fetch = ApiCache(store), Counter()
    run(cache.get_or_fetch("k", "p", 60, fetch))
    cache.clear_memory()
    result = run(cache.get_or_fetch("k", "p", 60, fetch))
    assert fetch.calls == 1
    assert result.payload["n"] == 1


def test_expired_store_entry_used_as_stale_fallback():
    store = FakeStore()
    now = time.time()
    store.rows["k"] = CacheEntry({"value": "db"}, now - 100, now - 10)
    result = run(ApiCache(store).get_or_fetch("k", "p", 60, Counter(fail=True)))
    assert result.stale and result.payload == {"value": "db"}


def test_concurrent_requests_share_one_fetch():
    cache = ApiCache()
    calls = 0

    async def slow():
        nonlocal calls
        calls += 1
        await asyncio.sleep(0.05)
        return {"ok": True}

    async def main():
        await asyncio.gather(*(cache.get_or_fetch("k", "p", 60, slow) for _ in range(5)))

    run(main())
    assert calls == 1
