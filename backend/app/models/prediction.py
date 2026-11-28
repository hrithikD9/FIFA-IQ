from pydantic import BaseModel, ConfigDict, Field, model_validator


class Prediction(BaseModel):
    model_config = ConfigDict(from_attributes=True, populate_by_name=True)

    match_id: int
    win_prob_home: float = Field(..., ge=0, le=1)
    win_prob_away: float = Field(..., ge=0, le=1)
    draw_prob: float = Field(..., ge=0, le=1)
    underdog_insight: str | None = None
    external_match_id: int | None = None
    model_version: str | None = None

    @model_validator(mode="after")
    def validate_probability_total(self) -> "Prediction":
        total = self.win_prob_home + self.win_prob_away + self.draw_prob

        if not 0.99 <= total <= 1.01:
            raise ValueError("Prediction probabilities must sum to approximately 1.0")

        return self


class PredictionComputeRequest(BaseModel):
    home_team: str = Field(..., min_length=1, max_length=80)
    away_team: str = Field(..., min_length=1, max_length=80)
    neutral: bool = False


class PredictionComputeResponse(BaseModel):
    home_team: str
    away_team: str
    win_prob_home: float
    win_prob_away: float
    draw_prob: float
    underdog_insight: str | None = None
    neutral: bool = False
    model: dict | None = None


class PredictionSaveRequest(BaseModel):
    """Save a prediction. Probabilities are recomputed on the server with the
    current model, so a client cannot store numbers the model never produced.
    The probability fields are accepted for backward compatibility and ignored."""

    home_team: str = Field(..., min_length=1, max_length=80)
    away_team: str = Field(..., min_length=1, max_length=80)
    neutral: bool = False
    # football-data.org match id when the prediction is for a real fixture; enables grading.
    external_match_id: int | None = Field(default=None, ge=1)
    win_prob_home: float | None = Field(default=None, ge=0, le=1)
    win_prob_away: float | None = Field(default=None, ge=0, le=1)
    draw_prob: float | None = Field(default=None, ge=0, le=1)
    underdog_insight: str | None = None
