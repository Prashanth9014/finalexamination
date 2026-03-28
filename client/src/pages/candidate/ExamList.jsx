import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { useAuth } from '../../context/AuthContext'
import Navbar from '../../components/Navbar'
import { examService } from '../../services/examService'
import './Candidate.css'

const ExamList = () => {
  const navigate = useNavigate()
  const { user } = useAuth()
  const [exams, setExams] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')

  // Get selected language from localStorage
  const selectedLanguage = localStorage.getItem('selectedLanguage')

  useEffect(() => {
    fetchExams()
  }, [])

  const fetchExams = async () => {
    try {
      const data = await examService.getAllExams(selectedLanguage)
      setExams(data)
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to fetch exams')
    } finally {
      setLoading(false)
    }
  }

  const handleStartExam = (examId, attemptStatus) => {
    if (attemptStatus === 'submitted' || attemptStatus === 'in-progress') {
      alert('You have already attempted this exam. Only one attempt is allowed.')
      return
    }
    navigate(`/candidate/exam/${examId}/instructions`)
  }

  const getButtonText = (attemptStatus) => {
    if (attemptStatus === 'submitted' || attemptStatus === 'in-progress') {
      return 'Already Attempted'
    }
    return 'Attempt Exam'
  }

  const getButtonClass = (attemptStatus) => {
    if (attemptStatus === 'submitted' || attemptStatus === 'in-progress') {
      return 'btn btn-secondary'
    }
    return 'btn btn-primary'
  }

  if (loading) {
    return (
      <div>
        <Navbar />
        <div className="container">
          <div className="loading">Loading exams...</div>
        </div>
      </div>
    )
  }

  return (
    <div>
      <Navbar />
      <div className="container">
        <div className="page-header">
          <h1>Available Exams</h1>
          <button onClick={() => navigate('/candidate')} className="btn btn-secondary">
            Back to Dashboard
          </button>
        </div>

        {error && <div className="error-message">{error}</div>}

        {/* Global Block Verification */}
        {(() => {
          const hasAttemptedAny = exams.some(exam => exam.attemptStatus === 'submitted')
          // Optional chaining to safely check boolean flag 'canReattempt' if loaded in context later
          const blockActive = hasAttemptedAny && user?.canReattempt !== true

          if (blockActive) {
            return (
              <div className="card" style={{ padding: '40px', textAlign: 'center', backgroundColor: '#fff3cd', border: '1px solid #ffeeba', whiteSpace: 'pre-line' }}>
                <h2 style={{ color: '#856404', marginBottom: '16px' }}>Attempt Limit Reached</h2>
                <p style={{ color: '#856404', fontSize: '18px' }}>
                  {`You have already attempted an exam with this account.\n\nEach candidate is allowed to take only one exam.\n\nIf you wish to reattempt, please contact the admin.`}
                </p>
              </div>
            )
          }

          // Normal exam listing logic below...
          // Filter exams by selected language
          const filteredExams = selectedLanguage 
            ? exams.filter((exam) => exam.language === selectedLanguage)
            : exams

          return filteredExams.length === 0 ? (
            <div className="card">
              <p style={{ textAlign: 'center', color: '#7f8c8d' }}>
                {selectedLanguage 
                  ? `No ${selectedLanguage} exams available at the moment.`
                  : 'No exams available at the moment.'
                }
              </p>
            </div>
          ) : (
            <div>
              {filteredExams.map((exam) => (
              <div key={exam._id} className="exam-card">
                <h3>{exam.title}</h3>
                <p>{exam.description}</p>
                
                <div className="exam-meta">
                  <span>⏱️ Duration: {exam.duration} minutes</span>
                  {exam.language && (
                    <span style={{ marginLeft: '16px', color: '#4caf50', fontWeight: 'bold' }}>
                      💻 Language: {exam.language}
                    </span>
                  )}
                  {exam.attemptStatus && (
                    <span style={{
                      marginLeft: '16px',
                      padding: '4px 12px',
                      borderRadius: '12px',
                      fontSize: '12px',
                      fontWeight: 'bold',
                      backgroundColor: exam.attemptStatus === 'submitted' ? '#f8d7da' : exam.attemptStatus === 'in-progress' ? '#fff3cd' : '#d4edda',
                      color: exam.attemptStatus === 'submitted' ? '#721c24' : exam.attemptStatus === 'in-progress' ? '#856404' : '#155724',
                    }}>
                      {exam.attemptStatus === 'submitted' ? '✓ Completed' : exam.attemptStatus === 'in-progress' ? '⏸ In Progress' : '○ Not Attempted'}
                    </span>
                  )}
                </div>

                <button
                  onClick={() => handleStartExam(exam._id, exam.attemptStatus)}
                  className={getButtonClass(exam.attemptStatus)}
                  disabled={exam.attemptStatus === 'submitted' || exam.attemptStatus === 'in-progress'}
                  style={{
                    cursor: (exam.attemptStatus === 'submitted' || exam.attemptStatus === 'in-progress') ? 'not-allowed' : 'pointer',
                    opacity: (exam.attemptStatus === 'submitted' || exam.attemptStatus === 'in-progress') ? 0.6 : 1
                  }}
                >
                  {getButtonText(exam.attemptStatus)}
                </button>
              </div>
            ))}
          </div>
        )
        })()}
      </div>
    </div>
  )
}

export default ExamList
