import React, { useMemo, useState } from 'react'
import { useSearchParams } from 'react-router-dom'
import { CalendarDays, ChevronLeft, ChevronRight, Search } from 'lucide-react'
import MatchCard, { PostponedRow } from '../components/football/MatchCard'
import {
    Card,
    EmptyState,
    ErrorState,
    Pill,
    SectionHeader,
    Segmented,
    Skeleton,
    StaleNotice,
} from '../components/football/ui'
import { useApi } from '../hooks/useApi'
import { fetchCompetitions, fetchMatches, fetchStandings } from '../services/footballApi'
import {
    addDays,
    fromIsoDate,
    isPostponedLike,
    relativeDayLabel,
    toIsoDate,
    userTimeZone,
    utcOffsetLabel,
} from '../utils/football'

// Featured club's competitions first, then international, then the rest.
const COMPETITION_ORDER = ['PD', 'CL', 'WC', 'EC', 'PL', 'BL1', 'SA', 'FL1']

// Must match WARM_STANDINGS in backend/app/services/warmup.py.
const STANDINGS_LEAGUES = ['PD', 'PL', 'BL1', 'SA', 'FL1']

const SCOPES = [
    { value: 'all', label: 'All' },
    { value: 'club', label: 'Club' },
    { value: 'international', label: 'International' },
]

const STATUSES = [
    { value: '', label: 'Any status' },
    { value: 'scheduled', label: 'Scheduled' },
    { value: 'live', label: 'Live' },
    { value: 'finished', label: 'Full time' },
    { value: 'postponed', label: 'Postponed' },
]

const STATUS_MATCH = {
    scheduled: ['scheduled'],
    live: ['live', 'halftime'],
    finished: ['finished'],
    postponed: ['postponed', 'suspended', 'cancelled'],
}

const selectClass =
    'min-h-11 rounded-xl border border-fi-border bg-fi-surface px-3.5 pr-9 text-sm text-fi-text focus:border-fi-accent focus:outline-none'

const DateStrip = ({ selected, onSelect }) => {
    const today = new Date()
    const days = [-1, 0, 1, 2, 3].map((offset) => addDays(selected, offset))
    const selectedIso = toIsoDate(selected)

    return (
        <div className="flex items-center gap-2">
            <button
                type="button"
                aria-label="Previous day"
                onClick={() => onSelect(addDays(selected, -1))}
                className="grid size-11 shrink-0 place-items-center rounded-xl border border-fi-border text-fi-muted hover:text-white"
            >
                <ChevronLeft className="size-4" aria-hidden="true" />
            </button>
            <div className="no-scrollbar flex min-w-0 flex-1 gap-2 overflow-x-auto">
                {days.map((day) => {
                    const iso = toIsoDate(day)
                    const active = iso === selectedIso
                    return (
                        <button
                            key={iso}
                            type="button"
                            aria-pressed={active}
                            onClick={() => onSelect(day)}
                            className={`min-w-26 shrink-0 rounded-xl border px-3 py-2 text-center transition-colors ${
                                active
                                    ? 'border-fi-accent bg-fi-accent text-[#11152A]'
                                    : 'border-fi-border text-fi-text hover:border-fi-accent/50'
                            }`}
                        >
                            <span className={`block text-xs ${active ? 'text-[#11152A]/80' : 'text-fi-muted'}`}>
                                {relativeDayLabel(day, today)}
                            </span>
                            <span className="block text-sm font-semibold">
                                {day.toLocaleDateString(undefined, { weekday: 'short', day: 'numeric', month: 'short' })}
                            </span>
                        </button>
                    )
                })}
            </div>
            <button
                type="button"
                aria-label="Next day"
                onClick={() => onSelect(addDays(selected, 1))}
                className="grid size-11 shrink-0 place-items-center rounded-xl border border-fi-border text-fi-muted hover:text-white"
            >
                <ChevronRight className="size-4" aria-hidden="true" />
            </button>
            <label className="relative hidden min-h-11 shrink-0 cursor-pointer items-center gap-2 rounded-xl border border-fi-border px-4 text-sm font-semibold text-white hover:border-fi-accent/50 sm:inline-flex">
                <CalendarDays className="size-4 text-fi-accent" aria-hidden="true" />
                Choose date
                <input
                    type="date"
                    value={selectedIso}
                    onChange={(e) => e.target.value && onSelect(fromIsoDate(e.target.value))}
                    className="absolute inset-0 cursor-pointer opacity-0"
                    aria-label="Choose date"
                />
            </label>
        </div>
    )
}

/** Map of teamId -> { position, points } for the league competitions shown. */
function useLeagueStandings(codes) {
    const key = codes.length ? `standings:${codes.join(',')}` : null
    const { data } = useApi(key, async (signal) => {
        const results = await Promise.allSettled(codes.map((code) => fetchStandings(code, signal)))
        const map = {}
        results.forEach((r) => {
            if (r.status !== 'fulfilled') return
            // Leagues have one TOTAL table (the provider labels its group
            // "Matchday"); group-stage cups have one per group.
            r.value.tables
                .filter((t) => t.type === 'TOTAL')
                .forEach((table) =>
                    table.rows.forEach((row) => {
                        if (row.team?.id != null) map[row.team.id] = { position: row.position, points: row.points }
                    }),
                )
        })
        return map
    })
    return data
}

