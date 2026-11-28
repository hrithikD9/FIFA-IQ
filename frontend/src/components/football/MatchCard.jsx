import React from 'react'
import { Link } from 'react-router-dom'
import { Sparkles } from 'lucide-react'
import { CrestBadge, Card, Inset, Pill } from './ui'
import {
    STATUS_LABELS,
    STATUS_TONES,
    formatKickoff,
    formatMatchDate,
    ordinal,
    predictionState,
    prettyStage,
} from '../../utils/football'

const TeamSide = ({ team, standing, align = 'left', winner }) => (
    <div className={`flex min-w-0 flex-1 flex-col gap-2 ${align === 'right' ? 'items-end text-right' : ''}`}>
        <CrestBadge team={team} />
        <p
            className={`w-full truncate font-display text-lg font-semibold ${winner === false ? 'text-fi-muted' : 'text-white'}`}
            title={team?.name}
        >
            {team?.short_name || team?.name || 'TBD'}
        </p>
        <p className="text-[13px] text-fi-muted">
            {standing ? `${ordinal(standing.position)} · ${standing.points} pts` : ' '}
        </p>
    </div>
)

const Centre = ({ match }) => {
    const { status, score } = match
    const hasScore = score.home != null && score.away != null
    if (hasScore) {
        return (
            <div className="flex shrink-0 flex-col items-center px-2">
                <p className="font-display text-3xl font-bold tabular-nums text-white">
                    {score.home} – {score.away}
                </p>
                <p className="mt-1 text-xs text-fi-muted">
                    {status === 'finished' ? 'FT' : STATUS_LABELS[status]}
                    {score.half_time?.home != null && ` · HT ${score.half_time.home}–${score.half_time.away}`}
                </p>
            </div>
        )
    }
    return <p className="shrink-0 px-2 pt-3 font-display text-sm font-semibold text-fi-muted">vs</p>
}

/** Fixture / result card used on Fixtures and Results pages. */
const MatchCard = ({ match, standings, featuredTeamId }) => {
    const home = match.home_team
    const away = match.away_team
    const featured = featuredTeamId != null && (home?.id === featuredTeamId || away?.id === featuredTeamId)
    // Only dim the losing side once the result is final.
    const winner = match.status === 'finished' ? match.score.winner : null
    const details = [
        match.matchday && `Matchday ${match.matchday}`,
        match.group ? prettyStage(match.group) : prettyStage(match.stage) !== 'Regular Season' && prettyStage(match.stage),
    ].filter(Boolean)
    const canPredict = match.is_international && match.status === 'scheduled'

    return (
        <Card className={`flex flex-col gap-4 p-5 ${featured ? 'border-fi-accent/40' : ''}`}>
            <div className="flex flex-wrap items-center gap-x-2.5 gap-y-1.5">
                {featured ? (
                    <Pill tone="accent">Featured club</Pill>
                ) : (
                    <Pill tone={STATUS_TONES[match.status]} dot={match.status === 'live'}>
                        {STATUS_LABELS[match.status]}
                    </Pill>
                )}
                <span className="text-sm font-semibold text-white">
                    {formatMatchDate(match.utc_date)} · {formatKickoff(match.utc_date)}
                </span>
                {featured && match.status !== 'scheduled' && (
                    <span className="text-xs text-fi-muted">{STATUS_LABELS[match.status]}</span>
                )}
            </div>

            <div className="flex items-start gap-2">
                <TeamSide team={home} standing={standings?.[home?.id]} winner={winner ? winner === 'home' : undefined} />
                <Centre match={match} />
                <TeamSide
                    team={away}
                    standing={standings?.[away?.id]}
                    align="right"
                    winner={winner ? winner === 'away' : undefined}
                />
            </div>

            <Inset className="flex min-h-11 flex-wrap items-center justify-between gap-x-4 gap-y-1 px-3.5 py-2.5 text-[13px]">
                <span className="text-fi-muted">{details.join(' · ') || match.competition?.name}</span>
                {match.referee && <span className="text-fi-text">Referee: {match.referee}</span>}
            </Inset>

            <div className="mt-auto flex items-center justify-between gap-3">
                <Link
                    to={`/results/${match.id}`}
                    className="text-sm font-semibold text-fi-link hover:text-fi-accent-light"
                >
                    {match.status === 'finished' ? 'Full scorecard' : 'Match preview & head-to-head'}
                </Link>
                {canPredict && (
                    <Link
                        to="/predict"
                        state={predictionState(match)}
                        className="inline-flex min-h-10 items-center gap-1.5 rounded-xl bg-fi-accent px-3.5 text-sm font-semibold text-[#11152A] hover:bg-fi-accent-light"
                    >
                        <Sparkles className="size-4" aria-hidden="true" /> Predict with AI
                    </Link>
                )}
            </div>
        </Card>
    )
}

/** Slim dashed row for postponed / suspended / cancelled matches. */
export const PostponedRow = ({ match }) => (
    <div className="flex flex-wrap items-center gap-x-4 gap-y-2 rounded-2xl border border-dashed border-fi-border bg-fi-surface/60 px-5 py-3.5">
        <Pill tone={STATUS_TONES[match.status]}>{STATUS_LABELS[match.status]}</Pill>
        <div className="flex min-w-0 items-center gap-2.5">
            <CrestBadge team={match.home_team} size="sm" />
            <span className="truncate font-semibold text-white">{match.home_team?.short_name}</span>
            <span className="text-fi-muted">vs</span>
            <span className="truncate font-semibold text-white">{match.away_team?.short_name}</span>
            <CrestBadge team={match.away_team} size="sm" />
        </div>
        <span className="text-[13px] text-fi-muted sm:ml-auto">
            {match.matchday ? `Matchday ${match.matchday} · ` : ''}Originally {formatMatchDate(match.utc_date)} — new date TBD
        </span>
    </div>
)

export default MatchCard
