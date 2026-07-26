import React from 'react'

const ModelVersions = () => {
    return (
        <section className="rounded-3xl border border-white/5 bg-[#1D2230] p-5">
            <div className="mb-5 flex items-center justify-between">
                <h2 className="text-2xl font-bold text-white">Model Versions</h2>
                <button className="rounded-xl bg-linear-to-r from-[#ADC6FF] to-[#D0BCFF] px-4 py-2 text-sm font-bold text-[#001A42]">
                    Deploy New Model
                </button>
            </div>
            <div className="grid gap-4 md:grid-cols-2">
                <article className="rounded-2xl border border-emerald-400/20 bg-[#171B26] p-4">
                    <p className="text-xs font-bold uppercase tracking-[0.2em] text-emerald-300">Production</p>
                    <h3 className="mt-3 text-xl font-bold text-white">XG-Transformer-Ultra v4.8.2</h3>
                    <p className="mt-2 text-sm text-[#8C909F]">Precision: 94.2% | Recall: 89.1%</p>
                </article>
                <article className="rounded-2xl border border-[#D0BCFF]/20 bg-[#171B26] p-4">
                    <p className="text-xs font-bold uppercase tracking-[0.2em] text-[#D0BCFF]">Staging</p>
                    <h3 className="mt-3 text-xl font-bold text-white">Neural-Pitch-Alpha v4.9.0-beta</h3>
                    <div className="mt-4 h-2 overflow-hidden rounded-full bg-[#2C3448]">
                        <span className="block h-full w-[62%] rounded-full bg-[#D0BCFF]" />
                    </div>
                    <p className="mt-2 text-sm text-[#8C909F]">Testing in progress</p>
                </article>
            </div>
            <div className="mt-4 rounded-2xl border border-dashed border-[#ADC6FF]/30 bg-[#171B26] p-8 text-center">
                <p className="font-bold text-white">Drop Datasets Here</p>
                <p className="mt-2 text-sm text-[#8C909F]">CSV, JSON or parquet files up to 2GB</p>
            </div>
        </section>
    )
}

export default ModelVersions