const Fixtures = () => {
    const [params, setParams] = useSearchParams()
    const selectedIso = /^\d{4}-\d{2}-\d{2}$/.test(params.get('date') || '') ? params.get('date') : toIsoDate(new Date())
    const selected = fromIsoDate(selectedIso)

    const [search, setSearch] = useState('')
    const [competition, setCompetition] = useState('')
    const [status, setStatus] = useState('')
    const [scope, setScope] = useState('all')

    const selectDate = (date) => {
        const next = new URLSearchParams(params)
        next.set('date', toIsoDate(date))
        setParams(next, { replace: true })
    }

    const resetFilters = () => {
        setSearch('')
        setCompetition('')
        setStatus('')
        setScope('all')
    }

    const competitionsQuery = useApi('competitions', (signal) => fetchCompetitions(signal))
    const featuredTeamId = competitionsQuery.data?.featured_team_id

    // Fetch one day either side and filter by *local* date, so late-evening
    // UTC kick-offs land on the right day for the viewer.
    const matchesQuery = useApi(`matches:${selectedIso}`, (signal) =>
        fetchMatches(
            { dateFrom: toIsoDate(addDays(selected, -1)), dateTo: toIsoDate(addDays(selected, 1)) },
            signal,
        ),
    )

    const dayMatches = useMemo(
        () => (matchesQuery.data?.matches ?? []).filter((m) => toIsoDate(new Date(m.utc_date)) === selectedIso),
        [matchesQuery.data, selectedIso],
    )

    const filtered = useMemo(() => {
        const q = search.trim().toLowerCase()
        return dayMatches.filter((m) => {
            if (competition && m.competition?.code !== competition) return false
            if (status && !STATUS_MATCH[status].includes(m.status)) return false
            if (scope === 'club' && m.is_international) return false
            if (scope === 'international' && !m.is_international) return false
            if (q) {
                const haystack = [m.home_team, m.away_team]
                    .flatMap((t) => [t?.name, t?.short_name, t?.tla])
                    .concat(m.competition?.name, m.referee)
                    .filter(Boolean)
                    .join(' ')
                    .toLowerCase()
                if (!haystack.includes(q)) return false
            }
            return true
        })
    }, [dayMatches, search, competition, status, scope])

    const groups = useMemo(() => {
        const byCode = new Map()
        filtered.forEach((m) => {
            const code = m.competition?.code ?? 'OTHER'
            if (!byCode.has(code)) byCode.set(code, { competition: m.competition, matches: [] })
            byCode.get(code).matches.push(m)
        })
        const rank = (code) => {
            const i = COMPETITION_ORDER.indexOf(code)
            return i === -1 ? COMPETITION_ORDER.length : i
        }
        return [...byCode.entries()]
            .sort(([a], [b]) => rank(a) - rank(b) || a.localeCompare(b))
            .map(([, group]) => {
                const involvesFeatured = (m) =>
                    m.home_team?.id === featuredTeamId || m.away_team?.id === featuredTeamId
                group.matches.sort(
                    (a, b) => involvesFeatured(b) - involvesFeatured(a) || a.utc_date.localeCompare(b.utc_date),
                )
                return group
            })
    }, [filtered, featuredTeamId])

    // Only the leagues the backend keeps warm, so a cold visit cannot burst
    // past the free-tier rate limit.
    const leagueCodes = useMemo(
        () =>
            [...new Set(dayMatches.map((m) => m.competition?.code))]
                .filter((code) => STANDINGS_LEAGUES.includes(code))
                .sort(),
        [dayMatches],
    )
    const standings = useLeagueStandings(leagueCodes)

    const filtersActive = search || competition || status || scope !== 'all'

    return (
        <div className="flex flex-col gap-6">
            <header className="flex flex-wrap items-end justify-between gap-5">
                <div className="max-w-2xl">
                    <Pill tone="accent">Matchday radar</Pill>
                    <h1 className="mt-3 font-display text-4xl font-bold text-white sm:text-[44px]">Match Fixtures</h1>
                    <p className="mt-2 text-[15px] leading-relaxed text-fi-muted">
                        Scheduled fixtures and recent results across the top European leagues, the Champions League
                        and international tournaments, in your local time.
                    </p>
                </div>
                <div className="flex flex-wrap gap-3">
                    <Card className="px-4 py-3">
                        <p className="text-[11px] font-semibold uppercase tracking-[0.12em] text-fi-muted">Showing</p>
                        <p className="mt-0.5 font-semibold text-white">
                            {selected.toLocaleDateString(undefined, { weekday: 'long', day: 'numeric', month: 'long' })}
                        </p>
                    </Card>
                    <Card className="px-4 py-3">
                        <p className="text-[11px] font-semibold uppercase tracking-[0.12em] text-fi-muted">Time zone</p>
                        <p className="mt-0.5 font-semibold text-white">
                            {utcOffsetLabel(selected)} · {userTimeZone()}
                        </p>
                    </Card>
                </div>
            </header>

            <Card className="flex flex-col gap-4 p-4 sm:p-5">
                <DateStrip selected={selected} onSelect={selectDate} />
                <div className="h-px bg-fi-border" />
                <div className="flex flex-wrap items-center gap-3">
                    <label className="relative min-w-55 flex-1">
                        <Search className="pointer-events-none absolute top-1/2 left-3.5 size-4 -translate-y-1/2 text-fi-muted" aria-hidden="true" />
                        <span className="sr-only">Search</span>
                        <input
                            type="search"
                            value={search}
                            onChange={(e) => setSearch(e.target.value)}
                            placeholder="Clubs, national teams or referees"
                            className="min-h-11 w-full rounded-xl border border-fi-border bg-fi-surface pr-3.5 pl-10 text-sm text-fi-text placeholder:text-fi-muted focus:border-fi-accent focus:outline-none"
                        />
                    </label>
                    <select
                        aria-label="Competition"
                        value={competition}
                        onChange={(e) => setCompetition(e.target.value)}
                        className={selectClass}
                    >
                        <option value="">All competitions</option>
                        {(competitionsQuery.data?.competitions ?? []).map((c) => (
                            <option key={c.code} value={c.code}>
                                {c.name}
                            </option>
                        ))}
                    </select>
                    <select aria-label="Status" value={status} onChange={(e) => setStatus(e.target.value)} className={selectClass}>
                        {STATUSES.map((s) => (
                            <option key={s.value} value={s.value}>
                                {s.label}
                            </option>
                        ))}
                    </select>
                    <Segmented options={SCOPES} value={scope} onChange={setScope} label="Scope" />
                    <button
                        type="button"
                        onClick={resetFilters}
                        disabled={!filtersActive}
                        className="min-h-11 px-2 text-sm font-semibold text-fi-link disabled:text-fi-muted/50"
                    >
                        Reset
                    </button>
                </div>
                <p className="text-xs text-fi-muted">
                    All times shown in your local time ({utcOffsetLabel(selected)}). Scores on the free data tier are
                    delayed.
                </p>
            </Card>

            <StaleNotice meta={matchesQuery.data?.meta} />

            {matchesQuery.error ? (
                <ErrorState error={matchesQuery.error} onRetry={matchesQuery.reload} />
            ) : matchesQuery.loading && !matchesQuery.data ? (
                <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
                    {[0, 1, 2].map((i) => (
                        <Skeleton key={i} className="h-75" />
                    ))}
                </div>
            ) : groups.length === 0 ? (
                <EmptyState title={dayMatches.length ? 'No matches match these filters' : 'No matches on this day'}>
                    {dayMatches.length
                        ? 'Try clearing the filters.'
                        : 'Pick another day with the arrows or the date picker.'}
                </EmptyState>
            ) : (
                groups.map(({ competition: comp, matches }) => {
                    const regular = matches.filter((m) => !isPostponedLike(m.status))
                    const postponed = matches.filter((m) => isPostponedLike(m.status))
                    const matchday = matches.find((m) => m.matchday)?.matchday
                    const subtitle = [
                        comp?.is_international ? 'International' : comp?.type === 'CUP' ? 'Cup' : 'League',
                        matchday && `Matchday ${matchday}`,
                        `${matches.length} ${matches.length === 1 ? 'match' : 'matches'}`,
                    ]
                        .filter(Boolean)
                        .join(' · ')

                    return (
                        <section key={comp?.code ?? 'other'} className="flex flex-col gap-4" aria-label={comp?.name}>
                            <SectionHeader
                                badge={
                                    comp?.emblem ? (
                                        <span className="grid size-11 place-items-center rounded-xl border border-fi-border bg-fi-surface p-1.5">
                                            <img src={comp.emblem} alt="" className="size-full object-contain" />
                                        </span>
                                    ) : (
                                        <span className="grid size-11 place-items-center rounded-xl border border-fi-border bg-fi-surface text-xs font-bold text-fi-accent-light">
                                            {comp?.code}
                                        </span>
                                    )
                                }
                                title={comp?.name ?? 'Other'}
                                subtitle={subtitle}
                                right={comp?.is_international ? <Pill tone="opp">AI predictions available</Pill> : null}
                            />
                            {regular.length > 0 && (
                                <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
                                    {regular.map((m) => (
                                        <MatchCard key={m.id} match={m} standings={standings} featuredTeamId={featuredTeamId} />
                                    ))}
                                </div>
                            )}
                            {postponed.map((m) => (
                                <PostponedRow key={m.id} match={m} />
                            ))}
                        </section>
                    )
                })
            )}
        </div>
    )
}

export default Fixtures
