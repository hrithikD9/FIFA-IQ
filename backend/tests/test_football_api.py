import pytest
from fastapi.testclient import TestClient

from app.core.security import get_current_user
from app.main import app
from app.services.api_cache import ApiCache
from app.services.football import FootballService, get_football_service
from app.services.providers import ProviderNotFound, ProviderRateLimited

BARCA = {"id": 81, "name": "FC Barcelona", "shortName": "Barça", "tla": "FCB", "crest": "https://crests/81.png"}
ALAVES = {"id": 263, "name": "Deportivo Alavés", "shortName": "Alavés", "tla": "ALA", "crest": "https://crests/263.png"}
LALIGA = {"id": 2014, "name": "Primera Division", "code": "PD", "type": "LEAGUE", "emblem": "https://e/pd.png"}
WORLD_CUP = {"id": 2000, "name": "FIFA World Cup", "code": "WC", "type": "CUP", "emblem": "https://e/wc.png"}


def fd_match(mid, home, away, status="FINISHED", score=(2, 1), comp=LALIGA, date="2026-10-31T20:00:00Z"):
    winner = None
    if status == "FINISHED":
        winner = "HOME_TEAM" if score[0] > score[1] else "AWAY_TEAM" if score[0] < score[1] else "DRAW"
    return {
        "id": mid,
        "utcDate": date,
        "status": status,
        "matchday": 11,
        "stage": "REGULAR_SEASON",
        "competition": comp,
        "homeTeam": home,
        "awayTeam": away,
        "venue": "Camp Nou",
        "score": {
            "winner": winner,
            "duration": "REGULAR",
            "fullTime": {"home": score[0] if winner else None, "away": score[1] if winner else None},
            "halfTime": {"home": 1, "away": 0},
        },
        "referees": [{"name": "Ref One", "type": "REFEREE"}],
    }


class FakeProvider:
    def __init__(self, name, responses):
        self.name = name
        self.responses = responses
        self.calls = []

    async def get(self, path, params=None):
        self.calls.append((path, params))
        value = self.responses.get(path)
        if isinstance(value, Exception):
            raise value
        if value is None:
            raise ProviderNotFound()
        return value

    async def aclose(self):
        pass


FD_RESPONSES = {
    "matches": {
        "matches": [
            fd_match(2, BARCA, ALAVES, "TIMED", date="2026-11-22T13:00:00Z"),
            fd_match(1, ALAVES, BARCA, "IN_PLAY", comp=WORLD_CUP, date="2026-11-21T13:00:00Z"),
        ]
    },
    "matches/564732": fd_match(564732, BARCA, ALAVES, score=(6, 1)),
    "matches/564732/head2head": {
        "aggregates": {"homeTeam": {"wins": 0}},  # free tier returns zeros
        "matches": [
            fd_match(10, BARCA, ALAVES, score=(3, 0), date="2025-01-10T20:00:00Z"),
            fd_match(11, ALAVES, BARCA, score=(1, 1), date="2025-09-10T20:00:00Z"),
            fd_match(12, ALAVES, BARCA, score=(2, 1), date="2024-03-10T20:00:00Z"),
            fd_match(564732, BARCA, ALAVES, score=(6, 1)),  # the match itself
            fd_match(13, ALAVES, BARCA, "TIMED", date="2027-04-01T20:00:00Z"),  # a later meeting
        ],
    },
    "teams/81": {
        **BARCA,
        "area": {"name": "Spain", "code": "ESP"},
        "venue": "Camp Nou",
        "founded": 1899,
        "coach": {"name": "Hansi Flick", "nationality": "Germany"},
        "runningCompetitions": [LALIGA],
        "squad": [
            {"id": 3548, "name": "Dominik Livaković", "position": "Goalkeeper", "dateOfBirth": "1995-01-09", "nationality": "Croatia"},
            {"id": 37428, "name": "Raphinha", "position": "Offence", "dateOfBirth": "1996-12-14", "nationality": "Brazil"},
        ],
    },
    "teams/81/matches": {
        "matches": [
            fd_match(20, BARCA, ALAVES, score=(2, 0), date="2026-10-01T20:00:00Z"),
            fd_match(21, ALAVES, BARCA, score=(1, 1), date="2026-10-08T20:00:00Z"),
            fd_match(22, ALAVES, BARCA, score=(2, 0), date="2026-10-15T20:00:00Z"),
            fd_match(30, BARCA, ALAVES, "SCHEDULED", date="2027-05-30T20:00:00Z"),
            fd_match(31, BARCA, ALAVES, "TIMED", date="2026-11-22T13:00:00Z"),
        ]
    },
    "persons/37428": {
        "id": 37428,
        "name": "Raphinha",
        "section": "Offence",
        "position": None,
        "dateOfBirth": "1996-12-14",
        "nationality": "Brazil",
        "shirtNumber": 11,
        "currentTeam": {**BARCA, "runningCompetitions": [LALIGA], "contract": {"start": "2022-07", "until": "2028-06"}},
    },
    "competitions/PD/scorers": {
        "competition": LALIGA,
        "scorers": [{"player": {"id": 37428, "name": "Raphinha"}, "team": BARCA, "playedMatches": 11, "goals": 15, "assists": 2, "penalties": 3}],
    },
}

