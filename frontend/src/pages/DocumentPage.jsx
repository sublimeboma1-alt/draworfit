import { useEffect, useState } from 'react'
import { getDocument } from '../api/documents'
import { createOrder, getOrders } from '../api/sales'
import { useAuth } from '../contexts/AuthContext'

export function DocumentPage({ slug, navigate }) {
  const [document, setDocument] = useState(null)
  const [state, setState] = useState('loading')
  const [purchase, setPurchase] = useState(null)
  const [existingPurchase, setExistingPurchase] = useState(null)
  const [error, setError] = useState('')
  const [busy, setBusy] = useState(false)
  const { user } = useAuth()

  useEffect(() => {
    getDocument(slug).then((data) => {
      setDocument(data)
      setState('ready')
    }).catch(() => setState('error'))
  }, [slug])

  useEffect(() => {
    if (!user || !document) {
      setExistingPurchase(null)
      return
    }
    getOrders().then((data) => {
      const orders = data.results || data
      setExistingPurchase(orders.find((order) => order.items.some((item) => item.document.id === document.id)) || null)
    }).catch(() => setExistingPurchase(null))
  }, [user, document])

  if (state === 'loading') return <p className="page-message">Chargement du document…</p>
  if (state === 'error') return <section className="page-message"><p>Ce document est introuvable.</p><button className="button" onClick={() => navigate('/catalogue')}>Retour au catalogue</button></section>

  const beginPurchase = async () => {
    if (!user) { navigate('/connexion'); return }
    setError('')
    setBusy(true)
    try {
      setPurchase(await createOrder([document.id]))
    } catch {
      setError('Cet achat ne peut pas etre cree. Il a peut-etre deja ete effectue.')
    } finally {
      setBusy(false)
    }
  }

  const completedPurchase = purchase || existingPurchase
  return <section className="document-detail">
    <button type="button" className="back-button" onClick={() => navigate('/catalogue')}>← Catalogue</button>
    <div className="detail-layout">
      {document.cover_image ? <img src={document.cover_image} alt="" /> : <div className="detail-cover">PDF</div>}
      <div>
        <p className="eyebrow">{document.category?.name || 'DOCUMENT'}</p>
        <h1>{document.title}</h1>
        <p className="detail-description">{document.description}</p>
        <p className="price">{document.price} {document.currency}</p>
        {error && <p className="form-error">{error}</p>}
        {!completedPurchase && <button className="button" disabled={busy} onClick={beginPurchase}>{busy ? 'Creation…' : 'Acheter ce document'}</button>}
        {completedPurchase && <div className="purchase-status">
          <p>Vous avez deja achete ce document.</p>
          <p>{completedPurchase.status === 'paid' ? 'Il est disponible dans votre bibliotheque.' : 'Votre achat est enregistre et sera disponible apres confirmation du paiement.'}</p>
          <button className="button" onClick={() => navigate('/bibliotheque')}>Voir ma bibliotheque</button>
        </div>}
      </div>
    </div>
  </section>
}
