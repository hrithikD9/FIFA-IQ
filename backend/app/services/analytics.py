from app.models.team import Team


def _safe_metric(value: float | None, default: float = 0.0) -> float:
    """Return a non-negative metric value, falling back when data is missing."""
    if value is None:
        return default

    return max(float(value), 0.0)


def _team_strength(team: Team) -> float:
    """Calculate a lightweight team strength score from xG and possession metrics."""
    xg_avg = _safe_metric(team.xg_avg)
    possession_avg = _safe_metric(team.possession_avg, default=50.0)

    xg_component = xg_avg * 0.7
    possession_component = (possession_avg / 100.0) * 0.3

    return max(xg_component + possession_component, 0.01)


def calculate_match_probabilities(home_team: Team, away_team: Team) -> dict[str, float]:
    """Calculate normalized match outcome probabilities for two teams.

    The model compares expected goals and possession-based control to produce
    home win, draw, and away win probabilities that sum to 1.0. It intentionally
    remains lightweight and deterministic so it can power early FIFA-IQ endpoint
    responses before a trained ML model is introduced.

    Args:
        home_team: The home side represented by the Team schema.
        away_team: The away side represented by the Team schema.

    Returns:
        A dictionary with `home_win`, `draw`, and `away_win` probabilities.
    """
    home_strength = _team_strength(home_team) * 1.08
    away_strength = _team_strength(away_team)

    strength_gap = abs(home_strength - away_strength)
    draw_weight = max(0.18, 0.32 - (strength_gap * 0.08))

    win_pool = 1.0 - draw_weight
    total_strength = home_strength + away_strength

    home_win = win_pool * (home_strength / total_strength)
    away_win = win_pool * (away_strength / total_strength)

    probabilities = {
        "home_win": round(home_win, 4),
        "draw": round(draw_weight, 4),
        "away_win": round(away_win, 4),
    }

    rounding_delta = round(1.0 - sum(probabilities.values()), 4)
    probabilities["draw"] = round(probabilities["draw"] + rounding_delta, 4)

    return probabilities


def underdog_insight_generator(home_team: Team, away_team: Team, home_prob: float, away_prob: float) -> str:
    """Generate a concise underdog insight for FIFA-IQ UI display.

    The underdog is the team with the lower win probability. The function looks
    for signs of efficiency: competitive xG output despite lower possession.

    Args:
        home_team: The home side represented by the Team schema.
        away_team: The away side represented by the Team schema.
        home_prob: Calculated home win probability.
        away_prob: Calculated away win probability.

    Returns:
        A short analytical insight string suitable for dashboard cards.
    """
    underdog = home_team if home_prob < away_prob else away_team
    favorite = away_team if underdog is home_team else home_team
    underdog_prob = home_prob if underdog is home_team else away_prob

    underdog_xg = _safe_metric(underdog.xg_avg)
    favorite_xg = _safe_metric(favorite.xg_avg)
    underdog_possession = _safe_metric(underdog.possession_avg, default=50.0)
    favorite_possession = _safe_metric(favorite.possession_avg, default=50.0)

    has_lower_possession = underdog_possession < favorite_possession
    has_competitive_xg = underdog_xg >= favorite_xg * 0.9

    if has_lower_possession and has_competitive_xg:
        return (
            f"{underdog.name} profile as an efficient underdog: lower possession, "
            f"but xG output remains close to {favorite.name}, making transition chances a key upset path."
        )

    if underdog_xg > favorite_xg:
        return (
            f"{underdog.name} carry upset value despite a {underdog_prob:.1%} win probability, "
            f"with stronger xG signals than {favorite.name}."
        )

    return (
        f"{underdog.name} are the underdog at {underdog_prob:.1%}; they will likely need set-piece quality "
        f"or counter-attacking efficiency to outperform {favorite.name}."
    )