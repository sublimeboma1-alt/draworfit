import { useEffect, useState } from 'react'
import { adminCreate, adminDelete, adminList, adminUpdate } from '../api/superadmin'
import { useAuth } from '../contexts/AuthContext'
import './SuperAdminPage.css'

const sections = {
  documents: { label: 'Documents', columns: ['title', 'category_name', 'price', 'currency', 'is_published'], form: ['title', 'description', 'category', 'price', 'currency', 'is_published'], canCreate: true },
  categories: { label: 'Categories', columns: ['name', 'slug'], form: ['name'], canCreate: true },
  users: { label: 'Utilisateurs', columns: ['username', 'email', 'phone_number', 'university', 'country_of_origin', 'is_active'], form: ['username', 'email', 'password', 'first_name', 'last_name', 'phone_number', 'university', 'country_of_origin', 'is_active', 'is_staff', 'is_superuser'], canCreate: true },
  orders: { label: 'Commandes', columns: ['id', 'customer_name', 'status', 'total_amount', 'currency', 'items_count'], form: ['status'] },
  licenses: { label: 'Licences', columns: ['id', 'document_title', 'status', 'activation_code', 'activated_at'], form: ['status'] },
  devices: { label: 'Appareils', columns: ['name', 'platform', 'installation_id', 'last_seen_at'], form: [] },
  'order-items': { label: 'Lignes de commande', columns: ['id', 'order', 'document', 'title', 'unit_price'], form: [] },
}

const label = (value) => ({ is_published: 'Publie', is_active: 'Actif', is_staff: 'Administrateur', category: 'Categorie', country_of_origin: "Pays d'origine", phone_number: 'Telephone', customer_name: 'Client', total_amount: 'Montant', items_count: 'Articles', activation_code: "Code d'activation", document_title: 'Document', last_seen_at: 'Derniere activite' }[value] || value.replaceAll('_', ' '))
const valueFor = (value) => value === null || value === undefined || value === '' ? '—' : typeof value === 'boolean' ? (value ? 'Oui' : 'Non') : String(value)

export function SuperAdminPage({ navigate }) {
  const { user, isLoading, logout } = useAuth()
  const [active, setActive] = useState('documents')
  const [rows, setRows] = useState([])
  const [dashboard, setDashboard] = useState(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [editing, setEditing] = useState(null)
  const [form, setForm] = useState({ currency: 'XOF', is_published: false, is_active: true })

  const load = async () => {
    setLoading(true); setError('')
    try {
      const [list, overview] = await Promise.all([adminList(active), adminList('dashboard')])
      setRows(list.results || list); setDashboard(overview); setEditing(null); setForm({ currency: 'XOF', is_published: false, is_active: true })
    } catch { setError("Impossible de charger l'administration.") } finally { setLoading(false) }
  }
  useEffect(() => { if (user?.is_superuser) load() }, [active, user])

  if (isLoading) return <p className="page-message">Chargement…</p>
  if (!user?.is_superuser) return <section className="page-message"><h1>Acces refuse</h1><p>Cette interface est reservee aux superadministrateurs.</p><button className="button" onClick={() => navigate('/')}>Retour au site</button></section>

  const config = sections[active]
  const setField = (field, value) => setForm({ ...form, [field]: value })
  const edit = (row) => { setEditing(row); setForm({ ...row }) }
  const save = async (event) => {
    event.preventDefault(); setError('')
    try {
      let payload
      if (active === 'documents') {
        payload = new FormData()
        config.form.forEach((field) => { if (form[field] !== undefined && form[field] !== null) payload.append(field, form[field]) })
        if (form.cover_image_file) payload.append('cover_image', form.cover_image_file)
        if (form.encrypted_file_file) payload.append('encrypted_file', form.encrypted_file_file)
      } else payload = JSON.stringify(config.form.reduce((data, field) => ({ ...data, [field]: form[field] ?? '' }), {}))
      if (editing) await adminUpdate(active, editing.id, payload); else await adminCreate(active, payload)
      await load()
    } catch { setError("L'enregistrement a echoue. Verifiez les champs obligatoires.") }
  }
  const remove = async (row) => { if (!window.confirm('Supprimer cet element ?')) return; try { await adminDelete(active, row.id); await load() } catch { setError('Suppression impossible.') } }
  const input = (field) => {
    if (field === 'description') return <label key={field}>{label(field)}<textarea value={form[field] || ''} onChange={(e) => setField(field, e.target.value)} /></label>
    if (['is_published', 'is_active', 'is_staff', 'is_superuser'].includes(field)) return <label className="admin-check" key={field}><input type="checkbox" checked={Boolean(form[field])} onChange={(e) => setField(field, e.target.checked)} /> {label(field)}</label>
    if (field === 'category') return <label key={field}>{label(field)}<input type="number" value={form[field] || ''} onChange={(e) => setField(field, e.target.value || null)} placeholder="ID categorie" /></label>
    if (field === 'status') return <label key={field}>Statut<select value={form.status || 'pending'} onChange={(e) => setField('status', e.target.value)}><option value="pending">En attente</option><option value="paid">Payee</option><option value="cancelled">Annulee</option><option value="ready">Prete a activer</option><option value="active">Active</option><option value="revoked">Revoquee</option></select></label>
    return <label key={field}>{label(field)}<input type={field === 'price' ? 'number' : field === 'password' ? 'password' : 'text'} step={field === 'price' ? '0.01' : undefined} value={form[field] || ''} onChange={(e) => setField(field, e.target.value)} /></label>
  }
  return <div className="superadmin-shell"><aside className="superadmin-side"><strong>DRAWORFIT</strong><small>SUPERADMIN</small>{Object.entries(sections).map(([key, item]) => <button key={key} className={active === key ? 'active' : ''} onClick={() => setActive(key)}>{item.label}</button>)}<button className="admin-exit" onClick={() => { logout(); navigate('/') }}>Deconnexion</button></aside><main className="superadmin-main"><header><div><p>ADMINISTRATION</p><h1>{config.label}</h1></div>{config.canCreate && <button className="button" onClick={() => { setEditing(null); setForm({ currency: 'XOF', is_published: false, is_active: true }) }}>Ajouter</button>}</header>{dashboard && <div className="admin-stats">{Object.entries(dashboard).map(([key, value]) => <div key={key}><strong>{value}</strong><span>{label(key)}</span></div>)}</div>}{error && <p className="form-error">{error}</p>}<section className="admin-content">{config.form.length > 0 && <form className="admin-form" onSubmit={save}><h2>{editing ? 'Modifier' : 'Nouveau'}</h2>{config.form.map(input)}{active === 'documents' && <><label>Image de couverture<input type="file" accept="image/*" onChange={(e) => setField('cover_image_file', e.target.files[0])} /></label><label>Fichier protege<input type="file" accept="application/pdf" onChange={(e) => setField('encrypted_file_file', e.target.files[0])} /></label></>}<div><button className="button">Enregistrer</button>{editing && <button type="button" className="link-button" onClick={() => { setEditing(null); setForm({}) }}>Annuler</button>}</div></form>}<div className="admin-table-wrap">{loading ? <p>Chargement…</p> : <table><thead><tr>{config.columns.map((column) => <th key={column}>{label(column)}</th>)}<th>Actions</th></tr></thead><tbody>{rows.map((row) => <tr key={row.id}>{config.columns.map((column) => <td key={column}>{valueFor(row[column])}</td>)}<td><button className="text-action" onClick={() => edit(row)}>Modifier</button><button className="text-action danger" onClick={() => remove(row)}>Supprimer</button></td></tr>)}</tbody></table>}</div></section></main></div>
}
