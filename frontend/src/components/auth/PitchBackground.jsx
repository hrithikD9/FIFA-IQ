import React from 'react'

const PitchBackground = () => {
    return (
        <svg
            aria-hidden="true"
            className="absolute inset-0 w-full h-full"
            viewBox="0 0 600 700"
            preserveAspectRatio="xMidYMid slice"
        >
            <defs>
                <linearGradient id="pitchGlow" x1="0%" y1="0%" x2="100%" y2="100%">
                    <stop offset="0%" stopColor="#ADC6FF" stopOpacity="0.55" />
                    <stop offset="100%" stopColor="#D0BCFF" stopOpacity="0.55" />
                </linearGradient>
                <radialGradient id="hotspotA" cx="50%" cy="50%" r="50%">
                    <stop offset="0%" stopColor="#ADC6FF" stopOpacity="0.35" />
                    <stop offset="100%" stopColor="#ADC6FF" stopOpacity="0" />
                </radialGradient>
                <radialGradient id="hotspotB" cx="50%" cy="50%" r="50%">
                    <stop offset="0%" stopColor="#D0BCFF" stopOpacity="0.35" />
                    <stop offset="100%" stopColor="#D0BCFF" stopOpacity="0" />
                </radialGradient>
                <linearGradient id="fadeBottom" x1="0%" y1="0%" x2="0%" y2="100%">
                    <stop offset="0%" stopColor="#0A0F18" stopOpacity="0.1" />
                    <stop offset="60%" stopColor="#0A0F18" stopOpacity="0.75" />
                    <stop offset="100%" stopColor="#0A0F18" stopOpacity="0.95" />
                </linearGradient>
                <filter id="blurGlow" x="-50%" y="-50%" width="200%" height="200%">
                    <feGaussianBlur stdDeviation="6" result="blur" />
                    <feMerge>
                        <feMergeNode in="blur" />
                        <feMergeNode in="SourceGraphic" />
                    </feMerge>
                </filter>
            </defs>

            {/* Base */}
            <rect width="600" height="700" fill="#0A0F18" />

            {/* Heatmap hotspots */}
            <ellipse cx="120" cy="230" rx="90" ry="55" fill="url(#hotspotA)" />
            <ellipse cx="430" cy="180" rx="80" ry="50" fill="url(#hotspotB)" />
            <ellipse cx="300" cy="330" rx="120" ry="70" fill="url(#hotspotA)" opacity="0.6" />

            {/* Pitch markings */}
            <g stroke="url(#pitchGlow)" strokeWidth="1.5" fill="none" filter="url(#blurGlow)">
                <rect x="40" y="60" width="520" height="360" rx="4" />
                <line x1="40" y1="240" x2="560" y2="240" />
                <circle cx="300" cy="240" r="60" />
                <circle cx="300" cy="240" r="3" fill="url(#pitchGlow)" />
                {/* Penalty areas */}
                <rect x="190" y="60" width="220" height="90" />
                <rect x="190" y="330" width="220" height="90" />
                {/* Six-yard boxes */}
                <rect x="245" y="60" width="110" height="36" />
                <rect x="245" y="384" width="110" height="36" />
                {/* Penalty arcs */}
                <path d="M 250 150 A 50 50 0 0 0 350 150" />
                <path d="M 250 330 A 50 50 0 0 1 350 330" />
                {/* Corner arcs */}
                <path d="M 40 72 A 12 12 0 0 0 52 60" />
                <path d="M 548 60 A 12 12 0 0 0 560 72" />
                <path d="M 40 408 A 12 12 0 0 1 52 420" />
                <path d="M 548 420 A 12 12 0 0 1 560 408" />
            </g>

            {/* Passing network lines */}
            <g stroke="#ADC6FF" strokeWidth="1" opacity="0.5">
                <line x1="140" y1="180" x2="260" y2="130" />
                <line x1="260" y1="130" x2="400" y2="200" />
                <line x1="140" y1="180" x2="220" y2="300" />
                <line x1="220" y1="300" x2="380" y2="290" />
                <line x1="400" y1="200" x2="380" y2="290" />
            </g>
            <g stroke="#D0BCFF" strokeWidth="1" opacity="0.4">
                <line x1="260" y1="130" x2="220" y2="300" />
                <line x1="140" y1="180" x2="400" y2="200" />
            </g>

            {/* Player dots */}
            <g filter="url(#blurGlow)">
                <circle cx="140" cy="180" r="4" fill="#ADC6FF" />
                <circle cx="260" cy="130" r="4" fill="#D0BCFF" />
                <circle cx="400" cy="200" r="4" fill="#ADC6FF" />
                <circle cx="220" cy="300" r="4" fill="#D0BCFF" />
                <circle cx="380" cy="290" r="4" fill="#ADC6FF" />
            </g>

            {/* Perspective fade */}
            <rect width="600" height="700" fill="url(#fadeBottom)" />
        </svg>
    )
}

export default PitchBackground
