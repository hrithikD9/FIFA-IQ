import React, { useState } from 'react'
import { Link, useParams } from 'react-router-dom'
import { ArrowLeft, Info } from 'lucide-react'
import ResultRow from '../components/football/ResultRow'
import { Card, CrestBadge, EmptyState, ErrorState, Inset, Pill, PlayerAvatar, Skeleton, StaleNotice } from '../components/football/ui'
import { useApi } from '../hooks/useApi'
import { fetchPlayer, fetchScorers, fetchTeamMatches } from '../services/footballApi'
import { ordinal } from '../utils/football'

const SCORERS_LIMIT = 100 // shares the backend's cached scorers response
const GROUP_TONES = { GK: 'draw', DEF: 'accent', MID: 'win', ATT: 'momentum' }

/** "1.76 m (5 ft 9 1⁄2 in)" -> "1.76 m" */
const shortHeight = (h) => (h ? h.split(' (')[0] : null)

/** TheSportsDB weights are often in lbs; show kg. */
const toKg = (w) => {
    if (!w) return null
    const lbs = w.match(/([\d.]+)\s*lbs?/i)
    if (lbs) return `${Math.round(Number(lbs[1]) * 0.4536)} kg`
    const kg = w.match(/([\d.]+)\s*kg/i)
    return kg ? `${Math.round(Number(kg[1]))} kg` : w
}

const formatMonth = (yyyyMm) => {
    if (!yyyyMm) return null
    const [y, m] = yyyyMm.split('-').map(Number)
    return new Date(y, (m || 1) - 1, 1).toLocaleDateString(undefined, { month: 'short', year: 'numeric' })
}

const Fact = ({ label, value }) =>
    value ? (
        <span className="inline-flex min-h-10 items-center gap-2 rounded-xl border border-fi-border bg-fi-inset px-3 text-sm">
            <span className="text-[11px] font-semibold uppercase tracking-[0.12em] text-fi-muted">{label}</span>
            <span className="font-semibold text-white">{value}</span>
        </span>
    ) : null

const StatTile = ({ label, value, caption, bar }) => (
    <Card className="flex min-h-32 flex-col gap-2 p-4">
        <p className="text-[13px] text-fi-muted">{label}</p>
        <p className="font-display text-3xl font-bold tabular-nums text-white">{value}</p>
        <p className="text-xs text-fi-muted">{caption}</p>
        {bar != null && (
            <div className="mt-auto h-1.5 overflow-hidden rounded-full bg-white/[0.06]" aria-hidden="true">
                <div className="h-full rounded-full bg-fi-accent" style={{ width: `${Math.min(100, bar * 100)}%` }} />
            </div>
        )}
    </Card>
)

const Bio = ({ text }) => {
    const [open, setOpen] = useState(false)
    if (!text) return null
    const short = text.length > 420 && !open
    return (
        <Card className="flex flex-col gap-3 p-5 sm:p-6">
            <p className="text-[11px] font-semibold uppercase tracking-[0.12em] text-fi-muted">Profile</p>
            <p className="text-[15px] leading-relaxed text-fi-text">{short ? `${text.slice(0, 420).trimEnd()}…` : text}</p>
            <div className="flex flex-wrap items-center justify-between gap-2">
                {text.length > 420 && (
                    <button type="button" onClick={() => setOpen(!open)} className="text-sm font-semibold text-fi-link">
                        {open ? 'Show less' : 'Read more'}
                    </button>
                )}
                <span className="text-xs text-fi-muted">Source: TheSportsDB</span>
            </div>
        </Card>
    )
}

const rate = (s) => (s?.played ? (s.goals / s.played).toFixed(2) : '—')

