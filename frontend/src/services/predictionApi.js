import { authenticatedFetch } from './api'

// Compute outcome probabilities for two teams by name WITHOUT persisting to the DB.
export async function computePrediction({ homeTeam, awayTeam }) {
  try {
    const data = await authenticatedFetch('/predictions/compute', {
      method: 'POST',
      body: JSON.stringify({ home_team: homeTeam, away_team: awayTeam }),
    })

    return {
      data: {
        home_team: data.home_team,
        away_team: data.away_team,
        win_prob_home: Number(data.win_prob_home),
        win_prob_away: Number(data.win_prob_away),
        draw_prob: Number(data.draw_prob),
        underdog_insight: data.underdog_insight,
      },
      error: null,
    }
  } catch (error) {
    return {
      data: null,
      error: error instanceof Error ? error.message : 'Backend is unreachable.',
    }
  }
}

// Persist a previously computed prediction for the logged-in user. The match_id is
// auto-generated server-side, so the client never sends a manual match id.
export async function savePrediction({ homeTeam, awayTeam, winHome, winAway, draw, insight }) {
  try {
    const data = await authenticatedFetch('/predictions/save', {
      method: 'POST',
      body: JSON.stringify({
        home_team: homeTeam,
        away_team: awayTeam,
        win_prob_home: winHome,
        win_prob_away: winAway,
        draw_prob: draw,
        underdog_insight: insight,
      }),
    })

    return { data, error: null }
  } catch (error) {
    return {
      data: null,
      error: error instanceof Error ? error.message : 'Backend is unreachable.',
    }
  }
}

// Legacy: generate + persist in one call against an explicit match id.
export async function generatePrediction(matchId) {
  try {
    const data = await authenticatedFetch(`/predictions/generate/${matchId}`, {
      method: 'POST',
    })

    return {
      data: {
        match_id: data.match_id,
        win_prob_home: Number(data.win_prob_home),
        win_prob_away: Number(data.win_prob_away),
        draw_prob: Number(data.draw_prob),
        underdog_insight: data.underdog_insight,
      },
      error: null,
    }
  } catch (error) {
    return {
      data: null,
      error: error instanceof Error ? error.message : 'Backend is unreachable.',
    }
  }
}

export async function fetchPredictionHistory({ signal } = {}) {
  try {
    const data = await authenticatedFetch('/predictions/history', { signal })
    return { data: Array.isArray(data) ? data : [], error: null, status: 200 }
  } catch (error) {
    if (error.name === 'AbortError') throw error
    return {
      data: [],
      error: error instanceof Error ? error.message : 'Backend is unreachable.',
      status: error.status ?? null,
    }
  }
}
