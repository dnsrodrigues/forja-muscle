import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom'
import { AuthProvider } from './context/AuthContext'
import { ThemeProvider } from './context/ThemeContext'
import { ProtectedRoute } from './components/layout/ProtectedRoute'
import { AdminRoute } from './components/layout/AdminRoute'
import { LoginPage } from './pages/LoginPage'
import { DashboardPage } from './pages/DashboardPage'
import { ProfilePage } from './pages/ProfilePage'
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

              {/* ── Rotas exclusivas do admin ── */}
              <Route element={<AdminRoute />}>
                {/* Serão adicionadas na Fase 9 */}
                <Route path="/admin" element={<Navigate to="/admin/alunos" replace />} />
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
