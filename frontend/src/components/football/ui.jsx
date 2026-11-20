import React, { useState } from 'react'
import { AlertTriangle, RefreshCw } from 'lucide-react'
import { initials, teamCode } from '../../utils/football'

const TONES = {
    neutral: 'bg-white/[0.06] text-fi-text',
    accent: 'bg-fi-accent/15 text-fi-accent-light',
    win: 'bg-fi-win/15 text-fi-win',
    draw: 'bg-fi-draw/15 text-fi-draw',
    loss: 'bg-fi-loss/15 text-fi-loss',
    live: 'bg-fi-live/15 text-fi-live',
    momentum: 'bg-fi-momentum/15 text-fi-momentum',
    opp: 'bg-fi-opp/15 text-fi-opp',
}

export const Card = ({ className = '', children, ...rest }) => (
    <div className={`rounded-2xl border border-fi-border bg-fi-surface ${className}`} {...rest}>
        {children}
    </div>
)

export const Inset = ({ className = '', children }) => (
    <div className={`rounded-xl border border-fi-border/70 bg-fi-inset ${className}`}>{children}</div>
)

export const Pill = ({ tone = 'neutral', dot = false, className = '', children }) => (
    <span
        className={`inline-flex h-[26px] shrink-0 items-center gap-1.5 whitespace-nowrap rounded-full px-2.5 text-xs font-semibold ${TONES[tone] ?? TONES.neutral} ${className}`}
    >
        {dot && <span className="size-1.5 rounded-full bg-current" aria-hidden="true" />}
        {children}
    </span>
)

export const Eyebrow = ({ className = '', children }) => (
    <p className={`text-[11px] font-semibold uppercase tracking-[0.12em] text-fi-muted ${className}`}>{children}</p>
)

/** Club crest image, falling back to a short-code badge when missing or broken. */
export const CrestBadge = ({ team, size = 'md', className = '' }) => {
    const [failed, setFailed] = useState(false)
    const sizes = { sm: 'size-8 text-[10px]', md: 'size-11 text-xs', lg: 'size-16 text-base', xl: 'size-24 text-2xl' }
    const box = `${sizes[size] ?? sizes.md} shrink-0 rounded-xl border border-fi-border bg-fi-inset`

    if (team?.crest && !failed) {
        return (
            <span className={`${box} grid place-items-center p-1.5 ${className}`}>
                <img
                    src={team.crest}
                    alt=""
                    loading="lazy"
                    onError={() => setFailed(true)}
                    className="size-full object-contain"
                />
            </span>
        )
    }
    return (
        <span
            className={`${box} grid place-items-center font-display font-bold tracking-wide text-fi-accent-light ${className}`}
            aria-hidden="true"
        >
            {teamCode(team)}
        </span>
    )
}

/** Player photo, falling back to initials. */
export const PlayerAvatar = ({ name, photoUrl, size = 'md', className = '' }) => {
    const [failed, setFailed] = useState(false)
    const sizes = { sm: 'size-10 text-sm', md: 'size-12 text-base', lg: 'size-36 text-4xl' }
    const box = `${sizes[size] ?? sizes.md} shrink-0 overflow-hidden rounded-full border border-fi-border bg-[#16203A]`
    if (photoUrl && !failed) {
        return (
            <span className={`${box} ${className}`}>
                <img src={photoUrl} alt="" loading="lazy" onError={() => setFailed(true)} className="size-full object-cover object-top" />
            </span>
        )
    }
    return (
        <span className={`${box} grid place-items-center font-display font-bold text-fi-accent-light ${className}`} aria-hidden="true">
            {initials(name)}
        </span>
    )
}

/** Tabs / filters. `options` = [{ value, label }]. */
export const Segmented = ({ options, value, onChange, label, className = '' }) => (
    <div
        role="radiogroup"
        aria-label={label}
        className={`no-scrollbar inline-flex max-w-full overflow-x-auto rounded-xl border border-fi-border bg-fi-surface p-1 ${className}`}
    >
        {options.map((opt) => {
            const active = opt.value === value
            return (
                <button
                    key={opt.value}
                    type="button"
                    role="radio"
                    aria-checked={active}
                    onClick={() => onChange(opt.value)}
                    className={`min-h-9 whitespace-nowrap rounded-[9px] px-3.5 text-sm font-medium transition-colors ${
                        active ? 'bg-fi-accent text-[#11152A]' : 'text-fi-muted hover:text-fi-text'
                    }`}
                >
                    {opt.label}
                </button>
            )
        })}
    </div>
)

export const Button = ({ variant = 'secondary', className = '', children, ...rest }) => {
    const styles =
        variant === 'primary'
            ? 'bg-fi-accent text-[#11152A] hover:bg-fi-accent-light'
            : 'border border-fi-border bg-fi-surface text-fi-text hover:border-fi-accent/50'
    return (
        <button
            type="button"
            className={`inline-flex min-h-11 items-center justify-center gap-2 whitespace-nowrap rounded-xl px-4 text-sm font-semibold transition-colors disabled:cursor-not-allowed disabled:opacity-50 ${styles} ${className}`}
            {...rest}
        >
            {children}
        </button>
    )
}

export const SectionHeader = ({ badge, title, subtitle, right }) => (
    <div className="flex flex-wrap items-center justify-between gap-3">
        <div className="flex min-w-0 items-center gap-3">
            {badge}
            <div className="min-w-0">
                <h2 className="font-display text-xl font-semibold text-white">{title}</h2>
                {subtitle && <p className="text-[13px] text-fi-muted">{subtitle}</p>}
            </div>
        </div>
        {right}
    </div>
)

export const Skeleton = ({ className = '' }) => (
    <div className={`animate-pulse rounded-2xl border border-fi-border bg-fi-surface ${className}`} aria-hidden="true" />
)

export const ErrorState = ({ error, onRetry, className = '' }) => (
    <Card className={`flex flex-col items-center gap-3 px-6 py-10 text-center ${className}`}>
        <AlertTriangle className="size-6 text-fi-momentum" aria-hidden="true" />
        <p className="font-medium text-fi-text">Couldn&apos;t load football data</p>
        <p className="max-w-md text-sm text-fi-muted">{error?.message || 'Something went wrong.'}</p>
        {onRetry && (
            <Button onClick={onRetry}>
                <RefreshCw className="size-4" aria-hidden="true" /> Try again
            </Button>
        )}
    </Card>
)

export const EmptyState = ({ title, children, className = '' }) => (
    <Card className={`px-6 py-10 text-center ${className}`}>
        <p className="font-medium text-fi-text">{title}</p>
        {children && <p className="mx-auto mt-1 max-w-md text-sm text-fi-muted">{children}</p>}
    </Card>
)

export const StaleNotice = ({ meta }) =>
    meta?.stale ? (
        <p className="text-xs text-fi-momentum">
            Showing saved data from {new Date(meta.fetched_at).toLocaleString()} — the data provider is temporarily unavailable.
        </p>
    ) : null
