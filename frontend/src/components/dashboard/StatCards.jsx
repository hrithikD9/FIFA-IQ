import React from 'react'

const teamLabels = {
    argentina: 'Argentina',
    france: 'France',
    brazil: 'Brazil',
    germany: 'Germany',
    england: 'England',
    portugal: 'Portugal',
    japan: 'Japan',
}

const StatCards = ({ favoriteTeams = [] }) => {
    const chips = favoriteTeams.length > 0 ? favoriteTeams : ['argentina', 'france', 'japan']

    return (
        <section className="grid gap-4 lg:grid-cols-3">
            <div className="rounded-3xl border border-white/5 bg-[#1D2230] p-5">
                <p className="text-sm font-semibold text-[#8C909F]">Matches Analyzed</p>
                <p className="mt-3 text-4xl font-black text-white">1,420</p>
                <p className="mt-2 text-sm font-semibold text-emerald-300">+12% from last month</p>
            </div>
            <div className="rounded-3xl border border-white/5 bg-[#1D2230] p-5">
                <p className="text-sm font-semibold text-[#8C909F]">Predictions Made</p>
                <p className="mt-3 text-4xl font-black text-white">84</p>
                <p className="mt-2 text-sm font-semibold text-[#ADC6FF]">92% Accuracy rate</p>
            </div>
            <div className="rounded-3xl border border-white/5 bg-[#1D2230] p-5">
                <p className="text-sm font-semibold text-[#8C909F]">Favorite Teams</p>
                <div className="mt-4 flex flex-wrap gap-2">
                    {chips.map((team) => (
                        <span key={team} className="rounded-full border border-[#ADC6FF]/30 bg-[#ADC6FF]/10 px-3 py-1 text-sm font-bold text-[#ADC6FF]">
                            {teamLabels[team] ?? team}
                        </span>
                    ))}
                </div>
                <p className="mt-3 text-sm text-[#8C909F]">2.4K analysts tracking similar squads</p>
            </div>
        </section>
    )
}

export default StatCards