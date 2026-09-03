import { useEffect, useRef, useState } from 'react'
import { getDocument } from '../api/documents'

function ChariowSnap({ html }) {
  const containerRef = useRef(null)

  useEffect(() => {
    const container = containerRef.current
    if (!container || !html || container.dataset.mounted === html) return
    container.dataset.mounted = html
    // Le code HTML Snap de Chariow (Marketing > Snap) est inséré directement
    // dans la page : plus d'iframe ni de sandbox, donc le widget s'affiche en
    // pleine largeur (responsive), et son formulaire / bouton Payer fonctionne
    // normalement (la popup de checkout ne subit plus aucune restriction CORS
    // ni les erreurs « sandboxed and lacks the allow-same-origin flag »).
    container.innerHTML = html
    // innerHTML n'exécute pas les balises <script> : on les recrée une par une
    // pour que le widget Snap se lance correctement (bouton, formulaire…).
    container.querySelectorAll('script').forEach((oldScript) => {
      const script = document.createElement('script')
      for (const attr of oldScript.attributes) script.setAttribute(attr.name, attr.value)
      script.textContent = oldScript.textContent
      oldScript.replaceWith(script)
    })
  }, [html])

  return <div ref={containerRef} className="chariow-snap" />
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
