'use client'

import { createContext, useContext, useState, useEffect, useCallback, ReactNode } from 'react'
import Cookies from 'js-cookie'
import { apiClient } from '@/lib/apiClient'
import { AuthResponseDTO } from '@/lib/types'

interface AuthContextType {
  isAuthenticated: boolean
  user: { name: string; role: string } | null
  login: (email: string, password: string) => Promise<void>
  logout: () => void
  loading: boolean
}

const AuthContext = createContext<AuthContextType>({
  isAuthenticated: false,
  user: null,
  login: async () => {},
  logout: () => {},
  loading: false,
})

export const useAuth = () => useContext(AuthContext)

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<{ name: string; role: string } | null>(() => {
    // Initialize synchronously from cookies to avoid flash
    if (typeof window !== 'undefined') {
      const token = Cookies.get('accessToken')
      const storedName = Cookies.get('userName')
      const storedRole = Cookies.get('userRole')
      if (token && storedName && storedRole) {
        return { name: storedName, role: storedRole }
      }
    }
    return null
  })
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    // Double-check cookies on mount
    const token = Cookies.get('accessToken')
    const storedName = Cookies.get('userName')
    const storedRole = Cookies.get('userRole')
    if (token && storedName && storedRole) {
      setUser({ name: storedName, role: storedRole })
    } else {
      setUser(null)
    }
    setLoading(false)
  }, [])

  const login = useCallback(async (email: string, password: string) => {
    const res = await apiClient.login({ email, password })
    const data: AuthResponseDTO = res.data.data
    Cookies.set('accessToken', data.token, { expires: 1 })
    Cookies.set('refreshToken', data.refreshToken, { expires: 7 })
    if (data.userId) Cookies.set('userId', data.userId, { expires: 7 })
    Cookies.set('userName', data.name || 'Admin', { expires: 7 })
    Cookies.set('userRole', data.role || 'ADMIN', { expires: 7 })
    setUser({ name: data.name || 'Admin', role: data.role || 'ADMIN' })
  }, [])

  const logout = useCallback(() => {
    Cookies.remove('accessToken')
    Cookies.remove('refreshToken')
    Cookies.remove('userId')
    Cookies.remove('userName')
    Cookies.remove('userRole')
    setUser(null)
  }, [])

  return (
    <AuthContext.Provider value={{ isAuthenticated: !!user, user, login, logout, loading }}>
      {children}
    </AuthContext.Provider>
  )
}
