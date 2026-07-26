import React from 'react'
import { Link } from 'react-router-dom'
import { useAuth } from '../context/useAuth'

const CTASection = () => {
    const { isAuthenticated } = useAuth()
    const ctaTitle = isAuthenticated
        ? 'Welcome back! Ready for your next match intelligence run?'
        : 'Ready to elevate your match analysis?'
    const ctaRoute = isAuthenticated ? '/predictions' : '/signup'
    const ctaLabel = isAuthenticated ? 'Go to Predictions' : 'Create Account'

    return (
        <section className="mt-40 max-w-3xl mx-auto bg-[#30344f] px-4 py-6 rounded-3xl">
            <div className="text-center space-y-8">
                <h3 className="font-extrabold text-4xl ">{ctaTitle}
                </h3>
                <p>Join 2.500+ analysts , scouts and enthusiasts who use FIFA-IQ
                    to gain a competitive edge every weekend</p>

            <div className="flex gap-3 justify-center">
            <Link to={ctaRoute} className="
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
        ">
        {ctaLabel}
        </Link>

        <Link to="/predictions" className="
        px-4 py-3 
        rounded-xl 
        bg-[#262A35]
        text-[#DFE2F1]
        cursor-pointer
        hover:bg-[#343946]
        hover:text-white
        ">
        View More
        </Link>
        </div>
    </div>
        </section>
    )
}

export default CTASection
