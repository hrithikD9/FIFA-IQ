import { createContext } from 'react'

// Dedicated module that owns the ToastContext object. Kept separate from the
// provider component (ToastContext.jsx) and the consumer hook (useToast.js) so
// that no component file exports a non-component value — satisfying React Fast
// Refresh's `only-export-components` constraint.
export const ToastContext = createContext(null)
