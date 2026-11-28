"""Match outcome predictor behind a stable interface.

Everything that needs a prediction (the /predictions endpoints, grading, the
model check) goes through `get_predictor()`. The current implementation is the
baseline rating formula in `analytics.py`; the deep-learning model will replace
it by providing the same methods, without changes to callers.
"""

from __future__ import annotations

from dataclasses import asdict, dataclass
from typing import Any, Protocol

from app.models.team import Team
from app.services.analytics import calculate_match_probabilities, underdog_insight_generator


@dataclass(frozen=True)
class ModelInfo:
    name: str
    version: str
    kind: str  # "baseline" | "deep-learning"
    description: str


class Predictor(Protocol):
    info: ModelInfo

    def supports(self, team: str) -> bool: ...

    def supported_teams(self) -> list[str]: ...

    def predict(self, home: str, away: str, neutral: bool = False) -> dict[str, Any]: ...


def _key(name: str) -> str:
    return name.strip().lower()


# Curated per-team ratings for the baseline formula (xG and possession averages).
BASELINE_TEAM_METRICS: dict[str, dict[str, Any]] = {
    "argentina": {"name": "Argentina", "xg_avg": 2.05, "possession_avg": 60.2},
    "france": {"name": "France", "xg_avg": 1.98, "possession_avg": 55.6},
    "brazil": {"name": "Brazil", "xg_avg": 1.92, "possession_avg": 58.1},
    "spain": {"name": "Spain", "xg_avg": 1.90, "possession_avg": 66.4},
    "england": {"name": "England", "xg_avg": 1.85, "possession_avg": 57.3},
    "germany": {"name": "Germany", "xg_avg": 1.96, "possession_avg": 59.8},
}

HOME_ADVANTAGE = 1.08


class BaselinePredictor:
    info = ModelInfo(
        name="Baseline rating formula",
        version="baseline-0.1",
        kind="baseline",
        description=(
            "Deterministic formula from each team's average xG and possession, with a home-advantage "
            "factor. A placeholder until the deep-learning model is trained."
        ),
    )

    def supports(self, team: str) -> bool:
        return _key(team) in BASELINE_TEAM_METRICS

    def supported_teams(self) -> list[str]:
        return sorted(m["name"] for m in BASELINE_TEAM_METRICS.values())

    def canonical_name(self, team: str) -> str:
        return BASELINE_TEAM_METRICS[_key(team)]["name"]

    def _team(self, name: str, idx: int) -> Team:
        m = BASELINE_TEAM_METRICS[_key(name)]
        return Team(id=idx, name=m["name"], league="International", xg_avg=m["xg_avg"], possession_avg=m["possession_avg"])

    def predict(self, home: str, away: str, neutral: bool = False) -> dict[str, Any]:
        if not (self.supports(home) and self.supports(away)):
            raise UnsupportedTeamError([t for t in (home, away) if not self.supports(t)])
        home_team, away_team = self._team(home, 1), self._team(away, 2)
        probs = calculate_match_probabilities(home_team, away_team, home_advantage=1.0 if neutral else HOME_ADVANTAGE)
        return {
            "home_team": home_team.name,
            "away_team": away_team.name,
            "home_win": probs["home_win"],
            "draw": probs["draw"],
            "away_win": probs["away_win"],
            "insight": underdog_insight_generator(home_team, away_team, probs["home_win"], probs["away_win"]),
            "neutral": neutral,
            "model": asdict(self.info),
        }


class UnsupportedTeamError(ValueError):
    def __init__(self, teams: list[str]):
        self.teams = teams
        super().__init__(f"Not supported by the current model: {', '.join(teams)}")


_predictor: Predictor | None = None


def get_predictor() -> Predictor:
    global _predictor
    if _predictor is None:
        _predictor = BaselinePredictor()
    return _predictor
