import { Navigate, Outlet } from 'react-router-dom'
import { useAuth } from '../../context/AuthContext'

// Tela de carregamento enquanto verifica a sessão
function LoadingScreen() {
  return (
    <div className="min-h-screen flex items-center justify-center theme-bg">
      <div className="flex flex-col items-center gap-5">
        {/* Spinner usando accent color via CSS var */}
        <div
          className="w-10 h-10 rounded-full border-2 border-t-transparent animate-spin"
          style={{ borderColor: 'var(--accent)', borderTopColor: 'transparent' }}
        />
        {/* Texto com fonte display */}
        <p
          className="text-xs font-light tracking-[0.3em] uppercase"
          style={{ color: 'var(--faint)', fontFamily: "'Outfit', sans-serif" }}
        >
          Carregando
        </p>
      </div>
    </div>
  )
}

// Rota protegida — só deixa entrar se o usuário estiver logado
export function ProtectedRoute() {
  const { user, loading } = useAuth()

  if (loading) return <LoadingScreen />
  if (!user) return <Navigate to="/login" replace />

  return <Outlet />
}