const BenchmarkSide = ({ s, name, align }) => (
    <div className={`flex min-w-0 flex-1 flex-col gap-1 ${align === 'right' ? 'items-end text-right' : ''}`}>
        <PlayerAvatar name={name} size="sm" />
        <p className="w-full truncate font-semibold text-white">{name}</p>
        <p className="text-sm text-fi-muted">
            <span className="font-semibold text-fi-accent-light">{s?.goals ?? 0}</span> goals ·{' '}
            <span className="font-semibold text-fi-text">{s?.assists ?? 0}</span> ast
        </p>
        <p className="text-xs text-fi-muted">{rate(s)} goals / match</p>
    </div>
)

/** Compare against the league's leading scorer (or the runner-up, if this is the leader). */
const Benchmark = ({ player, league, scorers }) => {
    if (!league || !scorers?.length) return null
    const mine = scorers.find((s) => s.player.id === player.id)
    const other = scorers.find((s) => s.player.id !== player.id)
    if (!other) return null
    const isLeader = mine && scorers[0].player.id === player.id

    return (
        <Card className="flex flex-col gap-4 p-5">
            <div className="flex items-center justify-between gap-2">
                <p className="text-[11px] font-semibold uppercase tracking-[0.12em] text-fi-muted">Benchmark</p>
                <Pill tone="accent">{isLeader ? `Leading ${league.name}` : `vs ${league.name} leader`}</Pill>
            </div>
            <Inset className="flex items-center gap-3 p-4">
                <BenchmarkSide s={mine} name={player.name} />
                <span className="text-sm font-semibold text-fi-muted">vs</span>
                <BenchmarkSide s={other} name={other.player.name} align="right" />
            </Inset>
            <Link to={`/players/${other.player.id}`} className="text-sm font-semibold text-fi-link hover:text-fi-accent-light">
                View {other.player.name} →
            </Link>
        </Card>
    )
}

