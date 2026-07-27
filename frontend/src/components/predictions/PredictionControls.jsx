import React from 'react'

const PredictionControls = ({
    teams,
    homeTeam,
    awayTeam,
    matchId,
    manualMatchId,
    isGenerating,
    error,
    onHomeTeamChange,
    onAwayTeamChange,
    onMatchIdChange,
    onGenerate,
}) => {
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
                        value={homeTeam.code}
                        onChange={(e) => onHomeTeamChange(e.target.value)}
                        className="w-full bg-gray-500 rounded-2xl px-5 py-4 outline-none text-center"
                    >
                        {teams.map((team) => (
                            <option key={team.code} value={team.code}>
                                {team.name} {team.code}
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
                        value={awayTeam.code}
                        onChange={(e) => onAwayTeamChange(e.target.value)}
                        className="w-full bg-gray-500 rounded-2xl px-5 py-4 outline-none text-center"
                    >
                        {teams.map((team) => (
                            <option key={team.code} value={team.code}>
                                {team.name} {team.code}
                            </option>
                        ))}
                    </select>
                </div>

                <div className="mb-6">
                    <p className="text-sm font-semibold text-gray-400 mb-2">
                        Match ID
                    </p>
                    <input
                        type="number"
                        min="1"
                        value={matchId}
                        onChange={(e) => onMatchIdChange(Number(e.target.value) || 1)}
                        className="w-full bg-gray-500 rounded-2xl px-5 py-4 outline-none text-center"
                        placeholder="Enter match ID"
                    />
                    {matchId !== manualMatchId ? (
                        <p className="text-xs text-gray-300 mt-2">
                            Auto-mapped from selected teams. Manual fallback: #{manualMatchId}
                        </p>
                    ) : null}
                </div>

                {error ? (
                    <div className="mb-4 rounded-2xl border border-red-400/40 bg-red-500/10 px-4 py-3 text-sm text-red-200">
                        {error}
                    </div>
                ) : null}

                <button
                    type="button"
                    onClick={() => onGenerate({ matchId })}
                    disabled={isGenerating || !matchId}
                    className="w-full py-4 rounded-2xl font-bold text-[#001A42] bg-linear-to-r from-[#ADC6FF] to-[#D0BCFF] hover:from-[#8FB3FF] hover:to-[#B58CFF] transition-all duration-300 cursor-pointer disabled:opacity-60 disabled:cursor-wait"
                >
                    {isGenerating ? 'GENERATING...' : 'GENERATE INTELLIGENCE'}
                </button>
            </div>

            <div className="bg-gray-700 rounded-3xl px-6 py-5 flex items-center justify-between">
                <div>
                    <p className="text-sm font-semibold text-gray-400">
                        Selected Matchup
                    </p>

                    <h2 className="text-2xl font-extrabold mt-1">
                        {homeTeam.name} vs {awayTeam.name}
                    </h2>
                </div>
            </div>
        </div>
    )
}

export default PredictionControls
