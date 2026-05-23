import { Navigate, Outlet } from 'react-router-dom'
import { useAuth } from '../../context/AuthContext'

// Rota exclusiva para admin — redireciona alunos para o dashboard deles
export function AdminRoute() {
  const { isAdmin, loading } = useAuth()

  if (loading) return null
  if (!isAdmin) return <Navigate to="/dashboard" replace />

  return <Outlet />
}
