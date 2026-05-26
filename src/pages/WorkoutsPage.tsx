import { useState, useEffect } from 'react'
import { useNavigate, Link } from 'react-router-dom'
import { motion } from 'motion/react'
import { ArrowLeft, RefreshCw } from 'lucide-react'
import { useAuth } from '../context/AuthContext'
import { getMyWorkouts } from '../services/workout.service'
import { WorkoutCard } from '../components/WorkoutCard'
import type { Workout, WeekDay } from '../types'

// Mapeia getDay() → WeekDay
const DAY_MAP: Record<number, WeekDay> = {
  0: 'sunday',
  1: 'monday',
  2: 'tuesday',
  3: 'wednesday',
  4: 'thursday',
  5: 'friday',
  6: 'saturday',
}

const DAY_LABEL_PT: Record<WeekDay, string> = {
  monday: 'segunda-feira',
  tuesday: 'terça-feira',
  wednesday: 'quarta-feira',
  thursday: 'quinta-feira',
  friday: 'sexta-feira',
  saturday: 'sábado',
  sunday: 'domingo',
}

export function WorkoutsPage() {
  const { profile } = useAuth()
  const navigate = useNavigate()

  const [workouts, setWorkouts] = useState<Workout[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  const todayKey = DAY_MAP[new Date().getDay()]
  const todayLabel = DAY_LABEL_PT[todayKey]
  const todayWorkout = workouts.find((w) => w.week_days.includes(todayKey))
  const otherWorkouts = workouts.filter((w) => !w.week_days.includes(todayKey))

  async function load() {
    if (!profile?.id) return
    setLoading(true)
    setError(null)
    try {
      const data = await getMyWorkouts(profile.id)
      setWorkouts(data)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Erro ao carregar fichas')
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => { load() }, [profile?.id])

  return (
    <div className="min-h-screen" style={{ background: 'var(--bg)' }}>

      {/* Grid lines decorativo */}
      <div className="fixed inset-0 pointer-events-none z-0"
        style={{ display: 'grid', gridTemplateColumns: 'repeat(12, 1fr)' }}>
        {Array.from({ length: 12 }).map((_, i) => (
          <span key={i} style={{ borderRight: '1px solid var(--border)' }} />
        ))}
      </div>

      {/* Header */}
      <header
        className="sticky top-0 z-20"
        style={{
          padding: '14px 16px',
          background: 'rgba(6, 7, 26,0.7)',
          borderBottom: '1px solid var(--border)',
          backdropFilter: 'blur(12px)',
        }}
      >
        <div className="max-w-xl mx-auto flex items-center gap-3">
          <Link
            to="/dashboard"
            style={{ color: 'var(--fg-3)', opacity: 0.5, display: 'flex', alignItems: 'center' }}
          >
            <ArrowLeft size={16} />
          </Link>
          <div>
            <div style={{
              fontFamily: "'JetBrains Mono', monospace",
              fontSize: 9,
              color: 'var(--fg-3)',
              letterSpacing: '0.15em',
              textTransform: 'uppercase',
              marginBottom: 1,
            }}>
              // {todayLabel}
            </div>
            <div style={{
              fontFamily: "'Outfit', sans-serif",
              fontWeight: 800,
              fontSize: 16,
              color: 'var(--fg)',
              letterSpacing: '-0.01em',
            }}>
              Minhas Fichas
            </div>
          </div>
        </div>
      </header>

      {/* Conteúdo */}
      <main className="relative z-10">
        <div className="max-w-xl mx-auto" style={{ padding: '20px 16px 40px' }}>

          {/* Loading */}
          {loading && (
            <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
              {[1, 2, 3].map((i) => (
                <div
                  key={i}
                  className="skeleton"
                  style={{ height: 76, borderRadius: 4 }}
                />
              ))}
            </div>
          )}

          {/* Erro */}
          {!loading && error && (
            <div style={{
              borderLeft: '2px solid var(--danger)',
              background: 'rgba(239,68,68,0.05)',
              borderRadius: '0 4px 4px 0',
              padding: '12px 16px',
              marginBottom: 16,
            }}>
              <div style={{ fontFamily: "'JetBrains Mono', monospace", fontSize: 11, color: 'var(--danger)', marginBottom: 6 }}>
                ⚠ {error}
              </div>
              <button
                onClick={load}
                style={{
                  display: 'flex', alignItems: 'center', gap: 5,
                  background: 'transparent',
                  border: '1px solid var(--border-md)',
                  borderRadius: 4,
                  padding: '5px 12px',
                  color: 'var(--fg-2)',
                  fontFamily: "'JetBrains Mono', monospace",
                  fontSize: 10,
                  letterSpacing: '0.1em',
                  cursor: 'pointer',
                  textTransform: 'uppercase',
                }}
              >
                <RefreshCw size={10} /> Tentar novamente
              </button>
            </div>
          )}

          {/* Sem fichas */}
          {!loading && !error && workouts.length === 0 && (
            <div style={{
              border: '1px dashed var(--border)',
              borderRadius: 4,
              padding: '32px 24px',
              textAlign: 'center',
            }}>
              <div style={{ fontSize: 28, marginBottom: 10 }}>📋</div>
              <div style={{ fontFamily: "'Outfit', sans-serif", fontWeight: 800, fontSize: 14, color: 'var(--fg)', marginBottom: 4 }}>
                Nenhuma ficha ainda
              </div>
              <div style={{ fontFamily: "'JetBrains Mono', monospace", fontSize: 10, color: 'var(--fg-3)', fontStyle: 'italic' }}>
                // seu personal ainda não criou fichas para você
              </div>
            </div>
          )}

          {/* Ficha de hoje — destaque */}
          {!loading && !error && todayWorkout && (
            <motion.div
              initial={{ opacity: 0, y: 12 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.3 }}
              style={{ marginBottom: 20 }}
            >
              <div style={{
                fontFamily: "'JetBrains Mono', monospace",
                fontSize: 9,
                color: 'var(--accent)',
                letterSpacing: '0.15em',
                textTransform: 'uppercase',
                marginBottom: 8,
              }}>
                // recomendado hoje
              </div>
              <div
                onClick={() => navigate(`/workouts/${todayWorkout.id}`)}
                style={{
                  background: 'var(--surface)',
                  border: '1px solid var(--accent)',
                  borderLeft: '3px solid var(--accent)',
                  borderRadius: 4,
                  padding: '18px 16px',
                  cursor: 'pointer',
                  boxShadow: '0 0 24px rgba(108, 142, 247,0.06)',
                }}
              >
                <div style={{
                  fontFamily: "'Outfit', sans-serif",
                  fontWeight: 800,
                  fontSize: 18,
                  color: 'var(--fg)',
                  marginBottom: 4,
                }}>
                  {todayWorkout.name}
                </div>
                <div style={{
                  fontFamily: "'JetBrains Mono', monospace",
                  fontSize: 10,
                  color: 'var(--fg-3)',
                  marginBottom: 14,
                }}>
                  {todayWorkout.exercises?.length ?? 0} exercícios
                </div>
                <div style={{
                  background: 'var(--accent)',
                  color: 'var(--bg)',
                  fontFamily: "'Outfit', sans-serif",
                  fontWeight: 800,
                  fontSize: 11,
                  letterSpacing: '0.15em',
                  textTransform: 'uppercase',
                  padding: '10px 16px',
                  textAlign: 'center',
                  borderRadius: 2,
                }}>
                  Ver Treino →
                </div>
              </div>
            </motion.div>
          )}

          {/* Outras fichas */}
          {!loading && !error && otherWorkouts.length > 0 && (
            <motion.div
              initial={{ opacity: 0, y: 12 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.3, delay: 0.1 }}
            >
              {todayWorkout && (
                <div style={{
                  fontFamily: "'JetBrains Mono', monospace",
                  fontSize: 9,
                  color: 'var(--fg-3)',
                  letterSpacing: '0.15em',
                  textTransform: 'uppercase',
                  marginBottom: 8,
                }}>
                  // outras fichas
                </div>
              )}
              <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
                {otherWorkouts.map((workout) => (
                  <WorkoutCard
                    key={workout.id}
                    workout={workout}
                    onClick={() => navigate(`/workouts/${workout.id}`)}
                  />
                ))}
              </div>
            </motion.div>
          )}

          {/* Lista completa quando não há ficha de hoje */}
          {!loading && !error && workouts.length > 0 && !todayWorkout && (
            <motion.div
              initial={{ opacity: 0, y: 12 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.3 }}
              style={{ display: 'flex', flexDirection: 'column', gap: 8 }}
            >
              {workouts.map((workout) => (
                <WorkoutCard
                  key={workout.id}
                  workout={workout}
                  onClick={() => navigate(`/workouts/${workout.id}`)}
                />
              ))}
            </motion.div>
          )}

        </div>
      </main>
    </div>
  )
}
