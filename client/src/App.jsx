import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom'
import { AuthProvider } from './context/AuthContext'
import PrivateRoute from './components/PrivateRoute'
import Login from './pages/Login'
import Register from './pages/Register'
import SelectLanguage from './pages/SelectLanguage'
import ForgotPassword from './pages/ForgotPassword'
import ResetPassword from './pages/ResetPassword'
import AdminDashboard from './pages/admin/AdminDashboard'
import SuperadminDashboard from './pages/admin/SuperadminDashboard'
import ManageAdmins from './pages/admin/ManageAdmins'
import CreateExam from './pages/admin/CreateExam'
import ViewExams from './pages/admin/ViewExams'
import ViewSubmissions from './pages/admin/ViewSubmissions'
import CodingReview from './pages/admin/CodingReview'
import Reports from './pages/admin/Reports'
import CandidateDashboard from './pages/candidate/CandidateDashboard'
import ExamList from './pages/candidate/ExamList'
import ExamAttempt from './pages/candidate/ExamAttempt'
import ExamInstructions from './pages/candidate/ExamInstructions'
import MySubmissions from './pages/candidate/MySubmissions'
import ResultPage from './pages/candidate/ResultPage'
import './App.css'

function App() {
  return (
    <AuthProvider>
      <Router>
        <Routes>
          <Route path="/login" element={<Login />} />
          <Route path="/register" element={<Register />} />
          <Route path="/select-language" element={<SelectLanguage />} />
          <Route path="/forgot-password" element={<ForgotPassword />} />
          <Route path="/reset-password/:token" element={<ResetPassword />} />
          
          {/* Superadmin Routes */}
          <Route
            path="/superadmin"
            element={
              <PrivateRoute role="superadmin">
                <SuperadminDashboard />
              </PrivateRoute>
            }
          />
          <Route
            path="/admin/manage-admins"
            element={
              <PrivateRoute role="superadmin">
                <ManageAdmins />
              </PrivateRoute>
            }
          />
          
          {/* Admin Routes */}
          <Route
            path="/admin"
            element={
              <PrivateRoute role="admin">
                <AdminDashboard />
              </PrivateRoute>
            }
          />
          <Route
            path="/admin/create-exam"
            element={
              <PrivateRoute role="admin">
                <CreateExam />
              </PrivateRoute>
            }
          />
          <Route
            path="/admin/exams"
            element={
              <PrivateRoute role="admin">
                <ViewExams />
              </PrivateRoute>
            }
          />
          <Route
            path="/admin/submissions"
            element={
              <PrivateRoute role="admin">
                <ViewSubmissions />
              </PrivateRoute>
            }
          />
          <Route
            path="/admin/submissions/:submissionId/coding"
            element={
              <PrivateRoute role="admin">
                <CodingReview />
              </PrivateRoute>
            }
          />
          <Route
            path="/admin/reports"
            element={
              <PrivateRoute role="admin">
                <Reports />
              </PrivateRoute>
            }
          />
          
          {/* Candidate Routes */}
          <Route
            path="/candidate"
            element={
              <PrivateRoute role="candidate">
                <CandidateDashboard />
              </PrivateRoute>
            }
          />
          <Route
            path="/candidate/exams"
            element={
              <PrivateRoute role="candidate">
                <ExamList />
              </PrivateRoute>
            }
          />
          <Route
            path="/candidate/exam/:examId/instructions"
            element={
              <PrivateRoute role="candidate">
                <ExamInstructions />
              </PrivateRoute>
            }
          />
          <Route
            path="/candidate/exam/:examId"
            element={
              <PrivateRoute role="candidate">
                <ExamAttempt />
              </PrivateRoute>
            }
          />
          <Route
            path="/candidate/submissions"
            element={
              <PrivateRoute role="candidate">
                <MySubmissions />
              </PrivateRoute>
            }
          />
          <Route
            path="/candidate/result/:submissionId"
            element={
              <PrivateRoute role="candidate">
                <ResultPage />
              </PrivateRoute>
            }
          />
          
          {/* Default redirect */}
          <Route path="/" element={<Navigate to="/login" replace />} />
          <Route path="*" element={<Navigate to="/login" replace />} />
        </Routes>
      </Router>
    </AuthProvider>
  )
}

export default App