const PlayerDetails = () => {
    const { playerId } = useParams()
    const valid = /^\d+$/.test(playerId ?? '')
    const { data, error, loading, reload } = useApi(valid ? `player:${playerId}` : null, (signal) => fetchPlayer(playerId, signal))

    const player = data?.player
    const team = player?.current_team
    const league = data?.season_stats?.find((s) => s.competition?.type === 'LEAGUE')?.competition
    const leagueCode = league?.code ?? null

    const scorersQuery = useApi(leagueCode ? `scorers:${leagueCode}` : null, (signal) =>
        fetchScorers(leagueCode, SCORERS_LIMIT, signal),
    )
    const nextQuery = useApi(team?.id ? `team-scheduled1:${team.id}` : null, (signal) =>
        fetchTeamMatches(team.id, { status: 'scheduled', limit: 1 }, signal),
    )

    if (!valid) return <ErrorState error={{ message: 'This player link is not valid.' }} />
    if (error) return <ErrorState error={error} onRetry={reload} />
    if (loading || !player) {
        return (
            <div className="flex flex-col gap-6">
                <Skeleton className="h-64" />
                <div className="grid grid-cols-2 gap-3 lg:grid-cols-3">
                    {Array.from({ length: 6 }, (_, i) => (
                        <Skeleton key={i} className="h-32" />
                    ))}
                </div>
            </div>
        )
    }

    const profile = player.profile ?? {}
    const stats = data.season_stats ?? []
    const totals = stats.reduce(
        (t, s) => ({
            played: t.played + (s.played ?? 0),
            goals: t.goals + s.goals,
            assists: t.assists + s.assists,
            penalties: t.penalties + s.penalties,
        }),
        { played: 0, goals: 0, assists: 0, penalties: 0 },
    )
    const scorers = scorersQuery.data?.scorers ?? []
    const leagueIdx = scorers.findIndex((s) => s.player.id === player.id)
    const leagueRank = leagueIdx >= 0 ? scorers.findIndex((s) => s.goals === scorers[leagueIdx].goals) + 1 : null
    const nextMatch = nextQuery.data?.matches?.[0]

    const position = profile.detailed_position || player.position
    const born = [
        player.date_of_birth &&
            new Date(`${player.date_of_birth}T12:00:00`).toLocaleDateString(undefined, {
                day: 'numeric',
                month: 'short',
                year: 'numeric',
            }),
        profile.birth_place,
    ]
        .filter(Boolean)
        .join(' · ')

    return (
        <div className="flex flex-col gap-6">
            {team?.id && (
                <Link
                    to={`/teams/${team.id}?tab=squad`}
                    className="inline-flex min-h-11 items-center gap-2 self-start rounded-xl border border-fi-border bg-fi-surface px-4 text-sm font-semibold text-white hover:border-fi-accent/50"
                >
                    <ArrowLeft className="size-4" aria-hidden="true" /> {team.short_name} squad
                </Link>
            )}

            <Card className="flex flex-col gap-6 p-5 sm:p-8 lg:flex-row lg:items-center">
                <div className="relative self-start">
                    <PlayerAvatar name={player.name} photoUrl={profile.photo_url} size="lg" />
                    {player.shirt_number != null && (
                        <span className="absolute -top-2 -left-2 rounded-lg bg-fi-accent px-2 py-0.5 font-display text-sm font-bold text-[#11152A]">
                            #{player.shirt_number}
                        </span>
                    )}
                </div>

                <div className="flex min-w-0 flex-1 flex-col gap-3">
                    <div className="flex flex-wrap items-center gap-3">
                        <h1 className="font-display text-3xl font-bold text-white sm:text-[44px]">{player.name}</h1>
                        {position && <Pill tone={GROUP_TONES[player.position_group] ?? 'accent'}>{position}</Pill>}
                    </div>
                    <p className="flex flex-wrap items-center gap-x-5 gap-y-2 text-[15px] text-fi-text">
                        {team?.id && (
                            <Link to={`/teams/${team.id}`} className="inline-flex items-center gap-2 font-semibold hover:text-fi-accent-light">
                                <CrestBadge team={team} size="sm" /> {team.name}
                            </Link>
                        )}
                        {player.nationality && <span>{player.nationality}</span>}
                        {profile.preferred_foot && (
                            <span>
                                Preferred foot: <span className="font-semibold text-white">{profile.preferred_foot}</span>
                            </span>
                        )}
                    </p>
                    <div className="flex flex-wrap gap-2">
                        <Fact label="Age" value={player.age} />
                        <Fact label="Height" value={shortHeight(profile.height)} />
                        <Fact label="Weight" value={toKg(profile.weight)} />
                        <Fact label="Born" value={born} />
                        <Fact label="Contract to" value={formatMonth(player.contract?.until)} />
                    </div>
                </div>

                {stats.length > 0 && (
                    <Inset className="flex min-w-56 flex-col gap-1 p-5">
                        <p className="text-[11px] font-semibold uppercase tracking-[0.12em] text-fi-muted">Goal involvements</p>
                        <p className="font-display text-5xl font-bold text-fi-accent-light">{totals.goals + totals.assists}</p>
                        <p className="text-sm text-fi-muted">
                            {totals.goals} goals + {totals.assists} assists this season
                        </p>
                        {leagueRank && (
                            <p className={`mt-1 text-sm font-semibold ${leagueRank === 1 ? 'text-fi-win' : 'text-fi-text'}`}>
                                {leagueRank === 1 ? 'Top scorer' : `${ordinal(leagueRank)} top scorer`} in {league.name}
                            </p>
                        )}
                    </Inset>
                )}
            </Card>

            <StaleNotice meta={data.meta} />

            {stats.length > 0 ? (
                <>
                    <div className="grid grid-cols-2 gap-3 lg:grid-cols-3 xl:grid-cols-6">
                        <StatTile label="Goals" value={totals.goals} caption="All competitions" />
                        <StatTile label="Assists" value={totals.assists} caption="All competitions" />
                        <StatTile label="Appearances" value={totals.played} caption="In scoring competitions" />
                        <StatTile
                            label="Goals per match"
                            value={totals.played ? (totals.goals / totals.played).toFixed(2) : '—'}
                            caption="Goals ÷ appearances"
                            bar={totals.played ? totals.goals / totals.played : null}
                        />
                        <StatTile
                            label="Involvement rate"
                            value={totals.played ? ((totals.goals + totals.assists) / totals.played).toFixed(2) : '—'}
                            caption="(Goals + assists) per match"
                            bar={totals.played ? (totals.goals + totals.assists) / totals.played : null}
                        />
                        <StatTile
                            label="Penalties"
                            value={totals.penalties}
                            caption={totals.goals ? `${Math.round((totals.penalties / totals.goals) * 100)}% of goals` : 'Of goals scored'}
                            bar={totals.goals ? totals.penalties / totals.goals : null}
                        />
                    </div>

                    <Card className="overflow-hidden">
                        <p className="px-5 pt-5 text-[11px] font-semibold uppercase tracking-[0.12em] text-fi-muted">
                            By competition
                        </p>
                        <div className="no-scrollbar overflow-x-auto">
                            <table className="mt-2 w-full min-w-[480px] text-sm">
                                <thead>
                                    <tr className="border-b border-fi-border text-[11px] uppercase tracking-wider text-fi-muted">
                                        <th className="px-5 py-2.5 text-left font-semibold">Competition</th>
                                        <th className="px-3 py-2.5 text-right font-semibold">Apps</th>
                                        <th className="px-3 py-2.5 text-right font-semibold">Goals</th>
                                        <th className="px-3 py-2.5 text-right font-semibold">Assists</th>
                                        <th className="px-5 py-2.5 text-right font-semibold">Pens</th>
                                    </tr>
                                </thead>
                                <tbody>
                                    {stats.map((s) => (
                                        <tr key={s.competition.code} className="border-b border-fi-border/50 last:border-0">
                                            <td className="px-5 py-3">
                                                <span className="flex items-center gap-2 font-semibold text-white">
                                                    {s.competition.emblem && (
                                                        <img src={s.competition.emblem} alt="" className="size-5 object-contain" />
                                                    )}
                                                    {s.competition.name}
                                                </span>
                                            </td>
                                            <td className="px-3 py-3 text-right tabular-nums">{s.played ?? '—'}</td>
                                            <td className="px-3 py-3 text-right font-semibold tabular-nums text-white">{s.goals}</td>
                                            <td className="px-3 py-3 text-right tabular-nums">{s.assists}</td>
                                            <td className="px-5 py-3 text-right tabular-nums text-fi-muted">{s.penalties}</td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                        </div>
                    </Card>
                </>
            ) : (
                <EmptyState title="No goals or assists recorded this season">
                    Season statistics come from each competition&apos;s top-scorer table, so players who haven&apos;t scored
                    or assisted (often goalkeepers and defenders) have none to show.
                </EmptyState>
            )}

            <div className="grid grid-cols-1 gap-6 lg:grid-cols-[minmax(0,1fr)_360px]">
                <div className="flex min-w-0 flex-col gap-6">
                    <Bio text={profile.description} />
                    <Card className="flex gap-3 p-5">
                        <Info className="mt-0.5 size-4 shrink-0 text-fi-accent" aria-hidden="true" />
                        <p className="text-[13px] leading-relaxed text-fi-muted">
                            Not available on the free data tier: match-by-match logs, minutes, ratings, shots and xG.
                        </p>
                    </Card>
                </div>
                <div className="flex flex-col gap-6">
                    <Benchmark player={player} league={league} scorers={scorers} />
                    {nextMatch && (
                        <Card className="flex flex-col gap-3 p-5">
                            <p className="text-[11px] font-semibold uppercase tracking-[0.12em] text-fi-muted">
                                {team.short_name}&apos;s next match
                            </p>
                            <ResultRow match={nextMatch} compact />
                        </Card>
                    )}
                </div>
            </div>
        </div>
    )
}

export default PlayerDetails
