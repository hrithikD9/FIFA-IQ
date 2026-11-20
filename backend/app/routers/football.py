"""External football data endpoints (fixtures, results, live, teams, players).

All data comes from FootballService, which caches provider responses. Every
endpoint requires a signed-in user so anonymous traffic cannot drain the
free-tier provider quota.
"""

from __future__ import annotations

import logging
from datetime import date, timedelta
from typing import Any, Literal

from fastapi import APIRouter, Depends, HTTPException, Path, Query, status

from app.core.security import get_current_user
from app.services.football import FootballService, get_football_service
from app.services.providers import ProviderError

router = APIRouter(dependencies=[Depends(get_current_user)])
logger = logging.getLogger(__name__)

MAX_RANGE_DAYS = 9  # inclusive range; the provider allows at most 10 days (exclusive end)
CompetitionCode = Path(..., pattern=r"^[A-Z0-9]{2,5}$", description="e.g. PD, CL, WC")
MatchStatus = Literal["scheduled", "live", "finished", "postponed"]


async def _run(coro: Any) -> Any:
    try:
        return await coro
    except ProviderError as exc:
        logger.warning("Provider error: %s", type(exc).__name__)
        raise HTTPException(status_code=exc.status_code, detail=exc.public_message) from exc


@router.get("/competitions")
async def list_competitions(svc: FootballService = Depends(get_football_service)) -> dict[str, Any]:
    """Competitions on the current data plan, plus the featured club id."""
    return await _run(svc.competitions())


@router.get("/competitions/{code}/standings")
async def competition_standings(
    code: str = CompetitionCode,
    svc: FootballService = Depends(get_football_service),
) -> dict[str, Any]:
    return await _run(svc.standings(code))


@router.get("/competitions/{code}/scorers")
async def competition_scorers(
    code: str = CompetitionCode,
    limit: int = Query(10, ge=1, le=100),
    svc: FootballService = Depends(get_football_service),
) -> dict[str, Any]:
    return await _run(svc.scorers(code, limit))


@router.get("/matches")
async def list_matches(
    date_from: date | None = Query(None, description="Defaults to today (UTC)"),
    date_to: date | None = Query(None, description="Defaults to date_from + 7 days"),
    competitions: str | None = Query(None, pattern=r"^[A-Z0-9]{2,5}(,[A-Z0-9]{2,5})*$", description="Comma-separated codes, e.g. PD,CL"),
    match_status: MatchStatus | None = Query(None, alias="status"),
    svc: FootballService = Depends(get_football_service),
) -> dict[str, Any]:
    """Fixtures and results between two dates, both inclusive (at most 10 days)."""
    start = date_from or date.today()
    end = date_to or start + timedelta(days=7)
    if end < start:
        raise HTTPException(status.HTTP_422_UNPROCESSABLE_CONTENT, "date_to must be on or after date_from.")
    if (end - start).days > MAX_RANGE_DAYS:
        raise HTTPException(status.HTTP_422_UNPROCESSABLE_CONTENT, f"Date range cannot exceed {MAX_RANGE_DAYS} days.")
    codes = competitions.split(",") if competitions else None
    return await _run(svc.matches(start, end, codes, match_status))


@router.get("/matches/live")
async def live_matches(svc: FootballService = Depends(get_football_service)) -> dict[str, Any]:
    """Matches currently in play. Scores are delayed on the free data tier."""
    return await _run(svc.live())


@router.get("/matches/{match_id}")
async def match_detail(
    match_id: int = Path(..., ge=1),
    svc: FootballService = Depends(get_football_service),
) -> dict[str, Any]:
    """Scorecard: result, half-time score, venue, referee and head-to-head."""
    return await _run(svc.match_detail(match_id))


@router.get("/teams/{team_id}")
async def team_detail(
    team_id: int = Path(..., ge=1),
    svc: FootballService = Depends(get_football_service),
) -> dict[str, Any]:
    """Team profile with squad."""
    return await _run(svc.team(team_id))


@router.get("/teams/{team_id}/matches")
async def team_matches(
    team_id: int = Path(..., ge=1),
    match_status: MatchStatus | None = Query(None, alias="status"),
    limit: int = Query(10, ge=1, le=50),
    svc: FootballService = Depends(get_football_service),
) -> dict[str, Any]:
    """A team's fixtures or results. With status=finished, also returns recent form."""
    return await _run(svc.team_matches(team_id, match_status, limit))


@router.get("/players/{player_id}")
async def player_detail(
    player_id: int = Path(..., ge=1),
    svc: FootballService = Depends(get_football_service),
) -> dict[str, Any]:
    """Player profile, photo/bio (TheSportsDB) and season goals/assists."""
    return await _run(svc.player(player_id))
