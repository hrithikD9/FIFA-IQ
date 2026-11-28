import React, { useEffect, useMemo, useState } from 'react'
import { Link, useLocation, useNavigate } from 'react-router-dom'
import { AlertTriangle, CalendarDays, Radio, Sparkles, Trophy, Users, X } from 'lucide-react'
import ProbabilitySplit from '../components/football/ProbabilitySplit'
import ResultRow from '../components/football/ResultRow'
import { Card, CrestBadge, EmptyState, ErrorState, FormChips, Pill, SectionHeader, Skeleton } from '../components/football/ui'
import { useAuth } from '../context/useAuth'
import { useApi } from '../hooks/useApi'
import { fetchMyPredictions } from '../services/dashboardApi'
import { fetchCompetitions, fetchMatches, fetchTeamMatches } from '../services/footballApi'
import { addDays, resultFor, timeAgo, toIsoDate } from '../utils/football'

const HISTORY_PREVIEW = 5

const StatTile = ({ label, value, caption }) => (
    <Card className="flex min-h-28 flex-col justify-between gap-1 p-4">
        <p className="text-[13px] text-fi-muted">{label}</p>
        <p
            className={`truncate font-display font-bold text-white ${typeof value === 'string' ? 'text-xl sm:text-2xl' : 'text-3xl'}`}
            title={typeof value === 'string' ? value : undefined}
        >
            {value}
        </p>
        <p className="text-xs text-fi-muted">{caption}</p>
    </Card>
)

const PredictionItem = ({ p }) => {
    const home = p.home_team?.name ?? 'Home'
    const away = p.away_team?.name ?? 'Away'
    return (
        <div className="flex flex-col gap-3 rounded-xl border border-fi-border/70 bg-fi-inset p-4">
            <div className="flex flex-wrap items-baseline justify-between gap-2">
                <p className="font-display text-base font-semibold text-white">
                    {home} <span className="text-fi-muted">vs</span> {away}
                </p>
                <span className="text-xs text-fi-muted">{timeAgo(p.created_at)}</span>
            </div>
            <ProbabilitySplit
                home={p.win_prob_home}
                draw={p.draw_prob}
                away={p.win_prob_away}
                homeLabel={home}
                awayLabel={away}
            />
            {p.underdog_insight && <p className="line-clamp-2 text-[13px] text-fi-muted">{p.underdog_insight}</p>}
        </div>
    )
}

const PredictionHistory = ({ query }) => {
    const [showAll, setShowAll] = useState(false)
    const list = query.data ?? []
    return (
        <Card className="flex flex-col gap-4 p-5 sm:p-6">
            <SectionHeader
                title="Your prediction history"
                subtitle="Predictions you saved from Match Prediction"
                right={
                    <Link to="/predict" className="text-sm font-semibold text-fi-link hover:text-fi-accent-light">
                        New prediction →
                    </Link>
                }
            />
            {query.error ? (
                <ErrorState error={query.error} onRetry={query.reload} />
            ) : query.loading && !query.data ? (
                <Skeleton className="h-48" />
            ) : list.length === 0 ? (
                <EmptyState title="No saved predictions yet">
                    Run a prediction for an international match and save it — it will appear here.
                </EmptyState>
            ) : (
                <>
                    <div className="flex flex-col gap-3">
                        {(showAll ? list : list.slice(0, HISTORY_PREVIEW)).map((p) => (
                            <PredictionItem key={p.id} p={p} />
                        ))}
                    </div>
                    {list.length > HISTORY_PREVIEW && (
                        <button
                            type="button"
                            onClick={() => setShowAll(!showAll)}
                            className="self-start text-sm font-semibold text-fi-link hover:text-fi-accent-light"
                        >
                            {showAll ? 'Show fewer' : `Show all ${list.length}`}
                        </button>
                    )}
                </>
            )}
        </Card>
    )
}

