import { useEffect, useState } from 'react'
import { getProtectedDocument } from '../api/licenses'
import { getInstallationId } from '../security/deviceIdentity'
import { getOfflineDocument, removeOfflineDocument, saveOfflineDocument } from '../security/offlineDocuments'

export function ReaderPage({ licenseId, navigate }) {
  const [url, setUrl] = useState(null)
  const [error, setError] = useState('')
  const [offlineCopy, setOfflineCopy] = useState(false)

  useEffect(() => {
    let objectUrl
    let cancelled = false

    async function openDocument() {
      try {
        const blob = await getProtectedDocument(licenseId, getInstallationId())
        await saveOfflineDocument(licenseId, blob)
        objectUrl = URL.createObjectURL(blob)
        if (!cancelled) { setOfflineCopy(true); setUrl(objectUrl) }
      } catch (networkError) {
        if (networkError.status === 401 || networkError.status === 403 || networkError.status === 404) {
          await removeOfflineDocument(licenseId)
          if (!cancelled) setError(networkError.message)
          return
        }
        try {
          const blob = await getOfflineDocument(licenseId)
          if (!blob) throw new Error('Connectez-vous une première fois pour enregistrer ce document sur cet appareil.')
          objectUrl = URL.createObjectURL(blob)
          if (!cancelled) { setOfflineCopy(true); setUrl(objectUrl) }
        } catch (offlineError) {
          if (!cancelled) setError(offlineError.message)
        }
      }
    }

    openDocument()
    return () => { cancelled = true; if (objectUrl) URL.revokeObjectURL(objectUrl) }
  }, [licenseId])

  if (error) return <section className="page-message"><p className="error-message">{error}</p><button className="button" onClick={() => navigate('/bibliotheque')}>Retour à la bibliothèque</button></section>
  if (!url) return <p className="page-message">Ouverture sécurisée du document…</p>
  return <section className="reader-page"><div className="reader-header"><button className="back-button" onClick={() => navigate('/bibliotheque')}>← Ma bibliothèque</button>{offlineCopy && <span>Disponible hors connexion sur cet appareil</span>}</div><iframe className="document-reader" src={`${url}#toolbar=0&navpanes=0&scrollbar=1`} title="Document protégé" /></section>
}
