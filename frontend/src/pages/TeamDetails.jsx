import React, { useMemo, useState } from 'react'
import { Link, Navigate, useParams, useSearchParams } from 'react-router-dom'
import { ExternalLink, Lock } from 'lucide-react'
import ResultRow from '../components/football/ResultRow'
import {
    Card,
    CrestBadge,
    EmptyState,
    ErrorState,
    FormChips,
    Inset,
    Pill,
    PlayerAvatar,
    Segmented,
    Skeleton,
    StaleNotice,
} from '../components/football/ui'
import { useApi } from '../hooks/useApi'
import { fetchCompetitions, fetchStandings, fetchTeam, fetchTeamMatches } from '../services/footballApi'
import { formatKickoff, formatMatchDate, ordinal, resultFor } from '../utils/football'

const TABS = [
    { value: 'overview', label: 'Overview' },
    { value: 'squad', label: 'Squad' },
    { value: 'fixtures', label: 'Fixtures' },
    { value: 'results', label: 'Results' },
]

const POSITION_FILTERS = [
    { value: 'all', label: 'All' },
    { value: 'GK', label: 'GK' },
    { value: 'DEF', label: 'DEF' },
    { value: 'MID', label: 'MID' },
    { value: 'ATT', label: 'ATT' },
]

const GROUP_LABELS = { GK: 'Goalkeepers', DEF: 'Defenders', MID: 'Midfielders', ATT: 'Forwards' }
const GROUP_TONES = { GK: 'draw', DEF: 'accent', MID: 'win', ATT: 'momentum' }
const GROUP_ORDER = ['GK', 'DEF', 'MID', 'ATT', null]

/** /teams → the featured club. */
export const TeamsIndex = () => {
    const { data, error, reload } = useApi('competitions', (signal) => fetchCompetitions(signal))
    if (error) return <ErrorState error={error} onRetry={reload} />
    if (!data) return <Skeleton className="h-72" />
    return <Navigate to={`/teams/${data.featured_team_id}`} replace />
}

const StatTile = ({ label, value, caption, tone = 'text-white' }) => (
    <Card className="flex min-h-28 flex-col justify-between p-4">
        <p className="text-[13px] text-fi-muted">{label}</p>
        <p className={`font-display text-3xl font-bold tabular-nums ${tone}`}>{value}</p>
        <p className="min-h-4 text-xs text-fi-muted">{caption}</p>
    </Card>
)

const pct = (n, d) => (d ? `${((n / d) * 100).toFixed(1)}%` : '—')
const perGame = (n, d) => (d ? `${(n / d).toFixed(2)} per game` : '')

const SeasonStats = ({ row, league }) => {
    if (!row) {
        return (
            <Card className="p-5 text-sm text-fi-muted">
                Season statistics come from the league table, which isn&apos;t available for this team.
            </Card>
        )
    }
    const gd = row.goal_difference
    return (
        <section aria-label="Season statistics" className="flex flex-col gap-3">
            <p className="text-[11px] font-semibold uppercase tracking-[0.12em] text-fi-muted">
                {league?.name} · this season
            </p>
            <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
                <StatTile label="Position" value={ordinal(row.position)} caption={`${row.points} pts`} tone="text-fi-accent-light" />
                <StatTile label="Played" value={row.played} caption="league matches" />
                <StatTile label="Wins" value={row.won} caption={pct(row.won, row.played)} tone="text-fi-win" />
                <StatTile label="Draws" value={row.draw} caption={pct(row.draw, row.played)} />
                <StatTile label="Losses" value={row.lost} caption={pct(row.lost, row.played)} tone="text-fi-loss" />
                <StatTile label="Goals for" value={row.goals_for} caption={perGame(row.goals_for, row.played)} />
                <StatTile label="Conceded" value={row.goals_against} caption={perGame(row.goals_against, row.played)} />
                <StatTile label="Goal diff" value={gd > 0 ? `+${gd}` : gd} caption="" />
            </div>
        </section>
    )
}

