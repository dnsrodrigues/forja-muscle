import { useEffect, useState } from 'react'
import { useParams, Link } from 'react-router-dom'
import { useToast } from '../../context/ToastContext'
import { motion } from 'motion/react'
import { Topbar } from '../../components/layout/Topbar'
import { Icon } from '../../components/ui/Icon'
import { Avatar } from '../../components/ui/Avatar'
import { WeightChart } from '../../components/charts/WeightChart'
import { LoadProgressChart } from '../../components/charts/LoadProgressChart'
import { AssignToStudentModal } from '../../components/admin/AssignToStudentModal'
import { WeightEntryModal } from '../../components/WeightEntryModal'
import { MeasurementEntryModal } from '../../components/MeasurementEntryModal'
import { StudentEditModal } from '../../components/admin/StudentEditModal'
import { ConfirmModal } from '../../components/ui/ConfirmModal'
import { getProfile } from '../../services/profile.service'
import { getStudentWorkouts, deactivateWorkout } from '../../services/workout.service'
import { getWorkoutHistory, getCurrentStreak, getExercisesTrainedByUser, getLoadProgression } from '../../services/history.service'
import { getUserWeights, getBodyMeasurements, addUserWeight, addBodyMeasurement } from '../../services/measurements.service'
import { resetStudentPassword } from '../../services/trainer.service'
import { getNutritionLogs, computeDailyTotals } from '../../services/nutrition.service'
import { getBmiStatus } from '../../lib/bmi'
import { DIFFICULTY_LABELS } from '../../types'
import type { UserProfile, Workout, WorkoutLog, UserWeight, BodyMeasurement, Exercise, LoadPoint, NutritionLog } from '../../types'

type TabKey = 'overview' | 'workouts' | 'progress' | 'nutrition'

const TABS: { key: TabKey; label: string }[] = [
  { key: 'overview', label: 'Visão geral' },
  { key: 'workouts', label: 'Treinos' },
  { key: 'progress', label: 'Evolução' },
  { key: 'nutrition', label: 'Nutrição' },
]

function formatDate(iso: string): string {
  return new Date(iso).toLocaleDateString('pt-BR', { day: '2-digit', month: 'short', year: 'numeric' })
}

