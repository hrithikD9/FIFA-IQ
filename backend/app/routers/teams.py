from __future__ import annotations

import logging
from typing import Any

from fastapi import APIRouter, HTTPException, status

from app.database import supabase
from app.models.team import Team

router = APIRouter()
logger = logging.getLogger(__name__)


def _normalize_team_payload(payload: Any) -> Team:
    """Validate and convert a Supabase row into a Team model."""
    return Team.model_validate(payload)


@router.get("/", response_model=list[Team], status_code=status.HTTP_200_OK)
async def get_all_teams() -> list[Team]:
    """Fetch all teams from Supabase."""
    try:
        response = supabase.table("teams").select("*").order("name").execute()
        return [_normalize_team_payload(row) for row in response.data or []]
    except HTTPException:
        raise
    except Exception as exc:
        logger.error(f"Teams Router Error: {exc}", exc_info=True)
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Database error: {str(exc)}",
        ) from exc


@router.get("/{team_id}", response_model=Team, status_code=status.HTTP_200_OK)
async def get_team_by_id(team_id: int) -> Team:
    """Fetch a single team by ID from Supabase."""
    try:
        response = supabase.table("teams").select("*").eq("id", team_id).limit(1).execute()
        team_data = (response.data or [None])[0]

        if not team_data:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail=f"Team with id {team_id} not found.",
            )

        return _normalize_team_payload(team_data)
    except HTTPException:
        raise
    except Exception as exc:
        logger.error(f"Teams Router Error: {exc}", exc_info=True)
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Database error: {str(exc)}",
        ) from exc
        
