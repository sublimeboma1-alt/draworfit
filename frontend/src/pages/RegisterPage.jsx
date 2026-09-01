import { useState } from 'react'
import { getProfile, login, register } from '../api/auth'
import { useAuth } from '../contexts/AuthContext'
import { AuthFrame } from './LoginPage'

export function RegisterPage({ navigate }) {
  const { setUser } = useAuth()
  const [form, setForm] = useState({ username: '', email: '', password: '', first_name: '', last_name: '', phone_number: '', university: '', country_of_origin: '' })
  const [error, setError] = useState('')
  const [busy, setBusy] = useState(false)
  const change = (name) => (event) => setForm({ ...form, [name]: event.target.value })
  const submit = async (event) => {
    event.preventDefault(); setError(''); setBusy(true)
    try { await register(form); await login(form.username, form.password); setUser(await getProfile()); navigate('/') } catch { setError('Impossible de creer le compte. Verifiez les informations saisies.') } finally { setBusy(false) }
  }
  return <AuthFrame title="Creer un compte" subtitle="Vos achats seront rattaches a ce compte." error={error}><form onSubmit={submit}>
    <div className="field-row"><label>Prenom<input value={form.first_name} onChange={change('first_name')} /></label><label>Nom<input value={form.last_name} onChange={change('last_name')} /></label></div>
    <label>Nom d'utilisateur<input required value={form.username} onChange={change('username')} /></label>
    <label>E-mail<input required type="email" value={form.email} onChange={change('email')} /></label>
    <label>Mot de passe<input required minLength="8" type="password" value={form.password} onChange={change('password')} /></label>
    <label>Numero de telephone <small>(facultatif)</small><input type="tel" value={form.phone_number} onChange={change('phone_number')} /></label>
    <label>Universite <small>(facultatif)</small><input value={form.university} onChange={change('university')} /></label>
    <label>Pays d'origine <small>(facultatif)</small><input value={form.country_of_origin} onChange={change('country_of_origin')} /></label>
    <button className="button" disabled={busy}>{busy ? 'Creation…' : 'Creer mon compte'}</button>
    <p className="form-switch">Deja inscrit ? <button type="button" className="text-action" onClick={() => navigate('/connexion')}>Se connecter</button></p>
  </form></AuthFrame>
}
