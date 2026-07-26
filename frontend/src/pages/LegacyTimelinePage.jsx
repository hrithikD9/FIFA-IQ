import React from 'react'
import Navbar from '../components/Navbar'
import EvolutionMetrics from '../components/history/EvolutionMetrics'
import LegacyTimeline from '../components/history/LegacyTimeline'
import TimelineFooter from '../components/history/TimelineFooter'
import TimelineHeader from '../components/history/TimelineHeader'

const LegacyTimelinePage = () => {
    return (
        <div className="min-h-screen bg-[#171B26] text-white">
            <Navbar />
            <main className="px-5">
                <TimelineHeader />
                <LegacyTimeline />
                <EvolutionMetrics />
                <TimelineFooter />
            </main>
        </div>
    )
}

export default LegacyTimelinePage