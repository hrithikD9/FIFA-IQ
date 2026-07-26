import React from 'react'
import { Link } from 'react-router-dom'
import argentinaFlag from '../assets/Arg.png'
import franceFlag from '../assets/Fra.png'
import { useAuth } from '../context/useAuth'

const Hero = () => {
    const { isAuthenticated } = useAuth()
    const primaryRoute = isAuthenticated ? '/predictions' : '/signup'

    return (
    <section className="px-6 py-16 space-y-10 flex justify-between">
        {/*Hero Section*/}
        <div className="space-y-6">
        <h2
        className="bg-[#571BC1] 
            px-2 py-1 
            uppercase 
            font-mono 
            text-sm
            tracking-tight 
            text-[#D0BCFF] border border-[#D0BCFF] 
            rounded-xl
            flex
            gap-2
            items-center
            max-w-3xs
            "
        >
        <svg
            xmlns="http://www.w3.org/2000/svg"
            fill="none"
            viewBox="0 0 24 24"
            strokeWidth={1.5}
            stroke="currentColor"
            className="size-6 text-[#D0BCFF]"
            >
            <path
                strokeLinecap="round"
                strokeLinejoin="round"
                d="m3.75 13.5 10.5-11.25L12 10.5h8.25L9.75 21.75 12 13.5H3.75Z"
            />
            </svg>
            Next-Gen Football intel
        </h2>

        <h2
        className="
        text-5xl
        font-bold
        "
        >
        Predict Football.
        </h2>

        <h2
        className="
        text-5xl
        font-bold
        bg-linear-to-b
        from-[#ADC6FF] to-[#D0BCFF] text-transparent bg-clip-text
        "
        >
        Understand the Game.
        </h2>

        <p
        className="
        text-[#C2C6D6]
        font-medium
        tracking-widest
        leading-5
        max-w-4xl
        "
        >
        Harness the power of elite-level data engineering and predictive
        modeling. FIFA-IQ decodes the pitch , transforming every pass , tackle
        and run into actionable intelligence
        </p>

        <div className="flex gap-3 items-center">
        <Link
            to={primaryRoute}
            className="
            px-4 py-3 
            rounded-xl 
            text-[#001A42] 
            bg-linear-to-r 
            from-[#ADC6FF] 
            to-[#D0BCFF] 
            hover:from-[#8FB3FF]
            hover:to-[#B58CFF]
            font-bold
            cursor-pointer
            "
        >
            Get Started
        </Link>

        <Link
            to={primaryRoute}
            className="
            px-4 py-3 
            rounded-xl 
            bg-[#262A35]
            text-[#DFE2F1]
            cursor-pointer
            hover:bg-[#343946]
            hover:text-white
            "
        >
            Try Live Simulation
        </Link>
        </div>
    </div>

    {/*card*/}
    <div className="px-14 py-4 max-w-2xl bg-[#313450] rounded-3xl flex flex-col justify-between">
        <div className="flex justify-between w-full items-center">
        <p className="text-sm text-white">Matchday 32 preview</p>
        <div className="flex -space-x-2 border-2 border-[#313450]">
            <img
            className="h-8 w-8 rounded-full"
            src={argentinaFlag}
            alt="Argentina flag"
            />
            <img
            className="h-8 w-8 rounded-full"
            src={franceFlag}
            alt="France flag"
            />
        </div>
        </div>

        <div className="flex justify-evenly mt-4">
        <p className="font-bold text-2xl">ARG</p>
        <p className="font-sans text-4xl font-extrabold bg-linear-to-r from-[#ADC6FF] to-[#D0BCFF] text-transparent bg-clip-text">
            VS
        </p>
        <p className="font-bold text-2xl">FRA</p>
        </div>

        <div className="flex gap-16 my-8 items-center">
        <div className="px-8 py-2 bg-[#171B26] rounded-2xl text-center">
            <p className="text-[#8C909F]">Expected Goals</p>
            <p className="text-[#ADC6FF] font-bold text-lg">2.42 xG</p>
        </div>

        <div className="px-8 py-2 bg-[#171B26] rounded-2xl text-center">
            <p className="text-[#8C909F]">Win Index</p>
            <p className="text-[#D0BCFF] font-bold text-lg">64%</p>
        </div>
        </div>
    </div>
    </section>
    )
}

export default Hero
