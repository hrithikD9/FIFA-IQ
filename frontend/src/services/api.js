import { supabase } from './supabaseClient'

export const API_BASE_URL = import.meta.env.VITE_API_BASE_URL ?? 'http://localhost:8000/api/v1'

export class ApiError extends Error {
    constructor(message, status, body = null) {
        super(message)
        this.name = 'ApiError'
        this.status = status
        this.body = body
    }
}

let refreshPromise = null

const getAccessToken = async ({ refresh = false } = {}) => {
    if (refresh) {
        refreshPromise ??= supabase.auth.refreshSession().finally(() => {
            refreshPromise = null
        })

        const { data, error } = await refreshPromise
        if (error) throw error
        return data.session?.access_token ?? null
    }

    const { data, error } = await supabase.auth.getSession()

    if (error) throw error
    return data.session?.access_token ?? null
}

const readResponseBody = async (response) => {
    if (response.status === 204) return null
    return response.json().catch(() => null)
}

export const authenticatedFetch = async (path, options = {}) => {
    const { headers: providedHeaders, ...requestOptions } = options
    let token = await getAccessToken()

    if (!token) {
        throw new ApiError('Authentication required', 401)
    }

    const send = (accessToken) => {
        const headers = new Headers(providedHeaders)
        headers.set('Authorization', `Bearer ${accessToken}`)

        if (requestOptions.body != null && !headers.has('Content-Type')) {
            headers.set('Content-Type', 'application/json')
        }

        return fetch(`${API_BASE_URL}${path}`, { ...requestOptions, headers })
    }

    let response = await send(token)

    if (response.status === 401 && !requestOptions.signal?.aborted) {
        token = await getAccessToken({ refresh: true })
        if (token) response = await send(token)
    }

    const body = await readResponseBody(response)

    if (!response.ok) {
        throw new ApiError(body?.detail || `Request failed (${response.status}).`, response.status, body)
    }

    return body
}