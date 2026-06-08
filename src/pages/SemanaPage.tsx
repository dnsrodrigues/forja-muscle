import { useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { motion } from 'motion/react'
import { useAuth } from '../context/AuthContext'
import { MobHead } from '../components/layout/MobHead'
import { Icon } from '../components/ui/Icon'
import { getMyWorkouts } from '../services/workout.service'
import { getWorkoutHistory } from '../services/history.service'
import { MUSCLE_GROUP_LABELS } from '../types'
import type { Workout, WeekDay, WorkoutLog } from '../types'

// ─── Constantes ───────────────────────────────────────────────────────────────

const DAY_KEYS: WeekDay[] = [
  'monday', 'tuesday', 'wednesday', 'thursday', 'friday', 'saturday', 'sunday',
]

const DAY_SHORT: Record<WeekDay, string> = {
  monday: 'SEG', tuesday: 'TER', wednesday: 'QUA',
  thursday: 'QUI', friday: 'SEX', saturday: 'SÁB', sunday: 'DOM',
}

const DAY_INDEX: Record<number, WeekDay> = {
  0: 'sunday', 1: 'monday', 2: 'tuesday', 3: 'wednesday',
  4: 'thursday', 5: 'friday', 6: 'saturday',
}

function getWeekStart(): Date {
  const d = new Date()
  const day = d.getDay()
  const diff = day === 0 ? -6 : 1 - day
  d.setDate(d.getDate() + diff)
  d.setHours(0, 0, 0, 0)
  return d
}

function getWeekNumber(): number {
  const d = new Date()
  const start = new Date(d.getFullYear(), 0, 1)
  return Math.ceil(((d.getTime() - start.getTime()) / 86400000 + start.getDay() + 1) / 7)
}

// ─── Componente ───────────────────────────────────────────────────────────────

export function SemanaPage() {
  const { profile } = useAuth()
  const navigate = useNavigate()

  const [workouts, setWorkouts] = useState<Workout[]>([])
  const [history, setHistory] = useState<WorkoutLog[]>([])
  const [loading, setLoading] = useState(true)

  const todayKey = DAY_INDEX[new Date().getDay()]
  const weekStart = getWeekStart()
  const weekNumber = getWeekNumber()

  useEffect(() => {
    if (!profile?.id) return
    setLoading(true)
    Promise.all([
      getMyWorkouts(profile.id),
      getWorkoutHistory(profile.id),
    ])
      .then(([w, h]) => {
        setWorkouts(w)
        setHistory(h)
      })
      .catch(console.error)
      .finally(() => setLoading(false))
  }, [profile?.id])

  // Dias com treino concluído nesta semana
  const doneDaysThisWeek = new Set<WeekDay>(
    history
      .filter((log) => {
        const d = new Date(log.started_at)
        return d >= weekStart
      })
      .map((log) => DAY_INDEX[new Date(log.started_at).getDay()])
  )

  const rows = DAY_KEYS.map((day) => {
    const workout = workouts.find((w) => w.week_days.includes(day)) ?? null
    const isToday = day === todayKey
    const isDone = doneDaysThisWeek.has(day)
    const isRest = !workout

    const muscleGroups = workout
      ? Array.from(
          new Set(
            (workout.exercises ?? [])
              .map((e) => e.exercise?.muscle_group)
              .filter(Boolean)
          )
        )
          .map((g) => MUSCLE_GROUP_LABELS[g!])
          .join(' · ')
      : ''

    return { day, workout, isToday, isDone, isRest, muscleGroups }
  })

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      transition={{ duration: 0.2 }}
      style={{ display: 'flex', flexDirection: 'column', minHeight: '100%' }}
    >
      <MobHead
        over={`CICLO · SEM ${weekNumber}`}
        title="SUA SEMANA"
        right={
          <button
            className="btn ghost"
            style={{ padding: '8px 10px' }}
            onClick={() => navigate('/workouts')}
            aria-label="Ver todas as fichas"
          >
            <Icon name="arrow" size={18} />
          </button>
        }
      />

      <div className="mob-scroll">
        {loading ? (
          <div className="col gap-3">
            {[1, 2, 3, 4, 5, 6, 7].map((i) => (
              <div key={i} className="skeleton" style={{ height: 80, borderRadius: 14 }} />
            ))}
          </div>
        ) : (
          <div className="col gap-2">
            {rows.map(({ day, workout, isToday, isDone, isRest, muscleGroups }) => (
              <div
                key={day}
                className="card"
                onClick={() => workout && navigate(`/workouts/${workout.id}`)}
                style={{
                  padding: '16px 18px',
                  opacity: isRest ? 0.6 : 1,
                  borderColor: isToday ? 'var(--accent)' : 'var(--hairline)',
                  borderStyle: isRest ? 'dashed' : 'solid',
                  cursor: workout ? 'pointer' : 'default',
                }}
              >
                <div style={{ display: 'flex', alignItems: 'center', gap: 14 }}>
                  {/* Rótulo do dia */}
                  <div
                    className="f-display"
                    style={{
                      fontSize: 18,
                      width: 34,
                      flexShrink: 0,
                      color: isToday ? 'var(--accent)' : 'var(--text-dim)',
                    }}
                  >
                    {DAY_SHORT[day]}
                  </div>

                  {/* Info da ficha */}
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <div
                      className="f-display"
                      style={{
                        fontSize: 26,
                        lineHeight: 1,
                        color: isRest ? 'var(--text-faint)' : 'var(--text)',
                        whiteSpace: 'nowrap',
                        overflow: 'hidden',
                        textOverflow: 'ellipsis',
                      }}
                    >
                      {workout ? workout.name.toUpperCase() : 'DESCANSO'}
                    </div>
                    {muscleGroups && (
                      <div style={{ fontSize: 11, color: 'var(--text-dim)', marginTop: 2 }}>
                        {muscleGroups}
                      </div>
                    )}
                  </div>

                  {/* Ação à direita */}
                  {isDone ? (
                    <div
                      className="check checked"
                      style={{ width: 24, height: 24, flexShrink: 0 }}
                    >
                      <Icon name="check" size={13} />
                    </div>
                  ) : isToday && workout ? (
                    <button
                      className="btn primary"
                      style={{ padding: '8px 12px', flexShrink: 0 }}
                      onClick={(e) => {
                        e.stopPropagation()
                        navigate(`/workouts/${workout.id}/session`)
                      }}
                    >
                      <Icon name="play" size={12} />
                    </button>
                  ) : null}
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </motion.div>
  )
}
