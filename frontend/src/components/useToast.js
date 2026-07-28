import { useContext } from 'react'
import { ToastContext } from './toast-context'

// Hook to access the toast API (push/success/error/info/dismiss) from any
// component nested under <ToastProvider>. Kept in a separate file so that
// ToastContext.jsx only exports a component, satisfying React Fast Refresh.
export const useToast = () => {
    const context = useContext(ToastContext)

    if (!context) {
        throw new Error('useToast must be used within a ToastProvider')
    }

    return context
}
