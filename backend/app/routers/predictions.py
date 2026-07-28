from __future__ import annotations

import logging
from typing import Any, cast

from fastapi import APIRouter, Depends, HTTPException, status

from app.core.security import get_current_user
from app.database import supabase
from app.models.match import Match
from app.models.prediction import (
    Prediction,
    PredictionComputeRequest,
    PredictionComputeResponse,
    PredictionSaveRequest,
)
from app.models.team import Team
from app.services.analytics import calculate_match_probabilities, underdog_insight_generator

router = APIRouter()
logger = logging.getLogger(__name__)

# Curated analytics fallback for international teams. Used to source xG/possession
# metrics when the Supabase row is missing or was created with zero/placeholder
# values, so predictions stay meaningful for the frontend's team catalog.
INTERNATIONAL_TEAM_METRICS: dict[str, dict[str, Any]] = {
    "argentina": {"league": "International", "xg_avg": 2.05, "possession_avg": 60.2},
    "france": {"league": "International", "xg_avg": 1.98, "possession_avg": 55.6},
    "brazil": {"league": "International", "xg_avg": 1.92, "possession_avg": 58.1},
    "spain": {"league": "International", "xg_avg": 1.90, "possession_avg": 66.4},
    "england": {"league": "International", "xg_avg": 1.85, "possession_avg": 57.3},
    "germany": {"league": "International", "xg_avg": 1.96, "possession_avg": 59.8},
}


def _metrics_for(name: str) -> dict[str, Any] | None:
    return INTERNATIONAL_TEAM_METRICS.get(name.strip().lower())


def _needs_metrics(team: Team) -> bool:
    """True when a team row has no usable analytics signal (freshly created placeholder)."""
    return (team.xg_avg or 0) <= 0 or (team.possession_avg or 0) <= 0


def _apply_fallback_metrics(name: str, team: Team) -> Team:
    metrics = _metrics_for(name)
    if metrics and _needs_metrics(team):
        return team.model_copy(update=metrics)
    return team


def _validate_team(payload: dict[str, Any]) -> Team:
    return Team.model_validate(payload)


def _validate_match(payload: dict[str, Any]) -> Match:
    return Match.model_validate(payload)


def _validate_prediction(payload: dict[str, Any]) -> Prediction:
    return Prediction.model_validate(payload)


@router.get("/", response_model=list[Prediction], status_code=status.HTTP_200_OK)
async def get_all_predictions() -> list[Prediction]:
    """Fetch all predictions stored in Supabase."""
    try:
        response = supabase.table("predictions").select("*").order("match_id").execute()
        prediction_rows = cast(list[dict[str, Any]], response.data or [])
        return [_validate_prediction(row) for row in prediction_rows]
    except HTTPException:
        raise
    except Exception as exc:
        logger.error(f"Predictions Router Error: {exc}", exc_info=True)
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Database error: {str(exc)}",
        ) from exc


@router.get("/history", status_code=status.HTTP_200_OK)
async def get_prediction_history(
    current_user: dict[str, Any] = Depends(get_current_user),
) -> list[dict[str, Any]]:
    """Return all predictions created by the authenticated user, newest first.

    Each prediction record is enriched with its match and home/away team details.
    """
    try:
        user_id = current_user["id"]
        logger.info(f"Fetching prediction history for user_id: {user_id}")

        predictions_res = (
            supabase.table("predictions")
            .select("*")
            .eq("user_id", user_id)
            .order("created_at", desc=True)
            .execute()
        )
        prediction_rows = cast(list[dict[str, Any]], predictions_res.data or [])

        if not prediction_rows:
            return []

        match_ids = sorted({row["match_id"] for row in prediction_rows if row.get("match_id") is not None})
        matches_res = supabase.table("matches").select("*").in_("id", match_ids).execute()
        match_rows = cast(list[dict[str, Any]], matches_res.data or [])
        matches_by_id = {row["id"]: row for row in match_rows}

        team_ids = sorted(
            {
                team_id
                for row in match_rows
                for team_id in (row.get("home_team_id"), row.get("away_team_id"))
                if team_id is not None
            }
        )
        teams_res = supabase.table("teams").select("*").in_("id", team_ids).execute() if team_ids else None
        team_rows = cast(list[dict[str, Any]], (teams_res.data if teams_res else []) or [])
        teams_by_id = {row["id"]: row for row in team_rows}

        history: list[dict[str, Any]] = []
        for row in prediction_rows:
            match_data = matches_by_id.get(row.get("match_id")) or {}
            home_team = teams_by_id.get(match_data.get("home_team_id"))
            away_team = teams_by_id.get(match_data.get("away_team_id"))

            history.append(
                {
                    **row,
                    "match": match_data or None,
                    "home_team": home_team,
                    "away_team": away_team,
                }
            )

        logger.info(f"Returned {len(history)} prediction history records for user_id: {user_id}")
        return history
    except HTTPException:
        raise
    except Exception as exc:
        logger.error(f"Predictions Router Error: {exc}", exc_info=True)
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Database error: {str(exc)}",
        ) from exc


