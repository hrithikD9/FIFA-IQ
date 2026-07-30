import React, { useMemo, useState } from 'react'
import { useLocation } from 'react-router-dom'
import Navbar from '../components/Navbar'
import Footer from '../components/Footer'
import MatchHeader from '../components/predictions/MatchHeader'
import PredictionControls from '../components/predictions/PredictionControls'
import WinProbabilityGrid from '../components/predictions/WinProbabilityGrid'
import UnderdogInsights from '../components/predictions/UnderdogInsights'
import { useAuth } from '../context/useAuth'
import { computePrediction, savePrediction } from '../services/predictionApi'
import { computeTelemetry } from '../services/telemetry'
import argentinaFlag from '../assets/Arg.png'
import franceFlag from '../assets/Fra.png'

const favoriteTeamToCode = {
    argentina: 'ARG',
    france: 'FRA',
    brazil: 'BRA',
    england: 'ENG',
    germany: 'GER',
}

// Real local assets exist only for Argentina and France. The remaining
// international teams use CDN flags so each card shows the correct flag
// instead of reusing the ARG/FRA images.
const flagcdn = (iso) => `https://flagcdn.com/w160/${iso.toLowerCase()}.png`

// Per-team international telemetry metadata used to drive the dynamic
// match telemetry cards and engine logs (xG, possession, defensive rating,
// high-press intensity).
const TEAM_CATALOG = [
    { code: 'ARG', name: 'Argentina', isoCode: 'AR', flag: argentinaFlag, xg: 2.05, possession: 60.2, defense: 84, press: 78 },
    { code: 'FRA', name: 'France', isoCode: 'FR', flag: franceFlag, xg: 1.98, possession: 55.6, defense: 86, press: 82 },
    { code: 'BRA', name: 'Brazil', isoCode: 'BR', flag: flagcdn('br'), xg: 1.92, possession: 58.1, defense: 81, press: 75 },
    { code: 'ESP', name: 'Spain', isoCode: 'ES', flag: flagcdn('es'), xg: 1.90, possession: 66.4, defense: 83, press: 71 },
    { code: 'ENG', name: 'England', isoCode: 'GB-ENG', flag: flagcdn('gb-eng'), xg: 1.85, possession: 57.3, defense: 85, press: 76 },
    { code: 'GER', name: 'Germany', isoCode: 'DE', flag: flagcdn('de'), xg: 1.96, possession: 59.8, defense: 80, press: 84 },
]

const getTeamDefaults = (favorites) => {
    const nationalTeams = favorites?.nationalTeams ?? []
    const favoriteCodes = nationalTeams.map((teamId) => favoriteTeamToCode[teamId]).filter(Boolean)

    return {
        homeTeam: favoriteCodes[0] ?? 'ARG',
        awayTeam: favoriteCodes.find((code) => code !== (favoriteCodes[0] ?? 'ARG')) ?? 'FRA',
    }
}

const getStoredFavorites = () => {
    const storedFavorites = localStorage.getItem('fifa-iq.onboarding.favorites')

    if (!storedFavorites) {
        return null
    }

    try {
        return JSON.parse(storedFavorites)
    } catch {
        localStorage.removeItem('fifa-iq.onboarding.favorites')
        return null
    }
}

