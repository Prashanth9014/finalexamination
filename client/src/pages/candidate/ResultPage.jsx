import { useState, useEffect } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import Navbar from '../../components/Navbar'
import { submissionService } from '../../services/submissionService'
import './Candidate.css'

const ResultPage = () => {
  const { submissionId } = useParams()
  const navigate = useNavigate()
  const [submission, setSubmission] = useState(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')

  useEffect(() => {
    fetchResult()
  }, [submissionId])

  const fetchResult = async () => {
    try {
      const data = await submissionService.getSubmissionById(submissionId)
      setSubmission(data)
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to fetch result')
    } finally {
      setLoading(false)
    }
  }

  if (loading) {
    return (
      <div>
        <Navbar />
        <div className="container">
          <div className="loading">Loading result...</div>
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
          <button onClick={() => navigate('/candidate/submissions')} className="btn btn-secondary">
            Back to Submissions
          </button>
        </div>
      </div>
    )
  }

  const correctAnswers = submission.correctAnswers || { aptitude: 0, reasoning: 0, technical: 0 }
  const questionCounts = submission.questionCounts || { aptitude: 0, reasoning: 0, technical: 0, coding: 0 }
  const codingSubmitted = submission.codingSubmitted || 0

  return (
    <div>
      <Navbar />
      <div className="container">
        <div className="result-container">
          <div className="result-card">
            <div className="result-icon">
              📊
            </div>
            
            <div className="result-status">
              Exam Completed
            </div>

            <div className="result-details">
              <p>
                <span>Exam:</span>
                <strong>{submission.examId?.title}</strong>
              </p>
              <p>
                <span>Submitted At:</span>
                <strong>{submission.submittedAt ? new Date(submission.submittedAt).toLocaleString() : 'N/A'}</strong>
              </p>
            </div>

            {/* Section-wise Results */}
            <div className="section-scores" style={{ marginTop: '24px', marginBottom: '24px' }}>
              <h3 style={{ marginBottom: '16px', color: '#2c3e50' }}>Section Results</h3>
              <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
                {/* Aptitude */}
                {questionCounts.aptitude > 0 && (
                  <div style={{ 
                    padding: '16px', 
                    backgroundColor: '#f8f9fa', 
                    borderRadius: '8px',
                    border: '1px solid #dee2e6'
                  }}>
                    <div style={{ fontSize: '16px', fontWeight: '600', color: '#2c3e50', marginBottom: '8px' }}>
                      Aptitude
                    </div>
                    <div style={{ fontSize: '18px', color: '#495057' }}>
                      <strong>{correctAnswers.aptitude}</strong> correct out of <strong>{questionCounts.aptitude}</strong> questions
                    </div>
                  </div>
                )}

                {/* Reasoning */}
                {questionCounts.reasoning > 0 && (
                  <div style={{ 
                    padding: '16px', 
                    backgroundColor: '#f8f9fa', 
                    borderRadius: '8px',
                    border: '1px solid #dee2e6'
                  }}>
                    <div style={{ fontSize: '16px', fontWeight: '600', color: '#2c3e50', marginBottom: '8px' }}>
                      Reasoning
                    </div>
                    <div style={{ fontSize: '18px', color: '#495057' }}>
                      <strong>{correctAnswers.reasoning}</strong> correct out of <strong>{questionCounts.reasoning}</strong> questions
                    </div>
                  </div>
                )}

                {/* Technical */}
                {questionCounts.technical > 0 && (
                  <div style={{ 
                    padding: '16px', 
                    backgroundColor: '#f8f9fa', 
                    borderRadius: '8px',
                    border: '1px solid #dee2e6'
                  }}>
                    <div style={{ fontSize: '16px', fontWeight: '600', color: '#2c3e50', marginBottom: '8px' }}>
                      Technical
                    </div>
                    <div style={{ fontSize: '18px', color: '#495057' }}>
                      <strong>{correctAnswers.technical}</strong> correct out of <strong>{questionCounts.technical}</strong> questions
                    </div>
                  </div>
                )}

                {/* Coding */}
                {questionCounts.coding > 0 && (
                  <div style={{ 
                    padding: '16px', 
                    backgroundColor: '#fff3cd', 
                    borderRadius: '8px',
                    border: '1px solid #ffc107'
                  }}>
                    <div style={{ fontSize: '16px', fontWeight: '600', color: '#856404', marginBottom: '8px' }}>
                      Coding
                    </div>
                    <div style={{ fontSize: '18px', color: '#856404' }}>
                      <strong>{codingSubmitted}</strong> submitted out of <strong>{questionCounts.coding}</strong> coding questions
                    </div>
                    <div style={{ fontSize: '14px', color: '#856404', marginTop: '8px', fontStyle: 'italic' }}>
                      Note: Coding questions will be reviewed manually by the admin
                    </div>
                  </div>
                )}
              </div>
            </div>

            <div className="btn-group">
              <button
                onClick={() => navigate('/candidate/exams')}
                className="btn btn-primary"
              >
                Take Another Exam
              </button>
              <button
                onClick={() => navigate('/candidate/submissions')}
                className="btn btn-secondary"
              >
                View All Submissions
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}

export default ResultPage
