const DEFAULT_API_BASE = import.meta.env.PROD
  ? 'https://test.connecto-me.com/ai-gateway'
  : '/api'
const API_BASE = (import.meta.env.VITE_API_BASE || DEFAULT_API_BASE).replace(/\/$/, '')
const TOKEN_STORAGE_KEY = 'connecto.gateway.access-token.v1'
const pendingReads = new Map()
let cachedToken

export function getApiBase() {
  return API_BASE
}

export function getAccessToken() {
  if (cachedToken !== undefined) return cachedToken
  try {
    cachedToken = sessionStorage.getItem(TOKEN_STORAGE_KEY) || ''
  } catch {
    cachedToken = ''
  }
  return cachedToken
}

export function setAccessToken(token) {
  cachedToken = token.trim()
  try {
    if (cachedToken) sessionStorage.setItem(TOKEN_STORAGE_KEY, cachedToken)
    else sessionStorage.removeItem(TOKEN_STORAGE_KEY)
  } catch {
    // In-memory authentication still works when storage is unavailable.
  }
}

export async function api(path, options = {}) {
  const { headers, timeout = 30_000, ...requestOptions } = options
  const token = getAccessToken()
  const method = (requestOptions.method || 'GET').toUpperCase()
  const requestKey = method === 'GET' ? `${token}:${path}` : ''
  if (requestKey && pendingReads.has(requestKey)) {
    return pendingReads.get(requestKey)
  }

  const request = async () => {
    const controller = new AbortController()
    const timeoutID = window.setTimeout(() => controller.abort(), timeout)
    try {
      const response = await fetch(`${API_BASE}${path}`, {
        ...requestOptions,
        signal: requestOptions.signal || controller.signal,
        cache: 'no-store',
        headers: {
          Accept: 'application/json',
          'Content-Type': 'application/json',
          ...(token ? { Authorization: `Bearer ${token}` } : {}),
          ...headers,
        },
      })
      const body = await response.text()
      let data = body
      try {
        data = body ? JSON.parse(body) : null
      } catch {
        // Preserve non-JSON upstream responses for diagnostics.
      }
      if (!response.ok) {
        const apiError = typeof data === 'object' ? data?.error : null
        const message = typeof apiError === 'string'
          ? apiError
          : apiError?.message || body || `Request failed (${response.status})`
        const error = new Error(message)
        error.status = response.status
        throw error
      }
      return data
    } catch (error) {
      if (error.name === 'AbortError') throw new Error('The gateway request timed out.')
      throw error
    } finally {
      window.clearTimeout(timeoutID)
    }
  }

  const promise = request()
  if (requestKey) pendingReads.set(requestKey, promise)
  try {
    return await promise
  } finally {
    if (requestKey) pendingReads.delete(requestKey)
  }
}

export const endpoint = {
  accounts: '/admin/v1/accounts',
  providers: '/admin/v1/providers',
  keys: '/admin/v1/keys',
  models: '/admin/v1/models',
  routes: '/admin/v1/routes',
  health: '/healthz',
  readiness: '/readyz',
  inference: '/v1/inference',
}
