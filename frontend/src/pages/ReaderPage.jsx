import { useEffect, useRef, useState } from 'react'
import * as pdfjsLib from 'pdfjs-dist'
import pdfWorkerUrl from 'pdfjs-dist/build/pdf.worker.min.mjs?url'
import { getProtectedDocument } from '../api/licenses'
import { getInstallationId } from '../security/deviceIdentity'
import { getOfflineDocument, removeOfflineDocument, saveOfflineDocument } from '../security/offlineDocuments'
import './ReaderPage.css'

pdfjsLib.GlobalWorkerOptions.workerSrc = pdfWorkerUrl

export function ReaderPage({ licenseId, fileId, navigate }) {
  const [error, setError] = useState('')
  const [ready, setReady] = useState(false)
  const [offlineCopy, setOfflineCopy] = useState(false)
  const [shield, setShield] = useState(false)
  const scrollRef = useRef(null)
  const pdfBufferRef = useRef(null)
  const renderTokenRef = useRef(0)
  const offlineKey = `${licenseId}:${fileId || 'main'}`

  async function renderBufferInto(container, pristine, cancelled, token) {
    const loadingTask = pdfjsLib.getDocument({ data: pristine.slice(0) })
    try {
      const pdfDoc = await loadingTask.promise
      if (cancelled || token !== renderTokenRef.current) return
      const containerWidth = Math.max(container.clientWidth || 320, 320)
      const dpr = Math.min(window.devicePixelRatio || 1, 2)
      container.textContent = ''
      for (let pageNumber = 1; pageNumber <= pdfDoc.numPages; pageNumber += 1) {
        const page = await pdfDoc.getPage(pageNumber)
        const baseViewport = page.getViewport({ scale: 1 })
        const scale = dpr * (containerWidth / baseViewport.width)
        const viewport = page.getViewport({ scale })
        const canvas = document.createElement('canvas')
        canvas.width = Math.floor(viewport.width)
        canvas.height = Math.floor(viewport.height)
        canvas.style.width = '100%'
        canvas.style.height = 'auto'
        const wrap = document.createElement('div')
        wrap.className = 'pdf-page'
        wrap.appendChild(canvas)
        container.appendChild(wrap)
        await page.render({ canvasContext: canvas.getContext('2d'), viewport }).promise
        if (cancelled || token !== renderTokenRef.current) return
      }
    } finally {
      loadingTask.destroy()
    }
  }

  useEffect(() => {
    let cancelled = false
    const installationId = getInstallationId()

    // Rendu PDF.js dans la page : aucun lecteur natif requis, plus d'échec sur mobile.
    // IMPORTANT : on conserve une copie « intacte » du PDF. PDF.js transfère le
    // ArrayBuffer au web worker et le vide ; sans cette copie, le moindre resize
    // (rotation, barre d'adresse mobile…) utilisait un buffer vidé et affichait
    // « Invalid PDF structure ».
    async function renderPdf(blob, availableOffline) {
      const container = scrollRef.current
      if (!container) throw new Error('Lecteur indisponible.')
      pdfBufferRef.current = (await blob.arrayBuffer()).slice(0)
      if (!cancelled && availableOffline) setOfflineCopy(true)
      try {
        await renderBufferInto(container, pdfBufferRef.current, cancelled, renderTokenRef.current)
        if (!cancelled) setReady(true)
      } catch (renderError) {
        if (!cancelled) {
          console.error('Échec du rendu du PDF :', renderError)
          setError('Le document ne peut pas être ouvert : le fichier PDF est invalide ou endommagé.')
        }
      }
    }
    async function openOfflineCopy() {
      const blob = await getOfflineDocument(offlineKey, installationId)
      if (!blob) throw new Error("Ce document n'est pas encore enregistre hors connexion sur cet appareil active.")
      await renderPdf(blob, true)
    }
    async function openDocument() {
      if (!installationId) { setError("Activez d'abord le document sur cet appareil avant de le lire."); return }
      if (!navigator.onLine) {
        try { await openOfflineCopy() } catch (offlineError) { if (!cancelled) setError(offlineError.message) }
        return
      }
      try {
        const blob = await getProtectedDocument(licenseId, installationId, fileId)
        await renderPdf(blob, false)
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
    return () => { cancelled = true }
  }, [licenseId, fileId, offlineKey])

  // Re-rend après rotation / redimensionnement sans re-téléchargement réseau.
  useEffect(() => {
    if (!ready) return undefined
    const container = scrollRef.current
    let timeout
    const onResize = () => {
      window.clearTimeout(timeout)
      timeout = window.setTimeout(() => {
        renderTokenRef.current += 1
        const token = renderTokenRef.current
        if (container && pdfBufferRef.current) {
          renderBufferInto(container, pdfBufferRef.current, false, token).catch((renderError) => {
            console.error('Échec du re-rendu après rotation :', renderError)
          })
        }
      }, 250)
    }
    window.addEventListener('resize', onResize)
    return () => { window.clearTimeout(timeout); window.removeEventListener('resize', onResize) }
  }, [ready])

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
  return <section className="reader-page" onContextMenu={(event) => event.preventDefault()}>
    <div className="reader-header"><button className="back-button" onClick={() => navigate('/bibliotheque')}>← Ma bibliotheque</button>{offlineCopy && <span>Disponible hors connexion sur cet appareil</span>}<button className="reader-hide" onClick={() => setShield((visible) => !visible)}>{shield ? 'Afficher' : 'Masquer'}</button></div>
    <div className="reader-frame">
      <div className="document-scroll" ref={scrollRef} />
      {!ready && <div className="reader-loading">Ouverture securisee du document…</div>}
      <div className="reader-watermark" aria-hidden="true">DOCUMENT PROTEGE · USAGE PERSONNEL · DOCUMENT PROTEGE · USAGE PERSONNEL</div>
      {shield && <div className="reader-shield">Document masque</div>}
    </div>
  </section>
}
