import { useState } from 'react'
import { getProfile, login, register } from '../api/auth'
import { useAuth } from '../contexts/AuthContext'
import { AuthFrame } from './LoginPage'
export function RegisterPage({ navigate }) {
  const { setUser } = useAuth(); const [form, setForm] = useState({ username: '', email: '', password: '', first_name: '', last_name: '' }); const [error, setError] = useState(''); const [busy, setBusy] = useState(false); const change = (name) => (e) => setForm({ ...form, [name]: e.target.value })
  const submit = async (e) => { e.preventDefault(); setError(''); setBusy(true); try { await register(form); await login(form.username, form.password); setUser(await getProfile()); navigate('/') } catch { setError('Impossible de créer le compte. Vérifiez les informations saisies.') } finally { setBusy(false) } }
  return <AuthFrame title="Créer un compte" subtitle="Vos achats seront rattachés à ce compte." error={error}><form onSubmit={submit}><div className="field-row"><label>Prénom<input value={form.first_name} onChange={change('first_name')} /></label><label>Nom<input value={form.last_name} onChange={change('last_name')} /></label></div><label>Nom d’utilisateur<input required value={form.username} onChange={change('username')} /></label><label>E-mail<input required type="email" value={form.email} onChange={change('email')} /></label><label>Mot de passe<input required minLength="8" type="password" value={form.password} onChange={change('password')} /></label><button className="button" disabled={busy}>{busy ? 'Création…' : 'Créer mon compte'}</button><p className="form-switch">Déjà inscrit ? <button type="button" className="text-action" onClick={() => navigate('/connexion')}>Se connecter</button></p></form></AuthFrame>
}