TSDB_RESPONSES = {
    "searchplayers.php": {
        "player": [
            {"strPlayer": "Raphinha", "strSport": "Rugby", "strTeam": "Some Rugby Club", "strCutout": "https://rugby.png"},
            {"idPlayer": "34163304", "strPlayer": "Raphinha", "strSport": "Soccer", "strTeam": "Barcelona", "strNationality": "Brazil", "strCutout": "https://photo.png"},
        ]
    },
    "lookupplayer.php": {
        "players": [
            {"idPlayer": "34163304", "strPlayer": "Raphinha", "strHeight": "1.76 m (5 ft 9 1⁄2 in)", "strSide": "Left", "strBirthLocation": "Porto Alegre, Brazil"}
        ]
    },
}


@pytest.fixture
def fakes():
    fd = FakeProvider("football-data.org", dict(FD_RESPONSES))
    tsdb = FakeProvider("thesportsdb", dict(TSDB_RESPONSES))
    svc = FootballService(cache=ApiCache(), fd=fd, tsdb=tsdb)
    app.dependency_overrides[get_current_user] = lambda: {"id": "user-1", "app_metadata": {}}
    app.dependency_overrides[get_football_service] = lambda: svc
    yield fd, tsdb
    app.dependency_overrides.clear()


@pytest.fixture
def client(fakes):
    return TestClient(app)


def test_requires_authentication():
    app.dependency_overrides.clear()
    resp = TestClient(app).get("/api/v1/football/matches")
    assert resp.status_code == 401


def test_matches_are_normalized_and_sorted(client):
    resp = client.get("/api/v1/football/matches", params={"date_from": "2026-11-20", "date_to": "2026-11-25"})
    assert resp.status_code == 200
    matches = resp.json()["matches"]
    assert [m["id"] for m in matches] == [1, 2]
    live, upcoming = matches
    assert live["status"] == "live" and live["is_international"] is True
    assert upcoming["status"] == "scheduled" and upcoming["is_international"] is False
    assert upcoming["home_team"]["short_name"] == "Barça"
    assert upcoming["score"]["home"] is None


def test_matches_passes_filters_to_provider(client, fakes):
    fd, _ = fakes
    client.get("/api/v1/football/matches", params={"date_from": "2026-11-20", "date_to": "2026-11-22", "competitions": "PD,CL", "status": "finished"})
    path, params = fd.calls[-1]
    assert path == "matches"
    # provider's dateTo is exclusive, so the inclusive 22nd becomes 23rd
    assert params == {"dateFrom": "2026-11-20", "dateTo": "2026-11-23", "competitions": "PD,CL", "status": "FINISHED"}


@pytest.mark.parametrize(
    "params",
    [
        {"date_from": "2026-11-01", "date_to": "2026-11-11"},  # 11 days inclusive
        {"date_from": "2026-11-20", "date_to": "2026-11-19"},  # reversed
        {"competitions": "pd; drop"},
        {"status": "bogus"},
    ],
)
def test_matches_rejects_bad_input(client, params):
    assert client.get("/api/v1/football/matches", params=params).status_code == 422


def test_live_is_marked_delayed(client):
    body = client.get("/api/v1/football/matches/live").json()
    assert body["meta"]["delayed"] is True


def test_live_minute_passed_through_when_provided(client, fakes):
    fd, _ = fakes
    live = fd_match(5, BARCA, ALAVES, "IN_PLAY")
    fd.responses["matches"] = {"matches": [{**live, "minute": 67, "injuryTime": None}, fd_match(6, ALAVES, BARCA, "PAUSED")]}
    matches = client.get("/api/v1/football/matches/live").json()["matches"]
    assert [(m["status"], m["minute"]) for m in matches] == [("live", 67), ("halftime", None)]


