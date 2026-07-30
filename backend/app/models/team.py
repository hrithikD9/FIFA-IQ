from pydantic import BaseModel, ConfigDict, Field


class Team(BaseModel):
    model_config = ConfigDict(from_attributes=True, populate_by_name=True)

    id: int
    name: str = Field(..., min_length=1)
    league: str | None = None
    flag_url: str | None = None
    logo_url: str | None = None
    xg_avg: float | None = Field(default=None, ge=0)
    possession_avg: float | None = Field(default=None, ge=0, le=100)