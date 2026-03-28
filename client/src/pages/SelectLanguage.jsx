import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import './Auth.css'

const SelectLanguage = () => {
  const [selectedLanguage, setSelectedLanguage] = useState('')
  const [error, setError] = useState('')
  const navigate = useNavigate()

  const handleLanguageChange = (e) => {
    setSelectedLanguage(e.target.value)
    setError('')
  }

  const handleContinue = () => {
    if (!selectedLanguage) {
      setError('Please select a programming language to continue.')
      return
    }

    // Store selected language in localStorage
    localStorage.setItem('selectedLanguage', selectedLanguage)
    
    // Navigate to exam list page
    navigate('/candidate/exams', { replace: true })
  }

  return (
    <div className="auth-container">
      <div className="auth-card">
        <div className="auth-header">
          <h1>Select Programming Language</h1>
          <p>Choose your preferred programming language for exams</p>
        </div>

        <div className="auth-form">
          {error && <div className="error-message">{error}</div>}

          <div className="form-group">
            <label htmlFor="language">Programming Language</label>
            <select
              id="language"
              name="language"
              value={selectedLanguage}
              onChange={handleLanguageChange}
              required
            >
              <option value="">Select your programming language</option>
              <option value="Python">Python</option>
              <option value="Java">Java</option>
              <option value="C">C</option>
              <option value="C++">C++</option>
            </select>
          </div>

          <button
            onClick={handleContinue}
            className="btn btn-primary btn-block"
            disabled={!selectedLanguage}
          >
            Continue to Exams
          </button>
        </div>
      </div>
    </div>
  )
}

export default SelectLanguage