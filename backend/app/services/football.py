"""Football data service: cached provider calls + normalization.

Raw provider responses are cached; normalization happens on read, so changing
the output shape never requires invalidating the cache. The frontend only sees
the normalized shapes below and never talks to a provider directly.
"""

from __future__ import annotations

import asyncio
import logging
import os
import unicodedata
from datetime import date, datetime, timedelta, timezone
from typing import Any

from app.services.api_cache import ApiCache, CacheResult, ttl_seconds
from app.services.providers import (
    FootballDataProvider,
    ProviderError,
    TheSportsDbProvider,
)

logger = logging.getLogger(__name__)

# Competitions available on the football-data.org free tier.
INTERNATIONAL_COMPETITIONS = {"WC", "EC"}
FEATURED_TEAM_ID = int(os.getenv("FEATURED_TEAM_ID", "81"))  # FC Barcelona

STATUS_MAP = {
    "SCHEDULED": "scheduled",
    "TIMED": "scheduled",
    "IN_PLAY": "live",
    "PAUSED": "halftime",
    "EXTRA_TIME": "live",
    "PENALTY_SHOOTOUT": "live",
    "FINISHED": "finished",
    "AWARDED": "finished",
    "POSTPONED": "postponed",
    "SUSPENDED": "suspended",
    "CANCELLED": "cancelled",
}

# Provider-side filters. football-data.org only accepts: TIMED, SCHEDULED, LIVE,
# IN_PLAY, PAUSED, FINISHED, POSTPONED, SUSPENDED, CANCELLED.
STATUS_FILTERS = {
    "scheduled": "SCHEDULED,TIMED",
    "live": "IN_PLAY,PAUSED",
    "finished": "FINISHED",
    "postponed": "POSTPONED,SUSPENDED,CANCELLED",
}

# Local filters over normalized statuses (see STATUS_MAP).
_STATUS_GROUPS = {
    "scheduled": {"scheduled"},
    "live": {"live", "halftime"},
    "finished": {"finished"},
    "postponed": {"postponed", "suspended", "cancelled"},
}

POSITION_GROUPS = {
    "goalkeeper": "GK",
    "defence": "DEF",
    "defender": "DEF",
    "back": "DEF",
    "midfield": "MID",
    "midfielder": "MID",
    "offence": "ATT",
    "forward": "ATT",
    "winger": "ATT",
    "striker": "ATT",
}


# ---------------------------------------------------------------------------
# Normalizers
# ---------------------------------------------------------------------------
def _team_ref(team: dict[str, Any] | None) -> dict[str, Any] | None:
    if not team or team.get("id") is None:
        return None
    return {
        "id": team.get("id"),
        "name": team.get("name"),
        "short_name": team.get("shortName") or team.get("name"),
        "tla": team.get("tla"),
        "crest": team.get("crest"),
    }


def _competition_ref(comp: dict[str, Any] | None) -> dict[str, Any] | None:
    if not comp:
        return None
    code = comp.get("code")
    return {
        "id": comp.get("id"),
        "code": code,
        "name": comp.get("name"),
        "type": comp.get("type"),
        "emblem": comp.get("emblem"),
        "is_international": code in INTERNATIONAL_COMPETITIONS,
    }


def normalize_match(m: dict[str, Any]) -> dict[str, Any]:
    score = m.get("score") or {}
    full = score.get("fullTime") or {}
    half = score.get("halfTime") or {}
    referee = next(
        (r.get("name") for r in m.get("referees") or [] if r.get("type") == "REFEREE"),
        None,
    )
    competition = _competition_ref(m.get("competition"))
    return {
        "id": m.get("id"),
        "utc_date": m.get("utcDate"),
        "status": STATUS_MAP.get(m.get("status", ""), "scheduled"),
        "status_raw": m.get("status"),
        "matchday": m.get("matchday"),
        "stage": m.get("stage"),
        "group": m.get("group"),
        "venue": m.get("venue"),
        "competition": competition,
        "is_international": bool(competition and competition["is_international"]),
        "home_team": _team_ref(m.get("homeTeam")),
        "away_team": _team_ref(m.get("awayTeam")),
        "score": {
            "home": full.get("home"),
            "away": full.get("away"),
            "half_time": {"home": half.get("home"), "away": half.get("away")},
            "winner": {"HOME_TEAM": "home", "AWAY_TEAM": "away", "DRAW": "draw"}.get(score.get("winner") or ""),
            "duration": score.get("duration"),
        },
        "referee": referee,
        "last_updated": m.get("lastUpdated"),
    }


