from __future__ import annotations

import logging
from datetime import datetime, timedelta, timezone
from typing import Any, cast

from fastapi import APIRouter, Depends, HTTPException, status
from pydantic import BaseModel, ConfigDict, Field

from app.core.security import get_current_user
from app.database import supabase
from app.models.team import Team

router = APIRouter()
logger = logging.getLogger(__name__)


# ---------------------------------------------------------------------------
# Admin authorization
# ---------------------------------------------------------------------------
def verify_admin_user(current_user: dict[str, Any] = Depends(get_current_user)) -> dict[str, Any]:
    """Enforce admin access using server-controlled Supabase app metadata."""
    app_metadata = current_user.get("app_metadata")
    is_admin = isinstance(app_metadata, dict) and bool(
        app_metadata.get("is_admin") or app_metadata.get("role") == "admin"
    )

    if not is_admin:
        logger.warning(f"Admin access denied for user_id: {current_user.get('id')}")
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Admin privileges required.",
        )

    return current_user


# ---------------------------------------------------------------------------
# Schemas
# ---------------------------------------------------------------------------
class TeamMetricsUpdate(BaseModel):
    """Payload of updatable team attributes. All fields are optional so a PATCH-like
    PUT updates only what is provided. `model_config` allows arbitrary extra keys to
    be forward-compatible with future metric columns.
    """

    model_config = ConfigDict(extra="forbid")

    name: str | None = Field(default=None, min_length=1)
    league: str | None = None
    logo_url: str | None = None
    xg_avg: float | None = Field(default=None, ge=0)
    possession_avg: float | None = Field(default=None, ge=0, le=100)
    defensive_rating: float | None = Field(default=None, ge=0)
    press_resistance: float | None = Field(default=None, ge=0)


class AdminTelemetry(BaseModel):
    total_predictions: int
    total_teams: int
    total_matches: int
    recent_predictions: list[dict[str, Any]]


# ---------------------------------------------------------------------------
# Endpoints
# ---------------------------------------------------------------------------
@router.get("/teams", response_model=list[Team], status_code=status.HTTP_200_OK)
async def list_all_teams(admin: dict[str, Any] = Depends(verify_admin_user)) -> list[Team]:
    """Return all national teams and their metrics (admin only)."""
    try:
        response = supabase.table("teams").select("*").order("name").execute()
        return [Team.model_validate(row) for row in response.data or []]
    except HTTPException:
        raise
    except Exception as exc:
        logger.error(f"Admin Router Error (list teams): {exc}", exc_info=True)
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Database error: {str(exc)}",
        ) from exc


@router.put("/teams/{team_id}", response_model=Team, status_code=status.HTTP_200_OK)
async def update_team_metrics(
    team_id: int,
    payload: TeamMetricsUpdate,
    admin: dict[str, Any] = Depends(verify_admin_user),
) -> Team:
    """Update team attributes (xg_avg, possession_avg, defensive_rating, ...).

    Only fields present in the request body are written; omitted fields are left
    unchanged. Returns 404 if the team does not exist.
    """
    updates = payload.model_dump(exclude_unset=True)

    if not updates:
        raise HTTPException(
            status_code=status.HTTP_422_UNPROCESSABLE_ENTITY,
            detail="No fields provided to update.",
        )

    try:
        response = (
            supabase.table("teams")
            .update(updates)
            .eq("id", team_id)
            .execute()
        )

        rows = response.data or []
        if not rows:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail=f"Team with id {team_id} not found.",
            )

        return Team.model_validate(rows[0])
    except HTTPException:
        raise
    except Exception as exc:
        logger.error(f"Admin Router Error (update team {team_id}): {exc}", exc_info=True)
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Database error: {str(exc)}",
        ) from exc


@router.get("/telemetry", response_model=AdminTelemetry, status_code=status.HTTP_200_OK)
async def get_admin_telemetry(admin: dict[str, Any] = Depends(verify_admin_user)) -> AdminTelemetry:
    """Return total prediction counts and recent system activity (admin only)."""
    try:
        # Lightweight id-only selects; count rows client-side to avoid pulling
        # full payloads while staying compatible across supabase-py versions.
        predictions_resp = supabase.table("predictions").select("id").execute()
        teams_resp = supabase.table("teams").select("id").execute()
        matches_resp = supabase.table("matches").select("id").execute()

        recent_resp = (
            supabase.table("predictions")
            .select("id, match_id, user_id, win_prob_home, win_prob_away, draw_prob, created_at")
            .order("created_at", desc=True)
            .limit(10)
            .execute()
        )

        recent_rows = cast(list[dict[str, Any]], recent_resp.data or [])

        return AdminTelemetry(
            total_predictions=len(predictions_resp.data or []),
            total_teams=len(teams_resp.data or []),
            total_matches=len(matches_resp.data or []),
            recent_predictions=recent_rows,
        )
    except HTTPException:
        raise
    except Exception as exc:
        logger.error(f"Admin Router Error (telemetry): {exc}", exc_info=True)
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Database error: {str(exc)}",
        ) from exc


class ProviderUsage(BaseModel):
    provider: str
    requests_24h: int
    errors_24h: int
    rate_limited_24h: int
    avg_latency_ms: int | None
    last_request_at: str | None
    last_error: str | None


class ApiUsage(BaseModel):
    window_hours: int
    providers: list[ProviderUsage]
    recent_errors: list[dict[str, Any]]


@router.get("/api-usage", response_model=ApiUsage, status_code=status.HTTP_200_OK)
async def get_api_usage(admin: dict[str, Any] = Depends(verify_admin_user)) -> ApiUsage:
    """External football API health for the last 24 hours (admin only)."""
    since = (datetime.now(timezone.utc) - timedelta(hours=24)).isoformat()
    try:
        resp = (
            supabase.table("api_request_logs")
            .select("provider, endpoint, status_code, ok, latency_ms, error, created_at")
            .gte("created_at", since)
            .order("created_at", desc=True)
            .limit(5000)
            .execute()
        )
    except Exception as exc:
        logger.error(f"Admin Router Error (api usage): {exc}", exc_info=True)
        raise HTTPException(
            status_code=status.HTTP_503_SERVICE_UNAVAILABLE,
            detail="API usage log is unavailable. Run backend/supabase_football_api.sql in Supabase.",
        ) from exc

    rows = cast(list[dict[str, Any]], resp.data or [])
    by_provider: dict[str, list[dict[str, Any]]] = {}
    for row in rows:
        by_provider.setdefault(row["provider"], []).append(row)

    providers = []
    for name, items in sorted(by_provider.items()):
        latencies = [r["latency_ms"] for r in items if r.get("latency_ms") is not None and r.get("status_code") != 429]
        errors = [r for r in items if not r.get("ok")]
        providers.append(
            ProviderUsage(
                provider=name,
                requests_24h=len(items),
                errors_24h=len(errors),
                rate_limited_24h=sum(1 for r in items if r.get("status_code") == 429),
                avg_latency_ms=int(sum(latencies) / len(latencies)) if latencies else None,
                last_request_at=items[0]["created_at"],
                last_error=errors[0]["created_at"] if errors else None,
            )
        )

    recent_errors = [r for r in rows if not r.get("ok")][:20]
    return ApiUsage(window_hours=24, providers=providers, recent_errors=recent_errors)
