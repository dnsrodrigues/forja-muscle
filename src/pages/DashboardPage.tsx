import { useState, useEffect } from 'react'
import { LogOut, ChevronRight, Dumbbell, BarChart2, Scale, User, Star } from 'lucide-react'
import { Link } from 'react-router-dom'
import { motion } from 'motion/react'
import { useAuth } from '../context/AuthContext'
import { Avatar } from '../components/ui/Avatar'
import { ThemeSwitcher } from '../components/ui/ThemeSwitcher'
import { getWorkoutHistory } from '../services/history.service'
import { getUserWeights } from '../services/measurements.service'
import type { WorkoutLog, UserWeight } from '../types'

const DIFFICULTY_EMOJI: Record<string, string> = {
  easy: '😊', medium: '💪', hard: '🔥', terrible: '💀',
}

// ─── Saudação por horário ──────────────────────────────────────────────────────
function getGreeting(): string {
  const h = new Date().getHours()
  if (h < 12) return 'Bom dia'
  if (h < 18) return 'Boa tarde'
  return 'Boa noite'
}

// ─── Card de navegação ─────────────────────────────────────────────────────────
interface NavCardProps {
  to: string
  icon: React.ReactNode
  iconBg: string
  title: string
  subtitle: string
  accentColor?: string
  delay?: number
}

function NavCard({ to, icon, iconBg, title, subtitle, accentColor = 'rgba(108,142,247,0.3)', delay = 0 }: NavCardProps) {
  const [hovered, setHovered] = useState(false)

  return (
    <motion.div
      initial={{ opacity: 0, y: 16 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5, delay, ease: [0.22, 1, 0.36, 1] }}
    >
      <Link
        to={to}
        style={{ textDecoration: 'none', display: 'block' }}
        onMouseEnter={() => setHovered(true)}
        onMouseLeave={() => setHovered(false)}
      >
        <div style={{
          display: 'flex',
          alignItems: 'center',
          gap: 14,
          padding: '16px 18px',
          background: hovered ? 'rgba(255,255,255,0.08)' : 'rgba(255,255,255,0.05)',
          backdropFilter: 'blur(20px)',
          WebkitBackdropFilter: 'blur(20px)',
          borderRadius: 20,
          border: hovered
            ? `1px solid ${accentColor}`
            : '1px solid rgba(255,255,255,0.1)',
          boxShadow: hovered
            ? `0 8px 32px rgba(0,0,0,0.3), 0 0 0 1px ${accentColor}`
            : '0 8px 32px rgba(0,0,0,0.3)',
          transition: 'background 0.2s, border-color 0.2s, box-shadow 0.2s',
          cursor: 'pointer',
        }}>
          {/* Ícone */}
          <div style={{
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            width: 44,
            height: 44,
            borderRadius: 12,
            background: iconBg,
            flexShrink: 0,
            transition: 'transform 0.2s',
            transform: hovered ? 'scale(1.08)' : 'scale(1)',
          }}>
            {icon}
          </div>

          {/* Texto */}
          <div style={{ flex: 1, minWidth: 0 }}>
            <div style={{
              fontFamily: "'Outfit', sans-serif",
              fontSize: 15,
              fontWeight: 700,
              color: 'var(--fg)',
              letterSpacing: '-0.01em',
              lineHeight: 1.2,
            }}>
              {title}
            </div>
            <div style={{
              fontFamily: "'JetBrains Mono', monospace",
              fontSize: 10,
              color: 'var(--fg-3)',
              letterSpacing: '0.04em',
              fontStyle: 'italic',
              marginTop: 3,
            }}>
              {subtitle}
            </div>
          </div>

          <ChevronRight
            size={16}
            style={{
              color: hovered ? 'var(--accent-light)' : 'var(--fg-3)',
              transition: 'color 0.2s, transform 0.2s',
              transform: hovered ? 'translateX(3px)' : 'translateX(0)',
              flexShrink: 0,
            }}
          />
        </div>
      </Link>
    </motion.div>
  )
}

