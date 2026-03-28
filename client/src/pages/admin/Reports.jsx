import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import Navbar from '../../components/Navbar'
import { reportService } from '../../services/reportService'
import './Admin.css'

const Reports = () => {
  const navigate = useNavigate()
  const [language, setLanguage] = useState('Python')
  const [report, setReport] = useState([])
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')

  const languages = ['Python', 'Java', 'C', 'C++']

  useEffect(() => {
    fetchReport()
  }, [language])

  const fetchReport = async () => {
    try {
      setLoading(true)
      setError('')
      const data = await reportService.getProgrammingLanguageReport(language)
      setReport(data)
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to fetch report')
      setReport([])
    } finally {
      setLoading(false)
    }
  }

  if (loading) {
    return (
      <div>
        <Navbar />
        <div className="container">
          <div className="loading">Loading report...</div>
        </div>
      </div>
    )
  }

  return (
    <div>
      <Navbar />
      <div className="container">
        <div className="page-header">
          <h1>Programming Language-wise Report</h1>
          <button onClick={() => navigate('/admin')} className="btn btn-secondary">
            Back to Dashboard
          </button>
        </div>

        <div style={{ marginBottom: '24px' }}>
          <label htmlFor="language-filter" style={{ marginRight: '12px', fontWeight: 'bold' }}>
            Select Programming Language:
          </label>
          <select
            id="language-filter"
            value={language}
            onChange={(e) => setLanguage(e.target.value)}
            style={{
              padding: '8px 12px',
              borderRadius: '4px',
              border: '1px solid #ddd',
              fontSize: '14px',
              cursor: 'pointer',
            }}
          >
            {languages.map((lang) => (
              <option key={lang} value={lang}>
                {lang}
              </option>
            ))}
          </select>
        </div>

        {error && <div className="error-message">{error}</div>}

        {report.length === 0 ? (
          <div className="card">
            <p style={{ textAlign: 'center', color: '#7f8c8d' }}>
              No candidates found who attempted {language} exams.
            </p>
          </div>
        ) : (
          <div className="card">
            <div style={{ overflowX: 'auto' }}>
              <table style={{ width: '100%', borderCollapse: 'collapse' }}>
                <thead>
                  <tr style={{ backgroundColor: '#f5f5f5', borderBottom: '2px solid #ddd' }}>
                    <th style={{ padding: '12px', textAlign: 'left', fontWeight: 'bold' }}>Name</th>
                    <th style={{ padding: '12px', textAlign: 'left', fontWeight: 'bold' }}>Mail ID</th>
                    <th style={{ padding: '12px', textAlign: 'left', fontWeight: 'bold' }}>Registered</th>
                    <th style={{ padding: '12px', textAlign: 'left', fontWeight: 'bold' }}>Attempted</th>
                    <th style={{ padding: '12px', textAlign: 'left', fontWeight: 'bold' }}>Submitted Status</th>
                    <th style={{ padding: '12px', textAlign: 'left', fontWeight: 'bold' }}>Submitted At</th>
                  </tr>
                </thead>
                <tbody>
                  {report.map((row, index) => (
                    <tr
                      key={index}
                      style={{
                        borderBottom: '1px solid #eee',
                        backgroundColor: index % 2 === 0 ? '#fff' : '#f9f9f9',
                      }}
                    >
                      <td style={{ padding: '12px' }}>{row.name}</td>
                      <td style={{ padding: '12px' }}>{row.email}</td>
                      <td style={{ padding: '12px' }}>
                        <span
                          style={{
                            display: 'inline-block',
                            padding: '4px 8px',
                            borderRadius: '4px',
                            backgroundColor: '#d4edda',
                            color: '#155724',
                            fontSize: '12px',
                            fontWeight: 'bold',
                          }}
                        >
                          {row.registered}
                        </span>
                      </td>
                      <td style={{ padding: '12px' }}>
                        <span
                          style={{
                            display: 'inline-block',
                            padding: '4px 8px',
                            borderRadius: '4px',
                            backgroundColor: row.attempted === 'YES' ? '#d4edda' : '#f8d7da',
                            color: row.attempted === 'YES' ? '#155724' : '#721c24',
                            fontSize: '12px',
                            fontWeight: 'bold',
                          }}
                        >
                          {row.attempted}
                        </span>
                      </td>
                      <td style={{ padding: '12px' }}>
                        <span
                          style={{
                            display: 'inline-block',
                            padding: '4px 8px',
                            borderRadius: '4px',
                            backgroundColor: row.submittedStatus === 'Submitted' ? '#d4edda' : '#fff3cd',
                            color: row.submittedStatus === 'Submitted' ? '#155724' : '#856404',
                            fontSize: '12px',
                            fontWeight: 'bold',
                          }}
                        >
                          {row.submittedStatus}
                        </span>
                      </td>
                      <td style={{ padding: '12px' }}>{row.submittedAt}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
            <div style={{ marginTop: '16px', color: '#7f8c8d', fontSize: '14px' }}>
              Total Candidates: {report.length}
            </div>
          </div>
        )}
      </div>
    </div>
  )
}

export default Reports
