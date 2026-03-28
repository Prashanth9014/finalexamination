import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import Navbar from '../../components/Navbar'
import { examService } from '../../services/examService'
import './Admin.css'

const ViewExams = () => {
  const navigate = useNavigate()
  const [exams, setExams] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')

  useEffect(() => {
    fetchExams()
  }, [])

  const fetchExams = async () => {
    try {
      const data = await examService.getAllExams()
      setExams(data)
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to fetch exams')
    } finally {
      setLoading(false)
    }
  }

  const handleDelete = async (id) => {
    if (!window.confirm('Are you sure you want to delete this exam?')) {
      return
    }

    try {
      await examService.deleteExam(id)
      setExams(exams.filter((exam) => exam._id !== id))
    } catch (err) {
      alert(err.response?.data?.message || 'Failed to delete exam')
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
          <h1>All Exams</h1>
          <button onClick={() => navigate('/admin/create-exam')} className="btn btn-primary">
            + Create New Exam
          </button>
        </div>

        {error && <div className="error-message">{error}</div>}

        {exams.length === 0 ? (
          <div className="card">
            <p style={{ textAlign: 'center', color: '#7f8c8d' }}>
              No exams found. Create your first exam!
            </p>
          </div>
        ) : (
          <div className="card">
            <table className="table">
              <thead>
                <tr>
                  <th>Title</th>
                  <th>Description</th>
                  <th>Programming Language</th>
                  <th>Creation Time</th>
                  <th>Duration</th>
                  <th>Status</th>
                  <th>Actions</th>
                </tr>
              </thead>
              <tbody>
                {exams.map((exam) => (
                  <tr key={exam._id}>
                    <td>{exam.title}</td>
                    <td>{exam.description}</td>
                    <td>{exam.language || 'N/A'}</td>
                    <td>{formatDate(exam.createdAt)}</td>
                    <td>{exam.duration} min</td>
                    <td>
                      <span
                        style={{
                          padding: '4px 12px',
                          borderRadius: '12px',
                          fontSize: '12px',
                          fontWeight: 'bold',
                          backgroundColor: exam.status === 'created' ? '#d4edda' : '#fff3cd',
                          color: exam.status === 'created' ? '#155724' : '#856404',
                        }}
                      >
                        {exam.status === 'created' ? '✓ Created' : '📝 Draft'}
                      </span>
                    </td>
                    <td>
                      {exam.status === 'draft' ? (
                        <>
                          <button
                            onClick={() => navigate(`/admin/create-exam?resume=${exam._id}`)}
                            className="btn btn-primary btn-sm"
                            style={{ marginRight: '8px' }}
                          >
                            Resume Creation
                          </button>
                          <button
                            onClick={() => handleDelete(exam._id)}
                            className="btn btn-danger btn-sm"
                          >
                            Delete
                          </button>
                        </>
                      ) : (
                        <button
                          onClick={() => handleDelete(exam._id)}
                          className="btn btn-danger btn-sm"
                        >
                          Delete
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

export default ViewExams
