import { useState } from 'react'
import { activateLicense } from '../api/licenses'
import { useAuth } from '../contexts/AuthContext'
import { getDeviceIdentity } from '../security/deviceIdentity'

export function ActivatePage({ navigate }) {
  const { user } = useAuth(); const [code, setCode] = useState(''); const [error, setError] = useState(''); const [busy, setBusy] = useState(false); const [license, setLicense] = useState(null)
  if (!user) return <section className="page-message"><p>Connectez-vous avant d’activer un document.</p><button className="button" onClick={() => navigate('/connexion')}>Connexion</button></section>
  const submit = async (event) => { event.preventDefault(); setError(''); setBusy(true); try { const device = await getDeviceIdentity(); setLicense(await activateLicense({ activation_code: code.trim(), ...device })) } catch (err) { setError('Activation impossible. Vérifiez le code et utilisez le compte qui a acheté le document.') } finally { setBusy(false) } }
  if (license) return <section className="auth-page"><div className="auth-card"><p className="eyebrow">ACTIVATION RÉUSSIE</p><h1>Document activé</h1><p className="form-subtitle">{license.document.title} est maintenant associé à cet appareil.</p><button className="button" onClick={() => navigate('/bibliotheque')}>Voir ma bibliothèque</button></div></section>
  return <section className="auth-page"><div className="auth-card"><p className="eyebrow">ACTIVER UN DOCUMENT</p><h1>Entrer le code</h1><p className="form-subtitle">Collez le code de 40 caractères reçu après votre achat de test.</p><form onSubmit={submit}><label>Code d’activation<input required minLength="40" maxLength="40" value={code} onChange={(e) => setCode(e.target.value.toUpperCase())} placeholder="Ex. 9F2A…" /></label>{error && <p className="form-error">{error}</p>}<button className="button" disabled={busy}>{busy ? 'Activation…' : 'Activer sur cet appareil'}</button></form></div></section>
}
