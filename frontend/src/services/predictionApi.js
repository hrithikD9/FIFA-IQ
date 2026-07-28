import { supabase } from '../context/AuthContext'

// Base URL for the backend API. Configurable via VITE_API_BASE_URL so the same
// build can target local, staging, or production backends; falls back to the
// local development server when the variable is undefined.
const API_BASE_URL = import.meta.env.VITE_API_BASE_URL ?? 'http://localhost:8000/api/v1'

async function getAuthHeaders() {
  const {
    data: { session },
  } = await supabase.auth.getSession()
  const token = session?.access_token

  if (!token) {
    return null
  }

  return {
    'Content-Type': 'application/json',
    Authorization: `Bearer ${token}`,
  }
}

// Compute outcome probabilities for two teams by name WITHOUT persisting to the DB.
export async function computePrediction({ homeTeam, awayTeam }) {
  try {
    const headers = await getAuthHeaders()

    if (!headers) {
      return { data: null, error: 'Authentication required' }
    }

    const response = await fetch(`${API_BASE_URL}/predictions/compute`, {
      method: 'POST',
      headers,
      body: JSON.stringify({ home_team: homeTeam, away_team: awayTeam }),
    })

    const data = await response.json().catch(() => null)

    if (!response.ok) {
      throw new Error(data?.detail || 'Failed to generate prediction.')
    }

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
    const headers = await getAuthHeaders()

    if (!headers) {
      return { data: null, error: 'Authentication required' }
    }

    const response = await fetch(`${API_BASE_URL}/predictions/save`, {
      method: 'POST',
      headers,
      body: JSON.stringify({
        home_team: homeTeam,
        away_team: awayTeam,
        win_prob_home: winHome,
        win_prob_away: winAway,
        draw_prob: draw,
        underdog_insight: insight,
      }),
    })

    const data = await response.json().catch(() => null)

    if (!response.ok) {
      throw new Error(data?.detail || 'Failed to save prediction.')
    }

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
    const headers = await getAuthHeaders()

    if (!headers) {
      return { data: null, error: 'Authentication required' }
    }

    const response = await fetch(`${API_BASE_URL}/predictions/generate/${matchId}`, {
      method: 'POST',
      headers,
    })

    const data = await response.json().catch(() => null)

    if (!response.ok) {
      throw new Error(data?.detail || 'Failed to generate prediction.')
    }

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
