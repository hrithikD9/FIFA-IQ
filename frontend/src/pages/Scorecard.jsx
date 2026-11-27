import React from 'react'
import { Link, useParams } from 'react-router-dom'
import { ArrowLeft, Info, Share2, Sparkles } from 'lucide-react'
import ResultRow from '../components/football/ResultRow'
import { Button, Card, CrestBadge, ErrorState, Inset, Pill, Skeleton, StaleNotice } from '../components/football/ui'
import { useToast } from '../components/useToast'
import { useApi } from '../hooks/useApi'
import { fetchMatch } from '../services/footballApi'
import {
    STATUS_LABELS,
    STATUS_TONES,
    formatKickoff,
    formatLongDate,
    prettyStage,
} from '../utils/football'

const UNAVAILABLE_LABELS = {
    lineups: 'lineups',
    goal_scorers: 'goal scorers',
    bookings: 'cards',
    substitutions: 'substitutions',
    match_statistics: 'match statistics (possession, shots, xG)',
}

const roundLabel = (match) =>
    [
        match.competition?.name,
        match.group ? prettyStage(match.group) : prettyStage(match.stage) !== 'Regular Season' ? prettyStage(match.stage) : null,
        match.matchday ? `Matchday ${match.matchday}` : null,
    ]
        .filter(Boolean)
        .join(' · ')

const TeamBlock = ({ team, side, outcome }) => (
    <Link
        to={team?.id ? `/teams/${team.id}` : '#'}
        className={`flex min-w-0 flex-1 items-center gap-4 rounded-xl p-1 hover:bg-white/[0.02] ${
            side === 'away' ? 'flex-row-reverse text-right' : ''
        }`}
    >
        <CrestBadge team={team} size="xl" className="rounded-full max-sm:size-16 max-sm:text-base" />
        <div className={`flex min-w-0 flex-col gap-1.5 ${side === 'away' ? 'items-end' : 'items-start'}`}>
            <p className="font-display text-xl leading-tight font-bold text-white sm:text-3xl">{team?.name ?? 'TBD'}</p>
            {outcome === 'win' && <Pill tone="win">Winner</Pill>}
            {outcome === 'draw' && <Pill tone="draw">Draw</Pill>}
        </div>
    </Link>
)

const Hero = ({ match }) => {
    const { score, status } = match
    const hasScore = score.home != null && score.away != null
    const outcome = (side) => {
        if (status !== 'finished' || !score.winner) return null
        if (score.winner === 'draw') return 'draw'
        return score.winner === side ? 'win' : null
    }
    const facts = [match.venue, match.referee && `Referee: ${match.referee}`].filter(Boolean)

    return (
        <Card className="flex flex-col gap-6 p-5 sm:p-8">
            <div className="flex flex-wrap items-center justify-between gap-x-6 gap-y-2 text-sm text-fi-muted">
                <span className="flex flex-wrap gap-x-6 gap-y-1">
                    {facts.map((f) => (
                        <span key={f}>{f}</span>
                    ))}
                </span>
                <span className="flex items-center gap-2">
                    <Pill tone={STATUS_TONES[status]} dot={status === 'live'}>
                        {STATUS_LABELS[status]}
                    </Pill>
                    {formatLongDate(match.utc_date)} · {formatKickoff(match.utc_date)}
                </span>
            </div>

            <div className="flex flex-col items-stretch gap-6 md:flex-row md:items-center">
                <TeamBlock team={match.home_team} side="home" outcome={outcome('home')} />
                <div className="flex shrink-0 flex-col items-center gap-2">
                    {hasScore ? (
                        <p className="font-display text-6xl leading-none font-bold tabular-nums text-white sm:text-[76px]">
                            {score.home}
                            <span className="mx-3 text-fi-muted">–</span>
                            {score.away}
                        </p>
                    ) : (
                        <p className="font-display text-5xl leading-none font-bold text-white">{formatKickoff(match.utc_date)}</p>
                    )}
                    <span className="rounded-full border border-fi-border bg-fi-inset px-3 py-1 text-xs font-semibold text-fi-text">
                        {hasScore
                            ? [
                                  status === 'finished' ? 'FT' : STATUS_LABELS[status],
                                  score.half_time?.home != null && `HT ${score.half_time.home}–${score.half_time.away}`,
                                  score.duration && score.duration !== 'REGULAR' && prettyStage(score.duration),
                              ]
                                  .filter(Boolean)
                                  .join(' · ')
                            : 'Kick-off (your time)'}
                    </span>
                </div>
                <TeamBlock team={match.away_team} side="away" outcome={outcome('away')} />
            </div>

            {match.is_international && status === 'scheduled' && (
                <div className="flex justify-center">
                    <Link
                        to="/predict"
                        state={{ home: match.home_team?.name, away: match.away_team?.name }}
                        className="inline-flex min-h-11 items-center gap-2 rounded-xl bg-fi-accent px-5 text-sm font-semibold text-[#11152A] hover:bg-fi-accent-light"
                    >
                        <Sparkles className="size-4" aria-hidden="true" /> Predict with AI
                    </Link>
                </div>
            )}
        </Card>
    )
}

const SplitBar = ({ home, draws, away }) => {
    const total = home + draws + away
    if (!total) return null
    const pct = (n) => `${(n / total) * 100}%`
    return (
        <div className="flex h-2 gap-1 overflow-hidden rounded-full" aria-hidden="true">
            {home > 0 && <span className="rounded-full bg-fi-accent" style={{ width: pct(home) }} />}
            {draws > 0 && <span className="rounded-full bg-fi-muted/50" style={{ width: pct(draws) }} />}
            {away > 0 && <span className="rounded-full bg-fi-opp-dark" style={{ width: pct(away) }} />}
        </div>
    )
}

