import { useEffect, useRef, useState } from 'react'
import { getProtectedDocument } from '../api/licenses'
import { getInstallationId } from '../security/deviceIdentity'
import { getOfflineDocument, removeOfflineDocument, saveOfflineDocument } from '../security/offlineDocuments'
import './ReaderPage.css'

export function ReaderPage({ licenseId, fileId, navigate }) {
  const [url, setUrl] = useState(null)
  const [error, setError] = useState('')
  const [offlineCopy, setOfflineCopy] = useState(false)
  const [shield, setShield] = useState(false)
  const [nativeUrl, setNativeUrl] = useState(null)
  const nativeUrlCreated = useRef(false)
  const offlineKey = `${licenseId}:${fileId || 'main'}`
  // Certains téléphones ne peuvent pas afficher un PDF « blob » dans une iframe :
  // on affiche alors un lien qui ouvre le document dans le lecteur natif du téléphone.
  const [isHandheld] = useState(() => typeof window !== 'undefined' && window.innerWidth <= 820 && ('ontouchstart' in window || navigator.maxTouchPoints > 0))

  useEffect(() => {
    let objectUrl
    let cancelled = false
    const installationId = getInstallationId()
    const showBlob = (blob, availableOffline) => {
      if (!nativeUrlCreated.current) {
        nativeUrlCreated.current = true
        setNativeUrl(URL.createObjectURL(blob))
      }
      objectUrl = URL.createObjectURL(blob)
      if (!cancelled) { setOfflineCopy(availableOffline); setUrl(objectUrl) }
    }
    async function openOfflineCopy() {
      const blob = await getOfflineDocument(offlineKey, installationId)
      if (!blob) throw new Error("Ce document n'est pas encore enregistre hors connexion sur cet appareil active.")
      showBlob(blob, true)
    }
    async function openDocument() {
      if (!installationId) { setError("Activez d'abord le document sur cet appareil avant de le lire."); return }
      if (!navigator.onLine) {
        try { await openOfflineCopy() } catch (offlineError) { if (!cancelled) setError(offlineError.message) }
        return
      }
      try {
        const blob = await getProtectedDocument(licenseId, installationId, fileId)
        showBlob(blob, false)
        try { await saveOfflineDocument(offlineKey, blob, installationId); if (!cancelled) setOfflineCopy(true) } catch { /* Online reading remains available. */ }
      } catch (networkError) {
        if (networkError.status === 401 || networkError.status === 403 || networkError.status === 404) {
          await removeOfflineDocument(offlineKey)
          if (!cancelled) setError(networkError.message)
          return
        }
        try { await openOfflineCopy() } catch (offlineError) { if (!cancelled) setError(offlineError.message) }
      }
    }
    openDocument()
    return () => { cancelled = true; if (objectUrl) URL.revokeObjectURL(objectUrl) }
  }, [licenseId, fileId, offlineKey])

  useEffect(() => {
    const preventShortcut = (event) => {
      if ((event.ctrlKey || event.metaKey) && ['p', 's'].includes(event.key.toLowerCase())) event.preventDefault()
      if (event.key === 'PrintScreen') { setShield(true); window.setTimeout(() => setShield(false), 1200) }
    }
    const hideForPrint = () => setShield(true)
    const restoreAfterPrint = () => setShield(false)
    window.addEventListener('keydown', preventShortcut)
    window.addEventListener('beforeprint', hideForPrint)
    window.addEventListener('afterprint', restoreAfterPrint)
    return () => { window.removeEventListener('keydown', preventShortcut); window.removeEventListener('beforeprint', hideForPrint); window.removeEventListener('afterprint', restoreAfterPrint) }
  }, [])

  if (error) return <section className="page-message"><p className="error-message">{error}</p><button className="button" onClick={() => navigate('/bibliotheque')}>Retour a la bibliotheque</button></section>
  if (!url) return <p className="page-message">Ouverture securisee du document…</p>
  return <section className="reader-page" onContextMenu={(event) => event.preventDefault()}>
    <div className="reader-header"><button className="back-button" onClick={() => navigate('/bibliotheque')}>← Ma bibliotheque</button>{offlineCopy && <span>Disponible hors connexion sur cet appareil</span>}<button className="reader-hide" onClick={() => setShield((visible) => !visible)}>{shield ? 'Afficher' : 'Masquer'}</button></div>
    <div className="reader-frame"><iframe className="document-reader" src={`${url}#toolbar=0&navpanes=0&scrollbar=1`} title="Document protege" /><div className="reader-watermark" aria-hidden="true">DOCUMENT PROTEGE · USAGE PERSONNEL · DOCUMENT PROTEGE · USAGE PERSONNEL</div>{shield && <div className="reader-shield">Document masque</div>}</div>
    {isHandheld && <a className="reader-open" href={nativeUrl || '#'} target="_blank" rel="noopener">Ouvrir avec le lecteur du téléphone</a>}
  </section>
}