def test_match_detail_computes_head_to_head(client):
    body = client.get("/api/v1/football/matches/564732").json()
    assert body["match"]["score"] == {
        "home": 6, "away": 1, "half_time": {"home": 1, "away": 0}, "winner": "home", "duration": "REGULAR",
    }
    assert body["match"]["referee"] == "Ref One"
    assert body["head_to_head"]["summary"] == {
        "matches": 3, "home_team_wins": 1, "away_team_wins": 1, "draws": 1, "total_goals": 8,
    }
    assert [m["id"] for m in body["head_to_head"]["matches"]] == [11, 10, 12]  # earlier only, newest first
    assert "lineups" in body["meta"]["unavailable"]


def test_match_detail_without_head_to_head(client, fakes):
    fd, _ = fakes
    fd.responses["matches/564732/head2head"] = ProviderRateLimited()
    body = client.get("/api/v1/football/matches/564732").json()
    assert body["match"]["id"] == 564732
    assert body["head_to_head"] is None


def test_team_detail_with_squad_groups(client):
    team = client.get("/api/v1/football/teams/81").json()["team"]
    assert team["name"] == "FC Barcelona" and team["is_featured"] is True
    assert team["coach"]["name"] == "Hansi Flick"
    assert [p["position_group"] for p in team["squad"]] == ["GK", "ATT"]
    assert team["squad"][0]["age"] is not None


def test_team_results_include_form(client):
    body = client.get("/api/v1/football/teams/81/matches", params={"status": "finished"}).json()
    assert [m["id"] for m in body["matches"]] == [22, 21, 20]
    assert body["form"] == ["L", "D", "W"]  # Alavés 2-0 away loss, 1-1, 2-0 home win


def test_team_fixtures_and_results_share_one_cached_call(client, fakes):
    fd, _ = fakes
    fixtures = client.get("/api/v1/football/teams/81/matches", params={"status": "scheduled", "limit": 1}).json()
    results = client.get("/api/v1/football/teams/81/matches", params={"status": "finished", "limit": 2}).json()
    assert [m["id"] for m in fixtures["matches"]] == [31]  # nearest upcoming, not end of season
    assert fixtures["form"] is None
    assert [m["id"] for m in results["matches"]] == [22, 21]
    assert sum(1 for path, _ in fd.calls if path == "teams/81/matches") == 1


def test_player_detail_enriched_with_soccer_profile_and_stats(client):
    body = client.get("/api/v1/football/players/37428").json()
    player = body["player"]
    assert player["profile"]["photo_url"] == "https://photo.png"  # not the rugby player
    # detail lookup fills fields the search summary lacks
    assert player["profile"]["height"] == "1.76 m (5 ft 9 1⁄2 in)"
    assert player["profile"]["preferred_foot"] == "Left"
    assert player["position_group"] == "ATT"
    assert player["contract"] == {"start": "2022-07", "until": "2028-06"}
    assert body["season_stats"][0]["goals"] == 15
    assert body["season_stats"][0]["competition"]["code"] == "PD"


def test_player_detail_survives_enrichment_failure(client, fakes):
    _, tsdb = fakes
    tsdb.responses["searchplayers.php"] = ProviderRateLimited()
    body = client.get("/api/v1/football/players/37428").json()
    assert body["player"]["profile"] is None
    assert body["player"]["name"] == "Raphinha"


def test_player_profile_falls_back_to_search_summary(client, fakes):
    _, tsdb = fakes
    tsdb.responses["lookupplayer.php"] = ProviderRateLimited()
    profile = client.get("/api/v1/football/players/37428").json()["player"]["profile"]
    assert profile["photo_url"] == "https://photo.png"
    assert profile["height"] is None


def test_provider_errors_map_to_generic_messages(client, fakes):
    fd, _ = fakes
    fd.responses["teams/81"] = ProviderRateLimited()
    resp = client.get("/api/v1/football/teams/81")
    assert resp.status_code == 503
    assert "rate limit" in resp.json()["detail"]


def test_unknown_team_is_404(client):
    assert client.get("/api/v1/football/teams/999").status_code == 404


def test_responses_are_cached(client, fakes):
    fd, _ = fakes
    client.get("/api/v1/football/teams/81")
    client.get("/api/v1/football/teams/81")
    assert sum(1 for path, _ in fd.calls if path == "teams/81") == 1
