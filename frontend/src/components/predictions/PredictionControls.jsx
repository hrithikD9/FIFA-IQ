import React, { useState } from 'react'

const NationalTeams = [
    { code: 'ARG', name: 'Argentina', flag: '🇦🇷' },
    { code: 'FRA', name: 'France', flag: '🇫🇷' },
    { code: 'BRA', name: 'Brazil', flag: '🇧🇷' },
    { code: 'ESP', name: 'Spain', flag: '🇪🇸' },
    { code: 'ENG', name: 'England', flag: '🇬🇧' },
    { code: 'GER', name: 'Germany', flag: '🇩🇪' },
]

const PredictionControls = ({ defaultHomeTeam = 'ARG', defaultAwayTeam = 'FRA', isGenerating, onGenerate }) => {
    const [homeTeam, setHomeTeam] = useState(defaultHomeTeam || 'ARG')
    const [awayTeam, setAwayTeam] = useState(defaultAwayTeam || 'FRA')

    return (
        <div className="w-full max-w-md space-y-6">
            <div className="bg-gray-600 rounded-3xl px-6 py-5 text-center">
                <div className="flex items-center justify-center gap-2 mb-6">
                    <svg xmlns="http://www.w3.org/2000/svg" height="24" viewBox="0 -960 960 960" width="24" fill="#e3e3e3">
                        <path d="M120-680v-160l160 80-160 80Zm600 0v-160l160 80-160 80Zm-280-40v-160l160 80-160 80Zm0 640q-76-2-141.5-12.5t-114-26.5Q136-135 108-156t-28-44v-360q0-25 31.5-46.5t85.5-38q54-16.5 127-26t156-9.5q83 0 156 9.5t127 26q54 16.5 85.5 38T880-560v360q0 23-28 44t-76.5 37q-48.5 16-114 26.5T520-80v-160h-80v160Zm40-440q97 0 167.5-11.5T760-558q0-5-76-23.5T480-600q-128 0-204 18.5T200-558q42 15 112.5 26.5T480-520ZM360-166v-154h240v154q80-8 131-23.5t69-27.5v-271q-55 22-138 35t-182 13q-99 0-182-13t-138-35v271q18 12 69 27.5T360-166Zm120-161Z"/>
                    </svg>

                    <h2 className="text-xl font-bold font-mono">
                        Match Configuration
                    </h2>
                </div>

                <div className="mb-5">
                    <p className="text-sm font-semibold text-gray-400 mb-2">
                        Home Team
                    </p>

                    <select
                        value={homeTeam}
                        onChange={(e) => setHomeTeam(e.target.value)}
                        className="w-full bg-gray-500 rounded-2xl px-5 py-4 outline-none text-center"
                    >
                        {NationalTeams.map((team) => (
                            <option key={team.code} value={team.code}>
                                {team.name} {team.flag}
                            </option>
                        ))}
                    </select>
                </div>

                <div className="w-12 h-12 mx-auto mb-5 rounded-2xl border border-blue-300 flex items-center justify-center font-bold bg-linear-to-b from-[#ADC6FF] to-[#D0BCFF] bg-clip-text text-transparent">
                    VS
                </div>

                <div className="mb-6">
                    <p className="text-sm font-semibold text-gray-400 mb-2">
                        Away Team
                    </p>

                    <select
                        value={awayTeam}
                        onChange={(e) => setAwayTeam(e.target.value)}
                        className="w-full bg-gray-500 rounded-2xl px-5 py-4 outline-none text-center"
                    >
                        {NationalTeams.map((team) => (
                            <option key={team.code} value={team.code}>
                                {team.name} {team.flag}
                            </option>
                        ))}
                    </select>
                </div>

                <button
                    type="button"
                    onClick={() => onGenerate({ homeTeam, awayTeam })}
                    disabled={isGenerating}
                    className="w-full py-4 rounded-2xl font-bold text-[#001A42] bg-linear-to-r from-[#ADC6FF] to-[#D0BCFF] hover:from-[#8FB3FF] hover:to-[#B58CFF] transition-all duration-300 cursor-pointer disabled:opacity-60 disabled:cursor-wait"
                >
                    {isGenerating ? 'GENERATING...' : 'GENERATE INTELLIGENCE'}
                </button>
            </div>

            <div className="bg-gray-700 rounded-3xl px-6 py-5 flex items-center justify-between">
                <div>
                    <p className="text-sm text-gray-400 font-semibold">
                        Model Confidence
                    </p>

                    <h2 className="text-3xl font-extrabold mt-1">
                        94.7%
                    </h2>
                </div>

                <svg className="h-14 w-14" xmlns="http://www.w3.org/2000/svg" viewBox="0 -960 960 960" fill="#e3e3e3">
                    <path d="M314-115q-104-48-169-145T80-479q0-26 2.5-51t8.5-49l-46 27-40-69 191-110 110 190-70 40-54-94q-11 27-16.5 56t-5.5 60q0 97 53 176.5T354-185l-40 70Zm306-485v-80h109q-46-57-111-88.5T480-800q-55 0-104 17t-90 48l-40-70q50-35 109-55t125-20q79 0 151 29.5T760-765v-55h80v220H620ZM594 0 403-110l110-190 69 40-57 98q118-17 196.5-107T800-480q0-11-.5-20.5T797-520h81q1 10 1.5 19.5t.5 20.5q0 135-80.5 241.5T590-95l44 26-40 69Z"/>
                </svg>
            </div>
        </div>
    )
}

export default PredictionControls