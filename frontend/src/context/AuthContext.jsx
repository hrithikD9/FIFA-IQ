import React, { useEffect, useMemo, useState } from 'react'
import { createClient } from '@supabase/supabase-js'
import { AuthContextObject } from './useAuth'

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY

if (!supabaseUrl || !supabaseAnonKey) {
    throw new Error('Missing Supabase frontend environment variables.')
}

export const supabase = createClient(supabaseUrl, supabaseAnonKey)

const mapAuthUser = (authUser) => {
    if (!authUser) {
        return null
    }

    return {
        id: authUser.id,
        email: authUser.email,
        user_metadata: authUser.user_metadata ?? {},
        app_metadata: authUser.app_metadata ?? {},
    }
}

export const AuthProvider = ({ children }) => {
    const [session, setSession] = useState(null)
    const [user, setUser] = useState(null)
    const [loading, setLoading] = useState(true)

    useEffect(() => {
        let isMounted = true

        const initializeAuth = async () => {
            const { data } = await supabase.auth.getSession()

            if (!isMounted) {
                return
            }

            setSession(data.session ?? null)
            setUser(mapAuthUser(data.session?.user))
            setLoading(false)
        }

        initializeAuth()

        const { data: authListener } = supabase.auth.onAuthStateChange((_event, nextSession) => {
            setSession(nextSession ?? null)
            setUser(mapAuthUser(nextSession?.user))
            setLoading(false)
        })

        return () => {
            isMounted = false
            authListener.subscription.unsubscribe()
        }
    }, [])

    const signUp = async ({ email, password }) => {
        return supabase.auth.signUp({ email, password })
    }

    const signIn = async ({ email, password }) => {
        return await supabase.auth.signInWithPassword({ email, password })
    }

    const signInWithGoogle = async () => {
        const { data, error } = await supabase.auth.signInWithOAuth({
            provider: 'google',
            options: {
                redirectTo: window.location.origin,
            },
        })

        if (error) {
            throw error
        }

        return data
    }

    const signOut = async () => {
        const { error } = await supabase.auth.signOut()

        if (error) {
            throw error
        }
    }

    const value = useMemo(
        () => ({
            supabase,
            session,
            user,
            loading,
            isAuthenticated: Boolean(session?.user),
            signUp,
            signIn,
            signInWithGoogle,
            signOut,
            login: signIn,
            logout: signOut,
        }),
        [loading, session, user],
    )

    return <AuthContextObject.Provider value={value}>{children}</AuthContextObject.Provider>
}
