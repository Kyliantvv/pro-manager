import { createContext, useCallback, useContext, useEffect, useState } from 'react'
import api from '../services/api'

const AuthContext = createContext(null)

export function AuthProvider({ children }) {
  const [user, setUser]       = useState(null)
  const [token, setToken]     = useState(() => localStorage.getItem('token'))
  const [loading, setLoading] = useState(true)

  // Sync token to axios default headers
  useEffect(() => {
    if (token) {
      api.defaults.headers.common['Authorization'] = `Bearer ${token}`
      localStorage.setItem('token', token)
    } else {
      delete api.defaults.headers.common['Authorization']
      localStorage.removeItem('token')
    }
  }, [token])

  // Fetch current user on mount if token exists
  useEffect(() => {
    if (!token) {
      setLoading(false)
      return
    }
    api.get('/auth/me')
      .then(({ data }) => setUser(data.user))
      .catch(() => {
        setToken(null)
        setUser(null)
      })
      .finally(() => setLoading(false))
  }, []) // eslint-disable-line react-hooks/exhaustive-deps

  const login = useCallback(async (email, password) => {
    const { data } = await api.post('/auth/login', { email, password })
    setToken(data.token)
    api.defaults.headers.common['Authorization'] = `Bearer ${data.token}`
    localStorage.setItem('token', data.token)
    // Lexik JWT returns only { token }, so fetch user profile separately
    const { data: meData } = await api.get('/auth/me')
    setUser(meData.user)
    return data
  }, [])

  const register = useCallback(async (formData) => {
    const { data } = await api.post('/auth/register', formData)
    setToken(data.token)
    setUser(data.user)
    return data
  }, [])

  const logout = useCallback(() => {
    setToken(null)
    setUser(null)
  }, [])

  const updateUser = useCallback((updatedUser) => {
    setUser(updatedUser)
  }, [])

  return (
    <AuthContext.Provider value={{ user, token, loading, login, register, logout, updateUser }}>
      {children}
    </AuthContext.Provider>
  )
}

export function useAuth() {
  const ctx = useContext(AuthContext)
  if (!ctx) throw new Error('useAuth must be used inside AuthProvider')
  return ctx
}
