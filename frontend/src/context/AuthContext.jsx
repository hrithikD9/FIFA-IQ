import React, { useMemo, useState } from 'react'
import { AuthContextObject } from './useAuth'

const AUTH_STORAGE_KEY = 'token'

const getStoredUser = () => {
    const token = localStorage.getItem(AUTH_STORAGE_KEY)

    if (!token) {
        return null
    }

    try {
        return JSON.parse(token)
    } catch {
        localStorage.removeItem(AUTH_STORAGE_KEY)
        return null
    }
}

export const AuthProvider = ({ children }) => {
    const [user, setUser] = useState(() => getStoredUser())
    const [isAuthenticated, setIsAuthenticated] = useState(() => Boolean(localStorage.getItem(AUTH_STORAGE_KEY)))

    const login = (userData) => {
        setIsAuthenticated(true)
        setUser(userData)
        localStorage.setItem(AUTH_STORAGE_KEY, JSON.stringify(userData))
    }

    const logout = () => {
        setIsAuthenticated(false)
        setUser(null)
        localStorage.removeItem(AUTH_STORAGE_KEY)
    }

    const value = useMemo(
        () => ({ isAuthenticated, user, login, logout }),
        [isAuthenticated, user],
    )

    return <AuthContextObject.Provider value={value}>{children}</AuthContextObject.Provider>
}
