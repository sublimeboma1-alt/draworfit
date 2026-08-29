import { useState } from 'react'
import { getProfile, login } from '../api/auth'
import { useAuth } from '../contexts/AuthContext'
export function LoginPage({ navigate }) {
  const { setUser } = useAuth(); const [form, setForm] = useState({ username: '', password: '' }); const [error, setError] = useState(''); const [busy, setBusy] = useState(false)
  const submit = async (e) => { e.preventDefault(); setError(''); setBusy(true); try { await login(form.username, form.password); setUser(await getProfile()); navigate('/') } catch { setError('Identifiant ou mot de passe incorrect.') } finally { setBusy(false) } }
  return <AuthFrame title="Connexion" subtitle="Accédez à votre bibliothèque personnelle." error={error}><form onSubmit={submit}><label>Nom d’utilisateur<input required value={form.username} onChange={(e) => setForm({ ...form, username: e.target.value })} /></label><label>Mot de passe<input required type="password" value={form.password} onChange={(e) => setForm({ ...form, password: e.target.value })} /></label><button className="button" disabled={busy}>{busy ? 'Connexion…' : 'Se connecter'}</button><p className="form-switch">Pas encore de compte ? <button type="button" className="text-action" onClick={() => navigate('/inscription')}>Créer un compte</button></p></form></AuthFrame>
}
export function AuthFrame({ title, subtitle, error, children }) { return <section className="auth-page"><div className="auth-card"><p className="eyebrow">ESPACE CLIENT</p><h1>{title}</h1><p className="form-subtitle">{subtitle}</p>{error && <p className="form-error" role="alert">{error}</p>}{children}</div></section> }
