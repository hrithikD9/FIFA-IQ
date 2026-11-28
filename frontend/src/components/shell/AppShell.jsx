import React, { useEffect, useState } from 'react'
import { Link, NavLink, Outlet } from 'react-router-dom'
import { Database } from 'lucide-react'
import { useAuth } from '../../context/useAuth'
import { fetchLiveMatches } from '../../services/footballApi'
import { initials } from '../../utils/football'

const NAV = [
    { to: '/dashboard', label: 'Dashboard' },
    { to: '/live', label: 'Live Scores', live: true },
    { to: '/fixtures', label: 'Fixtures' },
    { to: '/results', label: 'Results / Scorecards' },
    { to: '/teams', label: 'Teams' },
    { to: '/players', label: 'Players' },
    { to: '/predict', label: 'Match Prediction' },
]

const LIVE_POLL_MS = 60_000

/** Number of matches in play, refreshed every minute (backend-cached). */
function useLiveCount() {
    const [count, setCount] = useState(0)
    useEffect(() => {
        const controller = new AbortController()
        const load = () =>
            fetchLiveMatches(controller.signal)
                .then((body) => setCount(body?.matches?.length ?? 0))
                .catch(() => {})
        load()
        const id = setInterval(load, LIVE_POLL_MS)
        return () => {
            controller.abort()
            clearInterval(id)
        }
    }, [])
    return count
}

const Sidebar = ({ liveCount, isAdmin }) => (
    <aside className="border-b border-fi-border px-4 py-4 lg:sticky lg:top-[77px] lg:h-[calc(100vh-77px)] lg:w-60 lg:shrink-0 lg:overflow-y-auto lg:border-r lg:border-b-0 lg:px-4 lg:py-6">
        <div className="hidden items-center gap-3 px-2 lg:flex">
            <span className="grid size-10 place-items-center rounded-xl bg-fi-accent font-display text-sm font-bold text-[#11152A]">
                TP
            </span>
            <div>
                <p className="text-sm font-semibold text-white">The Pitch</p>
                <p className="text-[10px] font-semibold uppercase tracking-[0.18em] text-fi-muted">Elite analytics</p>
            </div>
        </div>

        <nav aria-label="Main" className="no-scrollbar -mx-1 flex gap-1 overflow-x-auto lg:mx-0 lg:mt-8 lg:flex-col">
            {NAV.map((item) => (
                <NavLink
                    key={item.to}
                    to={item.to === '/dashboard' && isAdmin ? '/admin' : item.to}
                    className={({ isActive }) =>
                        `flex min-h-11 shrink-0 items-center justify-between gap-3 whitespace-nowrap rounded-xl border px-4 text-[15px] transition-colors ${
                            isActive
                                ? 'border-fi-accent/30 bg-fi-nav text-white'
                                : 'border-transparent text-fi-muted hover:bg-white/[0.03] hover:text-fi-text'
                        }`
                    }
                >
                    {item.label}
                    {item.live && liveCount > 0 && (
                        <span className="inline-flex items-center gap-1 rounded-full bg-fi-live/15 px-2 py-0.5 text-[10px] font-bold uppercase text-fi-live">
                            <span className="size-1.5 animate-pulse rounded-full bg-current" aria-hidden="true" />
                            Live
                        </span>
                    )}
                </NavLink>
            ))}
        </nav>

        <div className="mt-6 hidden rounded-2xl border border-fi-border bg-fi-surface p-4 lg:block">
            <p className="flex items-center gap-2 text-sm font-semibold text-white">
                <Database className="size-4 text-fi-accent" aria-hidden="true" /> Data source
            </p>
            <p className="mt-2 text-[13px] leading-relaxed text-fi-muted">
                Fixtures, results and squads from football-data.org; player photos from TheSportsDB. Live scores are
                delayed on the free data tier.
            </p>
        </div>
    </aside>
)

const AppShell = () => {
    const { user } = useAuth()
    const liveCount = useLiveCount()
    const displayName = user?.fullName || user?.email || 'Account'

    return (
        <div className="min-h-screen bg-fi-bg font-body text-fi-text [color-scheme:dark]">
            <header className="sticky top-0 z-30 flex h-[77px] items-center justify-between gap-4 border-b border-fi-border bg-fi-bg/95 px-4 backdrop-blur sm:px-8">
                <Link to="/" aria-label="FIFA-IQ home" className="font-display text-2xl font-bold tracking-tight text-fi-accent-light">
                    FIFA-IQ
                </Link>
                <Link
                    to="/profile"
                    title={displayName}
                    aria-label={`Account: ${displayName}`}
                    className="grid size-11 place-items-center rounded-full border border-fi-border bg-fi-nav text-sm font-semibold text-white hover:border-fi-accent/50"
                >
                    {initials(user?.fullName || user?.email?.split('@')[0])}
                </Link>
            </header>

            <div className="lg:flex">
                <Sidebar liveCount={liveCount} isAdmin={Boolean(user?.isAdmin)} />
                <main className="min-w-0 flex-1 px-4 py-6 sm:px-8">
                    <div className="mx-auto max-w-[1180px]">
                        <Outlet />
                    </div>
                </main>
            </div>
        </div>
    )
}

export default AppShell
