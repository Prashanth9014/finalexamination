import api from './api'

export const authService = {
  async register(data) {
    const response = await api.post('/auth/register', data)
    if (response.data.token) {
      sessionStorage.setItem('token', response.data.token)
      sessionStorage.setItem('user', JSON.stringify(response.data.user))
    }
    return response.data
  },

  async login(data) {
    const response = await api.post('/auth/login', data)
    if (response.data.token) {
      sessionStorage.setItem('token', response.data.token)
      sessionStorage.setItem('user', JSON.stringify(response.data.user))
    }
    return response.data
  },

  async verifyOtp(data) {
    const response = await api.post('/auth/verify-otp', data)
    if (response.data.token) {
      sessionStorage.setItem('token', response.data.token)
      sessionStorage.setItem('user', JSON.stringify(response.data.user))
    }
    return response.data
  },

  logout() {
    sessionStorage.removeItem('token')
    sessionStorage.removeItem('user')
  },

  getCurrentUser() {
    const userStr = sessionStorage.getItem('user')
    return userStr ? JSON.parse(userStr) : null
  },

  getToken() {
    return sessionStorage.getItem('token')
  },

  isAuthenticated() {
    return !!this.getToken()
  },
}
