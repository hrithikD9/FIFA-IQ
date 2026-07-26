import React from 'react'

const AdminHeader = () => {
    return (
        <header className="rounded-3xl border border-white/5 bg-[#1D2230] p-6 shadow-2xl">
            <div className="flex flex-col gap-5 lg:flex-row lg:items-start lg:justify-between">
                <div>
                    <p className="text-[11px] font-bold uppercase tracking-[0.28em] text-[#ADC6FF]">Admin Command</p>
                    <h1 className="mt-2 text-4xl font-black text-white">Systems Overview</h1>
                    <p className="mt-3 max-w-3xl text-sm leading-6 text-[#8C909F]">
                        Manage elite football datasets, monitor global API latency, and deploy latest ML prediction models from a single command center.
                    </p>
                </div>
                <div className="flex flex-wrap gap-3">
                    <button className="rounded-xl border border-[#2B3244] bg-[#262A35] px-4 py-3 text-sm font-bold text-[#DFE2F1] hover:bg-[#343946]">
                        Export Logs
                    </button>
                    <button className="rounded-xl bg-linear-to-r from-[#ADC6FF] to-[#D0BCFF] px-4 py-3 text-sm font-bold text-[#001A42] hover:from-[#8FB3FF] hover:to-[#B58CFF]">
                        Upload Dataset
                    </button>
                </div>
            </div>
        </header>
    )
}

export default AdminHeader