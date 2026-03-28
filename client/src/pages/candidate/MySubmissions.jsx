import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import Navbar from '../../components/Navbar'
import { submissionService } from '../../services/submissionService'
import './Candidate.css'

const MySubmissions = () => {
  const navigate = useNavigate()
  const [submissions, setSubmissions] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')

  useEffect(() => {
    fetchSubmissions()
  }, [])

  const fetchSubmissions = async () => {
    try {
      const data = await submissionService.getMySubmissions()
      setSubmissions(data)
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to fetch submissions')
    } finally {
      setLoading(false)
    }
  }

  const formatDate = (dateString) => {
    return new Date(dateString).toLocaleString()
  }

  if (loading) {
    return (
      <div>
        <Navbar />
        <div className="container">
          <div className="loading">Loading submissions...</div>
        </div>
      </div>
    )
  }

  return (
    <div>
      <Navbar />
      <div className="container">
        <div className="page-header">
          <h1>My Submissions</h1>
          <button onClick={() => navigate('/candidate')} className="btn btn-secondary">
            Back to Dashboard
          </button>
        </div>

        {error && <div className="error-message">{error}</div>}

        {submissions.length === 0 ? (
          <div className="card">
            <p style={{ textAlign: 'center', color: '#7f8c8d' }}>
              You haven't submitted any exams yet.
            </p>
          </div>
        ) : (
          <div className="card">
            <table className="table">
              <thead>
                <tr>
                  <th>Exam</th>
                  <th>Status</th>
                  <th>Started At</th>
                  <th>Submitted At</th>
                  <th>Actions</th>
                </tr>
              </thead>
              <tbody>
                {submissions.map((submission) => (
                  <tr key={submission._id}>
                    <td>{submission.examId?.title || 'N/A'}</td>
                    <td>
                      <span
                        style={{
                          padding: '4px 8px',
                          borderRadius: '4px',
                          fontSize: '12px',
                          fontWeight: '600',
                          backgroundColor:
                            submission.status === 'submitted' ? '#d4edda' : '#fff3cd',
                          color: submission.status === 'submitted' ? '#155724' : '#856404',
                        }}
                      >
                        {submission.status}
                      </span>
                    </td>
                    <td style={{ fontSize: '13px' }}>{formatDate(submission.startedAt)}</td>
                    <td style={{ fontSize: '13px' }}>
                      {submission.submittedAt ? formatDate(submission.submittedAt) : '-'}
                    </td>
                    <td>
                      {submission.status === 'submitted' && (
                        <button
                          onClick={() => navigate(`/candidate/result/${submission._id}`)}
                          className="btn btn-primary btn-sm"
                        >
                          View Result
                        </button>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  )
}

export default MySubmissions