@router.post("/generate/{match_id}", response_model=Prediction, status_code=status.HTTP_201_CREATED)
async def generate_prediction(
    match_id: int,
    current_user: dict[str, Any] = Depends(get_current_user),
) -> Prediction:
    """Generate a prediction for a match and persist it to Supabase."""
    try:
        logger.info(f"Generating prediction for match_id: {match_id}")
        match_res = supabase.table("matches").select("*").eq("id", match_id).execute()

        if not match_res.data:
            raise HTTPException(status_code=404, detail=f"Match ID {match_id} not found in matches table.")

        match_rows = cast(list[dict[str, Any]], match_res.data)
        match_data = match_rows[0]
        match = _validate_match(match_data)

        home_team_res = supabase.table("teams").select("*").eq("id", match_data["home_team_id"]).execute()
        away_team_res = supabase.table("teams").select("*").eq("id", match_data["away_team_id"]).execute()

        home_team_data = cast(dict[str, Any] | None, (home_team_res.data or [None])[0])
        away_team_data = cast(dict[str, Any] | None, (away_team_res.data or [None])[0])

        if not home_team_data:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail=f"Home team with id {match.home_team_id} not found.",
            )

        if not away_team_data:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail=f"Away team with id {match.away_team_id} not found.",
            )

        home_team = _validate_team(home_team_data)
        away_team = _validate_team(away_team_data)

        probabilities = calculate_match_probabilities(home_team, away_team)
        insight = underdog_insight_generator(
            home_team,
            away_team,
            probabilities["home_win"],
            probabilities["away_win"],
        )

        payload = {
            "match_id": match.id,
            "user_id": current_user["id"],
            "win_prob_home": probabilities["home_win"],
            "win_prob_away": probabilities["away_win"],
            "draw_prob": probabilities["draw"],
            "underdog_insight": insight,
        }

        prediction_response = (
            supabase.table("predictions")
            .upsert(payload, on_conflict="match_id")
            .execute()
        )

        prediction_data = cast(dict[str, Any], (prediction_response.data or [payload])[0])
        logger.info(f"Prediction generated successfully for match_id: {match_id}")
        return _validate_prediction(prediction_data)
    except HTTPException:
        raise
    except Exception as exc:
        logger.error(f"Predictions Router Error: {exc}", exc_info=True)
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Database error: {str(exc)}",
        ) from exc


def _fetch_or_create_team(name: str) -> Team:
    """Return an existing team by name (case-insensitive), creating a minimal record if absent.

    This deliberately fetches first and inserts only when no row exists instead of
    relying on a database ``ON CONFLICT`` upsert. The live ``teams`` table may not
    yet carry the ``teams_name_unique`` constraint, which would otherwise trigger
    PostgreSQL error ``42P10`` during ``POST /predictions/compute``.

    When the team is one of the known international sides, its curated analytics
    metrics are persisted on creation so subsequent predictions are reproducible.
    """
    metrics = _metrics_for(name)
    existing = supabase.table("teams").select("*").ilike("name", name).execute()
    existing_rows = cast(list[dict[str, Any]], existing.data or [])

    if existing_rows:
        team = _validate_team(existing_rows[0])
        if metrics and _needs_metrics(team):
            # Self-heal rows previously created with placeholder (zero) metrics.
            supabase.table("teams").update(metrics).eq("id", team.id).execute()
            return team.model_copy(update=metrics)
        return team

    # No matching row -> insert a fresh one (no upsert, so no unique-constraint
    # dependency on teams.name). The live teams table enforces league NOT NULL,
    # so always supply a league value (curated metrics override it when present).
    create_payload: dict[str, Any] = {"name": name, "league": "International"}
    if metrics:
        create_payload.update(metrics)

    created = supabase.table("teams").insert(create_payload).execute()
    created_rows = cast(list[dict[str, Any]], created.data or [])

    if not created_rows:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Unable to resolve team '{name}'.",
        )

    return _validate_team(created_rows[0])


