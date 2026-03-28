import { createContext, useState, useContext, useEffect } from 'react'
import { authService } from '../services/authService'

const AuthContext = createContext(null)

export const useAuth = () => {
  const context = useContext(AuthContext)
  if (!context) {
    throw new Error('useAuth must be used within AuthProvider')
  }
  return context
}

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    // Load user from sessionStorage on mount
    const token = authService.getToken()
    const currentUser = authService.getCurrentUser()
    
    if (token && currentUser) {
      setUser(currentUser)
    } else {
      // Clear invalid state
      authService.logout()
    }
    
    setLoading(false)
  }, [])

  const login = async (credentials) => {
    const data = await authService.login(credentials)
    setUser(data.user)
    return data
  }

  const register = async (userData) => {
    const data = await authService.register(userData)
    setUser(data.user)
    return data
  }

  const verifyOtp = async (data) => {
    const response = await authService.verifyOtp(data)
    setUser(response.user)
    return response
  }

  const logout = () => {
    authService.logout()
    setUser(null)
  }

  const value = {
    user,
    login,
    register,
    logout,
    verifyOtp,
    isAuthenticated: !!user,
    isSuperadmin: user?.role === 'superadmin',
    isAdmin: user?.role === 'admin',
    isCandidate: user?.role === 'candidate',
  }

  if (loading) {
    return <div className="loading">Loading...</div>
  }

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>
}
