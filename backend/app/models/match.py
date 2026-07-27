from datetime import datetime

from pydantic import BaseModel, ConfigDict, Field


class Match(BaseModel):
    model_config = ConfigDict(from_attributes=True, populate_by_name=True)

    id: int
    home_team_id: int
    away_team_id: int
    home_score: int | None = Field(default=None, ge=0)
    away_score: int | None = Field(default=None, ge=0)
    match_date: datetime
    status: str = Field(..., min_length=1)