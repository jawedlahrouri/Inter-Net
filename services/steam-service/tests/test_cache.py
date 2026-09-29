import pytest

from common.cache import Cache, hash_secret


class FailingBackend:
    async def get(self, key):
        """
        @brief Simulates a failing cache backend read by always raising a ConnectionError.
        @param key Cache key that would be looked up in the backend.
        """
        raise ConnectionError("redis down")

    async def set(self, key, value, ttl):
        """
        @brief Simulates a failing cache backend write by always raising a ConnectionError.
        @param key Cache key that would be stored in the backend.
        @param value Value that would be stored in the backend.
        @param ttl Time to live in seconds that would be applied to the entry.
        """
        raise ConnectionError("redis down")


@pytest.mark.anyio
async def test_get_or_fetch_hit_and_miss():
    """
    @brief Tests that get_or_fetch calls the fetcher on the first request and serves the second one from the cache.
    """
    cache = Cache("test", ttl=60)
    calls = []

    async def fetch():
        """
        @brief Fake fetcher that records each invocation so the test can count how many times it was called.
        @return A dict containing the number of calls made so far under the value key.
        """
        calls.append(1)
        return {"value": len(calls)}

    first, hit_first = await cache.get_or_fetch("k", fetch)
    second, hit_second = await cache.get_or_fetch("k", fetch)

    assert first == second == {"value": 1}
    assert (hit_first, hit_second) == (False, True)
    assert len(calls) == 1


@pytest.mark.anyio
async def test_force_refresh_bypasses_cache():
    """
    @brief Tests that force_refresh skips the cached value, refetches, and stores the new value for later hits.
    """
    cache = Cache("test", ttl=60)
    counter = {"n": 0}

    async def fetch():
        """
        @brief Fake fetcher that increments a shared counter each time it is called.
        @return The updated counter value.
        """
        counter["n"] += 1
        return counter["n"]

    await cache.get_or_fetch("k", fetch)
    value, hit = await cache.get_or_fetch("k", fetch, force_refresh=True)
    assert (value, hit) == (2, False)
    assert await cache.get_or_fetch("k", fetch) == (2, True)


@pytest.mark.anyio
async def test_expired_entry_is_refetched(monkeypatch):
    """
    @brief Tests that a cache entry older than its TTL is discarded and fetched again, using a mocked monotonic clock.
    @param monkeypatch Pytest fixture used to replace the cache module's time.monotonic with a controllable fake clock.
    """
    cache = Cache("test", ttl=60)
    now = {"t": 1000.0}
    monkeypatch.setattr("common.cache.time.monotonic", lambda: now["t"])

    async def fetch():
        """
        @brief Fake fetcher that provides a constant fresh value for the expiry test.
        @return The string fresh.
        """
        return "fresh"

    await cache.get_or_fetch("k", fetch)
    now["t"] += 61
    assert await cache.get_or_fetch("k", fetch) == ("fresh", False)


@pytest.mark.anyio
async def test_zero_ttl_disables_cache():
    """
    @brief Tests that a cache created with a TTL of zero never returns cached values.
    """
    cache = Cache("test", ttl=0)

    async def fetch():
        """
        @brief Fake fetcher that provides a constant fresh value for the zero-TTL test.
        @return The string fresh.
        """
        return "fresh"

    await cache.get_or_fetch("k", fetch)
    assert await cache.get_or_fetch("k", fetch) == ("fresh", False)


@pytest.mark.anyio
async def test_backend_failure_does_not_break_requests():
    """
    @brief Tests that get_or_fetch still returns fetched data as a miss when the cache backend raises errors.
    """
    cache = Cache("test", ttl=60)
    cache.backend = FailingBackend()

    async def fetch():
        """
        @brief Fake fetcher that provides a constant payload for the failing-backend test.
        @return A dict with ok set to True.
        """
        return {"ok": True}

    assert await cache.get_or_fetch("k", fetch) == ({"ok": True}, False)


def test_hash_secret_hides_token():
    """
    @brief Tests that hash_secret returns a 64-character digest that does not leak the token and differs for different tokens.
    """
    digest = hash_secret("ghp_secret_token")
    assert "ghp_" not in digest
    assert len(digest) == 64
    assert digest != hash_secret("ghp_secret_tokeN")
