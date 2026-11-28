import React, { useState } from 'react'
import { Activity, AlertTriangle, CheckCircle2, RefreshCw } from 'lucide-react'
import DailyBars from '../components/admin/DailyBars'
import ProbabilitySplit from '../components/football/ProbabilitySplit'
import { Button, Card, EmptyState, ErrorState, Inset, Pill, SectionHeader, Segmented, Skeleton } from '../components/football/ui'
import { useApi } from '../hooks/useApi'
import { fetchAdminOverview, fetchAdminUsers, fetchApiUsage } from '../services/dashboardApi'
import { timeAgo } from '../utils/football'

const Kpi = ({ label, value, caption, tone = 'text-white' }) => (
    <Card className="flex min-h-28 flex-col justify-between gap-1 p-4">
        <p className="text-[13px] text-fi-muted">{label}</p>
        <p className={`font-display text-3xl font-bold tabular-nums ${tone}`}>{value}</p>
        <p className="text-xs text-fi-muted">{caption}</p>
    </Card>
)

const thClass = 'px-4 py-2.5 text-left text-[11px] font-semibold uppercase tracking-wider text-fi-muted'
const tdClass = 'px-4 py-3'

const ApiHealth = ({ query }) => {
    if (query.error?.status === 503) {
        return (
            <p className="text-sm text-fi-muted">
                The API request log isn&apos;t set up. Run <code className="text-fi-text">backend/supabase_football_api.sql</code> in
                Supabase.
            </p>
        )
    }
    if (query.error) return <ErrorState error={query.error} onRetry={query.reload} />
    if (!query.data) return <Skeleton className="h-40" />
    const { providers, recent_errors: errors } = query.data
    if (!providers.length) return <p className="text-sm text-fi-muted">No provider requests in the last 24 hours.</p>

    return (
        <div className="flex flex-col gap-4">
            {providers.map((p) => {
                const errorRate = p.requests_24h ? p.errors_24h / p.requests_24h : 0
                const healthy = errorRate < 0.1
                return (
                    <Inset key={p.provider} className="flex flex-col gap-3 p-4">
                        <div className="flex items-center justify-between gap-2">
                            <p className="font-semibold text-white">{p.provider}</p>
                            <Pill tone={healthy ? 'win' : 'momentum'}>
                                {healthy ? (
                                    <CheckCircle2 className="size-3.5" aria-hidden="true" />
                                ) : (
                                    <AlertTriangle className="size-3.5" aria-hidden="true" />
                                )}
                                {healthy ? 'Healthy' : 'Degraded'}
                            </Pill>
                        </div>
                        <dl className="grid grid-cols-2 gap-x-4 gap-y-2 text-sm sm:grid-cols-4">
                            {[
                                ['Requests', p.requests_24h],
                                ['Errors', `${p.errors_24h} (${Math.round(errorRate * 100)}%)`],
                                ['Rate-limited', p.rate_limited_24h],
                                ['Avg latency', p.avg_latency_ms != null ? `${p.avg_latency_ms} ms` : '—'],
                            ].map(([k, v]) => (
                                <div key={k}>
                                    <dt className="text-xs text-fi-muted">{k}</dt>
                                    <dd className="font-semibold tabular-nums text-white">{v}</dd>
                                </div>
                            ))}
                        </dl>
                        <p className="text-xs text-fi-muted">Last request {timeAgo(p.last_request_at)}</p>
                    </Inset>
                )
            })}
            {errors.length > 0 && (
                <div className="flex flex-col gap-2">
                    <p className="text-[11px] font-semibold uppercase tracking-[0.12em] text-fi-muted">Recent errors</p>
                    {errors.slice(0, 5).map((e, i) => (
                        <div key={i} className="flex items-center gap-3 text-[13px]">
                            <Pill tone="loss">{e.status_code ?? 'net'}</Pill>
                            <span className="min-w-0 flex-1 truncate font-mono text-fi-text" title={e.endpoint}>
                                {e.endpoint}
                            </span>
                            <span className="shrink-0 text-xs text-fi-muted">{timeAgo(e.created_at)}</span>
                        </div>
                    ))}
                </div>
            )}
        </div>
    )
}