const MatchOutcomePrediction = () => {
    const { user, loading: authLoading, isAuthenticated } = useAuth()
    const location = useLocation()
    const [isGenerating, setIsGenerating] = useState(false)
    const [isSaving, setIsSaving] = useState(false)
    const [isSaved, setIsSaved] = useState(false)
    const [prediction, setPrediction] = useState(null)
    const [error, setError] = useState('')
    const [saveMessage, setSaveMessage] = useState('')
    const [latencyMs, setLatencyMs] = useState(null)
    const [runId, setRunId] = useState(0)

    const teamDefaults = useMemo(() => {
        const routeFavorites = location.state?.favorites
        return getTeamDefaults(routeFavorites ?? user?.favorites ?? getStoredFavorites())
    }, [location.state, user])

    const [selectedHomeTeam, setSelectedHomeTeam] = useState(teamDefaults.homeTeam)
    const [selectedAwayTeam, setSelectedAwayTeam] = useState(teamDefaults.awayTeam)

    const homeTeam = TEAM_CATALOG.find((team) => team.code === selectedHomeTeam) ?? TEAM_CATALOG[0]
    const awayTeam = TEAM_CATALOG.find((team) => team.code === selectedAwayTeam) ?? TEAM_CATALOG[1]

    // Dynamic, match-aware telemetry derived from the live probabilities,
    // team metadata, and the measured engine latency.
    const telemetry = useMemo(
        () => computeTelemetry(homeTeam, awayTeam, prediction, latencyMs),
        [homeTeam, awayTeam, prediction, latencyMs],
    )

    const resetOutcome = () => {
        setPrediction(null)
        setIsSaved(false)
        setSaveMessage('')
    }

    const handleHomeTeamChange = (teamCode) => {
        setSelectedHomeTeam(teamCode)
        resetOutcome()
    }

    const handleAwayTeamChange = (teamCode) => {
        setSelectedAwayTeam(teamCode)
        resetOutcome()
    }

    const handleGenerate = async () => {
        if (authLoading || !isAuthenticated) {
            setError('Your session is still loading. Please try again in a moment.')
            return
        }

        setIsGenerating(true)
        setError('')
        setIsSaved(false)
        setSaveMessage('')
        setRunId((id) => id + 1) // restart the live engine-log stream

        const startedAt = performance.now()
        const { data, error: requestError } = await computePrediction({
            homeTeam: homeTeam.name,
            awayTeam: awayTeam.name,
        })
        setLatencyMs(performance.now() - startedAt)

        if (requestError || !data) {
            setPrediction(null)
            setError(requestError || 'Unable to generate prediction right now.')
        } else {
            setPrediction({
                homeWin: Number(data.win_prob_home),
                awayWin: Number(data.win_prob_away),
                draw: Number(data.draw_prob),
                insight: data.underdog_insight,
            })
        }

        setIsGenerating(false)
    }

    const handleShare = () => {
        console.info('Share report placeholder triggered')
    }

    const handleSave = async () => {
        if (!prediction || isSaving || isSaved || authLoading || !isAuthenticated) {
            return
        }

        setIsSaving(true)
        setSaveMessage('')

        const { error: requestError } = await savePrediction({
            homeTeam: homeTeam.name,
            awayTeam: awayTeam.name,
            winHome: prediction.homeWin,
            winAway: prediction.awayWin,
            draw: prediction.draw,
            insight: prediction.insight,
        })

        if (requestError) {
            setSaveMessage(requestError)
        } else {
            setIsSaved(true)
            setSaveMessage('Prediction Saved to Dashboard!')
        }

        setIsSaving(false)
    }

    return (
        <div className="">
            <Navbar />
            <section className="mx-6 my-4 space-y-6">
                <MatchHeader homeTeam={homeTeam} awayTeam={awayTeam} />

                <div className="flex gap-x-10 mt-20">
                    <PredictionControls
                        teams={TEAM_CATALOG}
                        homeTeam={homeTeam}
                        awayTeam={awayTeam}
                        isGenerating={isGenerating}
                        error={error}
                        onHomeTeamChange={handleHomeTeamChange}
                        onAwayTeamChange={handleAwayTeamChange}
                        onGenerate={handleGenerate}
                    />
                    <WinProbabilityGrid
                        isGenerating={isGenerating}
                        prediction={prediction}
                        homeTeam={homeTeam}
                        awayTeam={awayTeam}
                        isSaving={isSaving}
                        isSaved={isSaved}
                        saveMessage={saveMessage}
                        onShare={handleShare}
                        onSave={handleSave}
                        telemetry={telemetry}
                    />
                </div>

                <UnderdogInsights
                    isGenerating={isGenerating}
                    prediction={prediction}
                    homeTeam={homeTeam}
                    awayTeam={awayTeam}
                    telemetry={telemetry}
                    runId={runId}
                />
            </section>
            <Footer />
        </div>
    )
}

export default MatchOutcomePrediction
