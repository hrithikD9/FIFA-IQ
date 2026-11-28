import React from 'react'
import { Link } from 'react-router-dom'
import { CheckCircle2, Info, XCircle } from 'lucide-react'
import ProbabilitySplit from '../football/ProbabilitySplit'
import { Card, ErrorState, Inset, SectionHeader, Skeleton } from '../football/ui'
import { useApi } from '../../hooks/useApi'
import { fetchModelCheck } from '../../services/predictionApi'
import { formatLongDate, pct0 } from '../../utils/football'

const OUTCOME_TEXT = { home: 'home win', draw: 'draw', away: 'away win' }

/** The active model graded on the latest World Cup. Lazy-loaded by the prediction page. */
const ModelCheck = () => {
    const { data, error, loading, reload } = useApi('model-check', (signal) => fetchModelCheck(signal))
    if (error) return <ErrorState error={error} onRetry={reload} />
    if (loading && !data) return <Skeleton className="h-72" />

    const s = data.summary
    const competition = data.competition?.name ?? 'World Cup'
    return (
        <Card className="flex flex-col gap-5 p-5 sm:p-6">
            <SectionHeader
                title={`Model check: ${competition}`}
                subtitle="The current model predicts each finished match from the teams alone, then is graded against the real result."
            />
            <div className="grid grid-cols-1 gap-3 sm:grid-cols-3">
                <Inset className="flex flex-col gap-1 p-4">
                    <p className="text-xs text-fi-muted">Accuracy</p>
                    <p className="font-display text-3xl font-bold text-white">{s.accuracy == null ? '—' : pct0(s.accuracy)}</p>
                    <p className="text-xs text-fi-muted">
                        {s.correct} of {s.graded} outcomes called correctly
                    </p>
                </Inset>
                <Inset className="flex flex-col gap-1 p-4">
                    <p className="text-xs text-fi-muted">Brier score (lower is better)</p>
                    <p className="font-display text-3xl font-bold text-white">{s.brier ?? '—'}</p>
                    <p className="text-xs text-fi-muted">Pure guessing (⅓ each) scores {s.uniform_brier}</p>
                </Inset>
                <Inset className="flex flex-col gap-1 p-4">
                    <p className="text-xs text-fi-muted">Coverage</p>
                    <p className="font-display text-3xl font-bold text-white">
                        {data.coverage.evaluated}
                        <span className="text-lg text-fi-muted"> / {data.coverage.finished}</span>
                    </p>
                    <p className="text-xs text-fi-muted">Matches between teams the model knows</p>
                </Inset>
            </div>

            {data.matches.length > 0 && (
                <div className="flex flex-col gap-2">
                    {data.matches.map(({ match, prediction, grade }) => (
                        <Link
                            key={match.id}
                            to={`/results/${match.id}`}
                            className="flex flex-col gap-2.5 rounded-xl border border-fi-border/70 bg-fi-inset p-4 hover:border-fi-accent/40"
                        >
                            <div className="flex flex-wrap items-center gap-x-3 gap-y-1">
                                {grade.correct ? (
                                    <CheckCircle2 className="size-4 shrink-0 text-fi-win" aria-label="Correct" />
                                ) : (
                                    <XCircle className="size-4 shrink-0 text-fi-loss" aria-label="Wrong" />
                                )}
                                <span className="font-semibold text-white">
                                    {match.home_team.name} {match.score.home}–{match.score.away} {match.away_team.name}
                                </span>
                                <span className="text-xs text-fi-muted">
                                    {match.stage?.replaceAll('_', ' ').toLowerCase()} · {formatLongDate(match.utc_date)}
                                </span>
                            </div>
                            <ProbabilitySplit
                                home={prediction.home}
                                draw={prediction.draw}
                                away={prediction.away}
                                homeLabel={match.home_team.name}
                                awayLabel={match.away_team.name}
                            />
                            <p className="text-xs text-fi-muted">
                                Predicted {OUTCOME_TEXT[grade.predicted]}, actual {OUTCOME_TEXT[grade.actual]} · Brier {grade.brier}
                            </p>
                        </Link>
                    ))}
                </div>
            )}

            <p className="flex gap-2 text-xs leading-relaxed text-fi-muted">
                <Info className="mt-0.5 size-3.5 shrink-0" aria-hidden="true" />
                The baseline formula only knows {data.coverage.evaluated ? 'a handful of' : 'a few'} national teams, so it
                covers few matches. The deep-learning model in development will be judged on this same check across all{' '}
                {data.coverage.finished} matches.
            </p>
        </Card>
    )
}

export default ModelCheck
