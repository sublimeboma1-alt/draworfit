// By default, use the API served by the same deployment. This keeps local
// superadmin accounts separate from production accounts during development.
export const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || `${window.location.origin}/api`

const getAccessToken = () => localStorage.getItem('access_token')
let refreshInFlight = null

function clearAuthentication() {
  localStorage.removeItem('access_token')
  localStorage.removeItem('refresh_token')
  window.dispatchEvent(new Event('draworfit:authentication-expired'))
}

async function refreshAccessToken() {
  if (refreshInFlight) return refreshInFlight
  const refresh = localStorage.getItem('refresh_token')
  if (!refresh) throw new Error('Session expirée.')
  refreshInFlight = fetch(`${API_BASE_URL}/auth/token/refresh/`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ refresh }),
  }).then(async (response) => {
    const data = await response.json().catch(() => ({}))
    if (!response.ok || !data.access) throw new Error('Session expirée.')
    localStorage.setItem('access_token', data.access)
    return data.access
  }).finally(() => { refreshInFlight = null })
  return refreshInFlight
}

export async function apiClient(path, options = {}, retryUnauthenticated = true) {
  const headers = new Headers(options.headers)
  const token = getAccessToken()

  if (token) headers.set('Authorization', `Bearer ${token}`)
  if (options.body && !(options.body instanceof FormData) && !headers.has('Content-Type')) {
    headers.set('Content-Type', 'application/json')
  }

  const response = await fetch(`${API_BASE_URL}${path}`, { ...options, headers })
  const isJson = response.headers.get('content-type')?.includes('application/json')
  const data = isJson ? await response.json() : null

  // Renew access tokens before retrying a protected request. Never repeat a
  // payment request without a valid session.
  const canRefresh = !path.startsWith('/auth/login/') && !path.startsWith('/auth/token/refresh/')
  if (response.status === 401 && token && retryUnauthenticated && canRefresh) {
    try {
      await refreshAccessToken()
      return apiClient(path, options, false)
    } catch {
      clearAuthentication()
    }
  }

  if (!response.ok) {
    const error = new Error(data?.detail || (response.status === 401 ? 'Votre session a expiré. Connectez-vous à nouveau.' : 'Une erreur est survenue.'))
    error.status = response.status
    throw error
  }
  return data
}
