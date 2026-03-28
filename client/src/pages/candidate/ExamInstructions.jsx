import { useState, useEffect } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import Navbar from '../../components/Navbar'
import { examService } from '../../services/examService'
import './Candidate.css'

const ExamInstructions = () => {
  const { examId } = useParams()
  const navigate = useNavigate()
  const [exam, setExam] = useState(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [agreed, setAgreed] = useState(false)

  useEffect(() => {
    fetchExamDetails()
  }, [examId])

  const fetchExamDetails = async () => {
    try {
      setLoading(true)
      setError('')
      
      // Fetch basic exam details (not secure exam content)
      const data = await examService.getExamById(examId)
      setExam(data)
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to fetch exam details')
    } finally {
      setLoading(false)
    }
  }

  const handleStartExam = () => {
    if (!agreed) {
      alert('Please agree to the instructions before starting the exam.')
      return
    }
    
    // Navigate to the actual exam page
    navigate(`/candidate/exam/${examId}`)
  }

  const handleBackToExams = () => {
    navigate('/candidate/exams')
  }

  if (loading) {
    return (
      <div>
        <Navbar />
        <div className="container">
          <div className="loading">Loading exam details...</div>
        </div>
      </div>
    )
  }

  if (error) {
    return (
      <div>
        <Navbar />
        <div className="container">
          <div className="error-message">{error}</div>
          <button onClick={handleBackToExams} className="btn btn-secondary">
            Back to Exams
          </button>
        </div>
      </div>
    )
  }

  return (
    <div>
      <Navbar />
      <div className="container">
        <div className="page-header">
          <h1>Exam Instructions</h1>
          <button onClick={handleBackToExams} className="btn btn-secondary">
            Back to Exams
          </button>
        </div>

        {exam && (
          <div className="card" style={{ marginBottom: '24px' }}>
            <h2 style={{ color: '#2c3e50', marginBottom: '16px' }}>{exam.title}</h2>
            <p style={{ color: '#7f8c8d', marginBottom: '8px' }}>{exam.description}</p>
            <div style={{ display: 'flex', gap: '24px', marginBottom: '16px' }}>
              <span style={{ color: '#3498db', fontWeight: 'bold' }}>
                ⏱️ Duration: {exam.duration} minutes
              </span>
              {exam.language && (
                <span style={{ color: '#4caf50', fontWeight: 'bold' }}>
                  💻 Language: {exam.language}
                </span>
              )}
            </div>
          </div>
        )}

        <div className="card">
          <h3 style={{ color: '#e74c3c', marginBottom: '20px' }}>
            📋 Please Read These Instructions Carefully
          </h3>
          
          <div style={{ lineHeight: '1.8', marginBottom: '24px' }}>
            <ol style={{ paddingLeft: '20px' }}>
              <li style={{ marginBottom: '12px' }}>
                <strong>Single Attempt Policy:</strong> You can attempt this exam only once. Make sure you are ready before starting.
              </li>
              
              <li style={{ marginBottom: '12px' }}>
                <strong>Full-Screen Mode:</strong> The exam will automatically enter full-screen mode. You must remain in full-screen throughout the exam.
              </li>
              
              <li style={{ marginBottom: '12px' }}>
                <strong>Internet Connection:</strong> Ensure you have a stable internet connection. Connection loss may affect your exam progress.
              </li>
              
              <li style={{ marginBottom: '12px' }}>
                <strong>Exam Structure:</strong> The exam contains multiple sections including MCQ (Multiple Choice Questions) and Coding sections.
              </li>
              
              <li style={{ marginBottom: '12px' }}>
                <strong>Auto-Save Feature:</strong> MCQ answers are automatically saved when you select an option and will persist even after page refresh or reload. You can modify your answers anytime before final submission. For coding questions, please use the "Save Code" button to save your progress.
              </li>
              
              <li style={{ marginBottom: '12px' }}>
                <strong>Navigation Restrictions:</strong> Do not use browser back/forward buttons or refresh the page during the exam.
              </li>
              
              <li style={{ marginBottom: '12px' }}>
                <strong>Coding Guidelines:</strong> Write clean, well-commented code. Test your solutions before saving.
              </li>
              
              <li style={{ marginBottom: '12px' }}>
                <strong>Time Management:</strong> Keep track of time. The exam will auto-submit when time expires.
              </li>
              
              <li style={{ marginBottom: '12px' }}>
                <strong>Technical Requirements:</strong> Use a modern browser (Chrome, Firefox, Safari, Edge) with JavaScript enabled.
              </li>
              
              <li style={{ marginBottom: '12px' }}>
                <strong>Support:</strong> If you encounter technical issues, contact the administrator immediately.
              </li>
            </ol>
          </div>

          <div style={{ 
            backgroundColor: '#fff3cd', 
            border: '1px solid #ffeeba', 
            borderRadius: '4px',
            padding: '16px',
            marginBottom: '24px'
          }}>
            <p style={{ 
              color: '#856404', 
              margin: 0, 
              fontWeight: 'bold',
              textAlign: 'center'
            }}>
              ⚠️ Important: Once you start the exam, the timer will begin and cannot be paused.
            </p>
          </div>

          <div style={{ 
            display: 'flex', 
            alignItems: 'center', 
            gap: '12px',
            marginBottom: '24px',
            padding: '16px',
            backgroundColor: '#f8f9fa',
            borderRadius: '4px',
            border: '1px solid #dee2e6'
          }}>
            <input
              type="checkbox"
              id="agreeInstructions"
              checked={agreed}
              onChange={(e) => setAgreed(e.target.checked)}
              style={{ 
                width: '18px', 
                height: '18px',
                cursor: 'pointer'
              }}
            />
            <label 
              htmlFor="agreeInstructions" 
              style={{ 
                cursor: 'pointer',
                fontWeight: 'bold',
                color: '#2c3e50'
              }}
            >
              I have read and understood all the instructions above, and I agree to follow them during the exam.
            </label>
          </div>

          <div style={{ textAlign: 'center' }}>
            <button
              onClick={handleStartExam}
              className="btn btn-success"
              disabled={!agreed}
              style={{
                padding: '12px 32px',
                fontSize: '16px',
                fontWeight: 'bold',
                cursor: agreed ? 'pointer' : 'not-allowed',
                opacity: agreed ? 1 : 0.6
              }}
            >
              {agreed ? '🚀 Start Exam' : '📋 Please Agree to Instructions'}
            </button>
          </div>
        </div>
      </div>
    </div>
  )
}

export default ExamInstructions