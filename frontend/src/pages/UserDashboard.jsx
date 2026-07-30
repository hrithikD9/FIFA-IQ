import React, { useEffect, useState } from 'react'
import { useLocation, useNavigate } from 'react-router-dom'
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
    const location = useLocation()
    const [accessDeniedMessage, setAccessDeniedMessage] = useState(() => {
        if (location.state?.accessDenied) {
            return location.state.message || 'Access Denied: Admin privileges required.'
        }
        return location.state?.message ?? null
    })
    // Greet by first name; firstName already carries its own fallback chain
    // (first token of full name -> email username -> 'User') from mapAuthUser.
    const userName = user?.firstName || user?.fullName || user?.name || user?.email?.split('@')[0]
    const favoriteTeams = user?.favorites?.nationalTeams ?? []

    // Redirect admins to their dedicated workspace; only standard users live here.
    useEffect(() => {
        if (user?.isAdmin) {
            navigate('/admin', { replace: true })
        }
    }, [navigate, user])

    // Surface a one-time "Access Denied" banner when the AdminGuard bounces a
    // non-admin user back here, then clear the navigation state so it doesn't
    // reappear on refresh/back navigation.
    useEffect(() => {
        if (location.state?.accessDenied) {
            navigate(location.pathname, { replace: true, state: {} })
        }
    }, [location.pathname, location.state?.accessDenied, navigate])

    return (
        <div className="flex min-h-screen flex-col bg-[#0b0e14] text-white">
            <Navbar />
            <div className="flex flex-1 overflow-hidden">
                <DashboardSidebar />
                <main className="flex-1 space-y-6 overflow-y-auto p-6">
                    {accessDeniedMessage && (
                        <div
                            role="alert"
                            className="flex items-start gap-3 rounded-2xl border border-rose-500/40 bg-rose-500/10 px-5 py-4"
                        >
                            <svg
                                className="mt-0.5 size-5 shrink-0 text-rose-300"
                                xmlns="http://www.w3.org/2000/svg"
                                fill="none"
                                viewBox="0 0 24 24"
                                strokeWidth={1.8}
                                stroke="currentColor"
                            >
                                <path
                                    strokeLinecap="round"
                                    strokeLinejoin="round"
                                    d="M12 9v3.75m-9.303 3.376c-.866 1.5.217 3.374 1.948 3.374h14.71c1.73 0 2.813-1.874 1.948-3.374L13.949 3.378c-.866-1.5-3.032-1.5-3.898 0L2.697 16.126ZM12 15.75h.007v.008H12v-.008Z"
                                />
                            </svg>
                            <div className="min-w-0">
                                <p className="text-sm font-bold text-rose-200">Access Denied</p>
                                <p className="mt-0.5 text-sm text-rose-300/90">{accessDeniedMessage}</p>
                            </div>
                            <button
                                type="button"
                                onClick={() => setAccessDeniedMessage(null)}
                                aria-label="Dismiss"
                                className="ml-auto rounded-md p-1 text-rose-300/70 transition-colors hover:bg-rose-500/10 hover:text-rose-200"
                            >
                                <svg className="size-4" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor">
                                    <path strokeLinecap="round" strokeLinejoin="round" d="M6 18 18 6M6 6l12 12" />
                                </svg>
                            </button>
                        </div>
                    )}
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