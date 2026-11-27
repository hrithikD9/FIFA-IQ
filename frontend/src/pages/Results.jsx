import React, { useMemo, useState } from 'react'
import { Link } from 'react-router-dom'
import { Search } from 'lucide-react'
import ResultRow from '../components/football/ResultRow'
import {
    Card,
    CrestBadge,
    EmptyState,
    ErrorState,
    FormChips,
    Pill,
    SectionHeader,
    Segmented,
    Skeleton,
    StaleNotice,
} from '../components/football/ui'
import { useApi } from '../hooks/useApi'
import { fetchCompetitions, fetchMatches, fetchTeamMatches } from '../services/footballApi'
import { addDays, relativeDayLabel, resultFor, toIsoDate } from '../utils/football'

const COMPETITION_ORDER = ['PD', 'CL', 'WC', 'EC', 'PL', 'BL1', 'SA', 'FL1']
const WINDOWS = [
    { value: '3', label: 'Last 3 days' },
    { value: '7', label: 'Last 7 days' },
]
const SCOPES = [
    { value: 'all', label: 'All' },
    { value: 'club', label: 'Club' },
    { value: 'international', label: 'International' },
]

const selectClass =
    'min-h-11 rounded-xl border border-fi-border bg-fi-surface px-3.5 pr-9 text-sm text-fi-text focus:border-fi-accent focus:outline-none'

const rank = (code) => {
    const i = COMPETITION_ORDER.indexOf(code)
    return i === -1 ? COMPETITION_ORDER.length : i
}

const RowsSkeleton = ({ rows = 4 }) => (
    <div className="flex flex-col gap-2">
        {Array.from({ length: rows }, (_, i) => (
            <Skeleton key={i} className="h-16 rounded-xl" />
        ))}
    </div>
)

const FeaturedClubResults = ({ teamId }) => {
    const { data, error, loading, reload } = useApi(teamId ? `team-results:${teamId}` : null, (signal) =>
        fetchTeamMatches(teamId, { status: 'finished', limit: 5 }, signal),
    )
    const matches = data?.matches ?? []
    const first = matches[0]
    const team = first && (first.home_team?.id === teamId ? first.home_team : first.away_team)
    const points = matches.reduce((sum, m) => sum + ({ W: 3, D: 1 }[resultFor(m, teamId)] ?? 0), 0)

    return (
        <Card className="flex flex-col gap-4 p-5 sm:p-6">
            <div className="flex flex-wrap items-center justify-between gap-4">
                <div className="flex items-center gap-3">
                    <CrestBadge team={team} size="lg" />
                    <div>
                        <Pill tone="accent">Featured club</Pill>
                        <h2 className="mt-1.5 font-display text-2xl font-semibold text-white">
                            {team?.name ?? 'Featured club'}
                        </h2>
                    </div>
                </div>
                {data?.form?.length > 0 && (
                    <div className="flex flex-col items-start gap-1.5 sm:items-end">
                        <p className="text-[11px] font-semibold uppercase tracking-[0.12em] text-fi-muted">Recent form</p>
                        <div className="flex items-center gap-3">
                            <FormChips form={data.form} />
                            <span className="text-sm text-fi-muted">
                                {points} / {data.form.length * 3} pts
                            </span>
                        </div>
                    </div>
                )}
            </div>

            {error ? (
                <ErrorState error={error} onRetry={reload} />
            ) : loading && !data ? (
                <RowsSkeleton rows={5} />
            ) : matches.length === 0 ? (
                <p className="text-sm text-fi-muted">No completed matches yet this season.</p>
            ) : (
                <div className="flex flex-col gap-2">
                    {matches.map((m) => (
                        <ResultRow key={m.id} match={m} perspectiveTeamId={teamId} />
                    ))}
                </div>
            )}

            {teamId && (
                <Link to={`/teams/${teamId}`} className="self-start text-sm font-semibold text-fi-link hover:text-fi-accent-light">
                    Full team page →
                </Link>
            )}
        </Card>
    )
}

