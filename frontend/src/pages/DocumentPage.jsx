import { useEffect, useState } from 'react'
import { getDocument } from '../api/documents'
import { createOrder } from '../api/sales'
import { useAuth } from '../contexts/AuthContext'

export function DocumentPage({ slug, navigate }) {
  const [document, setDocument] = useState(null)
  const [state, setState] = useState('loading')
  const [purchase, setPurchase] = useState(null)
  const [error, setError] = useState('')
  const [busy, setBusy] = useState(false)
  const { user } = useAuth()

  useEffect(() => {
    getDocument(slug).then((data) => { setDocument(data); setState('ready') }).catch(() => setState('error'))
  }, [slug])

  if (state === 'loading') return <p className="page-message">Chargement du document…</p>
  if (state === 'error') return <section className="page-message"><p>Ce document est introuvable.</p><button className="button" onClick={() => navigate('/catalogue')}>Retour au catalogue</button></section>

  const beginPurchase = async () => {
    if (!user) { navigate('/connexion'); return }
    setError('')
    setBusy(true)
    try { setPurchase(await createOrder([document.id])) } catch { setError('La commande ne peut pas être créée.') } finally { setBusy(false) }
  }

  return <section className="document-detail"><button type="button" className="back-button" onClick={() => navigate('/catalogue')}>← Catalogue</button><div className="detail-layout">{document.cover_image ? <img src={document.cover_image} alt="" /> : <div className="detail-cover">PDF</div>}<div><p className="eyebrow">{document.category?.name || 'DOCUMENT'}</p><h1>{document.title}</h1><p className="detail-description">{document.description}</p><p className="price">{document.price} {document.currency}</p>{error && <p className="form-error">{error}</p>}{!purchase && <button className="button" disabled={busy} onClick={beginPurchase}>{busy ? 'Création…' : 'Commander ce document'}</button>}{purchase && <div className="purchase-status"><p>Votre commande est enregistrée.</p><p>Le document sera disponible dans votre bibliothèque dès que le paiement aura été confirmé.</p><button className="button" onClick={() => navigate('/bibliotheque')}>Voir ma bibliothèque</button></div>}</div></div></section>
}
