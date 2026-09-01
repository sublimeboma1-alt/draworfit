import { apiClient } from './client'

const cache = new Map()
const cached = (key, fetcher) => {
  const current = cache.get(key)
  if (current && Date.now() - current.createdAt < 60_000) return current.value
  const value = fetcher().catch((error) => { cache.delete(key); throw error })
  cache.set(key, { createdAt: Date.now(), value })
  return value
}

export const getDocuments = () => cached('documents', () => apiClient('/documents/'))
export const getDocument = (slug) => cached(`document:${slug}`, () => apiClient(`/documents/${slug}/`))
export const getCategories = () => cached('categories', () => apiClient('/documents/categories/'))
