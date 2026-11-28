import React, { useState } from 'react'

const label = (iso, opts) => new Date(`${iso}T12:00:00`).toLocaleDateString(undefined, opts)

/**
 * Single-series daily bar chart. `data` = [{ date: 'YYYY-MM-DD', count }], oldest first.
 * The card title names the series, so there is no legend.
 */
const DailyBars = ({ data, unit = 'prediction' }) => {
    const [hover, setHover] = useState(null)
    const max = Math.max(1, ...data.map((d) => d.count))
    // A "nice" top gridline: next value up from the max.
    const step = max <= 5 ? 1 : max <= 20 ? 5 : 10
    const top = Math.ceil(max / step) * step
    const tickIdx = new Set([0, Math.floor((data.length - 1) / 2), data.length - 1])
    const plural = (n) => `${n} ${unit}${n === 1 ? '' : 's'}`

    return (
        <div className="flex flex-col gap-2">
            <div className="relative h-44 pl-8">
                {/* Recessive gridlines: top value and baseline. */}
                <div className="pointer-events-none absolute inset-x-0 top-0 flex -translate-y-1/2 items-center gap-2" aria-hidden="true">
                    <span className="w-6 text-right text-[11px] text-fi-muted tabular-nums">{top}</span>
                    <span className="h-px flex-1 border-t border-dashed border-fi-border" />
                </div>
                <div className="pointer-events-none absolute inset-x-0 bottom-0 flex translate-y-1/2 items-center gap-2" aria-hidden="true">
                    <span className="w-6 text-right text-[11px] text-fi-muted">0</span>
                    <span className="h-px flex-1 bg-fi-border" />
                </div>

                <div className="absolute inset-y-0 right-0 left-8 flex items-end gap-0.5" onMouseLeave={() => setHover(null)}>
                    {data.map((d, i) => (
                        <button
                            key={d.date}
                            type="button"
                            className="group relative flex h-full flex-1 items-end justify-center focus:outline-none"
                            onMouseEnter={() => setHover(i)}
                            onFocus={() => setHover(i)}
                            onBlur={() => setHover(null)}
                            aria-label={`${label(d.date, { weekday: 'short', day: 'numeric', month: 'short' })}: ${plural(d.count)}`}
                        >
                            <span
                                className={`w-full max-w-7 rounded-t-[4px] transition-colors ${
                                    hover === i ? 'bg-fi-accent-light' : 'bg-fi-accent'
                                } ${d.count === 0 ? 'opacity-0' : ''}`}
                                style={{ height: `${(d.count / top) * 100}%` }}
                            />
                            {hover === i && (
                                <span
                                    role="tooltip"
                                    className={`pointer-events-none absolute -top-2 z-10 -translate-y-full whitespace-nowrap rounded-lg border border-fi-border bg-fi-inset px-2.5 py-1.5 text-xs shadow-lg ${
                                        i > data.length - 4 ? 'right-0' : i < 3 ? 'left-0' : 'left-1/2 -translate-x-1/2'
                                    }`}
                                >
                                    <span className="block text-fi-muted">
                                        {label(d.date, { weekday: 'short', day: 'numeric', month: 'short' })}
                                    </span>
                                    <span className="font-semibold text-white">{plural(d.count)}</span>
                                </span>
                            )}
                        </button>
                    ))}
                </div>
            </div>
            <div className="flex gap-0.5 pl-8 text-[11px] text-fi-muted" aria-hidden="true">
                {data.map((d, i) => (
                    <span key={d.date} className="flex-1 text-center whitespace-nowrap">
                        {tickIdx.has(i) ? label(d.date, { day: 'numeric', month: 'short' }) : ''}
                    </span>
                ))}
            </div>

            <div className="sr-only">
            <table>
                <caption>Daily {unit} counts</caption>
                <thead>
                    <tr>
                        <th>Date</th>
                        <th>Count</th>
                    </tr>
                </thead>
                <tbody>
                    {data.map((d) => (
                        <tr key={d.date}>
                            <td>{d.date}</td>
                            <td>{d.count}</td>
                        </tr>
                    ))}
                </tbody>
            </table>
            </div>
        </div>
    )
}

export default DailyBars
