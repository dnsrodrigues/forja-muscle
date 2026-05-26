import { useState, useEffect } from 'react'
import { useParams, Link, useNavigate } from 'react-router-dom'
import { motion } from 'motion/react'
import { getSessionDetail } from '../services/history.service'
import { Topbar } from '../components/layout/Topbar'
import { Icon } from '../components/ui/Icon'
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
    weekday: 'long',
    day: '2-digit',
    month: 'long',
    year: 'numeric',
  })
}

function groupByExercise(logs: ExerciseLogDetail[]) {
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

  useEffect(() => { void load() }, [logId])

  const exerciseGroups = session?.exercise_logs ? groupByExercise(session.exercise_logs) : []
  const totalSets = session?.exercise_logs?.length ?? 0
  const workoutName = (session?.workout as { name?: string } | undefined)?.name ?? 'TREINO'
  const totalVolume = exerciseGroups.reduce(
    (sum, g) => sum + g.sets.reduce((s, set) => s + (Number(set.load_kg) || 0) * set.reps_completed, 0),
    0,
  )

  return (
    <>
      <Topbar
        eyebrow={loading ? 'CARREGANDO...' : session ? formatDate(session.started_at).toUpperCase() : 'SESSÃO'}
        title={loading ? '—' : workoutName.toUpperCase()}
        actions={
          <Link to="/historico" className="btn ghost">
            <Icon name="arrowL" size={14} /> Voltar
          </Link>
        }
      />

      <div className="content">
        {loading && (
          <>
            <div className="skeleton" style={{ height: 120, borderRadius: 14 }} />
            {[1, 2, 3].map((i) => (
              <div key={i} className="skeleton" style={{ height: 140, borderRadius: 14 }} />
            ))}
          </>
        )}

        {!loading && error && (
          <div
            className="card"
            style={{ borderLeft: '2px solid var(--danger)', background: 'rgba(255,61,85,0.05)' }}
          >
            <div style={{ color: 'var(--danger)', marginBottom: 8 }}>⚠ {error}</div>
            <button onClick={load} className="btn ghost">Tentar novamente</button>
          </div>
        )}

        {!loading && !error && session && (
          <motion.div
            initial={{ opacity: 0, y: 8 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.3 }}
            style={{ display: 'flex', flexDirection: 'column', gap: 24 }}
          >
            {/* Meta da sessão */}
            <div
              className="card card-accent"
              style={{ padding: 32, position: 'relative', overflow: 'hidden' }}
            >
              <div className="eyebrow" style={{ color: 'rgba(0,0,0,0.55)' }}>SESSÃO COMPLETA</div>
              <div className="forja-session-meta">
                <div>
                  <div className="stat-label" style={{ color: 'rgba(0,0,0,0.55)' }}>Duração</div>
                  <div className="f-display" style={{ fontSize: 64, lineHeight: 0.95 }}>
                    {session.duration_minutes ?? '—'}
                    <span className="stat-unit" style={{ color: 'rgba(0,0,0,0.6)' }}>min</span>
                  </div>
                </div>
                <div style={{ width: 1, height: 70, background: 'rgba(0,0,0,0.2)' }} />
                <div>
                  <div className="stat-label" style={{ color: 'rgba(0,0,0,0.55)' }}>Exercícios</div>
                  <div className="f-display" style={{ fontSize: 64, lineHeight: 0.95 }}>
                    {String(exerciseGroups.length).padStart(2, '0')}
                  </div>
                </div>
                <div style={{ width: 1, height: 70, background: 'rgba(0,0,0,0.2)' }} />
                <div>
                  <div className="stat-label" style={{ color: 'rgba(0,0,0,0.55)' }}>Séries</div>
                  <div className="f-display" style={{ fontSize: 64, lineHeight: 0.95 }}>
                    {totalSets}
                  </div>
                </div>
                <div style={{ width: 1, height: 70, background: 'rgba(0,0,0,0.2)' }} />
                <div>
                  <div className="stat-label" style={{ color: 'rgba(0,0,0,0.55)' }}>Volume</div>
                  <div className="f-display" style={{ fontSize: 64, lineHeight: 0.95 }}>
                    {Math.round(totalVolume)}
                    <span className="stat-unit" style={{ color: 'rgba(0,0,0,0.6)' }}>kg</span>
                  </div>
                </div>
              </div>

              {(session.difficulty || session.notes) && (
                <div style={{ marginTop: 18, display: 'flex', gap: 18, flexWrap: 'wrap' }}>
                  {session.difficulty && (
                    <div style={{ fontSize: 14, color: 'rgba(0,0,0,0.7)' }}>
                      {DIFFICULTY_LABEL[session.difficulty]}
                    </div>
                  )}
                  {session.notes && (
                    <div style={{ fontSize: 14, color: 'rgba(0,0,0,0.7)', fontStyle: 'italic' }}>
                      "{session.notes}"
                    </div>
                  )}
                </div>
              )}
            </div>

            {/* Exercícios */}
            <div className="col gap-3">
              <div className="label-sm">
                {exerciseGroups.length} exercício{exerciseGroups.length !== 1 ? 's' : ''} registrado{exerciseGroups.length !== 1 ? 's' : ''}
              </div>
              {exerciseGroups.map(({ exercise, sets }) => {
                const exVolume = sets.reduce((s, set) => s + (Number(set.load_kg) || 0) * set.reps_completed, 0)
                return (
                  <div key={exercise?.id} className="card" style={{ padding: 0, overflow: 'hidden' }}>
                    {/* Cabeçalho */}
                    <div
                      style={{
                        display: 'flex',
                        justifyContent: 'space-between',
                        alignItems: 'center',
                        padding: '14px 20px',
                        borderBottom: '1px solid var(--hairline)',
                      }}
                    >
                      <div>
                        <div
                          className="f-display"
                          style={{ fontSize: 24, color: 'var(--text)', lineHeight: 1 }}
                        >
                          {(exercise?.name ?? 'EXERCÍCIO').toUpperCase()}
                        </div>
                        {exercise?.muscle_group && (
                          <span
                            className="chip muscle"
                            style={{ fontSize: 9, padding: '2px 8px', marginTop: 6 }}
                          >
                            {MUSCLE_GROUP_LABELS[exercise.muscle_group]}
                          </span>
                        )}
                      </div>
                      <div style={{ display: 'flex', gap: 18, alignItems: 'center' }}>
                        <div style={{ textAlign: 'right' }}>
                          <div className="stat-label">Volume</div>
                          <div className="f-display" style={{ fontSize: 20, color: 'var(--accent)' }}>
                            {Math.round(exVolume)}
                            <span className="stat-unit" style={{ fontSize: 11 }}>kg</span>
                          </div>
                        </div>
                        <button
                          onClick={() => navigate(`/progresso?exercise=${exercise?.id}`)}
                          className="btn ghost"
                          title="Ver evolução"
                        >
                          <Icon name="trending" size={14} />
                        </button>
                      </div>
                    </div>

                    {/* Séries */}
                    <div style={{ padding: 0 }}>
                      <div
                        style={{
                          display: 'grid',
                          gridTemplateColumns: '40px 1fr 1fr 1fr',
                          gap: 12,
                          padding: '10px 20px',
                          borderBottom: '1px solid var(--hairline)',
                          color: 'var(--text-faint)',
                          fontSize: 9,
                          textTransform: 'uppercase',
                          letterSpacing: '0.12em',
                          fontWeight: 600,
                        }}
                      >
                        <div>SÉR.</div>
                        <div>Reps</div>
                        <div>Carga</div>
                        <div style={{ textAlign: 'right' }}>Volume</div>
                      </div>
                      {sets.map((set) => (
                        <div
                          key={set.id}
                          style={{
                            display: 'grid',
                            gridTemplateColumns: '40px 1fr 1fr 1fr',
                            gap: 12,
                            padding: '10px 20px',
                            borderBottom: '1px solid var(--hairline)',
                            alignItems: 'center',
                          }}
                        >
                          <div
                            className="f-display"
                            style={{ fontSize: 22, color: 'var(--text-dim)' }}
                          >
                            {String(set.set_number).padStart(2, '0')}
                          </div>
                          <div className="f-mono" style={{ fontSize: 13, color: 'var(--text)' }}>
                            {set.reps_completed}
                          </div>
                          <div className="f-mono" style={{ fontSize: 13, color: 'var(--text)' }}>
                            {set.load_kg ? `${set.load_kg}kg` : 'peso corp.'}
                          </div>
                          <div
                            className="f-mono"
                            style={{ fontSize: 13, color: 'var(--text-dim)', textAlign: 'right' }}
                          >
                            {Math.round((Number(set.load_kg) || 0) * set.reps_completed)}kg
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                )
              })}
            </div>
          </motion.div>
        )}
      </div>

      <style>{`
        .forja-session-meta {
          display: flex;
          gap: 36px;
          margin-top: 12px;
          align-items: center;
          flex-wrap: wrap;
        }
        @media (max-width: 768px) {
          .forja-session-meta { gap: 20px; }
        }
      `}</style>
    </>
  )
}
