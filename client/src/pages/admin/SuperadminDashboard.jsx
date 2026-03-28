import { Link } from 'react-router-dom'
import { useAuth } from '../../context/AuthContext'
import Navbar from '../../components/Navbar'
import './Admin.css'

const SuperadminDashboard = () => {
  const { user } = useAuth()

  return (
    <div className="admin-layout">
      <Navbar />
      <div className="admin-content">
        <div className="dashboard-header">
          <h1>Admin Dashboard</h1>
          <p>Manage exams and view submissions</p>
        </div>

        <div className="action-grid">
          <Link to="/admin/manage-admins" className="dashboard-card">
            <div className="card-icon">👥</div>
            <h3>Manage Admins</h3>
            <p>View, create, and delete admin accounts</p>
          </Link>

          <Link to="/admin/create-exam" className="dashboard-card">
            <div className="card-icon">📝</div>
            <h3>Create Exam</h3>
            <p>Create a new examination</p>
          </Link>

          <Link to="/admin/exams" className="dashboard-card">
            <div className="card-icon">📋</div>
            <h3>View Exams</h3>
            <p>Manage all examinations</p>
          </Link>

          <Link to="/admin/submissions" className="dashboard-card">
            <div className="card-icon">📊</div>
            <h3>Submissions</h3>
            <p>View candidate submissions</p>
          </Link>

          <Link to="/admin/reports" className="dashboard-card">
            <div className="card-icon">📈</div>
            <h3>Reports</h3>
            <p>Department-wise candidate reports</p>
          </Link>
        </div>
      </div>
    </div>
  )
}

export default SuperadminDashboard