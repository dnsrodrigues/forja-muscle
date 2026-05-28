import { Navigate, Outlet } from 'react-router-dom'
import { useAuth } from '../../context/AuthContext'

// Permite super_admin e trainer. Segurança real está no RLS do banco.
export function AdminRoute() {
  const { loading, isManager } = useAuth()
  if (loading) return null
  if (!isManager) return <Navigate to="/dashboard" replace />
  return <Outlet />
}