const PlayerCard = ({ player }) => (
    <Link
        to={`/players/${player.id}`}
        className="flex flex-col gap-4 rounded-2xl border border-fi-border bg-fi-surface p-4 transition-colors hover:border-fi-accent/40"
    >
        <div className="flex items-center gap-3">
            <PlayerAvatar name={player.name} />
            <div className="min-w-0 flex-1">
                <p className="font-display text-base leading-snug font-semibold text-white">{player.name}</p>
                <p className="mt-1 flex flex-wrap items-center gap-2 text-[13px] text-fi-muted">
                    {player.position_group && <Pill tone={GROUP_TONES[player.position_group]}>{player.position_group}</Pill>}
                    {player.nationality ?? 'Nationality unknown'}
                </p>
            </div>
        </div>
        <Inset className="grid grid-cols-2 divide-x divide-fi-border/70 py-2.5 text-center">
            <div>
                <p className="font-display text-lg font-bold text-white">{player.age ?? '—'}</p>
                <p className="text-[11px] text-fi-muted">Age</p>
            </div>
            <div>
                <p className="font-display text-lg font-bold text-white">{player.date_of_birth?.slice(0, 4) ?? '—'}</p>
                <p className="text-[11px] text-fi-muted">Born</p>
            </div>
        </Inset>
        <span className="text-sm font-semibold text-fi-link">Inspect →</span>
    </Link>
)

const Squad = ({ squad, grouped, previewLimit, onShowAll }) => {
    const [filter, setFilter] = useState('all')
    const players = filter === 'all' ? squad : squad.filter((p) => p.position_group === filter)
    const counts = useMemo(() => {
        const c = { all: squad.length }
        squad.forEach((p) => {
            if (p.position_group) c[p.position_group] = (c[p.position_group] ?? 0) + 1
        })
        return c
    }, [squad])

    if (!squad.length) return <EmptyState title="No squad data for this team" />

    const sorted = [...players].sort(
        (a, b) =>
            GROUP_ORDER.indexOf(a.position_group) - GROUP_ORDER.indexOf(b.position_group) || a.name.localeCompare(b.name),
    )

    return (
        <div className="flex flex-col gap-4">
            <Segmented
                options={POSITION_FILTERS.map((o) => ({ ...o, label: `${o.label} · ${counts[o.value] ?? 0}` }))}
                value={filter}
                onChange={setFilter}
                label="Position"
                className="self-start"
            />
            {grouped && filter === 'all' ? (
                GROUP_ORDER.map((group) => {
                    const list = sorted.filter((p) => p.position_group === group)
                    if (!list.length) return null
                    return (
                        <div key={group ?? 'other'} className="flex flex-col gap-3">
                            <p className="text-[11px] font-semibold uppercase tracking-[0.12em] text-fi-muted">
                                {GROUP_LABELS[group] ?? 'Position not listed'}
                            </p>
                            <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-3">
                                {list.map((p) => (
                                    <PlayerCard key={p.id} player={p} />
                                ))}
                            </div>
                        </div>
                    )
                })
            ) : (
                <>
                    <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-3">
                        {(previewLimit ? sorted.slice(0, previewLimit) : sorted).map((p) => (
                            <PlayerCard key={p.id} player={p} />
                        ))}
                    </div>
                    {previewLimit && sorted.length > previewLimit && (
                        <button
                            type="button"
                            onClick={onShowAll}
                            className="self-start text-sm font-semibold text-fi-link hover:text-fi-accent-light"
                        >
                            View full squad ({sorted.length}) →
                        </button>
                    )}
                </>
            )}
        </div>
    )
}

