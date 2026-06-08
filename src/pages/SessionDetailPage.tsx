import { useState, useEffect } from 'react'
import { useParams, Link, useNavigate } from 'react-router-dom'
import { motion } from 'motion/react'
import { getSessionDetail } from '../services/history.service'
import { updateWorkoutLog, updateExerciseLog } from '../services/workout-log.service'
import { Topbar } from '../components/layout/Topbar'
import { Icon } from '../components/ui/Icon'
import { useToast } from '../context/ToastContext'
import { MUSCLE_GROUP_LABELS } from '../types'
import type { WorkoutLogDetail, ExerciseLogDetail } from '../types'

const DIFFICULTY_LABEL: Record<string, string> = {
  easy: '😊 Fácil',
  medium: '💪 Médio',
  hard: '🔥 Difícil',
  terrible: '💀 Destruidor',
}

const DIFFICULTY_OPTIONS = [
  { value: 'easy', label: '😊 Fácil' },
  { value: 'medium', label: '💪 Médio' },
  { value: 'hard', label: '🔥 Difícil' },
  { value: 'terrible', label: '💀 Destruidor' },
]

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
  const { showToast } = useToast()
  const [session, setSession] = useState<WorkoutLogDetail | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  // Estado do modo de edição
  const [isEditing, setIsEditing] = useState(false)
  const [saving, setSaving] = useState(false)
  const [editDuration, setEditDuration] = useState('')
  const [editDifficulty, setEditDifficulty] = useState('')
  const [editNotes, setEditNotes] = useState('')
  const [editSets, setEditSets] = useState<Record<string, { reps: string; load: string }>>({})

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

  function startEdit() {
    if (!session) return
    setEditDuration(String(session.duration_minutes ?? ''))
    setEditDifficulty(session.difficulty ?? '')
    setEditNotes(session.notes ?? '')
    const sets: Record<string, { reps: string; load: string }> = {}
    for (const log of session.exercise_logs ?? []) {
      sets[log.id] = {
        reps: String(log.reps_completed),
        load: log.load_kg != null && log.load_kg > 0 ? String(log.load_kg) : '',
      }
    }
    setEditSets(sets)
    setIsEditing(true)
  }

  function cancelEdit() {
    setIsEditing(false)
  }

  async function handleSaveEdit() {
    if (!session || !logId) return
    setSaving(true)
    try {
      await updateWorkoutLog(logId, {
        durationMinutes: parseInt(editDuration, 10) || 0,
        difficulty: editDifficulty,
        notes: editNotes,
      })
      for (const [id, vals] of Object.entries(editSets)) {
        const repsNum = parseInt(vals.reps, 10)
        const loadNum = vals.load !== '' ? parseFloat(vals.load) : null
        if (!isNaN(repsNum) && repsNum > 0) {
          await updateExerciseLog(id, { repsCompleted: repsNum, loadKg: loadNum })
        }
      }
      showToast('Sessão atualizada com sucesso!', 'success')
      setIsEditing(false)
      await load()
    } catch (err) {
      showToast(err instanceof Error ? err.message : 'Erro ao salvar', 'error')
    } finally {
      setSaving(false)
    }
  }

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
          <div style={{ display: 'flex', gap: 8 }}>
            {!isEditing && session && (
              <button onClick={startEdit} className="btn ghost">
                <Icon name="edit" size={14} /> Editar
              </button>
            )}
            <Link to="/historico" className="btn ghost">
              <Icon name="arrowL" size={14} /> Voltar
            </Link>
          </div>
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
              className={isEditing ? 'card' : 'card card-accent'}
              style={{ padding: 32, position: 'relative', overflow: 'hidden' }}
            >
              {isEditing ? (
                <>
                  <div className="eyebrow" style={{ marginBottom: 18 }}>EDITAR SESSÃO</div>
                  <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
                    <div>
                      <div className="label-sm" style={{ marginBottom: 6 }}>Duração (minutos)</div>
                      <input
                        type="number"
                        className="input"
                        value={editDuration}
                        onChange={(e) => setEditDuration(e.target.value)}
                        min={1}
                        max={300}
                        style={{ maxWidth: 140 }}
                      />
                    </div>
                    <div>
                      <div className="label-sm" style={{ marginBottom: 6 }}>Dificuldade</div>
                      <select
                        className="input"
                        value={editDifficulty}
                        onChange={(e) => setEditDifficulty(e.target.value)}
                        style={{ maxWidth: 220 }}
                      >
                        <option value="">Não informado</option>
                        {DIFFICULTY_OPTIONS.map((opt) => (
                          <option key={opt.value} value={opt.value}>{opt.label}</option>
                        ))}
                      </select>
                    </div>
                    <div>
                      <div className="label-sm" style={{ marginBottom: 6 }}>Observações</div>
                      <textarea
                        className="input"
                        value={editNotes}
                        onChange={(e) => setEditNotes(e.target.value)}
                        rows={3}
                        placeholder="Como foi o treino?"
                        style={{ resize: 'vertical' }}
                      />
                    </div>
                  </div>
                </>
              ) : (
                <>
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
                </>
              )}
            </div>

            {/* Exercícios */}
            <div className="col gap-3">
              <div className="label-sm">
                {exerciseGroups.length} exercício{exerciseGroups.length !== 1 ? 's' : ''} registrado{exerciseGroups.length !== 1 ? 's' : ''}
              </div>
              {exerciseGroups.map(({ exercise, sets }) => {
                const exVolume = isEditing
                  ? sets.reduce((s, set) => {
                      const vals = editSets[set.id]
                      const load = vals ? parseFloat(vals.load) || 0 : Number(set.load_kg) || 0
                      const reps = vals ? parseInt(vals.reps, 10) || 0 : set.reps_completed
                      return s + load * reps
                    }, 0)
                  : sets.reduce((s, set) => s + (Number(set.load_kg) || 0) * set.reps_completed, 0)
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
                        {!isEditing && (
                          <button
                            onClick={() => navigate(`/progresso?exercise=${exercise?.id}`)}
                            className="btn ghost"
                            title="Ver evolução"
                          >
                            <Icon name="trending" size={14} />
                          </button>
                        )}
                      </div>
                    </div>

                    {/* Séries */}
                    <div style={{ padding: 0 }}>
                      <div
                        style={{
                          display: 'grid',
                          gridTemplateColumns: isEditing ? '40px 1fr 1fr' : '40px 1fr 1fr 1fr',
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
                        <div>Carga (kg)</div>
                        {!isEditing && <div style={{ textAlign: 'right' }}>Volume</div>}
                      </div>
                      {sets.map((set) => {
                        const vals = editSets[set.id] ?? { reps: String(set.reps_completed), load: '' }
                        return (
                          <div
                            key={set.id}
                            style={{
                              display: 'grid',
                              gridTemplateColumns: isEditing ? '40px 1fr 1fr' : '40px 1fr 1fr 1fr',
                              gap: 12,
                              padding: isEditing ? '8px 20px' : '10px 20px',
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
                            {isEditing ? (
                              <>
                                <input
                                  type="number"
                                  className="set-input"
                                  inputMode="numeric"
                                  value={vals.reps}
                                  onChange={(e) =>
                                    setEditSets((prev) => ({
                                      ...prev,
                                      [set.id]: { ...prev[set.id], reps: e.target.value },
                                    }))
                                  }
                                  min={1}
                                />
                                <input
                                  type="number"
                                  className="set-input"
                                  inputMode="decimal"
                                  value={vals.load}
                                  onChange={(e) =>
                                    setEditSets((prev) => ({
                                      ...prev,
                                      [set.id]: { ...prev[set.id], load: e.target.value },
                                    }))
                                  }
                                  placeholder="0"
                                  step={0.5}
                                  min={0}
                                />
                              </>
                            ) : (
                              <>
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
                              </>
                            )}
                          </div>
                        )
                      })}
                    </div>
                  </div>
                )
              })}
            </div>

            {/* Botões salvar/cancelar em modo edição */}
            {isEditing && (
              <div style={{ display: 'flex', gap: 12 }}>
                <button
                  onClick={handleSaveEdit}
                  disabled={saving}
                  className="btn primary lg"
                  style={{ flex: 1 }}
                >
                  {saving ? 'Salvando...' : 'Salvar alterações'}
                </button>
                <button
                  onClick={cancelEdit}
                  disabled={saving}
                  className="btn ghost lg"
                >
                  Cancelar
                </button>
              </div>
            )}
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
