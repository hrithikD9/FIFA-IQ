import React, { useEffect, useMemo, useState } from 'react'
import { Link } from 'react-router-dom'
import { Clock, RefreshCw, Sparkles } from 'lucide-react'
import ResultRow from '../components/football/ResultRow'
import {
    Button,
    Card,
    CrestBadge,
    EmptyState,
    ErrorState,
    Inset,
    Pill,
    SectionHeader,
    Segmented,
    Skeleton,
    StaleNotice,
} from '../components/football/ui'
import { useApi } from '../hooks/useApi'
import { fetchLiveMatches, fetchMatches } from '../services/footballApi'
import { STATUS_LABELS, addDays, formatKickoff, predictionState, prettyStage, toIsoDate } from '../utils/football'

const REFRESH_MS = 60_000 // matches the backend's live-cache TTL
const COMPETITION_ORDER = ['PD', 'CL', 'WC', 'EC', 'PL', 'BL1', 'SA', 'FL1']
const LIVE_STATUSES = ['live', 'halftime']

const SCOPES = [
    { value: 'all', label: 'All' },
    { value: 'club', label: 'Club' },
    { value: 'international', label: 'International' },
]

const rank = (code) => {
    const i = COMPETITION_ORDER.indexOf(code)
    return i === -1 ? COMPETITION_ORDER.length : i
}

const isLive = (m) => LIVE_STATUSES.includes(m.status)

/** "in 2 h 14 min" style countdown text. */
const countdown = (utc, now) => {
    const mins = Math.max(0, Math.round((new Date(utc) - now) / 60_000))
    if (mins < 1) return 'any moment'
    const h = Math.floor(mins / 60)
    const m = mins % 60
    return `in ${h ? `${h} h ` : ''}${m} min`
}

/** Re-render every `ms` so countdowns stay current. */
function useNow(ms) {
    const [now, setNow] = useState(() => new Date())
    useEffect(() => {
        const id = setInterval(() => setNow(new Date()), ms)
        return () => clearInterval(id)
    }, [ms])
    return now
}

const LiveCard = ({ match }) => {
    const { score, status } = match
    const statusText =
        match.minute != null
            ? `${match.minute}'${match.injury_time ? `+${match.injury_time}` : ''}`
            : STATUS_LABELS[status]
    const details = [
        `Kicked off ${formatKickoff(match.utc_date)}`,
        match.matchday && `Matchday ${match.matchday}`,
        match.group && prettyStage(match.group),
    ].filter(Boolean)

    return (
        <Card className="flex flex-col gap-4 p-5">
            <div className="flex items-center justify-between gap-3">
                <Pill tone={status === 'halftime' ? 'accent' : 'live'} dot>
                    {statusText}
                </Pill>
                {match.referee && <span className="truncate text-xs text-fi-muted">Ref: {match.referee}</span>}
            </div>

            <div className="flex flex-col gap-3">
                {[
                    [match.home_team, score.home],
                    [match.away_team, score.away],
                ].map(([team, goals], i) => (
                    <div key={i} className="flex items-center gap-3">
                        <CrestBadge team={team} size="sm" />
                        <Link
                            to={team?.id ? `/teams/${team.id}` : '#'}
                            className="min-w-0 flex-1 truncate font-semibold text-white hover:text-fi-accent-light"
                        >
                            {team?.name ?? 'TBD'}
                        </Link>
                        <span className="font-display text-2xl font-bold tabular-nums text-white">{goals ?? 0}</span>
                    </div>
                ))}
            </div>

            <Inset className="flex flex-col gap-1 px-3.5 py-2.5 text-[13px] text-fi-muted">
                <span>{details.join(' · ')}</span>
                {score.half_time?.home != null && (
                    <span>
                        Half-time: {score.half_time.home}–{score.half_time.away}
                    </span>
                )}
            </Inset>

            <div className="mt-auto flex items-center justify-between gap-3">
                <Link to={`/results/${match.id}`} className="text-sm font-semibold text-fi-link hover:text-fi-accent-light">
                    Full scorecard
                </Link>
                {match.is_international && (
                    <Link
                        to="/predict"
                        state={predictionState(match)}
                        className="inline-flex items-center gap-1.5 text-sm font-semibold text-fi-link hover:text-fi-accent-light"
                    >
                        <Sparkles className="size-4" aria-hidden="true" /> AI forecast
                    </Link>
                )}
            </div>
        </Card>
    )
}