def position_group(position: str | None, section: str | None = None) -> str | None:
    for raw in (position, section):
        if not raw:
            continue
        lowered = raw.lower()
        for needle, group in POSITION_GROUPS.items():
            if needle in lowered:
                return group
    return None


def _age(dob: str | None) -> int | None:
    if not dob:
        return None
    try:
        born = date.fromisoformat(dob[:10])
    except ValueError:
        return None
    today = datetime.now(timezone.utc).date()
    return today.year - born.year - ((today.month, today.day) < (born.month, born.day))


def normalize_name(name: str | None) -> str:
    if not name:
        return ""
    decomposed = unicodedata.normalize("NFKD", name)
    return "".join(c for c in decomposed if not unicodedata.combining(c)).lower().strip()


def normalize_player_ref(p: dict[str, Any]) -> dict[str, Any]:
    return {
        "id": p.get("id"),
        "name": p.get("name"),
        "position": p.get("position") or p.get("section"),
        "position_group": position_group(p.get("position"), p.get("section")),
        "nationality": p.get("nationality"),
        "date_of_birth": p.get("dateOfBirth"),
        "age": _age(p.get("dateOfBirth")),
        "shirt_number": p.get("shirtNumber"),
    }


def normalize_team(t: dict[str, Any]) -> dict[str, Any]:
    area = t.get("area") or {}
    coach = t.get("coach") or {}
    competitions = [_competition_ref(c) for c in t.get("runningCompetitions") or []]
    return {
        **(_team_ref(t) or {}),
        "venue": t.get("venue"),
        "founded": t.get("founded"),
        "club_colors": t.get("clubColors"),
        "website": t.get("website"),
        "address": t.get("address"),
        "area": {"name": area.get("name"), "code": area.get("code"), "flag": area.get("flag")},
        "coach": {"name": coach.get("name"), "nationality": coach.get("nationality")} if coach.get("name") else None,
        "competitions": [c for c in competitions if c],
        # football-data.org national teams sit in an area of the same name (e.g. "Spain").
        "is_national_team": bool(t.get("name")) and area.get("name") == t.get("name"),
        "squad": [normalize_player_ref(p) for p in t.get("squad") or []],
    }


def normalize_standings(payload: dict[str, Any]) -> dict[str, Any]:
    tables = []
    for block in payload.get("standings") or []:
        tables.append(
            {
                "type": block.get("type"),
                "stage": block.get("stage"),
                "group": block.get("group"),
                "rows": [
                    {
                        "position": r.get("position"),
                        "team": _team_ref(r.get("team")),
                        "played": r.get("playedGames"),
                        "won": r.get("won"),
                        "draw": r.get("draw"),
                        "lost": r.get("lost"),
                        "points": r.get("points"),
                        "goals_for": r.get("goalsFor"),
                        "goals_against": r.get("goalsAgainst"),
                        "goal_difference": r.get("goalDifference"),
                        "form": r.get("form"),
                    }
                    for r in block.get("table") or []
                ],
            }
        )
    season = payload.get("season") or {}
    return {
        "competition": _competition_ref(payload.get("competition")),
        "season": {
            "start_date": season.get("startDate"),
            "end_date": season.get("endDate"),
            "current_matchday": season.get("currentMatchday"),
        },
        "tables": tables,
    }


def normalize_scorer(s: dict[str, Any]) -> dict[str, Any]:
    return {
        "player": normalize_player_ref(s.get("player") or {}),
        "team": _team_ref(s.get("team")),
        "played": s.get("playedMatches"),
        "goals": s.get("goals") or 0,
        "assists": s.get("assists") or 0,
        "penalties": s.get("penalties") or 0,
    }


