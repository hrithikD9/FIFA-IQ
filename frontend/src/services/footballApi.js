import { authenticatedFetch } from './api'

// Thin wrappers over the backend /football endpoints. The backend caches all
// provider data, so these are cheap to call repeatedly.

const query = (params) => {
    const search = new URLSearchParams()
    Object.entries(params).forEach(([key, value]) => {
        if (value != null && value !== '') search.set(key, value)
    })
    const text = search.toString()
    return text ? `?${text}` : ''
}

export const fetchCompetitions = (signal) =>
    authenticatedFetch('/football/competitions', { signal })

export const fetchMatches = ({ dateFrom, dateTo, competitions, status } = {}, signal) =>
    authenticatedFetch(
        `/football/matches${query({ date_from: dateFrom, date_to: dateTo, competitions, status })}`,
        { signal },
    )

export const fetchLiveMatches = (signal) =>
    authenticatedFetch('/football/matches/live', { signal })

export const fetchMatch = (matchId, signal) =>
    authenticatedFetch(`/football/matches/${matchId}`, { signal })

export const fetchStandings = (code, signal) =>
    authenticatedFetch(`/football/competitions/${code}/standings`, { signal })

export const fetchScorers = (code, limit = 10, signal) =>
    authenticatedFetch(`/football/competitions/${code}/scorers${query({ limit })}`, { signal })

export const fetchTeam = (teamId, signal) =>
    authenticatedFetch(`/football/teams/${teamId}`, { signal })

export const fetchTeamMatches = (teamId, { status, limit } = {}, signal) =>
    authenticatedFetch(`/football/teams/${teamId}/matches${query({ status, limit })}`, { signal })

export const fetchPlayer = (playerId, signal) =>
    authenticatedFetch(`/football/players/${playerId}`, { signal })
