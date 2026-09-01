import { useEffect, useMemo, useState } from 'react'
import { getCategories, getDocuments } from '../api/documents'

const price = (value, currency) => `${new Intl.NumberFormat('fr-FR').format(Number(value))} ${currency}`
const shortDescription = (value) => {
  const words = (value || 'Document numérique protégé.').trim().split(/\s+/)
  return words.length > 10 ? `${words.slice(0, 10).join(' ')}…` : words.join(' ')
}

function DocumentCover({ document, index }) {
  const [imageFailed, setImageFailed] = useState(false)
  if (document.cover_image && !imageFailed) return <img src={document.cover_image} alt={document.title} onError={() => setImageFailed(true)} />
  return <div className={`book-cover cover-${index % 4}`}><small>{document.category?.name || 'DRAWORFIT'}</small><strong>{document.title}</strong><b>PDF</b></div>
}

export function CatalogPage({ navigate }) {
  const [documents, setDocuments] = useState([])
  const [categories, setCategories] = useState([])
  const [category, setCategory] = useState('')
  const [state, setState] = useState('loading')
  const search = new URLSearchParams(window.location.search).get('search')?.toLocaleLowerCase() || ''

  useEffect(() => {
    Promise.all([getDocuments(), getCategories()]).then(([docs, cats]) => {
      setDocuments(docs.results || docs); setCategories(cats.results || cats); setState('ready')
    }).catch(() => setState('error'))
  }, [])

  const products = useMemo(() => documents.filter((doc) => `${doc.title} ${doc.description} ${doc.category?.name || ''}`.toLocaleLowerCase().includes(search) && (!category || doc.category?.id === category)), [documents, category, search])

  return <div className="marketplace">
    <section className="market-hero"><div><p>DRAWORFIT · DOCUMENTS NUMÉRIQUES</p><h1>Une vraie boutique pour apprendre.</h1><span>Découvrez des documents sélectionnés et protégés.</span><button onClick={() => document.querySelector('.market-content')?.scrollIntoView({ behavior: 'smooth' })}>Voir les offres</button></div><div className="hero-book"><b>DRAWORFIT</b><strong>VOS<br />CONNAISSANCES</strong><i>PDF</i></div></section>
    <div className="market-category-row"><button className={!category ? 'selected' : ''} onClick={() => setCategory('')}>Tous les produits</button>{categories.map((cat) => <button className={category === cat.id ? 'selected' : ''} key={cat.id} onClick={() => setCategory(cat.id)}>{cat.name}</button>)}</div>
    <section className="market-content"><aside className="market-sidebar"><p className="filter-label">FILTRER PAR</p><h2>Catégories</h2><div className="filter-list"><button className={!category ? 'active-filter' : ''} onClick={() => setCategory('')}>Tout le catalogue</button>{categories.map((cat) => <button className={category === cat.id ? 'active-filter' : ''} key={cat.id} onClick={() => setCategory(cat.id)}>{cat.name}</button>)}</div><hr /><h3>Format</h3><p>✓ Document numérique sécurisé</p><hr /><h3>Paiement sécurisé</h3><p>Vos achats restent dans votre bibliothèque.</p></aside><div className="products-area"><div className="product-toolbar"><div><p className="eyebrow">BOUTIQUE</p><h2>{search ? `Résultats pour « ${search} »` : 'Documents populaires'}</h2></div><span>{products.length} produit{products.length > 1 ? 's' : ''}</span></div>{state === 'loading' && <p className="page-message">Chargement…</p>}{state === 'error' && <p className="page-message error-message">Le catalogue ne peut pas être chargé.</p>}{state === 'ready' && !products.length && <p className="page-message">Aucun document ne correspond à votre recherche.</p>}{state === 'ready' && <div className="market-grid">{products.map((doc, index) => <article className="market-card" key={doc.id}><button className="card-image" onClick={() => navigate(`/documents/${doc.slug}`)}><DocumentCover document={doc} index={index} /><span>Protégé</span></button><div className="market-card-body"><p>{doc.category?.name || 'Document numérique'}</p><h3>{doc.title}</h3><em>{shortDescription(doc.description)}</em><div className="rating">★★★★★ <small>Nouveau</small></div><strong>{price(doc.price, doc.currency)}</strong><button onClick={() => navigate(`/documents/${doc.slug}`)}>Voir l’offre</button></div></article>)}</div>}</div></section>
  </div>
}
