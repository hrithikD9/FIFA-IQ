// Formatting helpers for normalized /football API data.

export const userTimeZone = () => Intl.DateTimeFormat().resolvedOptions().timeZone

export const utcOffsetLabel = (date = new Date()) => {
    const minutes = -date.getTimezoneOffset()
    const sign = minutes >= 0 ? '+' : '-'
    const abs = Math.abs(minutes)
    const hours = Math.floor(abs / 60)
    const rest = abs % 60
    return `UTC${sign}${hours}${rest ? `:${String(rest).padStart(2, '0')}` : ''}`
}

/** Local calendar date as YYYY-MM-DD (not UTC). */
export const toIsoDate = (date) => {
    const y = date.getFullYear()
    const m = String(date.getMonth() + 1).padStart(2, '0')
    const d = String(date.getDate()).padStart(2, '0')
    return `${y}-${m}-${d}`
}

export const fromIsoDate = (iso) => {
    const [y, m, d] = iso.split('-').map(Number)
    return new Date(y, m - 1, d)
}

export const addDays = (date, days) => {
    const next = new Date(date)
    next.setDate(next.getDate() + days)
    return next
}

export const formatDayShort = (date) =>
    date.toLocaleDateString(undefined, { weekday: 'short', day: 'numeric', month: 'short' })

export const formatKickoff = (utc) =>
    new Date(utc).toLocaleTimeString(undefined, { hour: '2-digit', minute: '2-digit' })

export const formatMatchDate = (utc) => {
    const date = new Date(utc)
    const sameYear = date.getFullYear() === new Date().getFullYear()
    return date.toLocaleDateString(undefined, {
        weekday: 'short',
        day: 'numeric',
        month: 'short',
        ...(sameYear ? {} : { year: 'numeric' }),
    })
}

export const formatLongDate = (utc) =>
    new Date(utc).toLocaleDateString(undefined, { day: 'numeric', month: 'long', year: 'numeric' })

export const relativeDayLabel = (date, today = new Date()) => {
    const diff = Math.round((fromIsoDate(toIsoDate(date)) - fromIsoDate(toIsoDate(today))) / 86_400_000)
    if (diff === 0) return 'Today'
    if (diff === -1) return 'Yesterday'
    if (diff === 1) return 'Tomorrow'
    return date.toLocaleDateString(undefined, { weekday: 'long' })
}

export const teamCode = (team) => {
    if (!team) return '—'
    if (team.tla) return team.tla
    const words = (team.short_name || team.name || '').split(/\s+/).filter(Boolean)
    if (words.length > 1) return words.slice(0, 3).map((w) => w[0]).join('').toUpperCase()
    return (words[0] || '—').slice(0, 3).toUpperCase()
}

export const initials = (name) =>
    (name || '')
        .split(/\s+/)
        .filter(Boolean)
        .slice(0, 2)
        .map((w) => w[0])
        .join('')
        .toUpperCase() || '?'

export const STATUS_LABELS = {
    scheduled: 'Scheduled',
    live: 'Live',
    halftime: 'Half-time',
    finished: 'Full time',
    postponed: 'Postponed',
    suspended: 'Suspended',
    cancelled: 'Cancelled',
}

export const STATUS_TONES = {
    scheduled: 'neutral',
    live: 'live',
    halftime: 'accent',
    finished: 'win',
    postponed: 'momentum',
    suspended: 'momentum',
    cancelled: 'loss',
}

export const isPostponedLike = (status) => ['postponed', 'suspended', 'cancelled'].includes(status)

export const ordinal = (n) => {
    const s = ['th', 'st', 'nd', 'rd']
    const v = n % 100
    return `${n}${s[(v - 20) % 10] || s[v] || s[0]}`
}

export const prettyStage = (stage) =>
    stage
        ? stage
              .toLowerCase()
              .split('_')
              .map((w) => w[0].toUpperCase() + w.slice(1))
              .join(' ')
        : null

/** 'W' | 'D' | 'L' for `teamId` in a finished normalized match, else null. */
export const resultFor = (match, teamId) => {
    const winner = match?.status === 'finished' ? match.score.winner : null
    if (!winner) return null
    if (winner === 'draw') return 'D'
    const isHome = match.home_team?.id === teamId
    return (winner === 'home') === isHome ? 'W' : 'L'
}

/** "just now", "5 min ago", "3 h ago", "2 days ago", else a date. */
export const timeAgo = (iso, now = new Date()) => {
    if (!iso) return '—'
    const then = new Date(iso)
    const mins = Math.round((now - then) / 60_000)
    if (Number.isNaN(mins)) return '—'
    if (mins < 1) return 'just now'
    if (mins < 60) return `${mins} min ago`
    const hours = Math.round(mins / 60)
    if (hours < 24) return `${hours} h ago`
    const days = Math.round(hours / 24)
    if (days < 14) return `${days} day${days === 1 ? '' : 's'} ago`
    return then.toLocaleDateString(undefined, { day: 'numeric', month: 'short', year: 'numeric' })
}

/** 0.4234 -> "42%" */
export const pct0 = (p) => `${Math.round((Number(p) || 0) * 100)}%`

/**
 * Router state for "Predict with AI" links. International tournament matches
 * are treated as neutral-venue by default (the user can untick it).
 */
export const predictionState = (match) => ({
    home: match.home_team?.name,
    away: match.away_team?.name,
    externalMatchId: match.id,
    neutral: Boolean(match.is_international),
    competition: match.competition?.name,
    utcDate: match.utc_date,
    homeCrest: match.home_team?.crest ?? null,
    awayCrest: match.away_team?.crest ?? null,
})
