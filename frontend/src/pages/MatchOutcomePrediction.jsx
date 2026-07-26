import React, { useMemo, useState } from 'react'
import { useLocation } from 'react-router-dom'
import Navbar from '../components/Navbar'
import Footer from '../components/Footer'
import MatchHeader from '../components/predictions/MatchHeader'
import PredictionControls from '../components/predictions/PredictionControls'
import WinProbabilityGrid from '../components/predictions/WinProbabilityGrid'
import UnderdogInsights from '../components/predictions/UnderdogInsights'
import { useAuth } from '../context/useAuth'

const favoriteTeamToCode = {
    argentina: 'ARG',
    france: 'FRA',
    brazil: 'BRA',
    england: 'ENG',
    germany: 'GER',
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

    const teamDefaults = useMemo(() => {
        const routeFavorites = location.state?.favorites
        return getTeamDefaults(routeFavorites ?? user?.favorites ?? getStoredFavorites())
    }, [location.state, user])

    const handleGenerate = ({ homeTeam, awayTeam }) => {
        setIsGenerating(true)
        console.info('Generating prediction intelligence', { homeTeam, awayTeam })

        setTimeout(() => {
            setIsGenerating(false)
        }, 1000)
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
                <MatchHeader />

                <div className="flex gap-x-10 mt-20">
                    <PredictionControls
                        key={`${teamDefaults.homeTeam}-${teamDefaults.awayTeam}`}
                        defaultHomeTeam={teamDefaults.homeTeam}
                        defaultAwayTeam={teamDefaults.awayTeam}
                        isGenerating={isGenerating}
                        onGenerate={handleGenerate}
                    />
                    <WinProbabilityGrid
                        isGenerating={isGenerating}
                        onShare={handleShare}
                        onSave={handleSave}
                    />
                </div>

                <UnderdogInsights isGenerating={isGenerating} />
            </section>
            <Footer />
        </div>
    )
}

export default MatchOutcomePrediction