const Results = () => {
    const [windowDays, setWindowDays] = useState('3')
    const [competition, setCompetition] = useState('')
    const [scope, setScope] = useState('all')
    const [search, setSearch] = useState('')

    const competitionsQuery = useApi('competitions', (signal) => fetchCompetitions(signal))
    const featuredTeamId = competitionsQuery.data?.featured_team_id

    const today = toIsoDate(new Date())
    const resultsQuery = useApi(`results:${today}:${windowDays}`, (signal) =>
        fetchMatches(
            {
                dateFrom: toIsoDate(addDays(new Date(), -(Number(windowDays) - 1))),
                dateTo: today,
                status: 'finished',
            },
            signal,
        ),
    )

    const days = useMemo(() => {
        const q = search.trim().toLowerCase()
        const filtered = (resultsQuery.data?.matches ?? []).filter((m) => {
            if (competition && m.competition?.code !== competition) return false
            if (scope === 'club' && m.is_international) return false
            if (scope === 'international' && !m.is_international) return false
            if (q) {
                const text = [m.home_team, m.away_team]
                    .flatMap((t) => [t?.name, t?.short_name, t?.tla])
                    .concat(m.competition?.name)
                    .filter(Boolean)
                    .join(' ')
                    .toLowerCase()
                if (!text.includes(q)) return false
            }
            return true
        })

        // Group by local day (newest first), then competition.
        const byDay = new Map()
        filtered.forEach((m) => {
            const day = toIsoDate(new Date(m.utc_date))
            if (!byDay.has(day)) byDay.set(day, new Map())
            const comps = byDay.get(day)
            const code = m.competition?.code ?? 'OTHER'
            if (!comps.has(code)) comps.set(code, { competition: m.competition, matches: [] })
            comps.get(code).matches.push(m)
        })
        return [...byDay.entries()]
            .sort(([a], [b]) => b.localeCompare(a))
            .map(([day, comps]) => ({
                day,
                total: [...comps.values()].reduce((n, c) => n + c.matches.length, 0),
                competitions: [...comps.entries()]
                    .sort(([a], [b]) => rank(a) - rank(b) || a.localeCompare(b))
                    .map(([, group]) => {
                        group.matches.sort((a, b) => a.utc_date.localeCompare(b.utc_date))
                        return group
                    }),
            }))
    }, [resultsQuery.data, competition, scope, search])

    const filtersActive = competition || scope !== 'all' || search

    return (
        <div className="flex flex-col gap-6">
            <header className="max-w-2xl">
                <Pill tone="win">Full time</Pill>
                <h1 className="mt-3 font-display text-4xl font-bold text-white sm:text-[44px]">Results</h1>
                <p className="mt-2 text-[15px] leading-relaxed text-fi-muted">
                    Final scores from the last few days. Open any match for its scorecard and head-to-head record.
                </p>
            </header>

            <FeaturedClubResults teamId={featuredTeamId} />

            <section className="flex flex-col gap-4" aria-label="Recent results">
                <SectionHeader title="Recent results" subtitle="All competitions on the current data plan" />

                <Card className="flex flex-wrap items-center gap-3 p-4">
                    <Segmented options={WINDOWS} value={windowDays} onChange={setWindowDays} label="Time window" />
                    <label className="relative min-w-55 flex-1">
                        <Search className="pointer-events-none absolute top-1/2 left-3.5 size-4 -translate-y-1/2 text-fi-muted" aria-hidden="true" />
                        <span className="sr-only">Search</span>
                        <input
                            type="search"
                            value={search}
                            onChange={(e) => setSearch(e.target.value)}
                            placeholder="Clubs or national teams"
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
                    <Segmented options={SCOPES} value={scope} onChange={setScope} label="Scope" />
                    <button
                        type="button"
                        disabled={!filtersActive}
                        onClick={() => {
                            setCompetition('')
                            setScope('all')
                            setSearch('')
                        }}
                        className="min-h-11 px-2 text-sm font-semibold text-fi-link disabled:text-fi-muted/50"
                    >
                        Reset
                    </button>
                </Card>

                <StaleNotice meta={resultsQuery.data?.meta} />

                {resultsQuery.error ? (
                    <ErrorState error={resultsQuery.error} onRetry={resultsQuery.reload} />
                ) : resultsQuery.loading && !resultsQuery.data ? (
                    <RowsSkeleton rows={6} />
                ) : days.length === 0 ? (
                    <EmptyState title={filtersActive ? 'No results match these filters' : 'No completed matches in this window'}>
                        {filtersActive ? 'Try clearing the filters.' : 'Try the longer time window.'}
                    </EmptyState>
                ) : (
                    days.map(({ day, total, competitions }) => (
                        <Card key={day} className="flex flex-col gap-4 p-4 sm:p-5">
                            <div className="flex items-baseline justify-between gap-3">
                                <h3 className="font-display text-lg font-semibold text-white">
                                    {relativeDayLabel(new Date(`${day}T12:00:00`))}
                                    <span className="ml-2 text-sm font-normal text-fi-muted">
                                        {new Date(`${day}T12:00:00`).toLocaleDateString(undefined, { day: 'numeric', month: 'long' })}
                                    </span>
                                </h3>
                                <span className="text-xs text-fi-muted">
                                    {total} {total === 1 ? 'match' : 'matches'}
                                </span>
                            </div>
                            {competitions.map(({ competition: comp, matches }) => (
                                <div key={comp?.code ?? 'other'} className="flex flex-col gap-2">
                                    <p className="flex items-center gap-2 text-[11px] font-semibold uppercase tracking-[0.12em] text-fi-muted">
                                        {comp?.emblem && <img src={comp.emblem} alt="" className="size-4 object-contain" />}
                                        {comp?.name ?? 'Other'}
                                    </p>
                                    {matches.map((m) => (
                                        <ResultRow key={m.id} match={m} showCompetition={false} showDate={false} />
                                    ))}
                                </div>
                            ))}
                        </Card>
                    ))
                )}
            </section>
        </div>
    )
}

export default Results
