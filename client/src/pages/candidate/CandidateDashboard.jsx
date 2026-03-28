import { useNavigate } from 'react-router-dom'
import { useAuth } from '../../context/AuthContext'
import Navbar from '../../components/Navbar'
import './Candidate.css'

const CandidateDashboard = () => {
  const navigate = useNavigate()
  const { user } = useAuth()

  return (
    <div>
      <Navbar />
      <div className="container">
        <div className="candidate-welcome">
          <h1>Welcome, {user?.name}!</h1>
          <p>Ready to take your examination?</p>
          <button
            onClick={() => navigate('/candidate/exams')}
            className="btn btn-primary"
            style={{ fontSize: '16px', padding: '14px 32px' }}
          >
            View Available Exams
          </button>
        </div>

        <div className="grid grid-2" style={{ marginTop: '40px' }}>
          <div className="dashboard-card" onClick={() => navigate('/candidate/exams')}>
            <div className="card-icon">📝</div>
            <h3>Available Exams</h3>
            <p>View and attempt exams</p>
          </div>

          <div className="dashboard-card" onClick={() => navigate('/candidate/submissions')}>
            <div className="card-icon">📊</div>
            <h3>My Submissions</h3>
            <p>View your exam results</p>
          </div>
        </div>
      </div>
    </div>
  )
}

export default CandidateDashboard
