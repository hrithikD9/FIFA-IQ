import { useCallback, useEffect, useRef, useState } from 'react'

/**
 * Run an async loader whenever `key` changes, with abort on change/unmount.
 *
 * `loader(signal)` must return a promise. Pass `key = null` to skip loading.
 * Returns { data, error, loading, reload }. During a reload the previous data
 * stays visible while `loading` is true.
 */
export function useApi(key, loader) {
    const loaderRef = useRef(loader)
    const [reloadToken, setReloadToken] = useState(0)
    const [state, setState] = useState({ key: null, token: -1, data: null, error: null })

    useEffect(() => {
        loaderRef.current = loader
    })

    useEffect(() => {
        if (key == null) return undefined
        const controller = new AbortController()

        loaderRef.current(controller.signal).then(
            (data) => {
                if (!controller.signal.aborted) setState({ key, token: reloadToken, data, error: null })
            },
            (error) => {
                if (!controller.signal.aborted) setState({ key, token: reloadToken, data: null, error })
            },
        )

        return () => controller.abort()
    }, [key, reloadToken])

    const reload = useCallback(() => setReloadToken((n) => n + 1), [])

    // Data for a previous key is never shown as current.
    const sameKey = state.key === key
    return {
        data: sameKey ? state.data : null,
        error: sameKey ? state.error : null,
        loading: key != null && (!sameKey || state.token !== reloadToken),
        reload,
    }
}
