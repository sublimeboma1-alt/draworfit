const DATABASE_NAME = 'draworfit-offline-library'
const STORE_NAME = 'documents'

function openDatabase() {
  return new Promise((resolve, reject) => {
    const request = indexedDB.open(DATABASE_NAME, 1)
    request.onupgradeneeded = () => request.result.createObjectStore(STORE_NAME)
    request.onsuccess = () => resolve(request.result)
    request.onerror = () => reject(request.error)
  })
}

async function getRecord(licenseId) {
  const database = await openDatabase()
  return new Promise((resolve, reject) => {
    const transaction = database.transaction(STORE_NAME, 'readonly')
    const request = transaction.objectStore(STORE_NAME).get(String(licenseId))
    request.onsuccess = () => resolve(request.result || null)
    request.onerror = () => reject(request.error)
  })
}

async function putRecord(licenseId, record) {
  const database = await openDatabase()
  return new Promise((resolve, reject) => {
    const transaction = database.transaction(STORE_NAME, 'readwrite')
    transaction.objectStore(STORE_NAME).put(record, String(licenseId))
    transaction.oncomplete = resolve
    transaction.onerror = () => reject(transaction.error)
  })
}

export async function saveOfflineDocument(licenseId, blob, installationId) {
  const key = await crypto.subtle.generateKey({ name: 'AES-GCM', length: 256 }, false, ['encrypt', 'decrypt'])
  const iv = crypto.getRandomValues(new Uint8Array(12))
  const encrypted = await crypto.subtle.encrypt({ name: 'AES-GCM', iv }, key, await blob.arrayBuffer())
  await putRecord(licenseId, { key, iv, encrypted, installationId, type: blob.type || 'application/pdf', savedAt: Date.now() })
}

export async function getOfflineDocument(licenseId, installationId) {
  const record = await getRecord(licenseId)
  if (!record) return null
  if (record.installationId && record.installationId !== installationId) return null
  const bytes = await crypto.subtle.decrypt({ name: 'AES-GCM', iv: record.iv }, record.key, record.encrypted)
  return new Blob([bytes], { type: record.type })
}

export async function removeOfflineDocument(licenseId) {
  const database = await openDatabase()
  return new Promise((resolve, reject) => {
    const transaction = database.transaction(STORE_NAME, 'readwrite')
    transaction.objectStore(STORE_NAME).delete(String(licenseId))
    transaction.oncomplete = resolve
    transaction.onerror = () => reject(transaction.error)
  })
}
