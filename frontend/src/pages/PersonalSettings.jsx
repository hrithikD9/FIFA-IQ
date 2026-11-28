import React, { useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { Check, KeyRound, LogOut, UserRound, X } from 'lucide-react'
import { Button, Card, Pill, PlayerAvatar, SectionHeader } from '../components/football/ui'
import { useToast } from '../components/useToast'
import { useAuth } from '../context/useAuth'

const inputClass =
    'min-h-11 w-full rounded-xl border border-fi-border bg-fi-inset px-3.5 text-sm text-white placeholder:text-fi-muted focus:border-fi-accent focus:outline-none'

// Same rules as signup, so a password changed here is as strong as a new account's.
const PASSWORD_RULES = [
    ['At least 8 characters', (p) => p.length >= 8],
    ['An uppercase letter', (p) => /[A-Z]/.test(p)],
    ['A number', (p) => /\d/.test(p)],
    ['A symbol', (p) => /[^A-Za-z0-9]/.test(p)],
]

const Field = ({ label, hint, children }) => (
    <label className="flex flex-col gap-1.5">
        <span className="text-sm font-medium text-fi-text">{label}</span>
        {children}
        {hint && <span className="text-xs text-fi-muted">{hint}</span>}
    </label>
)

const metaValue = (meta, ...keys) => keys.map((k) => meta?.[k]).find((v) => typeof v === 'string') ?? ''

const PersonalSettings = () => {
    const { user, supabase, refreshUser, signOut } = useAuth()
    const toast = useToast()
    const navigate = useNavigate()
    const meta = user?.user_metadata ?? {}

    // Untouched fields follow live metadata; only edits are held locally.
    const [edits, setEdits] = useState({})
    const profile = {
        fullName: edits.fullName ?? metaValue(meta, 'full_name', 'fullName', 'name'),
        avatarUrl: edits.avatarUrl ?? metaValue(meta, 'avatar_url', 'avatarUrl'),
        preferredTeam: edits.preferredTeam ?? metaValue(meta, 'preferred_team', 'preferredTeam'),
    }
    const dirty = Object.keys(edits).length > 0
    const [savingProfile, setSavingProfile] = useState(false)

    const [password, setPassword] = useState('')
    const [confirm, setConfirm] = useState('')
    const [savingPassword, setSavingPassword] = useState(false)
    const checks = PASSWORD_RULES.map(([label, test]) => [label, test(password)])
    const passwordValid = checks.every(([, ok]) => ok) && password === confirm

    const displayName = profile.fullName || user?.firstName || user?.email?.split('@')[0] || 'Your account'

    const saveProfile = async (event) => {
        event.preventDefault()
        if (savingProfile || !dirty) return
        setSavingProfile(true)
        try {
            const { error } = await supabase.auth.updateUser({
                data: {
                    full_name: profile.fullName.trim() || null,
                    avatar_url: profile.avatarUrl.trim() || null,
                    preferred_team: profile.preferredTeam.trim() || null,
                },
            })
            if (error) throw error
            await refreshUser()
            setEdits({})
            toast.success('Profile updated', 'Your details were saved.')
        } catch (error) {
            toast.error('Update failed', error?.message || 'Unable to update your profile right now.')
        } finally {
            setSavingProfile(false)
        }
    }

    const savePassword = async (event) => {
        event.preventDefault()
        if (savingPassword || !passwordValid) return
        setSavingPassword(true)
        try {
            const { error } = await supabase.auth.updateUser({ password })
            if (error) throw error
            setPassword('')
            setConfirm('')
            toast.success('Password updated', 'Use your new password next time you sign in.')
        } catch (error) {
            toast.error('Update failed', error?.message || 'Unable to update your password right now.')
        } finally {
            setSavingPassword(false)
        }
    }

    const handleSignOut = async () => {
        await signOut()
        navigate('/login', { replace: true })
    }

    return (
        <div className="flex flex-col gap-6">
            <Card className="flex flex-col gap-5 p-5 sm:flex-row sm:items-center sm:p-7">
                <PlayerAvatar name={displayName} photoUrl={profile.avatarUrl || null} size="lg" />
                <div className="flex min-w-0 flex-1 flex-col gap-2">
                    <div className="flex flex-wrap items-center gap-3">
                        <h1 className="font-display text-3xl font-bold text-white sm:text-4xl">{displayName}</h1>
                        <Pill tone={user?.isAdmin ? 'accent' : 'neutral'}>{user?.isAdmin ? 'Admin' : 'Member'}</Pill>
                    </div>
                    <p className="text-[15px] text-fi-muted">{user?.email}</p>
                    <Link
                        to={user?.isAdmin ? '/admin' : '/dashboard'}
                        className="self-start text-sm font-semibold text-fi-link hover:text-fi-accent-light"
                    >
                        {user?.isAdmin ? 'Admin overview →' : 'Your dashboard →'}
                    </Link>
                </div>
                <Button onClick={handleSignOut} className="self-start sm:self-center">
                    <LogOut className="size-4" aria-hidden="true" /> Sign out
                </Button>
            </Card>

            <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
                <Card className="flex flex-col gap-5 p-5 sm:p-6">
                    <SectionHeader
                        badge={
                            <span className="grid size-10 place-items-center rounded-xl bg-fi-accent/10 text-fi-accent">
                                <UserRound className="size-5" aria-hidden="true" />
                            </span>
                        }
                        title="Profile details"
                        subtitle="Stored with your account and shown across FIFA-IQ"
                    />
                    <form onSubmit={saveProfile} className="flex flex-col gap-4">
                        <Field label="Full name">
                            <input
                                className={inputClass}
                                value={profile.fullName}
                                maxLength={80}
                                autoComplete="name"
                                onChange={(e) => setEdits({ ...edits, fullName: e.target.value })}
                            />
                        </Field>
                        <Field label="Avatar image URL" hint="Optional. A link to a square image; your initials are used otherwise.">
                            <input
                                className={inputClass}
                                type="url"
                                value={profile.avatarUrl}
                                placeholder="https://…"
                                onChange={(e) => setEdits({ ...edits, avatarUrl: e.target.value })}
                            />
                        </Field>
                        <Field label="Favourite team" hint="Optional, e.g. FC Barcelona or Argentina.">
                            <input
                                className={inputClass}
                                value={profile.preferredTeam}
                                maxLength={60}
                                onChange={(e) => setEdits({ ...edits, preferredTeam: e.target.value })}
                            />
                        </Field>
                        <div className="flex items-center gap-3">
                            <Button type="submit" variant="primary" disabled={!dirty || savingProfile}>
                                {savingProfile ? 'Saving…' : 'Save changes'}
                            </Button>
                            {dirty && (
                                <button type="button" onClick={() => setEdits({})} className="text-sm font-semibold text-fi-muted hover:text-white">
                                    Discard
                                </button>
                            )}
                        </div>
                    </form>
                </Card>

                <Card className="flex flex-col gap-5 p-5 sm:p-6">
                    <SectionHeader
                        badge={
                            <span className="grid size-10 place-items-center rounded-xl bg-fi-accent/10 text-fi-accent">
                                <KeyRound className="size-5" aria-hidden="true" />
                            </span>
                        }
                        title="Change password"
                        subtitle={`For ${user?.email ?? 'your account'}`}
                    />
                    <form onSubmit={savePassword} className="flex flex-col gap-4">
                        <Field label="New password">
                            <input
                                className={inputClass}
                                type="password"
                                autoComplete="new-password"
                                value={password}
                                onChange={(e) => setPassword(e.target.value)}
                            />
                        </Field>
                        <ul className="grid grid-cols-2 gap-1.5 text-xs" aria-label="Password requirements">
                            {checks.map(([label, ok]) => (
                                <li key={label} className={`flex items-center gap-1.5 ${ok ? 'text-fi-win' : 'text-fi-muted'}`}>
                                    {ok ? <Check className="size-3.5" aria-hidden="true" /> : <X className="size-3.5" aria-hidden="true" />}
                                    {label}
                                </li>
                            ))}
                        </ul>
                        <Field label="Confirm new password">
                            <input
                                className={inputClass}
                                type="password"
                                autoComplete="new-password"
                                value={confirm}
                                onChange={(e) => setConfirm(e.target.value)}
                            />
                        </Field>
                        {confirm && password !== confirm && <p className="text-xs text-fi-loss">Passwords don&apos;t match.</p>}
                        <Button type="submit" variant="primary" disabled={!passwordValid || savingPassword} className="self-start">
                            {savingPassword ? 'Updating…' : 'Update password'}
                        </Button>
                    </form>
                </Card>
            </div>
        </div>
    )
}

export default PersonalSettings
