import pytest
from fastapi.testclient import TestClient

from app.core.security import get_current_user
from app.main import app
from app.routers import predictions as predictions_router
from app.services.grading import UNIFORM_BRIER, brier, grade, predicted_outcome, summarize
from app.services.predictor import BaselinePredictor, UnsupportedTeamError
from app.services.providers import ProviderRateLimited

FINISHED_HOME_WIN = {"status": "finished", "score": {"home": 1, "away": 0, "winner": "home"}}


# ---------------------------------------------------------------------------
# Grading
# ---------------------------------------------------------------------------
def test_brier_bounds():
    assert brier(1, 0, 0, "home") == 0
    assert brier(0, 0, 1, "home") == 2
    assert brier(1 / 3, 1 / 3, 1 / 3, "draw") == pytest.approx(UNIFORM_BRIER, abs=1e-3)


def test_grade_finished_match():
    g = grade(0.5, 0.3, 0.2, FINISHED_HOME_WIN)
    assert g["status"] == "graded" and g["correct"] is True and g["predicted"] == "home"
    assert g["brier"] == pytest.approx(0.25 + 0.09 + 0.04)
    wrong = grade(0.2, 0.3, 0.5, FINISHED_HOME_WIN)
    assert wrong["correct"] is False and wrong["predicted"] == "away"


@pytest.mark.parametrize(
    "match,expected",
    [
        (None, "unknown"),
        ({"status": "scheduled", "utc_date": "2027-01-01T00:00:00Z", "score": {}}, "pending"),
        ({"status": "live", "score": {"winner": None}}, "pending"),
        ({"status": "postponed", "score": {}}, "void"),
    ],
)
def test_grade_states(match, expected):
    assert grade(0.4, 0.3, 0.3, match)["status"] == expected


def test_summarize():
    grades = [grade(0.5, 0.3, 0.2, FINISHED_HOME_WIN), grade(0.2, 0.3, 0.5, FINISHED_HOME_WIN), {"status": "pending"}]
    s = summarize(grades)
    assert s["graded"] == 2 and s["correct"] == 1 and s["accuracy"] == 0.5 and s["pending"] == 1
    assert summarize([])["accuracy"] is None


def test_predicted_outcome_ties_prefer_home_then_draw():
    assert predicted_outcome(0.4, 0.4, 0.2) == "home"


# ---------------------------------------------------------------------------
# Predictor
# ---------------------------------------------------------------------------
def test_predictor_sums_to_one_and_neutral_removes_home_edge():
    p = BaselinePredictor()
    home = p.predict("Spain", "Argentina")
    neutral = p.predict("spain", "ARGENTINA", neutral=True)
    for r in (home, neutral):
        assert r["home_win"] + r["draw"] + r["away_win"] == pytest.approx(1, abs=1e-3)
    assert home["home_win"] > neutral["home_win"]
    assert neutral["home_team"] == "Spain" and neutral["model"]["kind"] == "baseline"


def test_predictor_rejects_unknown_team():
    with pytest.raises(UnsupportedTeamError) as exc:
        BaselinePredictor().predict("Spain", "Atlantis")
    assert exc.value.teams == ["Atlantis"]


# ---------------------------------------------------------------------------
# Endpoints
# ---------------------------------------------------------------------------
@pytest.fixture
def client():
    app.dependency_overrides[get_current_user] = lambda: {"id": "u1", "app_metadata": {}}
    yield TestClient(app)
    app.dependency_overrides.clear()


def test_compute_uses_predictor_and_writes_nothing(client, monkeypatch):
    def no_db(*_, **__):
        raise AssertionError("compute must not touch the database")

    monkeypatch.setattr(predictions_router, "_fetch_or_create_team", no_db)
    body = client.post("/api/v1/predictions/compute", json={"home_team": "France", "away_team": "Spain", "neutral": True}).json()
    assert body["home_team"] == "France" and body["neutral"] is True
    assert body["model"]["version"] == "baseline-0.1"


def test_compute_rejects_unsupported_and_same_team(client):
    r = client.post("/api/v1/predictions/compute", json={"home_team": "Spain", "away_team": "Atlantis"})
    assert r.status_code == 422 and "Atlantis" in r.json()["detail"]
    assert client.post("/api/v1/predictions/compute", json={"home_team": "Spain", "away_team": "spain"}).status_code == 422


def test_model_endpoint_lists_teams_with_flags(client, monkeypatch):
    class Directory:
        async def national_teams(self):
            return {"argentina": {"name": "Argentina", "tla": "ARG", "crest": "https://crests/762.png"}}

    monkeypatch.setattr(predictions_router, "get_football_service", lambda: Directory())
    body = client.get("/api/v1/predictions/model").json()
    assert "Argentina" in body["teams"] and body["model"]["kind"] == "baseline"
    assert body["team_info"]["Argentina"] == {"tla": "ARG", "crest": "https://crests/762.png"}
    assert "Spain" not in body["team_info"]  # not in the directory -> no flag, initials fallback


def test_model_endpoint_survives_directory_failure(client, monkeypatch):
    class Down:
        async def national_teams(self):
            raise ProviderRateLimited()

    monkeypatch.setattr(predictions_router, "get_football_service", lambda: Down())
    body = client.get("/api/v1/predictions/model").json()
    assert body["team_info"] == {} and len(body["teams"]) == 6


class FakeFootball:
    def __init__(self, matches):
        self.matches = matches

    async def competition_matches(self, code):
        return self.matches


def _m(mid, home, away, h, a):
    winner = "home" if h > a else "away" if a > h else "draw"
    return {
        "id": mid,
        "status": "finished",
        "utc_date": "2026-07-19T19:00:00Z",
        "competition": {"code": "WC", "name": "FIFA World Cup"},
        "home_team": {"name": home},
        "away_team": {"name": away},
        "score": {"home": h, "away": a, "winner": winner},
    }


def test_model_check_grades_supported_matches_only(client, monkeypatch):
    matches = [_m(1, "Spain", "Argentina", 1, 0), _m(2, "Spain", "Morocco", 2, 0), _m(3, "France", "England", 4, 6)]
    monkeypatch.setattr(predictions_router, "get_football_service", lambda: FakeFootball(matches))
    body = client.get("/api/v1/predictions/model-check").json()
    assert body["coverage"] == {"evaluated": 2, "finished": 3}  # Morocco not supported by the baseline
    assert body["summary"]["graded"] == 2
    assert {e["match"]["id"] for e in body["matches"]} == {1, 3}
    assert all(e["grade"]["status"] == "graded" for e in body["matches"])
