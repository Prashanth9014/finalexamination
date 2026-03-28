import { useState } from 'react'
import { useNavigate, Link } from 'react-router-dom'
import { useAuth } from '../context/AuthContext'
import './Auth.css'

const Login = () => {
  const [formData, setFormData] = useState({
    email: '',
    password: '',
  })
  const [otpData, setOtpData] = useState({
    otp: '',
    email: '',
  })
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)
  const [showOtpInput, setShowOtpInput] = useState(false)
  const [otpMessage, setOtpMessage] = useState('')

  const { login, verifyOtp } = useAuth()
  const navigate = useNavigate()

  const handleChange = (e) => {
    if (showOtpInput) {
      setOtpData({
        ...otpData,
        [e.target.name]: e.target.value,
      })
    } else {
      setFormData({
        ...formData,
        [e.target.name]: e.target.value,
      })
    }
    setError('')
  }

  const handleSubmit = async (e) => {
    e.preventDefault()
    setError('')
    setLoading(true)

    try {
      const data = await login(formData)
      
      // Check if OTP is required (superadmin)
      if (data.requiresOtp) {
        setShowOtpInput(true)
        setOtpMessage(data.message)
        setOtpData({ ...otpData, email: formData.email })
        setLoading(false)
        return
      }
      
      // Normal login flow for admin/candidate
      // Small delay to ensure state is updated
      setTimeout(() => {
        // Redirect based on role
        if (data.user.role === 'superadmin') {
          navigate('/superadmin', { replace: true })
        } else if (data.user.role === 'admin') {
          navigate('/admin', { replace: true })
        } else {
          navigate('/select-language', { replace: true })
        }
      }, 100)
    } catch (err) {
      setError(err.response?.data?.message || 'Login failed. Please try again.')
      setLoading(false)
    }
  }

  const handleOtpSubmit = async (e) => {
    e.preventDefault()
    setError('')
    setLoading(true)

    try {
      await verifyOtp(otpData)

      // Redirect to superadmin dashboard
      setTimeout(() => {
        navigate('/superadmin', { replace: true })
      }, 100)
    } catch (err) {
      setError(err.response?.data?.message || err.message || 'OTP verification failed. Please try again.')
      setLoading(false)
    }
  }

  const handleBackToLogin = () => {
    setShowOtpInput(false)
    setOtpMessage('')
    setOtpData({ otp: '', email: '' })
    setError('')
    setLoading(false)
  }

  return (
    <div className="auth-container">
      <div className="auth-card">
        <div className="auth-header">
          <h1>{showOtpInput ? 'Enter OTP' : 'Welcome Back'}</h1>
          <p>{showOtpInput ? 'Check your email for the verification code' : 'Sign in to your account'}</p>
        </div>

        {showOtpInput ? (
          // OTP Input Form
          <form onSubmit={handleOtpSubmit} className="auth-form">
            {error && <div className="error-message">{error}</div>}
            {otpMessage && <div className="success-message">{otpMessage}</div>}

            <div className="form-group">
              <label htmlFor="otp">Enter 6-digit OTP</label>
              <input
                type="text"
                id="otp"
                name="otp"
                value={otpData.otp}
                onChange={handleChange}
                placeholder="000000"
                maxLength="6"
                pattern="[0-9]{6}"
                required
                style={{ textAlign: 'center', fontSize: '18px', letterSpacing: '2px' }}
              />
            </div>

            <button
              type="submit"
              className="btn btn-primary btn-block"
              disabled={loading || otpData.otp.length !== 6}
            >
              {loading ? 'Verifying...' : 'Verify OTP'}
            </button>

            <button
              type="button"
              onClick={handleBackToLogin}
              className="btn btn-secondary btn-block"
              style={{ marginTop: '10px' }}
            >
              Back to Login
            </button>
          </form>
        ) : (
          // Normal Login Form
          <form onSubmit={handleSubmit} className="auth-form">
            {error && <div className="error-message">{error}</div>}

            <div className="form-group">
              <label htmlFor="email">Email Address</label>
              <input
                type="email"
                id="email"
                name="email"
                value={formData.email}
                onChange={handleChange}
                placeholder="Enter your email"
                required
              />
            </div>

            <div className="form-group">
              <label htmlFor="password">Password</label>
              <input
                type="password"
                id="password"
                name="password"
                value={formData.password}
                onChange={handleChange}
                placeholder="Enter your password"
                required
              />
            </div>

            <button
              type="submit"
              className="btn btn-primary btn-block"
              disabled={loading}
            >
              {loading ? 'Signing in...' : 'Sign In'}
            </button>
          </form>
        )}

        {!showOtpInput && (
          <div className="auth-footer">
            <p>
              Don't have an account?{' '}
              <Link to="/register" className="auth-link">
                Register here
              </Link>
            </p>
            <p>
              <Link to="/forgot-password" className="auth-link">
                Forgot your password?
              </Link>
            </p>
          </div>
        )}
      </div>
    </div>
  )
}

export default Login