const HeadToHead = ({ match, h2h }) => {
    const home = match.home_team
    const away = match.away_team
    const meetings = h2h?.matches ?? []
    const s = h2h?.summary

    return (
        <Card className="flex flex-col gap-5 p-5 sm:p-6">
            <div>
                <p className="text-[11px] font-semibold uppercase tracking-[0.12em] text-fi-muted">Head-to-head</p>
                <h2 className="mt-1 font-display text-xl font-semibold text-white">Previous meetings</h2>
            </div>

            {!h2h ? (
                <p className="text-sm text-fi-muted">Head-to-head data is temporarily unavailable. Try again in a minute.</p>
            ) : meetings.length === 0 ? (
                <p className="text-sm text-fi-muted">
                    No earlier meetings between these teams in the available data (recent seasons only).
                </p>
            ) : (
                <>
                    <Inset className="flex flex-col gap-4 p-4">
                        <div className="grid grid-cols-3 text-center">
                            <div>
                                <p className="font-display text-3xl font-bold text-fi-accent-light">{s.home_team_wins}</p>
                                <p className="truncate text-xs text-fi-muted">{home?.short_name} wins</p>
                            </div>
                            <div>
                                <p className="font-display text-3xl font-bold text-fi-text">{s.draws}</p>
                                <p className="text-xs text-fi-muted">Draws</p>
                            </div>
                            <div>
                                <p className="font-display text-3xl font-bold text-fi-opp">{s.away_team_wins}</p>
                                <p className="truncate text-xs text-fi-muted">{away?.short_name} wins</p>
                            </div>
                        </div>
                        <SplitBar home={s.home_team_wins} draws={s.draws} away={s.away_team_wins} />
                        <p className="text-center text-xs text-fi-muted">
                            {s.matches} {s.matches === 1 ? 'meeting' : 'meetings'} · {s.total_goals} goals ·{' '}
                            {(s.total_goals / s.matches).toFixed(1)} per match
                        </p>
                    </Inset>
                    <div className="flex flex-col gap-2">
                        {meetings.map((m) => (
                            <ResultRow key={m.id} match={m} perspectiveTeamId={home?.id} />
                        ))}
                    </div>
                    <p className="text-xs text-fi-muted">W/D/L shown from {home?.short_name}&apos;s point of view.</p>
                </>
            )}
        </Card>
    )
}

const Scorecard = () => {
    const { matchId } = useParams()
    const toast = useToast()
    const valid = /^\d+$/.test(matchId ?? '')
    const { data, error, loading, reload } = useApi(valid ? `match:${matchId}` : null, (signal) => fetchMatch(matchId, signal))

    const share = async () => {
        try {
            await navigator.clipboard.writeText(window.location.href)
            toast.success('Link copied', 'Scorecard link copied to your clipboard.')
        } catch {
            toast.error('Could not copy link', 'Copy the address from your browser bar instead.')
        }
    }

    if (!valid) return <ErrorState error={{ message: 'This match link is not valid.' }} />

    const match = data?.match
    const unavailable = (data?.meta?.unavailable ?? []).map((k) => UNAVAILABLE_LABELS[k] ?? k)

    return (
        <div className="flex flex-col gap-6">
            <div className="flex flex-wrap items-center justify-between gap-3">
                <div className="flex min-w-0 flex-wrap items-center gap-3">
                    <Link
                        to="/results"
                        className="inline-flex min-h-11 items-center gap-2 rounded-xl border border-fi-border bg-fi-surface px-4 text-sm font-semibold text-white hover:border-fi-accent/50"
                    >
                        <ArrowLeft className="size-4" aria-hidden="true" /> All results
                    </Link>
                    {match && <span className="text-sm text-fi-muted">{roundLabel(match)}</span>}
                </div>
                <Button onClick={share} aria-label="Copy link to this scorecard" className="px-3">
                    <Share2 className="size-4" aria-hidden="true" />
                    <span className="max-sm:sr-only">Share</span>
                </Button>
            </div>

            <StaleNotice meta={data?.meta} />

            {error ? (
                <ErrorState error={error} onRetry={reload} />
            ) : loading && !data ? (
                <>
                    <Skeleton className="h-72" />
                    <Skeleton className="h-64" />
                </>
            ) : (
                <>
                    <Hero match={match} />

                    <div className="grid gap-6 lg:grid-cols-[minmax(0,1fr)_340px]">
                        <HeadToHead match={match} h2h={data.head_to_head} />

                        <div className="flex flex-col gap-6">
                            <Card className="flex flex-col gap-3 p-5">
                                <p className="text-[11px] font-semibold uppercase tracking-[0.12em] text-fi-muted">Team analysis</p>
                                {[match.home_team, match.away_team].filter(Boolean).map((team) => (
                                    <Link
                                        key={team.id}
                                        to={`/teams/${team.id}`}
                                        className="flex min-h-14 items-center gap-3 rounded-xl border border-fi-border/70 bg-fi-inset px-3 hover:border-fi-accent/40"
                                    >
                                        <CrestBadge team={team} size="sm" />
                                        <span className="min-w-0 flex-1 truncate font-semibold text-white">{team.name}</span>
                                        <span className="text-sm text-fi-link">Squad & form →</span>
                                    </Link>
                                ))}
                            </Card>

                            {unavailable.length > 0 && (
                                <Card className="flex gap-3 p-5">
                                    <Info className="mt-0.5 size-4 shrink-0 text-fi-accent" aria-hidden="true" />
                                    <p className="text-[13px] leading-relaxed text-fi-muted">
                                        Not available on the free data tier: {unavailable.join(', ')}.
                                    </p>
                                </Card>
                            )}
                        </div>
                    </div>
                </>
            )}
        </div>
    )
}

export default Scorecard
