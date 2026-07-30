import React, { useMemo, useState } from 'react'
import DashboardSidebar from '../components/dashboard/DashboardSidebar'
import Navbar from '../components/Navbar'
import { useAuth } from '../context/useAuth'
import { useToast } from '../components/useToast'

const tabs = ['Available Models / Predictions', 'Account Binding', 'Security Settings', 'Other Settings']
const modelFilters = ['All Models', 'OpenAI', 'Anthropic', 'Custom ML Models']

const PersonalSettings = () => {
    const { user, supabase, refreshUser } = useAuth()
    const toast = useToast()
    const [activeTab, setActiveTab] = useState(tabs[0])
    const [activeFilter, setActiveFilter] = useState(modelFilters[0])

    // Untouched fields follow live Supabase metadata. Only user edits need local
    // state, so an auth refresh never requires synchronous effect hydration.
    const profileDefaults = useMemo(() => {
        const metadata = user?.user_metadata ?? {}
        return {
            fullName: metadata.full_name ?? metadata.fullName ?? metadata.name ?? '',
            avatarUrl: metadata.avatar_url ?? metadata.avatarUrl ?? '',
            preferredTeam: metadata.preferred_team ?? metadata.preferredTeam ?? '',
            tacticalPreference: metadata.tactical_preference ?? metadata.tacticalPreference ?? '',
        }
    }, [user])
    const [profileEdits, setProfileEdits] = useState({})
    const fullName = profileEdits.fullName ?? profileDefaults.fullName
    const avatarUrl = profileEdits.avatarUrl ?? profileDefaults.avatarUrl
    const preferredTeam = profileEdits.preferredTeam ?? profileDefaults.preferredTeam
    const tacticalPreference = profileEdits.tacticalPreference ?? profileDefaults.tacticalPreference
    const [isSavingProfile, setIsSavingProfile] = useState(false)

    // Password update state.
    const [newPassword, setNewPassword] = useState('')
    const [confirmPassword, setConfirmPassword] = useState('')
    const [isSavingPassword, setIsSavingPassword] = useState(false)

    // Header greeting uses the friendly first name; the editable "Full Name"
    // input below is hydrated separately with the complete fullName value.
    const displayName = user?.firstName || user?.name || user?.fullName || fullName || 'Test User'
    const initials = displayName
        .split(' ')
        .map((part) => part.charAt(0))
        .join('')
        .slice(0, 2)
        .toUpperCase()
    const userId = user?.id || user?.email?.split('@')[0] || 'fiq-user-001'

    // Persist profile metadata via supabase.auth.updateUser and sync AuthContext.
    const handleUpdateProfile = async (event) => {
        event.preventDefault()

        if (isSavingProfile) {
            return
        }

        setIsSavingProfile(true)

        try {
            const { error } = await supabase.auth.updateUser({
                data: {
                    full_name: fullName.trim() || null,
                    avatar_url: avatarUrl.trim() || null,
                    preferred_team: preferredTeam.trim() || null,
                    tactical_preference: tacticalPreference.trim() || null,
                },
            })

            if (error) {
                throw error
            }

            // Reflect changes in Navbar/UI immediately.
            await refreshUser()
            setProfileEdits({})
            toast.success('Profile updated', 'Your profile details were saved successfully.')
        } catch (error) {
            toast.error('Update failed', error?.message || 'Unable to update your profile right now.')
        } finally {
            setIsSavingProfile(false)
        }
    }

    // Persist a new password via supabase.auth.updateUser with validation.
    const handleUpdatePassword = async (event) => {
        event.preventDefault()

        if (isSavingPassword) {
            return
        }

        if (!newPassword || newPassword.length < 6) {
            toast.error('Weak password', 'Password must be at least 6 characters long.')
            return
        }

        if (newPassword !== confirmPassword) {
            toast.error('Passwords do not match', 'Please re-enter the same password in both fields.')
            return
        }

        setIsSavingPassword(true)

        try {
            const { error } = await supabase.auth.updateUser({ password: newPassword })

            if (error) {
                throw error
            }

            await refreshUser()
            setNewPassword('')
            setConfirmPassword('')
            toast.success('Password updated', 'Your password was changed successfully.')
        } catch (error) {
            toast.error('Update failed', error?.message || 'Unable to update your password right now.')
        } finally {
            setIsSavingPassword(false)
        }
    }

    return (
        <div className="flex min-h-screen flex-col bg-[#0b0e14] text-white">
            <Navbar />
            <div className="flex flex-1 overflow-hidden">
                <DashboardSidebar />
                <main className="flex-1 space-y-6 overflow-y-auto p-6">
                    <section className="overflow-hidden rounded-3xl border border-white/5 bg-[#1D2230] shadow-2xl">
                        <div className="bg-linear-to-r from-[#1A2440] via-[#171B26] to-[#271B42] p-6 lg:p-8">
                            <div className="flex flex-col gap-6 lg:flex-row lg:items-center lg:justify-between">
                                <div className="flex items-center gap-5">
                                    {avatarUrl ? (
                                        <img
                                            src={avatarUrl}
                                            alt={displayName}
                                            className="grid size-20 place-items-center rounded-full border border-[#ADC6FF]/30 bg-[#ADC6FF]/10 text-2xl font-black text-[#ADC6FF] shadow-[0_0_50px_rgba(173,198,255,0.16)] object-cover"
                                        />
                                    ) : (
                                        <div className="grid size-20 place-items-center rounded-full border border-[#ADC6FF]/30 bg-[#ADC6FF]/10 text-2xl font-black text-[#ADC6FF] shadow-[0_0_50px_rgba(173,198,255,0.16)]">
                                            {initials}
                                        </div>
                                    )}
                                    <div>
                                        <div className="flex flex-wrap items-center gap-3">
                                            <h1 className="text-3xl font-black text-white">{displayName}</h1>
                                            <span className="rounded-full border border-[#ADC6FF]/30 bg-[#ADC6FF]/10 px-3 py-1 text-xs font-bold uppercase tracking-widest text-[#ADC6FF]">
                                                {user?.role || 'user'}
                                            </span>
                                        </div>
                                        <p className="mt-2 text-sm font-semibold text-[#8C909F]">User ID: {userId}</p>
                                    </div>
                                </div>

                                <div className="grid gap-3 sm:grid-cols-3 lg:min-w-130">
                                    <div className="rounded-2xl border border-[#2B3244] bg-black/20 p-4">
                                        <p className="text-xs font-bold uppercase tracking-[0.18em] text-[#8C909F]">Current Usage / Balance</p>
                                        <p className="mt-2 text-2xl font-black text-white">82%</p>
                                        <p className="text-xs text-[#66708A]">18 credits left</p>
                                    </div>
                                    <div className="rounded-2xl border border-[#2B3244] bg-black/20 p-4">
                                        <p className="text-xs font-bold uppercase tracking-[0.18em] text-[#8C909F]">Simulations / Requests</p>
                                        <p className="mt-2 text-2xl font-black text-white">1,248</p>
                                        <p className="text-xs text-[#66708A]">this season</p>
                                    </div>
                                    <div className="rounded-2xl border border-[#2B3244] bg-black/20 p-4">
                                        <p className="text-xs font-bold uppercase tracking-[0.18em] text-[#8C909F]">Default Group</p>
                                        <p className="mt-2 text-2xl font-black text-white">Analyst</p>
                                        <p className="text-xs text-[#66708A]">workspace access</p>
                                    </div>
                                </div>
                            </div>
                        </div>
                    </section>

                    <section className="rounded-3xl border border-white/5 bg-[#1D2230] p-5">
                        <div className="flex flex-wrap gap-2 border-b border-[#2B3244] pb-4">
                            {tabs.map((tab) => (
                                <button
                                    key={tab}
                                    type="button"
                                    onClick={() => setActiveTab(tab)}
                                    className={`rounded-xl px-4 py-2 text-sm font-bold transition ${
                                        activeTab === tab
                                            ? 'bg-[#ADC6FF]/15 text-[#ADC6FF]'
                                            : 'text-[#8C909F] hover:bg-white/5 hover:text-white'
                                    }`}
                                >
                                    {tab}
                                </button>
                            ))}
                        </div>

                        <div className="mt-6 min-h-72 rounded-2xl border border-[#2B3244] bg-[#171B26] p-5">
                            {activeTab === 'Available Models / Predictions' ? (
                                <div>
                                    <div className="flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
                                        <div>
                                            <h2 className="text-2xl font-black text-white">Available Models / Predictions</h2>
                                            <p className="mt-1 text-sm text-[#8C909F]">Filter prediction engines and AI model providers available to this account.</p>
                                        </div>
                                        <span className="rounded-full bg-[#D0BCFF]/15 px-3 py-1 text-xs font-bold uppercase tracking-widest text-[#D0BCFF]">
                                            12 Active Models
                                        </span>
                                    </div>

                                    <div className="mt-6 flex flex-wrap gap-3">
                                        {modelFilters.map((filter) => (
                                            <button
                                                key={filter}
                                                type="button"
                                                onClick={() => setActiveFilter(filter)}
                                                className={`rounded-full border px-4 py-2 text-sm font-bold transition ${
                                                    activeFilter === filter
                                                        ? 'border-[#ADC6FF]/50 bg-[#ADC6FF]/15 text-[#ADC6FF]'
                                                        : 'border-[#2B3244] bg-[#1C2231] text-[#C2C6D6] hover:border-[#ADC6FF]/40 hover:text-white'
                                                }`}
                                            >
                                                {filter}
                                            </button>
                                        ))}
                                    </div>

                                    <div className="mt-6 grid gap-4 md:grid-cols-2 xl:grid-cols-3">
                                        {['Match Outcome Predictor', 'Player Form Engine', 'Injury Risk Classifier'].map((model) => (
                                            <article key={model} className="rounded-2xl border border-[#2B3244] bg-[#1C2231] p-4">
                                                <p className="text-lg font-bold text-white">{model}</p>
                                                <p className="mt-2 text-sm leading-6 text-[#8C909F]">Optimized for football intelligence workflows and analyst-ready decisions.</p>
                                                <span className="mt-4 inline-flex rounded-full bg-emerald-500/15 px-3 py-1 text-xs font-bold text-emerald-300">Enabled</span>
                                            </article>
                                        ))}
                                    </div>
                                </div>
                            ) : activeTab === 'Security Settings' ? (
                                <div>
                                    <h2 className="text-2xl font-black text-white">Security Settings</h2>
                                    <p className="mt-1 text-sm text-[#8C909F]">Update the password associated with {user?.email || 'your account'}.</p>

                                    <form onSubmit={handleUpdatePassword} className="mt-6 max-w-md space-y-4">
                                        <div>
                                            <label htmlFor="new-password" className="text-xs font-bold uppercase tracking-[0.18em] text-[#8C909F]">New Password</label>
                                            <input
                                                id="new-password"
                                                type="password"
                                                value={newPassword}
                                                onChange={(event) => setNewPassword(event.target.value)}
                                                autoComplete="new-password"
                                                className="mt-2 w-full rounded-xl border border-[#2B3244] bg-[#1C2231] px-4 py-2 text-sm text-white outline-none transition focus:border-[#ADC6FF]/50"
                                                placeholder="Enter a new password"
                                            />
                                        </div>
                                        <div>
                                            <label htmlFor="confirm-password" className="text-xs font-bold uppercase tracking-[0.18em] text-[#8C909F]">Confirm Password</label>
                                            <input
                                                id="confirm-password"
                                                type="password"
                                                value={confirmPassword}
                                                onChange={(event) => setConfirmPassword(event.target.value)}
                                                autoComplete="new-password"
                                                className="mt-2 w-full rounded-xl border border-[#2B3244] bg-[#1C2231] px-4 py-2 text-sm text-white outline-none transition focus:border-[#ADC6FF]/50"
                                                placeholder="Re-enter the new password"
                                            />
                                        </div>
                                        <button
                                            type="submit"
                                            disabled={isSavingPassword}
                                            className="rounded-full px-4 py-2 text-sm font-bold text-[#112443] bg-linear-to-r from-[#ADC6FF] to-[#D0BCFF] transition-all hover:from-[#9AB8FF] hover:to-[#BFA1FF] disabled:opacity-60"
                                        >
                                            {isSavingPassword ? 'Updating…' : 'Update Password'}
                                        </button>
                                    </form>
                                </div>
                            ) : activeTab === 'Other Settings' ? (
                                <div>
                                    <h2 className="text-2xl font-black text-white">Profile Details</h2>
                                    <p className="mt-1 text-sm text-[#8C909F]">These details are stored in your Supabase user metadata and sync across FIFA-IQ.</p>

                                    <form onSubmit={handleUpdateProfile} className="mt-6 max-w-md space-y-4">
                                        <div>
                                            <div className="flex items-center justify-between gap-3">
                                                <label htmlFor="primary-email" className="text-xs font-bold uppercase tracking-[0.18em] text-[#8C909F]">Email Address</label>
                                                <span className="rounded-full border border-[#ADC6FF]/30 bg-[#ADC6FF]/10 px-3 py-1 text-[10px] font-bold uppercase tracking-widest text-[#ADC6FF]">Primary Account Email (Unchangeable)</span>
                                            </div>
                                            <input
                                                id="primary-email"
                                                type="email"
                                                value={user?.email || ''}
                                                readOnly
                                                disabled
                                                aria-readonly="true"
                                                title="Primary Account Email (Unchangeable)"
                                                className="mt-2 w-full cursor-not-allowed rounded-xl border border-[#2B3244] bg-[#1C2231] px-4 py-2 text-sm text-[#8C909F] outline-none opacity-70"
                                            />
                                        </div>
                                        <div>
                                            <label htmlFor="full-name" className="text-xs font-bold uppercase tracking-[0.18em] text-[#8C909F]">Full Name</label>
                                            <input
                                                id="full-name"
                                                type="text"
                                                value={fullName}
                                                onChange={(event) => setProfileEdits((current) => ({ ...current, fullName: event.target.value }))}
                                                className="mt-2 w-full rounded-xl border border-[#2B3244] bg-[#1C2231] px-4 py-2 text-sm text-white outline-none transition focus:border-[#ADC6FF]/50"
                                                placeholder="Your full name"
                                            />
                                        </div>
                                        <div>
                                            <label htmlFor="avatar-url" className="text-xs font-bold uppercase tracking-[0.18em] text-[#8C909F]">Avatar URL</label>
                                            <input
                                                id="avatar-url"
                                                type="url"
                                                value={avatarUrl}
                                                onChange={(event) => setProfileEdits((current) => ({ ...current, avatarUrl: event.target.value }))}
                                                className="mt-2 w-full rounded-xl border border-[#2B3244] bg-[#1C2231] px-4 py-2 text-sm text-white outline-none transition focus:border-[#ADC6FF]/50"
                                                placeholder="https://example.com/avatar.png"
                                            />
                                        </div>
                                        <div>
                                            <label htmlFor="preferred-team" className="text-xs font-bold uppercase tracking-[0.18em] text-[#8C909F]">Preferred Team</label>
                                            <input
                                                id="preferred-team"
                                                type="text"
                                                value={preferredTeam}
                                                onChange={(event) => setProfileEdits((current) => ({ ...current, preferredTeam: event.target.value }))}
                                                className="mt-2 w-full rounded-xl border border-[#2B3244] bg-[#1C2231] px-4 py-2 text-sm text-white outline-none transition focus:border-[#ADC6FF]/50"
                                                placeholder="e.g. Real Madrid"
                                            />
                                        </div>
                                        <div>
                                            <label htmlFor="tactical-preference" className="text-xs font-bold uppercase tracking-[0.18em] text-[#8C909F]">Tactical Preference</label>
                                            <input
                                                id="tactical-preference"
                                                type="text"
                                                value={tacticalPreference}
                                                onChange={(event) => setProfileEdits((current) => ({ ...current, tacticalPreference: event.target.value }))}
                                                className="mt-2 w-full rounded-xl border border-[#2B3244] bg-[#1C2231] px-4 py-2 text-sm text-white outline-none transition focus:border-[#ADC6FF]/50"
                                                placeholder="e.g. High press, 4-3-3"
                                            />
                                        </div>
                                        <button
                                            type="submit"
                                            disabled={isSavingProfile}
                                            className="rounded-full px-4 py-2 text-sm font-bold text-[#112443] bg-linear-to-r from-[#ADC6FF] to-[#D0BCFF] transition-all hover:from-[#9AB8FF] hover:to-[#BFA1FF] disabled:opacity-60"
                                        >
                                            {isSavingProfile ? 'Saving…' : 'Save Profile'}
                                        </button>
                                    </form>
                                </div>
                            ) : (
                                <div className="grid h-56 place-items-center text-center">
                                    <div>
                                        <p className="text-xl font-bold text-white">{activeTab}</p>
                                        <p className="mt-2 text-sm text-[#8C909F]">Settings for this section are currently read-only.</p>
                                    </div>
                                </div>
                            )}
                        </div>
                    </section>
                </main>
            </div>
        </div>
    )
}

export default PersonalSettings
