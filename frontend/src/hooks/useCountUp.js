import { useEffect, useState } from 'react'

const prefersReducedMotion = () =>
    typeof window !== 'undefined' && window.matchMedia?.('(prefers-reduced-motion: reduce)').matches

/**
 * Animate a number from 0 to `target` (ease-out). Jumps straight to the target
 * when the user prefers reduced motion. Restarts whenever `target` changes.
 */
export function useCountUp(target, duration = 800) {
    const [value, setValue] = useState(0)

    useEffect(() => {
        if (prefersReducedMotion() || !Number.isFinite(target)) {
            const id = requestAnimationFrame(() => setValue(target))
            return () => cancelAnimationFrame(id)
        }
        let frame
        const start = performance.now()
        const tick = (now) => {
            const t = Math.min(1, (now - start) / duration)
            setValue(target * (1 - (1 - t) ** 3))
            if (t < 1) frame = requestAnimationFrame(tick)
        }
        frame = requestAnimationFrame(tick)
        return () => cancelAnimationFrame(frame)
    }, [target, duration])

    return value
}
