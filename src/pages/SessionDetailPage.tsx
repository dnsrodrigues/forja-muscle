import { useState, useEffect } from 'react'
import { useParams, Link, useNavigate } from 'react-router-dom'
import { motion } from 'motion/react'
import { ArrowLeft, RefreshCw, TrendingUp, Clock, Dumbbell, Hash } from 'lucide-react'
import { getSessionDetail } from '../services/history.service'
import { MUSCLE_GROUP_LABELS } from '../types'
import type { WorkoutLogDetail, ExerciseLogDetail } from '../types'

const DIFFICULTY_LABEL: Record<string, string> = {
  easy: '😊 Fácil',
  medium: '💪 Médio',
  hard: '🔥 Difícil',
  terrible: '💀 Destruidor',
}

function formatDate(iso: string): string {
  return new Date(iso).toLocaleDateString('pt-BR', {
    weekday: 'long', day: '2-digit', month: 'long', year: 'numeric',
  })
}

/** Agrupa ExerciseLogDetail por exercise_id */
function groupByExercise(logs: ExerciseLogDetail[]): { exercise: ExerciseLogDetail['exercise']; sets: ExerciseLogDetail[] }[] {
  const order: string[] = []
  const map: Record<string, { exercise: ExerciseLogDetail['exercise']; sets: ExerciseLogDetail[] }> = {}

  for (const log of logs) {
    if (!map[log.exercise_id]) {
      map[log.exercise_id] = { exercise: log.exercise, sets: [] }
      order.push(log.exercise_id)
    }
    map[log.exercise_id].sets.push(log)
  }

  return order.map((id) => map[id])
}

