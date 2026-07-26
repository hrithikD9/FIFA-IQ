import React from 'react'
import { Link } from 'react-router-dom'

const DashboardHeader = ({ userName }) => {
    return (
        <header className="flex flex-col gap-5 rounded-3xl border border-white/5 bg-[#1D2230] p-6 shadow-2xl lg:flex-row lg:items-center lg:justify-between">
            <div>
                <p className="text-[11px] font-bold uppercase tracking-[0.28em] text-[#ADC6FF]">Command Center</p>
                <h1 className="mt-2 text-4xl font-black text-white">Welcome back, {userName || 'User'}!</h1>
                <p className="mt-2 max-w-2xl text-sm leading-6 text-[#8C909F]">
                    Track your saved predictions, monitor favorite squads, and launch fresh match intelligence from one dashboard.
                </p>
            </div>

            <div className="flex flex-wrap gap-3">
                <button className="rounded-xl border border-[#2B3244] bg-[#262A35] px-4 py-3 text-sm font-bold text-[#DFE2F1] hover:bg-[#343946]">
                    Export PDF Report
                </button>
                <Link to="/predictions" className="rounded-xl bg-linear-to-r from-[#ADC6FF] to-[#D0BCFF] px-4 py-3 text-sm font-bold text-[#001A42] hover:from-[#8FB3FF] hover:to-[#B58CFF]">
                    Run New Prediction
                </Link>
            </div>
        </header>
    )
}

export default DashboardHeader