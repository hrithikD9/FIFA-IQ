import asyncio

from app.services.api_cache import ApiCache
from app.services.football import FootballService
from app.services.providers import ProviderRateLimited
from app.services.warmup import WARM_STANDINGS, run_warmup_once
from tests.test_football_api import FD_RESPONSES, TSDB_RESPONSES, FakeProvider


def make_service(responses):
    return FootballService(
        cache=ApiCache(),
        fd=FakeProvider("football-data.org", responses),
        tsdb=FakeProvider("thesportsdb", dict(TSDB_RESPONSES)),
    )


def test_warmup_fetches_core_data_and_survives_failures():
    responses = {
        **FD_RESPONSES,
        "competitions": {"competitions": []},
        "competitions/PD/standings": {"standings": []},
        "competitions/PL/standings": ProviderRateLimited(),
    }
    svc = make_service(responses)
    failures = asyncio.run(run_warmup_once(svc, spacing_seconds=0))

    paths = [path for path, _ in svc.fd.calls]
    assert "competitions" in paths and "matches" in paths and "teams/81" in paths
    assert all(f"competitions/{c}/standings" in paths for c in WARM_STANDINGS)
    # PL rate-limited, BL1/SA/FL1 missing from the fake -> skipped, not crashed
    assert failures == 4


def test_second_warmup_is_served_from_cache():
    responses = {**FD_RESPONSES, "competitions": {"competitions": []}}
    for code in WARM_STANDINGS:
        responses[f"competitions/{code}/standings"] = {"standings": []}
    svc = make_service(responses)
    asyncio.run(run_warmup_once(svc, spacing_seconds=0))
    first = len(svc.fd.calls)
    asyncio.run(run_warmup_once(svc, spacing_seconds=0))
    assert len(svc.fd.calls) == first
