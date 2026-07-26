import React from 'react'

const MatchHeader = () => {
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
            <div className="flex">
                <p className="text-[#C2C6D6] font-medium text-xl tracking-widest leading-5 max-w-4xl">
                    Leverage our proprietary ML models trained on over 50,000 professional
                    matches to forecast outcomes with surgical precision
                </p>

                <p className="bg-[#571BC1] px-2 py-1 uppercase font-mono font-bold text-xl tracking-tight text-[#D0BCFF] border border-[#D0BCFF] rounded-xl flex gap-2 items-center max-w-3xs">
                    <svg xmlns="http://www.w3.org/2000/svg" height="24px" viewBox="0 -960 960 960"
                        width="24px" fill="#e3e3e3"><path d="M621.5-338.5Q680-397 680-480t-58.5-141.5Q563-680 480-680t-141.5 58.5Q280-563 280-480t58.5 141.5Q397-280 480-280t141.5-58.5ZM480-80q-83 0-156-31.5T197-197q-54-54-85.5-127T80-480q0-83 31.5-156T197-763q54-54 127-85.5T480-880q83 0 156 31.5T763-763q54 54 85.5 127T880-480q0 83-31.5 156T763-197q-54 54-127 85.5T480-80Zm0-80q134 0 227-93t93-227q0-134-93-227t-227-93q-134 0-227 93t-93 227q0 134 93 227t227 93Z" /></svg>
                    Live Engine v1.1
                </p>
            </div>
        </div>
    )
}

export default MatchHeader