export function SessionDetailPage() {
  const { logId } = useParams<{ logId: string }>()
  const navigate = useNavigate()
  const [session, setSession] = useState<WorkoutLogDetail | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  async function load() {
    if (!logId) return
    setLoading(true)
    setError(null)
    try {
      const data = await getSessionDetail(logId)
      setSession(data)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Erro ao carregar sessão')
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => { load() }, [logId])

  const exerciseGroups = session?.exercise_logs ? groupByExercise(session.exercise_logs) : []
  const totalSets = session?.exercise_logs?.length ?? 0
  const workoutName = (session?.workout as { name?: string } | undefined)?.name ?? 'Treino'

  return (
    <div className="min-h-screen" style={{ background: 'var(--bg)' }}>

      {/* Grid decorativo */}
      <div className="fixed inset-0 pointer-events-none z-0"
        style={{ display: 'grid', gridTemplateColumns: 'repeat(12, 1fr)' }}>
        {Array.from({ length: 12 }).map((_, i) => (
          <span key={i} style={{ borderRight: '1px solid var(--border)' }} />
        ))}
      </div>

      {/* Header */}
      <header className="sticky top-0 z-20" style={{
        padding: '14px 16px',
        background: 'rgba(5,5,10,0.7)',
        borderBottom: '1px solid var(--border)',
        backdropFilter: 'blur(12px)',
      }}>
        <div className="max-w-xl mx-auto flex items-center gap-3">
          <Link to="/historico" style={{
            color: 'var(--fg-3)', opacity: 0.5, display: 'flex', alignItems: 'center',
          }}>
            <ArrowLeft size={16} />
          </Link>
          <div style={{ flex: 1, minWidth: 0 }}>
            {loading ? (
              <div className="skeleton" style={{ height: 16, width: 140, borderRadius: 3 }} />
            ) : (
              <>
                <div style={{
                  fontFamily: "'DM Mono', monospace", fontSize: 9,
                  color: 'var(--fg-3)', letterSpacing: '0.15em',
                  textTransform: 'uppercase', marginBottom: 1,
                }}>
                  // detalhe da sessão
                </div>
                <div style={{
                  fontFamily: "'Syne', sans-serif", fontWeight: 800,
                  fontSize: 15, color: 'var(--fg)',
                  overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap',
                }}>
                  {workoutName}
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
            <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
              <div className="skeleton" style={{ height: 80, borderRadius: 4 }} />
              {[1, 2, 3].map((i) => (
                <div key={i} className="skeleton" style={{ height: 100, borderRadius: 4 }} />
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
              <div style={{ fontFamily: "'DM Mono', monospace", fontSize: 11, color: 'var(--danger)', marginBottom: 6 }}>
                ⚠ {error}
              </div>
              <button onClick={load} style={{
                display: 'flex', alignItems: 'center', gap: 5,
                background: 'transparent', border: '1px solid var(--border-md)',
                borderRadius: 4, padding: '5px 12px', color: 'var(--fg-2)',
                fontFamily: "'DM Mono', monospace", fontSize: 10,
                letterSpacing: '0.1em', cursor: 'pointer', textTransform: 'uppercase',
              }}>
                <RefreshCw size={10} /> Tentar novamente
              </button>
            </div>
          )}

          {!loading && !error && session && (
            <motion.div
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.3 }}
            >
              {/* Meta da sessão */}
              <div style={{
                background: 'var(--surface)',
                border: '1px solid var(--border)',
                borderLeft: '2px solid var(--accent)',
                padding: '16px',
                marginBottom: 12,
                position: 'relative',
                overflow: 'hidden',
              }}>
                {/* Hatch */}
                <div style={{
                  position: 'absolute', inset: 0,
                  backgroundImage: 'repeating-linear-gradient(-45deg, transparent, transparent 16px, rgba(200,240,74,0.02) 16px, rgba(200,240,74,0.02) 17px)',
                  pointerEvents: 'none',
                }} />

                <div style={{
                  fontFamily: "'DM Mono', monospace", fontSize: 9,
                  color: 'var(--accent)', letterSpacing: '0.15em',
                  textTransform: 'uppercase', marginBottom: 6, position: 'relative',
                }}>
                  {formatDate(session.started_at)}
                </div>

                <div style={{
                  display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)',
                  gap: 8, position: 'relative',
                }}>
                  {[
                    { icon: <Clock size={12} />, val: session.duration_minutes ? `${session.duration_minutes}` : '—', label: 'min' },
                    { icon: <Dumbbell size={12} />, val: String(exerciseGroups.length), label: 'exercícios' },
                    { icon: <Hash size={12} />, val: String(totalSets), label: 'séries' },
                  ].map(({ icon, val, label }) => (
                    <div key={label} style={{
                      background: 'var(--surface-2)',
                      border: '1px solid var(--border)',
                      borderRadius: 4, padding: '10px 8px', textAlign: 'center',
                    }}>
                      <div style={{ color: 'var(--fg-3)', display: 'flex', justifyContent: 'center', marginBottom: 4 }}>
                        {icon}
                      </div>
                      <div style={{
                        fontFamily: "'Syne', sans-serif", fontWeight: 800,
                        fontSize: 18, color: 'var(--accent)', lineHeight: 1, marginBottom: 2,
                      }}>
                        {val}
                      </div>
                      <div style={{
                        fontFamily: "'DM Mono', monospace", fontSize: 7,
                        color: 'var(--fg-3)', letterSpacing: '0.1em', textTransform: 'uppercase',
                      }}>
                        {label}
                      </div>
                    </div>
                  ))}
                </div>

                {session.difficulty && (
                  <div style={{
                    marginTop: 10, fontFamily: "'DM Mono', monospace",
                    fontSize: 10, color: 'var(--fg-2)', position: 'relative',
                  }}>
                    {DIFFICULTY_LABEL[session.difficulty]}
                  </div>
                )}

                {session.notes && (
                  <div style={{
                    marginTop: 8, fontFamily: "'DM Mono', monospace",
                    fontSize: 10, color: 'var(--fg-3)', fontStyle: 'italic',
                    position: 'relative',
                  }}>
                    // {session.notes}
                  </div>
                )}
              </div>

              {/* Exercícios */}
              <div style={{
                fontFamily: "'DM Mono', monospace", fontSize: 9,
                color: 'var(--fg-3)', letterSpacing: '0.15em',
                textTransform: 'uppercase', marginBottom: 10,
              }}>
                // {exerciseGroups.length} exercício{exerciseGroups.length !== 1 ? 's' : ''}
              </div>

              <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
                {exerciseGroups.map(({ exercise, sets }) => (
                  <div key={exercise?.id} style={{
                    background: 'var(--surface)',
                    border: '1px solid var(--border)',
                    borderRadius: 4,
                    overflow: 'hidden',
                  }}>
                    {/* Cabeçalho do exercício */}
                    <div style={{
                      display: 'flex', justifyContent: 'space-between', alignItems: 'center',
                      padding: '10px 14px',
                      borderBottom: '1px solid var(--border)',
                    }}>
                      <div>
                        <div style={{
                          fontFamily: "'Syne', sans-serif", fontWeight: 800,
                          fontSize: 13, color: 'var(--fg)', marginBottom: 2,
                        }}>
                          {exercise?.name ?? 'Exercício'}
                        </div>
                        {exercise?.muscle_group && (
                          <div style={{
                            display: 'inline-block',
                            fontFamily: "'DM Mono', monospace", fontSize: 8,
                            color: 'var(--accent)', letterSpacing: '0.1em',
                            textTransform: 'uppercase',
                            border: '1px solid rgba(200,240,74,0.2)',
                            padding: '1px 6px',
                          }}>
                            {MUSCLE_GROUP_LABELS[exercise.muscle_group]}
                          </div>
                        )}
                      </div>

                      {/* Botão ver evolução */}
                      <button
                        onClick={() => navigate(`/progresso?exercise=${exercise?.id}`)}
                        title="Ver evolução de carga"
                        style={{
                          display: 'flex', alignItems: 'center', gap: 4,
                          background: 'transparent',
                          border: '1px solid var(--border-md)',
                          borderRadius: 4, padding: '5px 8px',
                          color: 'var(--fg-3)',
                          fontFamily: "'DM Mono', monospace", fontSize: 8,
                          letterSpacing: '0.08em', textTransform: 'uppercase',
                          cursor: 'pointer', flexShrink: 0,
                          transition: 'border-color 0.15s, color 0.15s',
                        }}
                        onMouseEnter={(e) => {
                          e.currentTarget.style.borderColor = 'var(--accent)'
                          e.currentTarget.style.color = 'var(--accent)'
                        }}
                        onMouseLeave={(e) => {
                          e.currentTarget.style.borderColor = 'var(--border-md)'
                          e.currentTarget.style.color = 'var(--fg-3)'
                        }}
                      >
                        <TrendingUp size={10} />
                        evolução
                      </button>
                    </div>

                    {/* Séries */}
                    <div style={{ padding: '8px 14px' }}>
                      <div style={{
                        display: 'grid',
                        gridTemplateColumns: '40px 1fr 1fr 20px',
                        gap: 4,
                        marginBottom: 4,
                      }}>
                        {['SÉR.', 'REPS', 'CARGA', ''].map((h) => (
                          <div key={h} style={{
                            fontFamily: "'DM Mono', monospace", fontSize: 7,
                            color: 'var(--fg-3)', letterSpacing: '0.1em',
                            textTransform: 'uppercase',
                          }}>
                            {h}
                          </div>
                        ))}
                      </div>
                      {sets.map((set) => (
                        <div key={set.id} style={{
                          display: 'grid',
                          gridTemplateColumns: '40px 1fr 1fr 20px',
                          gap: 4,
                          padding: '5px 0',
                          borderTop: '1px solid var(--border)',
                        }}>
                          <div style={{
                            fontFamily: "'DM Mono', monospace", fontSize: 10,
                            color: 'var(--fg-3)',
                          }}>
                            {set.set_number}
                          </div>
                          <div style={{
                            fontFamily: "'DM Mono', monospace", fontSize: 10,
                            color: 'var(--fg)',
                          }}>
                            {set.reps_completed} rep{set.reps_completed !== 1 ? 's' : ''}
                          </div>
                          <div style={{
                            fontFamily: "'DM Mono', monospace", fontSize: 10,
                            color: 'var(--fg)',
                          }}>
                            {set.load_kg > 0 ? `${set.load_kg} kg` : 'peso corp.'}
                          </div>
                          <div style={{ fontSize: 10, color: 'var(--success)' }}>✓</div>
                        </div>
                      ))}
                    </div>
                  </div>
                ))}
              </div>

            </motion.div>
          )}

        </div>
      </main>
    </div>
  )
}
