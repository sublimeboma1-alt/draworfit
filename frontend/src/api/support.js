import { apiClient } from './client'

export const getSupportConversation = () => apiClient('/support/')
export const sendSupportMessage = (content) => apiClient('/support/messages/', { method: 'POST', body: JSON.stringify({ content }) })
export const getSupportConversations = () => apiClient('/superadmin/support/conversations/')
export const replyToSupportConversation = (id, content) => apiClient(`/superadmin/support/conversations/${id}/reply/`, { method: 'POST', body: JSON.stringify({ content }) })
export const closeSupportConversation = (id) => apiClient(`/superadmin/support/conversations/${id}/close/`, { method: 'POST' })
