import hashlib
import json
import logging
import time
from typing import Any, Awaitable, Callable, Dict, Optional, Tuple

logger = logging.getLogger("cache")


class MemoryBackend:
    def __init__(self) -> None:
        """
        @brief Initializes the in-memory cache backend with an empty store.
        """
        self._store: Dict[str, Tuple[float, str]] = {}

    async def get(self, key: str) -> Optional[str]:
        """
        @brief Reads a value from the in-memory store and evicts it if it has expired.
        @param key The cache key to look up.
        @return The cached string value, or None if the key is missing or expired.
        """
        entry = self._store.get(key)
        if entry is None:
            return None
        expires_at, value = entry
        if expires_at < time.monotonic():
            self._store.pop(key, None)
            return None
        return value

    async def set(self, key: str, value: str, ttl: int) -> None:
        """
        @brief Stores a value in memory with an expiration time based on the given TTL.
        @param key The cache key under which to store the value.
        @param value The serialized string value to cache.
        @param ttl The time to live of the entry, in seconds.
        """
        self._store[key] = (time.monotonic() + ttl, value)

    async def clear(self, prefix: str) -> None:
        """
        @brief Removes every in-memory entry whose key starts with the given prefix.
        @param prefix The key prefix identifying the entries to delete.
        """
        for key in [k for k in self._store if k.startswith(prefix)]:
            del self._store[key]


class RedisBackend:
    def __init__(self, url: str) -> None:
        """
        @brief Initializes the Redis cache backend by creating an async Redis client with short timeouts.
        @param url The Redis connection URL.
        """
        from redis.asyncio import Redis

        self._redis = Redis.from_url(
            url,
            decode_responses=True,
            socket_timeout=1.0,
            socket_connect_timeout=1.0,
        )

    async def get(self, key: str) -> Optional[str]:
        """
        @brief Reads a value from Redis for the given key.
        @param key The cache key to look up.
        @return The cached string value, or None if the key does not exist.
        """
        return await self._redis.get(key)

    async def set(self, key: str, value: str, ttl: int) -> None:
        """
        @brief Writes a value to Redis with an expiration delay.
        @param key The cache key under which to store the value.
        @param value The serialized string value to cache.
        @param ttl The expiration delay of the entry, in seconds.
        """
        await self._redis.set(key, value, ex=ttl)

    async def clear(self, prefix: str) -> None:
        """
        @brief Deletes every Redis key that starts with the given prefix by scanning matching keys.
        @param prefix The key prefix identifying the entries to delete.
        """
        async for key in self._redis.scan_iter(match=f"{prefix}*"):
            await self._redis.delete(key)


class Cache:
    def __init__(self, namespace: str, ttl: int, redis_url: Optional[str] = None) -> None:
        """
        @brief Initializes a namespaced cache using Redis when a URL is given and an in-memory backend otherwise.
        @param namespace The prefix prepended to every key to isolate this cache.
        @param ttl The default lifetime of cached entries in seconds, where 0 or less disables caching.
        @param redis_url The optional Redis URL, which selects the Redis backend when provided.
        """
        self.namespace = namespace
        self.ttl = ttl
        self.backend = RedisBackend(redis_url) if redis_url else MemoryBackend()

    def _key(self, key: str) -> str:
        """
        @brief Builds the full backend key by prefixing the given key with the cache namespace.
        @param key The unprefixed cache key.
        @return The namespaced key in the form namespace:key.
        """
        return f"{self.namespace}:{key}"

    async def get_or_fetch(
        self,
        key: str,
        fetch: Callable[[], Awaitable[Any]],
        force_refresh: bool = False,
    ) -> Tuple[Any, bool]:
        """
        @brief Returns the cached JSON value for a key or calls the fetch coroutine and stores its result, tolerating backend errors.
        @param key The cache key, which is namespaced before use.
        @param fetch The async callable that produces the fresh value on a cache miss.
        @param force_refresh Whether to skip the cache read and always fetch a fresh value.
        @return A tuple of the value and a boolean telling whether it came from the cache.
        """
        full_key = self._key(key)
        if not force_refresh:
            try:
                cached = await self.backend.get(full_key)
            except Exception as e:
                logger.warning("Lecture du cache impossible (%s) : %s", full_key, e)
                cached = None
            if cached is not None:
                return json.loads(cached), True

        value = await fetch()
        if self.ttl <= 0:
            return value, False
        try:
            await self.backend.set(full_key, json.dumps(value), self.ttl)
        except Exception as e:
            logger.warning("Écriture du cache impossible (%s) : %s", full_key, e)
        return value, False

    async def clear(self) -> None:
        """
        @brief Clears all entries belonging to this cache namespace from the backend.
        """
        await self.backend.clear(f"{self.namespace}:")


def hash_secret(secret: str) -> str:
    """
    @brief Hashes a secret string with SHA-256 so it can be used safely inside cache keys.
    @param secret The secret value (such as an API token) to hash.
    @return The hexadecimal SHA-256 digest of the UTF-8 encoded secret.
    """
    return hashlib.sha256(secret.encode("utf-8")).hexdigest()
