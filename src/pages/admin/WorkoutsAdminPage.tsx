import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { useAuth } from '../../context/AuthContext'
import { motion } from 'motion/react'
import {
  getTemplates,
  getWorkoutUsageCount,
  deactivateWorkout,
  getAllStudentWorkouts,
} from '../../services/workout.service'
import { WorkoutCard } from '../../components/WorkoutCard'
import { AssignWorkoutModal } from '../../components/AssignWorkoutModal'
import { sortWorkoutsByWeekday } from '../../lib/workout-sort'
import { Topbar } from '../../components/layout/Topbar'
import { Icon } from '../../components/ui/Icon'
import type { Workout, WorkoutWithStudent } from '../../types'
import { WEEK_DAY_SHORT } from '../../types'

export function WorkoutsAdminPage() {
  const navigate = useNavigate()
  const { isSuperAdmin } = useAuth()
  const [workouts, setWorkouts] = useState<Workout[]>([])
  const [usageCounts, setUsageCounts] = useState<Record<string, number>>({})
  const [studentWorkouts, setStudentWorkouts] = useState<WorkoutWithStudent[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [assignTarget, setAssignTarget] = useState<Workout | null>(null)
  const [expandedStudents, setExpandedStudents] = useState<Set<string>>(new Set())

  async function load() {
    setLoading(true)
    setError(null)
    try {
      const [data, allStudentWorkouts] = await Promise.all([
        getTemplates(),
        getAllStudentWorkouts(),
      ])
      setWorkouts(data)
      setStudentWorkouts(allStudentWorkouts)

      const counts = await Promise.all(
        data.map(async (w) => ({ id: w.id, count: await getWorkoutUsageCount(w.id) }))
      )
      const countMap: Record<string, number> = {}
      counts.forEach(({ id, count }) => { countMap[id] = count })
      setUsageCounts(countMap)

      const studentIds = new Set(
        allStudentWorkouts.map((w) => w.student?.id ?? '').filter(Boolean)
      )
      setExpandedStudents(studentIds)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Erro ao carregar fichas')
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => { void load() }, [])

  function toggleStudent(studentId: string) {
    setExpandedStudents((prev) => {
      const next = new Set(prev)
      if (next.has(studentId)) next.delete(studentId)
      else next.add(studentId)
      return next
    })
  }

  const studentGroups = Object.values(
    studentWorkouts.reduce<Record<string, {
      student: { id: string; full_name: string; email: string }
      workouts: WorkoutWithStudent[]
    }>>((acc, w) => {
      const id = w.student?.id ?? 'sem-aluno'
      if (!acc[id]) {
        acc[id] = {
          student: w.student ?? { id: 'sem-aluno', full_name: 'Aluno desconhecido', email: '' },
          workouts: [],
        }
      }
      acc[id].workouts.push(w)
      return acc
    }, {})
  )

  async function handleDeleteTemplate(workoutId: string) {
    try {
      await deactivateWorkout(workoutId)
      setWorkouts((prev) => prev.filter((w) => w.id !== workoutId))
    } catch { /* erro silencioso */ }
  }

  async function handleUnlinkStudentWorkout(workoutId: string) {
    try {
      await deactivateWorkout(workoutId)
      setStudentWorkouts((prev) => prev.filter((w) => w.id !== workoutId))
    } catch { /* erro silencioso */ }
  }

  return (
    <>
      <Topbar
        eyebrow={isSuperAdmin ? 'BIBLIOTECA DO PERSONAL' : 'MEUS ALUNOS'}
        title={isSuperAdmin ? 'FICHAS DE TREINO' : 'FICHAS DOS ALUNOS'}
        actions={
          <button onClick={() => navigate('/admin/workouts/new')} className="btn primary">
            <Icon name="plus" size={14} /> Nova ficha
          </button>
        }
      />

      <div className="content">
        {/* Stats */}
        <div className="forja-admin-stats">
          <div className="card">
            <div className="stat-label">Templates</div>
            <div className="f-display" style={{ fontSize: 48, color: 'var(--accent)' }}>
              {loading ? '…' : workouts.length}
            </div>
          </div>
          <div className="card">
            <div className="stat-label">Alunos com ficha</div>
            <div className="f-display" style={{ fontSize: 48, color: 'var(--text)' }}>
              {loading ? '…' : studentGroups.length}
            </div>
          </div>
          <div className="card">
            <div className="stat-label">Fichas de alunos</div>
            <div className="f-display" style={{ fontSize: 48, color: 'var(--text)' }}>
              {loading ? '…' : studentWorkouts.length}
            </div>
          </div>
        </div>

        {/* Loading */}
        {loading && (
          <div className="col gap-3">
            {[1, 2, 3].map((i) => (
              <div key={i} className="skeleton" style={{ height: 96, borderRadius: 14 }} />
            ))}
          </div>
        )}

        {/* Erro */}
        {!loading && error && (
          <div
            className="card"
            style={{ borderLeft: '2px solid var(--danger)', background: 'rgba(255,61,85,0.05)' }}
          >
            <div style={{ color: 'var(--danger)', marginBottom: 8 }}>⚠ {error}</div>
            <button onClick={load} className="btn ghost">Tentar novamente</button>
          </div>
        )}

        {/* TEMPLATES */}
        {!loading && !error && (
          <>
            <motion.div
              initial={{ opacity: 0, y: 8 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.3 }}
            >
              <div
                style={{
                  display: 'flex',
                  justifyContent: 'space-between',
                  alignItems: 'center',
                  marginBottom: 14,
                }}
              >
                <h2 className="card-title">TEMPLATES DA BIBLIOTECA</h2>
                <span className="chip">{workouts.length}</span>
              </div>

              {workouts.length === 0 ? (
                <div
                  className="card"
                  style={{
                    borderStyle: 'dashed',
                    textAlign: 'center',
                    padding: '32px 24px',
                    color: 'var(--text-dim)',
                  }}
                >
                  <div style={{ fontSize: 32, marginBottom: 8 }}>📋</div>
                  <div style={{ fontSize: 13 }}>
                    Crie seu primeiro template para reutilizar entre alunos.
                  </div>
                </div>
              ) : (
                <div className="col gap-2">
                  {sortWorkoutsByWeekday(workouts).map((w) => (
                    <WorkoutCard
                      key={w.id}
                      workout={w}
                      usageCount={usageCounts[w.id] ?? 0}
                      onClick={() => navigate(`/admin/workouts/${w.id}/edit`)}
                      onEdit={() => navigate(`/admin/workouts/${w.id}/edit`)}
                      onAssign={() => setAssignTarget(w)}
                      onDelete={() => handleDeleteTemplate(w.id)}
                    />
                  ))}
                </div>
              )}
            </motion.div>

            {/* FICHAS POR ALUNO */}
            {studentGroups.length > 0 && (
              <motion.div
                initial={{ opacity: 0, y: 8 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.3, delay: 0.1 }}
              >
                <h2 className="card-title" style={{ marginBottom: 14 }}>
                  FICHAS ATRIBUÍDAS POR ALUNO
                </h2>
                <div className="col gap-3">
                  {studentGroups.map(({ student, workouts: studentWs }) => {
                    const expanded = expandedStudents.has(student.id)
                    return (
                      <div key={student.id} className="card" style={{ padding: 0 }}>
                        <button
                          onClick={() => toggleStudent(student.id)}
                          style={{
                            width: '100%',
                            background: 'transparent',
                            border: 'none',
                            color: 'inherit',
                            cursor: 'pointer',
                            display: 'flex',
                            justifyContent: 'space-between',
                            alignItems: 'center',
                            padding: '16px 22px',
                            borderBottom: expanded ? '1px solid var(--hairline)' : 'none',
                            textAlign: 'left',
                          }}
                        >
                          <div>
                            <div
                              className="f-display"
                              style={{ fontSize: 22, color: 'var(--text)', lineHeight: 1 }}
                            >
                              {student.full_name.toUpperCase()}
                            </div>
                            <div style={{ fontSize: 11, color: 'var(--text-dim)', marginTop: 4 }}>
                              {student.email} · {studentWs.length} ficha{studentWs.length !== 1 ? 's' : ''}
                            </div>
                          </div>
                          <Icon name={expanded ? 'arrow' : 'arrow'} size={16} style={{ transform: expanded ? 'rotate(90deg)' : 'rotate(0)', transition: 'transform 0.15s' }} />
                        </button>

                        {expanded && (
                          <div style={{ padding: '14px 22px 18px' }}>
                            <div className="col gap-2">
                              {sortWorkoutsByWeekday(studentWs).map((w) => (
                                <WorkoutCard
                                  key={w.id}
                                  workout={w}
                                  onClick={() => navigate(`/admin/workouts/${w.id}/edit`)}
                                  onEdit={() => navigate(`/admin/workouts/${w.id}/edit`)}
                                  onDelete={() => handleUnlinkStudentWorkout(w.id)}
                                  deleteLabel="Desvincular"
                                />
                              ))}
                            </div>
                          </div>
                        )}
                      </div>
                    )
                  })}
                </div>
              </motion.div>
            )}
          </>
        )}

        {/* Loading dummy var */}
        <div style={{ display: 'none' }}>{WEEK_DAY_SHORT.monday}</div>
      </div>

      {/* Modal de atribuir */}
      {assignTarget && (
        <AssignWorkoutModal
          workout={assignTarget}
          onClose={() => setAssignTarget(null)}
          onAssigned={() => {
            setAssignTarget(null)
            void load()
          }}
        />
      )}

      <style>{`
        .forja-admin-stats {
          display: grid;
          grid-template-columns: repeat(3, 1fr);
          gap: 14px;
        }
        @media (max-width: 768px) {
          .forja-admin-stats { grid-template-columns: 1fr; }
        }
      `}</style>
    </>
  )
}
