import React from 'react'
import { Navigate, useLocation } from 'react-router-dom'
import { useAuth } from '../context/useAuth'

// Guard for the Admin Workspace. Enforces strict RBAC:
//  - Unauthenticated visitors are sent to /login.
//  - Authenticated non-admin users are sent to the User Dashboard (/dashboard)
//    with an "Access Denied" banner passed via navigation state.
//  - Only users with user_metadata.is_admin === true (mapped to user.isAdmin)
//    are allowed through to the wrapped admin UI.
const AdminGuard = ({ children }) => {
    const { isAuthenticated, user, loading } = useAuth()
    const location = useLocation()

    if (loading) {
        return (
            <div className="grid min-h-screen place-items-center bg-[#0b0e14]">
                <div className="flex flex-col items-center gap-4">
                    <svg className="size-10 animate-spin text-[#ADC6FF]" viewBox="0 0 24 24" fill="none" aria-hidden="true">
                        <circle className="opacity-20" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="3" />
                        <path className="opacity-90" fill="currentColor" d="M4 12a8 8 0 0 1 8-8V1.5A10.5 10.5 0 0 0 1.5 12H4Z" />
                    </svg>
                    <p className="text-xs font-bold uppercase tracking-[0.3em] text-[#8C909F]">Verifying Access</p>
                </div>
            </div>
        )
    }

    if (!isAuthenticated || !user) {
        return <Navigate to="/login" state={{ from: location }} replace />
    }

    if (!user.isAdmin) {
        return (
            <Navigate
                to="/dashboard"
                state={{
                    accessDenied: true,
                    message: 'Access Denied: Admin privileges required.',
                }}
                replace
            />
        )
    }

    return children
}

export default AdminGuard
