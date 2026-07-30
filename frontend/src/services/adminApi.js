import { supabase } from './supabaseClient'

// Base URL for the backend API. Configurable via VITE_API_BASE_URL so the same
// build can target local, staging, or production backends; falls back to the
// local development server when the variable is undefined.
const API_BASE_URL = import.meta.env.VITE_API_BASE_URL ?? 'http://localhost:8000/api/v1'

// Build an Authorization header set from the active Supabase session. Returns
// null when there is no access token so callers can short-circuit unauthenticated.
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

// Fetch all national teams and their metrics (admin only).
export async function fetchAdminTeams() {
  try {
    const headers = await getAuthHeaders()

    if (!headers) {
      return { data: null, error: 'Authentication required' }
    }

    const response = await fetch(`${API_BASE_URL}/admin/teams`, { headers })
    const data = await response.json().catch(() => null)

    if (!response.ok) {
      throw new Error(data?.detail || 'Failed to load teams.')
    }

    return { data: Array.isArray(data) ? data : [], error: null }
  } catch (error) {
    return {
      data: null,
      error: error instanceof Error ? error.message : 'Backend is unreachable.',
    }
  }
}

// Update a team's attributes (xg_avg, possession_avg, defensive_rating, ...).
// `metrics` is a partial object; only provided fields are updated server-side.
export async function updateTeamMetrics(teamId, metrics) {
  try {
    const headers = await getAuthHeaders()

    if (!headers) {
      return { data: null, error: 'Authentication required' }
    }

    const response = await fetch(`${API_BASE_URL}/admin/teams/${teamId}`, {
      method: 'PUT',
      headers,
      body: JSON.stringify(metrics),
    })

    const data = await response.json().catch(() => null)

    if (!response.ok) {
      throw new Error(data?.detail || 'Failed to update team.')
    }

    return { data, error: null }
  } catch (error) {
    return {
      data: null,
      error: error instanceof Error ? error.message : 'Backend is unreachable.',
    }
  }
}

// Fetch system telemetry: total prediction counts and recent activity (admin only).
export async function fetchAdminTelemetry() {
  try {
    const headers = await getAuthHeaders()

    if (!headers) {
      return { data: null, error: 'Authentication required' }
    }

    const response = await fetch(`${API_BASE_URL}/admin/telemetry`, { headers })
    const data = await response.json().catch(() => null)

    if (!response.ok) {
      throw new Error(data?.detail || 'Failed to load telemetry.')
    }

    return { data, error: null }
  } catch (error) {
    return {
      data: null,
      error: error instanceof Error ? error.message : 'Backend is unreachable.',
    }
  }
}
