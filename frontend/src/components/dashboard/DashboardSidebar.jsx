import React from 'react'
import { Link } from 'react-router-dom'

const navItems = ['Dashboard', 'Team Analysis', 'Player Analytics', 'Match Prediction', 'Comparison', 'History']

const DashboardSidebar = () => {
    return (
        <aside className="flex min-h-screen w-72 flex-col border-r border-white/5 bg-[#121722] px-5 py-6">
            <nav className="space-y-2">
                {navItems.map((item) => {
                    const isActive = item === 'Dashboard'
                    const to = item === 'Match Prediction' ? '/predictions' : item === 'History' ? '/history' : '#'

                    return (
                        <Link
                            key={item}
                            to={to}
                            className={`block rounded-2xl px-4 py-3 text-sm font-semibold transition-colors ${
                                isActive
                                    ? 'bg-[#ADC6FF]/15 text-[#ADC6FF]'
                                    : 'text-[#8C909F] hover:bg-white/5 hover:text-white'
                            }`}
                        >
                            {item}
                        </Link>
                    )
                })}
            </nav>

            <div className="mt-auto rounded-3xl border border-[#D0BCFF]/30 bg-linear-to-br from-[#571BC1]/35 to-[#1D2230] p-5">
                <p className="text-lg font-bold text-white">Upgrade to Pro</p>
                <p className="mt-2 text-sm leading-6 text-[#C2C6D6]">
                    Unlock advanced models, exports, and scout-ready intelligence packs.
                </p>
                <button className="mt-4 rounded-xl bg-linear-to-r from-[#ADC6FF] to-[#D0BCFF] px-4 py-2 text-sm font-bold text-[#001A42]">
                    Explore Pro
                </button>
            </div>
        </aside>
    )
}

export default DashboardSidebar