const NextMatch = ({ match, teamId }) => {
    if (!match) return null
    const opponent = match.home_team?.id === teamId ? match.away_team : match.home_team
    const home = match.home_team?.id === teamId
    return (
        <Card className="flex flex-col gap-4 p-5">
            <div className="flex items-center justify-between gap-2">
                <p className="flex items-center gap-2 text-[11px] font-semibold uppercase tracking-[0.12em] text-fi-accent">
                    <span className="size-1.5 rounded-full bg-current" aria-hidden="true" /> Next match
                </p>
                <span className="truncate text-xs text-fi-muted">{match.competition?.name}</span>
            </div>
            <Inset className="flex items-center justify-between gap-3 p-4">
                <div className="flex min-w-0 flex-col items-center gap-1.5 text-center">
                    <CrestBadge team={match.home_team} />
                    <span className="max-w-24 truncate text-sm font-semibold text-white">{match.home_team?.short_name}</span>
                </div>
                <div className="text-center">
                    <p className="font-display text-2xl font-bold text-white">{formatKickoff(match.utc_date)}</p>
                    <p className="text-xs text-fi-muted">{formatMatchDate(match.utc_date)}</p>
                </div>
                <div className="flex min-w-0 flex-col items-center gap-1.5 text-center">
                    <CrestBadge team={match.away_team} />
                    <span className="max-w-24 truncate text-sm font-semibold text-white">{match.away_team?.short_name}</span>
                </div>
            </Inset>
            <p className="text-center text-xs text-fi-muted">
                {home ? 'Home' : 'Away'} vs {opponent?.name}
            </p>
            <Link
                to={`/results/${match.id}`}
                className="inline-flex min-h-11 items-center justify-center rounded-xl bg-fi-accent text-sm font-semibold text-[#11152A] hover:bg-fi-accent-light"
            >
                Match preview & head-to-head
            </Link>
        </Card>
    )
}

const LeagueTable = ({ standings, teamId }) => {
    const table = standings?.tables?.find((t) => t.type === 'TOTAL')
    if (!table) return null
    const rows = table.rows
    const idx = rows.findIndex((r) => r.team?.id === teamId)
    // Top four, plus the team's neighbourhood if it sits lower down.
    const visible = idx <= 4 ? rows.slice(0, 5) : [...rows.slice(0, 3), null, ...rows.slice(idx - 1, idx + 2)]

    return (
        <Card className="flex flex-col gap-3 p-5">
            <p className="text-[11px] font-semibold uppercase tracking-[0.12em] text-fi-muted">
                {standings.competition?.name} · table
            </p>
            <table className="w-full text-sm">
                <thead>
                    <tr className="text-[11px] uppercase tracking-wider text-fi-muted">
                        <th className="w-7 py-1.5 text-left font-semibold">#</th>
                        <th className="py-1.5 text-left font-semibold">Club</th>
                        <th className="py-1.5 text-right font-semibold">GP</th>
                        <th className="py-1.5 text-right font-semibold">GD</th>
                        <th className="py-1.5 text-right font-semibold">Pts</th>
                    </tr>
                </thead>
                <tbody>
                    {visible.map((r, i) =>
                        r === null ? (
                            <tr key={`gap-${i}`} aria-hidden="true">
                                <td colSpan={5} className="py-1 text-center text-fi-muted">
                                    ⋯
                                </td>
                            </tr>
                        ) : (
                            <tr
                                key={r.team.id}
                                className={r.team.id === teamId ? 'bg-fi-accent/10 font-semibold text-white' : 'text-fi-text'}
                            >
                                <td className="rounded-l-lg py-2 pl-1.5 text-fi-muted">{r.position}</td>
                                <td className="max-w-0 truncate py-2">
                                    <Link to={`/teams/${r.team.id}`} className="hover:text-fi-accent-light">
                                        {r.team.short_name}
                                    </Link>
                                </td>
                                <td className="py-2 text-right tabular-nums">{r.played}</td>
                                <td className="py-2 text-right tabular-nums">
                                    {r.goal_difference > 0 ? `+${r.goal_difference}` : r.goal_difference}
                                </td>
                                <td className="rounded-r-lg py-2 pr-1.5 text-right font-semibold tabular-nums">{r.points}</td>
                            </tr>
                        ),
                    )}
                </tbody>
            </table>
        </Card>
    )
}

