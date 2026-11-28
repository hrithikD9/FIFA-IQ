import React, { Suspense, lazy, useState } from 'react'
import { useLocation } from 'react-router-dom'
import { FlaskConical, Info } from 'lucide-react'
import MatchupBuilder from '../components/prediction/MatchupBuilder'
import PredictionResult, { PredictionSkeleton } from '../components/prediction/PredictionResult'
import { Card, ErrorState, Pill, Skeleton } from '../components/football/ui'
import { useApi } from '../hooks/useApi'
import { useInView } from '../hooks/useInView'
import { computePrediction, fetchModel, savePrediction } from '../services/predictionApi'
import { formatLongDate } from '../utils/football'

// Below the fold: its code and data load only when scrolled near.
const ModelCheck = lazy(() => import('../components/prediction/ModelCheck'))

const LazyModelCheck = () => {
    const [ref, inView] = useInView('300px')
    return (
        <div ref={ref}>
            {inView ? (
                <Suspense fallback={<Skeleton className="h-72" />}>
                    <ModelCheck />
                </Suspense>
            ) : (
                <Skeleton className="h-72" />
            )}
        </div>
    )
}

const ModelBadge = ({ model }) =>
    model ? (
        <Card className="flex max-w-sm flex-col gap-1.5 p-4">
            <div className="flex items-center gap-2">
                <FlaskConical className="size-4 text-fi-accent" aria-hidden="true" />
                <p className="text-sm font-semibold text-white">{model.name}</p>
                <Pill tone={model.kind === 'baseline' ? 'momentum' : 'win'}>{model.version}</Pill>
            </div>
            <p className="text-xs leading-relaxed text-fi-muted">{model.description}</p>
        </Card>
    ) : null

const MatchPrediction = () => {
    const location = useLocation()
    // Prefill from "Predict with AI" links: { home, away, externalMatchId, neutral, competition, utcDate }.
    const incoming = location.state ?? {}
    const modelQuery = useApi('prediction-model', (signal) => fetchModel(signal))
    const teams = modelQuery.data?.teams ?? []
    const known = (name) => teams.find((t) => t.toLowerCase() === (name ?? '').toLowerCase())

    const [home, setHome] = useState(incoming.home ?? '')
    const [away, setAway] = useState(incoming.away ?? '')
    const [neutral, setNeutral] = useState(Boolean(incoming.neutral))
    const [fixtureId, setFixtureId] = useState(incoming.externalMatchId ?? null)
    const [result, setResult] = useState(null)
    const [computing, setComputing] = useState(false)
    const [error, setError] = useState('')
    const [saveState, setSaveState] = useState({ saving: false, saved: false, error: '' })
    const [openedAt] = useState(() => Date.now())

    // Resolve prefilled names to the catalog spelling once teams load.
    const homeValue = known(home) ?? (teams.length ? '' : home)
    const awayValue = known(away) ?? (teams.length ? '' : away)
    const unsupported = teams.length ? [incoming.home, incoming.away].filter((n) => n && !known(n)) : []
    const fixture =
        fixtureId && incoming.externalMatchId === fixtureId
            ? {
                  competition: incoming.competition ?? 'Fixture',
                  date: incoming.utcDate ? formatLongDate(incoming.utcDate) : '',
                  played: incoming.utcDate ? new Date(incoming.utcDate).getTime() < openedAt : false,
              }
            : null
    // Flag + code per team: the backend's national-team directory, else the fixture link's crest.
    const teamInfo = modelQuery.data?.team_info ?? {}
    const badgeFor = (name) => {
        if (!name) return null
        const info = teamInfo[name] ?? {}
        const fromFixture =
            name === known(incoming.home) ? incoming.homeCrest : name === known(incoming.away) ? incoming.awayCrest : null
        return { crest: info.crest ?? fromFixture ?? null, tla: info.tla ?? null }
    }

    const clearResult = () => {
        setResult(null)
        setError('')
        setSaveState({ saving: false, saved: false, error: '' })
    }
    const change = (setter) => (value) => {
        setter(value)
        setFixtureId(null) // a manual change detaches the prediction from the fixture
        clearResult()
    }

    const run = async () => {
        if (!homeValue || !awayValue) return
        setComputing(true)
        clearResult()
        try {
            setResult(await computePrediction({ homeTeam: homeValue, awayTeam: awayValue, neutral }))
        } catch (e) {
            setError(e.message || 'Could not compute a prediction right now.')
        } finally {
            setComputing(false)
        }
    }

    const save = async () => {
        setSaveState({ saving: true, saved: false, error: '' })
        try {
            await savePrediction({ homeTeam: result.home_team, awayTeam: result.away_team, neutral, externalMatchId: fixtureId })
            setSaveState({ saving: false, saved: true, error: '' })
        } catch (e) {
            setSaveState({ saving: false, saved: false, error: e.message || 'Could not save the prediction.' })
        }
    }

    return (
        <div className="flex flex-col gap-6">
            <header className="flex flex-wrap items-end justify-between gap-5">
                <div className="max-w-2xl">
                    <Pill tone="accent">International matches</Pill>
                    <h1 className="mt-3 font-display text-4xl font-bold text-white sm:text-[44px]">Match Prediction</h1>
                    <p className="mt-2 text-[15px] leading-relaxed text-fi-muted">
                        Home win, draw and away win probabilities for national-team matches. Club matches aren&apos;t
                        predicted.
                    </p>
                </div>
                <ModelBadge model={modelQuery.data?.model} />
            </header>

            {modelQuery.error ? (
                <ErrorState error={modelQuery.error} onRetry={modelQuery.reload} />
            ) : (
                <MatchupBuilder
                    teams={teams}
                    badges={badgeFor}
                    home={homeValue}
                    away={awayValue}
                    onHomeChange={change(setHome)}
                    onAwayChange={change(setAway)}
                    onSwap={() => {
                        setHome(awayValue)
                        setAway(homeValue)
                        setFixtureId(null)
                        clearResult()
                    }}
                    neutral={neutral}
                    onNeutralChange={(value) => {
                        setNeutral(value)
                        clearResult()
                    }}
                    onPredict={run}
                    computing={computing}
                    canPredict={Boolean(homeValue && awayValue) && !modelQuery.loading}
                    error={error}
                    notice={
                        unsupported.length > 0 && (
                            <div className="flex gap-3 rounded-xl border border-fi-momentum/40 bg-fi-momentum/10 px-4 py-3 text-sm text-fi-momentum">
                                <Info className="mt-0.5 size-4 shrink-0" aria-hidden="true" />
                                <p>
                                    The current model can&apos;t predict {unsupported.join(' or ')} yet; it covers {teams.length}{' '}
                                    national teams. Pick a supported team below.
                                </p>
                            </div>
                        )
                    }
                />
            )}

            {computing ? (
                <PredictionSkeleton />
            ) : (
                result && (
                    <PredictionResult
                        key={`${result.home_team}-${result.away_team}-${result.neutral}`}
                        result={result}
                        fixture={fixture}
                        badges={{ home: badgeFor(result.home_team), away: badgeFor(result.away_team) }}
                        onSave={save}
                        saveState={saveState}
                    />
                )
            )}

            <LazyModelCheck />
        </div>
    )
}

export default MatchPrediction
