import React from 'react'
import { pct0 } from '../../utils/football'

/**
 * Home / draw / away probabilities as one split bar with labels underneath.
 * Segments are separated by a 2px gap; labels carry the numbers so colour is
 * never the only cue.
 */
const ProbabilitySplit = ({ home, draw, away, homeLabel = 'Home', awayLabel = 'Away', compact = false }) => {
    const total = (Number(home) || 0) + (Number(draw) || 0) + (Number(away) || 0) || 1
    const w = (p) => `${((Number(p) || 0) / total) * 100}%`
    return (
        <div className="flex flex-col gap-1.5">
            <div
                className="flex h-2 gap-0.5 overflow-hidden rounded-full"
                role="img"
                aria-label={`${homeLabel} ${pct0(home)}, draw ${pct0(draw)}, ${awayLabel} ${pct0(away)}`}
            >
                <span className="rounded-l-full bg-fi-accent" style={{ width: w(home) }} />
                <span className="bg-fi-muted/50" style={{ width: w(draw) }} />
                <span className="rounded-r-full bg-fi-opp-dark" style={{ width: w(away) }} />
            </div>
            {!compact && (
                <div className="flex justify-between gap-2 text-xs text-fi-muted">
                    <span className="truncate">
                        <span className="font-semibold text-fi-text">{pct0(home)}</span> {homeLabel}
                    </span>
                    <span>
                        <span className="font-semibold text-fi-text">{pct0(draw)}</span> Draw
                    </span>
                    <span className="truncate text-right">
                        <span className="font-semibold text-fi-text">{pct0(away)}</span> {awayLabel}
                    </span>
                </div>
            )}
        </div>
    )
}

export default ProbabilitySplit
