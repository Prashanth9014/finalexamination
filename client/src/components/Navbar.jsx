import { Link, useNavigate } from 'react-router-dom'
import { useAuth } from '../context/AuthContext'
import './Navbar.css'

const Navbar = () => {
  const { user, logout, isSuperadmin, isAdmin } = useAuth()
  const navigate = useNavigate()

  const handleLogout = () => {
    logout()
    navigate('/login')
  }

  return (
    <nav className="navbar">
      <div className="navbar-container">
        <Link to={isSuperadmin ? '/superadmin' : isAdmin ? '/admin' : '/candidate'} className="navbar-brand">
          Recruitment Exam System
        </Link>
        
        <div className="navbar-menu">
          {isSuperadmin ? (
            <>
              <Link to="/superadmin" className="navbar-link">Dashboard</Link>
              <Link to="/admin/manage-admins" className="navbar-link">Manage Admins</Link>
              <Link to="/admin/create-exam" className="navbar-link">Create Exam</Link>
              <Link to="/admin/exams" className="navbar-link">View Exams</Link>
              <Link to="/admin/submissions" className="navbar-link">Submissions</Link>
              <Link to="/admin/reports" className="navbar-link">Reports</Link>
            </>
          ) : isAdmin ? (
            <>
              <Link to="/admin" className="navbar-link">Dashboard</Link>
              <Link to="/admin/create-exam" className="navbar-link">Create Exam</Link>
              <Link to="/admin/exams" className="navbar-link">View Exams</Link>
              <Link to="/admin/submissions" className="navbar-link">Submissions</Link>
              <Link to="/admin/reports" className="navbar-link">Reports</Link>
            </>
          ) : (
            <>
              <Link to="/candidate" className="navbar-link">Dashboard</Link>
              <Link to="/candidate/submissions" className="navbar-link">My Submissions</Link>
            </>
          )}
          
          <div className="navbar-user">
            <span className="user-name">{user?.name}</span>
            <span className="user-role">({user?.role})</span>
            <button onClick={handleLogout} className="btn btn-secondary btn-sm">
              Logout
            </button>
          </div>
        </div>
      </div>
    </nav>
  )
}

export default Navbar