const FeaturedClub = ({ teamId }) => {
    const results = useApi(teamId ? `team-finished:${teamId}` : null, (signal) =>
        fetchTeamMatches(teamId, { status: 'finished', limit: 10 }, signal),
    )
    const fixtures = useApi(teamId ? `team-scheduled:${teamId}` : null, (signal) =>
        fetchTeamMatches(teamId, { status: 'scheduled', limit: 10 }, signal),
    )
    const recent = (results.data?.matches ?? []).slice(0, 5)
    const next = fixtures.data?.matches?.[0]
    const last = recent[0]
    const team = last && (last.home_team?.id === teamId ? last.home_team : last.away_team)
    const form = recent.map((m) => resultFor(m, teamId)).filter(Boolean)

    return (
        <Card className="flex flex-col gap-4 p-5">
            <div className="flex items-center gap-3">
                <CrestBadge team={team} size="lg" />
                <div className="min-w-0">
                    <Pill tone="accent">Featured club</Pill>
                    <p className="mt-1 truncate font-display text-xl font-semibold text-white">{team?.name ?? 'Featured club'}</p>
                </div>
            </div>
            {results.error || fixtures.error ? (
                <p className="text-sm text-fi-muted">Club data is temporarily unavailable.</p>
            ) : !results.data || !fixtures.data ? (
                <Skeleton className="h-40" />
            ) : (
                <>
                    {form.length > 0 && (
                        <div className="flex items-center justify-between gap-3">
                            <span className="text-[11px] font-semibold uppercase tracking-[0.12em] text-fi-muted">Form</span>
                            <FormChips form={form} />
                        </div>
                    )}
                    {next && (
                        <div className="flex flex-col gap-2">
                            <p className="text-[11px] font-semibold uppercase tracking-[0.12em] text-fi-muted">Next match</p>
                            <ResultRow match={next} compact />
                        </div>
                    )}
                    {last && (
                        <div className="flex flex-col gap-2">
                            <p className="text-[11px] font-semibold uppercase tracking-[0.12em] text-fi-muted">Latest result</p>
                            <ResultRow match={last} perspectiveTeamId={teamId} compact />
                        </div>
                    )}
                </>
            )}
            <Link to={`/teams/${teamId}`} className="text-sm font-semibold text-fi-link hover:text-fi-accent-light">
                Team page →
            </Link>
        </Card>
    )
}

const MatchListCard = ({ title, subtitle, query, link, empty, finished }) => {
    const matches = (query.data?.matches ?? [])
        .filter((m) => (finished ? m.status === 'finished' : m.status === 'scheduled'))
        .sort((a, b) => (finished ? b.utc_date.localeCompare(a.utc_date) : a.utc_date.localeCompare(b.utc_date)))
        .slice(0, 6)
    return (
        <Card className="flex min-w-0 flex-col gap-3 p-5">
            <SectionHeader
                title={title}
                subtitle={subtitle}
                right={
                    <Link to={link} className="text-sm font-semibold text-fi-link hover:text-fi-accent-light">
                        See all
                    </Link>
                }
            />
            {query.error ? (
                <p className="text-sm text-fi-muted">Couldn&apos;t load matches right now.</p>
            ) : query.loading && !query.data ? (
                <Skeleton className="h-56" />
            ) : matches.length === 0 ? (
                <p className="text-sm text-fi-muted">{empty}</p>
            ) : (
                matches.map((m) => <ResultRow key={m.id} match={m} showMeta={false} />)
            )}
        </Card>
    )
}

const QUICK_LINKS = [
    { to: '/live', label: 'Live scores', text: 'Matches in play now', icon: Radio },
    { to: '/fixtures', label: 'Fixtures', text: 'Schedule by day', icon: CalendarDays },
    { to: '/players', label: 'Top scorers', text: 'League player rankings', icon: Trophy },
    { to: '/predict', label: 'Match prediction', text: 'International matches', icon: Sparkles },
]