const USER_FILTERS = [
    { value: 'all', label: 'All' },
    { value: 'admins', label: 'Admins' },
    { value: 'active', label: 'Active 7d' },
]

const UsersTable = ({ query }) => {
    const [filter, setFilter] = useState('all')
    const [weekAgo] = useState(() => Date.now() - 7 * 86_400_000)
    if (query.error) return <ErrorState error={query.error} onRetry={query.reload} />
    if (!query.data) return <Skeleton className="h-56" />
    const users = query.data.users.filter((u) =>
        filter === 'admins' ? u.is_admin : filter === 'active' ? u.last_sign_in_at && new Date(u.last_sign_in_at) >= weekAgo : true,
    )

    return (
        <div className="flex flex-col gap-3">
            <Segmented options={USER_FILTERS} value={filter} onChange={setFilter} label="User filter" className="self-start" />
            {users.length === 0 ? (
                <EmptyState title="No users match this filter" />
            ) : (
                <div className="no-scrollbar overflow-x-auto rounded-xl border border-fi-border/70">
                    <table className="w-full min-w-[560px] text-sm">
                        <thead className="bg-fi-inset">
                            <tr>
                                <th className={thClass}>User</th>
                                <th className={thClass}>Role</th>
                                <th className={thClass}>Joined</th>
                                <th className={thClass}>Last active</th>
                                <th className={`${thClass} text-right`}>Predictions</th>
                            </tr>
                        </thead>
                        <tbody>
                            {users.map((u) => (
                                <tr key={u.id} className="border-t border-fi-border/50">
                                    <td className={tdClass}>
                                        <p className="font-semibold text-white">{u.full_name || '—'}</p>
                                        <p className="text-xs text-fi-muted">{u.email}</p>
                                    </td>
                                    <td className={tdClass}>
                                        <Pill tone={u.is_admin ? 'accent' : 'neutral'}>{u.is_admin ? 'Admin' : 'User'}</Pill>
                                    </td>
                                    <td className={`${tdClass} text-fi-text`}>{timeAgo(u.created_at)}</td>
                                    <td className={`${tdClass} text-fi-text`}>{u.last_sign_in_at ? timeAgo(u.last_sign_in_at) : 'Never'}</td>
                                    <td className={`${tdClass} text-right font-semibold tabular-nums text-white`}>{u.prediction_count}</td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>
            )}
        </div>
    )
}

const RecentPredictions = ({ rows }) =>
    rows.length === 0 ? (
        <p className="text-sm text-fi-muted">No predictions saved yet.</p>
    ) : (
        <div className="flex flex-col gap-3">
            {rows.map((p) => (
                <Inset key={p.id} className="flex flex-col gap-2.5 p-4">
                    <div className="flex flex-wrap items-baseline justify-between gap-2">
                        <p className="font-semibold text-white">
                            {p.home_team ?? 'Home'} <span className="text-fi-muted">vs</span> {p.away_team ?? 'Away'}
                        </p>
                        <span className="text-xs text-fi-muted">{timeAgo(p.created_at)}</span>
                    </div>
                    <ProbabilitySplit
                        home={p.win_prob_home}
                        draw={p.draw_prob}
                        away={p.win_prob_away}
                        homeLabel={p.home_team ?? 'Home'}
                        awayLabel={p.away_team ?? 'Away'}
                    />
                    <p className="text-xs text-fi-muted">by {p.user_name || p.user_email || 'unknown user'}</p>
                </Inset>
            ))}
        </div>
    )

const AdminDashboard = () => {
    const overview = useApi('admin-overview', (signal) => fetchAdminOverview(signal))
    const users = useApi('admin-users', (signal) => fetchAdminUsers(signal))
    const apiUsage = useApi('admin-api-usage', (signal) => fetchApiUsage(signal))

    const refresh = () => {
        overview.reload()
        users.reload()
        apiUsage.reload()
    }
    const busy = overview.loading || users.loading || apiUsage.loading

    const o = overview.data
    const api = apiUsage.data?.providers ?? []
    const apiRequests = api.reduce((n, p) => n + p.requests_24h, 0)
    const apiErrors = api.reduce((n, p) => n + p.errors_24h, 0)
    const daily = o?.predictions.daily ?? []

    return (
        <div className="flex flex-col gap-6">
            <header className="flex flex-wrap items-end justify-between gap-4">
                <div>
                    <Pill tone="accent">Admin</Pill>
                    <h1 className="mt-3 font-display text-4xl font-bold text-white sm:text-[44px]">Platform overview</h1>
                    <p className="mt-2 text-[15px] text-fi-muted">Users, prediction activity and football-data API health.</p>
                </div>
                <Button onClick={refresh} disabled={busy}>
                    <RefreshCw className={`size-4 ${busy ? 'animate-spin' : ''}`} aria-hidden="true" /> Refresh
                </Button>
            </header>

            {overview.error ? (
                <ErrorState error={overview.error} onRetry={overview.reload} />
            ) : !o ? (
                <div className="grid grid-cols-2 gap-3 lg:grid-cols-4">
                    {[0, 1, 2, 3].map((i) => (
                        <Skeleton key={i} className="h-28" />
                    ))}
                </div>
            ) : (
                <div className="grid grid-cols-2 gap-3 lg:grid-cols-4">
                    <Kpi label="Users" value={o.users.total} caption={`+${o.users.new_7d} new this week · ${o.users.admins} admin`} />
                    <Kpi label="Active users" value={o.users.active_7d} caption="Signed in during the last 7 days" />
                    <Kpi label="Predictions" value={o.predictions.total} caption={`${o.predictions.last_7d} in the last 7 days`} />
                    <Kpi
                        label="API requests (24 h)"
                        value={apiUsage.data ? apiRequests : '—'}
                        caption={apiUsage.data ? `${apiErrors} error${apiErrors === 1 ? '' : 's'}` : 'Request log unavailable'}
                        tone={apiErrors ? 'text-fi-momentum' : 'text-white'}
                    />
                </div>
            )}

            <div className="grid grid-cols-1 gap-6 lg:grid-cols-[minmax(0,1fr)_380px]">
                <Card className="flex min-w-0 flex-col gap-4 p-5 sm:p-6">
                    <SectionHeader
                        title="Predictions per day"
                        subtitle={o ? `Last 14 days · ${daily.reduce((n, d) => n + d.count, 0)} total · ${o.predictions.predictors_7d} users predicting this week` : 'Last 14 days'}
                    />
                    {!o ? (
                        <Skeleton className="h-48" />
                    ) : daily.some((d) => d.count > 0) ? (
                        <DailyBars data={daily} />
                    ) : (
                        <EmptyState title="No predictions in the last 14 days">
                            {o.predictions.total} saved in total; the chart fills in as users save new predictions.
                        </EmptyState>
                    )}
                </Card>
                <Card className="flex min-w-0 flex-col gap-4 p-5 sm:p-6">
                    <SectionHeader
                        badge={
                            <span className="grid size-10 place-items-center rounded-xl bg-fi-accent/10 text-fi-accent">
                                <Activity className="size-5" aria-hidden="true" />
                            </span>
                        }
                        title="API monitoring"
                        subtitle="External football data · last 24 hours"
                    />
                    <ApiHealth query={apiUsage} />
                </Card>
            </div>

            <div className="grid grid-cols-1 gap-6 lg:grid-cols-[minmax(0,1fr)_380px]">
                <Card className="flex min-w-0 flex-col gap-4 p-5 sm:p-6">
                    <SectionHeader
                        title="Users"
                        subtitle={users.data ? `${users.data.total} registered` : 'Registered accounts'}
                    />
                    <UsersTable query={users} />
                </Card>
                <Card className="flex min-w-0 flex-col gap-4 p-5 sm:p-6">
                    <SectionHeader title="Latest predictions" subtitle="Across all users" />
                    {o ? <RecentPredictions rows={o.recent_predictions.slice(0, 6)} /> : <Skeleton className="h-56" />}
                </Card>
            </div>
        </div>
    )
}

export default AdminDashboard
