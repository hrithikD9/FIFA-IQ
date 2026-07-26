import React from 'react'
import argentinaFlag from '../../assets/Arg.png'
import franceFlag from '../../assets/Fra.png'

const probabilities = [
    { label: 'ARGENTINA', value: '62%', color: 'bg-[#ADC6FF]', textColor: 'text-[#ADC6FF]' },
    { label: 'Draw', value: '18%', color: 'bg-gray-400', textColor: 'text-white' },
    { label: 'FRANCE', value: '20%', color: 'bg-[#D0BCFF]', textColor: 'text-[#D0BCFF]' },
]

const stats = [
    { label: 'Expected Goals', value: '2.84 vs 1.12', iconPath: 'M480-80q-83 0-156-31.5T197-197q-54-54-85.5-127T80-480q0-83 31.5-156T197-763q54-54 127-85.5T480-880q83 0 156 31.5T763-763q54 54 85.5 127T880-480q0 83-31.5 156T763-197q-54 54-127 85.5T480-80Zm200-500 54-18 16-54q-32-48-77-82.5T574-786l-54 38v56l160 112Zm-400 0 160-112v-56l-54-38q-54 17-99 51.5T210-652l16 54 54 18Zm-42 308 46-4 30-54-58-174-56-20-40 30q0 65 18 118.5T238-272Zm293 108q25-4 49-12l28-60-26-44H378l-26 44 28 60q24 8 49 12t51 4q26 0 51-4ZM390-360h180l56-160-146-102-144 102 54 160Zm332 88q42-50 60-103.5T800-494l-40-28-56 18-58 174 30 54 46 4Z' },
    { label: 'Clean Sheet', value: '31.4%', iconPath: 'M480-80q-139-35-229.5-159.5T160-516v-244l320-120 320 120v244q0 152-90.5 276.5T480-80Zm0-84q104-33 172-132t68-220v-189l-240-90-240 90v189q0 121 68 220t172 132Zm0-316Z' },
    { label: 'Possession', value: '58%', iconPath: 'm140-220-60-60 300-300 160 160 284-320 56 56-340 384-160-160-240 240Z' },
    { label: 'Shots on Target', value: '7 vs 4', iconPath: 'M520-520h278q-15-110-91.5-186.5T520-798v278Zm-80 358v-636q-121 15-200.5 105.5T160-480q0 122 79.5 212.5T440-162Zm80 0q110-14 187-91t91-187H520v278Zm-40-318Zm0 400q-83 0-156-31.5T197-197q-54-54-85.5-127T80-480q0-83 31.5-156T197-763q54-54 127-85.5T480-880q83 0 155.5 31.5t127 86q54.5 54.5 86 127T880-480q0 82-31.5 155T763-197.5q-54 54.5-127 86T480-80Z' },
]

const WinProbabilityGrid = ({ isGenerating, onShare, onSave }) => {
    return (
        <div className={`w-full bg-gray-600 px-5 py-6 rounded-4xl transition-opacity ${isGenerating ? 'animate-pulse opacity-70' : ''}`}>
            <div className="flex justify-evenly border border-indigo-300 items-center">
                <img className="h-18 w-18 rounded-full" src={argentinaFlag} alt="Argentina flag" />
                <div className="flex flex-col items-center">
                    <p className="text-5xl font-serif font-extrabold"> 3  |  2</p>
                    <p className="bg-gray-500 px-2 py-2 text-sm rounded-2xl mx-auto my-6 font-bold bg-linear-to-b from-[#ADC6FF] to-[#D0BCFF] text-transparent bg-clip-text border border-blue-200">Predicted Score</p>
                </div>
                <img className="h-18 w-18 rounded-full" src={franceFlag} alt="France flag" />
            </div>

            <div className="bg-[#111827] rounded-3xl p-6 mt-6">
                <div className="flex justify-between items-center mb-8">
                    <h2 className="uppercase text-xs tracking-[0.2em] font-bold text-gray-400">Win Probabilities</h2>
                    <p className="uppercase text-xs font-bold text-[#ADC6FF]">Live Calculation</p>
                </div>

                {probabilities.map((item) => (
                    <div key={item.label} className="mb-8 last:mb-0">
                        <div className="flex justify-between items-end mb-3">
                            <h3 className="text-white text-2xl font-semibold">{item.label}</h3>
                            <p className={`text-4xl font-extrabold leading-none ${item.textColor}`}>{item.value}</p>
                        </div>
                        <div className="w-full h-2 bg-gray-700 rounded-full overflow-hidden">
                            <div className={`h-full rounded-full ${item.color}`} style={{ width: item.value }} />
                        </div>
                    </div>
                ))}
            </div>

            <div className="mt-8 flex gap-x-8 justify-center">
                {stats.map((stat) => (
                    <div key={stat.label} className="bg-gray-700 px-8 py-8 rounded-3xl flex items-center gap-4">
                        <svg className="h-10 w-10 bg-gray-500 px-1 py-1 rounded-xl" xmlns="http://www.w3.org/2000/svg" viewBox="0 -960 960 960" fill="#e3e3e3">
                            <path d={stat.iconPath} />
                        </svg>
                        <div className="flex flex-col items-center">
                            <p className="text-xs text-gray-300">{stat.label}</p>
                            <p className="font-bold text-xl"> {stat.value}</p>
                        </div>
                    </div>
                ))}
            </div>

            <hr className="mt-7" />

            <div className="mt-6 flex gap-x-10 justify-center">
                <button
                    type="button"
                    onClick={onShare}
                    className="px-4 py-3 rounded-xl text-white bg-gray-500 hover:bg-gray-300 hover:text-gray-600 transition-colors font-bold cursor-pointer flex gap-3"
                >
                    <span>Share Report</span>
                </button>
                <button
                    type="button"
                    onClick={onSave}
                    className="px-4 py-3 rounded-xl text-[#001A42] bg-linear-to-r from-[#ADC6FF] to-[#D0BCFF] hover:from-[#8FB3FF] hover:to-[#B58CFF] font-bold cursor-pointer flex gap-3"
                >
                    <span>Save Prediction</span>
                </button>
            </div>
        </div>
    )
}

export default WinProbabilityGrid