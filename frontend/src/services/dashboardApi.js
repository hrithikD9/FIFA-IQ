import { authenticatedFetch } from './api'

// Dashboard data. Errors propagate as ApiError so pages can show retry states.

export const fetchMyPredictions = (signal) => authenticatedFetch('/predictions/history', { signal })

export const fetchAdminOverview = (signal) => authenticatedFetch('/admin/overview', { signal })

export const fetchAdminUsers = (signal) => authenticatedFetch('/admin/users', { signal })

export const fetchApiUsage = (signal) => authenticatedFetch('/admin/api-usage', { signal })
