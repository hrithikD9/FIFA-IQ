import React from 'react'
import { Navigate, Outlet, useLocation } from 'react-router-dom'
import { useAuth } from '../context/useAuth'

const ProtectedRoute = () => {
    const { user, loading } = useAuth()
    const location = useLocation()

    if (loading) {
        return (
            <div className="grid min-h-screen place-items-center bg-[#0b0e14]">
                <div className="flex flex-col items-center gap-4">
                    <svg className="size-10 animate-spin text-[#ADC6FF]" viewBox="0 0 24 24" fill="none" aria-hidden="true">
                        <circle className="opacity-20" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="3" />
                        <path className="opacity-90" fill="currentColor" d="M4 12a8 8 0 0 1 8-8V1.5A10.5 10.5 0 0 0 1.5 12H4Z" />
                    </svg>
                    <p className="text-xs font-bold uppercase tracking-[0.3em] text-[#8C909F]">Loading FIFA-IQ</p>
                </div>
            </div>
        )
    }

    if (!user) {
        return <Navigate to="/login" state={{ from: location }} replace />
    }

    return <Outlet />
}

export default ProtectedRoute
