const API_BASE_URL = import.meta.env.VITE_API_BASE_URL ?? 'http://localhost:8000/api/v1'

const NATIONAL_FLAG_CODES = {
    argentina: 'ar',
    brazil: 'br',
    england: 'gb-eng',
    france: 'fr',
    germany: 'de',
    portugal: 'pt',
    spain: 'es',
}

const normalizeName = (value) => value?.trim().toLowerCase() ?? ''

const isUsableImageUrl = (value) =>
    typeof value === 'string' && value.trim() !== '' && !value.includes('example.com')

export const getTeamImageUrl = (team) => {
    if (!team) return null

    if (isUsableImageUrl(team.flag_url)) return team.flag_url
    if (isUsableImageUrl(team.logo_url)) return team.logo_url

    const flagCode = NATIONAL_FLAG_CODES[normalizeName(team.name)]
    return flagCode ? `https://flagcdn.com/w160/${flagCode}.png` : null
}

export const isNationalTeam = (team) =>
    normalizeName(team?.league) === 'international' || Boolean(NATIONAL_FLAG_CODES[normalizeName(team?.name)])

export const toTeamPreference = (team) => ({
    id: team.id,
    name: team.name,
    league: team.league ?? null,
    flag_url: team.flag_url ?? null,
    logo_url: team.logo_url ?? null,
})

export async function fetchTeams({ signal } = {}) {
    const response = await fetch(`${API_BASE_URL}/teams/`, { signal })
    const data = await response.json().catch(() => null)

    if (!response.ok) {
        throw new Error(data?.detail || `Failed to load teams (${response.status}).`)
    }

    return Array.isArray(data) ? data : []
}