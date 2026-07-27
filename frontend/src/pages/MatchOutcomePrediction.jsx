import React, { useMemo, useState } from 'react'
import { useLocation } from 'react-router-dom'
import Navbar from '../components/Navbar'
import Footer from '../components/Footer'
import MatchHeader from '../components/predictions/MatchHeader'
import PredictionControls from '../components/predictions/PredictionControls'
import WinProbabilityGrid from '../components/predictions/WinProbabilityGrid'
import UnderdogInsights from '../components/predictions/UnderdogInsights'
import { useAuth } from '../context/useAuth'
import { generatePrediction } from '../services/predictionApi'
import argentinaFlag from '../assets/Arg.png'
import franceFlag from '../assets/Fra.png'

const favoriteTeamToCode = {
    argentina: 'ARG',
    france: 'FRA',
    brazil: 'BRA',
    england: 'ENG',
    germany: 'GER',
}

const TEAM_CATALOG = [
    { code: 'ARG', name: 'Argentina', isoCode: 'AR', flag: argentinaFlag },
    { code: 'FRA', name: 'France', isoCode: 'FR', flag: franceFlag },
    { code: 'BRA', name: 'Brazil', isoCode: 'BR', flag: argentinaFlag },
    { code: 'ESP', name: 'Spain', isoCode: 'ES', flag: franceFlag },
    { code: 'ENG', name: 'England', isoCode: 'GB-ENG', flag: argentinaFlag },
    { code: 'GER', name: 'Germany', isoCode: 'DE', flag: franceFlag },
]

const MATCH_PAIR_TO_ID = {
    'ARG-FRA': 1,
    'FRA-ARG': 1,
}

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
    const { user } = useAuth()
    const location = useLocation()
    const [isGenerating, setIsGenerating] = useState(false)
    const [prediction, setPrediction] = useState(null)
    const [error, setError] = useState('')

    const teamDefaults = useMemo(() => {
        const routeFavorites = location.state?.favorites
        return getTeamDefaults(routeFavorites ?? user?.favorites ?? getStoredFavorites())
    }, [location.state, user])

    const [selectedHomeTeam, setSelectedHomeTeam] = useState(teamDefaults.homeTeam)
    const [selectedAwayTeam, setSelectedAwayTeam] = useState(teamDefaults.awayTeam)
    const [manualMatchId, setManualMatchId] = useState(1)

    const homeTeam = TEAM_CATALOG.find((team) => team.code === selectedHomeTeam) ?? TEAM_CATALOG[0]
    const awayTeam = TEAM_CATALOG.find((team) => team.code === selectedAwayTeam) ?? TEAM_CATALOG[1]
    const inferredMatchId = MATCH_PAIR_TO_ID[`${homeTeam.code}-${awayTeam.code}`] ?? manualMatchId

    const handleHomeTeamChange = (teamCode) => {
        setSelectedHomeTeam(teamCode)
        setPrediction(null)
    }

    const handleAwayTeamChange = (teamCode) => {
        setSelectedAwayTeam(teamCode)
        setPrediction(null)
    }

    const handleGenerate = async ({ matchId }) => {
        setIsGenerating(true)
        setError('')

        const resolvedMatchId = Number(matchId || inferredMatchId)
        const { data, error: requestError } = await generatePrediction(resolvedMatchId)

        if (requestError || !data) {
            setPrediction(null)
            setError(requestError || 'Unable to generate prediction right now.')
        } else {
            console.info('Prediction generated for teams', { homeTeam, awayTeam })
            setPrediction({
                matchId: data.match_id,
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

    const handleSave = () => {
        console.info('Save prediction placeholder triggered')
    }

    return (
        <div className="">
            <Navbar />
            <section className="mx-6 my-4 space-y-6">
                <MatchHeader homeTeam={homeTeam} awayTeam={awayTeam} matchId={inferredMatchId} />

                <div className="flex gap-x-10 mt-20">
                    <PredictionControls
                        teams={TEAM_CATALOG}
                        homeTeam={homeTeam}
                        awayTeam={awayTeam}
                        matchId={inferredMatchId}
                        manualMatchId={manualMatchId}
                        isGenerating={isGenerating}
                        error={error}
                        onHomeTeamChange={handleHomeTeamChange}
                        onAwayTeamChange={handleAwayTeamChange}
                        onMatchIdChange={setManualMatchId}
                        onGenerate={handleGenerate}
                    />
                    <WinProbabilityGrid
                        isGenerating={isGenerating}
                        prediction={prediction}
                        homeTeam={homeTeam}
                        awayTeam={awayTeam}
                        onShare={handleShare}
                        onSave={handleSave}
                    />
                </div>

                <UnderdogInsights isGenerating={isGenerating} prediction={prediction} />
            </section>
            <Footer />
        </div>
    )
}

export default MatchOutcomePrediction
