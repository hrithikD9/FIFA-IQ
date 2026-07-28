import React from 'react'

const MatchHeader = ({ homeTeam, awayTeam }) => {
    return (
        <div className="space-y-10">
            <div className="flex gap-x-6">
                <p className="text-5xl font-mono font-bold">
                    Neural Match
                </p>

                <p className="text-5xl font-bold bg-linear-to-b from-[#ADC6FF] to-[#D0BCFF] text-transparent bg-clip-text">
                    Predictor
                </p>
            </div>
            <div className="flex items-start gap-6">
                <p className="text-[#C2C6D6] font-medium text-xl tracking-widest leading-5 max-w-4xl">
                    Leverage our proprietary ML models trained on over 50,000 professional
                    matches to forecast outcomes with surgical precision
                </p>

                <div className="bg-[#571BC1] px-4 py-3 uppercase font-mono font-bold text-xl tracking-tight text-[#D0BCFF] border border-[#D0BCFF] rounded-xl flex gap-4 items-center">
                    <img className="h-10 w-10 rounded-full object-cover" src={homeTeam.flag} alt={`${homeTeam.name} flag`} />
                    <div className="flex flex-col items-center text-sm">
                        <span>{homeTeam.code}</span>
                        <span className="text-white normal-case tracking-normal">vs</span>
                        <span>{awayTeam.code}</span>
                    </div>
                    <img className="h-10 w-10 rounded-full object-cover" src={awayTeam.flag} alt={`${awayTeam.name} flag`} />
                </div>
            </div>
        </div>
    )
}

export default MatchHeader
