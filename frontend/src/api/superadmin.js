import { apiClient } from './client'

export const adminList = (resource) => apiClient(`/superadmin/${resource}/`)
export const adminCreate = (resource, body) => apiClient(`/superadmin/${resource}/`, { method: 'POST', body })
export const adminUpdate = (resource, id, body) => apiClient(`/superadmin/${resource}/${id}/`, { method: 'PATCH', body })
export const adminDelete = (resource, id) => apiClient(`/superadmin/${resource}/${id}/`, { method: 'DELETE' })
