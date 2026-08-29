const INSTALLATION_ID_KEY = 'draworfit_installation_id'
const PRIVATE_KEY_KEY = 'draworfit_device_private_key'

export function getInstallationId() {
  return localStorage.getItem(INSTALLATION_ID_KEY)
}

function toBase64(buffer) {
  const bytes = new Uint8Array(buffer)
  let binary = ''
  bytes.forEach((byte) => { binary += String.fromCharCode(byte) })
  return btoa(binary)
}

export async function getDeviceIdentity() {
  let installationId = localStorage.getItem(INSTALLATION_ID_KEY)
  if (!installationId) {
    installationId = crypto.randomUUID()
    localStorage.setItem(INSTALLATION_ID_KEY, installationId)
  }

  const keyPair = await crypto.subtle.generateKey(
    { name: 'RSA-OAEP', modulusLength: 2048, publicExponent: new Uint8Array([1, 0, 1]), hash: 'SHA-256' },
    true,
    ['encrypt', 'decrypt'],
  )
  const publicKey = toBase64(await crypto.subtle.exportKey('spki', keyPair.publicKey))
  const privateKey = await crypto.subtle.exportKey('jwk', keyPair.privateKey)
  localStorage.setItem(PRIVATE_KEY_KEY, JSON.stringify(privateKey))

  return {
    installation_id: installationId,
    name: navigator.userAgent.includes('Mobile') ? 'Téléphone actuel' : 'Ordinateur actuel',
    platform: navigator.platform || 'Web',
    public_key: publicKey,
  }
}
