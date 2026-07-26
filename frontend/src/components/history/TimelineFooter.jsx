import React from 'react'
import { Link } from 'react-router-dom'

const TimelineFooter = () => {
    return (
        <footer className="mx-auto flex max-w-6xl flex-col items-center justify-between gap-4 border-t border-white/5 py-8 text-center md:flex-row md:text-left">
            <p className="text-[10px] font-black uppercase tracking-[0.28em] text-[#66708A]">Powered by FIFA-IQ Analytics Engine</p>
            <nav className="flex gap-5 text-sm font-semibold text-[#ADC6FF]">
                <Link to="#">Methods</Link>
                <Link to="#">Data Sources</Link>
                <Link to="#">Documentation</Link>
            </nav>
        </footer>
    )
}

export default TimelineFooter