"""Grade probabilistic predictions against real results.

A prediction is "correct" when its most likely outcome happened. The Brier score
measures calibration over all three outcomes: sum((p - o)^2), where o is 1 for
the actual outcome and 0 otherwise. 0 is perfect, 2 is maximally wrong, and an
uninformative 1/3-1/3-1/3 forecast always scores 0.667.
"""

from __future__ import annotations

from typing import Any

OUTCOMES = ("home", "draw", "away")
UNIFORM_BRIER = round(2 / 3, 4)


def predicted_outcome(home: float, draw: float, away: float) -> str:
    probs = {"home": home, "draw": draw, "away": away}
    return max(OUTCOMES, key=lambda o: probs[o])


def brier(home: float, draw: float, away: float, actual: str) -> float:
    probs = {"home": home, "draw": draw, "away": away}
    return round(sum((probs[o] - (1.0 if o == actual else 0.0)) ** 2 for o in OUTCOMES), 4)


def grade(home: float, draw: float, away: float, match: dict[str, Any] | None) -> dict[str, Any]:
    """Grade against a normalized football match (see football.normalize_match)."""
    if match is None:
        return {"status": "unknown"}
    if match.get("status") in ("postponed", "suspended", "cancelled"):
        return {"status": "void", "match_status": match.get("status")}
    if match.get("status") != "finished" or not (match.get("score") or {}).get("winner"):
        return {"status": "pending", "kickoff": match.get("utc_date")}

    actual = match["score"]["winner"]
    predicted = predicted_outcome(home, draw, away)
    return {
        "status": "graded",
        "actual": actual,
        "predicted": predicted,
        "correct": predicted == actual,
        "brier": brier(home, draw, away, actual),
        "score": {"home": match["score"]["home"], "away": match["score"]["away"]},
    }


def summarize(grades: list[dict[str, Any]]) -> dict[str, Any]:
    graded = [g for g in grades if g.get("status") == "graded"]
    n = len(graded)
    correct = sum(1 for g in graded if g["correct"])
    return {
        "graded": n,
        "pending": sum(1 for g in grades if g.get("status") == "pending"),
        "correct": correct,
        "accuracy": round(correct / n, 4) if n else None,
        "brier": round(sum(g["brier"] for g in graded) / n, 4) if n else None,
        "uniform_brier": UNIFORM_BRIER,
    }
