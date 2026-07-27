import React, { useMemo, useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import {
    Globe,
    Apple,
    User,
    Mail,
    Lock,
    Eye,
    EyeOff,
    ArrowRight,
    Cpu,
    ShieldCheck,
    CheckCircle2,
} from 'lucide-react'
import Logo from '../components/auth/Logo'
import SocialButton from '../components/auth/SocialButton'
import FormInput from '../components/auth/FormInput'
import StatusBadge from '../components/auth/StatusBadge'
import StatCard from '../components/auth/StatCard'
import PitchBackground from '../components/auth/PitchBackground'
import { useAuth } from '../context/useAuth'

const SIGNUP_STEP_ONE_STORAGE_KEY = 'fifa-iq.signup.stepOne'

const Signup = () => {
    const navigate = useNavigate()
    const { signUp } = useAuth()

    const [fullName, setFullName] = useState('')
    const [email, setEmail] = useState('')
    const [password, setPassword] = useState('')
    const [confirmPassword, setConfirmPassword] = useState('')
    const [showPassword, setShowPassword] = useState(false)
    const [showConfirmPassword, setShowConfirmPassword] = useState(false)
    const [acceptTerms, setAcceptTerms] = useState(false)
    const [error, setError] = useState('')
    const [successMessage, setSuccessMessage] = useState('')
    const [isSubmitting, setIsSubmitting] = useState(false)

    const isEmailValid = /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)

    const passwordChecks = useMemo(
        () => ({
            minLength: password.length >= 8,
            hasUpper: /[A-Z]/.test(password),
            hasNumber: /\d/.test(password),
            hasSymbol: /[^A-Za-z0-9]/.test(password),
        }),
        [password],
    )

    const isPasswordStrong = Object.values(passwordChecks).every(Boolean)
    const passwordsMatch = password.length > 0 && password === confirmPassword

    const isFormValid =
        fullName.trim().length > 1 &&
        isEmailValid &&
        isPasswordStrong &&
        passwordsMatch &&
        acceptTerms

    const handleSubmit = async (e) => {
        e.preventDefault()

        if (!isFormValid || isSubmitting) {
            return
        }

        setIsSubmitting(true)
        setError('')
        setSuccessMessage('')

        try {
            const normalizedEmail = email.trim().toLowerCase()
            console.log('Signing up user:', normalizedEmail)
            const { data, error: signUpError } = await signUp({ email: normalizedEmail, password })
            console.log('SignUp response:', { data, error: signUpError })

            if (signUpError) {
                setError(signUpError.message)
                return
            }

            sessionStorage.setItem(
                SIGNUP_STEP_ONE_STORAGE_KEY,
                JSON.stringify({
                    fullName: fullName.trim(),
                    email: normalizedEmail,
                    role: 'public',
                }),
            )

            navigate('/signup/step-2', {
                state: {
                    fullName: fullName.trim(),
                    email: normalizedEmail,
                    role: 'public',
                    userId: data?.user?.id ?? null,
                },
            })
        } catch (submitError) {
            console.error('Signup submission failed:', submitError)
            setError(submitError instanceof Error ? submitError.message : 'Unable to create account right now.')
        } finally {
            setIsSubmitting(false)
        }
    }

    const checkItemClass = (ok) =>
        `inline-flex items-center gap-1.5 text-[11px] font-semibold tracking-wide ${
            ok ? 'text-emerald-300' : 'text-[#8C909F]'
        }`

    return (
        <div className="min-h-screen flex flex-col px-4 py-5 sm:px-8">
            <header className="flex items-center justify-between gap-4">
                <Logo />
                <div className="flex items-center gap-3">
                    <StatusBadge
                        icon={<span className="size-1.5 rounded-full bg-emerald-400 animate-pulse" aria-hidden="true" />}
                        text="Step 1 of 2"
                    />
                    <StatusBadge
                        icon={<ShieldCheck className="size-3.5 text-[#ADC6FF]" aria-hidden="true" />}
                        text="Secure Registration"
                    />
                </div>
            </header>

            <main className="flex-1 flex mt-5 rounded-3xl overflow-hidden bg-[#1D2230] border border-white/5 shadow-2xl">
                <section
                    aria-label="FIFA-IQ platform overview"
                    className="hidden lg:flex relative w-1/2 flex-col justify-end p-10 overflow-hidden"
                >
                    <PitchBackground />
                    <div
                        aria-hidden="true"
                        className="absolute inset-0 bg-linear-to-r from-[#571BC1]/15 via-transparent to-[#ADC6FF]/10"
                    />

                    <div aria-hidden="true" className="absolute top-6 left-10 right-10 flex justify-between text-[9px] tracking-[0.3em] uppercase text-[#8C909F]/60 font-semibold">
                        <span>Identity Vault</span>
                        <span>Model Access</span>
                        <span>Real-Time Ops</span>
                        <span>AI Lab</span>
                    </div>

                    <div className="relative space-y-6">
                        <span className="inline-flex items-center gap-2 px-3 py-1.5 rounded-lg bg-[#171B26]/80 border border-[#D0BCFF]/40 text-[10px] font-bold tracking-[0.25em] uppercase text-[#D0BCFF]">
                            <Cpu className="size-3.5" aria-hidden="true" />
                            Account Provisioning
                        </span>

                        <h1 className="text-4xl xl:text-5xl font-bold leading-tight">
                            Build Your
                            <span className="block bg-linear-to-r from-[#ADC6FF] to-[#D0BCFF] text-transparent bg-clip-text">
                                FIFA-IQ Profile.
                            </span>
                        </h1>

                        <p className="text-[#C2C6D6] text-sm leading-6 max-w-md">
                            Start with your account credentials, then choose the best role for
                            your analytics journey in the next step.
                        </p>

                        <div className="flex gap-4 pt-2">
                            <StatCard value="Public" label="Default Access" />
                            <StatCard value="2-Step" label="Guided Onboarding" />
                        </div>
                    </div>
                </section>

                <section
                    aria-label="Signup step 1 form"
                    className="flex-1 flex items-center justify-center p-8 sm:p-12 bg-linear-to-b from-[#20263A] to-[#1A1F2E]"
                >
                    <div className="w-full max-w-md space-y-6">
                        <div className="space-y-2">
                            <h2 className="text-3xl font-bold text-white">Create Account</h2>
                            <p className="text-sm text-[#8C909F]">
                                Step 1: Add your credentials to continue to role selection.
                            </p>
                        </div>

                        <div className="grid grid-cols-2 gap-4">
                            <SocialButton icon={Globe} label="Google" />
                            <SocialButton icon={Apple} label="Apple" />
                        </div>

                        <div className="flex items-center gap-4">
                            <span className="flex-1 h-px bg-[#262A35]" aria-hidden="true" />
                            <span className="text-[10px] font-bold tracking-[0.2em] uppercase text-[#52627A]">
                                Or continue with email
                            </span>
                            <span className="flex-1 h-px bg-[#262A35]" aria-hidden="true" />
                        </div>

                        <form onSubmit={handleSubmit} className="space-y-4" noValidate>
                            {error ? (
                                <div className="rounded-xl border border-rose-400/40 bg-rose-500/10 px-4 py-3 text-sm text-rose-200">
                                    {error}
                                </div>
                            ) : null}
                            {successMessage ? (
                                <div className="rounded-xl border border-emerald-400/40 bg-emerald-500/10 px-4 py-3 text-sm text-emerald-200">
                                    {successMessage}
                                </div>
                            ) : null}
                            <FormInput
                                id="fullName"
                                label="Full Name"
                                type="text"
                                placeholder="Alex Morgan"
                                value={fullName}
                                onChange={(e) => setFullName(e.target.value)}
                                icon={User}
                                autoComplete="name"
                            />

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
                            {email.length > 0 && !isEmailValid && (
                                <p className="text-xs text-rose-300">Enter a valid email address.</p>
                            )}

                            <FormInput
                                id="password"
                                label="Password"
                                type={showPassword ? 'text' : 'password'}
                                placeholder="Create a strong password"
                                value={password}
                                onChange={(e) => setPassword(e.target.value)}
                                icon={Lock}
                                autoComplete="new-password"
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

                            <FormInput
                                id="confirmPassword"
                                label="Confirm Password"
                                type={showConfirmPassword ? 'text' : 'password'}
                                placeholder="Repeat your password"
                                value={confirmPassword}
                                onChange={(e) => setConfirmPassword(e.target.value)}
                                icon={Lock}
                                autoComplete="new-password"
                                rightElement={
                                    <button
                                        type="button"
                                        onClick={() => setShowConfirmPassword((prev) => !prev)}
                                        aria-label={showConfirmPassword ? 'Hide password' : 'Show password'}
                                        className="text-[#8C909F] hover:text-[#ADC6FF] transition-colors cursor-pointer"
                                    >
                                        {showConfirmPassword ? (
                                            <EyeOff className="size-4.5" strokeWidth={2} />
                                        ) : (
                                            <Eye className="size-4.5" strokeWidth={2} />
                                        )}
                                    </button>
                                }
                            />

                            <div className="rounded-xl border border-[#2C3447] bg-[#171B26] px-4 py-3">
                                <p className="text-[10px] font-bold tracking-[0.2em] uppercase text-[#52627A] mb-2">
                                    Password must include
                                </p>
                                <div className="grid grid-cols-2 gap-2">
                                    <span className={checkItemClass(passwordChecks.minLength)}>
                                        <CheckCircle2 className="size-3.5" />
                                        8+ chars
                                    </span>
                                    <span className={checkItemClass(passwordChecks.hasUpper)}>
                                        <CheckCircle2 className="size-3.5" />
                                        Uppercase
                                    </span>
                                    <span className={checkItemClass(passwordChecks.hasNumber)}>
                                        <CheckCircle2 className="size-3.5" />
                                        Number
                                    </span>
                                    <span className={checkItemClass(passwordChecks.hasSymbol)}>
                                        <CheckCircle2 className="size-3.5" />
                                        Symbol
                                    </span>
                                </div>
                                {confirmPassword.length > 0 && !passwordsMatch && (
                                    <p className="mt-2 text-xs text-rose-300">Passwords do not match.</p>
                                )}
                            </div>

                            <label className="flex items-start gap-2.5 text-sm text-[#C2C6D6] cursor-pointer select-none">
                                <input
                                    name="terms"
                                    type="checkbox"
                                    checked={acceptTerms}
                                    onChange={(e) => setAcceptTerms(e.target.checked)}
                                    className="mt-0.5 size-4 rounded accent-[#ADC6FF] bg-[#171B26] border-[#262A35] cursor-pointer"
                                />
                                <span>
                                    I agree to the{' '}
                                    <Link to="#" className="text-[#ADC6FF] hover:text-[#D0BCFF] transition-colors">
                                        Terms of Service
                                    </Link>{' '}
                                    and{' '}
                                    <Link to="#" className="text-[#ADC6FF] hover:text-[#D0BCFF] transition-colors">
                                        Privacy Policy
                                    </Link>
                                    .
                                </span>
                            </label>

                            <button
                                type="submit"
                                disabled={!isFormValid || isSubmitting}
                                className="w-full flex items-center justify-center gap-2 px-4 py-3.5 rounded-xl text-[#001A42] bg-linear-to-r from-[#ADC6FF] to-[#D0BCFF] hover:from-[#8FB3FF] hover:to-[#B58CFF] font-bold cursor-pointer transition-all disabled:opacity-50 disabled:cursor-not-allowed"
                            >
                                {isSubmitting ? 'Creating Account...' : 'Continue to Role Selection'}
                                <ArrowRight className="size-4.5" strokeWidth={2.5} aria-hidden="true" />
                            </button>
                        </form>

                        <p className="text-center text-sm text-[#8C909F]">
                            Already have an account?{' '}
                            <Link to="/login" className="font-semibold text-[#ADC6FF] hover:text-[#D0BCFF] transition-colors">
                                Log in
                            </Link>
                        </p>
                    </div>
                </section>
            </main>

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

export default Signup
