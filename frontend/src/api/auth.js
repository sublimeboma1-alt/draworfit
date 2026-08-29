import { apiClient } from './client'

export const register = (payload) => apiClient('/auth/register/', {
  method: 'POST',
  body: JSON.stringify(payload),
})

export async function login(username, password) {
  const tokens = await apiClient('/auth/login/', {
    method: 'POST',
    body: JSON.stringify({ username, password }),
  })
  localStorage.setItem('access_token', tokens.access)
  localStorage.setItem('refresh_token', tokens.refresh)
  return tokens
}

export const getProfile = () => apiClient('/auth/me/')

export function logout() {
  localStorage.removeItem('access_token')
  localStorage.removeItem('refresh_token')
}
