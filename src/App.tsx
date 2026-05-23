import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom'
import { AuthProvider } from './context/AuthContext'
import { ProtectedRoute } from './components/layout/ProtectedRoute'
import { AdminRoute } from './components/layout/AdminRoute'
import { LoginPage } from './pages/LoginPage'
import { DashboardPage } from './pages/DashboardPage'
import { NotFoundPage } from './pages/NotFoundPage'

// As demais páginas serão adicionadas nas fases 4 a 9

function App() {
  return (
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
  )
}

export default App
