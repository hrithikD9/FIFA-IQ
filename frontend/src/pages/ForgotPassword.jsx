import React, { useState } from 'react'
import { Link } from 'react-router-dom'
import { ArrowLeft, Mail, Send } from 'lucide-react'
import Logo from '../components/auth/Logo'

const ForgotPassword = () => {
    const [email, setEmail] = useState('')

    const handleSubmit = (e) => {
        e.preventDefault()
        // TODO: Connect to password reset API when backend support is available.
    }

    return (
        <div className="min-h-screen flex flex-col px-4 py-5 sm:px-8 bg-[#171B26] text-white">
            <header className="flex items-center justify-between gap-4">
                <Logo />
            </header>

            <main className="flex-1 flex items-center justify-center py-12">
                <section className="w-full max-w-md rounded-3xl border border-white/5 bg-linear-to-b from-[#20263A] to-[#1A1F2E] p-8 shadow-2xl">
                    <div className="space-y-3 text-center">
                        <span className="mx-auto inline-flex size-12 items-center justify-center rounded-2xl border border-[#ADC6FF]/30 bg-[#ADC6FF]/10 text-[#ADC6FF]">
                            <Mail className="size-5" aria-hidden="true" />
                        </span>
                        <div>
                            <h1 className="text-3xl font-bold text-white">Reset Your Password</h1>
                            <p className="mt-2 text-sm leading-6 text-[#8C909F]">
                                Enter your account email and we’ll prepare a secure reset link workflow.
                            </p>
                        </div>
                    </div>

                    <form onSubmit={handleSubmit} className="mt-8 space-y-5">
                        <div className="space-y-2">
                            <label
                                htmlFor="reset-email"
                                className="text-xs font-semibold tracking-wider text-[#8C909F] uppercase"
                            >
                                Email Address
                            </label>
                            <div className="relative">
                                <Mail className="absolute left-4 top-1/2 size-4.5 -translate-y-1/2 text-[#8C909F]" strokeWidth={2} />
                                <input
                                    id="reset-email"
                                    name="email"
                                    type="email"
                                    placeholder="you@fifa-iq.com"
                                    value={email}
                                    onChange={(e) => setEmail(e.target.value)}
                                    autoComplete="email"
                                    className="w-full rounded-xl border border-[#262A35] bg-[#171B26] py-3.5 pl-11 pr-4 text-sm text-white placeholder-[#52627A] outline-none transition-colors focus:border-[#ADC6FF]/60 focus:bg-[#1B2030]"
                                />
                            </div>
                        </div>

                        <button
                            type="submit"
                            className="flex w-full items-center justify-center gap-2 rounded-xl bg-linear-to-r from-[#ADC6FF] to-[#D0BCFF] px-4 py-3.5 font-bold text-[#001A42] transition-all hover:from-[#8FB3FF] hover:to-[#B58CFF]"
                        >
                            Send Reset Link
                            <Send className="size-4.5" strokeWidth={2.5} aria-hidden="true" />
                        </button>
                    </form>

                    <div className="mt-7 text-center">
                        <Link
                            to="/login"
                            className="inline-flex items-center gap-2 text-sm font-semibold text-[#ADC6FF] transition-colors hover:text-[#D0BCFF]"
                        >
                            <ArrowLeft className="size-4" aria-hidden="true" />
                            Back to Login
                        </Link>
                    </div>
                </section>
            </main>
        </div>
    )
}

export default ForgotPassword