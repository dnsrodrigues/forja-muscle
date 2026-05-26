import { useState, useEffect } from 'react'
import { useParams, Link, useNavigate } from 'react-router-dom'
import { motion } from 'motion/react'
import { ArrowLeft, RefreshCw, Play } from 'lucide-react'
import { getWorkoutById } from '../services/workout.service'
import { ExerciseRow } from '../components/ExerciseRow'
import type { Workout } from '../types'
import { WEEK_DAY_SHORT } from '../types'

export function WorkoutDetailPage() {
  const { id } = useParams<{ id: string }>()
  const navigate = useNavigate()
  const [workout, setWorkout] = useState<Workout | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  async function load() {
    if (!id) return
    setLoading(true)
    setError(null)
    try {
      const data = await getWorkoutById(id)
      setWorkout(data)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Erro ao carregar ficha')
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => { load() }, [id])

  const daysLabel = workout?.week_days
    .map((d) => WEEK_DAY_SHORT[d])
    .join(' · ') ?? ''

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
            to="/workouts"
            style={{ color: 'var(--fg-3)', opacity: 0.5, display: 'flex', alignItems: 'center' }}
          >
            <ArrowLeft size={16} />
          </Link>
          <div style={{ flex: 1, minWidth: 0 }}>
            {loading ? (
              <div className="skeleton" style={{ height: 18, width: 160, borderRadius: 3 }} />
            ) : (
              <>
                <div style={{
                  fontFamily: "'JetBrains Mono', monospace",
                  fontSize: 9,
                  color: 'var(--fg-3)',
                  letterSpacing: '0.15em',
                  textTransform: 'uppercase',
                  marginBottom: 1,
                }}>
                  {daysLabel || '// ficha de treino'}
                </div>
                <div style={{
                  fontFamily: "'Outfit', sans-serif",
                  fontWeight: 800,
                  fontSize: 16,
                  color: 'var(--fg)',
                  letterSpacing: '-0.01em',
                  overflow: 'hidden',
                  textOverflow: 'ellipsis',
                  whiteSpace: 'nowrap',
                }}>
                  {workout?.name ?? '—'}
                </div>
              </>
            )}
          </div>
        </div>
      </header>

      {/* Conteúdo */}
      <main className="relative z-10">
        <div className="max-w-xl mx-auto" style={{ padding: '20px 16px 40px' }}>

          {/* Loading */}
          {loading && (
            <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
              {[1, 2, 3, 4, 5].map((i) => (
                <div key={i} className="skeleton" style={{ height: 64, borderRadius: 4 }} />
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

          {/* Botão Iniciar Treino */}
          {!loading && !error && workout && workout.exercises && workout.exercises.length > 0 && (
            <motion.div
              initial={{ opacity: 0, y: 8 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.3 }}
              style={{ marginBottom: 16 }}
            >
              <button
                onClick={() => navigate(`/workouts/${id}/session`)}
                style={{
                  width: '100%',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  gap: 8,
                  background: 'var(--accent)',
                  border: 'none',
                  borderRadius: 8,
                  padding: '14px',
                  fontFamily: "'Outfit', sans-serif",
                  fontWeight: 800,
                  fontSize: 13,
                  color: '#05050a',
                  letterSpacing: '0.04em',
                  textTransform: 'uppercase',
                  cursor: 'pointer',
                  transition: 'opacity 0.15s',
                }}
                onMouseEnter={(e) => (e.currentTarget.style.opacity = '0.88')}
                onMouseLeave={(e) => (e.currentTarget.style.opacity = '1')}
              >
                <Play size={15} fill="var(--bg)" strokeWidth={0} />
                Iniciar Treino
              </button>
            </motion.div>
          )}

          {/* Lista de exercícios */}
          {!loading && !error && workout && (
            <motion.div
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.3 }}
            >
              {/* Descrição (se tiver) */}
              {workout.description && (
                <div style={{
                  fontFamily: "'JetBrains Mono', monospace",
                  fontSize: 11,
                  color: 'var(--fg-3)',
                  fontStyle: 'italic',
                  marginBottom: 16,
                  paddingBottom: 16,
                  borderBottom: '1px solid var(--border)',
                }}>
                  // {workout.description}
                </div>
              )}

              {/* Contador */}
              <div style={{
                fontFamily: "'JetBrains Mono', monospace",
                fontSize: 9,
                color: 'var(--fg-3)',
                letterSpacing: '0.15em',
                textTransform: 'uppercase',
                marginBottom: 10,
              }}>
                // {workout.exercises?.length ?? 0} exercícios
              </div>

              {/* Exercícios */}
              {(!workout.exercises || workout.exercises.length === 0) ? (
                <div style={{
                  border: '1px dashed var(--border)',
                  borderRadius: 4,
                  padding: '24px',
                  textAlign: 'center',
                  fontFamily: "'JetBrains Mono', monospace",
                  fontSize: 10,
                  color: 'var(--fg-3)',
                  fontStyle: 'italic',
                }}>
                  // nenhum exercício cadastrado nesta ficha
                </div>
              ) : (
                <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
                  {workout.exercises
                    .slice()
                    .sort((a, b) => a.order_index - b.order_index)
                    .map((ex, idx) => (
                      <ExerciseRow
                        key={ex.id}
                        item={ex as any}
                        index={idx}
                        editable={false}
                      />
                    ))}
                </div>
              )}
            </motion.div>
          )}

        </div>
      </main>
    </div>
  )
}
