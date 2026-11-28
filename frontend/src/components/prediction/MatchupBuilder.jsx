import React from 'react'
import { ArrowLeftRight, ChevronDown, Home, Loader2, MapPin, Sparkles } from 'lucide-react'
import { Card, CrestBadge } from '../football/ui'

const SIDES = {
    home: { label: 'Home', pill: 'bg-fi-accent/15 text-fi-accent-light', glow: 'bg-fi-accent/20', ring: 'ring-fi-accent/50' },
    away: { label: 'Away', pill: 'bg-fi-opp/15 text-fi-opp', glow: 'bg-fi-opp/20', ring: 'ring-fi-opp/50' },
}

const TeamPanel = ({ side, value, badge, teams, exclude, onChange }) => {
    const s = SIDES[side]
    const id = `matchup-${side}`
    return (
        <div className="relative flex min-w-0 flex-1 flex-col items-center gap-4 px-4 py-6 text-center sm:px-6 sm:py-8">
            {/* Soft colour glow behind the selected crest. */}
            {value && (
                <div
                    className={`pointer-events-none absolute top-6 left-1/2 size-36 -translate-x-1/2 rounded-full blur-3xl ${s.glow}`}
                    aria-hidden="true"
                />
            )}
            <span className={`relative rounded-full px-3 py-1 text-[11px] font-bold uppercase tracking-[0.14em] ${s.pill}`}>
                {s.label}
            </span>

            <div className="relative">
                {value ? (
                    <CrestBadge
                        team={{ name: value, ...badge }}
                        size="xl"
                        className={`rounded-2xl bg-fi-surface ring-2 ${s.ring} max-sm:size-20 max-sm:text-lg`}
                    />
                ) : (
                    <span className="grid size-24 place-items-center rounded-2xl border-2 border-dashed border-fi-border text-3xl font-bold text-fi-muted max-sm:size-20">
                        ?
                    </span>
                )}
            </div>

            <label htmlFor={id} className="sr-only">
                {s.label} team
            </label>
            <div className="relative w-full max-w-64">
                <select
                    id={id}
                    value={value}
                    onChange={(e) => onChange(e.target.value)}
                    className="min-h-12 w-full cursor-pointer appearance-none rounded-xl border border-fi-border bg-fi-inset/80 px-10 text-center font-display text-lg font-bold text-white transition-colors hover:border-fi-accent/50 focus:border-fi-accent focus:outline-none sm:text-xl"
                >
                    <option value="" disabled>
                        Choose a team
                    </option>
                    {teams.map((t) => (
                        <option key={t} value={t} disabled={t === exclude}>
                            {t}
                        </option>
                    ))}
                </select>
                <ChevronDown className="pointer-events-none absolute top-1/2 right-3.5 size-4 -translate-y-1/2 text-fi-muted" aria-hidden="true" />
            </div>
            <p className="relative min-h-4 text-xs font-semibold tracking-[0.12em] text-fi-muted">{badge?.tla ?? ''}</p>
        </div>
    )
}

const VenueSwitch = ({ neutral, onChange }) => (
    <div role="radiogroup" aria-label="Venue" className="flex rounded-xl border border-fi-border bg-fi-surface p-1 sm:inline-flex">
        {[
            { value: false, label: 'Home advantage', icon: Home },
            { value: true, label: 'Neutral venue', icon: MapPin },
        ].map((option) => {
            const { value, label } = option
            const active = neutral === value
            return (
                <button
                    key={label}
                    type="button"
                    role="radio"
                    aria-checked={active}
                    onClick={() => onChange(value)}
                    className={`inline-flex min-h-10 flex-1 items-center justify-center gap-2 whitespace-nowrap rounded-[9px] px-3 text-[13px] font-medium transition-colors sm:flex-none sm:px-3.5 sm:text-sm ${
                        active ? 'bg-fi-nav text-white ring-1 ring-fi-accent/40' : 'text-fi-muted hover:text-fi-text'
                    }`}
                >
                    <option.icon className="size-4" aria-hidden="true" />
                    {label}
                </button>
            )
        })}
    </div>
)

/**
 * Team picker + venue + predict call-to-action.
 * `badges` maps a team name to { crest, tla } for flags and codes.
 */
const MatchupBuilder = ({
    teams,
    badges,
    home,
    away,
    onHomeChange,
    onAwayChange,
    onSwap,
    neutral,
    onNeutralChange,
    onPredict,
    computing,
    canPredict,
    notice,
    error,
}) => (
    <Card className="relative overflow-hidden">
        <div
            className="pointer-events-none absolute inset-0 bg-[radial-gradient(ellipse_at_top,rgba(169,180,255,0.08),transparent_60%)]"
            aria-hidden="true"
        />
        {notice && <div className="relative px-5 pt-5 sm:px-7">{notice}</div>}

        <div className="relative flex flex-col items-stretch md:flex-row md:items-center">
            <TeamPanel side="home" value={home} badge={badges(home)} teams={teams} exclude={away} onChange={onHomeChange} />

            <div className="flex shrink-0 items-center justify-center gap-3 md:flex-col">
                <span className="grid size-16 place-items-center rounded-full bg-linear-to-br from-fi-accent/40 to-fi-opp/40 p-px">
                    <span className="grid size-full place-items-center rounded-full bg-fi-surface font-display text-lg font-bold tracking-wider text-white">
                        VS
                    </span>
                </span>
                <button
                    type="button"
                    onClick={onSwap}
                    disabled={!home && !away}
                    aria-label="Swap home and away"
                    title="Swap home and away"
                    className="grid size-10 place-items-center rounded-full border border-fi-border bg-fi-surface text-fi-muted transition-colors hover:border-fi-accent/50 hover:text-white disabled:opacity-40"
                >
                    <ArrowLeftRight className="size-4" aria-hidden="true" />
                </button>
            </div>

            <TeamPanel side="away" value={away} badge={badges(away)} teams={teams} exclude={home} onChange={onAwayChange} />
        </div>

        <div className="relative flex flex-col gap-4 border-t border-fi-border bg-fi-inset/60 px-5 py-5 sm:px-7 lg:flex-row lg:items-center lg:justify-between">
            <div className="flex flex-col gap-1.5">
                <VenueSwitch neutral={neutral} onChange={onNeutralChange} />
                <p className="text-xs text-fi-muted">
                    {neutral ? 'Tournament-style: neither side gets home advantage.' : `${home || 'The home side'} gets home advantage.`}
                </p>
            </div>
            <button
                type="button"
                onClick={onPredict}
                disabled={!canPredict || computing}
                className="group relative inline-flex min-h-14 items-center justify-center gap-2.5 overflow-hidden rounded-2xl bg-linear-to-r from-fi-accent via-fi-accent-light to-fi-opp px-8 font-display text-base font-bold text-[#11152A] shadow-[0_12px_40px_-12px_rgba(169,180,255,0.7)] transition-[transform,filter] hover:brightness-110 active:scale-[0.98] disabled:cursor-not-allowed disabled:opacity-50 disabled:shadow-none disabled:hover:brightness-100"
            >
                {computing ? (
                    <Loader2 className="size-5 animate-spin" aria-hidden="true" />
                ) : (
                    <Sparkles className="size-5 transition-transform group-hover:rotate-12" aria-hidden="true" />
                )}
                {computing ? 'Running the model…' : 'Predict outcome'}
            </button>
        </div>
        {error && <p className="relative px-5 pb-5 text-sm text-fi-loss sm:px-7">{error}</p>}
    </Card>
)

export default MatchupBuilder
