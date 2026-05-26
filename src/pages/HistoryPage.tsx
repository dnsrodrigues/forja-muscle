import { useState, useEffect } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { motion } from 'motion/react'
import { ArrowLeft, RefreshCw } from 'lucide-react'
import { useAuth } from '../context/AuthContext'
import { getWorkoutHistory } from '../services/history.service'
import type { WorkoutLog } from '../types'

const DIFFICULTY_EMOJI: Record<string, string> = {
  easy: '😊',
  medium: '💪',
  hard: '🔥',
  terrible: '💀',
}

function formatDate(iso: string): string {
  const d = new Date(iso)
  return d.toLocaleDateString('pt-BR', {
    weekday: 'short',
    day: '2-digit',
    month: 'short',
    year: 'numeric',
  })
}

export function HistoryPage() {
  const { profile } = useAuth()
  const navigate = useNavigate()
  const [sessions, setSessions] = useState<WorkoutLog[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  async function load() {
    if (!profile?.id) return
    setLoading(true)
    setError(null)
    try {
      const data = await getWorkoutHistory(profile.id)
      setSessions(data)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Erro ao carregar histórico')
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => { load() }, [profile?.id])

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
          <Link to="/dashboard" style={{
            color: 'var(--fg-3)', opacity: 0.5, display: 'flex', alignItems: 'center'
          }}>
            <ArrowLeft size={16} />
          </Link>
          <div>
            <div style={{
              fontFamily: "'DM Mono', monospace", fontSize: 9,
              color: 'var(--fg-3)', letterSpacing: '0.15em',
              textTransform: 'uppercase', marginBottom: 1,
            }}>
              // histórico
            </div>
            <div style={{
              fontFamily: "'Syne', sans-serif", fontWeight: 800,
              fontSize: 16, color: 'var(--fg)',
            }}>
              Treinos Realizados
            </div>
          </div>
        </div>
      </header>

      {/* Conteúdo */}
      <main className="relative z-10">
        <div className="max-w-xl mx-auto" style={{ padding: '20px 16px 40px' }}>

          {/* Loading */}
          {loading && (
            <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
              {[1, 2, 3, 4].map((i) => (
                <div key={i} className="skeleton" style={{ height: 80, borderRadius: 4 }} />
              ))}
            </div>
          )}

          {/* Erro */}
          {!loading && error && (
            <div style={{
              borderLeft: '2px solid var(--danger)',
              background: 'rgba(239,68,68,0.05)',
              borderRadius: '0 4px 4px 0',
              padding: '12px 16px', marginBottom: 16,
            }}>
              <div style={{
                fontFamily: "'DM Mono', monospace", fontSize: 11,
                color: 'var(--danger)', marginBottom: 6,
              }}>
                ⚠ {error}
              </div>
              <button
                onClick={load}
                style={{
                  display: 'flex', alignItems: 'center', gap: 5,
                  background: 'transparent', border: '1px solid var(--border-md)',
                  borderRadius: 4, padding: '5px 12px', color: 'var(--fg-2)',
                  fontFamily: "'DM Mono', monospace", fontSize: 10,
                  letterSpacing: '0.1em', cursor: 'pointer', textTransform: 'uppercase',
                }}
              >
                <RefreshCw size={10} /> Tentar novamente
              </button>
            </div>
          )}

          {/* Vazio */}
          {!loading && !error && sessions.length === 0 && (
            <div style={{
              border: '1px dashed var(--border)',
              borderRadius: 4, padding: '40px 24px', textAlign: 'center',
            }}>
              <div style={{ fontSize: 36, marginBottom: 12 }}>🏋️</div>
              <div style={{
                fontFamily: "'Syne', sans-serif", fontWeight: 800,
                fontSize: 15, color: 'var(--fg)', marginBottom: 8,
              }}>
                Nenhum treino registrado ainda
              </div>
              <div style={{
                fontFamily: "'DM Mono', monospace", fontSize: 10,
                color: 'var(--fg-3)', fontStyle: 'italic', marginBottom: 20,
              }}>
                // complete uma sessão para ver o histórico
              </div>
              <button
                onClick={() => navigate('/workouts')}
                style={{
                  display: 'inline-flex', alignItems: 'center', gap: 6,
                  background: 'var(--accent)', border: 'none', borderRadius: 4,
                  padding: '9px 18px', color: 'var(--bg)',
                  fontFamily: "'Syne', sans-serif", fontWeight: 800,
                  fontSize: 10, letterSpacing: '0.15em', textTransform: 'uppercase', cursor: 'pointer',
                }}
              >
                Começar agora →
              </button>
            </div>
          )}

          {/* Lista */}
          {!loading && !error && sessions.length > 0 && (
            <motion.div
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.3 }}
            >
              <div style={{
                fontFamily: "'DM Mono', monospace", fontSize: 9,
                color: 'var(--fg-3)', letterSpacing: '0.15em',
                textTransform: 'uppercase', marginBottom: 10,
              }}>
                // {sessions.length} sessão{sessions.length !== 1 ? 'ões' : ''} registrada{sessions.length !== 1 ? 's' : ''}
              </div>

              <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
                {sessions.map((session, idx) => {
                  const workout = (session as WorkoutLog & { workout?: { name: string } }).workout
                  const diffEmoji = session.difficulty ? DIFFICULTY_EMOJI[session.difficulty] : null

                  return (
                    <motion.div
                      key={session.id}
                      initial={{ opacity: 0, y: 8 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ duration: 0.25, delay: idx * 0.04 }}
                    >
                      <Link
                        to={`/historico/${session.id}`}
                        style={{
                          display: 'block',
                          background: 'var(--surface)',
                          border: '1px solid var(--border)',
                          borderLeft: '2px solid var(--border-md)',
                          borderRadius: 4,
                          padding: '12px 14px',
                          textDecoration: 'none',
                          transition: 'border-left-color 0.15s, background 0.15s',
                        }}
                        onMouseEnter={(e) => {
                          e.currentTarget.style.borderLeftColor = 'var(--accent)'
                          e.currentTarget.style.background = 'rgba(200,240,74,0.03)'
                        }}
                        onMouseLeave={(e) => {
                          e.currentTarget.style.borderLeftColor = 'var(--border-md)'
                          e.currentTarget.style.background = 'var(--surface)'
                        }}
                      >
                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', gap: 8 }}>
                          <div style={{ minWidth: 0, flex: 1 }}>
                            {/* Nome da ficha */}
                            <div style={{
                              fontFamily: "'Syne', sans-serif", fontWeight: 800,
                              fontSize: 13, color: 'var(--fg)',
                              overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap',
                              marginBottom: 4,
                            }}>
                              {workout?.name ?? 'Treino'}
                            </div>

                            {/* Meta info */}
                            <div style={{
                              display: 'flex', alignItems: 'center', gap: 10, flexWrap: 'wrap',
                            }}>
                              <span style={{
                                fontFamily: "'DM Mono', monospace", fontSize: 9,
                                color: 'var(--fg-3)',
                              }}>
                                {formatDate(session.started_at)}
                              </span>
                              {session.duration_minutes && (
                                <span style={{
                                  fontFamily: "'DM Mono', monospace", fontSize: 9,
                                  color: 'var(--accent)', opacity: 0.8,
                                }}>
                                  {session.duration_minutes} min
                                </span>
                              )}
                              {diffEmoji && (
                                <span style={{ fontSize: 13 }}>{diffEmoji}</span>
                              )}
                            </div>
                          </div>

                          {/* Seta */}
                          <div style={{ color: 'var(--fg-3)', opacity: 0.4, fontSize: 12, flexShrink: 0 }}>
                            →
                          </div>
                        </div>
                      </Link>
                    </motion.div>
                  )
                })}
              </div>
            </motion.div>
          )}

        </div>
      </main>
    </div>
  )
}