export function StudentDetailPage() {
  const { id } = useParams<{ id: string }>()
  const { showToast } = useToast()
  const [student, setStudent] = useState<UserProfile | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [tab, setTab] = useState<TabKey>('overview')
  const [assignOpen, setAssignOpen] = useState(false)

  // dados por aba
  const [workouts, setWorkouts] = useState<Workout[]>([])
  const [streak, setStreak] = useState({ current: 0, longest: 0 })
  const [history, setHistory] = useState<WorkoutLog[]>([])
  const [weights, setWeights] = useState<UserWeight[]>([])
  const [measurements, setMeasurements] = useState<BodyMeasurement[]>([])
  const [trainedExercises, setTrainedExercises] = useState<Exercise[]>([])
  const [selectedExercise, setSelectedExercise] = useState<string>('')
  const [loadData, setLoadData] = useState<LoadPoint[]>([])
  const [nutritionLogs, setNutritionLogs] = useState<NutritionLog[]>([])

  // ações task 8
  const [editOpen, setEditOpen] = useState(false)
  const [weightOpen, setWeightOpen] = useState(false)
  const [measureOpen, setMeasureOpen] = useState(false)
  const [resetConfirm, setResetConfirm] = useState(false)
  const [moreOpen, setMoreOpen] = useState(false)

  // carga inicial: perfil + overview
  async function loadCore() {
    if (!id) return
    setLoading(true)
    setError(null)
    try {
      const [p, w, str] = await Promise.all([
        getProfile(id),
        getStudentWorkouts(id),
        getCurrentStreak(id),
      ])
      setStudent(p)
      setWorkouts(w)
      setStreak(str)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Erro ao carregar aluno')
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => { void loadCore() }, [id])

  // carregamento sob demanda por aba
  useEffect(() => {
    if (!id) return
    if (tab === 'workouts' && history.length === 0) {
      getWorkoutHistory(id).then(setHistory).catch(() => {})
    }
    if (tab === 'progress') {
      if (weights.length === 0) getUserWeights(id).then(setWeights).catch(() => {})
      if (measurements.length === 0) getBodyMeasurements(id).then(setMeasurements).catch(() => {})
      if (trainedExercises.length === 0) {
        getExercisesTrainedByUser(id).then((list) => {
          setTrainedExercises(list)
          if (list.length > 0) setSelectedExercise(list[0].id)
        }).catch(() => {})
      }
    }
    if (tab === 'nutrition' && nutritionLogs.length === 0) {
      const today = new Date().toISOString().substring(0, 10)
      getNutritionLogs(id, today).then(setNutritionLogs).catch(() => {})
    }
  }, [tab, id])

  // recarrega gráfico de carga ao trocar exercício
  useEffect(() => {
    if (!id || !selectedExercise) return
    getLoadProgression(id, selectedExercise).then(setLoadData).catch(() => setLoadData([]))
  }, [id, selectedExercise])

  async function handleRemoveWorkout(workoutId: string) {
    try {
      await deactivateWorkout(workoutId)
      setWorkouts((prev) => prev.filter((w) => w.id !== workoutId))
    } catch { /* silencioso */ }
  }

  const bmi = student ? getBmiStatus(student.weight, student.height) : null
  const lastWeight = weights[0]
  const lastMeasurement = measurements[0]
  const nutritionTotals = computeDailyTotals(nutritionLogs)

  async function handleResetPassword() {
    if (!student) return
    setResetConfirm(false)
    try {
      await resetStudentPassword(student.id)
      showToast('Senha resetada para 123456. O aluno troca no próximo login.', 'success')
    } catch (err) {
      showToast(err instanceof Error ? err.message : 'Erro ao resetar senha', 'error')
    }
  }

  return (
    <>
      <Topbar
        eyebrow="PERFIL DO ALUNO"
        title={student ? student.full_name.toUpperCase() : 'CARREGANDO...'}
        actions={
          <Link to="/admin/students" className="btn ghost">
            <Icon name="arrowL" size={14} /> Voltar
          </Link>
        }
      />

      <div className="content">
        {loading && <div className="skeleton" style={{ height: 200, borderRadius: 14 }} />}

        {!loading && error && (
          <div className="card" style={{ borderLeft: '2px solid var(--danger)', background: 'rgba(255,61,85,0.05)' }}>
            <div style={{ color: 'var(--danger)', marginBottom: 8 }}>⚠ {error}</div>
            <button onClick={loadCore} className="btn ghost">Tentar novamente</button>
          </div>
        )}

        {!loading && !error && student && (
          <>
            {/* Barra de ações */}
            <div style={{ display: 'flex', gap: 8, alignItems: 'center', marginBottom: 18 }}>
              <button onClick={() => setAssignOpen(true)} className="btn primary">
                <Icon name="plus" size={14} /> Atribuir ficha
              </button>
              <button onClick={() => setEditOpen(true)} className="btn">
                <Icon name="edit" size={14} /> Editar dados
              </button>

              {/* Menu "Mais" — agrupa ações secundárias */}
              <div style={{ position: 'relative', marginLeft: 'auto' }}>
                <button
                  onClick={() => setMoreOpen((v) => !v)}
                  className="btn ghost"
                  style={{ fontWeight: 700, letterSpacing: '0.08em' }}
                  aria-expanded={moreOpen}
                  aria-haspopup="true"
                >
                  ⋯ Mais
                </button>

                {/* Backdrop invisível para fechar ao clicar fora */}
                {moreOpen && (
                  <div
                    style={{ position: 'fixed', inset: 0, zIndex: 98 }}
                    onClick={() => setMoreOpen(false)}
                  />
                )}

                {/* Dropdown */}
                {moreOpen && (
                  <motion.div
                    initial={{ opacity: 0, y: -6, scale: 0.97 }}
                    animate={{ opacity: 1, y: 0, scale: 1 }}
                    transition={{ duration: 0.15, ease: [0.22, 1, 0.36, 1] }}
                    style={{
                      position: 'absolute', top: 'calc(100% + 6px)', right: 0,
                      zIndex: 99, minWidth: 200,
                      background: 'var(--bg-1)',
                      border: '1px solid var(--border)',
                      borderRadius: 'var(--r-3)',
                      boxShadow: 'var(--sh-pop)',
                      overflow: 'hidden',
                    }}
                  >
                    {/* Dados corporais */}
                    <div style={{ padding: '6px 0' }}>
                      <div style={{ padding: '4px 14px 6px', fontSize: 10, color: 'var(--text-faint)', letterSpacing: '0.12em', textTransform: 'uppercase', fontFamily: 'var(--f-mono)' }}>
                        Dados corporais
                      </div>
                      {[
                        { label: 'Registrar peso', icon: 'scale' as const, action: () => { setWeightOpen(true); setMoreOpen(false) } },
                        { label: 'Medidas corporais', icon: 'scale' as const, action: () => { setMeasureOpen(true); setMoreOpen(false) } },
                      ].map(({ label, icon, action }) => (
                        <button
                          key={label}
                          onClick={action}
                          style={{
                            display: 'flex', alignItems: 'center', gap: 10,
                            width: '100%', padding: '9px 14px',
                            background: 'none', border: 'none', cursor: 'pointer',
                            color: 'var(--text)', fontSize: 13, textAlign: 'left',
                            transition: 'background 0.12s',
                          }}
                          onMouseEnter={(e) => (e.currentTarget.style.background = 'var(--bg-2)')}
                          onMouseLeave={(e) => (e.currentTarget.style.background = 'none')}
                        >
                          <Icon name={icon} size={14} />
                          {label}
                        </button>
                      ))}
                    </div>

                    {/* Divisor */}
                    <div style={{ height: 1, background: 'var(--hairline)', margin: '0 14px' }} />

                    {/* Ação sensível */}
                    <div style={{ padding: '6px 0' }}>
                      <button
                        onClick={() => { setResetConfirm(true); setMoreOpen(false) }}
                        style={{
                          display: 'flex', alignItems: 'center', gap: 10,
                          width: '100%', padding: '9px 14px',
                          background: 'none', border: 'none', cursor: 'pointer',
                          color: 'var(--danger)', fontSize: 13, textAlign: 'left',
                          transition: 'background 0.12s',
                        }}
                        onMouseEnter={(e) => (e.currentTarget.style.background = 'rgba(255,61,85,0.06)')}
                        onMouseLeave={(e) => (e.currentTarget.style.background = 'none')}
                      >
                        <Icon name="settings" size={14} />
                        Resetar senha
                      </button>
                    </div>
                  </motion.div>
                )}
              </div>
            </div>

            {/* Abas */}
            <div style={{ display: 'flex', gap: 4, borderBottom: '1px solid var(--hairline)', marginBottom: 20, overflowX: 'auto', overflowY: 'hidden', flexShrink: 0 }}>
              {TABS.map((t) => (
                <button
                  key={t.key}
                  onClick={() => setTab(t.key)}
                  style={{
                    background: 'transparent', border: 'none', cursor: 'pointer',
                    padding: '10px 14px', fontSize: 13, fontWeight: 600, whiteSpace: 'nowrap',
                    color: tab === t.key ? 'var(--accent)' : 'var(--text-dim)',
                    borderBottom: tab === t.key ? '2px solid var(--accent)' : '2px solid transparent',
                  }}
                >
                  {t.label}
                </button>
              ))}
            </div>

            {/* ─── Aba: Visão geral ─── */}
            {tab === 'overview' && (
              <motion.div key="overview" initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ duration: 0.2 }} className="col gap-3">
                <div className="card" style={{ display: 'flex', alignItems: 'center', gap: 16, flexWrap: 'wrap' }}>
                  <Avatar name={student.full_name} src={student.avatar_url} size="lg" />
                  <div style={{ minWidth: 0 }}>
                    <div className="f-display" style={{ fontSize: 28, color: 'var(--text)', lineHeight: 1 }}>
                      {student.full_name.toUpperCase()}
                    </div>
                    <div style={{ fontSize: 13, color: 'var(--text-dim)', marginTop: 4 }}>{student.email}</div>
                    {!student.is_active && (
                      <span className="chip danger" style={{ marginTop: 6 }}>INATIVO</span>
                    )}
                  </div>
                </div>

                {/* mini stats */}
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(120px, 1fr))', gap: 12 }}>
                  <div className="card">
                    <div className="stat-label">PESO ATUAL</div>
                    <div className="f-mono" style={{ fontSize: 22, color: bmi ? bmi.color : 'var(--text)', fontWeight: 700 }}>
                      {student.weight ? `${student.weight} kg` : '—'}
                    </div>
                    {bmi && <div style={{ fontSize: 10, color: bmi.color, fontFamily: 'var(--f-mono)', textTransform: 'uppercase' }}>{bmi.label}</div>}
                  </div>
                  <div className="card">
                    <div className="stat-label">STREAK</div>
                    <div className="f-display" style={{ fontSize: 32, color: 'var(--accent)' }}>{streak.current}<span className="stat-unit">dias</span></div>
                  </div>
                  <div className="card">
                    <div className="stat-label">OBJETIVO</div>
                    <div style={{ fontSize: 13, color: 'var(--text)' }}>{student.goal || '—'}</div>
                  </div>
                </div>

                {/* Fichas ativas */}
                <div className="card">
                  <h2 className="card-title" style={{ marginBottom: 12 }}>FICHAS ATIVAS</h2>
                  {workouts.length === 0 ? (
                    <div style={{ color: 'var(--text-dim)', fontSize: 13, fontStyle: 'italic' }}>Nenhuma ficha atribuída.</div>
                  ) : (
                    <div className="col gap-2">
                      {workouts.map((w) => (
                        <div key={w.id} style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 12, padding: '10px 12px', background: 'var(--bg-2)', borderRadius: 'var(--r-2)', border: '1px solid var(--hairline)' }}>
                          <div>
                            <div style={{ fontWeight: 600, fontSize: 14, color: 'var(--text)' }}>{w.name}</div>
                            <div style={{ fontSize: 11, color: 'var(--text-dim)' }}>{w.exercises?.length ?? 0} exercícios</div>
                          </div>
                          <button onClick={() => handleRemoveWorkout(w.id)} className="btn ghost" style={{ fontSize: 11, padding: '6px 10px', color: 'var(--danger)', borderColor: 'var(--danger)' }}>
                            Remover
                          </button>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              </motion.div>
            )}

            {/* ─── Aba: Treinos ─── */}
            {tab === 'workouts' && (
              <motion.div key="workouts" initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ duration: 0.2 }}>
                {history.length === 0 ? (
                  <div className="card" style={{ textAlign: 'center', padding: '32px 24px', borderStyle: 'dashed', color: 'var(--text-dim)' }}>
                    Nenhum treino registrado ainda.
                  </div>
                ) : (
                  <div className="col gap-2">
                    {history.map((log) => (
                      <Link
                        key={log.id}
                        to={`/historico/${log.id}`}
                        className="card"
                        style={{ textDecoration: 'none', display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 12 }}
                      >
                        <div>
                          <div className="f-display" style={{ fontSize: 20, color: 'var(--text)' }}>
                            {(log as WorkoutLog & { workout?: { name: string } }).workout?.name?.toUpperCase() ?? 'TREINO'}
                          </div>
                          <div style={{ fontSize: 12, color: 'var(--text-dim)', marginTop: 4 }}>{formatDate(log.started_at)}</div>
                        </div>
                        <div style={{ textAlign: 'right' }}>
                          <div className="f-display" style={{ fontSize: 22, color: 'var(--accent)' }}>
                            {log.duration_minutes ?? '—'}<span className="stat-unit">min</span>
                          </div>
                          {log.difficulty && <div style={{ fontSize: 11, color: 'var(--text-dim)' }}>{DIFFICULTY_LABELS[log.difficulty]}</div>}
                        </div>
                      </Link>
                    ))}
                  </div>
                )}
              </motion.div>
            )}

            {/* ─── Aba: Evolução ─── */}
            {tab === 'progress' && (
              <motion.div key="progress" initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ duration: 0.2 }} className="col gap-3">
                <div className="card">
                  <h2 className="card-title" style={{ marginBottom: 12 }}>PESO {lastWeight ? `· ${Number(lastWeight.weight_kg).toFixed(1)} kg` : ''}</h2>
                  {weights.length === 0 ? (
                    <div style={{ color: 'var(--text-dim)', fontSize: 13, fontStyle: 'italic' }}>Nenhum peso registrado.</div>
                  ) : (
                    <WeightChart data={weights.slice(0, 20)} />
                  )}
                </div>

                <div className="card">
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 12, flexWrap: 'wrap', gap: 8 }}>
                    <h2 className="card-title">CARGA POR EXERCÍCIO</h2>
                    {trainedExercises.length > 0 && (
                      <select className="input" value={selectedExercise} onChange={(e) => setSelectedExercise(e.target.value)} style={{ maxWidth: 220 }}>
                        {trainedExercises.map((ex) => <option key={ex.id} value={ex.id}>{ex.name}</option>)}
                      </select>
                    )}
                  </div>
                  {trainedExercises.length === 0 ? (
                    <div style={{ color: 'var(--text-dim)', fontSize: 13, fontStyle: 'italic' }}>Sem dados de carga ainda.</div>
                  ) : loadData.length === 0 ? (
                    <div className="skeleton" style={{ height: 180, borderRadius: 8 }} />
                  ) : (
                    <LoadProgressChart data={loadData} exerciseName={trainedExercises.find((e) => e.id === selectedExercise)?.name ?? ''} />
                  )}
                </div>

                {lastMeasurement && (
                  <div className="card">
                    <h2 className="card-title" style={{ marginBottom: 12 }}>ÚLTIMAS MEDIDAS · {formatDate(lastMeasurement.measured_at)}</h2>
                    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(110px, 1fr))', gap: 10 }}>
                      {([['waist_cm', 'Cintura'], ['hip_cm', 'Quadril'], ['abdomen_cm', 'Abdômen'], ['chest_cm', 'Peitoral'], ['arm_cm', 'Braço'], ['thigh_cm', 'Coxa'], ['calf_cm', 'Panturrilha']] as [keyof BodyMeasurement, string][])
                        .filter(([k]) => lastMeasurement[k] != null)
                        .map(([k, label]) => (
                          <div key={k} style={{ background: 'var(--bg-2)', border: '1px solid var(--hairline)', borderRadius: 'var(--r-2)', padding: 12 }}>
                            <div className="stat-label" style={{ fontSize: 10 }}>{label}</div>
                            <div className="f-display" style={{ fontSize: 26, color: 'var(--text)' }}>{Number(lastMeasurement[k]).toFixed(1)}<span className="stat-unit" style={{ fontSize: 11 }}>cm</span></div>
                          </div>
                        ))}
                    </div>
                  </div>
                )}
              </motion.div>
            )}

            {/* ─── Aba: Nutrição ─── */}
            {tab === 'nutrition' && (
              <motion.div key="nutrition" initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ duration: 0.2 }} className="col gap-3">
                <div className="card">
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 12 }}>
                    <h2 className="card-title">HOJE</h2>
                    <Link to={`/nutricao?userId=${student.id}`} className="btn ghost">
                      Ver diário <Icon name="arrow" size={14} />
                    </Link>
                  </div>
                  {nutritionLogs.length === 0 ? (
                    <div style={{ color: 'var(--text-dim)', fontSize: 13, fontStyle: 'italic' }}>Nenhuma refeição registrada hoje.</div>
                  ) : (
                    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: 10 }}>
                      <div><div className="stat-label">KCAL</div><div className="f-display" style={{ fontSize: 24, color: 'var(--accent)' }}>{Math.round(nutritionTotals.calories)}</div></div>
                      <div><div className="stat-label">PROT</div><div className="f-display" style={{ fontSize: 24, color: 'var(--text)' }}>{Math.round(nutritionTotals.protein_g)}g</div></div>
                      <div><div className="stat-label">CARB</div><div className="f-display" style={{ fontSize: 24, color: 'var(--info)' }}>{Math.round(nutritionTotals.carbs_g)}g</div></div>
                      <div><div className="stat-label">GORD</div><div className="f-display" style={{ fontSize: 24, color: 'var(--warn)' }}>{Math.round(nutritionTotals.fat_g)}g</div></div>
                    </div>
                  )}
                </div>
              </motion.div>
            )}
          </>
        )}
      </div>

      {student && (
        <AssignToStudentModal
          studentId={student.id}
          studentName={student.full_name}
          isOpen={assignOpen}
          onClose={() => setAssignOpen(false)}
          onAssigned={() => { void loadCore() }}
        />
      )}

      {student && (
        <StudentEditModal
          student={student}
          isOpen={editOpen}
          onClose={() => setEditOpen(false)}
          onSaved={(updated) => setStudent(updated)}
        />
      )}

      {student && (
        <WeightEntryModal
          isOpen={weightOpen}
          lastWeight={student.weight}
          onClose={() => setWeightOpen(false)}
          onSaved={(w) => {
            setWeights((prev) => [w, ...prev])
            setStudent((prev) => prev ? { ...prev, weight: Number(w.weight_kg) } : prev)
          }}
          onSave={(kg, at) => addUserWeight(student.id, kg, at)}
        />
      )}

      {student && (
        <MeasurementEntryModal
          isOpen={measureOpen}
          onClose={() => setMeasureOpen(false)}
          onSaved={(m) => setMeasurements((prev) => [m, ...prev])}
          onSave={(data) => addBodyMeasurement(student.id, data)}
        />
      )}

      {resetConfirm && (
        <ConfirmModal
          title="Resetar senha do aluno"
          message="A senha será trocada para 123456 e o aluno precisará criar uma nova no próximo login. Confirmar?"
          confirmLabel="Resetar senha"
          danger
          onConfirm={handleResetPassword}
          onCancel={() => setResetConfirm(false)}
        />
      )}

    </>
  )
}
