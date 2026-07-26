import React, { useState } from 'react'
import DashboardSidebar from '../components/dashboard/DashboardSidebar'
import Navbar from '../components/Navbar'
import { useAuth } from '../context/useAuth'

const tabs = ['Available Models / Predictions', 'Account Binding', 'Security Settings', 'Other Settings']
const modelFilters = ['All Models', 'OpenAI', 'Anthropic', 'Custom ML Models']

const PersonalSettings = () => {
    const { user } = useAuth()
    const [activeTab, setActiveTab] = useState(tabs[0])
    const [activeFilter, setActiveFilter] = useState(modelFilters[0])

    const displayName = user?.name || user?.fullName || 'Test User'
    const initials = displayName
        .split(' ')
        .map((part) => part.charAt(0))
        .join('')
        .slice(0, 2)
        .toUpperCase()
    const userId = user?.id || user?.email?.split('@')[0] || 'fiq-user-001'

    return (
        <div className="flex min-h-screen flex-col bg-[#0b0e14] text-white">
            <Navbar />
            <div className="flex flex-1 overflow-hidden">
                <DashboardSidebar />
                <main className="flex-1 space-y-6 overflow-y-auto p-6">
                    <section className="overflow-hidden rounded-3xl border border-white/5 bg-[#1D2230] shadow-2xl">
                        <div className="bg-linear-to-r from-[#1A2440] via-[#171B26] to-[#271B42] p-6 lg:p-8">
                            <div className="flex flex-col gap-6 lg:flex-row lg:items-center lg:justify-between">
                                <div className="flex items-center gap-5">
                                    <div className="grid size-20 place-items-center rounded-full border border-[#ADC6FF]/30 bg-[#ADC6FF]/10 text-2xl font-black text-[#ADC6FF] shadow-[0_0_50px_rgba(173,198,255,0.16)]">
                                        {initials}
                                    </div>
                                    <div>
                                        <div className="flex flex-wrap items-center gap-3">
                                            <h1 className="text-3xl font-black text-white">{displayName}</h1>
                                            <span className="rounded-full border border-[#ADC6FF]/30 bg-[#ADC6FF]/10 px-3 py-1 text-xs font-bold uppercase tracking-widest text-[#ADC6FF]">
                                                {user?.role || 'user'}
                                            </span>
                                        </div>
                                        <p className="mt-2 text-sm font-semibold text-[#8C909F]">User ID: {userId}</p>
                                    </div>
                                </div>

                                <div className="grid gap-3 sm:grid-cols-3 lg:min-w-130">
                                    <div className="rounded-2xl border border-[#2B3244] bg-black/20 p-4">
                                        <p className="text-xs font-bold uppercase tracking-[0.18em] text-[#8C909F]">Current Usage / Balance</p>
                                        <p className="mt-2 text-2xl font-black text-white">82%</p>
                                        <p className="text-xs text-[#66708A]">18 credits left</p>
                                    </div>
                                    <div className="rounded-2xl border border-[#2B3244] bg-black/20 p-4">
                                        <p className="text-xs font-bold uppercase tracking-[0.18em] text-[#8C909F]">Simulations / Requests</p>
                                        <p className="mt-2 text-2xl font-black text-white">1,248</p>
                                        <p className="text-xs text-[#66708A]">this season</p>
                                    </div>
                                    <div className="rounded-2xl border border-[#2B3244] bg-black/20 p-4">
                                        <p className="text-xs font-bold uppercase tracking-[0.18em] text-[#8C909F]">Default Group</p>
                                        <p className="mt-2 text-2xl font-black text-white">Analyst</p>
                                        <p className="text-xs text-[#66708A]">workspace access</p>
                                    </div>
                                </div>
                            </div>
                        </div>
                    </section>

                    <section className="rounded-3xl border border-white/5 bg-[#1D2230] p-5">
                        <div className="flex flex-wrap gap-2 border-b border-[#2B3244] pb-4">
                            {tabs.map((tab) => (
                                <button
                                    key={tab}
                                    type="button"
                                    onClick={() => setActiveTab(tab)}
                                    className={`rounded-xl px-4 py-2 text-sm font-bold transition ${
                                        activeTab === tab
                                            ? 'bg-[#ADC6FF]/15 text-[#ADC6FF]'
                                            : 'text-[#8C909F] hover:bg-white/5 hover:text-white'
                                    }`}
                                >
                                    {tab}
                                </button>
                            ))}
                        </div>

                        <div className="mt-6 min-h-72 rounded-2xl border border-[#2B3244] bg-[#171B26] p-5">
                            {activeTab === 'Available Models / Predictions' ? (
                                <div>
                                    <div className="flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
                                        <div>
                                            <h2 className="text-2xl font-black text-white">Available Models / Predictions</h2>
                                            <p className="mt-1 text-sm text-[#8C909F]">Filter prediction engines and AI model providers available to this account.</p>
                                        </div>
                                        <span className="rounded-full bg-[#D0BCFF]/15 px-3 py-1 text-xs font-bold uppercase tracking-widest text-[#D0BCFF]">
                                            12 Active Models
                                        </span>
                                    </div>

                                    <div className="mt-6 flex flex-wrap gap-3">
                                        {modelFilters.map((filter) => (
                                            <button
                                                key={filter}
                                                type="button"
                                                onClick={() => setActiveFilter(filter)}
                                                className={`rounded-full border px-4 py-2 text-sm font-bold transition ${
                                                    activeFilter === filter
                                                        ? 'border-[#ADC6FF]/50 bg-[#ADC6FF]/15 text-[#ADC6FF]'
                                                        : 'border-[#2B3244] bg-[#1C2231] text-[#C2C6D6] hover:border-[#ADC6FF]/40 hover:text-white'
                                                }`}
                                            >
                                                {filter}
                                            </button>
                                        ))}
                                    </div>

                                    <div className="mt-6 grid gap-4 md:grid-cols-2 xl:grid-cols-3">
                                        {['Match Outcome Predictor', 'Player Form Engine', 'Injury Risk Classifier'].map((model) => (
                                            <article key={model} className="rounded-2xl border border-[#2B3244] bg-[#1C2231] p-4">
                                                <p className="text-lg font-bold text-white">{model}</p>
                                                <p className="mt-2 text-sm leading-6 text-[#8C909F]">Optimized for football intelligence workflows and analyst-ready decisions.</p>
                                                <span className="mt-4 inline-flex rounded-full bg-emerald-500/15 px-3 py-1 text-xs font-bold text-emerald-300">Enabled</span>
                                            </article>
                                        ))}
                                    </div>
                                </div>
                            ) : (
                                <div className="grid h-56 place-items-center text-center">
                                    <div>
                                        <p className="text-xl font-bold text-white">{activeTab}</p>
                                        <p className="mt-2 text-sm text-[#8C909F]">Settings for this section are currently read-only.</p>
                                    </div>
                                </div>
                            )}
                        </div>
                    </section>
                </main>
            </div>
        </div>
    )
}

export default PersonalSettings