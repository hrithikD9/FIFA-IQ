from __future__ import annotations

import logging
from typing import Any, cast

from fastapi import APIRouter, Depends, HTTPException, status

from app.core.security import get_current_user
from app.database import supabase
from app.models.match import Match
from app.models.prediction import Prediction
from app.models.team import Team
from app.services.analytics import calculate_match_probabilities, underdog_insight_generator

router = APIRouter()
logger = logging.getLogger(__name__)


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
