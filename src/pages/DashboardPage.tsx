import { useState, useEffect } from 'react'
import { LogOut, ChevronRight } from 'lucide-react'
import { Link } from 'react-router-dom'
import { motion } from 'motion/react'
import { useAuth } from '../context/AuthContext'
import { Avatar } from '../components/ui/Avatar'
import { Button } from '../components/ui/Button'
import { ThemeSwitcher } from '../components/ui/ThemeSwitcher'
import { getWorkoutHistory } from '../services/history.service'
import { getUserWeights } from '../services/measurements.service'
import type { WorkoutLog, UserWeight } from '../types'

const DIFFICULTY_EMOJI: Record<string, string> = {
  easy: '😊', medium: '💪', hard: '🔥', terrible: '💀',
}

export function DashboardPage() {
  const { profile, isAdmin, signOut } = useAuth()
  const [lastSession, setLastSession] = useState<WorkoutLog | null | undefined>(undefined)
  const [lastWeight, setLastWeight] = useState<UserWeight | null | undefined>(undefined)

  const nameParts = (profile?.full_name ?? 'Atleta').split(' ')
  const firstName = nameParts[0]
  const lastName  = nameParts.slice(1).join(' ')

  useEffect(() => {
    if (!profile?.id || isAdmin) return
    getWorkoutHistory(profile.id)
      .then((data) => setLastSession(data[0] ?? null))
      .catch(() => setLastSession(null))
    getUserWeights(profile.id)
      .then((data) => setLastWeight(data[0] ?? null))
      .catch(() => setLastWeight(null))
  }, [profile?.id, isAdmin])

  async function handleLogout() {
    await signOut()
  }

  function formatDate(iso: string) {
    return new Date(iso).toLocaleDateString('pt-BR', {
      weekday: 'short', day: '2-digit', month: 'short',
    })
  }

  return (
    <div className="min-h-screen" style={{ background: 'var(--bg)' }}>

      {/* Grid lines decorativo */}
      <div
        className="fixed inset-0 pointer-events-none z-0"
        style={{ display: 'grid', gridTemplateColumns: 'repeat(12, 1fr)' }}
      >
        {Array.from({ length: 12 }).map((_, i) => (
          <span key={i} style={{ borderRight: '1px solid var(--border)' }} />
        ))}
      </div>

      {/* ── Header ──────────────────────────────────── */}
      <header
        className="sticky top-0 z-20"
        style={{
          padding: '14px 16px',
          background: 'rgba(5,5,10,0.7)',
          borderBottom: '1px solid var(--border)',
          backdropFilter: 'blur(12px)',
        }}
      >
        <div className="max-w-2xl mx-auto flex items-center justify-between">
          <div>
            <div style={{
              fontFamily: "'Syne', sans-serif",
              fontSize: 12,
              fontWeight: 800,
              letterSpacing: '0.22em',
              textTransform: 'uppercase',
              color: 'var(--accent)',
            }}>
              MUSCLE TRAINING
            </div>
            <div style={{
              fontFamily: "'DM Mono', monospace",
              fontSize: 9,
              fontStyle: 'italic',
              color: 'var(--fg-3)',
              letterSpacing: '0.1em',
              marginTop: 1,
            }}>
              // {isAdmin ? 'painel admin' : 'bem-vindo de volta'}
            </div>
          </div>

          <div className="flex items-center gap-2">
            <ThemeSwitcher />
            <Button
              variant="ghost"
              size="sm"
              onClick={handleLogout}
              style={{ fontSize: 10, padding: '0 10px', height: 28 }}
            >
              <LogOut size={12} />
              Sair
            </Button>
            {profile?.full_name && (
              <Avatar name={profile.full_name} size="sm" />
            )}
          </div>
        </div>
      </header>

      {/* ── Conteúdo ─────────────────────────────────── */}
      <main className="max-w-2xl mx-auto px-4 py-6 relative z-10">

        {/* Hero */}
        <motion.div
          initial={{ opacity: 0, y: 16 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, ease: [0.22, 1, 0.36, 1] }}
          style={{
            background: 'var(--surface)',
            border: '1px solid var(--border)',
            borderLeft: '2px solid var(--accent)',
            padding: '16px',
            marginBottom: 2,
            position: 'relative',
            overflow: 'hidden',
          }}
        >
          {/* Hatch pattern */}
          <div style={{
            position: 'absolute', inset: 0,
            backgroundImage: 'repeating-linear-gradient(-45deg, transparent, transparent 16px, rgba(200,240,74,0.025) 16px, rgba(200,240,74,0.025) 17px)',
            pointerEvents: 'none',
          }} />

          <div className="relative flex items-start justify-between gap-3">
            <div>
              <div style={{
                fontFamily: "'DM Mono', monospace",
                fontSize: 9,
                letterSpacing: '0.2em',
                textTransform: 'uppercase',
                color: 'var(--accent)',
                marginBottom: 4,
              }}>
                // bom dia
              </div>
              <div style={{
                fontFamily: "'Syne', sans-serif",
                fontSize: 26,
                fontWeight: 800,
                letterSpacing: '-0.01em',
                color: 'var(--fg)',
                lineHeight: 1,
              }}>
                {firstName}{' '}
                {lastName && (
                  <em style={{ fontStyle: 'italic', color: 'var(--accent)' }}>
                    {lastName}
                  </em>
                )}
              </div>
              <div style={{
                display: 'inline-flex',
                alignItems: 'center',
                gap: 5,
                marginTop: 10,
                fontFamily: "'DM Mono', monospace",
                fontSize: 9,
                letterSpacing: '0.1em',
                textTransform: 'uppercase',
                color: 'var(--accent-light)',
                border: '1px solid rgba(200,240,74,0.25)',
                padding: '3px 8px',
                background: 'var(--accent-muted)',
              }}>
                {isAdmin ? '⭐ Personal Trainer' : '💪 Em treino'}
              </div>
            </div>

            {profile?.full_name && (
              <Avatar name={profile.full_name} size="md" />
            )}
          </div>
        </motion.div>

        {/* Stats grid */}
        <motion.div
          initial={{ opacity: 0, y: 16 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, delay: 0.06, ease: [0.22, 1, 0.36, 1] }}
          style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(3, 1fr)',
            gap: 1,
            background: 'var(--border)',
            marginBottom: 12,
          }}
        >
          {[
            { label: 'Treinos',  value: '—',   accent: true },
            { label: 'kg atual', value: profile?.weight        ? String(profile.weight)        : '—' },
            { label: 'kg alvo',  value: profile?.target_weight ? String(profile.target_weight) : '—' },
          ].map((stat) => (
            <div
              key={stat.label}
              style={{
                background: 'var(--surface)',
                padding: '12px 10px',
                textAlign: 'center',
              }}
            >
              <span style={{
                fontFamily: "'Syne', sans-serif",
                fontSize: 26,
                fontWeight: 800,
                color: stat.accent ? 'var(--accent)' : 'var(--fg)',
                display: 'block',
                lineHeight: 1,
                letterSpacing: '-0.02em',
              }}>
                {stat.value}
              </span>
              <div style={{
                fontFamily: "'DM Mono', monospace",
                fontSize: 8,
                letterSpacing: '0.1em',
                textTransform: 'uppercase',
                color: 'var(--fg-3)',
                marginTop: 4,
              }}>
                {stat.label}
              </div>
            </div>
          ))}
        </motion.div>

        {/* Card — próximas fases */}
        <motion.div
          initial={{ opacity: 0, y: 16 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, delay: 0.12, ease: [0.22, 1, 0.36, 1] }}
          style={{
            background: 'var(--surface)',
            border: '1px solid rgba(200,240,74,0.25)',
            boxShadow: '0 0 0 1px rgba(200,240,74,0.06), 0 4px 32px rgba(200,240,74,0.08)',
            padding: '20px',
            marginBottom: 8,
          }}
        >
          <div style={{
            fontFamily: "'DM Mono', monospace",
            fontSize: 9,
            letterSpacing: '0.2em',
            textTransform: 'uppercase',
            color: 'var(--accent)',
            marginBottom: 12,
          }}>
            // status das fases
          </div>

          <div style={{ display: 'flex', flexWrap: 'wrap', gap: 6 }}>
            {[
              { label: 'Auth',       done: true  },
              { label: 'Perfil',     done: true  },
              { label: 'Design v2',  done: true  },
              { label: 'Fichas',     done: true  },
              { label: 'Treino',     done: false },
              { label: 'Histórico',  done: false },
            ].map((phase) => (
              <span
                key={phase.label}
                style={{
                  display: 'inline-flex',
                  alignItems: 'center',
                  gap: 5,
                  padding: '3px 9px',
                  border: '1px solid',
                  borderColor: phase.done ? 'rgba(200,240,74,0.3)' : 'var(--border-md)',
                  background: phase.done ? 'var(--accent-muted)' : 'transparent',
                  color: phase.done ? 'var(--accent-light)' : 'var(--fg-3)',
                  fontFamily: "'DM Mono', monospace",
                  fontSize: 10,
                  letterSpacing: '0.1em',
                  textTransform: 'uppercase',
                }}
              >
                {phase.done ? '✓' : '○'} {phase.label}
              </span>
            ))}
          </div>
        </motion.div>

        {/* Links de navegação */}
        <motion.div
          initial={{ opacity: 0, y: 16 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, delay: 0.18, ease: [0.22, 1, 0.36, 1] }}
          style={{ display: 'flex', flexDirection: 'column', gap: 1 }}
        >
          {/* Fichas de Treino */}
          <Link
            to={isAdmin ? '/admin/workouts' : '/workouts'}
            className="flex items-center justify-between group"
            style={{
              background: 'var(--surface)',
              border: '1px solid var(--border)',
              borderLeft: '2px solid var(--accent)',
              padding: '12px 14px',
              transition: 'border-color 0.15s, background 0.15s',
              textDecoration: 'none',
            }}
            onMouseEnter={(e) => {
              e.currentTarget.style.background = 'rgba(200,240,74,0.04)'
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.background = 'var(--surface)'
            }}
          >
            <div>
              <div style={{
                fontFamily: "'Syne', sans-serif",
                fontSize: 12,
                fontWeight: 700,
                color: 'var(--fg)',
                letterSpacing: '0.03em',
              }}>
                {isAdmin ? 'Biblioteca de Fichas' : 'Minhas Fichas'}
              </div>
              <div style={{
                fontFamily: "'DM Mono', monospace",
                fontSize: 9,
                color: 'var(--accent)',
                letterSpacing: '0.04em',
                marginTop: 1,
                fontStyle: 'italic',
                opacity: 0.7,
              }}>
                // {isAdmin ? 'criar e gerenciar fichas de treino' : 'ver fichas e treino de hoje'}
              </div>
            </div>
            <ChevronRight
              size={14}
              className="transition-transform group-hover:translate-x-1"
              style={{ color: 'var(--accent)', opacity: 0.6 }}
            />
          </Link>

          {/* Meu Perfil */}
          <Link
            to="/perfil"
            className="flex items-center justify-between group"
            style={{
              background: 'var(--surface)',
              border: '1px solid var(--border)',
              borderLeft: '2px solid var(--surface-3)',
              padding: '12px 14px',
              transition: 'border-color 0.15s',
              textDecoration: 'none',
            }}
            onMouseEnter={(e) => {
              e.currentTarget.style.borderLeftColor = 'var(--accent)'
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.borderLeftColor = 'var(--surface-3)'
            }}
          >
            <div>
              <div style={{
                fontFamily: "'Syne', sans-serif",
                fontSize: 12,
                fontWeight: 700,
                color: 'var(--fg)',
                letterSpacing: '0.03em',
              }}>
                Meu Perfil
              </div>
              <div style={{
                fontFamily: "'DM Mono', monospace",
                fontSize: 9,
                color: 'var(--fg-3)',
                letterSpacing: '0.04em',
                marginTop: 1,
                fontStyle: 'italic',
              }}>
                // ver e editar dados pessoais
              </div>
            </div>
            <ChevronRight
              size={14}
              className="transition-transform group-hover:translate-x-1"
              style={{ color: 'var(--fg-3)' }}
            />
          </Link>
        </motion.div>

        {/* ── Cards de Histórico/Progresso/Medidas (apenas aluno) ── */}
        {!isAdmin && (
          <motion.div
            initial={{ opacity: 0, y: 16 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, delay: 0.24, ease: [0.22, 1, 0.36, 1] }}
            style={{ display: 'flex', flexDirection: 'column', gap: 1, marginTop: 12 }}
          >
            {/* Label */}
            <div style={{
              fontFamily: "'DM Mono', monospace", fontSize: 9,
              color: 'var(--fg-3)', letterSpacing: '0.15em',
              textTransform: 'uppercase', marginBottom: 6, marginTop: 4,
            }}>
              // acompanhamento
            </div>

            {/* Card: Último treino */}
            <Link
              to="/historico"
              style={{
                display: 'block',
                background: 'var(--surface)',
                border: '1px solid var(--border)',
                borderLeft: '2px solid var(--surface-3)',
                padding: '12px 14px',
                textDecoration: 'none',
                transition: 'border-left-color 0.15s, background 0.15s',
              }}
              onMouseEnter={(e) => {
                e.currentTarget.style.borderLeftColor = 'var(--accent)'
                e.currentTarget.style.background = 'rgba(200,240,74,0.03)'
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.borderLeftColor = 'var(--surface-3)'
                e.currentTarget.style.background = 'var(--surface)'
              }}
            >
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <div>
                  <div style={{
                    fontFamily: "'Syne', sans-serif", fontSize: 12,
                    fontWeight: 700, color: 'var(--fg)', letterSpacing: '0.03em',
                  }}>
                    Histórico de Treinos
                  </div>
                  <div style={{
                    fontFamily: "'DM Mono', monospace", fontSize: 9,
                    color: lastSession ? 'var(--accent)' : 'var(--fg-3)',
                    letterSpacing: '0.04em', marginTop: 2, fontStyle: 'italic', opacity: 0.8,
                  }}>
                    {lastSession === undefined
                      ? '// carregando...'
                      : lastSession === null
                        ? '// nenhum treino registrado ainda'
                        : `// último: ${formatDate(lastSession.started_at)} ${lastSession.difficulty ? DIFFICULTY_EMOJI[lastSession.difficulty] : ''} ${lastSession.duration_minutes ? `— ${lastSession.duration_minutes}min` : ''}`
                    }
                  </div>
                </div>
                <ChevronRight size={14} style={{ color: 'var(--fg-3)', opacity: 0.5, flexShrink: 0 }} />
              </div>
            </Link>

            {/* Card: Progresso */}
            <Link
              to="/progresso"
              style={{
                display: 'block',
                background: 'var(--surface)',
                border: '1px solid var(--border)',
                borderLeft: '2px solid var(--surface-3)',
                padding: '12px 14px',
                textDecoration: 'none',
                transition: 'border-left-color 0.15s, background 0.15s',
              }}
              onMouseEnter={(e) => {
                e.currentTarget.style.borderLeftColor = 'var(--accent)'
                e.currentTarget.style.background = 'rgba(200,240,74,0.03)'
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.borderLeftColor = 'var(--surface-3)'
                e.currentTarget.style.background = 'var(--surface)'
              }}
            >
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <div>
                  <div style={{
                    fontFamily: "'Syne', sans-serif", fontSize: 12,
                    fontWeight: 700, color: 'var(--fg)', letterSpacing: '0.03em',
                  }}>
                    Gráficos de Progresso
                  </div>
                  <div style={{
                    fontFamily: "'DM Mono', monospace", fontSize: 9,
                    color: 'var(--fg-3)', letterSpacing: '0.04em',
                    marginTop: 2, fontStyle: 'italic', opacity: 0.7,
                  }}>
                    // evolução de carga e frequência semanal
                  </div>
                </div>
                <ChevronRight size={14} style={{ color: 'var(--fg-3)', opacity: 0.5, flexShrink: 0 }} />
              </div>
            </Link>

            {/* Card: Peso & Medidas */}
            <Link
              to="/medidas"
              style={{
                display: 'block',
                background: 'var(--surface)',
                border: '1px solid var(--border)',
                borderLeft: '2px solid var(--surface-3)',
                padding: '12px 14px',
                textDecoration: 'none',
                transition: 'border-left-color 0.15s, background 0.15s',
              }}
              onMouseEnter={(e) => {
                e.currentTarget.style.borderLeftColor = 'var(--accent)'
                e.currentTarget.style.background = 'rgba(200,240,74,0.03)'
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.borderLeftColor = 'var(--surface-3)'
                e.currentTarget.style.background = 'var(--surface)'
              }}
            >
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <div>
                  <div style={{
                    fontFamily: "'Syne', sans-serif", fontSize: 12,
                    fontWeight: 700, color: 'var(--fg)', letterSpacing: '0.03em',
                  }}>
                    Peso & Medidas
                  </div>
                  <div style={{
                    fontFamily: "'DM Mono', monospace", fontSize: 9,
                    color: lastWeight ? 'var(--accent)' : 'var(--fg-3)',
                    letterSpacing: '0.04em', marginTop: 2, fontStyle: 'italic', opacity: 0.8,
                  }}>
                    {lastWeight === undefined
                      ? '// carregando...'
                      : lastWeight === null
                        ? '// registre seu peso para acompanhar'
                        : `// atual: ${Number(lastWeight.weight_kg).toFixed(1)} kg`
                    }
                  </div>
                </div>
                <ChevronRight size={14} style={{ color: 'var(--fg-3)', opacity: 0.5, flexShrink: 0 }} />
              </div>
            </Link>

          </motion.div>
        )}

      </main>
    </div>
  )
}