// ─── Página Principal ──────────────────────────────────────────────────────────
export function DashboardPage() {
  const { profile, isAdmin, signOut } = useAuth()
  const [lastSession, setLastSession] = useState<WorkoutLog | null | undefined>(undefined)
  const [workoutCount, setWorkoutCount] = useState<number | null>(null)
  const [lastWeight, setLastWeight] = useState<UserWeight | null | undefined>(undefined)

  const nameParts = (profile?.full_name ?? 'Atleta').split(' ')
  const firstName = nameParts[0]
  const lastName  = nameParts.slice(1).join(' ')

  useEffect(() => {
    if (!profile?.id || isAdmin) return
    getWorkoutHistory(profile.id)
      .then((data) => {
        setLastSession(data[0] ?? null)
        setWorkoutCount(data.length)
      })
      .catch(() => { setLastSession(null); setWorkoutCount(0) })
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
    <div style={{ minHeight: '100vh', background: 'var(--bg)' }}>

      {/* ── Header ──────────────────────────────────────── */}
      <header
        style={{
          position: 'sticky',
          top: 0,
          zIndex: 20,
          padding: '12px 20px',
          background: 'rgba(6,7,26,0.85)',
          backdropFilter: 'blur(24px)',
          WebkitBackdropFilter: 'blur(24px)',
          borderBottom: '1px solid rgba(108,142,247,0.15)',
        }}
      >
        <div style={{ maxWidth: 640, margin: '0 auto', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
          {/* Logo */}
          <div>
            <div style={{
              fontFamily: "'Outfit', sans-serif",
              fontSize: 13,
              fontWeight: 800,
              letterSpacing: '0.2em',
              textTransform: 'uppercase',
              backgroundImage: 'linear-gradient(160deg, #8ba8fb 0%, #ffffff 60%)',
              backgroundClip: 'text',
              WebkitBackgroundClip: 'text',
              color: 'transparent',
            }}>
              MUSCLE TRAINING
            </div>
            <div style={{
              fontFamily: "'JetBrains Mono', monospace",
              fontSize: 9,
              fontStyle: 'italic',
              color: 'var(--fg-3)',
              letterSpacing: '0.1em',
              marginTop: 1,
            }}>
              // {isAdmin ? 'painel admin' : 'bem-vindo de volta'}
            </div>
          </div>

          {/* Ações */}
          <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
            <ThemeSwitcher />

            <button
              onClick={handleLogout}
              title="Sair"
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: 5,
                padding: '6px 12px',
                background: 'rgba(255,255,255,0.06)',
                border: '1px solid rgba(255,255,255,0.1)',
                borderRadius: 10,
                color: 'var(--fg-2)',
                fontFamily: "'Outfit', sans-serif",
                fontSize: 12,
                fontWeight: 600,
                cursor: 'pointer',
                transition: 'background 0.2s, color 0.2s',
              }}
              onMouseEnter={(e) => {
                e.currentTarget.style.background = 'rgba(248,113,113,0.1)'
                e.currentTarget.style.color = 'var(--danger)'
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.background = 'rgba(255,255,255,0.06)'
                e.currentTarget.style.color = 'var(--fg-2)'
              }}
            >
              <LogOut size={13} />
              Sair
            </button>

            {profile?.full_name && (
              <Avatar name={profile.full_name} size="sm" />
            )}
          </div>
        </div>
      </header>

      {/* ── Conteúdo ─────────────────────────────────────── */}
      <main style={{ maxWidth: 640, margin: '0 auto', padding: '24px 16px', position: 'relative', zIndex: 1 }}>

        {/* ── Hero / Saudação ───────────────────────────── */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, ease: [0.22, 1, 0.36, 1] }}
          style={{
            position: 'relative',
            background: 'rgba(255,255,255,0.05)',
            backdropFilter: 'blur(20px)',
            WebkitBackdropFilter: 'blur(20px)',
            borderRadius: 20,
            border: '1px solid rgba(255,255,255,0.1)',
            boxShadow: '0 8px 32px rgba(0,0,0,0.3)',
            padding: '24px 22px',
            marginBottom: 12,
            overflow: 'hidden',
          }}
        >
          {/* Hatch decorativo */}
          <div style={{
            position: 'absolute', inset: 0,
            backgroundImage: 'repeating-linear-gradient(-45deg, transparent, transparent 18px, rgba(108,142,247,0.02) 18px, rgba(108,142,247,0.02) 19px)',
            pointerEvents: 'none',
            borderRadius: 20,
          }} />

          {/* Blob de destaque no canto */}
          <div style={{
            position: 'absolute',
            top: -40, right: -40,
            width: 160, height: 160,
            borderRadius: '50%',
            background: 'radial-gradient(circle, rgba(196,79,224,0.12) 0%, transparent 70%)',
            pointerEvents: 'none',
          }} />

          <div style={{ position: 'relative', display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', gap: 12 }}>
            <div>
              {/* Saudação */}
              <div style={{
                fontFamily: "'JetBrains Mono', monospace",
                fontSize: 10,
                letterSpacing: '0.18em',
                textTransform: 'uppercase',
                color: 'var(--accent)',
                marginBottom: 6,
              }}>
                // {getGreeting()}
              </div>

              {/* Nome com gradient */}
              <h1 style={{
                fontFamily: "'Outfit', sans-serif",
                fontSize: 30,
                fontWeight: 800,
                letterSpacing: '-0.02em',
                lineHeight: 1,
                margin: '0 0 12px',
              }}>
                <span style={{
                  backgroundImage: 'linear-gradient(160deg, #8ba8fb 0%, #ffffff 60%)',
                  backgroundClip: 'text',
                  WebkitBackgroundClip: 'text',
                  color: 'transparent',
                }}>
                  {firstName}
                </span>
                {lastName && (
                  <span style={{ color: 'var(--fg-2)', fontStyle: 'italic' }}> {lastName}</span>
                )}
              </h1>

              {/* Badge role */}
              <div style={{
                display: 'inline-flex',
                alignItems: 'center',
                gap: 6,
                padding: '5px 12px',
                borderRadius: '50rem',
                background: isAdmin
                  ? 'rgba(196,79,224,0.1)'
                  : 'rgba(108,142,247,0.1)',
                border: isAdmin
                  ? '1px solid rgba(196,79,224,0.3)'
                  : '1px solid rgba(108,142,247,0.3)',
              }}>
                {isAdmin
                  ? <Star size={11} color="var(--accent-2)" />
                  : <Dumbbell size={11} color="var(--accent)" />
                }
                <span style={{
                  fontFamily: "'JetBrains Mono', monospace",
                  fontSize: 10,
                  letterSpacing: '0.08em',
                  color: isAdmin ? 'var(--accent-2)' : 'var(--accent-light)',
                  textTransform: 'uppercase',
                }}>
                  {isAdmin ? 'Personal Trainer' : 'Em treino'}
                </span>
              </div>
            </div>

            {profile?.full_name && (
              <Avatar name={profile.full_name} size="md" />
            )}
          </div>
        </motion.div>

        {/* ── Stats grid ───────────────────────────────── */}
        <motion.div
          initial={{ opacity: 0, y: 16 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, delay: 0.08, ease: [0.22, 1, 0.36, 1] }}
          style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(3, 1fr)',
            gap: 8,
            marginBottom: 12,
          }}
        >
          {[
            { label: 'Treinos',  value: workoutCount === null ? '…' : String(workoutCount), glow: 'rgba(108,142,247,0.2)', border: 'rgba(108,142,247,0.25)' },
            { label: 'Peso kg',  value: profile?.weight        ? String(profile.weight)        : '—', glow: 'rgba(196,79,224,0.15)', border: 'rgba(196,79,224,0.2)' },
            { label: 'Alvo kg',  value: profile?.target_weight ? String(profile.target_weight) : '—', glow: 'rgba(74,222,128,0.12)', border: 'rgba(74,222,128,0.2)' },
          ].map((stat) => (
            <div
              key={stat.label}
              style={{
                background: 'rgba(255,255,255,0.04)',
                backdropFilter: 'blur(16px)',
                WebkitBackdropFilter: 'blur(16px)',
                borderRadius: 16,
                border: `1px solid ${stat.border}`,
                boxShadow: `0 4px 16px ${stat.glow}`,
                padding: '14px 10px',
                textAlign: 'center',
              }}
            >
              <span style={{
                fontFamily: "'Outfit', sans-serif",
                fontSize: 28,
                fontWeight: 800,
                backgroundImage: 'linear-gradient(160deg, #8ba8fb 0%, #fff 70%)',
                backgroundClip: 'text',
                WebkitBackgroundClip: 'text',
                color: 'transparent',
                display: 'block',
                lineHeight: 1,
                letterSpacing: '-0.02em',
              }}>
                {stat.value}
              </span>
              <div style={{
                fontFamily: "'JetBrains Mono', monospace",
                fontSize: 8,
                letterSpacing: '0.12em',
                textTransform: 'uppercase',
                color: 'var(--fg-3)',
                marginTop: 5,
              }}>
                {stat.label}
              </div>
            </div>
          ))}
        </motion.div>

        {/* ── Seção: Navegação principal ─────────────── */}
        <div style={{ marginBottom: 12 }}>
          <div style={{
            fontFamily: "'JetBrains Mono', monospace",
            fontSize: 9,
            letterSpacing: '0.18em',
            textTransform: 'uppercase',
            color: 'var(--fg-3)',
            marginBottom: 10,
            paddingLeft: 2,
          }}>
            // acesso rápido
          </div>

          <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
            <NavCard
              to={isAdmin ? '/admin/workouts' : '/workouts'}
              icon={<Dumbbell size={20} color="var(--accent-light)" />}
              iconBg="rgba(108,142,247,0.12)"
              title={isAdmin ? 'Biblioteca de Fichas' : 'Minhas Fichas'}
              subtitle={isAdmin ? '// criar e gerenciar fichas de treino' : '// ver fichas e treino de hoje'}
              accentColor="rgba(108,142,247,0.4)"
              delay={0.12}
            />

            <NavCard
              to="/perfil"
              icon={<User size={20} color="var(--accent-2)" />}
              iconBg="rgba(196,79,224,0.1)"
              title="Meu Perfil"
              subtitle="// ver e editar dados pessoais"
              accentColor="rgba(196,79,224,0.35)"
              delay={0.18}
            />
          </div>
        </div>

        {/* ── Acompanhamento (apenas aluno) ──────────── */}
        {!isAdmin && (
          <motion.div
            initial={{ opacity: 0, y: 16 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, delay: 0.24, ease: [0.22, 1, 0.36, 1] }}
          >
            <div style={{
              fontFamily: "'JetBrains Mono', monospace",
              fontSize: 9,
              letterSpacing: '0.18em',
              textTransform: 'uppercase',
              color: 'var(--fg-3)',
              marginBottom: 10,
              marginTop: 4,
              paddingLeft: 2,
            }}>
              // acompanhamento
            </div>

            <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>

              {/* Histórico de Treinos */}
              <NavCard
                to="/historico"
                icon={<BarChart2 size={20} color="var(--accent-light)" />}
                iconBg="rgba(108,142,247,0.1)"
                title="Histórico de Treinos"
                subtitle={
                  lastSession === undefined
                    ? '// carregando...'
                    : lastSession === null
                      ? '// nenhum treino registrado ainda'
                      : `// último: ${formatDate(lastSession.started_at)} ${lastSession.difficulty ? DIFFICULTY_EMOJI[lastSession.difficulty] : ''} ${lastSession.duration_minutes ? `— ${lastSession.duration_minutes}min` : ''}`
                }
                accentColor="rgba(108,142,247,0.35)"
                delay={0.26}
              />

              {/* Gráficos de Progresso */}
              <NavCard
                to="/progresso"
                icon={<BarChart2 size={20} color="var(--accent-2)" />}
                iconBg="rgba(196,79,224,0.1)"
                title="Gráficos de Progresso"
                subtitle="// evolução de carga e frequência semanal"
                accentColor="rgba(196,79,224,0.3)"
                delay={0.3}
              />

              {/* Peso & Medidas */}
              <NavCard
                to="/medidas"
                icon={<Scale size={20} color="var(--success)" />}
                iconBg="rgba(74,222,128,0.1)"
                title="Peso & Medidas"
                subtitle={
                  lastWeight === undefined
                    ? '// carregando...'
                    : lastWeight === null
                      ? '// registre seu peso para acompanhar'
                      : `// atual: ${Number(lastWeight.weight_kg).toFixed(1)} kg`
                }
                accentColor="rgba(74,222,128,0.3)"
                delay={0.34}
              />
            </div>
          </motion.div>
        )}

        {/* ── Status das fases (apenas admin) ─────────── */}
        {isAdmin && (
          <motion.div
            initial={{ opacity: 0, y: 16 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, delay: 0.24, ease: [0.22, 1, 0.36, 1] }}
            style={{
              background: 'rgba(255,255,255,0.04)',
              backdropFilter: 'blur(20px)',
              WebkitBackdropFilter: 'blur(20px)',
              borderRadius: 20,
              border: '1px solid rgba(108,142,247,0.2)',
              padding: '20px',
              marginTop: 4,
            }}
          >
            <div style={{
              fontFamily: "'JetBrains Mono', monospace",
              fontSize: 9,
              letterSpacing: '0.18em',
              textTransform: 'uppercase',
              color: 'var(--accent)',
              marginBottom: 14,
            }}>
              // status das fases
            </div>

            <div style={{ display: 'flex', flexWrap: 'wrap', gap: 6 }}>
              {[
                { label: 'Auth',       done: true  },
                { label: 'Perfil',     done: true  },
                { label: 'Design v3',  done: true  },
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
                    padding: '4px 10px',
                    borderRadius: '50rem',
                    border: '1px solid',
                    borderColor: phase.done ? 'rgba(108,142,247,0.35)' : 'rgba(255,255,255,0.08)',
                    background: phase.done ? 'rgba(108,142,247,0.1)' : 'transparent',
                    color: phase.done ? 'var(--accent-light)' : 'var(--fg-3)',
                    fontFamily: "'JetBrains Mono', monospace",
                    fontSize: 10,
                    letterSpacing: '0.08em',
                    textTransform: 'uppercase',
                  }}
                >
                  {phase.done ? '✓' : '○'} {phase.label}
                </span>
              ))}
            </div>
          </motion.div>
        )}

      </main>
    </div>
  )
}
