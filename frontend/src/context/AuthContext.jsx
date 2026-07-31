import React, { useEffect, useMemo, useState } from 'react'
import { AuthContextObject } from './useAuth'
import { supabase } from '../services/supabaseClient'

const mapAuthUser = (authUser) => {
    if (!authUser) {
        return null
    }

    const userMetadata = authUser.user_metadata ?? {}
    const appMetadata = authUser.app_metadata ?? {}

    // Resolve the admin flag across the places Supabase may store it. The
    // canonical source per spec is `user_metadata.is_admin`, with fallbacks to
    // `app_metadata.is_admin` and an explicit `role === 'admin'` claim.
    const isAdmin = Boolean(
        (userMetadata.is_admin ?? appMetadata.is_admin) ||
        userMetadata.role === 'admin' ||
        appMetadata.role === 'admin'
    )

    // Resolve a display name from common metadata keys used across the auth flows.
    const fullName =
        userMetadata.full_name ??
        userMetadata.fullName ??
        userMetadata.name ??
        null

    // Derive a friendly first name with a safe fallback chain:
    // Full Name -> first token -> email username -> 'User'.
    const email = authUser.email ?? null
    const trimmedFullName = typeof fullName === 'string' ? fullName.trim() : ''
    const firstName = trimmedFullName
        ? trimmedFullName.split(' ')[0]
        : email
          ? email.split('@')[0]
          : 'User'

    return {
        id: authUser.id,
        email,
        user_metadata: userMetadata,
        app_metadata: appMetadata,
        fullName,
        name: fullName,
        firstName,
        isAdmin,
        role: isAdmin ? 'admin' : 'user',
        favorites: userMetadata.favorites ?? null,
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

    // Persist full_name into user_metadata at registration so mapAuthUser can
    // derive firstName/fullName across the app without a second write.
    const signUp = async ({ email, password, fullName }) => {
        const result = await supabase.auth.signUp({
            email,
            password,
            options: {
                emailRedirectTo: `${window.location.origin}/login`,
                ...(fullName
                    ? {
                          data: {
                              full_name: fullName,
                          },
                      }
                    : {}),
            },
        })

        if (result.data.session) {
            setSession(result.data.session)
            setUser(mapAuthUser(result.data.session.user))
        }

        return result
    }

    const signIn = async ({ email, password }) => {
        const result = await supabase.auth.signInWithPassword({ email, password })

        if (result.data.session) {
            setSession(result.data.session)
            setUser(mapAuthUser(result.data.session.user))
            setLoading(false)
        }

        return result
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

    // Re-fetch the latest Supabase auth user and push it through mapAuthUser so
    // that any consumers (Navbar, Profile, guards) reflect metadata/profile
    // changes immediately after an updateUser() call, without waiting on the
    // onAuthStateChange round-trip.
    const refreshUser = async () => {
        const { data, error } = await supabase.auth.getUser()

        if (error) {
            throw error
        }

        setUser(mapAuthUser(data.user))
        return mapAuthUser(data.user)
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
            refreshUser,
            login: signIn,
            logout: signOut,
        }),
        [loading, session, user],
    )

    return <AuthContextObject.Provider value={value}>{children}</AuthContextObject.Provider>
}
