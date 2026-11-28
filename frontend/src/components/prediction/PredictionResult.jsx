import React, { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import { Check, CheckCircle2, FlaskConical, Lightbulb, MapPin, Save, Scale, Trophy } from 'lucide-react'
import { Button, Card, CrestBadge, Pill } from '../football/ui'
import { useCountUp } from '../../hooks/useCountUp'

const TONES = {
    home: { text: 'text-fi-accent-light', bar: 'bg-fi-accent', ring: 'ring-fi-accent/60', glow: 'from-fi-accent/15' },
    draw: { text: 'text-fi-text', bar: 'bg-fi-muted/60', ring: 'ring-fi-muted/50', glow: 'from-white/5' },
    away: { text: 'text-fi-opp', bar: 'bg-fi-opp-dark', ring: 'ring-fi-opp/60', glow: 'from-fi-opp/15' },
}

/** How decisive the forecast is, from the gap between the top two outcomes. */
const verdictFor = (sorted) => {
    const gap = sorted[0][1] - sorted[1][1]
    if (gap < 0.04) return { label: 'Too close to call', tone: 'neutral', text: 'The two most likely outcomes are within a few points.' }
    if (gap < 0.15) return { label: 'Slight edge', tone: 'accent', text: 'One outcome leads, but an upset is very much in play.' }
    return { label: 'Clear favourite', tone: 'win', text: 'The model sees a clear favourite in this matchup.' }
}

const fairOdds = (p) => (p > 0 ? (1 / p).toFixed(2) : '—')

/** Count-up percentage; screen readers get the final value. */
const AnimatedPercent = ({ value, className }) => {
    const shown = useCountUp(Math.round(value * 100))
    return (
        <span className={className}>
            <span aria-hidden="true">{Math.round(shown)}</span>
            <span className="sr-only">{Math.round(value * 100)}</span>%
        </span>
    )
}

/** Width animates from 0 on mount. */
const GrowBar = ({ value, className }) => {
    const [ready, setReady] = useState(false)
    useEffect(() => {
        const id = requestAnimationFrame(() => setReady(true))
        return () => cancelAnimationFrame(id)
    }, [])
    return (
        <span
            className={`block h-full rounded-full transition-[width] duration-700 ease-out motion-reduce:transition-none ${className}`}
            style={{ width: ready ? `${value * 100}%` : '0%' }}
        />
    )
}

const TeamSide = ({ name, badge, role, align }) => (
    <div className={`flex min-w-0 flex-1 flex-col items-center gap-3 text-center ${align === 'right' ? 'sm:items-end sm:text-right' : 'sm:items-start sm:text-left'}`}>
        <CrestBadge team={{ name, ...badge }} size="xl" className="rounded-2xl max-sm:size-16 max-sm:text-base" />
        <div className="min-w-0">
            <p className="font-display text-xl leading-tight font-bold text-white sm:text-3xl">{name}</p>
            <p className="mt-1 text-xs font-semibold uppercase tracking-[0.12em] text-fi-muted">{role}</p>
        </div>
    </div>
)

const OutcomeTile = ({ outcome, label, shortLabel, value, likely, delay }) => {
    const tone = TONES[outcome]
    return (
        <div
            className={`fi-rise relative flex flex-col gap-3 overflow-hidden rounded-2xl border border-fi-border bg-fi-inset p-4 sm:p-5 ${
                likely ? `ring-2 ${tone.ring}` : ''
            }`}
            style={{ animationDelay: `${delay}ms` }}
        >
            {likely && <div className={`pointer-events-none absolute inset-0 bg-linear-to-b ${tone.glow} to-transparent`} aria-hidden="true" />}
            <div className="relative flex items-start justify-between gap-2">
                <p className="truncate text-xs font-semibold text-fi-text sm:text-sm">
                    <span className="sm:hidden">{shortLabel ?? label}</span>
                    <span className="max-sm:hidden">{label}</span>
                </p>
                {likely && (
                    <Pill tone={outcome === 'away' ? 'opp' : outcome === 'draw' ? 'neutral' : 'accent'} className="max-sm:hidden">
                        <Trophy className="size-3" aria-hidden="true" /> Most likely
                    </Pill>
                )}
            </div>
            <AnimatedPercent value={value} className={`relative font-display text-4xl font-bold tabular-nums sm:text-5xl ${tone.text}`} />
            <div className="relative h-1.5 overflow-hidden rounded-full bg-white/[0.06]" aria-hidden="true">
                <GrowBar value={value} className={tone.bar} />
            </div>
            <p className="relative text-xs text-fi-muted">
                Fair odds <span className="font-semibold text-fi-text tabular-nums">{fairOdds(value)}</span>
            </p>
        </div>
    )
}

const PredictionResult = ({ result, fixture, badges, onSave, saveState }) => {
    const probs = { home: result.win_prob_home, draw: result.draw_prob, away: result.win_prob_away }
    const sorted = Object.entries(probs).sort((a, b) => b[1] - a[1])
    const [likely, likelyValue] = sorted[0]
    const verdict = verdictFor(sorted)
    const likelyText = likely === 'draw' ? 'A draw' : `${likely === 'home' ? result.home_team : result.away_team} win`
    const model = result.model

    return (
        <Card className="relative overflow-hidden" aria-live="polite">
            {/* Soft glow behind the matchup. */}
            <div
                className="pointer-events-none absolute -top-32 left-1/2 h-64 w-[600px] -translate-x-1/2 rounded-full bg-fi-accent/10 blur-3xl"
                aria-hidden="true"
            />

            <div className="relative flex flex-col gap-6 p-5 sm:p-8">
                <div className="fi-rise flex flex-wrap items-center justify-between gap-3">
                    <p className="flex items-center gap-2 text-[11px] font-semibold uppercase tracking-[0.14em] text-fi-accent">
                        <span className="size-1.5 rounded-full bg-current" aria-hidden="true" /> Match prediction
                    </p>
                    <div className="flex flex-wrap items-center gap-2">
                        {fixture && (
                            <Pill tone="accent">
                                {fixture.competition}
                                {fixture.date && ` · ${fixture.date}`}
                            </Pill>
                        )}
                        <Pill>
                            <MapPin className="size-3" aria-hidden="true" />
                            {result.neutral ? 'Neutral venue' : `Home advantage: ${result.home_team}`}
                        </Pill>
                    </div>
                </div>

                <div className="fi-rise flex items-center gap-3 sm:gap-6" style={{ animationDelay: '60ms' }}>
                    <TeamSide name={result.home_team} badge={badges?.home} role="Home" />
                    <div className="flex shrink-0 flex-col items-center gap-1">
                        <span className="grid size-12 place-items-center rounded-full border border-fi-border bg-fi-inset font-display text-sm font-bold text-fi-muted sm:size-14">
                            VS
                        </span>
                    </div>
                    <TeamSide name={result.away_team} badge={badges?.away} role="Away" align="right" />
                </div>

                <div className="grid grid-cols-3 gap-2 sm:gap-4">
                    <OutcomeTile outcome="home" label={`${result.home_team} win`} shortLabel={result.home_team} value={probs.home} likely={likely === 'home'} delay={120} />
                    <OutcomeTile outcome="draw" label="Draw" value={probs.draw} likely={likely === 'draw'} delay={180} />
                    <OutcomeTile outcome="away" label={`${result.away_team} win`} shortLabel={result.away_team} value={probs.away} likely={likely === 'away'} delay={240} />
                </div>

                {/* At-a-glance split of the three outcomes. */}
                <div
                    className="fi-rise flex h-2.5 gap-0.5 overflow-hidden rounded-full"
                    style={{ animationDelay: '300ms' }}
                    role="img"
                    aria-label={`${result.home_team} ${Math.round(probs.home * 100)}%, draw ${Math.round(probs.draw * 100)}%, ${result.away_team} ${Math.round(probs.away * 100)}%`}
                >
                    {['home', 'draw', 'away'].map((o) => (
                        <span key={o} className="h-full" style={{ width: `${probs[o] * 100}%` }}>
                            <GrowBar value={1} className={TONES[o].bar} />
                        </span>
                    ))}
                </div>

                <div className="fi-rise grid gap-3 lg:grid-cols-[minmax(0,1fr)_minmax(0,1.3fr)]" style={{ animationDelay: '360ms' }}>
                    <div className="flex gap-3 rounded-2xl border border-fi-border bg-fi-inset p-4">
                        <span className="grid size-10 shrink-0 place-items-center rounded-xl bg-fi-accent/10 text-fi-accent">
                            <Scale className="size-5" aria-hidden="true" />
                        </span>
                        <div className="min-w-0">
                            <div className="flex flex-wrap items-center gap-2">
                                <p className="font-semibold text-white">{likelyText}</p>
                                <Pill tone={verdict.tone}>{verdict.label}</Pill>
                            </div>
                            <p className="mt-1 text-[13px] text-fi-muted">
                                {Math.round(likelyValue * 100)}% vs {Math.round(sorted[1][1] * 100)}% for the next outcome. {verdict.text}
                            </p>
                        </div>
                    </div>
                    {result.underdog_insight && (
                        <div className="flex gap-3 rounded-2xl border border-fi-border bg-fi-inset p-4">
                            <span className="grid size-10 shrink-0 place-items-center rounded-xl bg-fi-momentum/10 text-fi-momentum">
                                <Lightbulb className="size-5" aria-hidden="true" />
                            </span>
                            <div className="min-w-0">
                                <p className="font-semibold text-white">Underdog angle</p>
                                <p className="mt-1 text-[13px] leading-relaxed text-fi-muted">{result.underdog_insight}</p>
                            </div>
                        </div>
                    )}
                </div>

                <div className="fi-rise flex flex-col gap-4 border-t border-fi-border pt-5 sm:flex-row sm:items-center sm:justify-between" style={{ animationDelay: '420ms' }}>
                    {model && (
                        <p className="flex flex-wrap items-center gap-2 text-xs text-fi-muted">
                            <FlaskConical className="size-3.5 text-fi-accent" aria-hidden="true" />
                            {model.name}
                            <Pill tone={model.kind === 'baseline' ? 'momentum' : 'win'}>{model.version}</Pill>
                            <span>· Fair odds are 1 ÷ probability, with no bookmaker margin.</span>
                        </p>
                    )}
                    <div className="flex flex-col items-start gap-2 sm:items-end">
                        {saveState.saved ? (
                            <div className="flex items-center gap-3">
                                <Pill tone="win">
                                    <Check className="size-3.5" aria-hidden="true" /> Saved
                                </Pill>
                                <Link to="/dashboard" className="text-sm font-semibold text-fi-link hover:text-fi-accent-light">
                                    View on your dashboard →
                                </Link>
                            </div>
                        ) : (
                            <Button variant="primary" onClick={onSave} disabled={saveState.saving}>
                                <Save className="size-4" aria-hidden="true" />
                                {saveState.saving ? 'Saving…' : 'Save to my dashboard'}
                            </Button>
                        )}
                        {fixture && !saveState.saved && (
                            <p className="flex items-center gap-1.5 text-xs text-fi-muted">
                                <CheckCircle2 className="size-3.5 text-fi-win" aria-hidden="true" />
                                {fixture.played ? 'Already played: graded against the real result on save.' : 'Graded automatically after the match.'}
                            </p>
                        )}
                        {saveState.error && <p className="text-sm text-fi-loss">{saveState.error}</p>}
                    </div>
                </div>
            </div>
        </Card>
    )
}

/** Placeholder shaped like the result card, shown while the model runs. */
export const PredictionSkeleton = () => (
    <Card className="flex flex-col gap-6 p-5 sm:p-8" aria-busy="true" aria-label="Computing prediction">
        <div className="flex items-center justify-between">
            <div className="fi-shimmer h-3 w-32 rounded-full bg-white/[0.06]" />
            <div className="fi-shimmer h-6 w-36 rounded-full bg-white/[0.06]" />
        </div>
        <div className="flex items-center gap-6">
            {[0, 1].map((i) => (
                <div key={i} className={`flex flex-1 flex-col items-center gap-3 ${i ? 'sm:items-end' : 'sm:items-start'}`}>
                    <div className="fi-shimmer size-16 rounded-2xl bg-white/[0.06] sm:size-24" />
                    <div className="fi-shimmer h-6 w-32 rounded-lg bg-white/[0.06]" />
                </div>
            ))}
        </div>
        <div className="grid grid-cols-3 gap-2 sm:gap-4">
            {[0, 1, 2].map((i) => (
                <div key={i} className="fi-shimmer h-36 rounded-2xl border border-fi-border bg-fi-inset" />
            ))}
        </div>
        <div className="fi-shimmer h-2.5 rounded-full bg-white/[0.06]" />
        <p className="text-center text-sm text-fi-muted">Running the model…</p>
    </Card>
)

export default PredictionResult
