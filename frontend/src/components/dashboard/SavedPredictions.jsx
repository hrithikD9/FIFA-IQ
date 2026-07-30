import React, { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import { useAuth } from '../../context/useAuth'
import { fetchPredictionHistory } from '../../services/predictionApi'
import TeamImage from '../TeamImage'

const formatDate = (value) => {
    if (!value) return 'Unknown date'
    const date = new Date(value)
    if (Number.isNaN(date.getTime())) return 'Unknown date'
    return date.toLocaleString(undefined, {
        month: 'short',
        day: 'numeric',
        year: 'numeric',
        hour: '2-digit',
        minute: '2-digit',
    })
}

const toPercent = (value) => {
    const numeric = Number(value)
    if (Number.isNaN(numeric)) return 0
    return Math.min(100, Math.max(0, numeric * 100))
}

const ProbabilityBar = ({ label, value, barClass }) => {
    const percent = toPercent(value)
    return (
        <div>
            <div className="flex items-center justify-between text-[10px] font-bold uppercase tracking-widest text-[#8C909F]">
                <span>{label}</span>
                <span className="text-[#C2C6D6]">{percent.toFixed(0)}%</span>
            </div>
            <div className="mt-1 h-1.5 overflow-hidden rounded-full bg-[#262A35]">
                <div className={`h-full rounded-full ${barClass}`} style={{ width: `${percent}%` }} />
            </div>
        </div>
    )
}

const TeamBlock = ({ team, accentClass }) => {
    const name = team?.name ?? 'TBD'

    return (
        <div className="text-center">
            <TeamImage
                team={team}
                className="mx-auto size-12 rounded-full border border-white/10 bg-[#262A35] object-cover"
                fallbackClassName={accentClass}
            />
            <p className="mt-2 text-xs font-semibold text-[#C2C6D6]">{name}</p>
        </div>
    )
}

const SavedPredictions = () => {
    const { isAuthenticated, loading: authLoading } = useAuth()

    const [predictions, setPredictions] = useState([])
    const [isLoading, setIsLoading] = useState(true)
    const [error, setError] = useState('')

    useEffect(() => {
        // Wait for AuthContext to finish rehydrating the session before deciding
        // whether a fetch is possible — otherwise a page refresh would settle on
        // the empty state before the access token is restored.
        if (authLoading) return undefined

        if (!isAuthenticated) return undefined

        const controller = new AbortController()

        const fetchHistory = async () => {
            setIsLoading(true)
            setError('')

            try {
                const { data, error: requestError, status } = await fetchPredictionHistory({ signal: controller.signal })

                if (requestError && status !== 401 && status !== 404) throw new Error(requestError)

                if (!controller.signal.aborted) {
                    setPredictions(data)
                }
            } catch (fetchError) {
                if (fetchError.name === 'AbortError') return
                console.error('Prediction history fetch failed:', fetchError)
                if (!controller.signal.aborted) {
                    setError(
                        fetchError instanceof Error
                            ? fetchError.message
                            : 'Unable to load prediction history right now.',
                    )
                }
            } finally {
                if (!controller.signal.aborted) {
                    setIsLoading(false)
                }
            }
        }

        fetchHistory()

        return () => controller.abort()
    }, [isAuthenticated, authLoading])

    const visiblePredictions = isAuthenticated ? predictions : []
    const visibleError = isAuthenticated ? error : ''
    const showLoading = authLoading || (isAuthenticated && isLoading)

    return (
        <section className="rounded-3xl border border-white/5 bg-[#1D2230] p-5">
            <div className="mb-5 flex items-center justify-between">
                <h2 className="text-2xl font-bold text-white">Saved Predictions</h2>
                <span className="text-xs font-bold uppercase tracking-[0.2em] text-[#ADC6FF]">Recent</span>
            </div>

            {showLoading ? (
                <div className="flex items-center justify-center gap-3 rounded-2xl border border-[#2B3244] bg-[#171B26] px-4 py-12 text-sm text-[#8C909F]">
                    <svg className="size-5 animate-spin" viewBox="0 0 24 24" fill="none" aria-hidden="true">
                        <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                        <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 0 1 8-8v4a4 4 0 0 0-4 4H4Z" />
                    </svg>
                    Loading your prediction history...
                </div>
            ) : visibleError ? (
                <div className="rounded-2xl border border-rose-500/30 bg-rose-500/10 px-4 py-6 text-sm text-rose-200">
                    {visibleError}
                </div>
            ) : visiblePredictions.length === 0 ? (
                <div className="rounded-2xl border border-dashed border-[#3A425A] bg-[#171B26] px-4 py-12 text-center">
                    <p className="text-sm font-semibold text-[#C2C6D6]">No predictions saved yet</p>
                    <Link to="/predict" className="mt-4 inline-flex min-h-10 items-center rounded-lg bg-[#ADC6FF] px-4 text-sm font-bold text-[#001A42] transition-colors hover:bg-[#D0BCFF]">
                        Go to Predictor
                    </Link>
                </div>
            ) : (
                <div className="grid gap-4 md:grid-cols-2">
                    {visiblePredictions.map((prediction) => {
                        const homeName = prediction?.home_team?.name ?? 'Home'
                        const awayName = prediction?.away_team?.name ?? 'Away'
                        const insight = prediction?.underdog_insight

                        return (
                            <article
                                key={prediction.id ?? `${prediction.match_id}-${prediction.created_at}`}
                                className="rounded-2xl border border-[#2B3244] bg-[#171B26] p-4"
                            >
                                <div className="flex items-center justify-between gap-2">
                                    <span className="rounded-full bg-[#D0BCFF]/15 px-3 py-1 text-[10px] font-bold uppercase tracking-widest text-[#D0BCFF]">
                                        Match Prediction
                                    </span>
                                    <p className="text-xs font-semibold text-[#66708A]">
                                        {formatDate(prediction?.match?.match_date ?? prediction?.created_at)}
                                    </p>
                                </div>

                                <div className="mt-4 flex min-w-0 items-center justify-center gap-2 text-sm font-bold text-white">
                                    <TeamImage team={prediction?.home_team} className="h-3.5 w-5 rounded-sm object-cover" fallbackClassName="border border-[#3A425A] bg-[#262A35] text-[#8C909F]" />
                                    <span className="truncate">{homeName}</span>
                                    <span className="shrink-0 text-[#66708A]">vs</span>
                                    <TeamImage team={prediction?.away_team} className="h-3.5 w-5 rounded-sm object-cover" fallbackClassName="border border-[#3A425A] bg-[#262A35] text-[#8C909F]" />
                                    <span className="truncate">{awayName}</span>
                                </div>

                                <div className="mt-4 grid grid-cols-[1fr_auto_1fr] items-center gap-4">
                                    <TeamBlock
                                        team={prediction?.home_team}
                                        accentClass="border-[#ADC6FF]/30 bg-[#ADC6FF]/10 text-[#ADC6FF]"
                                    />
                                    <div className="text-center">
                                        <p className="text-xl font-black text-[#ADC6FF]">VS</p>
                                        <p className="mt-1 text-[10px] font-bold uppercase tracking-[0.2em] text-[#8C909F]">
                                            {prediction?.match?.status ?? 'PROJ'}
                                        </p>
                                    </div>
                                    <TeamBlock
                                        team={prediction?.away_team}
                                        accentClass="border-[#D0BCFF]/30 bg-[#D0BCFF]/10 text-[#D0BCFF]"
                                    />
                                </div>

                                <div className="mt-5 space-y-2.5">
                                    <ProbabilityBar
                                        label={`${homeName} Win`}
                                        value={prediction?.win_prob_home}
                                        barClass="bg-[#ADC6FF]"
                                    />
                                    <ProbabilityBar
                                        label="Draw"
                                        value={prediction?.draw_prob}
                                        barClass="bg-[#8C909F]"
                                    />
                                    <ProbabilityBar
                                        label={`${awayName} Win`}
                                        value={prediction?.win_prob_away}
                                        barClass="bg-[#D0BCFF]"
                                    />
                                </div>

                                {insight ? (
                                    <p className="mt-4 rounded-xl border border-[#2B3244] bg-[#1D2230] px-3 py-2.5 text-xs leading-5 text-[#C2C6D6]">
                                        {insight}
                                    </p>
                                ) : null}
                            </article>
                        )
                    })}
                </div>
            )}
        </section>
    )
}

export default SavedPredictions
