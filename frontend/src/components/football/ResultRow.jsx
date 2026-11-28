import React from 'react'
import { Link } from 'react-router-dom'
import { ChevronRight } from 'lucide-react'
import { CrestBadge } from './ui'
import { STATUS_LABELS, formatKickoff, formatMatchDate, resultFor, teamCode } from '../../utils/football'

const RESULT_TONES = { W: 'text-fi-win', D: 'text-fi-draw', L: 'text-fi-loss' }

/**
 * Compact one-line match row linking to its scorecard. With `perspectiveTeamId`
 * a W/D/L marker is shown for that team.
 */
const ResultRow = ({
    match,
    perspectiveTeamId,
    showCompetition = true,
    showDate = true,
    showMeta = true,
    compact = false,
}) => {
    const { home_team: home, away_team: away, score, status } = match
    const finished = status === 'finished'
    const winner = finished ? score.winner : null
    const result = perspectiveTeamId != null ? resultFor(match, perspectiveTeamId) : null
    const hasScore = score.home != null && score.away != null
    const meta = [
        showCompetition && match.competition?.name,
        // Unfinished rows already show the kick-off time on the left.
        showDate ? formatMatchDate(match.utc_date) : finished && `Kick-off ${formatKickoff(match.utc_date)}`,
    ]
        .filter(Boolean)
        .join(' · ')

    return (
        <Link
            to={`/results/${match.id}`}
            className="group flex min-h-16 items-center gap-3 rounded-xl border border-fi-border/70 bg-fi-inset px-3 py-2.5 transition-colors hover:border-fi-accent/40 sm:px-4"
        >
            <span
                className={`grid min-w-9 shrink-0 place-items-center whitespace-nowrap text-xs font-bold ${result ? RESULT_TONES[result] : 'text-fi-muted'}`}
                title={result ? undefined : STATUS_LABELS[status]}
            >
                {result ?? (finished ? 'FT' : formatKickoff(match.utc_date))}
            </span>

            <div
                className={`grid min-w-0 flex-1 grid-cols-[1fr_auto_1fr] items-center gap-2 sm:gap-3 ${compact ? '' : 'sm:min-w-64'}`}
            >
                <span className="flex min-w-0 items-center justify-end gap-2">
                    <span className={`truncate text-sm font-semibold ${winner && winner !== 'home' ? 'text-fi-muted' : 'text-white'}`}>
                        <span className={compact ? '' : 'sm:hidden'}>{teamCode(home)}</span>
                        {!compact && <span className="max-sm:hidden">{home?.short_name ?? 'TBD'}</span>}
                    </span>
                    <CrestBadge team={home} size="sm" className={compact ? 'hidden' : 'max-sm:hidden'} />
                </span>
                <span className="min-w-14 text-center font-display text-base font-bold tabular-nums text-white">
                    {hasScore ? `${score.home} – ${score.away}` : 'vs'}
                </span>
                <span className="flex min-w-0 items-center gap-2">
                    <CrestBadge team={away} size="sm" className={compact ? 'hidden' : 'max-sm:hidden'} />
                    <span className={`truncate text-sm font-semibold ${winner && winner !== 'away' ? 'text-fi-muted' : 'text-white'}`}>
                        <span className={compact ? '' : 'sm:hidden'}>{teamCode(away)}</span>
                        {!compact && <span className="max-sm:hidden">{away?.short_name ?? 'TBD'}</span>}
                    </span>
                </span>
            </div>

            <span className={`hidden max-w-64 min-w-0 truncate text-right text-xs text-fi-muted ${compact || !showMeta ? '' : 'md:block'}`} title={meta}>
                {meta}
            </span>
            <ChevronRight className="size-4 shrink-0 text-fi-muted group-hover:text-fi-accent" aria-hidden="true" />
        </Link>
    )
}

export default ResultRow
