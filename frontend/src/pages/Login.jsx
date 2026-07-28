import React, { useState } from 'react'
import { Link, useLocation, useNavigate } from 'react-router-dom'
import {
    Globe,
    Apple,
    Mail,
    Lock,
    Eye,
    EyeOff,
    ArrowRight,
    Cpu,
    ShieldCheck,
} from 'lucide-react'
import Logo from '../components/auth/Logo'
import SocialButton from '../components/auth/SocialButton'
import FormInput from '../components/auth/FormInput'
import StatusBadge from '../components/auth/StatusBadge'
import StatCard from '../components/auth/StatCard'
import PitchBackground from '../components/auth/PitchBackground'
import { useAuth } from '../context/useAuth'

const Login = () => {
    const navigate = useNavigate()
    const location = useLocation()
    const { signIn } = useAuth()
    const successMessage = location.state?.message ?? ''
    const [email, setEmail] = useState('')
    const [password, setPassword] = useState('')
    const [showPassword, setShowPassword] = useState(false)
    const [remember, setRemember] = useState(false)
    const [isLoading, setIsLoading] = useState(false)
    const [error, setError] = useState('')

    const handleSubmit = async (e) => {
        e.preventDefault()

        if (isLoading) {
            return
        }

        setIsLoading(true)
        setError('')

        try {
            const normalizedEmail = email.trim().toLowerCase()
            const cleanPassword = password.trim()

            const { error: signInError } = await signIn({ email: normalizedEmail, password: cleanPassword })

            if (signInError) {
                setError(signInError.message)
                return
            }

            navigate('/')
        } catch (submitError) {
            console.error('Login submission failed:', submitError)
            setError(submitError instanceof Error ? submitError.message : 'Unable to sign in right now.')
        } finally {
            setIsLoading(false)
        }
    }

    return (
        <div className="min-h-screen flex flex-col px-4 py-5 sm:px-8">
            {/* Top Bar */}
            <header className="flex items-center justify-between gap-4">
                <Logo />
                <div className="flex items-center gap-3">
                    <StatusBadge
                        icon={<span className="size-1.5 rounded-full bg-emerald-400 animate-pulse" aria-hidden="true" />}
                        text="Real-time Feed Active"
                    />
                    <StatusBadge
                        icon={<ShieldCheck className="size-3.5 text-[#ADC6FF]" aria-hidden="true" />}
                        text="99.9% Accuracy"
                    />
                </div>
            </header>

            {/* Main Card */}
            <main className="flex-1 flex mt-5 rounded-3xl overflow-hidden bg-[#1D2230] border border-white/5 shadow-2xl">
                {/* Hero Panel */}
                <section
                    aria-label="FIFA-IQ analytics overview"
                    className="hidden lg:flex relative w-1/2 flex-col justify-end p-10 overflow-hidden"
                >
                    {/* Pitch background */}
                    <PitchBackground />
                    {/* Gradient overlay */}
                    <div
                        aria-hidden="true"
                        className="absolute inset-0 bg-linear-to-r from-[#571BC1]/15 via-transparent to-[#ADC6FF]/10"
                    />

                    {/* HUD decorations */}
                    <div aria-hidden="true" className="absolute top-6 left-10 right-10 flex justify-between text-[9px] tracking-[0.3em] uppercase text-[#8C909F]/60 font-semibold">
                        <span>Opta Feeds</span>
                        <span>Neural Net</span>
                        <span>Live Sync</span>
                        <span>Telemetry</span>
                    </div>
                    <div aria-hidden="true" className="absolute top-24 left-12 flex items-center gap-3">
                        <span className="px-2 py-0.5 rounded bg-[#ADC6FF]/20 text-[#ADC6FF] text-[10px] font-bold tracking-widest">xG 2.42</span>
                        <span className="px-2 py-0.5 rounded bg-[#D0BCFF]/20 text-[#D0BCFF] text-[10px] font-bold tracking-widest">PPDA 8.1</span>
                    </div>
                    <div aria-hidden="true" className="absolute top-1/3 right-12 size-16 rounded-full border-2 border-[#D0BCFF]/50 flex items-center justify-center">
                        <span className="size-10 rounded-full border border-[#D0BCFF]/70 animate-ping" />
                    </div>
                    <div aria-hidden="true" className="absolute top-1/4 left-1/4 flex items-center gap-2">
                        <span className="size-2 rounded-full bg-[#ADC6FF]" />
                        <span className="w-16 h-px bg-linear-to-r from-[#ADC6FF] to-transparent" />
                    </div>
                    <div aria-hidden="true" className="absolute bottom-1/3 left-10 px-3 py-1.5 rounded-lg bg-[#171B26]/80 border border-[#ADC6FF]/30 text-[10px] tracking-widest text-[#ADC6FF] font-bold uppercase">
                        Heatmap: Active
                    </div>

                    {/* Content */}
                    <div className="relative space-y-6">
                        <span className="inline-flex items-center gap-2 px-3 py-1.5 rounded-lg bg-[#171B26]/80 border border-[#D0BCFF]/40 text-[10px] font-bold tracking-[0.25em] uppercase text-[#D0BCFF]">
                            <Cpu className="size-3.5" aria-hidden="true" />
                            Neural Analysis Engine
                        </span>

                        <h1 className="text-4xl xl:text-5xl font-bold leading-tight">
                            Master the Game with
                            <span className="block bg-linear-to-r from-[#ADC6FF] to-[#D0BCFF] text-transparent bg-clip-text">
                                Predictive Precision.
                            </span>
                        </h1>

                        <p className="text-[#C2C6D6] text-sm leading-6 max-w-md">
                            Access the world's most advanced football data ecosystem.
                            From player biometrics to tactical simulations.
                        </p>

                        <div className="flex gap-4 pt-2">
                            <StatCard value="2.4M+" label="Data Points/Sec" />
                            <StatCard value="Global" label="Scouting Network" />
                        </div>
                    </div>
                </section>

                {/* Form Panel */}
                <section
                    aria-label="Login form"
                    className="flex-1 flex items-center justify-center p-8 sm:p-12 bg-linear-to-b from-[#20263A] to-[#1A1F2E]"
                >
                    <div className="w-full max-w-md space-y-7">
                        <div className="space-y-2">
                            <h2 className="text-3xl font-bold text-white">Welcome Back</h2>
                            <p className="text-sm text-[#8C909F]">
                                Log in to your elite analyst command center.
                            </p>
                        </div>

                        {/* Social Login */}
                        <div className="grid grid-cols-2 gap-4">
                            <SocialButton icon={Globe} label="Google" />
                            <SocialButton icon={Apple} label="Apple" />
                        </div>

                        {/* Divider */}
                        <div className="flex items-center gap-4">
                            <span className="flex-1 h-px bg-[#262A35]" aria-hidden="true" />
                            <span className="text-[10px] font-bold tracking-[0.2em] uppercase text-[#52627A]">
                                Or continue with email
                            </span>
                            <span className="flex-1 h-px bg-[#262A35]" aria-hidden="true" />
                        </div>

                        {/* Form */}
                        <form onSubmit={handleSubmit} className="space-y-5">
                            {successMessage ? (
                                <div className="rounded-xl border border-emerald-400/40 bg-emerald-500/10 px-4 py-3 text-sm text-emerald-200">
                                    {successMessage}
                                </div>
                            ) : null}
                            <FormInput
                                id="email"
                                label="Email Address"
                                type="email"
                                placeholder="you@fifa-iq.com"
                                value={email}
                                onChange={(e) => setEmail(e.target.value)}
                                icon={Mail}
                                autoComplete="email"
                            />

                            <FormInput
                                id="password"
                                label="Password"
                                type={showPassword ? 'text' : 'password'}
                                placeholder="••••••••••"
                                value={password}
                                onChange={(e) => setPassword(e.target.value)}
                                icon={Lock}
                                autoComplete="current-password"
                                labelRight={
                                    <Link
                                        to="/forgot-password"
                                        className="text-[10px] font-bold tracking-widest uppercase text-[#ADC6FF] hover:text-[#D0BCFF] transition-colors"
                                    >
                                        Forgot Password?
                                    </Link>
                                }
                                rightElement={
                                    <button
                                        type="button"
                                        onClick={() => setShowPassword((prev) => !prev)}
                                        aria-label={showPassword ? 'Hide password' : 'Show password'}
                                        className="text-[#8C909F] hover:text-[#ADC6FF] transition-colors cursor-pointer"
                                    >
                                        {showPassword ? (
                                            <EyeOff className="size-4.5" strokeWidth={2} />
                                        ) : (
                                            <Eye className="size-4.5" strokeWidth={2} />
                                        )}
                                    </button>
                                }
                            />

                            {/* Remember me */}
                            <div className="flex items-center gap-2.5">
                                <input
                                    id="remember"
                                    name="remember"
                                    type="checkbox"
                                    checked={remember}
                                    onChange={(e) => setRemember(e.target.checked)}
                                    className="size-4 rounded accent-[#ADC6FF] bg-[#171B26] border-[#262A35] cursor-pointer"
                                />
                                <label htmlFor="remember" className="text-sm text-[#C2C6D6] cursor-pointer select-none">
                                    Remember this device for 30 days
                                </label>
                            </div>

                            {/* Submit */}
                            <button
                                type="submit"
                                disabled={isLoading}
                                className="w-full flex items-center justify-center gap-2 px-4 py-3.5 rounded-xl text-[#001A42] bg-linear-to-r from-[#ADC6FF] to-[#D0BCFF] hover:from-[#8FB3FF] hover:to-[#B58CFF] font-bold cursor-pointer transition-all"
                            >
                                {isLoading ? (
                                    <>
                                        <svg
                                            className="size-4.5 animate-spin"
                                            viewBox="0 0 24 24"
                                            fill="none"
                                            aria-hidden="true"
                                        >
                                            <circle
                                                className="opacity-25"
                                                cx="12"
                                                cy="12"
                                                r="10"
                                                stroke="currentColor"
                                                strokeWidth="4"
                                            />
                                            <path
                                                className="opacity-75"
                                                fill="currentColor"
                                                d="M4 12a8 8 0 0 1 8-8v4a4 4 0 0 0-4 4H4Z"
                                            />
                                        </svg>
                                        Signing In...
                                    </>
                                ) : (
                                    <>
                                        Sign In to The Pitch
                                        <ArrowRight className="size-4.5" strokeWidth={2.5} aria-hidden="true" />
                                    </>
                                )}
                            </button>

                            {error && (
                                <p className="rounded-xl border border-rose-500/30 bg-rose-500/10 px-4 py-3 text-sm text-rose-200">
                                    {error}
                                </p>
                            )}
                        </form>

                        {/* Signup link */}
                        <p className="text-center text-sm text-[#8C909F]">
                            Don't have an account?{' '}
                            <Link to="/signup" className="font-semibold text-[#ADC6FF] hover:text-[#D0BCFF] transition-colors">
                                Sign up
                            </Link>
                        </p>
                    </div>
                </section>
            </main>

            {/* Footer */}
            <footer className="flex flex-col sm:flex-row items-center justify-between gap-3 mt-5 text-[10px] tracking-[0.2em] uppercase font-semibold text-[#52627A]">
                <p>© 2026 FIFA-IQ Analytics Division. All rights reserved.</p>
                <nav aria-label="Footer" className="flex items-center gap-6">
                    <Link to="#" className="hover:text-[#ADC6FF] transition-colors">Privacy Protocol</Link>
                    <Link to="#" className="hover:text-[#ADC6FF] transition-colors">API Documentation</Link>
                    <Link to="#" className="hover:text-[#ADC6FF] transition-colors">System Status</Link>
                </nav>
            </footer>
        </div>
    )
}

export default Login
