import { useEffect, useState } from 'react'
import { getDocument } from '../api/documents'

function ChariowSnap({ html }) {
  return <iframe
    className="chariow-snap"
    title="Paiement sécurisé Chariow"
    sandbox="allow-forms allow-popups allow-scripts allow-same-origin allow-top-navigation-by-user-activation"
    srcDoc={html}
  />
}

export function DocumentPage({ slug, navigate }) {
  const [document, setDocument] = useState(null)
  const [state, setState] = useState('loading')

  useEffect(() => {
    getDocument(slug).then((data) => { setDocument(data); setState('ready') }).catch(() => setState('error'))
  }, [slug])

  if (state === 'loading') return <p className="page-message">Chargement du document…</p>
  if (state === 'error') return <section className="page-message"><p>Ce document est introuvable.</p><button className="button" onClick={() => navigate('/catalogue')}>Retour au catalogue</button></section>

  return <section className="document-detail">
    <button type="button" className="back-button" onClick={() => navigate('/catalogue')}>← Catalogue</button>
    <div className="detail-layout">
      {document.cover_image ? <img src={document.cover_image} alt="" /> : <div className="detail-cover">PDF</div>}
      <div>
        <p className="eyebrow">{document.category?.name || 'DOCUMENT'}</p>
        <h1>{document.title}</h1>
        <p className="detail-description">{document.description}</p>
        <p className="price">{document.price} {document.currency}</p>
        {document.chariow_snap_html ? <ChariowSnap html={document.chariow_snap_html} /> : <p className="purchase-unavailable">Ce livre n’est pas encore disponible à l’achat.</p>}
      </div>
    </div>
  </section>
}