const MatchList = ({ query, teamId, empty }) => {
    if (query.error) return <ErrorState error={query.error} onRetry={query.reload} />
    if (query.loading && !query.data) return <Skeleton className="h-64" />
    const matches = query.data?.matches ?? []
    if (!matches.length) return <EmptyState title={empty} />
    return (
        <div className="flex flex-col gap-2">
            {matches.map((m) => (
                <ResultRow key={m.id} match={m} perspectiveTeamId={teamId} />
            ))}
        </div>
    )
}

const TeamDetails = () => {
    const { teamId: rawId } = useParams()
    const [params, setParams] = useSearchParams()
    const tab = TABS.some((t) => t.value === params.get('tab')) ? params.get('tab') : 'overview'
    const valid = /^\d+$/.test(rawId ?? '')
    const teamId = valid ? Number(rawId) : null

    const teamQuery = useApi(valid ? `team:${teamId}` : null, (signal) => fetchTeam(teamId, signal))
    const resultsQuery = useApi(valid ? `team-finished:${teamId}` : null, (signal) =>
        fetchTeamMatches(teamId, { status: 'finished', limit: 10 }, signal),
    )
    const fixturesQuery = useApi(valid ? `team-scheduled:${teamId}` : null, (signal) =>
        fetchTeamMatches(teamId, { status: 'scheduled', limit: 10 }, signal),
    )

    const team = teamQuery.data?.team
    const league = team?.competitions?.find((c) => c.type === 'LEAGUE')
    const standingsQuery = useApi(league ? `standings:${league.code}` : null, (signal) => fetchStandings(league.code, signal))
    const tableRow = standingsQuery.data?.tables
        ?.find((t) => t.type === 'TOTAL')
        ?.rows.find((r) => r.team?.id === teamId)

    const recent = (resultsQuery.data?.matches ?? []).slice(0, 5)
    const form = recent.map((m) => resultFor(m, teamId)).filter(Boolean)
    const formPoints = form.reduce((sum, r) => sum + ({ W: 3, D: 1 }[r] ?? 0), 0)

    const setTab = (value) => {
        const next = new URLSearchParams(params)
        if (value === 'overview') next.delete('tab')
        else next.set('tab', value)
        setParams(next, { replace: true })
    }

    if (!valid) return <ErrorState error={{ message: 'This team link is not valid.' }} />

    if (teamQuery.error?.status === 403) {
        return (
            <Card className="flex flex-col items-center gap-3 px-6 py-12 text-center">
                <Lock className="size-6 text-fi-accent" aria-hidden="true" />
                <p className="font-display text-xl font-semibold text-white">Team profile not on the free data plan</p>
                <p className="max-w-md text-sm text-fi-muted">
                    National team profiles and squads need a paid football-data.org plan. Their fixtures, results and
                    head-to-head records are still available.
                </p>
                <Link to="/results" className="text-sm font-semibold text-fi-link">
                    Browse results →
                </Link>
            </Card>
        )
    }
    if (teamQuery.error) return <ErrorState error={teamQuery.error} onRetry={teamQuery.reload} />
    if (!team) {
        return (
            <div className="flex flex-col gap-6">
                <Skeleton className="h-48" />
                <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
                    {Array.from({ length: 8 }, (_, i) => (
                        <Skeleton key={i} className="h-28" />
                    ))}
                </div>
            </div>
        )
    }

    const nextMatch = fixturesQuery.data?.matches?.[0]
    const lastMatch = recent[0]
    const facts = [
        [team.area?.name, league?.name].filter(Boolean).join(' · '),
        team.venue,
        team.coach && `Coach: ${team.coach.name}`,
        team.founded && `Founded ${team.founded}`,
    ].filter(Boolean)

    return (
        <div className="flex flex-col gap-6">
            <nav aria-label="Breadcrumb" className="text-sm text-fi-muted">
                <Link to="/fixtures" className="hover:text-fi-text">
                    Football
                </Link>
                <span className="mx-2">/</span>
                <span>Teams</span>
                <span className="mx-2">/</span>
                <span className="text-white">{team.name}</span>
            </nav>

            <Card className="flex flex-col gap-6 p-5 sm:p-8 lg:flex-row lg:items-center">
                <CrestBadge team={team} size="xl" />
                <div className="flex min-w-0 flex-1 flex-col gap-3">
                    <div className="flex flex-wrap items-center gap-3">
                        <h1 className="font-display text-3xl font-bold text-white sm:text-[40px]">{team.name}</h1>
                        {team.is_featured && <Pill tone="accent">Featured club</Pill>}
                    </div>
                    <p className="flex flex-wrap gap-x-5 gap-y-1 text-[15px] text-fi-text">
                        {facts.map((f) => (
                            <span key={f}>{f}</span>
                        ))}
                    </p>
                    {form.length > 0 && (
                        <div className="flex flex-wrap items-center gap-3">
                            <span className="text-[11px] font-semibold uppercase tracking-[0.12em] text-fi-muted">Recent form</span>
                            <FormChips form={form} />
                            <span className="text-sm text-fi-muted">
                                {formPoints} / {form.length * 3} pts
                            </span>
                        </div>
                    )}
                </div>
                <div className="flex flex-col gap-2 text-sm lg:items-end">
                    {team.club_colors && <span className="text-fi-muted">Colours: {team.club_colors}</span>}
                    {team.website && (
                        <a
                            href={team.website}
                            target="_blank"
                            rel="noreferrer noopener"
                            className="inline-flex items-center gap-1.5 font-semibold text-fi-link hover:text-fi-accent-light"
                        >
                            Official website <ExternalLink className="size-3.5" aria-hidden="true" />
                        </a>
                    )}
                </div>
            </Card>

            <Segmented options={TABS} value={tab} onChange={setTab} label="Team sections" className="self-start" />

            <StaleNotice meta={teamQuery.data?.meta} />

            {tab === 'overview' && (
                <>
                    {standingsQuery.loading && !standingsQuery.data ? (
                        <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
                            {Array.from({ length: 8 }, (_, i) => (
                                <Skeleton key={i} className="h-28" />
                            ))}
                        </div>
                    ) : (
                        <SeasonStats row={tableRow} league={league} />
                    )}

                    <div className="grid grid-cols-1 gap-6 lg:grid-cols-[minmax(0,1fr)_340px]">
                        <section aria-label="Squad" className="flex min-w-0 flex-col gap-4">
                            <div className="flex flex-wrap items-baseline gap-3">
                                <h2 className="font-display text-xl font-semibold text-white">Squad</h2>
                                <Pill>{team.squad.length} registered</Pill>
                                <span className="text-[13px] text-fi-muted">Select a player for their profile.</span>
                            </div>
                            <Squad squad={team.squad} previewLimit={6} onShowAll={() => setTab('squad')} />
                        </section>

                        <aside className="flex flex-col gap-6">
                            <NextMatch match={nextMatch} teamId={teamId} />
                            {lastMatch && (
                                <Card className="flex flex-col gap-3 p-5">
                                    <p className="text-[11px] font-semibold uppercase tracking-[0.12em] text-fi-muted">Latest result</p>
                                    <ResultRow match={lastMatch} perspectiveTeamId={teamId} compact />
                                </Card>
                            )}
                            <LeagueTable standings={standingsQuery.data} teamId={teamId} />
                        </aside>
                    </div>
                </>
            )}

            {tab === 'squad' && <Squad squad={team.squad} grouped />}
            {tab === 'fixtures' && <MatchList query={fixturesQuery} teamId={teamId} empty="No upcoming matches scheduled" />}
            {tab === 'results' && <MatchList query={resultsQuery} teamId={teamId} empty="No completed matches yet this season" />}
        </div>
    )
}

export default TeamDetails
