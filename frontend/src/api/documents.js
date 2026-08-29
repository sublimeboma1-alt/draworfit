import { apiClient } from './client'

export const getDocuments = () => apiClient('/documents/')
export const getDocument = (slug) => apiClient(`/documents/${slug}/`)
export const getCategories = () => apiClient('/documents/categories/')
