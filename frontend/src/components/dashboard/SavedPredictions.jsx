import React from 'react'

const predictions = [
    { title: 'UCL Final Simulation', home: 'R. Madrid', away: 'Man. City', score: '2 - 1', status: 'FT', date: 'Saved Jul 22', badge: 'High Confidence' },
    { title: 'World Cup Qualifiers', home: 'Brazil', away: 'Peru', score: '3 - 0', status: 'PROJ', date: 'Saved Jul 19', badge: 'Attack Edge' },
]

const SavedPredictions = () => {
    return (
        <section className="rounded-3xl border border-white/5 bg-[#1D2230] p-5">
            <div className="mb-5 flex items-center justify-between">
                <h2 className="text-2xl font-bold text-white">Saved Predictions</h2>
                <span className="text-xs font-bold uppercase tracking-[0.2em] text-[#ADC6FF]">Recent</span>
            </div>
            <div className="grid gap-4 md:grid-cols-2">
                {predictions.map((prediction) => (
                    <article key={prediction.title} className="rounded-2xl border border-[#2B3244] bg-[#171B26] p-4">
                        <span className="rounded-full bg-[#D0BCFF]/15 px-3 py-1 text-[10px] font-bold uppercase tracking-widest text-[#D0BCFF]">
                            {prediction.badge}
                        </span>
                        <h3 className="mt-4 text-xl font-bold text-white">{prediction.title}</h3>
                        <div className="mt-5 grid grid-cols-[1fr_auto_1fr] items-center gap-4">
                            <div className="text-center">
                                <span className="mx-auto grid size-12 place-items-center rounded-full border border-[#ADC6FF]/30 bg-[#ADC6FF]/10 text-sm font-black text-[#ADC6FF]">
                                    {prediction.home.slice(0, 2).toUpperCase()}
                                </span>
                                <p className="mt-2 text-xs font-semibold text-[#C2C6D6]">{prediction.home}</p>
                            </div>
                            <div className="text-center">
                                <p className="text-4xl font-black text-[#ADC6FF]">{prediction.score}</p>
                                <p className="mt-1 text-[10px] font-bold uppercase tracking-[0.2em] text-[#8C909F]">{prediction.status}</p>
                            </div>
                            <div className="text-center">
                                <span className="mx-auto grid size-12 place-items-center rounded-full border border-[#D0BCFF]/30 bg-[#D0BCFF]/10 text-sm font-black text-[#D0BCFF]">
                                    {prediction.away.slice(0, 2).toUpperCase()}
                                </span>
                                <p className="mt-2 text-xs font-semibold text-[#C2C6D6]">{prediction.away}</p>
                            </div>
                        </div>
                        <div className="mt-5 flex justify-end">
                            <p className="text-xs font-semibold text-[#66708A]">{prediction.date}</p>
                        </div>
                    </article>
                ))}
            </div>
        </section>
    )
}

export default SavedPredictions