from datetime import date, datetime, timedelta, timezone
from types import SimpleNamespace

import pytest
from fastapi.testclient import TestClient

from app.core.security import get_current_user
from app.main import app
from app.routers import admin as admin_router
from app.services.admin_stats import build_overview, daily_counts, user_row

NOW = datetime(2026, 11, 28, 12, 0, tzinfo=timezone.utc)


def iso(days_ago: float) -> str:
    return (NOW - timedelta(days=days_ago)).isoformat()


USERS = [
    {"id": "u1", "email": "admin@x.io", "created_at": iso(60), "last_sign_in_at": iso(0.5),
     "user_metadata": {"full_name": "Ada Admin"}, "app_metadata": {"role": "admin", "provider": "email"}},
    {"id": "u2", "email": "fan@x.io", "created_at": iso(3), "last_sign_in_at": iso(2),
     "user_metadata": {"full_name": "Fan One"}, "app_metadata": {"provider": "google"}},
    {"id": "u3", "email": "old@x.io", "created_at": iso(30), "last_sign_in_at": iso(20),
     "user_metadata": {}, "app_metadata": {}},
]

PREDICTIONS = [
    {"id": 1, "user_id": "u2", "match_id": 10, "win_prob_home": 0.5, "win_prob_away": 0.3, "draw_prob": 0.2, "created_at": iso(0.1)},
    {"id": 2, "user_id": "u2", "match_id": 11, "win_prob_home": 0.4, "win_prob_away": 0.4, "draw_prob": 0.2, "created_at": iso(1.2)},
    {"id": 3, "user_id": "u3", "match_id": 10, "win_prob_home": 0.6, "win_prob_away": 0.2, "draw_prob": 0.2, "created_at": iso(25)},
]


# ---------------------------------------------------------------------------
# Pure helpers
# ---------------------------------------------------------------------------
def test_build_overview_counts():
    o = build_overview(USERS, PREDICTIONS, NOW)
    assert o["users"] == {"total": 3, "new_7d": 1, "active_7d": 2, "admins": 1}
    assert o["predictions"]["total"] == 3
    assert o["predictions"]["last_7d"] == 2
    assert o["predictions"]["predictors_7d"] == 1
    daily = o["predictions"]["daily"]
    assert len(daily) == 14 and daily[-1] == {"date": "2026-11-28", "count": 1}
    assert daily[-2]["count"] == 1 and sum(d["count"] for d in daily) == 2  # 25-day-old one is outside


def test_daily_counts_zero_fills_oldest_first():
    out = daily_counts([NOW], 3, date(2026, 11, 28))
    assert out == [
        {"date": "2026-11-26", "count": 0},
        {"date": "2026-11-27", "count": 0},
        {"date": "2026-11-28", "count": 1},
    ]


def test_user_row_shape():
    row = user_row(USERS[0], 4)
    assert row["is_admin"] is True and row["full_name"] == "Ada Admin" and row["prediction_count"] == 4
    assert user_row(USERS[2], 0)["full_name"] is None


# ---------------------------------------------------------------------------
# Endpoints with a fake Supabase
# ---------------------------------------------------------------------------
class FakeQuery:
    def __init__(self, rows):
        self.rows = rows

    def select(self, *_):
        return self

    def order(self, *_, **__):
        return self

    def limit(self, n):
        self.rows = self.rows[:n]
        return self

    def in_(self, column, values):
        self.rows = [r for r in self.rows if r.get(column) in values]
        return self

    def execute(self):
        return SimpleNamespace(data=list(self.rows))


class FakeSupabase:
    def __init__(self):
        tables = {
            "predictions": PREDICTIONS,
            "matches": [{"id": 10, "home_team_id": 1, "away_team_id": 2}, {"id": 11, "home_team_id": 3, "away_team_id": 1}],
            "teams": [{"id": 1, "name": "Argentina"}, {"id": 2, "name": "France"}, {"id": 3, "name": "Spain"}],
        }
        self.table = lambda name: FakeQuery(tables[name])
        self.auth = SimpleNamespace(admin=SimpleNamespace(list_users=lambda page, per_page: USERS if page == 1 else []))


@pytest.fixture
def admin_client(monkeypatch):
    monkeypatch.setattr(admin_router, "supabase", FakeSupabase())
    app.dependency_overrides[get_current_user] = lambda: {"id": "u1", "app_metadata": {"role": "admin"}}
    yield TestClient(app)
    app.dependency_overrides.clear()


def test_overview_endpoint(admin_client):
    body = admin_client.get("/api/v1/admin/overview").json()
    assert body["users"]["total"] == 3
    recent = body["recent_predictions"]
    assert recent[0]["home_team"] == "Argentina" and recent[0]["away_team"] == "France"
    assert recent[0]["user_email"] == "fan@x.io" and recent[0]["user_name"] == "Fan One"
    assert recent[1]["home_team"] == "Spain"


def test_users_endpoint_counts_predictions(admin_client):
    body = admin_client.get("/api/v1/admin/users").json()
    assert body["total"] == 3
    counts = {u["email"]: u["prediction_count"] for u in body["users"]}
    assert counts == {"admin@x.io": 0, "fan@x.io": 2, "old@x.io": 1}
    assert body["users"][0]["email"] == "fan@x.io"  # newest account first


def test_admin_endpoints_reject_non_admins(monkeypatch):
    monkeypatch.setattr(admin_router, "supabase", FakeSupabase())
    app.dependency_overrides[get_current_user] = lambda: {"id": "u2", "app_metadata": {}}
    try:
        client = TestClient(app)
        assert client.get("/api/v1/admin/overview").status_code == 403
        assert client.get("/api/v1/admin/users").status_code == 403
    finally:
        app.dependency_overrides.clear()


def test_overview_hides_database_errors(admin_client, monkeypatch):
    def boom(*_, **__):
        raise RuntimeError("connection string with secrets")

    monkeypatch.setattr(admin_router, "_list_all_users", boom)
    resp = admin_client.get("/api/v1/admin/overview")
    assert resp.status_code == 500
    assert "secrets" not in resp.text
