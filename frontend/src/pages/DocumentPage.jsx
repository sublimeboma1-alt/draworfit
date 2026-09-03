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
  const { user } = useAuth()
  const [checkoutDetails, setCheckoutDetails] = useState({ email: '', first_name: '', last_name: '', phone_number: '', country_code: '' })

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

  useEffect(() => {
    if (!user) return
    setCheckoutDetails({
      email: user.email || '', first_name: user.first_name || '', last_name: user.last_name || '',
      phone_number: user.phone_number || '', country_code: (user.country_of_origin || '').length === 2 ? user.country_of_origin.toUpperCase() : '',
    })
  }, [user])

  if (state === 'loading') return <p className="page-message">Chargement du document…</p>
  if (state === 'error') return <section className="page-message"><p>Ce document est introuvable.</p><button className="button" onClick={() => navigate('/catalogue')}>Retour au catalogue</button></section>

  const beginPurchase = async () => {
    if (!user) { navigate('/connexion'); return }
    setError(''); setBusy(true)
    try {
      const order = currentPurchase || await createOrder([document.id])
      setPurchase(order)
      const checkout = await startChariowCheckout(order.id, checkoutDetails)
      if (checkout.step === 'completed') setPurchase(checkout.order)
      else if (checkout.checkout_url) { window.location.assign(checkout.checkout_url); return }
      else setError('Le lien de paiement n’a pas été fourni. Réessayez.')
    } catch (requestError) {
      if (requestError.status === 401) {
        navigate('/connexion')
        return
      }
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
          <label>E-mail<input required type="email" value={checkoutDetails.email} onChange={(event) => setCheckoutDetails({ ...checkoutDetails, email: event.target.value })} /></label>
          <label>Prénom<input required value={checkoutDetails.first_name} onChange={(event) => setCheckoutDetails({ ...checkoutDetails, first_name: event.target.value })} /></label>
          <label>Nom<input required value={checkoutDetails.last_name} onChange={(event) => setCheckoutDetails({ ...checkoutDetails, last_name: event.target.value })} /></label>
          <label>Téléphone<input required type="tel" value={checkoutDetails.phone_number} onChange={(event) => setCheckoutDetails({ ...checkoutDetails, phone_number: event.target.value })} /></label>
          <label>Code pays<input required maxLength="2" placeholder="SN" value={checkoutDetails.country_code} onChange={(event) => setCheckoutDetails({ ...checkoutDetails, country_code: event.target.value.toUpperCase() })} /></label>
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
