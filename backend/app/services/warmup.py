"""Background cache warm-up for the free-tier football API.

A cold Fixtures page on a busy matchday needs ~10 provider calls (matches +
standings for every league playing), which exceeds the free limit of 10/minute.
This job refreshes the commonly-viewed data at a gentle pace (one call every
few seconds) so user requests are served from the cache instead.

Each step goes through FootballService, so entries that are still fresh in the
shared Supabase cache cost no provider call at all (safe with several workers).
"""

from __future__ import annotations

import asyncio
import logging
import os
from datetime import date, timedelta
from typing import Any, Awaitable, Callable

from app.services.football import FEATURED_TEAM_ID, FootballService
from app.services.providers import ProviderError

logger = logging.getLogger(__name__)

# Leagues whose standings feed league positions on fixture cards.
WARM_STANDINGS = ["PD", "PL", "BL1", "SA", "FL1"]


def warmup_steps(svc: FootballService, today: date | None = None) -> list[tuple[str, Callable[[], Awaitable[Any]]]]:
    today = today or date.today()
    steps: list[tuple[str, Callable[[], Awaitable[Any]]]] = [
        ("competitions", svc.competitions),
        ("matches today±1", lambda: svc.matches(today - timedelta(days=1), today + timedelta(days=1), None, None)),
        ("featured team", lambda: svc.team(FEATURED_TEAM_ID)),
        ("featured team matches", lambda: svc.team_matches(FEATURED_TEAM_ID, None, 50)),
    ]
    steps += [(f"standings {code}", lambda code=code: svc.standings(code)) for code in WARM_STANDINGS]
    return steps


async def run_warmup_once(svc: FootballService, spacing_seconds: float) -> int:
    """Run every warm-up step, pausing between them. Returns the number that failed."""
    failures = 0
    for name, step in warmup_steps(svc):
        try:
            await step()
        except ProviderError as exc:
            failures += 1
            logger.info("Warm-up step %r skipped: %s", name, type(exc).__name__)
        except Exception:  # never let the background task die
            failures += 1
            logger.exception("Warm-up step %r failed", name)
        await asyncio.sleep(spacing_seconds)
    return failures


async def warmup_loop(svc: FootballService) -> None:
    interval = float(os.getenv("FOOTBALL_WARMUP_INTERVAL_SECONDS", "900"))
    spacing = float(os.getenv("FOOTBALL_WARMUP_SPACING_SECONDS", "8"))
    await asyncio.sleep(5)  # let the app finish starting
    while True:
        failures = await run_warmup_once(svc, spacing)
        logger.info("Football cache warm-up finished (%d step(s) skipped)", failures)
        await asyncio.sleep(interval)


def warmup_enabled() -> bool:
    return os.getenv("FOOTBALL_WARMUP", "1").lower() not in ("0", "false", "no")
