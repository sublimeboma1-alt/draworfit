import { API_BASE_URL, apiClient } from './client'

export const getLicenses = () => apiClient('/licenses/')

export const activateLicense = (payload) => apiClient('/licenses/activate/', {
  method: 'POST',
  body: JSON.stringify(payload),
})

export const revokeLicenseDevice = (id) => apiClient(`/licenses/${id}/revoke-device/`, {
  method: 'POST',
})

export async function getProtectedDocument(id, installationId) {
  const response = await fetch(`${API_BASE_URL}/licenses/${id}/read/`, {
    headers: {
      Authorization: `Bearer ${localStorage.getItem('access_token')}`,
      'X-Draworfit-Installation-ID': installationId || '',
    },
  })
  if (!response.ok) {
    const data = await response.json().catch(() => null)
    const error = new Error(data?.detail || 'Le document ne peut pas être ouvert.')
    error.status = response.status
    throw error
  }
  return response.blob()
}
