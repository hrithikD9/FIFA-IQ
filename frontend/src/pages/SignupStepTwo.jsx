import React, { useEffect, useMemo, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import {
    ChevronLeft,
    Check,
    Plus,
    Search,
    Trophy,
    Users,
    Rocket,
} from 'lucide-react'
import { SIGNUP_ROLES } from '../constants/userRoles'

const MAX_SELECTIONS = 3
const SIGNUP_STEP_ONE_STORAGE_KEY = 'fifa-iq.signup.stepOne'

const nationalTeams = [
    { id: 'france', name: 'France' },
    { id: 'argentina', name: 'Argentina' },
    { id: 'brazil', name: 'Brazil' },
    { id: 'germany', name: 'Germany' },
    { id: 'england', name: 'England' },
    { id: 'portugal', name: 'Portugal' },
]

const highlightsByTeam = {
    france: [
        { id: 'france-intl', name: 'France (International)', category: 'NATION', entityKey: 'nation-france' },
        { id: 'ligue-1', name: 'Ligue 1', category: 'LEAGUE', entityKey: 'league-ligue-1' },
        { id: 'mbappe', name: 'Kylian Mbappe', category: 'PLAYER', entityKey: 'player-mbappe' },
    ],
    argentina: [
        { id: 'argentina-intl', name: 'Argentina (International)', category: 'NATION', entityKey: 'nation-argentina' },
        { id: 'primera-division', name: 'Primera Division', category: 'LEAGUE', entityKey: 'league-primera-division' },
        { id: 'messi', name: 'Lionel Messi', category: 'PLAYER', entityKey: 'player-messi' },
    ],
    brazil: [
        { id: 'brazil-intl', name: 'Brazil (International)', category: 'NATION', entityKey: 'nation-brazil' },
        { id: 'serie-a-br', name: 'Serie A Brasil', category: 'LEAGUE', entityKey: 'league-brasileirao' },
        { id: 'vinicius', name: 'Vinicius Junior', category: 'PLAYER', entityKey: 'player-vinicius-jr' },
    ],
    germany: [
        { id: 'germany-intl', name: 'Germany (International)', category: 'NATION', entityKey: 'nation-germany' },
        { id: 'bundesliga', name: 'Bundesliga', category: 'LEAGUE', entityKey: 'league-bundesliga' },
        { id: 'musiala', name: 'Jamal Musiala', category: 'PLAYER', entityKey: 'player-musiala' },
    ],
    england: [
        { id: 'england-intl', name: 'England (International)', category: 'NATION', entityKey: 'nation-england' },
        { id: 'premier-league', name: 'Premier League', category: 'LEAGUE', entityKey: 'league-premier-league' },
        { id: 'bellingham', name: 'Jude Bellingham', category: 'PLAYER', entityKey: 'player-bellingham' },
    ],
    portugal: [
        { id: 'portugal-intl', name: 'Portugal (International)', category: 'NATION', entityKey: 'nation-portugal' },
        { id: 'primeira-liga', name: 'Primeira Liga', category: 'LEAGUE', entityKey: 'league-primeira-liga' },
        { id: 'ronaldo', name: 'Cristiano Ronaldo', category: 'PLAYER', entityKey: 'player-ronaldo' },
    ],
}

const SignupStepTwo = () => {
    const navigate = useNavigate()
    const [selectedTeams, setSelectedTeams] = useState(['france'])
    const [query, setQuery] = useState('')
    const [followedEntities, setFollowedEntities] = useState(new Set())
    const [requestedRole, setRequestedRole] = useState('public')
    const [selectionError, setSelectionError] = useState('')
    const [isLoading, setIsLoading] = useState(false)
    const [error, setError] = useState('')

    const totalSelections = selectedTeams.length + followedEntities.size
    const canAddMore = totalSelections < MAX_SELECTIONS
    const selectedFavoriteIds = useMemo(
        () => [...selectedTeams, ...Array.from(followedEntities)].slice(0, MAX_SELECTIONS),
        [followedEntities, selectedTeams],
    )

    useEffect(() => {
        const storedStepOne = sessionStorage.getItem(SIGNUP_STEP_ONE_STORAGE_KEY)

        if (!storedStepOne) {
            navigate('/signup', { replace: true })
            return
        }

        try {
            const stepOneData = JSON.parse(storedStepOne)

            if (!stepOneData?.email) {
                sessionStorage.removeItem(SIGNUP_STEP_ONE_STORAGE_KEY)
                navigate('/signup', { replace: true })
            }
        } catch {
            sessionStorage.removeItem(SIGNUP_STEP_ONE_STORAGE_KEY)
            navigate('/signup', { replace: true })
        }
    }, [navigate])

    const trendingHighlights = useMemo(() => {
        const sourceTeams = selectedTeams.length > 0 ? selectedTeams : ['france', 'argentina']
        const merged = sourceTeams.flatMap((teamId) => highlightsByTeam[teamId] ?? [])
        const unique = Array.from(new Map(merged.map((item) => [item.id, item])).values())

        const normalized = query.trim().toLowerCase()
        if (!normalized) {
            return unique
        }

        return unique.filter((item) => {
            const haystack = `${item.name} ${item.category}`.toLowerCase()
            return haystack.includes(normalized)
        })
    }, [query, selectedTeams])

    const toggleTeam = (teamId) => {
        const isSelected = selectedTeams.includes(teamId)

        if (isSelected) {
            setSelectedTeams((prev) => prev.filter((id) => id !== teamId))
            setSelectionError('')
            return
        }

        if (!canAddMore) {
            setSelectionError(`You can select up to ${MAX_SELECTIONS} favorites during setup.`)
            return
        }

        setSelectedTeams((prev) => [...prev, teamId])
        setSelectionError('')
    }

    const toggleFollowEntity = (entityKey) => {
        const next = new Set(followedEntities)

        if (next.has(entityKey)) {
            next.delete(entityKey)
            setFollowedEntities(next)
            setSelectionError('')
            return
        }

        if (!canAddMore) {
            setSelectionError(`You can select up to ${MAX_SELECTIONS} favorites during setup.`)
            return
        }

        next.add(entityKey)
        setFollowedEntities(next)
        setSelectionError('')
    }

    const handleCompleteSetup = () => {
        if (isLoading) {
            return
        }

        if (totalSelections === 0 || totalSelections > MAX_SELECTIONS) {
            setSelectionError(`Choose between 1 and ${MAX_SELECTIONS} favorites to continue.`)
            return
        }

        const storedStepOne = sessionStorage.getItem(SIGNUP_STEP_ONE_STORAGE_KEY)

        if (!storedStepOne) {
            setSelectionError('Signup session expired. Please complete step 1 again.')
            navigate('/signup')
            return
        }

        let stepOneCredentials

        try {
            stepOneCredentials = JSON.parse(storedStepOne)
        } catch {
            sessionStorage.removeItem(SIGNUP_STEP_ONE_STORAGE_KEY)
            setSelectionError('Signup session could not be restored. Please complete step 1 again.')
            navigate('/signup')
            return
        }

        const completedSignupPayload = {
            ...stepOneCredentials,
            requestedRole,
            selectedEntities: selectedFavoriteIds,
            favorites: {
                nationalTeams: selectedFavoriteIds.filter((id) => selectedTeams.includes(id)),
                entities: selectedFavoriteIds.filter((id) => followedEntities.has(id)),
            },
        }

        setIsLoading(true)
        setError('')

        setTimeout(() => {
            // TODO: Send completedSignupPayload to the registration API when the backend is available.
            void completedSignupPayload
            sessionStorage.removeItem(SIGNUP_STEP_ONE_STORAGE_KEY)
            localStorage.setItem('fifa-iq.onboarding.favorites', JSON.stringify(completedSignupPayload.favorites))
            setIsLoading(false)

            navigate('/login', {
                state: {
                    message: 'Account setup complete! Please log in.',
                    fullName: stepOneCredentials.fullName,
                    email: stepOneCredentials.email,
                    role: stepOneCredentials.role,
                    requestedRole,
                    favorites: {
                        selectedEntities: selectedFavoriteIds,
                        nationalTeams: selectedFavoriteIds.filter((id) => selectedTeams.includes(id)),
                        entities: selectedFavoriteIds.filter((id) => followedEntities.has(id)),
                    },
                },
            })
        }, 1500)
    }

    return (
        <div className="min-h-screen bg-[#171B26] text-white px-4 py-5 sm:px-8">
            <main className="relative mx-auto w-full max-w-7xl min-h-[calc(100vh-2.5rem)] rounded-3xl border border-white/5 bg-linear-to-b from-[#1C2230] to-[#171B26] shadow-2xl overflow-hidden px-6 py-7 sm:px-8 lg:px-10 lg:py-8">
                <div className="absolute -bottom-8 left-0 right-0 pointer-events-none select-none text-center text-[72px] sm:text-[120px] lg:text-[170px] font-black leading-none tracking-[-0.04em] text-[#8A7AF6]/6">
                    UNRIVALED INSIGHT
                </div>

                <section className="relative z-10">
                    <div className="flex flex-col gap-6 sm:flex-row sm:items-start sm:justify-between">
                        <div className="space-y-2 max-w-2xl">
                            <p className="text-[11px] font-bold tracking-[0.2em] uppercase text-[#8A90A8]">
                                Step 2 of 2: Tailor your experience
                            </p>
                            <h1 className="text-4xl md:text-5xl font-black tracking-tight text-[#E9ECF8]">
                                Curate Your Feed
                            </h1>
                            <p className="text-[#AAB0C5] max-w-xl text-base leading-7">
                                Select up to {MAX_SELECTIONS} favorites to receive real-time tactical insights and personalized analytical defaults. Selected: {totalSelections}/{MAX_SELECTIONS}.
                            </p>
                        </div>

                        <div className="self-start rounded-full border border-[#2D3346] bg-[#202637]/80 px-4 py-2.5 min-w-45">
                            <div className="flex items-center gap-2 text-xs font-semibold text-[#9FB5FF]">
                                <span className="size-2 rounded-full bg-[#ADC6FF]" />
                                <div className="h-1.5 flex-1 rounded-full bg-[#2C3448] overflow-hidden">
                                    <span className="block h-full w-1/2 bg-linear-to-r from-[#ADC6FF] to-[#D0BCFF]" />
                                </div>
                                50% Complete
                            </div>
                        </div>
                    </div>

                    <div className="mt-10 grid grid-cols-1 gap-6 xl:grid-cols-[1.45fr_1fr]">
                        <section className="space-y-4">
                            <div className="flex items-center justify-between gap-2 text-[#D5DBEF]">
                                <div className="flex items-center gap-2">
                                    <Trophy className="size-4.5" />
                                    <h2 className="text-2xl font-semibold tracking-tight">National Teams</h2>
                                </div>
                                <p className="text-xs text-[#8FA3DB] font-semibold">
                                    Selected: {totalSelections}/{MAX_SELECTIONS}
                                </p>
                            </div>

                            <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
                                {nationalTeams.map((team) => {
                                    const active = selectedTeams.includes(team.id)
                                    const disabled = !active && !canAddMore
                                    return (
                                        <button
                                            key={team.id}
                                            type="button"
                                            onClick={() => toggleTeam(team.id)}
                                            disabled={disabled}
                                            className={`relative rounded-2xl border p-4 sm:p-5 min-h-32.5 text-left transition-colors ${
                                                active
                                                    ? 'border-[#7B91D8] bg-[#252B3D]'
                                                    : 'border-[#2B3244] bg-[#1C2231] hover:border-[#45506D]'
                                            } ${disabled ? 'opacity-50 cursor-not-allowed' : ''}`}
                                        >
                                            <div className="mb-6 inline-flex size-11 items-center justify-center rounded-xl bg-black" aria-hidden="true" />
                                            <p className="text-sm font-semibold text-[#DCE2F5]">{team.name}</p>
                                            {active && (
                                                <span className="absolute right-3 top-3 inline-flex size-4 items-center justify-center rounded-full bg-[#AFC4FF] text-[#112443]">
                                                    <Check className="size-3" strokeWidth={3} />
                                                </span>
                                            )}
                                        </button>
                                    )
                                })}

                                <button
                                    type="button"
                                    className="rounded-2xl border border-dashed border-[#3B4258] bg-[#1A202D] p-4 sm:p-5 min-h-32.5 flex flex-col items-center justify-center gap-1 text-center text-[#707A94] hover:border-[#5A657F] transition-colors"
                                >
                                    <Plus className="size-5" />
                                    <span className="text-sm font-medium">Browse More</span>
                                </button>
                            </div>
                        </section>

                        <section className="rounded-2xl border border-[#2B3244] bg-[#1E2433]/90 p-4 sm:p-5">
                            <div className="flex items-center gap-2 text-[#D5DBEF] mb-4">
                                <Users className="size-4.5" />
                                <h2 className="text-2xl font-semibold tracking-tight">Follow Entities</h2>
                            </div>

                            <label htmlFor="entity-search" className="relative block mb-4">
                                <Search className="size-4.5 absolute left-4 top-1/2 -translate-y-1/2 text-[#707A94]" />
                                <input
                                    id="entity-search"
                                    type="text"
                                    placeholder="Search clubs, nations, or players..."
                                    value={query}
                                    onChange={(e) => setQuery(e.target.value)}
                                    className="w-full rounded-xl border border-[#31384C] bg-[#262C3B] pl-11 pr-4 py-3 text-sm text-[#E7EAFA] placeholder:text-[#7B839A] outline-none focus:border-[#7D91CC]"
                                />
                            </label>

                            <div className="rounded-xl border border-[#2D3448] bg-[#202737] overflow-hidden">
                                <div className="flex items-center justify-between px-4 py-3 border-b border-[#2D3448]">
                                    <p className="text-[10px] tracking-[0.18em] uppercase font-bold text-[#7A849F]">
                                        Trending Highlights
                                    </p>
                                    <span className="size-1.5 rounded-full bg-[#ADC6FF]" />
                                </div>

                                <div className="p-2 space-y-1.5">
                                    {trendingHighlights.map((item) => {
                                        const isFollowing = followedEntities.has(item.entityKey)
                                        const disabled = !isFollowing && !canAddMore
                                        return (
                                            <div
                                                key={item.id}
                                                className={`flex items-center justify-between rounded-xl px-3 py-2.5 transition-colors ${
                                                    isFollowing ? 'bg-[#2B3244]' : 'bg-transparent hover:bg-[#262D3E]'
                                                }`}
                                            >
                                                <div className="flex items-center gap-3 min-w-0">
                                                    <span className="inline-flex size-9 items-center justify-center rounded-lg bg-[#2C3447] text-[10px] font-black text-[#BFC9EE]">
                                                        {item.name.slice(0, 2).toUpperCase()}
                                                    </span>
                                                    <div className="min-w-0">
                                                        <p className="text-sm font-semibold text-[#DFE5FA] truncate">{item.name}</p>
                                                        <p className="text-[10px] tracking-[0.15em] uppercase text-[#7B839A] truncate">
                                                            {item.category}
                                                        </p>
                                                    </div>
                                                </div>

                                                <button
                                                    type="button"
                                                    disabled={disabled}
                                                    onClick={() => toggleFollowEntity(item.entityKey)}
                                                    className={`inline-flex items-center gap-1 rounded-full px-3 py-1.5 text-xs font-semibold transition-colors ${
                                                        isFollowing
                                                            ? 'bg-[#324262] text-[#C9D8FF] border border-[#5E75AD]'
                                                            : 'bg-[#2A3247] text-[#B7C3E7] hover:bg-[#33405D]'
                                                    } ${disabled ? 'opacity-50 cursor-not-allowed' : ''}`}
                                                >
                                                    {isFollowing && <Check className="size-3.5" />}
                                                    {isFollowing ? 'Following' : 'Follow'}
                                                </button>
                                            </div>
                                        )
                                    })}

                                    {trendingHighlights.length === 0 && (
                                        <div className="rounded-lg border border-dashed border-[#3A425A] px-4 py-6 text-center text-sm text-[#7F88A1]">
                                            No entities match your search.
                                        </div>
                                    )}
                                </div>
                            </div>
                        </section>
                    </div>

                    <section className="mt-6 rounded-2xl border border-[#2B3244] bg-[#1E2433]/90 p-4 sm:p-5">
                        <div className="flex items-center justify-between gap-3 mb-4">
                            <div>
                                <h2 className="text-2xl font-semibold tracking-tight text-[#D5DBEF]">
                                    Requested Role
                                </h2>
                                <p className="text-sm text-[#8A90A8] mt-1">
                                    Choose the access level you want to request for your account.
                                </p>
                            </div>
                            <span className="rounded-full border border-[#2D3346] bg-[#202637]/80 px-3 py-1 text-[10px] font-bold tracking-[0.18em] uppercase text-[#9FB5FF]">
                                Default: Public
                            </span>
                        </div>

                        <div className="grid grid-cols-1 gap-3 md:grid-cols-3">
                            {SIGNUP_ROLES.map((role) => {
                                const active = requestedRole === role.id

                                return (
                                    <button
                                        key={role.id}
                                        type="button"
                                        onClick={() => setRequestedRole(role.id)}
                                        className={`rounded-2xl border p-4 text-left transition-colors ${
                                            active
                                                ? 'border-[#7B91D8] bg-[#252B3D]'
                                                : 'border-[#2B3244] bg-[#1C2231] hover:border-[#45506D]'
                                        }`}
                                    >
                                        <div className="flex items-center justify-between gap-2 mb-3">
                                            <p className="text-sm font-semibold text-[#DCE2F5]">
                                                {role.label}
                                            </p>
                                            {active && (
                                                <span className="inline-flex size-5 items-center justify-center rounded-full bg-[#AFC4FF] text-[#112443]">
                                                    <Check className="size-3" strokeWidth={3} />
                                                </span>
                                            )}
                                        </div>
                                        <p className="text-sm leading-6 text-[#AAB0C5]">
                                            {role.summary}
                                        </p>
                                    </button>
                                )
                            })}
                        </div>
                    </section>

                    {selectionError && (
                        <p className="mt-4 text-sm text-rose-300">{selectionError}</p>
                    )}

                    {error && (
                        <p className="mt-4 rounded-xl border border-rose-500/30 bg-rose-500/10 px-4 py-3 text-sm text-rose-200">
                            {error}
                        </p>
                    )}

                    <footer className="mt-10 flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
                        <button
                            type="button"
                            onClick={() => navigate('/signup')}
                            className="inline-flex items-center gap-2 text-[#C8CDE0] hover:text-white transition-colors"
                        >
                            <ChevronLeft className="size-4.5" />
                            Back
                        </button>

                        <div className="flex flex-col items-start gap-3 sm:flex-row sm:items-center">
                            <p className="text-[10px] tracking-[0.2em] uppercase font-bold text-[#66708A]">
                                Setup finalizing...
                            </p>
                            <button
                                type="button"
                                disabled={isLoading || totalSelections === 0 || totalSelections > MAX_SELECTIONS}
                                onClick={handleCompleteSetup}
                                className="inline-flex items-center gap-2 rounded-full px-5 py-2.5 bg-linear-to-r from-[#ADC6FF] to-[#D0BCFF] text-[#112443] font-bold hover:from-[#9AB8FF] hover:to-[#BFA1FF] transition-all disabled:opacity-50 disabled:cursor-not-allowed"
                            >
                                {isLoading ? (
                                    <>
                                        <svg
                                            className="size-4 animate-spin"
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
                                        Completing...
                                    </>
                                ) : (
                                    <>
                                        Complete Setup
                                        <Rocket className="size-4" />
                                    </>
                                )}
                            </button>
                        </div>
                    </footer>
                </section>
            </main>
        </div>
    )
}

export default SignupStepTwo