def _fetch_or_create_match(home_team_id: int, away_team_id: int) -> Match:
    """Return a scheduled match for the given pairing, creating one (auto id) if absent."""
    existing = (
        supabase.table("matches")
        .select("*")
        .eq("home_team_id", home_team_id)
        .eq("away_team_id", away_team_id)
        .eq("status", "scheduled")
        .order("id")
        .limit(1)
        .execute()
    )
    existing_rows = cast(list[dict[str, Any]], existing.data or [])

    if existing_rows:
        return _validate_match(existing_rows[0])

    created = (
        supabase.table("matches")
        .insert({"home_team_id": home_team_id, "away_team_id": away_team_id})
        .execute()
    )
    created_rows = cast(list[dict[str, Any]], created.data or [])

    if not created_rows:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="Unable to create match record for prediction.",
        )

    return _validate_match(created_rows[0])


@router.post("/compute", response_model=PredictionComputeResponse, status_code=status.HTTP_200_OK)
async def compute_prediction(
    request: PredictionComputeRequest,
    current_user: dict[str, Any] = Depends(get_current_user),
) -> PredictionComputeResponse:
    """Compute outcome probabilities for two teams by name WITHOUT persisting anything.

    Teams are looked up (or created) purely to source analytics metrics; no match or
    prediction row is written. Persistence happens only via the `/save` endpoint.
    """
    try:
        home_name = request.home_team.strip()
        away_name = request.away_team.strip()

        if home_name.lower() == away_name.lower():
            raise HTTPException(
                status_code=status.HTTP_422_UNPROCESSABLE_ENTITY,
                detail="Home and away teams must be different.",
            )

        home_team = _fetch_or_create_team(home_name)
        away_team = _fetch_or_create_team(away_name)

        probabilities = calculate_match_probabilities(home_team, away_team)
        insight = underdog_insight_generator(
            home_team,
            away_team,
            probabilities["home_win"],
            probabilities["away_win"],
        )

        return PredictionComputeResponse(
            home_team=home_team.name,
            away_team=away_team.name,
            win_prob_home=probabilities["home_win"],
            win_prob_away=probabilities["away_win"],
            draw_prob=probabilities["draw"],
            underdog_insight=insight,
        )
    except HTTPException:
        raise
    except Exception as exc:
        logger.error(f"Predictions Router Error: {exc}", exc_info=True)
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Database error: {str(exc)}",
        ) from exc


@router.post("/save", response_model=Prediction, status_code=status.HTTP_201_CREATED)
async def save_prediction(
    request: PredictionSaveRequest,
    current_user: dict[str, Any] = Depends(get_current_user),
) -> Prediction:
    """Persist a previously computed prediction for the authenticated user.

    The match_id is auto-generated: the scheduled match for the home/away pairing is
    looked up or created under the hood, so the client never supplies a manual match id.
    """
    try:
        home_name = request.home_team.strip()
        away_name = request.away_team.strip()

        if home_name.lower() == away_name.lower():
            raise HTTPException(
                status_code=status.HTTP_422_UNPROCESSABLE_ENTITY,
                detail="Home and away teams must be different.",
            )

        home_team = _fetch_or_create_team(home_name)
        away_team = _fetch_or_create_team(away_name)
        match = _fetch_or_create_match(home_team.id, away_team.id)

        payload = {
            "match_id": match.id,
            "user_id": current_user["id"],
            "win_prob_home": request.win_prob_home,
            "win_prob_away": request.win_prob_away,
            "draw_prob": request.draw_prob,
            "underdog_insight": request.underdog_insight,
        }

        prediction_response = (
            supabase.table("predictions")
            .upsert(payload, on_conflict="match_id")
            .execute()
        )

        prediction_data = cast(dict[str, Any], (prediction_response.data or [payload])[0])
        logger.info(f"Prediction saved for user {current_user['id']} on match_id: {match.id}")
        return _validate_prediction(prediction_data)
    except HTTPException:
        raise
    except Exception as exc:
        logger.error(f"Predictions Router Error: {exc}", exc_info=True)
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Database error: {str(exc)}",
        ) from exc
