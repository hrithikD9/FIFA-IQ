import React, { useCallback, useMemo, useRef, useState } from 'react'
import { ToastContext } from './toast-context'

// Minimal, dependency-free toast system. Provides a `useToast()` hook exposing
// `push({ type, title, message })` and convenience wrappers. Toasts auto-dismiss
// after a timeout and render in a fixed host at the bottom-right of the screen.

const TOAST_DURATION_MS = 4200

const VARIANT_STYLES = {
    success: {
        accent: 'text-emerald-300',
        bar: 'bg-emerald-400',
        icon: (
            <path strokeLinecap="round" strokeLinejoin="round" d="M9 12.75 11.25 15 15 9.75M21 12a9 9 0 1 1-18 0 9 9 0 0 1 18 0Z" />
        ),
    },
    error: {
        accent: 'text-rose-300',
        bar: 'bg-rose-400',
        icon: (
            <path strokeLinecap="round" strokeLinejoin="round" d="M12 9v3.75m-9.303 3.376c-.866 1.5.217 3.374 1.948 3.374h14.71c1.73 0 2.813-1.874 1.948-3.374L13.949 3.378c-.866-1.5-3.032-1.5-3.898 0L2.697 16.126ZM12 15.75h.007v.008H12v-.008Z" />
        ),
    },
    info: {
        accent: 'text-[#ADC6FF]',
        bar: 'bg-[#ADC6FF]',
        icon: (
            <path strokeLinecap="round" strokeLinejoin="round" d="m11.25 11.25.041-.02a.75.75 0 0 1 1.063.852l-.708 2.836a.75.75 0 0 0 1.063.853l.041-.021M21 12a9 9 0 1 1-18 0 9 9 0 0 1 18 0Zm-9-3.75h.008v.008H12V8.25Z" />
        ),
    },
}

export const ToastProvider = ({ children }) => {
    const [toasts, setToasts] = useState([])
    const idRef = useRef(0)

    const dismiss = useCallback((id) => {
        setToasts((prev) => prev.filter((toast) => toast.id !== id))
    }, [])

    const push = useCallback(
        ({ type = 'info', title, message, duration = TOAST_DURATION_MS }) => {
            idRef.current += 1
            const id = idRef.current

            setToasts((prev) => [...prev, { id, type, title, message }])

            if (duration > 0) {
                window.setTimeout(() => dismiss(id), duration)
            }

            return id
        },
        [dismiss],
    )

    const value = useMemo(
        () => ({
            push,
            dismiss,
            success: (title, message) => push({ type: 'success', title, message }),
            error: (title, message) => push({ type: 'error', title, message }),
            info: (title, message) => push({ type: 'info', title, message }),
        }),
        [push, dismiss],
    )

    return (
        <ToastContext.Provider value={value}>
            {children}
            <div className="pointer-events-none fixed bottom-6 right-6 z-[100] flex w-full max-w-sm flex-col gap-3">
                {toasts.map((toast) => {
                    const variant = VARIANT_STYLES[toast.type] ?? VARIANT_STYLES.info
                    return (
                        <div
                            key={toast.id}
                            role="status"
                            className="pointer-events-auto relative overflow-hidden rounded-2xl border border-[#2B3244] bg-[#171B26] p-4 pr-10 shadow-2xl"
                        >
                            <span className={`absolute inset-y-0 left-0 w-1 ${variant.bar}`} />
                            <div className="flex items-start gap-3">
                                <svg
                                    className={`mt-0.5 size-5 shrink-0 ${variant.accent}`}
                                    xmlns="http://www.w3.org/2000/svg"
                                    fill="none"
                                    viewBox="0 0 24 24"
                                    strokeWidth={1.8}
                                    stroke="currentColor"
                                >
                                    {variant.icon}
                                </svg>
                                <div className="min-w-0">
                                    {toast.title && (
                                        <p className="text-sm font-bold text-white">{toast.title}</p>
                                    )}
                                    {toast.message && (
                                        <p className="mt-0.5 text-sm leading-5 text-[#C2C6D6]">{toast.message}</p>
                                    )}
                                </div>
                            </div>
                            <button
                                type="button"
                                aria-label="Dismiss notification"
                                onClick={() => dismiss(toast.id)}
                                className="absolute right-2 top-2 rounded-md p-1 text-[#8C909F] transition-colors hover:bg-white/5 hover:text-white"
                            >
                                <svg className="size-4" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor">
                                    <path strokeLinecap="round" strokeLinejoin="round" d="M6 18 18 6M6 6l12 12" />
                                </svg>
                            </button>
                        </div>
                    )
                })}
            </div>
        </ToastContext.Provider>
    )
}

