import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom'
import { AuthProvider } from './context/AuthContext'
import { ThemeProvider } from './context/ThemeContext'
import { ProtectedRoute } from './components/layout/ProtectedRoute'
import { AdminRoute } from './components/layout/AdminRoute'
import { LoginPage } from './pages/LoginPage'
import { DashboardPage } from './pages/DashboardPage'
import { ProfilePage } from './pages/ProfilePage'
import { WorkoutsPage } from './pages/WorkoutsPage'
import { WorkoutDetailPage } from './pages/WorkoutDetailPage'
import { WorkoutSessionPage } from './pages/WorkoutSessionPage'
import { WorkoutsAdminPage } from './pages/admin/WorkoutsAdminPage'
import { WorkoutFormPage } from './pages/admin/WorkoutFormPage'
import { NotFoundPage } from './pages/NotFoundPage'

function App() {
  return (
    // ThemeProvider é o mais externo para o tema estar disponível em toda a app
    // (inclusive na tela de loading do ProtectedRoute)
    <ThemeProvider>
      <BrowserRouter>
        <AuthProvider>
          <Routes>

            {/* ── Rota pública ── */}
            <Route path="/login" element={<LoginPage />} />

            {/* ── Rotas protegidas (exigem login) ── */}
            <Route element={<ProtectedRoute />}>

              {/* Redireciona a raiz para o dashboard */}
              <Route path="/" element={<Navigate to="/dashboard" replace />} />

              {/* Dashboard */}
              <Route path="/dashboard" element={<DashboardPage />} />

              {/* Fase 4 — Perfil do usuário */}
              <Route path="/perfil" element={<ProfilePage />} />

              {/* ── Fase 5 — Fichas de Treino (aluno) ── */}
              <Route path="/workouts" element={<WorkoutsPage />} />
              <Route path="/workouts/:id" element={<WorkoutDetailPage />} />

              {/* ── Fase 6 — Execução de Treino ── */}
              <Route path="/workouts/:id/session" element={<WorkoutSessionPage />} />

              {/* ── Rotas exclusivas do admin ── */}
              <Route element={<AdminRoute />}>
                <Route path="/admin" element={<Navigate to="/admin/workouts" replace />} />

                {/* Fase 5 — Fichas de Treino (admin) */}
                <Route path="/admin/workouts" element={<WorkoutsAdminPage />} />
                <Route path="/admin/workouts/new" element={<WorkoutFormPage />} />
                <Route path="/admin/workouts/:id/edit" element={<WorkoutFormPage />} />
              </Route>

            </Route>

            {/* Página 404 */}
            <Route path="*" element={<NotFoundPage />} />

          </Routes>
        </AuthProvider>
      </BrowserRouter>
    </ThemeProvider>
  )
}

export default App