const NothingLive = ({ next, now }) => (
    <Card className="flex flex-col items-center gap-3 px-6 py-10 text-center">
        <Clock className="size-6 text-fi-accent" aria-hidden="true" />
        <p className="font-display text-xl font-semibold text-white">No matches in play right now</p>
        {next ? (
            <>
                <p className="max-w-md text-sm text-fi-muted">
                    Next kick-off <span className="font-semibold text-fi-text">{countdown(next.utc_date, now)}</span>:{' '}
                    {next.home_team?.name} vs {next.away_team?.name} ({next.competition?.name}) at{' '}
                    {formatKickoff(next.utc_date)}.
                </p>
                <Link to={`/results/${next.id}`} className="text-sm font-semibold text-fi-link">
                    Match preview →
                </Link>
            </>
        ) : (
            <p className="max-w-md text-sm text-fi-muted">No more matches scheduled today. Check the fixtures for upcoming days.</p>
        )}
    </Card>
)

const LiveScores = () => {
    const now = useNow(30_000)
    const today = toIsoDate(new Date())
    const [view, setView] = useState('live')
    const [scope, setScope] = useState('all')
    const [league, setLeague] = useState('')

    const liveQuery = useApi('live', (signal) => fetchLiveMatches(signal))
    // One day either side, filtered to the viewer's local "today".
    const dayQuery = useApi(`day:${today}`, (signal) =>
        fetchMatches({ dateFrom: toIsoDate(addDays(new Date(), -1)), dateTo: toIsoDate(addDays(new Date(), 1)) }, signal),
    )
    const { reload: reloadLive } = liveQuery
    const { reload: reloadDay } = dayQuery

    useEffect(() => {
        const id = setInterval(() => {
            reloadLive()
            reloadDay()
        }, REFRESH_MS)
        return () => clearInterval(id)
    }, [reloadLive, reloadDay])

    const refresh = () => {
        reloadLive()
        reloadDay()
    }

    // Union of the live feed and today's list (the live feed wins for status/score).
    const all = useMemo(() => {
        const byId = new Map()
        ;(dayQuery.data?.matches ?? [])
            .filter((m) => toIsoDate(new Date(m.utc_date)) === today)
            .forEach((m) => byId.set(m.id, m))
        ;(liveQuery.data?.matches ?? []).forEach((m) => byId.set(m.id, m))
        return [...byId.values()].sort((a, b) => a.utc_date.localeCompare(b.utc_date))
    }, [dayQuery.data, liveQuery.data, today])

    const inScope = useMemo(
        () =>
            all.filter((m) => {
                if (scope === 'club' && m.is_international) return false
                if (scope === 'international' && !m.is_international) return false
                if (league && m.competition?.code !== league) return false
                return true
            }),
        [all, scope, league],
    )

    const live = inScope.filter(isLive)
    const upcoming = inScope.filter((m) => m.status === 'scheduled')
    const finished = inScope.filter((m) => m.status === 'finished').reverse()
    const nextKickoff = all.find((m) => m.status === 'scheduled' && new Date(m.utc_date) > now)

    const leagues = useMemo(() => {
        const map = new Map()
        all.forEach((m) => m.competition && map.set(m.competition.code, m.competition))
        return [...map.values()].sort((a, b) => rank(a.code) - rank(b.code))
    }, [all])

    const liveGroups = useMemo(() => {
        const map = new Map()
        live.forEach((m) => {
            const code = m.competition?.code ?? 'OTHER'
            if (!map.has(code)) map.set(code, { competition: m.competition, matches: [] })
            map.get(code).matches.push(m)
        })
        return [...map.entries()].sort(([a], [b]) => rank(a) - rank(b)).map(([, g]) => g)
    }, [live])

    const loading = (liveQuery.loading && !liveQuery.data) || (dayQuery.loading && !dayQuery.data)
    const error = liveQuery.error || dayQuery.error
    const fetchedAt = liveQuery.data?.meta?.fetched_at
    const views = [
        { value: 'live', label: `Live now · ${live.length}` },
        { value: 'upcoming', label: `Upcoming today · ${upcoming.length}` },
        { value: 'finished', label: `Finished today · ${finished.length}` },
    ]

    return (
        <div className="flex flex-col gap-6">
            <header className="flex flex-wrap items-end justify-between gap-5">
                <div>
                    <Pill tone={live.length ? 'live' : 'neutral'} dot={live.length > 0}>
                        {live.length ? `${live.length} ${live.length === 1 ? 'match' : 'matches'} live now` : 'Nothing live'}
                    </Pill>
                    <h1 className="mt-3 font-display text-4xl font-bold text-white sm:text-[44px]">Live Scores</h1>
                    <p className="mt-2 text-[15px] text-fi-muted">
                        Auto-refreshing every 60 s
                        {fetchedAt && ` · Last update ${new Date(fetchedAt).toLocaleTimeString()}`} · Scores are delayed on the
                        free data tier
                    </p>
                </div>
                <Button onClick={refresh} disabled={liveQuery.loading || dayQuery.loading}>
                    <RefreshCw className={`size-4 ${liveQuery.loading ? 'animate-spin' : ''}`} aria-hidden="true" />
                    Refresh
                </Button>
            </header>

            <div className="flex flex-wrap items-center justify-between gap-3">
                <Segmented options={views} value={view} onChange={setView} label="Match status" />
                <Segmented options={SCOPES} value={scope} onChange={setScope} label="Scope" />
            </div>

            {leagues.length > 1 && (
                <div className="no-scrollbar flex items-center gap-2 overflow-x-auto">
                    <span className="shrink-0 text-[11px] font-semibold uppercase tracking-[0.12em] text-fi-muted">Leagues</span>
                    {[{ code: '', name: 'All leagues' }, ...leagues].map((c) => (
                        <button
                            key={c.code || 'all'}
                            type="button"
                            aria-pressed={league === c.code}
                            onClick={() => setLeague(c.code)}
                            className={`min-h-9 shrink-0 rounded-full border px-3.5 text-sm transition-colors ${
                                league === c.code
                                    ? 'border-fi-accent/50 bg-fi-nav text-white'
                                    : 'border-fi-border text-fi-muted hover:text-fi-text'
                            }`}
                        >
                            {c.name}
                        </button>
                    ))}
                </div>
            )}

            <StaleNotice meta={liveQuery.data?.meta} />

            {error ? (
                <ErrorState error={error} onRetry={refresh} />
            ) : loading ? (
                <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
                    {[0, 1, 2].map((i) => (
                        <Skeleton key={i} className="h-64" />
                    ))}
                </div>
            ) : view === 'live' ? (
                liveGroups.length === 0 ? (
                    <NothingLive next={nextKickoff} now={now} />
                ) : (
                    liveGroups.map(({ competition, matches }) => (
                        <section key={competition?.code ?? 'other'} className="flex flex-col gap-4" aria-label={competition?.name}>
                            <SectionHeader
                                badge={
                                    <span className="grid size-11 place-items-center rounded-xl border border-fi-border bg-fi-surface p-1.5">
                                        {competition?.emblem ? (
                                            <img src={competition.emblem} alt="" className="size-full object-contain" />
                                        ) : (
                                            <span className="text-xs font-bold text-fi-accent-light">{competition?.code}</span>
                                        )}
                                    </span>
                                }
                                title={competition?.name ?? 'Other'}
                                subtitle={`${matches.length} ${matches.length === 1 ? 'match' : 'matches'} in progress`}
                                right={
                                    competition?.type === 'LEAGUE' ? (
                                        <Link to="/fixtures" className="text-sm font-semibold text-fi-link">
                                            All fixtures
                                        </Link>
                                    ) : null
                                }
                            />
                            <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
                                {matches.map((m) => (
                                    <LiveCard key={m.id} match={m} />
                                ))}
                            </div>
                        </section>
                    ))
                )
            ) : (
                (() => {
                    const list = view === 'upcoming' ? upcoming : finished
                    if (!list.length) {
                        return (
                            <EmptyState title={view === 'upcoming' ? 'No more kick-offs today' : 'No matches finished yet today'}>
                                {view === 'upcoming' ? 'See the fixtures page for the coming days.' : 'Check back after the first full-time whistle.'}
                            </EmptyState>
                        )
                    }
                    return (
                        <Card className="flex flex-col gap-2 p-4 sm:p-5">
                            {list.map((m) => (
                                <ResultRow key={m.id} match={m} showDate={false} />
                            ))}
                        </Card>
                    )
                })()
            )}

            {view === 'live' && !loading && !error && (
                <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
                    <Card className="flex min-w-0 flex-col gap-3 p-5">
                        <SectionHeader title="Completed today" subtitle={`${finished.length} finished`} />
                        {finished.length ? (
                            finished.slice(0, 5).map((m) => <ResultRow key={m.id} match={m} showDate={false} showMeta={false} />)
                        ) : (
                            <p className="text-sm text-fi-muted">No full-time results yet today.</p>
                        )}
                        {finished.length > 5 && (
                            <button type="button" onClick={() => setView('finished')} className="self-start text-sm font-semibold text-fi-link">
                                All {finished.length} results →
                            </button>
                        )}
                    </Card>
                    <Card className="flex min-w-0 flex-col gap-3 p-5">
                        <SectionHeader
                            title="Still to come today"
                            subtitle={`${upcoming.length} scheduled`}
                            right={
                                <Link to="/fixtures" className="text-sm font-semibold text-fi-link">
                                    Full schedule
                                </Link>
                            }
                        />
                        {upcoming.length ? (
                            upcoming.slice(0, 5).map((m) => <ResultRow key={m.id} match={m} showDate={false} showMeta={false} />)
                        ) : (
                            <p className="text-sm text-fi-muted">No more kick-offs today.</p>
                        )}
                        {upcoming.length > 5 && (
                            <button type="button" onClick={() => setView('upcoming')} className="self-start text-sm font-semibold text-fi-link">
                                All {upcoming.length} kick-offs →
                            </button>
                        )}
                    </Card>
                </div>
            )}
        </div>
    )
}

export default LiveScores
