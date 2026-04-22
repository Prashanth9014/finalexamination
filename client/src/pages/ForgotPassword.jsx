import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import api from '../services/api'
import './Auth.css'

const ForgotPassword = () => {
  const [email, setEmail] = useState('')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const [step, setStep] = useState('email') // 'email', 'success', 'not-found'
  const navigate = useNavigate()

  const handleEmailCheck = async (e) => {
    e.preventDefault()
    setError('')
    setLoading(true)

    try {
      // First check if email exists
      const checkResponse = await api.post('/auth/check-email', { email })
      
      if (checkResponse.data.exists) {
        // Email exists, send reset link
        await api.post('/auth/forgot-password', { email })
        setStep('success')
      } else {
        // Email doesn't exist, show registration option
        setStep('not-found')
      }
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to process request. Please try again.')
    } finally {
      setLoading(false)
    }
  }

  const handleBackToLogin = () => {
    navigate('/login')
  }

  const handleGoToRegister = () => {
    navigate('/register')
  }

  // Success state - email sent
  if (step === 'success') {
    return (
      <div className="auth-container">
        <div className="auth-card">
          <div className="auth-header">
            <h1>✅ Reset Link Sent</h1>
          </div>
          <div className="success-message">
            <p style={{ fontSize: '16px', marginBottom: '16px', color: '#27ae60' }}>
              Password reset link has been sent to:
            </p>
            <p style={{ 
              fontSize: '18px', 
              fontWeight: 'bold', 
              marginBottom: '20px', 
              color: '#2c3e50',
              backgroundColor: '#f8f9fa',
              padding: '12px',
              borderRadius: '6px',
              border: '2px solid #e9ecef'
            }}>
              {email}
            </p>
            <p style={{ fontSize: '14px', color: '#7f8c8d', marginBottom: '24px' }}>
              Please check your email and click the reset link to create a new password.
              The link will expire in 15 minutes.
            </p>
            <button 
              onClick={handleBackToLogin}
              className="btn btn-primary btn-block"
              style={{ marginTop: '16px' }}
            >
              Back to Login
            </button>
          </div>
        </div>
      </div>
    )
  }

  // Not found state - email doesn't exist
  if (step === 'not-found') {
    return (
      <div className="auth-container">
        <div className="auth-card">
          <div className="auth-header">
            <h1>❌ Account Not Found</h1>
          </div>
          <div className="error-message" style={{ backgroundColor: '#fff3cd', border: '1px solid #ffeaa7', color: '#856404' }}>
            <p style={{ fontSize: '16px', marginBottom: '16px' }}>
              No account found with email address:
            </p>
            <p style={{ 
              fontSize: '18px', 
              fontWeight: 'bold', 
              marginBottom: '20px',
              backgroundColor: '#fff',
              padding: '12px',
              borderRadius: '6px',
              border: '1px solid #ffeaa7'
            }}>
              {email}
            </p>
            <p style={{ fontSize: '14px', marginBottom: '24px' }}>
              This email address is not registered in our system. Please check the email address or create a new account.
            </p>
            <div style={{ display: 'flex', gap: '12px', flexDirection: 'column' }}>
              <button 
                onClick={handleGoToRegister}
                className="btn btn-success btn-block"
              >
                Create New Account
              </button>
              <button 
                onClick={() => {
                  setStep('email')
                  setEmail('')
                  setError('')
                }}
                className="btn btn-secondary btn-block"
              >
                Try Different Email
              </button>
              <button 
                onClick={handleBackToLogin}
                className="btn btn-outline btn-block"
                style={{ 
                  backgroundColor: 'transparent', 
                  color: '#6c757d', 
                  border: '1px solid #6c757d' 
                }}
              >
                Back to Login
              </button>
            </div>
          </div>
        </div>
      </div>
    )
  }

  // Email input state
  return (
    <div className="auth-container">
      <div className="auth-card">
        <div className="auth-header">
          <h1>Forgot Password</h1>
          <p>Enter your email address to receive a password reset link</p>
        </div>

        <form onSubmit={handleEmailCheck} className="auth-form">
          {error && <div className="error-message">{error}</div>}

          <div className="form-group">
            <label htmlFor="email">Email Address</label>
            <input
              type="email"
              id="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="Enter your registered email"
              required
              disabled={loading}
              style={{ fontSize: '16px' }}
            />
          </div>

          <button
            type="submit"
            className="btn btn-primary btn-block"
            disabled={loading || !email}
          >
            {loading ? 'Checking...' : 'Send Reset Link'}
          </button>
        </form>

        <div className="auth-footer">
          <p>
            Remember your password?{' '}
            <a href="/login" className="auth-link">
              Sign in here
            </a>
          </p>
          <p>
            Don't have an account?{' '}
            <a href="/register" className="auth-link">
              Create account
            </a>
          </p>
        </div>
      </div>
    </div>
  )
}

export default ForgotPassword
