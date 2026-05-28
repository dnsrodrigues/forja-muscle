import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom'
import { AuthProvider } from './context/AuthContext'
import { ThemeProvider } from './context/ThemeContext'
import { ProtectedRoute } from './components/layout/ProtectedRoute'
import { AdminRoute } from './components/layout/AdminRoute'
import { AppShell } from './components/layout/AppShell'
import { LoginPage } from './pages/LoginPage'
import { DashboardPage } from './pages/DashboardPage'
import { ProfilePage } from './pages/ProfilePage'
import { WorkoutsPage } from './pages/WorkoutsPage'
import { WorkoutDetailPage } from './pages/WorkoutDetailPage'
import { WorkoutSessionPage } from './pages/WorkoutSessionPage'
import { HistoryPage } from './pages/HistoryPage'
import { SessionDetailPage } from './pages/SessionDetailPage'
import { ProgressPage } from './pages/ProgressPage'
import { MeasurementsPage } from './pages/MeasurementsPage'
import { WorkoutsAdminPage } from './pages/admin/WorkoutsAdminPage'
import { WorkoutFormPage } from './pages/admin/WorkoutFormPage'
import { TrainersAdminPage } from './pages/admin/TrainersAdminPage'
import { TrainerFormPage } from './pages/admin/TrainerFormPage'
import { NotFoundPage } from './pages/NotFoundPage'

function App() {
  return (
    <ThemeProvider>
      <BrowserRouter>
        <AuthProvider>
          <Routes>

            {/* ── Rota pública (sem shell) ── */}
            <Route path="/login" element={<LoginPage />} />

            {/* ── Rotas protegidas: ProtectedRoute → AppShell → páginas ── */}
            <Route element={<ProtectedRoute />}>
              <Route element={<AppShell />}>

                <Route path="/" element={<Navigate to="/dashboard" replace />} />

                {/* Aluno */}
                <Route path="/dashboard" element={<DashboardPage />} />
                <Route path="/perfil" element={<ProfilePage />} />
                <Route path="/workouts" element={<WorkoutsPage />} />
                <Route path="/workouts/:id" element={<WorkoutDetailPage />} />
                <Route path="/workouts/:id/session" element={<WorkoutSessionPage />} />
                <Route path="/historico" element={<HistoryPage />} />
                <Route path="/historico/:logId" element={<SessionDetailPage />} />
                <Route path="/progresso" element={<ProgressPage />} />
                <Route path="/medidas" element={<MeasurementsPage />} />

                {/* Admin / Trainer */}
                <Route element={<AdminRoute />}>
                  <Route path="/admin" element={<Navigate to="/admin/workouts" replace />} />
                  <Route path="/admin/workouts" element={<WorkoutsAdminPage />} />
                  <Route path="/admin/workouts/new" element={<WorkoutFormPage />} />
                  <Route path="/admin/workouts/:id/edit" element={<WorkoutFormPage />} />
                  <Route path="/admin/trainers" element={<TrainersAdminPage />} />
                  <Route path="/admin/trainers/new" element={<TrainerFormPage />} />
                </Route>

              </Route>
            </Route>

            {/* 404 */}
            <Route path="*" element={<NotFoundPage />} />

          </Routes>
        </AuthProvider>
      </BrowserRouter>
    </ThemeProvider>
  )
}

export default App
