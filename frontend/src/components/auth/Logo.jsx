import React from 'react'
import { Activity } from 'lucide-react'
import { Link } from 'react-router-dom'

const Logo = () => {
    return (
        <Link to='/' className="flex items-center gap-3 group" aria-label="FIFA-IQ Home">
            <div className="p-2.5 rounded-xl bg-linear-to-br from-[#ADC6FF] to-[#D0BCFF] text-[#001A42]">
                <Activity className="size-5" strokeWidth={2.5} />
            </div>
            <div className="flex flex-col">
                <span className="font-extrabold text-lg leading-tight text-white tracking-wide">
                    FIFA-IQ
                </span>
                <span className="text-[10px] tracking-[0.25em] text-[#8C909F] uppercase font-semibold">
                    The Digital Pitch
                </span>
            </div>
        </Link>
    )
}

export default Logo
