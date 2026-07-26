import React from 'react'

const Footer = () => {
    return (
        <footer className="mx-auto w-full max-w-7xl px-6 py-8 mt-30">
            <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-6">

                {/*Left Section*/}
                <div className="flex flex-col gap-2">
                    <h1 className="font-extrabold text-3xl cursor-pointer bg-linear-to-r from-[#ADC6FF] to-[#D0BCFF] text-transparent bg-clip-text">
                        FIFA-IQ
                    </h1>
                    <p className="text-sm text-[#52627A]">
                        © 2026 FIFA-IQ Analytics. All rights reserved.
                    </p>
                </div>

                {/*Center Section*/}
                <ul className="flex flex-wrap items-center gap-x-6 gap-y-2 text-sm font-medium">
                    <li>
                        <a className="text-[#94A3BB] hover:text-[#ADC6FF] transition-colors" href="#">Privacy Policy</a>
                    </li>
                    <li>
                        <a className="text-[#94A3BB] hover:text-[#ADC6FF] transition-colors" href="#">Terms of Service</a>
                    </li>
                    <li>
                        <a className="text-[#94A3BB] hover:text-[#ADC6FF] transition-colors" href="#">API Documentation</a>
                    </li>
                    <li>
                        <a className="text-[#94A3BB] hover:text-[#ADC6FF] transition-colors" href="#">Support</a>
                    </li>
                </ul>

                {/* Right Section */}
                <div className="flex items-center">
                    <button className="p-3 rounded-xl bg-[#222530] text-[#94A3BB] hover:text-[#ADC6FF] hover:bg-[#2B2F3D] transition-colors cursor-pointer" aria-label="Share">
                        <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-5 h-5">
                            <path strokeLinecap="round" strokeLinejoin="round" d="M7.217 10.907a2.25 2.25 0 1 0 0 2.186m0-2.186c.18.324.283.696.283 1.093s-.103.77-.283 1.093m0-2.186 9.566-5.314m-9.566 7.5 9.566 5.314m0 0a2.25 2.25 0 1 0 3.935 2.186 2.25 2.25 0 0 0-3.935-2.186Zm0-12.814a2.25 2.25 0 1 0 3.933-2.185 2.25 2.25 0 0 0-3.933 2.185Z" />
                        </svg>
                    </button>
                </div>

            </div>
        </footer>
    )
}

export default Footer
