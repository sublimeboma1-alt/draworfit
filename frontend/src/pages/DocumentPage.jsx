import { useEffect, useState } from 'react'
import { getDocument } from '../api/documents'
import { createOrder, getOrders, startChariowCheckout } from '../api/sales'
import { useAuth } from '../contexts/AuthContext'

export function DocumentPage({ slug, navigate }) {
  const [document, setDocument] = useState(null)
  const [state, setState] = useState('loading')
  const [purchase, setPurchase] = useState(null)
  const [existingPurchase, setExistingPurchase] = useState(null)
  const [error, setError] = useState('')
  const [busy, setBusy] = useState(false)
  const [phoneNumber, setPhoneNumber] = useState('')
  const [countryCode, setCountryCode] = useState('')
  const { user } = useAuth()

  useEffect(() => {
    getDocument(slug).then((data) => { setDocument(data); setState('ready') }).catch(() => setState('error'))
  }, [slug])

  useEffect(() => {
    if (!user || !document) { setExistingPurchase(null); return }
    getOrders().then((data) => {
      const orders = data.results || data
      setExistingPurchase(orders.find((order) => order.items.some((item) => item.document.id === document.id)) || null)
    }).catch(() => setExistingPurchase(null))
  }, [user, document])

  if (state === 'loading') return <p className="page-message">Chargement du document…</p>
  if (state === 'error') return <section className="page-message"><p>Ce document est introuvable.</p><button className="button" onClick={() => navigate('/catalogue')}>Retour au catalogue</button></section>

  const beginPurchase = async () => {
    if (!user) { navigate('/connexion'); return }
    setError(''); setBusy(true)
    try {
      const order = currentPurchase || await createOrder([document.id])
      setPurchase(order)
      const checkout = await startChariowCheckout(order.id, { phone_number: phoneNumber, country_code: countryCode })
      if (checkout.step === 'completed') setPurchase(checkout.order)
      else if (checkout.checkout_url) { window.location.assign(checkout.checkout_url); return }
      else setError('Le lien de paiement n’a pas été fourni. Réessayez.')
    } catch (requestError) {
      setError(requestError.message || 'Cet achat ne peut pas être créé. Il a peut-être déjà été effectué.')
    } finally { setBusy(false) }
  }

  const currentPurchase = purchase || existingPurchase
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
        {(!currentPurchase || currentPurchase.status !== 'paid') && <div className="checkout-details">
          <label>Téléphone<input value={phoneNumber} onChange={(event) => setPhoneNumber(event.target.value)} placeholder={user?.phone_number || '+221 77 000 00 00'} /></label>
          <label>Code pays<input value={countryCode} onChange={(event) => setCountryCode(event.target.value.toUpperCase())} maxLength="2" placeholder="SN" /></label>
          <button className="button" disabled={busy} onClick={beginPurchase}>{busy ? 'Redirection…' : currentPurchase ? 'Reprendre le paiement Chariow' : 'Payer avec Chariow'}</button>
          <small>Le paiement est traité de manière sécurisée par Chariow.</small>
        </div>}
        {currentPurchase && <div className="purchase-status">
          <p>{currentPurchase.status === 'paid' ? 'Vous avez déjà acheté ce document.' : 'Votre commande est en attente de paiement.'}</p>
          <p>{currentPurchase.status === 'paid' ? 'Il est disponible dans votre bibliothèque.' : 'Terminez le paiement Chariow pour y accéder.'}</p>
          <button className="button" onClick={() => navigate('/bibliotheque')}>Voir ma bibliothèque</button>
        </div>}
      </div>
    </div>
  </section>
}
