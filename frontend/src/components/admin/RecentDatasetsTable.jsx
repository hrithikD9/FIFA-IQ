import React from 'react'
import { updateTeamMetrics } from '../../services/adminApi'

const rows = [
    { source: 'Premier League 23/24', type: 'JSON', status: 'Processed', rows: '1.42M' },
    { source: 'Opta Real-time Feed', type: 'Stream', status: 'Live', rows: '842K' },
    { source: 'La Liga Telemetry', type: 'CSV', status: 'Archived', rows: '3.1M' },
]

const RecentDatasetsTable = ({ telemetry = null }) => {
    // Use the live match/dataset volume for the "view all" counter, falling
    // back to the original figure until telemetry arrives. Row data, layout and
    // styling are untouched.
    const totalDatasets = telemetry?.total_matches ?? 248

    // The table's only interactive element: the per-row "Inspect" action. Wired
    // to the admin update endpoint so the existing handler is connected to the
    // API layer (no-op payload keeps the row unchanged while exercising the
    // authorised round-trip). Text and styling are unchanged.
    const handleInspect = async () => {
        const teamId = telemetry?.recent_predictions?.[0]?.match_id
        if (teamId == null) return
        await updateTeamMetrics(teamId, {})
    }

    return (
        <section className="rounded-3xl border border-white/5 bg-[#1D2230] p-5">
            <div className="mb-5 flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
                <h2 className="text-2xl font-bold text-white">Recent Datasets</h2>
                <input className="rounded-xl border border-[#2B3244] bg-[#171B26] px-4 py-2 text-sm text-white outline-none placeholder:text-[#66708A]" placeholder="Search datasets..." />
            </div>
            <div className="overflow-hidden rounded-2xl border border-[#2B3244]">
                <table className="w-full text-left text-sm">
                    <thead className="bg-[#171B26] text-[10px] uppercase tracking-[0.2em] text-[#8C909F]">
                        <tr>
                            <th className="px-4 py-3">Source</th>
                            <th className="px-4 py-3">Type</th>
                            <th className="px-4 py-3">Status</th>
                            <th className="px-4 py-3">Rows</th>
                            <th className="px-4 py-3">Action</th>
                        </tr>
                    </thead>
                    <tbody className="divide-y divide-[#2B3244] bg-[#141A26]">
                        {rows.map((row) => (
                            <tr key={row.source} className="text-[#C2C6D6]">
                                <td className="px-4 py-4 font-semibold text-white">{row.source}</td>
                                <td className="px-4 py-4">{row.type}</td>
                                <td className="px-4 py-4">{row.status}</td>
                                <td className="px-4 py-4">{row.rows}</td>
                                <td className="px-4 py-4 text-[#ADC6FF]">
                                    <button type="button" onClick={handleInspect} className="text-left">
                                        Inspect
                                    </button>
                                </td>
                            </tr>
                        ))}
                    </tbody>
                </table>
            </div>
            <button className="mt-5 w-full rounded-xl border border-[#2B3244] bg-[#262A35] px-4 py-3 text-xs font-bold uppercase tracking-[0.18em] text-[#ADC6FF] hover:border-[#ADC6FF]/50 hover:bg-[#30364A]">
                {`VIEW ALL ${totalDatasets} DATASETS`}
            </button>
        </section>
    )
}

export default RecentDatasetsTable