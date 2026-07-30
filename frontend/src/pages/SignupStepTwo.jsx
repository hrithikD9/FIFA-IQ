import React, { useEffect, useMemo, useState } from 'react'
import { ArrowRight, BarChart3, Bell, Check, LoaderCircle, Search, ShieldCheck, Trophy, Users } from 'lucide-react'
import { useLocation, useNavigate } from 'react-router-dom'
import TeamImage from '../components/TeamImage'
import { fetchTeams, isNationalTeam, toTeamPreference } from '../services/teamApi'
import { supabase } from '../services/supabaseClient'

const SIGNUP_STEP_ONE_STORAGE_KEY = 'fifa-iq.signup.stepOne'
const PENDING_ONBOARDING_STORAGE_KEY = 'fifa-iq.signup.pendingOnboarding'

const competitions = ['FIFA World Cup', 'UEFA Champions League', 'UEFA Europa League', 'Copa America', 'UEFA European Championship']
const insights = [
    { id: 'match_predictions', label: 'Match predictions', icon: BarChart3 },
    { id: 'team_form', label: 'Team form alerts', icon: Trophy },
    { id: 'underdog_insights', label: 'Underdog insights', icon: ShieldCheck },
    { id: 'notification_digest', label: 'Weekly notification digest', icon: Bell },
]
const roles = [
    { id: 'fan', title: 'Fan / Enthusiast', description: 'Follow the teams and competitions that matter to you.', icon: Trophy },
    { id: 'analyst', title: 'Professional Analyst', description: 'Build a focused workspace for advanced performance intelligence.', icon: BarChart3 },
    { id: 'coach', title: 'Coach / Scout', description: 'Track opposition, tactical trends, and player development.', icon: Users },
]

const toggle = (items, item) => items.includes(item) ? items.filter((value) => value !== item) : [...items, item]

const ChoiceChip = ({ active, children, onClick }) => (
    <button type="button" aria-pressed={active} onClick={onClick} className={`flex min-h-11 items-center gap-2 rounded-lg border px-3 py-2 text-left text-sm font-semibold transition-colors ${active ? 'border-emerald-400 bg-emerald-400/10 text-emerald-200' : 'border-slate-700 bg-slate-900/70 text-slate-300 hover:border-slate-500'}`}>
        <span className={`grid size-4 shrink-0 place-items-center rounded border ${active ? 'border-emerald-400 bg-emerald-400 text-slate-950' : 'border-slate-600'}`}>
            {active ? <Check className="size-3" strokeWidth={3} aria-hidden="true" /> : null}
        </span>
        {children}
    </button>
)

const TeamCard = ({ active, onClick, team }) => (
    <button type="button" aria-pressed={active} onClick={onClick} className={`relative flex min-h-20 items-center gap-3 rounded-lg border p-3 text-left transition-colors ${active ? 'border-emerald-400 bg-emerald-400/10 shadow-[0_0_18px_rgba(52,211,153,0.12)]' : 'border-slate-700 bg-slate-900/70 hover:border-slate-500 hover:bg-slate-800'}`}>
        <TeamImage team={team} className="h-9 w-12 rounded object-cover" fallbackClassName="border border-slate-600 bg-slate-800 text-slate-400" />
        <span className="min-w-0">
            <span className="block truncate text-sm font-bold text-white">{team.name}</span>
            <span className="mt-0.5 block truncate text-xs text-slate-400">{team.league || 'Independent'}</span>
        </span>
        {active ? <span className="absolute right-2 top-2 grid size-5 place-items-center rounded-full bg-emerald-400 text-slate-950"><Check className="size-3.5" strokeWidth={3} aria-hidden="true" /></span> : null}
    </button>
)

