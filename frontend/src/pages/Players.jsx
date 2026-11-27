import React, { useState } from 'react'
import { Link } from 'react-router-dom'
import { Users } from 'lucide-react'
import {
    Card,
    CrestBadge,
    EmptyState,
    ErrorState,
    Pill,
    PlayerAvatar,
    Segmented,
    Skeleton,
    StaleNotice,
} from '../components/football/ui'
import { useApi } from '../hooks/useApi'
import { fetchCompetitions, fetchScorers } from '../services/footballApi'

// Same `limit` as the backend's player-stats lookup, so both share one cached
// provider response.
const SCORERS_LIMIT = 100
const SHOWN = 25

const LEAGUES = [
    { value: 'PD', label: 'La Liga' },
    { value: 'PL', label: 'Premier League' },
    { value: 'BL1', label: 'Bundesliga' },
    { value: 'SA', label: 'Serie A' },
    { value: 'FL1', label: 'Ligue 1' },
    { value: 'CL', label: 'Champions League' },
]

const Players = () => {
    const [code, setCode] = useState('PD')
    const competitions = useApi('competitions', (signal) => fetchCompetitions(signal))
    const featuredTeamId = competitions.data?.featured_team_id
    const { data, error, loading, reload } = useApi(`scorers:${code}`, (signal) => fetchScorers(code, SCORERS_LIMIT, signal))
    const scorers = (data?.scorers ?? []).slice(0, SHOWN)

    return (
        <div className="flex flex-col gap-6">
            <header className="flex flex-wrap items-end justify-between gap-5">
                <div className="max-w-2xl">
                    <Pill tone="accent">Player index</Pill>
                    <h1 className="mt-3 font-display text-4xl font-bold text-white sm:text-[44px]">Players</h1>
                    <p className="mt-2 text-[15px] leading-relaxed text-fi-muted">
                        This season&apos;s leading scorers. Open a player for their profile, or browse a full squad from
                        any team page.
                    </p>
                </div>
                {featuredTeamId && (
                    <Link
                        to={`/teams/${featuredTeamId}?tab=squad`}
                        className="inline-flex min-h-11 items-center gap-2 rounded-xl border border-fi-border bg-fi-surface px-4 text-sm font-semibold text-white hover:border-fi-accent/50"
                    >
                        <Users className="size-4 text-fi-accent" aria-hidden="true" /> FC Barcelona squad
                    </Link>
                )}
            </header>

            <Segmented options={LEAGUES} value={code} onChange={setCode} label="Competition" className="self-start" />

            <StaleNotice meta={data?.meta} />

            {error ? (
                <ErrorState error={error} onRetry={reload} />
            ) : loading && !data ? (
                <Skeleton className="h-[560px]" />
            ) : scorers.length === 0 ? (
                <EmptyState title="No scorers recorded yet">The season may not have started for this competition.</EmptyState>
            ) : (
                <Card className="overflow-hidden">
                    <div className="no-scrollbar overflow-x-auto">
                        <table className="w-full min-w-[640px] text-sm">
                            <thead>
                                <tr className="border-b border-fi-border text-[11px] uppercase tracking-wider text-fi-muted">
                                    <th className="w-12 px-4 py-3 text-left font-semibold">#</th>
                                    <th className="py-3 text-left font-semibold">Player</th>
                                    <th className="py-3 text-left font-semibold">Team</th>
                                    <th className="px-3 py-3 text-right font-semibold">Apps</th>
                                    <th className="px-3 py-3 text-right font-semibold">Goals</th>
                                    <th className="px-3 py-3 text-right font-semibold">Assists</th>
                                    <th className="px-4 py-3 text-right font-semibold">Pens</th>
                                </tr>
                            </thead>
                            <tbody>
                                {scorers.map((s, i) => {
                                    // Shared ranks for equal goals.
                                    const rank = scorers.findIndex((x) => x.goals === s.goals) + 1
                                    const featured = s.team?.id === featuredTeamId
                                    return (
                                        <tr
                                            key={s.player.id}
                                            className={`border-b border-fi-border/50 last:border-0 ${featured ? 'bg-fi-accent/[0.06]' : ''}`}
                                        >
                                            <td className="px-4 py-3 text-fi-muted tabular-nums">
                                                {i > 0 && scorers[i - 1].goals === s.goals ? '' : rank}
                                            </td>
                                            <td className="py-3">
                                                <Link
                                                    to={`/players/${s.player.id}`}
                                                    className="flex items-center gap-3 font-semibold text-white hover:text-fi-accent-light"
                                                >
                                                    <PlayerAvatar name={s.player.name} size="sm" />
                                                    <span>
                                                        {s.player.name}
                                                        <span className="block text-xs font-normal text-fi-muted">
                                                            {s.player.nationality}
                                                        </span>
                                                    </span>
                                                </Link>
                                            </td>
                                            <td className="py-3">
                                                <Link
                                                    to={`/teams/${s.team?.id}`}
                                                    className="flex items-center gap-2 text-fi-text hover:text-fi-accent-light"
                                                >
                                                    <CrestBadge team={s.team} size="sm" />
                                                    {s.team?.short_name}
                                                </Link>
                                            </td>
                                            <td className="px-3 py-3 text-right tabular-nums">{s.played ?? '—'}</td>
                                            <td className="px-3 py-3 text-right font-display text-base font-bold tabular-nums text-white">
                                                {s.goals}
                                            </td>
                                            <td className="px-3 py-3 text-right tabular-nums">{s.assists}</td>
                                            <td className="px-4 py-3 text-right tabular-nums text-fi-muted">{s.penalties}</td>
                                        </tr>
                                    )
                                })}
                            </tbody>
                        </table>
                    </div>
                </Card>
            )}
        </div>
    )
}

export default Players
