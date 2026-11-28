import { useEffect, useRef, useState } from 'react'

/**
 * True once the element has come within `rootMargin` of the viewport. Stays
 * true afterwards, so content mounted on first view is never unmounted.
 */
export function useInView(rootMargin = '200px') {
    const ref = useRef(null)
    const [inView, setInView] = useState(false)

    useEffect(() => {
        const el = ref.current
        if (!el || inView) return undefined
        if (typeof IntersectionObserver === 'undefined') {
            const id = requestAnimationFrame(() => setInView(true))
            return () => cancelAnimationFrame(id)
        }
        const observer = new IntersectionObserver(
            ([entry]) => {
                if (entry.isIntersecting) {
                    setInView(true)
                    observer.disconnect()
                }
            },
            { rootMargin },
        )
        observer.observe(el)
        return () => observer.disconnect()
    }, [inView, rootMargin])

    return [ref, inView]
}
