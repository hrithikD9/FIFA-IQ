import React from 'react'

const EvolutionMetrics = () => {
    return (
        <section className="mx-auto grid max-w-6xl gap-5 py-10 md:grid-cols-2">
            <article className="rounded-3xl border border-white/5 bg-[#1D2230] p-6">
                <p className="text-sm font-semibold text-[#8C909F]">Passing Accuracy Trend</p>
                <p className="mt-3 text-5xl font-black text-white">87.2%</p>
                <p className="mt-3 text-sm font-bold text-emerald-300">+12.4% since 1990</p>
                <div className="mt-5 h-2 overflow-hidden rounded-full bg-[#2C3448]">
                    <span className="block h-full w-[87%] rounded-full bg-linear-to-r from-[#ADC6FF] to-[#D0BCFF]" />
                </div>
            </article>
            <article className="rounded-3xl border border-white/5 bg-[#1D2230] p-6">
                <p className="text-sm font-semibold text-[#8C909F]">High Press Frequency</p>
                <p className="mt-3 text-3xl font-black leading-tight text-white">
                    Active defensive actions per minute have increased by 45% in the last three cycles.
                </p>
            </article>
        </section>
    )
}

export default EvolutionMetrics