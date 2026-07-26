import React from 'react'

const bars = [35, 58, 42, 76, 52, 88, 64]

const AdminSystemMetrics = () => {
    return (
        <section className="grid gap-4 lg:grid-cols-3">
            <article className="rounded-3xl border border-white/5 bg-[#1D2230] p-5">
                <p className="text-sm font-semibold text-[#8C909F]">API Latency</p>
                <div className="mt-3 flex items-end justify-between gap-3">
                    <p className="text-4xl font-black text-white">42ms</p>
                    <div className="flex h-12 items-end gap-1">
                        {bars.map((bar) => (
                            <span key={bar} className="w-2 rounded-full bg-[#ADC6FF]" style={{ height: `${bar}%` }} />
                        ))}
                    </div>
                </div>
                <p className="mt-3 text-sm font-semibold text-rose-300">+12% vs last hour</p>
            </article>
            <article className="rounded-3xl border border-white/5 bg-[#1D2230] p-5">
                <p className="text-sm font-semibold text-[#8C909F]">Active Analysts</p>
                <p className="mt-3 text-4xl font-black text-white">12.4k</p>
                <p className="mt-3 text-sm font-semibold text-emerald-300">+8.4% increase</p>
            </article>
            <article className="rounded-3xl border border-white/5 bg-[#1D2230] p-5">
                <p className="text-sm font-semibold text-[#8C909F]">Dataset Volume</p>
                <p className="mt-3 text-4xl font-black text-white">1.2 PB</p>
                <div className="mt-4 h-2 overflow-hidden rounded-full bg-[#2C3448]">
                    <span className="block h-full w-[78%] rounded-full bg-linear-to-r from-[#ADC6FF] to-[#D0BCFF]" />
                </div>
                <p className="mt-3 text-sm font-semibold text-[#ADC6FF]">78% of capacity used</p>
            </article>
        </section>
    )
}

export default AdminSystemMetrics