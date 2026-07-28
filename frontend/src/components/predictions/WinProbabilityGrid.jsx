import React from 'react'
import { formatTelemetry } from '../../services/telemetry'

const formatPercent = (value) => `${Math.round(Number(value || 0) * 100)}%`

const WinProbabilityGrid = ({
    isGenerating,
    prediction,
    homeTeam,
    awayTeam,
    isSaving,
    isSaved,
    saveMessage,
    onShare,
    onSave,
    telemetry,
}) => {
    const telemetryCards = telemetry
        ? [
              { label: 'Model Confidence', value: formatTelemetry.confidence(telemetry.modelConfidence), accent: 'text-[#ADC6FF]' },
              { label: 'xG Spread', value: formatTelemetry.xgSpread(telemetry.xgSpread), accent: 'text-[#D0BCFF]' },
              { label: 'Monte Carlo Runs', value: formatTelemetry.runs(telemetry.monteCarloRuns), accent: 'text-[#ADC6FF]' },
              { label: 'Engine Latency', value: formatTelemetry.latency(telemetry.engineLatency), accent: 'text-[#D0BCFF]' },
          ]
        : []
    const probabilities = prediction
        ? [
              {
                  label: 'Home Win',
                  value: formatPercent(prediction.homeWin),
                  color: 'bg-[#ADC6FF]',
                  textColor: 'text-[#ADC6FF]',
              },
              {
                  label: 'Draw',
                  value: formatPercent(prediction.draw),
                  color: 'bg-gray-400',
                  textColor: 'text-white',
              },
              {
                  label: 'Away Win',
                  value: formatPercent(prediction.awayWin),
                  color: 'bg-[#D0BCFF]',
                  textColor: 'text-[#D0BCFF]',
              },
          ]
        : []

    return (
        <div className={`w-full bg-gray-600 px-5 py-6 rounded-4xl transition-opacity ${isGenerating ? 'animate-pulse opacity-70' : ''}`}>
            <div className="flex justify-evenly border border-indigo-300 items-center rounded-3xl px-4 py-4">
                <img className="h-18 w-18 rounded-full object-cover" src={homeTeam.flag} alt={`${homeTeam.name} flag`} />
                <div className="flex flex-col items-center">
                    <p className="text-5xl font-serif font-extrabold">{prediction ? 'AI' : '--'}</p>
                    <p className="bg-gray-500 px-2 py-2 text-sm rounded-2xl mx-auto my-6 font-bold bg-linear-to-b from-[#ADC6FF] to-[#D0BCFF] text-transparent bg-clip-text border border-blue-200">
                        {`${homeTeam.code} vs ${awayTeam.code}`}
                    </p>
                    <p className="text-sm text-gray-200">
                        {homeTeam.name} vs {awayTeam.name}
                    </p>
                </div>
                <img className="h-18 w-18 rounded-full object-cover" src={awayTeam.flag} alt={`${awayTeam.name} flag`} />
            </div>

            <div className="bg-[#111827] rounded-3xl p-6 mt-6">
                <div className="flex justify-between items-center mb-8">
                    <h2 className="uppercase text-xs tracking-[0.2em] font-bold text-gray-400">Win Probabilities</h2>
                    <p className="uppercase text-xs font-bold text-[#ADC6FF]">
                        {prediction ? 'Live Calculation' : 'No Data Yet'}
                    </p>
                </div>

                {prediction ? (
                    probabilities.map((item) => (
                        <div key={item.label} className="mb-8 last:mb-0">
                            <div className="flex justify-between items-end mb-3">
                                <h3 className="text-white text-2xl font-semibold">{item.label}</h3>
                                <p className={`text-4xl font-extrabold leading-none ${item.textColor}`}>{item.value}</p>
                            </div>
                            <div className="w-full h-2 bg-gray-700 rounded-full overflow-hidden">
                                <div className={`h-full rounded-full ${item.color}`} style={{ width: item.value }} />
                            </div>
                        </div>
                    ))
                ) : (
                    <div className="rounded-2xl border border-dashed border-gray-500 px-4 py-10 text-center text-gray-300">
                        Generate a prediction to see the probability breakdown.
                    </div>
                )}
            </div>

            <div className="mt-8">
                <p className="uppercase text-xs tracking-[0.2em] font-bold text-gray-400 mb-4">Match Telemetry</p>
                <div className="grid grid-cols-2 gap-4">
                    {telemetryCards.map((card) => (
                        <div key={card.label} className="bg-gray-700 px-5 py-5 rounded-3xl flex flex-col items-center justify-center gap-1 border border-gray-600/60">
                            <p className="text-[11px] uppercase tracking-wider text-gray-300">{card.label}</p>
                            <p className={`font-extrabold text-2xl ${card.accent}`}>{card.value}</p>
                        </div>
                    ))}
                </div>
            </div>

            <hr className="mt-7" />

            {saveMessage ? (
                <p className={`mt-6 text-center text-sm font-semibold ${isSaved ? 'text-emerald-300' : 'text-red-300'}`}>
                    {saveMessage}
                </p>
            ) : null}

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
                    disabled={!prediction || isSaving || isSaved}
                    className="px-4 py-3 rounded-xl text-[#001A42] bg-linear-to-r from-[#ADC6FF] to-[#D0BCFF] hover:from-[#8FB3FF] hover:to-[#B58CFF] font-bold cursor-pointer flex gap-3 disabled:opacity-60 disabled:cursor-not-allowed"
                >
                    <span>{isSaved ? 'Saved ✓' : isSaving ? 'Saving...' : 'Save Prediction'}</span>
                </button>
            </div>
        </div>
    )
}

export default WinProbabilityGrid
