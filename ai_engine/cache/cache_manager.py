# ==============================================================================
# cache_manager.py - Enterprise Multi-Tier Caching Abstraction
# ==============================================================================

import time
import os
import pickle
import hashlib
from abc import ABC, abstractmethod
from typing import Dict, Any, Optional, Tuple


class ICache(ABC):
    """Abstract interface defining get, set, delete, and flush operations for key-value stores."""
    
    @abstractmethod
    def get(self, key: str) -> Optional[Any]:
        """Fetches value from cache. Returns None on miss or expiry."""
        pass

    @abstractmethod
    def set(self, key: str, value: Any, ttl_seconds: Optional[int] = None) -> None:
        """Stores key-value pair in cache, configuring time-to-live expiration metrics."""
        pass

    @abstractmethod
    def delete(self, key: str) -> None:
        """Removes a key and its mapped values from the cache index."""
        pass

    @abstractmethod
    def clear(self) -> None:
        """Clears all elements inside the active cache namespace."""
        pass


class MemoryCache(ICache):
    """In-memory key-value cache implementation supporting simple TTL expiration strategies."""
    def __init__(self) -> None:
        self._store: Dict[str, Tuple[Any, float]] = {}

    def get(self, key: str) -> Optional[Any]:
        if key not in self._store:
            return None
        val, expiry = self._store[key]
        if time.time() > expiry:
            self.delete(key)
            return None
        return val

    def set(self, key: str, value: Any, ttl_seconds: Optional[int] = None) -> None:
        ttl = ttl_seconds if ttl_seconds is not None else 3600
        expiry = time.time() + ttl
        self._store[key] = (value, expiry)

    def delete(self, key: str) -> None:
        if key in self._store:
            del self._store[key]

    def clear(self) -> None:
        self._store.clear()


class DiskCache(ICache):
    """File-system based storage cache for heavy serialized structures like model weights or image frames."""
    def __init__(self, cache_dir: str = "./ai_engine/cache") -> None:
        self.cache_dir = cache_dir
        os.makedirs(self.cache_dir, exist_ok=True)

    def _get_file_path(self, key: str) -> str:
        hashed_key = hashlib.md5(key.encode("utf-8")).hexdigest()
        return os.path.join(self.cache_dir, f"{hashed_key}.cache")

    def get(self, key: str) -> Optional[Any]:
        path = self._get_file_path(key)
        if not os.path.exists(path):
            return None
        try:
            with open(path, "rb") as f:
                data = pickle.load(f)
            val, expiry = data
            if time.time() > expiry:
                self.delete(key)
                return None
            return val
        except Exception:
            return None

    def set(self, key: str, value: Any, ttl_seconds: Optional[int] = None) -> None:
        ttl = ttl_seconds if ttl_seconds is not None else 86400
        expiry = time.time() + ttl
        path = self._get_file_path(key)
        try:
            with open(path, "wb") as f:
                pickle.dump((value, expiry), f)
        except Exception:
            pass

    def delete(self, key: str) -> None:
        path = self._get_file_path(key)
        if os.path.exists(path):
            try:
                os.remove(path)
            except OSError:
                pass

    def clear(self) -> None:
        for filename in os.listdir(self.cache_dir):
            if filename.endswith(".cache"):
                try:
                    os.remove(os.path.join(self.cache_dir, filename))
                except OSError:
                    pass


class RedisCacheAdapter(ICache):
    """
    Adapter bridging local structures to distributed Redis nodes.
    Falls back gracefully to standard MemoryCache if connections time out.
    """
    def __init__(self, host: str = "localhost", port: int = 6379, db: int = 0) -> None:
        self.host = host
        self.port = port
        self.db = db
        self._client: Optional[Any] = None
        self._fallback = MemoryCache()
        self._connect()

    def _connect(self) -> None:
        try:
            import redis
            self._client = redis.Redis(host=self.host, port=self.port, db=self.db, socket_timeout=1.0)
            self._client.ping()
        except Exception:
            self._client = None

    def get(self, key: str) -> Optional[Any]:
        if not self._client:
            return self._fallback.get(key)
        try:
            data = self._client.get(key)
            if data is None:
                return None
            return pickle.loads(data)
        except Exception:
            return self._fallback.get(key)

    def set(self, key: str, value: Any, ttl_seconds: Optional[int] = None) -> None:
        if not self._client:
            self._fallback.set(key, value, ttl_seconds)
            return
        try:
            serialized = pickle.dumps(value)
            self._client.set(key, serialized, ex=ttl_seconds)
        except Exception:
            self._fallback.set(key, value, ttl_seconds)

    def delete(self, key: str) -> None:
        if not self._client:
            self._fallback.delete(key)
            return
        try:
            self._client.delete(key)
        except Exception:
            self._fallback.delete(key)

    def clear(self) -> None:
        if not self._client:
            self._fallback.clear()
            return
        try:
            self._client.flushdb()
        except Exception:
            self._fallback.clear()


# Cache Provider Factory Pattern
class CacheFactory:
    """Standard injector instantiating appropriate caching structures based on configurations."""
    
    @staticmethod
    def get_cache_provider(provider_type: str = "memory") -> ICache:
        """Instantiates Memory, Disk, or Redis storage providers."""
        prov = provider_type.lower()
        if prov == "redis":
            redis_host = os.getenv("REDIS_HOST", "localhost")
            try:
                redis_port = int(os.getenv("REDIS_PORT", "6379"))
            except ValueError:
                redis_port = 6379
            return RedisCacheAdapter(host=redis_host, port=redis_port)
        elif prov == "disk":
            return DiskCache()
        return MemoryCache()