def team_form(matches: list[dict[str, Any]], team_id: int) -> list[str]:
    """W/D/L for the given team from normalized finished matches, most recent first."""
    form = []
    for m in matches:
        winner = m["score"]["winner"]
        if m["status"] != "finished" or winner is None:
            continue
        if winner == "draw":
            form.append("D")
            continue
        home = (m.get("home_team") or {}).get("id") == team_id
        form.append("W" if (winner == "home") == home else "L")
    return form


def head_to_head_summary(matches: list[dict[str, Any]], home_id: int, away_id: int) -> dict[str, Any]:
    """Compute H2H totals ourselves; the free tier returns zeroed aggregates."""
    wins = {home_id: 0, away_id: 0}
    draws = goals = 0
    for m in matches:
        if m["status"] != "finished":
            continue
        s = m["score"]
        goals += (s["home"] or 0) + (s["away"] or 0)
        if s["winner"] == "draw":
            draws += 1
        elif s["winner"] in ("home", "away"):
            winner_team = m["home_team"] if s["winner"] == "home" else m["away_team"]
            if winner_team and winner_team["id"] in wins:
                wins[winner_team["id"]] += 1
    return {
        "matches": len(matches),
        "home_team_wins": wins[home_id],
        "away_team_wins": wins[away_id],
        "draws": draws,
        "total_goals": goals,
    }


def _pick_tsdb_player(candidates: list[dict[str, Any]], name: str, team_name: str | None, nationality: str | None) -> dict[str, Any] | None:
    soccer = [p for p in candidates if (p.get("strSport") or "Soccer") == "Soccer"]
    target = normalize_name(name)
    exact = [p for p in soccer if normalize_name(p.get("strPlayer")) == target] or soccer
    if not exact:
        return None

    def score(p: dict[str, Any]) -> int:
        s = 0
        team = normalize_name(p.get("strTeam"))
        if team_name and team and (team in normalize_name(team_name) or normalize_name(team_name) in team):
            s += 2
        if nationality and normalize_name(p.get("strNationality")) == normalize_name(nationality):
            s += 1
        return s

    best = max(exact, key=score)
    # Require some corroboration when the name was not an exact match.
    if normalize_name(best.get("strPlayer")) != target and score(best) == 0:
        return None
    return best


def normalize_tsdb_player(p: dict[str, Any] | None) -> dict[str, Any] | None:
    if not p:
        return None
    description = (p.get("strDescriptionEN") or "").strip()
    return {
        "photo_url": p.get("strCutout") or p.get("strThumb") or p.get("strRender"),
        "height": p.get("strHeight") or None,
        "weight": p.get("strWeight") or None,
        "preferred_foot": p.get("strSide") or None,
        "birth_place": p.get("strBirthLocation") or None,
        "detailed_position": p.get("strPosition") or None,
        "description": (description[:600] + "…") if len(description) > 600 else (description or None),
    }


# ---------------------------------------------------------------------------
# Service
# ---------------------------------------------------------------------------
def _match_list_ttl(payload: dict[str, Any]) -> int:
    statuses = {m.get("status") for m in payload.get("matches") or []}
    if statuses & {"IN_PLAY", "PAUSED", "EXTRA_TIME", "PENALTY_SHOOTOUT"}:
        return 60
    return ttl_seconds(minutes=5)


def _match_detail_ttl(payload: dict[str, Any]) -> int:
    if payload.get("status") in ("FINISHED", "AWARDED"):
        return ttl_seconds(days=7)
    if payload.get("status") in ("IN_PLAY", "PAUSED", "EXTRA_TIME", "PENALTY_SHOOTOUT"):
        return 60
    return ttl_seconds(minutes=10)


