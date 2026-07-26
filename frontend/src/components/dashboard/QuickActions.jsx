import React from 'react'
import { Link } from 'react-router-dom'

const actions = [
    { title: 'New Prediction', text: 'Launch a fresh simulation', to: '/predictions', icon: '⚡' },
    { title: 'Compare Teams', text: 'Benchmark tactical profiles', to: '#', icon: '↔' },
    { title: 'Export Data', text: 'Download analyst-ready files', to: '#', icon: '⇩' },
]

const QuickActions = () => {
    return (
        <section className="rounded-3xl border border-white/5 bg-[#1D2230] p-5">
            <h2 className="text-2xl font-bold text-white">Quick Actions</h2>
            <div className="mt-5 grid grid-cols-1 gap-4 md:grid-cols-3">
                {actions.map((action) => (
                    <Link key={action.title} to={action.to} className="rounded-2xl border border-[#2B3244] bg-[#171B26] p-4 text-center transition-colors hover:border-[#ADC6FF]/50">
                        <span className="mx-auto mb-3 grid size-11 place-items-center rounded-2xl bg-[#ADC6FF]/10 text-2xl font-black text-[#ADC6FF]">
                            {action.icon}
                        </span>
                        <p className="font-bold text-white">{action.title}</p>
                        <p className="mt-1 text-sm text-[#8C909F]">{action.text}</p>
                    </Link>
                ))}
            </div>
        </section>
    )
}

export default QuickActions