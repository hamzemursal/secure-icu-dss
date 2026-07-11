/**
 * App routes — auth, patients, AI, security, evaluation.
 */
import { BrowserRouter, Navigate, Route, Routes } from 'react-router-dom'
import { Toaster } from 'react-hot-toast'
import { AuthProvider } from './context/AuthContext'
import { ThemeProvider } from './context/ThemeContext'
import { ProtectedRoute } from './components/ProtectedRoute'
import { AppLayout } from './layouts/AppLayout'
import LoginPage from './pages/LoginPage'
import RegisterPage from './pages/RegisterPage'
import DashboardPage from './pages/DashboardPage'
import ProfilePage from './pages/ProfilePage'
import PatientsPage from './pages/PatientsPage'
import PatientFormPage from './pages/PatientFormPage'
import PatientDetailsPage from './pages/PatientDetailsPage'
import MedicalHistoryPage from './pages/MedicalHistoryPage'
import RecommendationsPage from './pages/RecommendationsPage'
import AttackSimulationPage from './pages/AttackSimulationPage'
import AuditLogsPage from './pages/AuditLogsPage'
import EvaluationDashboardPage from './pages/EvaluationDashboardPage'

export default function App() {
  return (
    <ThemeProvider>
      <AuthProvider>
        <BrowserRouter>
          <Toaster position="top-right" />
          <Routes>
            <Route path="/login" element={<LoginPage />} />
            <Route path="/register" element={<RegisterPage />} />
            <Route element={<ProtectedRoute />}>
              <Route element={<AppLayout />}>
                <Route path="/dashboard" element={<DashboardPage />} />
                <Route path="/patients" element={<PatientsPage />} />
                <Route path="/patients/new" element={<PatientFormPage />} />
                <Route path="/patients/:id" element={<PatientDetailsPage />} />
                <Route path="/patients/:id/edit" element={<PatientFormPage />} />
                <Route path="/patients/:id/history" element={<MedicalHistoryPage />} />
                <Route path="/recommendations" element={<RecommendationsPage />} />
                <Route path="/attacks" element={<AttackSimulationPage />} />
                <Route path="/audit-logs" element={<AuditLogsPage />} />
                <Route path="/evaluation" element={<EvaluationDashboardPage />} />
                <Route path="/profile" element={<ProfilePage />} />
              </Route>
            </Route>
            <Route path="/" element={<Navigate to="/dashboard" replace />} />
            <Route path="*" element={<Navigate to="/dashboard" replace />} />
          </Routes>
        </BrowserRouter>
      </AuthProvider>
    </ThemeProvider>
  )
}
