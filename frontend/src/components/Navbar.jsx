import React, { useEffect, useRef, useState } from 'react'
import { Link, NavLink, useNavigate } from 'react-router-dom'
import { useAuth } from '../context/useAuth'

const Navbar = () => {
    const navigate = useNavigate()
    const { isAuthenticated, user, logout } = useAuth()
    const [isProfileOpen, setIsProfileOpen] = useState(false)
    const profileMenuRef = useRef(null)

    // Prefer the friendly first name beside the avatar; never fall back to the
    // raw email here. firstName already resolves via full name -> email -> 'User'.
    const displayName = user?.firstName || user?.name || user?.fullName || 'User'
    const userInitial = displayName.charAt(0).toUpperCase()

    const handleLogout = () => {
        logout()
        setIsProfileOpen(false)
        navigate('/login')
    }

    useEffect(() => {
        const handleOutsideClick = (event) => {
            if (profileMenuRef.current && !profileMenuRef.current.contains(event.target)) {
                setIsProfileOpen(false)
            }
        }

        document.addEventListener('mousedown', handleOutsideClick)

        return () => {
            document.removeEventListener('mousedown', handleOutsideClick)
        }
    }, [])

    return (
        <header className="w-full shrink-0">
            <nav className="flex w-full items-center gap-8 bg-linear-to-r from-[#0a0f18] to-[#0e1420] px-6 py-4 shadow-2xl lg:px-8">
                <NavLink to='/'>
                    <h1 className="font-extrabold text-3xl **:cursor-pointer bg-linear-to-r from-[#ADC6FF] to-[#D0BCFF] text-transparent bg-clip-text">
                        FIFA-IQ
                    </h1>
                </NavLink>
                <ul className="text-lg font-medium flex space-x-4 mr-auto">
                    <li>
                        <NavLink to='/' className="text-[#94A3BB] hover:text-[#ADC6FF] transition-colors">
                            Home
                        </NavLink>
                    </li>
                    {isAuthenticated && (
                        <li>
                            <NavLink to='/predictions' className="text-[#94A3BB] hover:text-[#ADC6FF] transition-colors">
                                Predictions
                            </NavLink>
                        </li>
                    )}
                    <li>
                        <NavLink to='/history' className="text-[#94A3BB] hover:text-[#ADC6FF] transition-colors">
                            History
                        </NavLink>
                    </li>
                </ul>

                {isAuthenticated ? (
                    <div className="relative flex items-center space-x-3" ref={profileMenuRef}>
                        <button
                            type="button"
                            aria-label="Notifications"
                            className="relative rounded-full border border-[#2B3244] bg-[#1C2231] p-2 text-[#ADC6FF] transition-colors hover:border-[#ADC6FF]/60 hover:text-white"
                        >
                            <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5}
                                stroke="currentColor" className="size-6">
                                <path strokeLinecap="round" strokeLinejoin="round"
                                    d="M14.857 17.082a23.848 23.848 0 0 0 5.454-1.31A8.967 8.967 0 0 1 18 9.75V9A6 6 0 0 0 6 9v.75a8.967 8.967 0 0 1-2.312 6.022c1.733.64 3.56 1.085 5.455 1.31m5.714 0a24.255 24.255 0 0 1-5.714 0m5.714 0a3 3 0 1 1-5.714 0" />
                            </svg>
                            <span className="absolute -right-1 -top-1 grid size-5 place-items-center rounded-full bg-[#D0BCFF] text-[10px] font-black text-[#112443]">
                                3
                            </span>
                        </button>

                        <button
                            type="button"
                            onClick={() => setIsProfileOpen((prev) => !prev)}
                            aria-expanded={isProfileOpen}
                            className="flex items-center gap-3 rounded-full border border-[#2B3244] bg-[#1C2231] px-3 py-2 text-sm font-semibold text-[#DCE2F5] transition-colors hover:border-[#ADC6FF]/60 hover:text-white"
                        >
                            <span className="grid size-8 place-items-center rounded-full bg-linear-to-r from-[#ADC6FF] to-[#D0BCFF] font-black text-[#112443]">
                                {userInitial}
                            </span>
                            <span>{displayName}</span>
                            <svg className={`size-4 transition-transform ${isProfileOpen ? 'rotate-180' : ''}`} xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor">
                                <path strokeLinecap="round" strokeLinejoin="round" d="m19.5 8.25-7.5 7.5-7.5-7.5" />
                            </svg>
                        </button>

                        {isProfileOpen && (
                            <div className="absolute right-0 top-14 z-50 w-72 overflow-hidden rounded-2xl border border-[#2B3244] bg-[#171B26] shadow-2xl">
                                <div className="border-b border-[#2B3244] p-4">
                                    <div className="flex items-center gap-3">
                                        <span className="grid size-11 place-items-center rounded-full bg-linear-to-r from-[#ADC6FF] to-[#D0BCFF] font-black text-[#112443]">
                                            {userInitial}
                                        </span>
                                        <div className="min-w-0">
                                            <p className="truncate font-bold text-white">{displayName}</p>
                                            <p className="truncate text-xs text-[#8C909F]">{user?.email || 'No email available'}</p>
                                        </div>
                                    </div>
                                    <span className="mt-3 inline-flex rounded-full border border-[#ADC6FF]/30 bg-[#ADC6FF]/10 px-3 py-1 text-[10px] font-bold uppercase tracking-widest text-[#ADC6FF]">
                                        {user?.role || 'user'}
                                    </span>
                                </div>

                                <div className="p-2">
                                    <Link
                                        to="/profile"
                                        onClick={() => setIsProfileOpen(false)}
                                        className="w-full flex items-center gap-3 px-4 py-2 text-sm text-gray-300 hover:bg-gray-800 hover:text-white transition rounded-md"
                                    >
                                        <svg className="size-4" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.8} stroke="currentColor">
                                            <path strokeLinecap="round" strokeLinejoin="round" d="M15.75 6a3.75 3.75 0 1 1-7.5 0 3.75 3.75 0 0 1 7.5 0ZM4.5 20.25a8.25 8.25 0 0 1 15 0" />
                                        </svg>
                                        Profile Settings
                                    </Link>
                                    <Link to="/dashboard" className="flex items-center gap-2 rounded-xl px-3 py-2 text-sm font-semibold text-[#C2C6D6] hover:bg-white/5 hover:text-white" onClick={() => setIsProfileOpen(false)}>
                                        <svg className="size-4" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.8} stroke="currentColor">
                                            <path strokeLinecap="round" strokeLinejoin="round" d="M3.75 6A2.25 2.25 0 0 1 6 3.75h3.75V9.75h-6V6ZM14.25 3.75H18A2.25 2.25 0 0 1 20.25 6v3.75h-6V3.75ZM3.75 14.25h6v6H6a2.25 2.25 0 0 1-2.25-2.25v-3.75ZM14.25 14.25h6V18A2.25 2.25 0 0 1 18 20.25h-3.75v-6Z" />
                                        </svg>
                                        Dashboard
                                    </Link>
                                    {user?.role === 'admin' && (
                                        <Link to="/admin" className="flex items-center gap-2 rounded-xl px-3 py-2 text-sm font-semibold text-[#C2C6D6] hover:bg-white/5 hover:text-white" onClick={() => setIsProfileOpen(false)}>
                                            <svg className="size-4" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.8} stroke="currentColor">
                                                <path strokeLinecap="round" strokeLinejoin="round" d="M9 12.75 11.25 15 15 9.75m-3-7.036A11.96 11.96 0 0 0 3.598 6 11.99 11.99 0 0 0 12 21.75 11.99 11.99 0 0 0 20.402 6 11.96 11.96 0 0 0 12 2.714Z" />
                                            </svg>
                                            Admin
                                        </Link>
                                    )}
                                    <button
                                        type="button"
                                        onClick={handleLogout}
                                        className="mt-2 flex w-full items-center gap-2 rounded-xl px-3 py-2 text-left text-sm font-bold text-rose-300 hover:bg-rose-500/10"
                                    >
                                        <svg className="size-4" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.8} stroke="currentColor">
                                            <path strokeLinecap="round" strokeLinejoin="round" d="M15.75 9V5.25A2.25 2.25 0 0 0 13.5 3h-6A2.25 2.25 0 0 0 5.25 5.25v13.5A2.25 2.25 0 0 0 7.5 21h6a2.25 2.25 0 0 0 2.25-2.25V15m3 0 3-3m0 0-3-3m3 3H9" />
                                        </svg>
                                        Sign Out
                                    </button>
                                </div>
                            </div>
                        )}
                    </div>
                ) : (
                    <div className="flex items-center space-x-3">
                        <Link
                            to="/login"
                            className="rounded-full border border-[#2B3244] bg-[#1C2231] px-4 py-2 text-sm font-semibold text-[#DCE2F5] transition-colors hover:border-[#ADC6FF]/60 hover:text-white"
                        >
                            Sign In
                        </Link>
                        <Link
                            to="/signup"
                            className="rounded-full px-4 py-2 text-sm font-bold text-[#112443] bg-linear-to-r from-[#ADC6FF] to-[#D0BCFF] transition-all hover:from-[#9AB8FF] hover:to-[#BFA1FF]"
                        >
                            Sign Up
                        </Link>
                    </div>
                )}
            </nav>

        </header>

    )
}

export default Navbar
