"""Pure helpers that turn raw Supabase rows into admin dashboard figures.

Kept free of I/O so they can be unit-tested without a database.
"""

from __future__ import annotations

from collections import Counter
from datetime import date, datetime, timedelta, timezone
from typing import Any


def parse_ts(value: Any) -> datetime | None:
    """Accept datetimes or ISO strings (Supabase returns both)."""
    if value is None:
        return None
    if isinstance(value, datetime):
        return value if value.tzinfo else value.replace(tzinfo=timezone.utc)
    try:
        parsed = datetime.fromisoformat(str(value).replace("Z", "+00:00"))
    except ValueError:
        return None
    return parsed if parsed.tzinfo else parsed.replace(tzinfo=timezone.utc)


def user_row(user: dict[str, Any], prediction_count: int) -> dict[str, Any]:
    meta = user.get("user_metadata") or {}
    app_meta = user.get("app_metadata") or {}
    created = parse_ts(user.get("created_at"))
    last_sign_in = parse_ts(user.get("last_sign_in_at"))
    return {
        "id": user.get("id"),
        "email": user.get("email"),
        "full_name": meta.get("full_name") or meta.get("fullName") or meta.get("name"),
        "is_admin": bool(app_meta.get("is_admin") or app_meta.get("role") == "admin"),
        "provider": app_meta.get("provider"),
        "created_at": created.isoformat() if created else None,
        "last_sign_in_at": last_sign_in.isoformat() if last_sign_in else None,
        "prediction_count": prediction_count,
    }


def daily_counts(timestamps: list[datetime], days: int, today: date) -> list[dict[str, Any]]:
    """Counts per UTC day for the last `days` days, oldest first, zero-filled."""
    counter = Counter(ts.astimezone(timezone.utc).date() for ts in timestamps)
    start = today - timedelta(days=days - 1)
    return [
        {"date": (start + timedelta(days=i)).isoformat(), "count": counter.get(start + timedelta(days=i), 0)}
        for i in range(days)
    ]


def build_overview(
    users: list[dict[str, Any]],
    predictions: list[dict[str, Any]],
    now: datetime,
    trend_days: int = 14,
) -> dict[str, Any]:
    week_ago = now - timedelta(days=7)
    user_created = [parse_ts(u.get("created_at")) for u in users]
    user_signins = [parse_ts(u.get("last_sign_in_at")) for u in users]
    pred_times = [ts for ts in (parse_ts(p.get("created_at")) for p in predictions) if ts]
    predictors_week = {p.get("user_id") for p in predictions if (parse_ts(p.get("created_at")) or now) >= week_ago}

    return {
        "users": {
            "total": len(users),
            "new_7d": sum(1 for ts in user_created if ts and ts >= week_ago),
            "active_7d": sum(1 for ts in user_signins if ts and ts >= week_ago),
            "admins": sum(1 for u in users if user_row(u, 0)["is_admin"]),
        },
        "predictions": {
            "total": len(predictions),
            "last_7d": sum(1 for ts in pred_times if ts >= week_ago),
            "predictors_7d": len(predictors_week - {None}),
            "daily": daily_counts(pred_times, trend_days, now.astimezone(timezone.utc).date()),
        },
    }
