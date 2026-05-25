import { LogOut, Dumbbell, User, ChevronRight } from 'lucide-react'
import { Link } from 'react-router-dom'
import { motion } from 'motion/react'
import { useAuth } from '../context/AuthContext'
import { Button } from '../components/ui/Button'
import { ThemeSwitcher } from '../components/ui/ThemeSwitcher'

// Dashboard placeholder — será substituído na Fase 7

export function DashboardPage() {
  const { profile, isAdmin, signOut } = useAuth()

  async function handleLogout() {
    await signOut()
  }

  return (
    <div className="min-h-screen relative overflow-hidden">

      {/* ── Header ──────────────────────────────────────── */}
      <header
        className="sticky top-0 z-20 px-4 py-3"
        style={{
          background: 'rgba(6,4,4,0.7)',
          borderBottom: '1px solid var(--line)',
          backdropFilter: 'blur(20px)',
        }}
      >
        <div className="max-w-2xl mx-auto flex items-center justify-between">
          {/* Logo */}
          <div className="flex items-center gap-2.5">
            <div
              className="w-8 h-8 rounded-lg flex items-center justify-center"
              style={{ background: 'linear-gradient(135deg, var(--accent-two), var(--accent) 60%)' }}
            >
              <Dumbbell size={16} style={{ color: 'var(--bg)' }} />
            </div>
            <span
              className="font-display text-base font-bold tracking-tight"
              style={{ color: 'var(--ink)' }}
            >
              MUSCLE TRAINING
            </span>
          </div>

          {/* Direita: theme switcher + logout */}
          <div className="flex items-center gap-3">
            <ThemeSwitcher />
            <div style={{ width: 1, height: 20, background: 'var(--line)' }} />
            <Button variant="ghost" size="sm" onClick={handleLogout}>
              <LogOut size={14} />
              Sair
            </Button>
          </div>
        </div>
      </header>

      {/* ── Conteúdo ────────────────────────────────────── */}
      <main className="max-w-2xl mx-auto px-4 py-8">

        {/* Boas-vindas */}
        <motion.div
          initial={{ opacity: 0, y: 16 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, ease: [0.22, 1, 0.36, 1] }}
        >
          <p
            className="text-xs font-light tracking-[0.24em] uppercase mb-2"
            style={{ color: 'var(--faint)' }}
          >
            Bem-vindo
          </p>
          <h1
            className="font-display text-4xl font-bold leading-none mb-8"
            style={{ color: 'var(--ink)' }}
          >
            {profile?.full_name ?? 'Atleta'}
          </h1>
        </motion.div>

        {/* Card de boas-vindas */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, delay: 0.08, ease: [0.22, 1, 0.36, 1] }}
          className="glass-card rounded-2xl p-6 mb-4 relative overflow-hidden"
        >
          {/* Barra lateral de acento */}
          <div
            className="absolute left-0 top-0 bottom-0 w-0.5"
            style={{ background: 'linear-gradient(to bottom, var(--accent), transparent)' }}
          />

          <div className="flex items-center gap-4">
            <div
              className="w-12 h-12 rounded-xl flex items-center justify-center"
              style={{ background: 'color-mix(in srgb, var(--accent) 12%, transparent)', border: '1px solid var(--accent-glow)' }}
            >
              <User size={22} style={{ color: 'var(--accent)' }} />
            </div>
            <div className="flex-1 min-w-0">
              <h2
                className="font-display text-xl font-bold truncate"
                style={{ color: 'var(--ink)' }}
              >
                {profile?.full_name ?? 'Usuário'}
              </h2>
              <p
                className="text-xs font-light mt-0.5 truncate"
                style={{ color: 'var(--muted)' }}
              >
                {profile?.email}
              </p>
            </div>
            <span
              className="text-xs font-semibold px-3 py-1.5 rounded-lg flex-shrink-0"
              style={{
                background: isAdmin
                  ? 'color-mix(in srgb, var(--accent) 14%, transparent)'
                  : 'var(--glass)',
                color: isAdmin ? 'var(--accent)' : 'var(--muted)',
                border: '1px solid var(--line)',
              }}
            >
              {isAdmin ? '⭐ Admin' : '💪 Aluno'}
            </span>
          </div>

          {/* Link para perfil */}
          <Link
            to="/perfil"
            className="flex items-center justify-between mt-5 pt-4 group transition-colors"
            style={{ borderTop: '1px solid var(--line)' }}
          >
            <span
              className="text-sm font-medium"
              style={{ color: 'var(--muted)' }}
            >
              Ver e editar meu perfil
            </span>
            <ChevronRight
              size={16}
              className="transition-transform group-hover:translate-x-1"
              style={{ color: 'var(--accent)' }}
            />
          </Link>
        </motion.div>

        {/* Status em construção */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, delay: 0.16, ease: [0.22, 1, 0.36, 1] }}
          className="glass-card rounded-2xl p-8 text-center"
        >
          <div className="text-5xl mb-5">🚧</div>

          <p
            className="text-xs font-semibold tracking-[0.2em] uppercase mb-2"
            style={{ color: 'var(--accent)' }}
          >
            Em construção
          </p>

          <h3
            className="font-display text-2xl font-bold mb-3"
            style={{ color: 'var(--ink)' }}
          >
            Dashboard completo em breve
          </h3>

          <p
            className="text-sm font-light leading-relaxed max-w-sm mx-auto"
            style={{ color: 'var(--muted)' }}
          >
            O painel com fichas de treino, histórico e gráficos de progressão está sendo construído nas próximas fases.
          </p>

          {/* Linha divisória */}
          <div
            className="my-6 h-px"
            style={{ background: 'var(--line)' }}
          />

          {/* Status das fases */}
          <div className="flex flex-wrap justify-center gap-2">
            {[
              { label: 'Auth', done: true },
              { label: 'Perfil', done: true },
              { label: 'Design v3', done: true },
              { label: 'Fichas', done: false },
              { label: 'Treino', done: false },
              { label: 'Histórico', done: false },
            ].map((phase) => (
              <span
                key={phase.label}
                className="text-xs font-medium px-3 py-1.5 rounded-lg"
                style={{
                  background: phase.done
                    ? 'color-mix(in srgb, var(--accent) 12%, transparent)'
                    : 'var(--glass)',
                  color: phase.done ? 'var(--accent)' : 'var(--faint)',
                  border: '1px solid var(--line)',
                }}
              >
                {phase.done ? '✓' : '○'} {phase.label}
              </span>
            ))}
          </div>
        </motion.div>

      </main>
    </div>
  )
}
