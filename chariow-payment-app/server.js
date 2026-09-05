import { createHmac, timingSafeEqual } from 'node:crypto'
import { createReadStream, existsSync } from 'node:fs'
import { createServer } from 'node:http'
import { extname, join } from 'node:path'

const port = Number(process.env.PORT || 3000)
const publicDir = join(import.meta.dirname, 'public')
const processedDeliveries = new Set()
const json = (res, status, value) => { res.writeHead(status, { 'Content-Type': 'application/json; charset=utf-8' }); res.end(JSON.stringify(value)) }
const readBody = (req, limit = 100_000) => new Promise((resolve, reject) => {
  const chunks = []; let size = 0
  req.on('data', (chunk) => { size += chunk.length; if (size > limit) { reject(new Error('Payload too large')); req.destroy() } else chunks.push(chunk) })
  req.on('end', () => resolve(Buffer.concat(chunks)))
  req.on('error', reject)
})
const publicUrl = (req) => process.env.APP_URL || `${req.headers['x-forwarded-proto'] || 'http'}://${req.headers.host}`

async function checkout(req, res) {
  if (!process.env.CHARIOW_API_KEY) return json(res, 503, { error: 'CHARIOW_API_KEY est manquante sur le serveur.' })
  let input
  try { input = JSON.parse((await readBody(req)).toString()) } catch { return json(res, 400, { error: 'Données de paiement invalides.' }) }
  const required = ['product_id', 'email', 'first_name', 'last_name', 'phone_number', 'country_code']
  if (required.some((field) => !String(input[field] || '').trim())) return json(res, 422, { error: 'Tous les champs obligatoires doivent être renseignés.' })
  const payload = { product_id: input.product_id.trim(), email: input.email.trim(), first_name: input.first_name.trim(), last_name: input.last_name.trim(), phone: { number: input.phone_number.replace(/\D/g, ''), country_code: input.country_code.toUpperCase() }, redirect_url: `${publicUrl(req)}/bibliotheque?sale={sale_id}`, customer_ip: (req.headers['x-forwarded-for'] || req.socket.remoteAddress || '').split(',')[0].trim() }
  if (input.discount_code?.trim()) payload.discount_code = input.discount_code.trim()
  try {
    const response = await fetch('https://api.chariow.com/v1/checkout', { method: 'POST', headers: { Authorization: `Bearer ${process.env.CHARIOW_API_KEY}`, 'Content-Type': 'application/json' }, body: JSON.stringify(payload), signal: AbortSignal.timeout(20_000) })
    const result = await response.json().catch(() => ({}))
    if (!response.ok) return json(res, response.status, { error: result.message || 'Le paiement ne peut pas être initialisé.', details: result.errors || {} })
    return json(res, 200, result.data)
  } catch { return json(res, 502, { error: 'Chariow est momentanément inaccessible. Réessayez.' }) }
}

async function webhook(req, res) {
  const raw = await readBody(req)
  const secret = process.env.CHARIOW_WEBHOOK_SECRET
  const signature = req.headers['x-chariow-signature'] || ''
  const expected = `sha256=${createHmac('sha256', secret || '').update(raw).digest('hex')}`
  if (!secret || signature.length !== expected.length || !timingSafeEqual(Buffer.from(signature), Buffer.from(expected))) return json(res, 401, { error: 'Signature Pulse invalide.' })
  const deliveryId = req.headers['x-pulse-delivery-id']
  if (deliveryId && processedDeliveries.has(deliveryId)) return json(res, 200, { received: true, duplicate: true })
  if (deliveryId) processedDeliveries.add(deliveryId)
  const event = JSON.parse(raw.toString())
  // Branchez ici votre base de données, e-mail ou livraison métier.
  console.info('Chariow Pulse reçu:', req.headers['x-pulse-event'], event?.data?.id || '')
  return json(res, 200, { received: true })
}

createServer(async (req, res) => {
  try {
    if (req.method === 'GET' && req.url === '/health') return json(res, 200, { status: 'ok' })
    if (req.method === 'POST' && req.url === '/api/checkout') return checkout(req, res)
    if (req.method === 'POST' && req.url === '/webhooks/chariow') return webhook(req, res)
    const requested = req.url === '/' ? '/index.html' : req.url.split('?')[0]
    const file = join(publicDir, requested)
    if (!file.startsWith(publicDir) || !existsSync(file)) return json(res, 404, { error: 'Introuvable.' })
    const mime = { '.html': 'text/html; charset=utf-8', '.js': 'text/javascript; charset=utf-8', '.css': 'text/css; charset=utf-8' }[extname(file)] || 'application/octet-stream'
    res.writeHead(200, { 'Content-Type': mime, 'Cache-Control': 'no-store' }); createReadStream(file).pipe(res)
  } catch (error) { console.error(error); json(res, 500, { error: 'Erreur serveur.' }) }
}).listen(port, () => console.log(`Chariow payment app listening on :${port}`))
