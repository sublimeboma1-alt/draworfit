import { apiClient } from './client'

export const createOrder = (documentIds) => apiClient('/sales/orders/', {
  method: 'POST',
  body: JSON.stringify({ document_ids: documentIds }),
})

export const getOrders = () => apiClient('/sales/orders/')
export const getOrder = (id) => apiClient(`/sales/orders/${id}/`)

export const startChariowCheckout = (id, payload) => apiClient(`/sales/orders/${id}/checkout/`, {
  method: 'POST',
  body: JSON.stringify(payload),
})
