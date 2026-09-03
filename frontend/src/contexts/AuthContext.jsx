import { createContext, useContext, useEffect, useMemo, useState } from 'react'
import { getProfile, logout as clearTokens } from '../api/auth'
const AuthContext = createContext(null)
export function AuthProvider({ children }) {
  const [user, setUser] = useState(null); const [isLoading, setIsLoading] = useState(true)
  useEffect(() => { if (!localStorage.getItem('access_token')) { setIsLoading(false); return } getProfile().then(setUser).catch(clearTokens).finally(() => setIsLoading(false)) }, [])
  useEffect(() => {
    const handleExpiredAuthentication = () => setUser(null)
    window.addEventListener('draworfit:authentication-expired', handleExpiredAuthentication)
    return () => window.removeEventListener('draworfit:authentication-expired', handleExpiredAuthentication)
  }, [])
  const value = useMemo(() => ({ user, isLoading, setUser, logout: () => { clearTokens(); setUser(null) } }), [user, isLoading])
  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>
}
export function useAuth() { const context = useContext(AuthContext); if (!context) throw new Error('AuthProvider requis.'); return context }
