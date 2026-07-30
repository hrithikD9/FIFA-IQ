from __future__ import annotations

import hashlib
import time
from typing import Any, cast

import jwt

from fastapi import Depends, HTTPException, status
from fastapi.security import HTTPAuthorizationCredentials, HTTPBearer

from app.database import supabase

security = HTTPBearer(auto_error=False)
_user_cache: dict[str, tuple[float, dict[str, Any]]] = {}
_MAX_CACHED_TOKENS = 256
_CACHE_TTL_SECONDS = 60


def _cache_key(token: str) -> str:
    return hashlib.sha256(token.encode("utf-8")).hexdigest()


def _cached_user(token: str) -> dict[str, Any] | None:
    key = _cache_key(token)
    cached = _user_cache.get(key)
    if cached is None:
        return None

    expires_at, user = cached
    if expires_at <= time.time():
        _user_cache.pop(key, None)
        return None
    return user


def _cache_user(token: str, user: dict[str, Any]) -> None:
    claims = jwt.decode(token, options={"verify_signature": False, "verify_exp": False})
    now = time.time()
    expires_at = min(float(claims.get("exp", now + _CACHE_TTL_SECONDS)), now + _CACHE_TTL_SECONDS)

    if len(_user_cache) >= _MAX_CACHED_TOKENS:
        oldest_token = min(_user_cache, key=lambda key: _user_cache[key][0])
        _user_cache.pop(oldest_token, None)

    _user_cache[_cache_key(token)] = (expires_at, user)


def get_current_user(
    credentials: HTTPAuthorizationCredentials | None = Depends(security),
) -> dict[str, Any]:
    if credentials is None:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Invalid authentication credentials",
        )

    try:
        token = credentials.credentials
        cached = _cached_user(token)
        if cached is not None:
            return cached

        # Supabase remains the source of truth. Subsequent API calls use the
        # validated identity for a short bounded window, avoiding a remote auth
        # round trip on every protected request while retaining revalidation.
        user_response = supabase.auth.get_user(token)
        user = getattr(user_response, "user", None)

        if user is None:
            raise ValueError("No user returned from Supabase")

        user_data = cast(dict[str, Any], user.model_dump() if hasattr(user, "model_dump") else user.__dict__)
        _cache_user(token, user_data)
        return user_data
    except HTTPException:
        raise
    except Exception as exc:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Invalid authentication credentials",
        ) from exc
