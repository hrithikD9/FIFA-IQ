import React, { useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import DashboardHeader from '../components/dashboard/DashboardHeader'
import DashboardSidebar from '../components/dashboard/DashboardSidebar'
import QuickActions from '../components/dashboard/QuickActions'
import RecentActivity from '../components/dashboard/RecentActivity'
import SavedPredictions from '../components/dashboard/SavedPredictions'
import StatCards from '../components/dashboard/StatCards'
import Navbar from '../components/Navbar'
import { useAuth } from '../context/useAuth'

const UserDashboard = () => {
    const { user } = useAuth()
    const navigate = useNavigate()
    const userName = user?.fullName || user?.name || user?.email?.split('@')[0]
    const favoriteTeams = user?.favorites?.nationalTeams ?? []

    useEffect(() => {
        if (user?.role === 'admin') {
            navigate('/admin', { replace: true })
        }
    }, [navigate, user])

    return (
        <div className="flex min-h-screen flex-col bg-[#0b0e14] text-white">
            <Navbar />
            <div className="flex flex-1 overflow-hidden">
                <DashboardSidebar />
                <main className="flex-1 space-y-6 overflow-y-auto p-6">
                    <DashboardHeader userName={userName} />
                    <StatCards favoriteTeams={favoriteTeams} />
                    <div className="grid gap-5 xl:grid-cols-[1.35fr_0.65fr]">
                        <div className="space-y-5">
                            <SavedPredictions />
                            <QuickActions />
                        </div>
                        <RecentActivity />
                    </div>
                </main>
            </div>
        </div>
    )
}

export default UserDashboard