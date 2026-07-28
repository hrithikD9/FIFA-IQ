import React, { useEffect, useMemo, useRef, useState } from 'react'
import messiAvatar from '../../assets/Messi.png'
import ronaldoAvatar from '../../assets/Ronaldo.png'
import { buildEngineLogs } from '../../services/telemetry'

const LEVEL_STYLES = {
    INIT: 'text-sky-300',
    DATA: 'text-emerald-300',
    SIM: 'text-[#ADC6FF]',
    INSIGHT: 'text-[#D0BCFF]',
    COMPLETE: 'text-emerald-400',
}

const LOG_STAGGER_MS = 550

const formatTimestamp = (date) =>
    date.toLocaleTimeString('en-GB', { hour12: false })

const UnderdogInsights = ({ isGenerating, prediction, homeTeam, awayTeam, telemetry, runId }) => {
    // Build the team-aware log script for the current fixture + prediction.
    const script = useMemo(
        () => buildEngineLogs(homeTeam, awayTeam, prediction, telemetry),
        [homeTeam, awayTeam, prediction, telemetry],
    )

    // visibleCount drives the typewriter-style sequencing. It resets whenever
    // the user regenerates (runId) or switches teams.
    const [visibleCount, setVisibleCount] = useState(0)
    const logContainerRef = useRef(null)

    useEffect(() => {
        // Don't stream anything until the user has generated at least once.
        if (runId === 0) {
            setVisibleCount(0)
            return undefined
        }

        setVisibleCount(0)
        const timers = script.map((_, index) =>
            setTimeout(() => setVisibleCount(index + 1), (index + 1) * LOG_STAGGER_MS),
        )

        return () => timers.forEach(clearTimeout)
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [runId, homeTeam, awayTeam])

    // Auto-scroll to the latest line as the stream grows.
    useEffect(() => {
        const container = logContainerRef.current
        if (container) {
            container.scrollTop = container.scrollHeight
        }
    }, [visibleCount])

    const visibleLogs = script.slice(0, visibleCount)

    return (
        <div className={`flex gap-x-10 justify-evenly mt-20 items-center bg-gray-800 rounded-2xl p-6 transition-opacity ${isGenerating ? 'animate-pulse opacity-70' : ''}`}>
            <div>
                <svg className="h-30 w-30" xmlns="http://www.w3.org/2000/svg" viewBox="0 -960 960 960" fill="#e3e3e3"><path d="M480-80q-83 0-156-31.5T197-197q-54-54-85.5-127T80-480q0-83 31.5-156T197-763q54-54 127-85.5T480-880q83 0 156 31.5T763-763q54 54 85.5 127T880-480q0 83-31.5 156T763-197q-54 54-127 85.5T480-80Zm200-500 54-18 16-54q-32-48-77-82.5T574-786l-54 38v56l160 112Zm-400 0 160-112v-56l-54-38q-54 17-99 51.5T210-652l16 54 54 18Zm-42 308 46-4 30-54-58-174-56-20-40 30q0 65 18 118.5T238-272Zm293 108q25-4 49-12l28-60-26-44H378l-26 44 28 60q24 8 49 12t51 4q26 0 51-4ZM390-360h180l56-160-146-102-144 102 54 160Zm332 88q42-50 60-103.5T800-494l-40-28-56 18-58 174 30 54 46 4Z"/></svg>
            </div>
            <div className="bg-gray-500 max-w-2xl rounded-2xl p-4">
                <p className="text-2xl font-bold mb-7">Underdog Insight</p>
                {prediction?.insight ? (
                    <div className="rounded-2xl bg-gray-700 px-4 py-4">
                        <p className="text-lg leading-8">{prediction.insight}</p>
                    </div>
                ) : (
                    <div className="rounded-2xl border border-dashed border-gray-400 px-4 py-8 text-gray-200">
                        Generate a prediction to unlock the tactical underdog summary.
                    </div>
                )}
            </div>
            <div className="bg-gray-500 max-w-2xl rounded-2xl p-4">
                <div className="flex items-center justify-between mb-7">
                    <p className="text-2xl font-bold">Live Engine Logs</p>
                    <span className={`h-2.5 w-2.5 rounded-full ${runId > 0 && visibleCount < script.length ? 'bg-emerald-400 animate-ping' : 'bg-gray-400'}`} />
                </div>

                <div
                    ref={logContainerRef}
                    className="font-mono text-sm leading-7 space-y-1 max-h-48 overflow-y-auto pr-2 scroll-smooth"
                >
                    {runId === 0 ? (
                        <p className="text-gray-300">Select a matchup and hit &ldquo;Generate Intelligence&rdquo; to start the engine.</p>
                    ) : (
                        visibleLogs.map((log, index) => (
                            <div key={`${runId}-${index}`} className="flex gap-x-3 opacity-0 animate-[fadeIn_.3s_ease_forwards]">
                                <span className="text-gray-400 shrink-0">[{formatTimestamp(new Date())}]</span>
                                <span className={`font-bold shrink-0 ${LEVEL_STYLES[log.level] ?? 'text-gray-200'}`}>[{log.level}]</span>
                                <span className="text-gray-100">{log.text}</span>
                            </div>
                        ))
                    )}
                </div>

                <div className="mt-4 flex gap-x-4 bg-gray-700 rounded-xl p-2 items-center">
                    <div className="flex -space-x-4">
                        <img className="h-10 w-10 border border-[#313450] rounded-full" src={messiAvatar} alt="Lionel Messi" />
                        <img className="h-10 w-10 border border-[#313450] rounded-full" src={ronaldoAvatar} alt="Cristiano Ronaldo" />
                    </div>
                    <p><span className="text-purple-400 font-bold text-xl">1.2K</span> Users Used This Prediction Today</p>
                </div>
            </div>
            <div>
                <svg className="h-30 w-30" xmlns="http://www.w3.org/2000/svg" viewBox="0 -960 960 960" fill="#e3e3e3"><path d="M222-79q-32 0-61.5-12T108-127l-7-7q-9-8-11.5-20t2.5-23l194-495q8-20 27.5-30.5T354-708l58 11q17 4 32.5-2.5T471-717q14-15 18.5-31.5T489-782l-5-15q-5-16-1.5-32.5T498-858l43-43q17-18 42.5-18t42.5 17l181 184q22 23 22.5 54.5T809-609l19 19q6 7 10.5 14.5T843-560q0 7-3 14t-11 15q-12 11-28.5 11.5T772-531l-18-19-28 29 18 18q11 11 11 28t-11 28q-12 11-28.5 11.5T687-447l-18-17-112 114 17 16q12 12 12 28.5T574-277q-12 11-28.5 11.5T517-277l-16-17-28 29 16 16q11 11 11 28t-11 28q-12 11-28.5 11.5T432-193l-16-15-28 28 16 15q11 12 11 28.5T404-108q-12 11-28.5 11.5T347-108l-16-16q-23 23-50.5 34T222-79Z"/></svg>
            </div>
        </div>
    )
}

export default UnderdogInsights
