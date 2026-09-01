export const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || 'https://draworfit-production.up.railway.app/api'

const getAccessToken = () => localStorage.getItem('access_token')

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

  // An expired token should not prevent public endpoints from loading.
  if (response.status === 401 && token && retryUnauthenticated) {
    localStorage.removeItem('access_token')
    localStorage.removeItem('refresh_token')
    return apiClient(path, options, false)
  }

  if (!response.ok) {
    throw new Error(data?.detail || 'Une erreur est survenue.')
  }
  return data
}