const SignupStepTwo = () => {
    const navigate = useNavigate()
    const location = useLocation()
    const [step, setStep] = useState(1)
    const [requestedRole, setRequestedRole] = useState('fan')
    const [teams, setTeams] = useState([])
    const [teamSearch, setTeamSearch] = useState('')
    const [selectedClubId, setSelectedClubId] = useState(null)
    const [selectedNationalTeamId, setSelectedNationalTeamId] = useState(null)
    const [selectedCompetitions, setSelectedCompetitions] = useState([])
    const [selectedLeagues, setSelectedLeagues] = useState([])
    const [selectedInsights, setSelectedInsights] = useState(['match_predictions', 'underdog_insights'])
    const [isLoadingTeams, setIsLoadingTeams] = useState(true)
    const [teamsError, setTeamsError] = useState('')
    const [selectionError, setSelectionError] = useState('')
    const [isSubmitting, setIsSubmitting] = useState(false)
    const [submitError, setSubmitError] = useState('')

    const signupData = useMemo(() => {
        if (location.state?.signupData) return location.state.signupData
        try {
            const stored = sessionStorage.getItem(SIGNUP_STEP_ONE_STORAGE_KEY)
            return stored ? JSON.parse(stored) : null
        } catch {
            return null
        }
    }, [location.state])

    useEffect(() => {
        const controller = new AbortController()
        const loadTeams = async () => {
            try {
                const data = await fetchTeams({ signal: controller.signal })
                setTeams(data)
                setTeamsError(data.length ? '' : 'No teams are available yet.')
            } catch (error) {
                if (error.name !== 'AbortError') setTeamsError(error instanceof Error ? error.message : 'Unable to load teams.')
            } finally {
                if (!controller.signal.aborted) setIsLoadingTeams(false)
            }
        }
        loadTeams()
        return () => controller.abort()
    }, [])

    const filteredTeams = useMemo(() => {
        const query = teamSearch.trim().toLowerCase()
        return query ? teams.filter((team) => `${team.name} ${team.league ?? ''}`.toLowerCase().includes(query)) : teams
    }, [teamSearch, teams])
    const nationalTeams = filteredTeams.filter(isNationalTeam)
    const clubTeams = filteredTeams.filter((team) => !isNationalTeam(team))
    const leagueOptions = useMemo(() => [...new Set(teams.map((team) => team.league).filter((league) => league && league !== 'International'))].sort(), [teams])
    const selectedClub = teams.find((team) => String(team.id) === selectedClubId) ?? null
    const selectedNationalTeam = teams.find((team) => String(team.id) === selectedNationalTeamId) ?? null

    const finish = async () => {
        if (!selectedClub && !selectedNationalTeam) {
            setSelectionError('Choose at least one favorite club or national team.')
            return
        }
        if (!signupData?.email) {
            setSubmitError('Your signup details expired. Please start again.')
            return
        }

        setSelectionError('')
        setSubmitError('')
        setIsSubmitting(true)
        const selectedEntities = [
            selectedClub && { type: 'club_team', ...toTeamPreference(selectedClub) },
            selectedNationalTeam && { type: 'national_team', ...toTeamPreference(selectedNationalTeam) },
            ...selectedCompetitions.map((name) => ({ type: 'competition', name })),
            ...selectedLeagues.map((name) => ({ type: 'league', name })),
        ].filter(Boolean)
        const favorites = {
            club_team: selectedClub ? toTeamPreference(selectedClub) : null,
            national_team: selectedNationalTeam ? toTeamPreference(selectedNationalTeam) : null,
            preferred_competitions: selectedCompetitions,
            tracked_leagues: selectedLeagues,
            insight_preferences: selectedInsights,
            nationalTeams: selectedNationalTeam ? [selectedNationalTeam.name.toLowerCase()] : [],
            entities: selectedEntities,
        }
        try {
            const metadata = { full_name: signupData.fullName, requested_role: requestedRole, selected_entities: selectedEntities, favorites, onboarding_completed: true }
            const { data, error: sessionError } = await supabase.auth.getSession()
            if (sessionError) throw sessionError
            const activeUser = data.session?.user

            if (activeUser && (!signupData.userId || activeUser.id === signupData.userId)) {
                const { error: updateError } = await supabase.auth.updateUser({ data: metadata })
                if (updateError) throw updateError
                const { error: signOutError } = await supabase.auth.signOut()
                if (signOutError) throw signOutError
                sessionStorage.removeItem(PENDING_ONBOARDING_STORAGE_KEY)
            } else {
                sessionStorage.setItem(PENDING_ONBOARDING_STORAGE_KEY, JSON.stringify({ email: signupData.email, metadata }))
            }

            sessionStorage.removeItem(SIGNUP_STEP_ONE_STORAGE_KEY)
            localStorage.setItem('fifa-iq.onboarding.favorites', JSON.stringify(favorites))
            navigate('/login', { replace: true, state: { email: signupData.email, message: 'Account created successfully! Please log in.' } })
        } catch (error) {
            console.error('Unable to complete onboarding:', error)
            setSubmitError(error instanceof Error ? error.message : 'Unable to save your profile. Please try again.')
        } finally {
            setIsSubmitting(false)
        }
    }

    return (
        <div className="min-h-screen bg-slate-950 px-4 py-10 text-white sm:px-6">
            <main className="mx-auto w-full max-w-6xl">
                <header className="mb-8 border-b border-slate-800 pb-6">
                    <p className="text-xs font-bold uppercase tracking-[0.24em] text-emerald-400">Profile setup</p>
                    <div className="mt-3 flex flex-col justify-between gap-4 sm:flex-row sm:items-end">
                        <div><h1 className="text-3xl font-black sm:text-4xl">Build your FIFA-IQ feed</h1><p className="mt-2 text-sm leading-6 text-slate-400">Choose your role, teams, competitions, and analysis preferences.</p></div>
                        <span className="text-sm font-bold text-slate-400">Step {step} of 2</span>
                    </div>
                </header>

                {step === 1 ? (
                    <section aria-labelledby="role-heading">
                        <h2 id="role-heading" className="text-xl font-bold">How do you use football intelligence?</h2>
                        <div className="mt-5 grid gap-4 md:grid-cols-3">
                            {roles.map(({ id, title, description, icon: Icon }) => {
                                const active = requestedRole === id
                                return <button key={id} type="button" aria-pressed={active} onClick={() => { setRequestedRole(id); setSelectionError('') }} className={`min-h-52 rounded-lg border p-6 text-left transition-colors ${active ? 'border-emerald-400 bg-emerald-400/10' : 'border-slate-700 bg-slate-900 hover:border-slate-500'}`}>{React.createElement(Icon, { className: active ? 'text-emerald-400' : 'text-slate-400', 'aria-hidden': true })}<h3 className="mt-8 text-lg font-bold">{title}</h3><p className="mt-2 text-sm leading-6 text-slate-400">{description}</p></button>
                            })}
                        </div>
                        <div className="mt-8 flex justify-end"><button type="button" onClick={() => setStep(2)} className="inline-flex min-h-11 items-center gap-2 rounded-lg bg-emerald-400 px-5 font-bold text-slate-950 hover:bg-emerald-300">Continue <ArrowRight className="size-4" aria-hidden="true" /></button></div>
                    </section>
                ) : (
                    <section aria-labelledby="favorites-heading">
                        <div className="flex flex-col justify-between gap-4 md:flex-row md:items-end">
                            <div><h2 id="favorites-heading" className="text-xl font-bold">Personalize your dashboard highlights</h2><p className="mt-2 text-sm text-slate-400">Team selections are loaded from the live FIFA-IQ catalog.</p></div>
                            <label className="relative block w-full md:w-80"><span className="sr-only">Search teams</span><Search className="pointer-events-none absolute left-3 top-1/2 size-4 -translate-y-1/2 text-slate-500" aria-hidden="true" /><input value={teamSearch} onChange={(event) => setTeamSearch(event.target.value)} placeholder="Search teams or leagues" className="h-11 w-full rounded-lg border border-slate-700 bg-slate-900 pl-10 pr-3 text-sm outline-none placeholder:text-slate-500 focus:border-emerald-400" /></label>
                        </div>
                        {isLoadingTeams ? <div className="mt-6 flex min-h-40 items-center justify-center gap-3 border-y border-slate-800 text-sm text-slate-400"><LoaderCircle className="size-5 animate-spin" aria-hidden="true" /> Loading teams...</div> : (
                            <div className="mt-7 grid gap-8 lg:grid-cols-2">
                                <div><h3 className="text-sm font-bold uppercase tracking-widest text-slate-300">Favorite national team</h3><div className="mt-3 grid max-h-72 gap-3 overflow-y-auto pr-1 sm:grid-cols-2">{nationalTeams.map((team) => <TeamCard key={team.id} team={team} active={selectedNationalTeamId === String(team.id)} onClick={() => setSelectedNationalTeamId(selectedNationalTeamId === String(team.id) ? null : String(team.id))} />)}</div>{!nationalTeams.length ? <p className="mt-3 text-sm text-slate-500">No matching national teams.</p> : null}</div>
                                <div><h3 className="text-sm font-bold uppercase tracking-widest text-slate-300">Favorite club</h3><div className="mt-3 grid max-h-72 gap-3 overflow-y-auto pr-1 sm:grid-cols-2">{clubTeams.map((team) => <TeamCard key={team.id} team={team} active={selectedClubId === String(team.id)} onClick={() => setSelectedClubId(selectedClubId === String(team.id) ? null : String(team.id))} />)}</div>{!clubTeams.length ? <p className="mt-3 text-sm text-slate-500">No matching club teams are currently in the catalog.</p> : null}</div>
                            </div>
                        )}
                        {teamsError ? <p className="mt-4 text-sm text-amber-300" role="status">{teamsError}</p> : null}
                        <div className="mt-9 grid gap-8 border-t border-slate-800 pt-8 lg:grid-cols-3">
                            <div><h3 className="text-sm font-bold uppercase tracking-widest text-slate-300">Preferred competitions</h3><div className="mt-3 grid gap-2">{competitions.map((item) => <ChoiceChip key={item} active={selectedCompetitions.includes(item)} onClick={() => setSelectedCompetitions(toggle(selectedCompetitions, item))}>{item}</ChoiceChip>)}</div></div>
                            <div><h3 className="text-sm font-bold uppercase tracking-widest text-slate-300">Tracked leagues</h3><div className="mt-3 grid gap-2">{leagueOptions.map((item) => <ChoiceChip key={item} active={selectedLeagues.includes(item)} onClick={() => setSelectedLeagues(toggle(selectedLeagues, item))}>{item}</ChoiceChip>)}{!leagueOptions.length ? <p className="text-sm leading-6 text-slate-500">League choices appear when clubs are added to the catalog.</p> : null}</div></div>
                            <div><h3 className="text-sm font-bold uppercase tracking-widest text-slate-300">Notifications & insights</h3><div className="mt-3 grid gap-2">{insights.map(({ id, label, icon: Icon }) => <ChoiceChip key={id} active={selectedInsights.includes(id)} onClick={() => setSelectedInsights(toggle(selectedInsights, id))}>{React.createElement(Icon, { className: 'size-4', 'aria-hidden': true })}{label}</ChoiceChip>)}</div></div>
                        </div>
                        {selectionError ? <p className="mt-5 text-sm text-rose-300" role="alert">{selectionError}</p> : null}
                        {submitError ? <p className="mt-5 rounded-lg border border-rose-500/30 bg-rose-500/10 p-3 text-sm text-rose-200" role="alert">{submitError}</p> : null}
                        <div className="mt-8 flex flex-col-reverse gap-3 border-t border-slate-800 pt-6 sm:flex-row sm:justify-between">
                            <button type="button" onClick={() => setStep(1)} disabled={isSubmitting} className="min-h-11 rounded-lg border border-slate-700 px-5 font-bold text-slate-300 hover:border-slate-500 disabled:opacity-50">Back</button>
                            <button type="button" onClick={finish} disabled={isSubmitting || isLoadingTeams} className="inline-flex min-h-11 items-center justify-center gap-2 rounded-lg bg-emerald-400 px-5 font-bold text-slate-950 hover:bg-emerald-300 disabled:cursor-not-allowed disabled:opacity-50">{isSubmitting ? <LoaderCircle className="size-4 animate-spin" aria-hidden="true" /> : null}{isSubmitting ? 'Saving profile...' : 'Complete setup'}</button>
                        </div>
                    </section>
                )}
            </main>
        </div>
    )
}

export default SignupStepTwo