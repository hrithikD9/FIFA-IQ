import React, { useEffect, useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { CircleCheck, Eye, EyeOff, LoaderCircle, LockKeyhole, ShieldAlert } from 'lucide-react'
import FormInput from '../components/auth/FormInput'
import Logo from '../components/auth/Logo'
import { supabase } from '../services/supabaseClient'

const getRecoveryHint = () => {
    const search = new URLSearchParams(window.location.search)
    const hash = new URLSearchParams(window.location.hash.replace(/^#/, ''))

    return search.has('code') || search.get('type') === 'recovery' || hash.get('type') === 'recovery'
}

// Capture this before Supabase exchanges the callback code and cleans the URL.
const hasInitialRecoveryHint = getRecoveryHint()

const ResetPassword = () => {
    const navigate = useNavigate()
    const [newPassword, setNewPassword] = useState('')
    const [confirmPassword, setConfirmPassword] = useState('')
    const [showPassword, setShowPassword] = useState(false)
    const [showConfirmPassword, setShowConfirmPassword] = useState(false)
    const [recoveryStatus, setRecoveryStatus] = useState('checking')
    const [error, setError] = useState('')
    const [isSubmitting, setIsSubmitting] = useState(false)
    const [isUpdated, setIsUpdated] = useState(false)

    const isLongEnough = newPassword.length >= 8
    const passwordsMatch = confirmPassword.length > 0 && newPassword === confirmPassword
    const isFormValid = isLongEnough && passwordsMatch

    useEffect(() => {
        let isMounted = true

        const { data: { subscription } } = supabase.auth.onAuthStateChange((event, session) => {
            if (!isMounted) return

            if (event === 'PASSWORD_RECOVERY') {
                setRecoveryStatus('ready')
                setError('')
            } else if (session && hasInitialRecoveryHint) {
                setRecoveryStatus('ready')
            }
        })

        const verifyRecoverySession = async () => {
            const { data, error: sessionError } = await supabase.auth.getSession()
            if (!isMounted) return

            if (sessionError) {
                setError(sessionError.message)
                setRecoveryStatus('invalid')
                return
            }

            if (data.session && hasInitialRecoveryHint) {
                setRecoveryStatus('ready')
                return
            }

            window.setTimeout(() => {
                if (isMounted) setRecoveryStatus((current) => current === 'checking' ? 'invalid' : current)
            }, 1200)
        }

        void verifyRecoverySession()

        return () => {
            isMounted = false
            subscription.unsubscribe()
        }
    }, [])

    const handleSubmit = async (event) => {
        event.preventDefault()

        if (!isFormValid || isSubmitting || recoveryStatus !== 'ready') {
            if (!isLongEnough) setError('Password must be at least 8 characters long.')
            else if (!passwordsMatch) setError('Passwords do not match.')
            return
        }

        setError('')
        setIsSubmitting(true)

        try {
            const { error: updateError } = await supabase.auth.updateUser({ password: newPassword })
            if (updateError) {
                setError(updateError.message)
                return
            }

            setIsUpdated(true)
            window.setTimeout(() => navigate('/login', {
                replace: true,
                state: { message: 'Password updated successfully!' },
            }), 1400)
        } catch (submitError) {
            setError(submitError instanceof Error ? submitError.message : 'Unable to update your password right now.')
        } finally {
            setIsSubmitting(false)
        }
    }

    return (
        <div className="min-h-screen bg-[#171B26] px-4 py-5 text-white sm:px-8">
            <header><Logo /></header>
            <main className="flex min-h-[calc(100vh-90px)] items-center justify-center py-12">
                <section aria-labelledby="reset-password-heading" className="w-full max-w-md rounded-3xl border border-white/5 bg-linear-to-b from-[#20263A] to-[#1A1F2E] p-8 shadow-2xl">
                    <div className="text-center">
                        <span className="mx-auto inline-flex size-12 items-center justify-center rounded-2xl border border-[#ADC6FF]/30 bg-[#ADC6FF]/10 text-[#ADC6FF]">
                            <LockKeyhole className="size-5" aria-hidden="true" />
                        </span>
                        <h1 id="reset-password-heading" className="mt-4 text-3xl font-bold">Set New Password</h1>
                        <p className="mt-2 text-sm leading-6 text-[#8C909F]">Choose a secure password for your FIFA-IQ account.</p>
                    </div>

                    {recoveryStatus === 'checking' ? (
                        <div role="status" className="mt-8 flex items-center justify-center gap-3 border-y border-white/5 py-8 text-sm text-[#C2C6D6]">
                            <LoaderCircle className="size-5 animate-spin text-[#ADC6FF]" aria-hidden="true" />
                            Verifying your reset link...
                        </div>
                    ) : null}

                    {recoveryStatus === 'invalid' ? (
                        <div className="mt-8 space-y-5 text-center">
                            <div role="alert" className="rounded-xl border border-rose-400/40 bg-rose-500/10 px-4 py-4 text-sm leading-6 text-rose-200">
                                <ShieldAlert className="mx-auto mb-2 size-5" aria-hidden="true" />
                                {error || 'This password reset link is invalid or has expired. Request a new link to continue.'}
                            </div>
                            <Link to="/forgot-password" className="inline-flex min-h-11 items-center justify-center rounded-xl bg-[#ADC6FF] px-5 font-bold text-[#001A42] transition-colors hover:bg-[#D0BCFF]">Request New Link</Link>
                        </div>
                    ) : null}

                    {recoveryStatus === 'ready' ? (
                        <form onSubmit={handleSubmit} className="mt-8 space-y-5" noValidate>
                            {isUpdated ? (
                                <div role="status" className="flex items-center gap-3 rounded-xl border border-emerald-400/40 bg-emerald-500/10 px-4 py-3 text-sm text-emerald-200">
                                    <CircleCheck className="size-4 shrink-0" aria-hidden="true" />
                                    Password updated successfully!
                                </div>
                            ) : null}
                            {error ? <p role="alert" className="rounded-xl border border-rose-400/40 bg-rose-500/10 px-4 py-3 text-sm text-rose-200">{error}</p> : null}

                            <FormInput id="newPassword" label="New Password" type={showPassword ? 'text' : 'password'} placeholder="At least 8 characters" value={newPassword} onChange={(event) => { setNewPassword(event.target.value); setError('') }} icon={LockKeyhole} autoComplete="new-password" invalid={newPassword.length > 0 && !isLongEnough} describedBy={newPassword.length > 0 && !isLongEnough ? 'new-password-error' : undefined} rightElement={<button type="button" onClick={() => setShowPassword((current) => !current)} aria-label={showPassword ? 'Hide password' : 'Show password'} className="text-[#8C909F] transition-colors hover:text-[#ADC6FF]">{showPassword ? <EyeOff className="size-4.5" /> : <Eye className="size-4.5" />}</button>} />
                            {newPassword.length > 0 && !isLongEnough ? <p id="new-password-error" className="text-xs text-rose-300">Password must be at least 8 characters long.</p> : null}

                            <FormInput id="confirmPassword" label="Confirm Password" type={showConfirmPassword ? 'text' : 'password'} placeholder="Repeat your new password" value={confirmPassword} onChange={(event) => { setConfirmPassword(event.target.value); setError('') }} icon={LockKeyhole} autoComplete="new-password" invalid={confirmPassword.length > 0 && !passwordsMatch} describedBy={confirmPassword.length > 0 && !passwordsMatch ? 'confirm-password-error' : undefined} rightElement={<button type="button" onClick={() => setShowConfirmPassword((current) => !current)} aria-label={showConfirmPassword ? 'Hide password' : 'Show password'} className="text-[#8C909F] transition-colors hover:text-[#ADC6FF]">{showConfirmPassword ? <EyeOff className="size-4.5" /> : <Eye className="size-4.5" />}</button>} />
                            {confirmPassword.length > 0 && !passwordsMatch ? <p id="confirm-password-error" className="text-xs text-rose-300">Passwords do not match.</p> : null}

                            <button type="submit" disabled={!isFormValid || isSubmitting || isUpdated} className="flex w-full items-center justify-center gap-2 rounded-xl bg-linear-to-r from-[#ADC6FF] to-[#D0BCFF] px-4 py-3.5 font-bold text-[#001A42] transition-all hover:from-[#8FB3FF] hover:to-[#B58CFF] disabled:cursor-not-allowed disabled:opacity-50">
                                {isSubmitting ? <LoaderCircle className="size-4.5 animate-spin" aria-hidden="true" /> : null}
                                {isSubmitting ? 'Updating Password...' : 'Update Password'}
                            </button>
                        </form>
                    ) : null}
                </section>
            </main>
        </div>
    )
}

export default ResetPassword