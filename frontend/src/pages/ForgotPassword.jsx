import React, { useMemo, useState } from 'react'
import { Link } from 'react-router-dom'
import { ArrowLeft, CircleCheck, LoaderCircle, Mail, Send, TriangleAlert } from 'lucide-react'
import Logo from '../components/auth/Logo'
import { supabase } from '../services/supabaseClient'

const ForgotPassword = () => {
    const [email, setEmail] = useState('')
    const [error, setError] = useState('')
    const [success, setSuccess] = useState('')
    const [isSubmitting, setIsSubmitting] = useState(false)
    const isEmailValid = useMemo(() => /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email.trim()), [email])

    const handleSubmit = async (e) => {
        e.preventDefault()

        if (!isEmailValid || isSubmitting) {
            setError('Enter a valid email address.')
            return
        }

        setError('')
        setSuccess('')
        setIsSubmitting(true)

        try {
            const { error: resetError } = await supabase.auth.resetPasswordForEmail(
                email.trim().toLowerCase(),
                { redirectTo: `${window.location.origin}/reset-password` },
            )

            if (resetError) {
                setError(resetError.message)
                return
            }

            setSuccess('Password reset instructions have been sent to your email.')
        } catch (submitError) {
            setError(submitError instanceof Error ? submitError.message : 'Unable to send reset instructions right now.')
        } finally {
            setIsSubmitting(false)
        }
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
                                Enter your account email and we’ll send you a secure reset link.
                            </p>
                        </div>
                    </div>

                    <form onSubmit={handleSubmit} className="mt-8 space-y-5" noValidate>
                        {success ? (
                            <div role="status" className="flex gap-3 rounded-xl border border-emerald-400/40 bg-emerald-500/10 px-4 py-3 text-sm leading-5 text-emerald-200">
                                <CircleCheck className="mt-0.5 size-4 shrink-0" aria-hidden="true" />
                                {success}
                            </div>
                        ) : null}
                        {error ? (
                            <div role="alert" className="flex gap-3 rounded-xl border border-rose-400/40 bg-rose-500/10 px-4 py-3 text-sm leading-5 text-rose-200">
                                <TriangleAlert className="mt-0.5 size-4 shrink-0" aria-hidden="true" />
                                {error}
                            </div>
                        ) : null}
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
                                    aria-invalid={email.length > 0 && !isEmailValid}
                                    aria-describedby={email.length > 0 && !isEmailValid ? 'reset-email-error' : undefined}
                                    className={`w-full rounded-xl border bg-[#171B26] py-3.5 pl-11 pr-4 text-sm text-white placeholder-[#52627A] outline-none transition-colors focus:bg-[#1B2030] ${email.length > 0 && !isEmailValid ? 'border-rose-400/70 focus:border-rose-400' : 'border-[#262A35] focus:border-[#ADC6FF]/60'}`}
                                />
                            </div>
                            {email.length > 0 && !isEmailValid ? <p id="reset-email-error" className="text-xs text-rose-300">Enter a valid email address.</p> : null}
                        </div>

                        <button
                            type="submit"
                            disabled={!isEmailValid || isSubmitting}
                            className="flex w-full items-center justify-center gap-2 rounded-xl bg-linear-to-r from-[#ADC6FF] to-[#D0BCFF] px-4 py-3.5 font-bold text-[#001A42] transition-all hover:from-[#8FB3FF] hover:to-[#B58CFF] disabled:cursor-not-allowed disabled:opacity-50"
                        >
                            {isSubmitting ? <LoaderCircle className="size-4.5 animate-spin" aria-hidden="true" /> : <Send className="size-4.5" strokeWidth={2.5} aria-hidden="true" />}
                            {isSubmitting ? 'Sending Instructions...' : 'Send Reset Link'}
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