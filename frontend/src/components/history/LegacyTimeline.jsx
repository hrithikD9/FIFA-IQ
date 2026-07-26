import React from 'react'

const eras = [
    {
        year: '2022',
        host: 'Qatar',
        title: 'The Modern Epoch',
        description: "Messi's crowning glory capped an era of hybrid pressing, compact blocks, and creative overloads.",
        tags: ['TACTICAL SHIFT', 'ICON: L. MESSI'],
    },
    {
        year: '2010',
        host: 'Spain',
        title: 'Tiki-Taka Zenith',
        description: 'Tiki-taka philosophy reached its summit through positional superiority, relentless circulation, and total control.',
        tags: ['PHILOSOPHY', 'TOTAL CONTROL'],
    },
    {
        year: '1998',
        host: 'France',
        title: 'The Zidane Era',
        description: 'A tournament defined by elegance, national identity, and the rise of technically dominant midfield command.',
        tags: ['Top Scorer: Davor Suker', 'Attendance: 2.78M'],
    },
    {
        year: '1970',
        host: 'The Golden Era',
        title: 'Brazil Joga Bonito',
        description: 'The benchmark for expressive attacking football, fluid rotations, and generation-defining creativity.',
        tags: ['Total Goals: 95', '2.97 per match'],
    },
]

const LegacyTimeline = () => {
    return (
        <section className="relative mx-auto max-w-6xl py-8">
            <div className="absolute left-1/2 top-0 hidden h-full w-px -translate-x-1/2 bg-linear-to-b from-transparent via-[#ADC6FF]/45 to-transparent md:block" />
            <div className="space-y-10">
                {eras.map((era, index) => {
                    const isLeft = index % 2 === 0

                    return (
                        <article key={`${era.year}-${era.host}`} className={`relative grid items-center gap-6 md:grid-cols-2 ${isLeft ? '' : 'md:[&>*:first-child]:col-start-2'}`}>
                            <div className={`rounded-3xl border border-white/5 bg-[#1D2230] p-6 shadow-2xl ${isLeft ? 'md:mr-12' : 'md:ml-12'}`}>
                                <div className="flex items-center justify-between gap-4">
                                    <div>
                                        <p className="text-sm font-black uppercase tracking-[0.25em] text-[#ADC6FF]">{era.year} - {era.host}</p>
                                        <h2 className="mt-2 text-3xl font-black text-white">{era.title}</h2>
                                    </div>
                                    <span className="grid size-14 place-items-center rounded-2xl border border-[#D0BCFF]/30 bg-[#D0BCFF]/10 text-[#D0BCFF]">
                                        <svg className="size-7" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor">
                                            <path strokeLinecap="round" strokeLinejoin="round" d="M16.5 18.75h-9m9 0a3 3 0 0 0 3-3V5.25a.75.75 0 0 0-.75-.75H5.25a.75.75 0 0 0-.75.75v10.5a3 3 0 0 0 3 3m9 0v1.5a.75.75 0 0 1-.75.75h-7.5a.75.75 0 0 1-.75-.75v-1.5" />
                                        </svg>
                                    </span>
                                </div>
                                <p className="mt-4 text-sm leading-6 text-[#AAB0C5]">{era.description}</p>
                                <div className="mt-5 flex flex-wrap gap-2">
                                    {era.tags.map((tag) => (
                                        <span key={tag} className="rounded-full border border-[#ADC6FF]/25 bg-[#ADC6FF]/10 px-3 py-1 text-[10px] font-bold uppercase tracking-widest text-[#ADC6FF]">
                                            {tag}
                                        </span>
                                    ))}
                                </div>
                            </div>
                            <span className="absolute left-1/2 top-1/2 hidden size-5 -translate-x-1/2 -translate-y-1/2 rounded-full border border-[#ADC6FF] bg-[#171B26] shadow-[0_0_28px_rgba(173,198,255,0.9)] md:block" />
                        </article>
                    )
                })}
            </div>
        </section>
    )
}

export default LegacyTimeline