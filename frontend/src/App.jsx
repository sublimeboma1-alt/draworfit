import { useEffect, useState } from 'react'
import { AuthProvider } from './contexts/AuthContext'
import { AppLayout } from './components/AppLayout'
import { HomePage } from './pages/HomePage'
import { LoginPage } from './pages/LoginPage'
import { RegisterPage } from './pages/RegisterPage'
import { CatalogPage } from './pages/CatalogPage'
import { DocumentPage } from './pages/DocumentPage'
import { LibraryPage } from './pages/LibraryPage'
import { ActivatePage } from './pages/ActivatePage'
import { AboutPage } from './pages/AboutPage'
import { ReaderPage } from './pages/ReaderPage'
import { SuperAdminPage } from './pages/SuperAdminPage'
import { AdminSupportPage } from './pages/AdminSupportPage'
import './App.css'
import './product-cards.css'
import './navigation.css'

function resolvePage(pathname) {
  pathname = new URL(pathname, window.location.origin).pathname
  if (pathname === '/connexion') return { page: 'login' }
  if (pathname === '/inscription') return { page: 'register' }
  if (pathname === '/catalogue') return { page: 'catalog' }
  if (pathname === '/bibliotheque') return { page: 'library' }
  if (pathname === '/activation') return { page: 'activate' }
  if (pathname === '/a-propos') return { page: 'about' }
  if (pathname === '/superadmin') return { page: 'superadmin' }
  if (pathname === '/superadmin/aide') return { page: 'admin-support' }
  if (pathname.startsWith('/lecture/')) return { page: 'reader', licenseId: decodeURIComponent(pathname.slice('/lecture/'.length)), fileId: new URLSearchParams(window.location.search).get('f') }
  if (pathname.startsWith('/documents/')) return { page: 'document', slug: decodeURIComponent(pathname.slice('/documents/'.length)) }
  return { page: 'home' }
}

function App() {
  const [route, setRoute] = useState(() => resolvePage(window.location.pathname))
  const navigate = (path) => { window.history.pushState({}, '', path); setRoute(resolvePage(path)) }
  useEffect(() => { const back = () => setRoute(resolvePage(window.location.pathname)); window.addEventListener('popstate', back); return () => window.removeEventListener('popstate', back) }, [])
  if (route.page === 'reader') return <AuthProvider><ReaderPage licenseId={route.licenseId} fileId={route.fileId} navigate={navigate} /></AuthProvider>
  if (route.page === 'superadmin') return <AuthProvider><SuperAdminPage navigate={navigate} /></AuthProvider>
  if (route.page === 'admin-support') return <AuthProvider><AdminSupportPage navigate={navigate} /></AuthProvider>
  return <AuthProvider><AppLayout navigate={navigate}>{route.page === 'login' && <LoginPage navigate={navigate} />}{route.page === 'register' && <RegisterPage navigate={navigate} />}{route.page === 'catalog' && <CatalogPage navigate={navigate} />}{route.page === 'library' && <LibraryPage navigate={navigate} />}{route.page === 'activate' && <ActivatePage navigate={navigate} />}{route.page === 'about' && <AboutPage />}{route.page === 'document' && <DocumentPage slug={route.slug} navigate={navigate} />}{route.page === 'home' && <HomePage navigate={navigate} />}</AppLayout></AuthProvider>
}
export default App
