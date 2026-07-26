import { createContext, useContext } from 'react'

export const AuthContextObject = createContext(null)

export const useAuth = () => {
    const context = useContext(AuthContextObject)

    if (!context) {
        throw new Error('useAuth must be used within an AuthProvider')
    }

    return context
}