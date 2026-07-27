import { supabase } from '../context/AuthContext'

const API_BASE_URL = 'http://localhost:8000/api/v1'

export async function generatePrediction(matchId) {
  try {
    const {
      data: { session },
    } = await supabase.auth.getSession()
    const token = session?.access_token

    if (!token) {
      return {
        data: null,
        error: 'Authentication required',
      }
    }

    const response = await fetch(`${API_BASE_URL}/predictions/generate/${matchId}`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${token}`,
      },
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
