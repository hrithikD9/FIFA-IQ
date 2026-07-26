import React from 'react'

const StatCard = ({ value, label }) => {
    return (
        <div className="px-5 py-4 rounded-2xl bg-[#171B26]/70 backdrop-blur-sm border border-white/5">
            <p className="text-xl font-extrabold bg-linear-to-r from-[#ADC6FF] to-[#D0BCFF] text-transparent bg-clip-text">
                {value}
            </p>
            <p className="text-[10px] tracking-widest uppercase text-[#8C909F] font-semibold mt-1">
                {label}
            </p>
        </div>
    )
}

export default StatCard
