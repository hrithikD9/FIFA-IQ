import React, { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { useAuth } from '../context/useAuth'

const Auth = () => {
    const navigate = useNavigate()
    const { signIn, signUp, signInWithGoogle } = useAuth()
    const [mode, setMode] = useState('login')
    const [email, setEmail] = useState('')
    const [password, setPassword] = useState('')
    const [error, setError] = useState('')
    const [isSubmitting, setIsSubmitting] = useState(false)

    const handleSubmit = async (event) => {
        event.preventDefault()
        setIsSubmitting(true)
        setError('')

        try {
            if (mode === 'login') {
                await signIn({ email, password })
            } else {
                await signUp({ email, password })
            }

            navigate('/predictions')
        } catch (authError) {
            setError(authError instanceof Error ? authError.message : 'Authentication failed.')
        } finally {
            setIsSubmitting(false)
        }
    }

    const handleGoogleAuth = async () => {
        setIsSubmitting(true)
        setError('')

        try {
            await signInWithGoogle()
        } catch (authError) {
            setError(authError instanceof Error ? authError.message : 'Google authentication failed.')
            setIsSubmitting(false)
        }
    }

    return (
        <div className="min-h-screen bg-[#0b1220] text-white px-6 py-10">
            <div className="mx-auto max-w-6xl grid gap-10 lg:grid-cols-[1.1fr_0.9fr] items-center">
                <div className="space-y-6">
                    <p className="uppercase tracking-[0.35em] text-sm text-[#ADC6FF]">FIFA-IQ Access Portal</p>
                    <h1 className="text-5xl font-extrabold leading-tight">
                        Step into the future of
                        <span className="block bg-linear-to-r from-[#ADC6FF] to-[#D0BCFF] bg-clip-text text-transparent">
                            football intelligence
                        </span>
                    </h1>
                    <p className="max-w-2xl text-lg text-gray-300 leading-8">
                        Sign in to unlock tactical forecasting, model-driven probability grids, and live prediction intelligence built for the modern game.
                    </p>
                </div>

                <div className="rounded-4xl border border-white/10 bg-white/5 backdrop-blur-xl p-8 shadow-2xl">
                    <div className="flex rounded-2xl bg-black/20 p-1 mb-8">
                        <button
                            type="button"
                            onClick={() => setMode('login')}
                            className={`flex-1 rounded-2xl px-4 py-3 font-semibold transition ${mode === 'login' ? 'bg-linear-to-r from-[#ADC6FF] to-[#D0BCFF] text-[#001A42]' : 'text-gray-300'}`}
                        >
                            Login
                        </button>
                        <button
                            type="button"
                            onClick={() => setMode('signup')}
                            className={`flex-1 rounded-2xl px-4 py-3 font-semibold transition ${mode === 'signup' ? 'bg-linear-to-r from-[#ADC6FF] to-[#D0BCFF] text-[#001A42]' : 'text-gray-300'}`}
                        >
                            Sign Up
                        </button>
                    </div>

                    <form onSubmit={handleSubmit} className="space-y-5">
                        <div>
                            <label className="block text-sm font-semibold text-gray-300 mb-2">Email</label>
                            <input
                                type="email"
                                value={email}
                                onChange={(event) => setEmail(event.target.value)}
                                className="w-full rounded-2xl border border-white/10 bg-black/20 px-4 py-4 outline-none focus:border-[#ADC6FF]"
                                placeholder="you@fifa-iq.com"
                                required
                            />
                        </div>

                        <div>
                            <label className="block text-sm font-semibold text-gray-300 mb-2">Password</label>
                            <input
                                type="password"
                                value={password}
                                onChange={(event) => setPassword(event.target.value)}
                                className="w-full rounded-2xl border border-white/10 bg-black/20 px-4 py-4 outline-none focus:border-[#ADC6FF]"
                                placeholder="Enter your password"
                                required
                            />
                        </div>

                        {error ? (
                            <div className="rounded-2xl border border-red-400/40 bg-red-500/10 px-4 py-3 text-sm text-red-200">
                                {error}
                            </div>
                        ) : null}

                        <button
                            type="submit"
                            disabled={isSubmitting}
                            className="w-full rounded-2xl bg-linear-to-r from-[#ADC6FF] to-[#D0BCFF] px-4 py-4 font-bold text-[#001A42] transition hover:opacity-90 disabled:opacity-60"
                        >
                            {isSubmitting ? 'Processing...' : mode === 'login' ? 'Sign In' : 'Create Account'}
                        </button>
                    </form>

                    <div className="my-6 flex items-center gap-4 text-sm text-gray-400">
                        <div className="h-px flex-1 bg-white/10" />
                        <span>or continue with</span>
                        <div className="h-px flex-1 bg-white/10" />
                    </div>

                    <button
                        type="button"
                        onClick={handleGoogleAuth}
                        disabled={isSubmitting}
                        className="w-full rounded-2xl border border-white/10 bg-white/5 px-4 py-4 font-semibold transition hover:bg-white/10 disabled:opacity-60"
                    >
                        Continue with Google
                    </button>
                </div>
            </div>
        </div>
    )
}

export default Auth
