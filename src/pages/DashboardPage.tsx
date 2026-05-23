import { LogOut, Dumbbell, User } from 'lucide-react'
import { useAuth } from '../context/AuthContext'
import { Button } from '../components/ui/Button'

// Página de Dashboard — placeholder temporário
// Será substituída pela versão completa na Fase 7
export function DashboardPage() {
  const { profile, isAdmin, signOut } = useAuth()

  async function handleLogout() {
    await signOut()
  }

  return (
    <div className="min-h-screen bg-[#0f0f0f] p-4">
      {/* Header */}
      <div className="max-w-2xl mx-auto">
        <div className="flex items-center justify-between mb-8">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-orange-500 rounded-xl flex items-center justify-center">
              <Dumbbell size={20} className="text-white" />
            </div>
            <span className="font-bold text-white text-lg">MUSCTRAINIG</span>
          </div>
          <Button variant="ghost" size="sm" onClick={handleLogout}>
            <LogOut size={16} />
            Sair
          </Button>
        </div>

        {/* Boas-vindas */}
        <div className="bg-[#1a1a1a] rounded-2xl p-6 border border-white/5 mb-4">
          <div className="flex items-center gap-4">
            <div className="w-14 h-14 bg-orange-500/20 rounded-2xl flex items-center justify-center">
              <User size={28} className="text-orange-500" />
            </div>
            <div>
              <p className="text-gray-400 text-sm">Bem-vindo,</p>
              <h1 className="text-xl font-bold text-white">
                {profile?.full_name ?? 'Usuário'}
              </h1>
              <span className={`text-xs font-medium px-2 py-0.5 rounded-full mt-1 inline-block ${
                isAdmin
                  ? 'bg-orange-500/20 text-orange-400'
                  : 'bg-white/10 text-gray-300'
              }`}>
                {isAdmin ? '⭐ Admin' : '💪 Aluno'}
              </span>
            </div>
          </div>
        </div>

        {/* Status de construção */}
        <div className="bg-[#1a1a1a] rounded-2xl p-6 border border-white/5 text-center">
          <div className="text-4xl mb-3">🚧</div>
          <h2 className="text-white font-semibold mb-2">
            Login funcionando! ✅
          </h2>
          <p className="text-gray-400 text-sm">
            O dashboard completo está sendo construído nas próximas fases.
          </p>
          <p className="text-orange-500 text-xs mt-2 font-medium">
            Fase 3 — Autenticação concluída
          </p>
        </div>
      </div>
    </div>
  )
}
