import React from 'react'

const regions = ['US-East (Primary)', 'EU-West (Failover)', 'ASIA-South (Active)']

const nodes = [
    { label: 'US-East', x: 130, y: 102, color: '#ADC6FF' },
    { label: 'EU-West', x: 275, y: 86, color: '#D0BCFF' },
    { label: 'ASIA-South', x: 410, y: 135, color: '#8EE8C7' },
]

const NetworkTopology = ({ teams = null }) => {
    // Populate the region chips with live team names from the admin teams API
    // (first few, alphabetically) when available, otherwise keep the original
    // static regions. The SVG map and all styling are unchanged.
    const chips =
        Array.isArray(teams) && teams.length > 0
            ? teams.slice(0, 3).map((team) => team.name)
            : regions

    return (
        <section className="rounded-3xl border border-white/5 bg-[#1D2230] p-5">
            <div className="rounded-3xl border border-[#2B3244] bg-[radial-gradient(circle_at_30%_20%,rgba(173,198,255,0.22),transparent_28%),radial-gradient(circle_at_70%_55%,rgba(208,188,255,0.2),transparent_26%),#111827] p-6">
                <h2 className="text-2xl font-bold text-white">Network Topology</h2>
                <p className="mt-2 text-sm leading-6 text-[#8C909F]">
                    Global node distribution for real-time player tracking ingestions across 12 regions.
                </p>
                <div className="my-10 rounded-2xl border border-[#ADC6FF]/20 bg-black/20 p-4">
                    <svg className="h-52 w-full" viewBox="0 0 520 220" role="img" aria-label="Global ingestion node topology map">
                        <defs>
                            <pattern id="topology-dots" width="18" height="18" patternUnits="userSpaceOnUse">
                                <circle cx="2" cy="2" r="1.2" fill="#334155" opacity="0.7" />
                            </pattern>
                            <filter id="node-glow" x="-80%" y="-80%" width="260%" height="260%">
                                <feGaussianBlur stdDeviation="5" result="blur" />
                                <feMerge>
                                    <feMergeNode in="blur" />
                                    <feMergeNode in="SourceGraphic" />
                                </feMerge>
                            </filter>
                        </defs>
                        <rect width="520" height="220" rx="18" fill="url(#topology-dots)" />
                        <path d="M45 112 C95 55, 145 58, 185 96 C225 134, 260 124, 304 82 C356 34, 440 72, 480 126" fill="none" stroke="#ADC6FF" strokeWidth="1.5" strokeDasharray="6 8" opacity="0.45" />
                        <path d="M58 121 C106 155, 171 161, 218 132 C282 92, 355 95, 456 150" fill="none" stroke="#D0BCFF" strokeWidth="1.5" strokeDasharray="4 10" opacity="0.4" />
                        <path d="M65 82 C93 60, 126 72, 150 96 C116 101, 92 110, 65 82Z" fill="#ADC6FF" opacity="0.12" />
                        <path d="M232 79 C265 52, 313 56, 337 84 C306 101, 267 104, 232 79Z" fill="#D0BCFF" opacity="0.14" />
                        <path d="M365 118 C410 86, 462 103, 490 145 C443 166, 397 154, 365 118Z" fill="#8EE8C7" opacity="0.12" />
                        {nodes.map((node) => (
                            <g key={node.label} filter="url(#node-glow)">
                                <circle cx={node.x} cy={node.y} r="15" fill={node.color} opacity="0.16" />
                                <circle cx={node.x} cy={node.y} r="6" fill={node.color} />
                                <text x={node.x + 14} y={node.y - 10} fill="#E9ECF8" fontSize="12" fontWeight="700">
                                    {node.label}
                                </text>
                            </g>
                        ))}
                    </svg>
                </div>
                <div className="flex flex-wrap gap-2">
                    {chips.map((region) => (
                        <span key={region} className="rounded-full border border-[#ADC6FF]/30 bg-[#ADC6FF]/10 px-3 py-1 text-xs font-bold text-[#ADC6FF]">
                            {region}
                        </span>
                    ))}
                </div>
            </div>
        </section>
    )
}

export default NetworkTopology