import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import Navbar from '../../components/Navbar'
import { submissionService } from '../../services/submissionService'
import './Admin.css'

const ViewSubmissions = () => {
  const navigate = useNavigate()
  const [submissions, setSubmissions] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [resetting, setResetting] = useState({})

  useEffect(() => {
    fetchSubmissions()
  }, [])

  const fetchSubmissions = async () => {
    try {
      const data = await submissionService.getAllSubmissions()
      
      // Additional frontend deduplication as safety measure
      // Group by userId + examId and prioritize 'submitted' status
      const submissionMap = new Map()
      
      data.forEach(submission => {
        const userId = submission.userId?._id || submission.userId
        const examId = submission.examId?._id || submission.examId
        
        if (!userId || !examId) return
        
        const key = `${userId}-${examId}`
        const existing = submissionMap.get(key)
        
        // Prioritize 'submitted' over 'in-progress'
        if (!existing || (existing.status === 'in-progress' && submission.status === 'submitted')) {
          submissionMap.set(key, submission)
        }
      })
      
      // Convert map to array and sort by creation date
      const uniqueSubmissions = Array.from(submissionMap.values()).sort((a, b) => {
        return new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
      })
      
      console.log('Total submissions from API:', data.length)
      console.log('Unique submissions after frontend filter:', uniqueSubmissions.length)
      
      setSubmissions(uniqueSubmissions)
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to fetch submissions')
    } finally {
      setLoading(false)
    }
  }

  const handleResetAttempt = async (submissionId, candidateName) => {
    if (!window.confirm(`Are you sure you want to reset the exam attempt for ${candidateName}? This will allow them to reattempt the exam.`)) {
      return
    }

    setResetting({ ...resetting, [submissionId]: true })

    try {
      const result = await submissionService.resetCandidateAttempt(submissionId)
      
      alert('Exam attempt has been reset successfully. The candidate can now reattempt the exam.')
      
      // Refresh submissions list
      await fetchSubmissions()
    } catch (err) {
      console.error('Reset attempt error:', err)
      alert(err.response?.data?.message || err.message || 'Failed to reset exam attempt')
    } finally {
      setResetting({ ...resetting, [submissionId]: false })
    }
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
          <h1>All Submissions</h1>
          <button onClick={() => navigate('/admin')} className="btn btn-secondary">
            Back to Dashboard
          </button>
        </div>

        {error && <div className="error-message">{error}</div>}

        {submissions.length === 0 ? (
          <div className="card">
            <p style={{ textAlign: 'center', color: '#7f8c8d' }}>
              No submissions yet.
            </p>
          </div>
        ) : (
          <div className="card">
            <div style={{ overflowX: 'auto' }}>
              <table className="table" style={{ minWidth: '1000px' }}>
                <thead>
                  <tr>
                    <th style={{ minWidth: '120px' }}>Candidate Name</th>
                    <th style={{ minWidth: '180px' }}>Email</th>
                    <th style={{ minWidth: '150px' }}>Exam Name</th>
                    <th style={{ minWidth: '120px' }}>Aptitude</th>
                    <th style={{ minWidth: '120px' }}>Reasoning</th>
                    <th style={{ minWidth: '120px' }}>Technical</th>
                    <th style={{ minWidth: '100px' }}>Coding</th>
                    <th style={{ minWidth: '120px' }}>Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {submissions.map((submission) => {
                    const correctAnswers = submission.correctAnswers || { aptitude: 0, reasoning: 0, technical: 0 }
                    const questionCounts = submission.questionCounts || { aptitude: 0, reasoning: 0, technical: 0, coding: 0 }
                    const codingSubmitted = submission.codingSubmitted || 0

                    return (
                      <tr key={submission._id}>
                        <td style={{ whiteSpace: 'nowrap' }}>{submission.userId?.name || 'N/A'}</td>
                        <td style={{ fontSize: '13px' }}>{submission.userId?.email || 'N/A'}</td>
                        <td>{submission.examId?.title || 'N/A'}</td>
                        <td>
                          {questionCounts.aptitude > 0 ? (
                            <span>
                              <strong>{correctAnswers.aptitude}</strong> / {questionCounts.aptitude} correct
                            </span>
                          ) : (
                            <span style={{ color: '#6c757d' }}>-</span>
                          )}
                        </td>
                        <td>
                          {questionCounts.reasoning > 0 ? (
                            <span>
                              <strong>{correctAnswers.reasoning}</strong> / {questionCounts.reasoning} correct
                            </span>
                          ) : (
                            <span style={{ color: '#6c757d' }}>-</span>
                          )}
                        </td>
                        <td>
                          {questionCounts.technical > 0 ? (
                            <span>
                              <strong>{correctAnswers.technical}</strong> / {questionCounts.technical} correct
                            </span>
                          ) : (
                            <span style={{ color: '#6c757d' }}>-</span>
                          )}
                        </td>
                        <td>
                          {questionCounts.coding > 0 ? (
                            <button
                              onClick={() => navigate(`/admin/submissions/${submission._id}/coding`)}
                              className="btn btn-primary btn-sm"
                              style={{ fontSize: '12px', padding: '4px 12px' }}
                            >
                              View ({codingSubmitted}/{questionCounts.coding})
                            </button>
                          ) : (
                            <span style={{ color: '#6c757d' }}>-</span>
                          )}
                        </td>
                        <td>
                          <button
                            onClick={() => handleResetAttempt(submission._id, submission.userId?.name)}
                            className="btn btn-warning btn-sm"
                            style={{ fontSize: '12px', padding: '4px 12px' }}
                            disabled={resetting[submission._id]}
                          >
                            {resetting[submission._id] ? 'Resetting...' : 'Reset Attempt'}
                          </button>
                        </td>
                      </tr>
                    )
                  })}
                </tbody>
              </table>
            </div>
          </div>
        )}
      </div>
    </div>
  )
}

export default ViewSubmissions
