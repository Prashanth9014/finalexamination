import { useState, useEffect } from 'react'
import { useAuth } from '../../context/AuthContext'
import Navbar from '../../components/Navbar'
import './Admin.css'

const ManageAdmins = () => {
  const { user } = useAuth()
  const [admins, setAdmins] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [showCreateForm, setShowCreateForm] = useState(false)

  const [createFormData, setCreateFormData] = useState({
    name: '',
    email: '',
    password: ''
  })
  const [createLoading, setCreateLoading] = useState(false)
  const [createError, setCreateError] = useState('')

  useEffect(() => {
    fetchAdmins()
  }, [])

  const fetchAdmins = async () => {
    try {
      setLoading(true)
      const token = localStorage.getItem('token')
      const response = await fetch('/api/admins/list', {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        }
      })

      if (!response.ok) {
        throw new Error('Failed to fetch admins')
      }

      const data = await response.json()
      setAdmins(data.admins || [])
      setError('')
    } catch (err) {
      setError(err.message || 'Failed to fetch admins')
    } finally {
      setLoading(false)
    }
  }


  const handleCreateAdmin = async (e) => {
    e.preventDefault()
    setCreateError('')
    setCreateLoading(true)

    try {
      const token = localStorage.getItem('token')
      const response = await fetch('/api/admin/register', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({
          name: createFormData.name,
          email: createFormData.email,
          password: createFormData.password,
          role: 'admin'
        })
      })
      if (!response.ok) {
        const errorData = await response.json()
        throw new Error(errorData.message || 'Failed to create admin')
      }

      // Reset form and refresh admin list
      setCreateFormData({ name: '', email: '', password: '' })
      setShowCreateForm(false)
      await fetchAdmins()
      
      // Show success message
      alert(`Admin account created successfully!\n\nEmail: ${createFormData.email}\nPassword: ${createFormData.password}\n\nThe admin can now login directly and change their password using the "Forgot Password" feature if needed.`)
    } catch (err) {
      setCreateError(err.message || 'Failed to create admin')
    } finally {
      setCreateLoading(false)
    }
  }

  const handleDeleteAdmin = async (adminId) => {
    if (!confirm('Are you sure you want to delete this admin?')) {
      return
    }

    try {
      const token = localStorage.getItem('token')
      const response = await fetch(`/api/admins/${adminId}`, {
        method: 'DELETE',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        }
      })

      if (!response.ok) {
        throw new Error('Failed to delete admin')
      }

      await fetchAdmins()
    } catch (err) {
      setError(err.message || 'Failed to delete admin')
    }
  }


  return (
    <div className="admin-layout">
      <Navbar />
      <div className="admin-content">
        <div className="admin-header">
          <h1>Manage Admins</h1>
          <button 
            className="btn btn-primary"
            onClick={() => setShowCreateForm(true)}
          >
            Create New Admin
          </button>
        </div>

        {error && <div className="error-message">{error}</div>}

        {showCreateForm && (
          <div className="modal-overlay">
            <div className="modal-content">
              <h2>Create New Admin</h2>
              <form onSubmit={handleCreateAdmin}>
                {createError && <div className="error-message">{createError}</div>}
                
                <div className="form-group">
                  <label htmlFor="name">Full Name</label>
                  <input
                    type="text"
                    id="name"
                    value={createFormData.name}
                    onChange={(e) => setCreateFormData({...createFormData, name: e.target.value})}
                    required
                  />
                </div>

                <div className="form-group">
                  <label htmlFor="email">Email</label>
                  <input
                    type="email"
                    id="email"
                    value={createFormData.email}
                    onChange={(e) => setCreateFormData({...createFormData, email: e.target.value})}
                    required
                  />
                </div>

                <div className="form-group">
                  <label htmlFor="password">Password</label>
                  <input
                    type="password"
                    id="password"
                    value={createFormData.password}
                    onChange={(e) => setCreateFormData({...createFormData, password: e.target.value})}
                    minLength="6"
                    required
                  />
                </div>

                <div className="form-actions">
                  <button 
                    type="button" 
                    className="btn btn-secondary"
                    onClick={() => setShowCreateForm(false)}
                  >
                    Cancel
                  </button>
                  <button 
                    type="submit" 
                    className="btn btn-primary"
                    disabled={createLoading}
                  >
                    {createLoading ? 'Creating...' : 'Create Admin'}
                  </button>
                </div>
              </form>
            </div>
          </div>
        )}

        {loading ? (
          <div className="loading">Loading admins...</div>
        ) : (
          <div className="admin-table-container">
            <table className="admin-table">
              <thead>
                <tr>
                  <th>Name</th>
                  <th>Email</th>
                  <th>Role</th>
                  <th>Created At</th>
                  <th>Actions</th>
                </tr>
              </thead>
              <tbody>
                {admins.map((admin) => (
                  <tr key={admin._id}>
                    <td>{admin.name}</td>
                    <td>{admin.email}</td>
                    <td>{admin.role}</td>
                    <td>{new Date(admin.createdAt).toLocaleDateString()}</td>
                    <td>
                      {admin.role !== 'superadmin' && (
                        <button
                          className="btn btn-danger btn-sm"
                          onClick={() => handleDeleteAdmin(admin._id)}
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

export default ManageAdmins