const UserDashboard = () => {
    const { user } = useAuth()
    const navigate = useNavigate()
    const location = useLocation()
    const [deniedMessage, setDeniedMessage] = useState(() =>
        location.state?.accessDenied ? location.state.message || 'Access denied: admin privileges required.' : null,
    )
    // Clear navigation state so the banner doesn't return on refresh.
    useEffect(() => {
        if (location.state?.accessDenied) navigate(location.pathname, { replace: true, state: {} })
    }, [location.pathname, location.state?.accessDenied, navigate])

    const firstName = user?.firstName || user?.email?.split('@')[0] || 'there'
    const today = toIsoDate(new Date())

    const predictions = useApi('my-predictions', (signal) => fetchMyPredictions(signal))
    const competitions = useApi('competitions', (signal) => fetchCompetitions(signal))
    const featuredTeamId = competitions.data?.featured_team_id
    const upcoming = useApi(`dash-upcoming:${today}`, (signal) =>
        fetchMatches({ dateFrom: today, dateTo: toIsoDate(addDays(new Date(), 6)), competitions: 'PD,CL,WC,EC' }, signal),
    )
    const recentResults = useApi(`dash-results:${today}`, (signal) =>
        fetchMatches({ dateFrom: toIsoDate(addDays(new Date(), -3)), dateTo: today, status: 'finished', competitions: 'PD,CL,PL' }, signal),
    )

    const stats = useMemo(() => {
        const list = predictions.data ?? []
        const teamCounts = new Map()
        list.forEach((p) =>
            [p.home_team?.name, p.away_team?.name].filter(Boolean).forEach((n) => teamCounts.set(n, (teamCounts.get(n) ?? 0) + 1)),
        )
        const top = [...teamCounts.entries()].sort((a, b) => b[1] - a[1])[0]
        return {
            total: list.length,
            teams: teamCounts.size,
            top,
            last: list[0]?.created_at,
        }
    }, [predictions.data])

    return (
        <div className="flex flex-col gap-6">
            {deniedMessage && (
                <div role="alert" className="flex items-start gap-3 rounded-2xl border border-fi-loss/40 bg-fi-loss/10 px-5 py-4">
                    <AlertTriangle className="mt-0.5 size-5 shrink-0 text-fi-loss" aria-hidden="true" />
                    <p className="text-sm text-fi-loss">{deniedMessage}</p>
                    <button
                        type="button"
                        onClick={() => setDeniedMessage(null)}
                        aria-label="Dismiss"
                        className="ml-auto rounded-md p-1 text-fi-loss/80 hover:bg-fi-loss/10"
                    >
                        <X className="size-4" aria-hidden="true" />
                    </button>
                </div>
            )}

            <header className="flex flex-wrap items-end justify-between gap-4">
                <div>
                    <Pill tone="accent">Your dashboard</Pill>
                    <h1 className="mt-3 font-display text-4xl font-bold text-white sm:text-[44px]">Welcome back, {firstName}</h1>
                    <p className="mt-2 text-[15px] text-fi-muted">
                        {new Date().toLocaleDateString(undefined, { weekday: 'long', day: 'numeric', month: 'long' })}
                    </p>
                </div>
                <Link
                    to="/predict"
                    className="inline-flex min-h-11 items-center gap-2 rounded-xl bg-fi-accent px-4 text-sm font-semibold text-[#11152A] hover:bg-fi-accent-light"
                >
                    <Sparkles className="size-4" aria-hidden="true" /> New prediction
                </Link>
            </header>

            <div className="grid grid-cols-2 gap-3 lg:grid-cols-4">
                <StatTile label="Saved predictions" value={predictions.data ? stats.total : '—'} caption="All time" />
                <StatTile label="Teams analysed" value={predictions.data ? stats.teams : '—'} caption="Across your predictions" />
                <StatTile
                    label="Most analysed"
                    value={stats.top?.[0] ?? '—'}
                    caption={stats.top ? `${stats.top[1]} prediction${stats.top[1] === 1 ? '' : 's'}` : 'No predictions yet'}
                />
                <StatTile label="Last prediction" value={stats.last ? timeAgo(stats.last) : '—'} caption="Most recent save" />
            </div>

            <div className="grid grid-cols-1 gap-6 lg:grid-cols-[minmax(0,1fr)_340px]">
                <div className="min-w-0">
                    <PredictionHistory query={predictions} />
                </div>
                {featuredTeamId ? <FeaturedClub teamId={featuredTeamId} /> : <Skeleton className="h-80" />}
            </div>

            <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
                <MatchListCard
                    title="Upcoming fixtures"
                    subtitle="La Liga, Champions League & international · next 7 days"
                    query={upcoming}
                    link="/fixtures"
                    empty="No fixtures in these competitions this week."
                />
                <MatchListCard
                    title="Recent results"
                    subtitle="La Liga, Champions League & Premier League · last 3 days"
                    query={recentResults}
                    link="/results"
                    empty="No results in the last few days."
                    finished
                />
            </div>

            <section aria-label="Quick links" className="grid grid-cols-2 gap-3 lg:grid-cols-4">
                {QUICK_LINKS.map((q) => (
                    <Link
                        key={q.to}
                        to={q.to}
                        className="flex items-center gap-3 rounded-2xl border border-fi-border bg-fi-surface p-4 transition-colors hover:border-fi-accent/40"
                    >
                        <span className="grid size-10 shrink-0 place-items-center rounded-xl bg-fi-accent/10 text-fi-accent">
                            <q.icon className="size-5" aria-hidden="true" />
                        </span>
                        <span className="min-w-0">
                            <span className="block font-semibold text-white">{q.label}</span>
                            <span className="block truncate text-xs text-fi-muted">{q.text}</span>
                        </span>
                    </Link>
                ))}
                {featuredTeamId && (
                    <Link
                        to={`/teams/${featuredTeamId}?tab=squad`}
                        className="col-span-2 flex items-center gap-3 rounded-2xl border border-fi-border bg-fi-surface p-4 transition-colors hover:border-fi-accent/40 lg:col-span-4"
                    >
                        <span className="grid size-10 shrink-0 place-items-center rounded-xl bg-fi-accent/10 text-fi-accent">
                            <Users className="size-5" aria-hidden="true" />
                        </span>
                        <span className="font-semibold text-white">FC Barcelona squad</span>
                        <span className="ml-auto text-sm text-fi-link">Browse players →</span>
                    </Link>
                )}
            </section>
        </div>
    )
}

export default UserDashboard
