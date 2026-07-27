from pydantic import BaseModel, ConfigDict, Field, model_validator


class Prediction(BaseModel):
    model_config = ConfigDict(from_attributes=True, populate_by_name=True)

    match_id: int
    win_prob_home: float = Field(..., ge=0, le=1)
    win_prob_away: float = Field(..., ge=0, le=1)
    draw_prob: float = Field(..., ge=0, le=1)
    underdog_insight: str | None = None

    @model_validator(mode="after")
    def validate_probability_total(self) -> "Prediction":
        total = self.win_prob_home + self.win_prob_away + self.draw_prob

        if not 0.99 <= total <= 1.01:
            raise ValueError("Prediction probabilities must sum to approximately 1.0")

        return self