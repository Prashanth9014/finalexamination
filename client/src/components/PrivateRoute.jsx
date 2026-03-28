import { Navigate } from 'react-router-dom'
import { useAuth } from '../context/AuthContext'

const PrivateRoute = ({ children, role }) => {
  const { user, isAuthenticated } = useAuth()

  // Check authentication
  if (!isAuthenticated || !user) {
    return <Navigate to="/login" replace />
  }

  // Check role-based access
  if (role && user.role !== role) {
    // Handle superadmin access to admin routes
    if (role === 'admin' && user.role === 'superadmin') {
      return children
    }
    
    const redirectPath = user.role === 'superadmin' ? '/superadmin' : 
                        user.role === 'admin' ? '/admin' : '/candidate'
    return <Navigate to={redirectPath} replace />
  }

  return children
}

export default PrivateRoute