class FootballService:
    def __init__(self, cache: ApiCache, fd: FootballDataProvider, tsdb: TheSportsDbProvider) -> None:
        self.cache = cache
        self.fd = fd
        self.tsdb = tsdb

    async def _fd(self, path: str, ttl: Any, params: dict[str, Any] | None = None) -> CacheResult:
        query = "&".join(f"{k}={v}" for k, v in sorted((params or {}).items()) if v is not None)
        key = f"fd:{path}?{query}"
        return await self.cache.get_or_fetch(key, self.fd.name, ttl, lambda: self.fd.get(path, params))

    async def _tsdb(self, path: str, params: dict[str, Any]) -> CacheResult:
        query = "&".join(f"{k}={v}" for k, v in sorted(params.items()))
        key = f"tsdb:{path}?{query}"
        return await self.cache.get_or_fetch(key, self.tsdb.name, ttl_seconds(days=7), lambda: self.tsdb.get(path, params))

    @staticmethod
    def _meta(*results: CacheResult) -> dict[str, Any]:
        oldest = min(r.fetched_at for r in results)
        return {
            "fetched_at": datetime.fromtimestamp(oldest, tz=timezone.utc).isoformat(),
            "stale": any(r.stale for r in results),
            "source": "football-data.org",
        }

    # -- competitions -------------------------------------------------------
    async def competitions(self) -> dict[str, Any]:
        res = await self._fd("competitions", ttl_seconds(hours=24))
        comps = []
        for c in res.payload.get("competitions") or []:
            ref = _competition_ref(c) or {}
            season = c.get("currentSeason") or {}
            ref["area"] = (c.get("area") or {}).get("name")
            ref["current_season"] = {
                "start_date": season.get("startDate"),
                "end_date": season.get("endDate"),
                "current_matchday": season.get("currentMatchday"),
            }
            comps.append(ref)
        return {"competitions": comps, "featured_team_id": FEATURED_TEAM_ID, "meta": self._meta(res)}

    async def standings(self, code: str) -> dict[str, Any]:
        res = await self._fd(f"competitions/{code}/standings", ttl_seconds(minutes=30))
        return {**normalize_standings(res.payload), "meta": self._meta(res)}

    async def scorers(self, code: str, limit: int) -> dict[str, Any]:
        res = await self._fd(f"competitions/{code}/scorers", ttl_seconds(hours=1), {"limit": limit})
        return {
            "competition": _competition_ref(res.payload.get("competition")),
            "scorers": [normalize_scorer(s) for s in res.payload.get("scorers") or []],
            "meta": self._meta(res),
        }

    # -- matches ------------------------------------------------------------
    async def matches(
        self,
        date_from: date,
        date_to: date,
        competitions: list[str] | None,
        status: str | None,
    ) -> dict[str, Any]:
        # football-data.org treats dateTo as exclusive; our API's date_to is inclusive.
        params = {
            "dateFrom": date_from.isoformat(),
            "dateTo": (date_to + timedelta(days=1)).isoformat(),
            "competitions": ",".join(competitions) if competitions else None,
            "status": STATUS_FILTERS.get(status) if status else None,
        }
        res = await self._fd("matches", _match_list_ttl, params)
        matches = [normalize_match(m) for m in res.payload.get("matches") or []]
        matches.sort(key=lambda m: m["utc_date"] or "")
        return {"matches": matches, "meta": self._meta(res)}

    async def live(self) -> dict[str, Any]:
        res = await self._fd("matches", 60, {"status": STATUS_FILTERS["live"]})
        matches = [normalize_match(m) for m in res.payload.get("matches") or []]
        return {
            "matches": matches,
            "meta": {**self._meta(res), "delayed": True, "note": "Free data tier: scores are delayed, not real-time."},
        }

    async def match_detail(self, match_id: int) -> dict[str, Any]:
        res = await self._fd(f"matches/{match_id}", _match_detail_ttl)
        match = normalize_match(res.payload)

        h2h = None
        try:
            h2h_res = await self._fd(f"matches/{match_id}/head2head", ttl_seconds(hours=12), {"limit": 10})
            h2h_matches = [normalize_match(m) for m in h2h_res.payload.get("matches") or []]
            home_id = (match["home_team"] or {}).get("id")
            away_id = (match["away_team"] or {}).get("id")
            if home_id and away_id:
                h2h = {
                    "summary": head_to_head_summary(h2h_matches, home_id, away_id),
                    "matches": h2h_matches,
                }
        except ProviderError as exc:
            logger.info("Head-to-head unavailable for match %s: %s", match_id, type(exc).__name__)

        return {
            "match": match,
            "head_to_head": h2h,
            "meta": {
                **self._meta(res),
                "unavailable": ["lineups", "goal_scorers", "bookings", "substitutions", "match_statistics"],
            },
        }

    # -- teams --------------------------------------------------------------
    async def team(self, team_id: int) -> dict[str, Any]:
        res = await self._fd(f"teams/{team_id}", ttl_seconds(hours=24))
        team = normalize_team(res.payload)
        team["is_featured"] = team_id == FEATURED_TEAM_ID
        return {"team": team, "meta": self._meta(res)}

    async def team_matches(self, team_id: int, status: str | None, limit: int) -> dict[str, Any]:
        # The provider's `limit` combined with status filters returns unreliable
        # ordering, so fetch the team's whole season once (one cached call serves
        # both fixtures and results) and filter/sort/slice locally.
        res = await self._fd(f"teams/{team_id}/matches", _match_list_ttl)
        matches = [normalize_match(m) for m in res.payload.get("matches") or []]
        if status:
            matches = [m for m in matches if m["status"] in _STATUS_GROUPS[status]]
        newest_first = status in ("finished", "postponed")
        matches.sort(key=lambda m: m["utc_date"] or "", reverse=newest_first)
        matches = matches[:limit]
        return {
            "matches": matches,
            "form": team_form(matches, team_id) if status == "finished" else None,
            "meta": self._meta(res),
        }

    # -- players ------------------------------------------------------------
    async def _player_enrichment(self, name: str, team_name: str | None, nationality: str | None) -> dict[str, Any] | None:
        try:
            res = await self._tsdb("searchplayers.php", {"p": name})
        except ProviderError as exc:
            logger.info("TheSportsDB lookup failed for %s: %s", name, type(exc).__name__)
            return None
        candidates = (res.payload or {}).get("player") or []
        return normalize_tsdb_player(_pick_tsdb_player(candidates, name, team_name, nationality))

    async def _player_season_stats(self, player_id: int, competitions: list[dict[str, Any]]) -> list[dict[str, Any]]:
        """Goals/assists from each competition's scorers list (the only per-player stats on the free tier)."""

        async def one(comp: dict[str, Any]) -> dict[str, Any] | None:
            code = comp.get("code")
            if not code:
                return None
            try:
                res = await self._fd(f"competitions/{code}/scorers", ttl_seconds(hours=1), {"limit": 100})
            except ProviderError:
                return None
            for s in res.payload.get("scorers") or []:
                if (s.get("player") or {}).get("id") == player_id:
                    return {"competition": comp, **{k: v for k, v in normalize_scorer(s).items() if k not in ("player", "team")}}
            return None

        results = await asyncio.gather(*(one(c) for c in competitions))
        return [r for r in results if r]

    async def player(self, player_id: int) -> dict[str, Any]:
        res = await self._fd(f"persons/{player_id}", ttl_seconds(hours=24))
        p = res.payload
        current_team = p.get("currentTeam") or {}
        competitions = [c for c in (_competition_ref(c) for c in current_team.get("runningCompetitions") or []) if c]
        contract = current_team.get("contract") or {}

        enrichment, stats = await asyncio.gather(
            self._player_enrichment(p.get("name") or "", current_team.get("name"), p.get("nationality")),
            self._player_season_stats(player_id, competitions),
        )

        return {
            "player": {
                **normalize_player_ref(p),
                "first_name": p.get("firstName"),
                "last_name": p.get("lastName"),
                "current_team": _team_ref(current_team),
                "contract": {"start": contract.get("start"), "until": contract.get("until")} if contract else None,
                "profile": enrichment,
            },
            "season_stats": stats,
            "meta": {
                **self._meta(res),
                "stats_note": "Goals/assists come from competition top-scorer tables; players outside them show no stats.",
            },
        }


_service: FootballService | None = None


def get_football_service() -> FootballService:
    """FastAPI dependency returning the process-wide service."""
    global _service
    if _service is None:
        from app.database import supabase
        from app.services.api_cache import SupabaseStore
        from app.services.providers import supabase_request_logger

        log = supabase_request_logger(supabase)
        _service = FootballService(
            cache=ApiCache(SupabaseStore(supabase)),
            fd=FootballDataProvider(request_logger=log),
            tsdb=TheSportsDbProvider(request_logger=log),
        )
    return _service


async def close_football_service() -> None:
    if _service is not None:
        await _service.fd.aclose()
        await _service.tsdb.aclose()
