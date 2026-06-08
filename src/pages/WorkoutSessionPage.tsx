import { useState, useEffect, useRef, useCallback } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import { motion, AnimatePresence } from 'motion/react'
import { useAuth } from '../context/AuthContext'
import { getWorkoutById } from '../services/workout.service'
import {
  startWorkoutSession,
  logExerciseSet,
  updateExerciseSet,
  finishWorkoutSession,
  deleteWorkoutSession,
} from '../services/workout-log.service'
import { getLastSetData, type LastSetRecord } from '../services/history.service'
import { Icon } from '../components/ui/Icon'
import { WorkoutFinishModal } from '../components/WorkoutFinishModal'
import { useModalA11y } from '../hooks/useModalA11y'
import { MUSCLE_GROUP_LABELS } from '../types'
import type { Workout, WorkoutExercise, MuscleGroup } from '../types'
import { MUSCLE_GROUP_IMAGES } from '../lib/muscleImages'

type Layout = 'A' | 'B'

function formatMMSS(s: number) {
  const m = Math.floor(s / 60)
  const r = s % 60
  return `${String(m).padStart(2, '0')}:${String(r).padStart(2, '0')}`
}

// ═══════════════════════════════════════════════════════════════════
// PÁGINA
// ═══════════════════════════════════════════════════════════════════

export function WorkoutSessionPage() {
  const { id } = useParams<{ id: string }>()
  const navigate = useNavigate()
  const { profile } = useAuth()

  // ── Layout preference ─────────────────────────────────────────────
  const [layout, setLayout] = useState<Layout>(() => {
    if (typeof window !== 'undefined' && window.innerWidth <= 768) return 'A'
    const v = localStorage.getItem('forja-workout-layout')
    return v === 'B' ? 'B' : 'A'
  })
  useEffect(() => { localStorage.setItem('forja-workout-layout', layout) }, [layout])

  // ── Dados da ficha ──
  const [workout, setWorkout] = useState<Workout | null>(null)
  const [loadError, setLoadError] = useState<string | null>(null)
  const [isBooting, setIsBooting] = useState(true)

  // ── Sessão ──
  const [workoutLogId, setWorkoutLogId] = useState<string | null>(null)
  const startTimeRef = useRef<Date>(new Date())

  // ── Tempo decorrido ──
  const [elapsedSec, setElapsedSec] = useState(0)
  useEffect(() => {
    const t = setInterval(() => {
      setElapsedSec(Math.floor((Date.now() - startTimeRef.current.getTime()) / 1000))
    }, 1000)
    return () => clearInterval(t)
  }, [])

  // ── Navegação entre exercícios ──
  const [currentIdx, setCurrentIdx] = useState(0)

  // ── Séries concluídas: Record<workoutExercise.id, número de séries feitas> ──
  const [setsCompleted, setSetsCompleted] = useState<Record<string, number>>({})

  // ── Histórico da última sessão ──
  const [lastSetData, setLastSetData] = useState<Record<string, Record<number, LastSetRecord>>>({})

  // ── Timer de descanso ──
  const [timerSeconds, setTimerSeconds] = useState(0)
  const [isTimerRunning, setIsTimerRunning] = useState(false)
  const timerRef = useRef<ReturnType<typeof setInterval> | null>(null)

  // ── Modais ──
  const [showFinishModal, setShowFinishModal] = useState(false)
  const [showExitModal, setShowExitModal] = useState(false)
  const [isFinishing, setIsFinishing] = useState(false)
  const [exitChoice, setExitChoice] = useState<'discard' | 'save' | null>(null)
  const [isExiting, setIsExiting] = useState(false)
  const { initialFocusRef: exitModalFocusRef } = useModalA11y(showExitModal, () => setShowExitModal(false))

  // ─────────────────────────────────────────────────────────────────
  // Boot — carrega ficha e cria workout_log
  // ─────────────────────────────────────────────────────────────────

  useEffect(() => {
    if (!id || !profile) return

    async function boot() {
      setIsBooting(true)
      try {
        const data = await getWorkoutById(id!)
        if (!data) throw new Error('Ficha não encontrada')
        if (data.exercises) data.exercises.sort((a, b) => a.order_index - b.order_index)
        setWorkout(data)

        const exerciseLibraryIds = (data.exercises ?? [])
          .map((ex) => ex.exercise?.id)
          .filter((id): id is string => Boolean(id))

        if (exerciseLibraryIds.length > 0) {
          const lastData = await getLastSetData(profile!.id, exerciseLibraryIds)
          setLastSetData(lastData)
        }

        const logId = await startWorkoutSession(id!, profile!.id)
        setWorkoutLogId(logId)
        startTimeRef.current = new Date()
      } catch (err) {
        setLoadError(err instanceof Error ? err.message : 'Erro ao iniciar treino')
      } finally {
        setIsBooting(false)
      }
    }
    boot()
  }, [id, profile])

  // ─────────────────────────────────────────────────────────────────
  // Timer de descanso
  // ─────────────────────────────────────────────────────────────────

  useEffect(() => {
    if (isTimerRunning && timerSeconds > 0) {
      timerRef.current = setInterval(() => {
        setTimerSeconds((s) => {
          if (s <= 1) {
            setIsTimerRunning(false)
            if (timerRef.current) clearInterval(timerRef.current)
            return 0
          }
          return s - 1
        })
      }, 1000)
    } else if (timerRef.current) {
      clearInterval(timerRef.current)
    }
    return () => { if (timerRef.current) clearInterval(timerRef.current) }
  }, [isTimerRunning, timerSeconds])

  function startTimer(seconds: number) {
    if (timerRef.current) clearInterval(timerRef.current)
    setTimerSeconds(seconds)
    setIsTimerRunning(true)
  }
  function skipTimer() {
    if (timerRef.current) clearInterval(timerRef.current)
    setTimerSeconds(0)
    setIsTimerRunning(false)
  }

  // ─────────────────────────────────────────────────────────────────
  // Registrar série
  // ─────────────────────────────────────────────────────────────────

  const handleSetComplete = useCallback(async (
    exercise: WorkoutExercise,
    setNumber: number,
    reps: number,
    loadKg: number | null,
  ) => {
    if (!workoutLogId || !exercise.exercise) return

    try {
      await logExerciseSet(workoutLogId, exercise.exercise.id, {
        setNumber,
        repsCompleted: reps,
        loadKg,
      })
    } catch (err) {
      console.error('Erro ao salvar série:', err)
    }

    setSetsCompleted((prev) => {
      const next = { ...prev, [exercise.id]: (prev[exercise.id] ?? 0) + 1 }

      if (exercise.rest_seconds > 0) startTimer(exercise.rest_seconds)

      if (next[exercise.id] >= exercise.sets) {
        const allExercises = workout?.exercises ?? []
        const isLast = currentIdx >= allExercises.length - 1
        const allDone = allExercises.every((ex) => (next[ex.id] ?? 0) >= ex.sets)

        setTimeout(() => {
          if (allDone) {
            skipTimer()
            setShowFinishModal(true)
          } else if (!isLast) {
            setCurrentIdx((i) => {
              if (i === currentIdx) return currentIdx + 1
              return i
            })
          }
        }, 800)
      }
      return next
    })
  }, [workoutLogId, workout, currentIdx])

  const handleSetUpdate = useCallback(async (
    exercise: WorkoutExercise,
    setNumber: number,
    reps: number,
    loadKg: number | null,
  ) => {
    if (!workoutLogId || !exercise.exercise) return
    try {
      await updateExerciseSet(workoutLogId, exercise.exercise.id, setNumber, {
        repsCompleted: reps,
        loadKg,
      })
    } catch (err) {
      console.error('Erro ao atualizar série:', err)
    }
  }, [workoutLogId])

  // ─────────────────────────────────────────────────────────────────
  // Finalizar / Sair
  // ─────────────────────────────────────────────────────────────────

  async function handleFinish(data: { difficulty: string; notes: string }) {
    if (!workoutLogId) return
    setIsFinishing(true)
    try {
      const durationMs = new Date().getTime() - startTimeRef.current.getTime()
      await finishWorkoutSession(workoutLogId, {
        difficulty: data.difficulty as any,
        notes: data.notes,
        durationMinutes: durationMs / 1000 / 60,
      })
      navigate('/workouts', { replace: true })
    } catch (err) {
      console.error('Erro ao finalizar:', err)
      setIsFinishing(false)
    }
  }

  async function handleExit(choice: 'discard' | 'save') {
    setExitChoice(choice)
    setIsExiting(true)
    try {
      if (choice === 'discard' && workoutLogId) {
        await deleteWorkoutSession(workoutLogId)
      }
      navigate('/workouts', { replace: true })
    } catch (err) {
      console.error('Erro ao sair:', err)
      setIsExiting(false)
      setExitChoice(null)
    }
  }

  // ─────────────────────────────────────────────────────────────────
  // Derived
  // ─────────────────────────────────────────────────────────────────

  const exercises = workout?.exercises ?? []
  const currentExercise = exercises[currentIdx] ?? null
  const isExerciseDone = (ex: WorkoutExercise) => (setsCompleted[ex.id] ?? 0) >= ex.sets
  const exercisesDone = exercises.filter(isExerciseDone).length
  const totalSets = Object.values(setsCompleted).reduce((a, b) => a + b, 0)

  // ─────────────────────────────────────────────────────────────────
  // States: boot, error
  // ─────────────────────────────────────────────────────────────────

  if (isBooting) {
    return (
      <div className="content" style={{ alignItems: 'center', justifyContent: 'center', minHeight: '60vh' }}>
        <div style={{ textAlign: 'center' }}>
          <div className="f-display" style={{ fontSize: 40, color: 'var(--accent)' }}>
            INICIANDO TREINO
          </div>
          <div className="label-sm" style={{ marginTop: 8 }}>// preparando sessão</div>
        </div>
      </div>
    )
  }

  if (loadError) {
    return (
      <div className="content">
        <div className="card" style={{ textAlign: 'center', padding: 32 }}>
          <div style={{ color: 'var(--danger)', marginBottom: 12 }}>⚠ {loadError}</div>
          <button onClick={() => navigate(-1)} className="btn ghost">
            <Icon name="arrowL" size={14} /> Voltar
          </button>
        </div>
      </div>
    )
  }

  if (!currentExercise) return null

  // ═══════════════════════════════════════════════════════════════════
  // RENDER
  // ═══════════════════════════════════════════════════════════════════

  return (
    <>
      {/* ─── TOPBAR ───────────────────────────────────────── */}
      <div
        className="topbar"
        style={layout === 'B' ? { background: 'var(--accent)', color: 'var(--accent-fg)', borderBottom: 'none' } : undefined}
      >
        <div className="topbar-left">
          <div
            className="topbar-title"
            style={layout === 'B' ? { color: 'var(--accent-fg)' } : undefined}
          >
            {layout === 'B' ? `EM TREINO · ${formatMMSS(elapsedSec)}` : 'TREINO EM EXECUÇÃO'}
          </div>
          <div
            className="topbar-sub"
            style={layout === 'B' ? { color: 'rgba(0,0,0,0.55)' } : undefined}
          >
            {workout?.name}
          </div>
        </div>
        <div style={{ display: 'flex', gap: 10, alignItems: 'center', flexWrap: 'wrap' }}>
          {layout === 'A' && (
            <span className="chip danger">
              <span style={{ width: 6, height: 6, borderRadius: 99, background: 'currentColor' }} />
              AO VIVO {formatMMSS(elapsedSec)}
            </span>
          )}
          <button
            className="btn ghost forja-layout-toggle"
            onClick={() => setLayout((l) => (l === 'A' ? 'B' : 'A'))}
            aria-label={`Trocar para layout ${layout === 'A' ? 'B' : 'A'}`}
            style={
              layout === 'B'
                ? { background: 'transparent', color: '#0a0a0a', borderColor: 'rgba(0,0,0,0.3)' }
                : undefined
            }
          >
            LAYOUT {layout === 'A' ? 'B' : 'A'}
          </button>
          <button
            className="btn"
            onClick={() => setShowExitModal(true)}
            aria-label="Sair do treino"
            style={
              layout === 'B'
                ? { background: '#0a0a0a', color: 'var(--accent)', borderColor: '#0a0a0a' }
                : undefined
            }
          >
            <Icon name="x" size={14} /> Sair
          </button>
          <button
            className="btn primary"
            onClick={() => { skipTimer(); setShowFinishModal(true) }}
            aria-label="Encerrar treino"
            style={
              layout === 'B'
                ? { background: 'rgba(0,0,0,0.85)', color: 'var(--text)', borderColor: 'rgba(0,0,0,0.85)' }
                : undefined
            }
          >
            Encerrar
          </button>
        </div>
      </div>

      {/* ─── CONTEÚDO ─────────────────────────────────────── */}
      {layout === 'A' ? (
        <LayoutA
          workout={workout}
          currentIdx={currentIdx}
          setCurrentIdx={setCurrentIdx}
          exercises={exercises}
          currentExercise={currentExercise}
          setsCompleted={setsCompleted}
          lastSetData={lastSetData}
          onSetComplete={handleSetComplete}
          onSetUpdate={handleSetUpdate}
          timerSeconds={timerSeconds}
          isTimerRunning={isTimerRunning}
          exercisesDone={exercisesDone}
          totalSets={totalSets}
        />
      ) : (
        <LayoutB
          currentIdx={currentIdx}
          exercises={exercises}
          currentExercise={currentExercise}
          setsCompleted={setsCompleted}
          lastSetData={lastSetData}
          onSetComplete={handleSetComplete}
          onSetUpdate={handleSetUpdate}
          timerSeconds={timerSeconds}
          isTimerRunning={isTimerRunning}
        />
      )}

      {/* ─── MODAL FINALIZAR ────────────────────────────── */}
      <WorkoutFinishModal
        isOpen={showFinishModal}
        onClose={() => setShowFinishModal(false)}
        onConfirm={handleFinish}
        isSubmitting={isFinishing}
        sessionStats={{
          exercisesDone,
          totalExercises: exercises.length,
          totalSets,
          durationMinutes: Math.floor(elapsedSec / 60),
        }}
      />

      {/* ─── MODAL SAIR ─────────────────────────────────── */}
      <AnimatePresence>
        {showExitModal && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={() => !isExiting && setShowExitModal(false)}
            style={{
              position: 'fixed',
              inset: 0,
              background: 'rgba(0,0,0,0.7)',
              zIndex: 50,
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              padding: 20,
            }}
          >
            <motion.div
              initial={{ scale: 0.96, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.96, opacity: 0 }}
              onClick={(e) => e.stopPropagation()}
              role="dialog"
              aria-modal="true"
              aria-labelledby="modal-exit-title"
              className="card"
              style={{ maxWidth: 420, width: '100%' }}
            >
              <div className="eyebrow">SAIR DO TREINO?</div>
              <h2 id="modal-exit-title" className="f-display" style={{ fontSize: 32, margin: '8px 0 16px', color: 'var(--text)' }}>
                COMO QUER SAIR?
              </h2>
              <div style={{ fontSize: 13, color: 'var(--text-dim)', marginBottom: 20 }}>
                Você fez {totalSets} série{totalSets !== 1 ? 's' : ''} em {exercisesDone}/{exercises.length} exercícios.
              </div>
              <div className="col gap-3">
                <button
                  ref={(el) => { exitModalFocusRef.current = el }}
                  className="btn primary"
                  onClick={() => handleExit('save')}
                  disabled={isExiting}
                  style={{ justifyContent: 'center' }}
                >
                  {exitChoice === 'save' ? 'Salvando...' : 'Salvar progresso e sair'}
                </button>
                <button
                  className="btn danger"
                  onClick={() => handleExit('discard')}
                  disabled={isExiting}
                  style={{ justifyContent: 'center' }}
                >
                  {exitChoice === 'discard' ? 'Descartando...' : 'Descartar sessão'}
                </button>
                <button
                  className="btn ghost"
                  onClick={() => setShowExitModal(false)}
                  disabled={isExiting}
                  style={{ justifyContent: 'center' }}
                >
                  Continuar treinando
                </button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </>
  )
}

// ═══════════════════════════════════════════════════════════════════
// LAYOUT A — Lista lateral · Descanso compacto
// ═══════════════════════════════════════════════════════════════════

interface LayoutACommonProps {
  exercises: WorkoutExercise[]
  currentExercise: WorkoutExercise
  setsCompleted: Record<string, number>
  lastSetData: Record<string, Record<number, LastSetRecord>>
  onSetComplete: (ex: WorkoutExercise, setNumber: number, reps: number, loadKg: number | null) => void
  onSetUpdate: (ex: WorkoutExercise, setNumber: number, reps: number, loadKg: number | null) => void
  timerSeconds: number
  isTimerRunning: boolean
}

interface LayoutAProps extends LayoutACommonProps {
  workout: Workout | null
  currentIdx: number
  setCurrentIdx: (i: number) => void
  exercisesDone: number
  totalSets: number
}

function LayoutA(props: LayoutAProps) {
  const {
    workout, currentIdx, setCurrentIdx, exercises, currentExercise,
    setsCompleted, lastSetData, onSetComplete, onSetUpdate,
    timerSeconds, isTimerRunning,
    exercisesDone, totalSets,
  } = props

  const ex = currentExercise
  const exDoneCount = setsCompleted[ex.id] ?? 0
  const nextExercise = exercises[currentIdx + 1]

  return (
    <div className="content forja-treino-a" style={{ flexDirection: 'row', alignItems: 'stretch' }}>
      {/* LEFT — Lista */}
      <div className="col gap-3 forja-treino-list">
        <div className="label-sm">
          Exercícios · {currentIdx + 1}/{exercises.length}
        </div>
        <div className="bar">
          <span style={{ width: `${(exercisesDone / exercises.length) * 100}%` }} />
        </div>
        <div className="col" style={{ marginTop: 8 }}>
          {exercises.map((e, i) => {
            const done = (setsCompleted[e.id] ?? 0) >= e.sets
            const isCurrent = i === currentIdx
            return (
              <button
                key={e.id}
                onClick={() => setCurrentIdx(i)}
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: 12,
                  padding: '12px 8px',
                  borderBottom: '1px solid var(--hairline)',
                  opacity: done && !isCurrent ? 0.45 : 1,
                  background: 'transparent',
                  border: 'none',
                  width: '100%',
                  cursor: 'pointer',
                  textAlign: 'left',
                  color: 'inherit',
                }}
              >
                <div
                  style={{
                    width: 26,
                    height: 26,
                    borderRadius: 6,
                    background: isCurrent ? 'var(--accent)' : done ? 'transparent' : 'var(--bg-2)',
                    border: isCurrent ? 'none' : '1px solid var(--border)',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    color: isCurrent ? 'var(--accent-fg)' : 'var(--text-dim)',
                    fontFamily: 'var(--f-mono)',
                    fontSize: 12,
                    fontWeight: 700,
                    flexShrink: 0,
                  }}
                >
                  {done && !isCurrent ? <Icon name="check" size={14} stroke={2.5} /> : String(i + 1).padStart(2, '0')}
                </div>
                <div style={{ flex: 1, minWidth: 0 }}>
                  <div
                    style={{
                      fontSize: 13,
                      fontWeight: isCurrent ? 700 : 500,
                      whiteSpace: 'nowrap',
                      overflow: 'hidden',
                      textOverflow: 'ellipsis',
                      color: 'var(--text)',
                    }}
                  >
                    {e.exercise?.name ?? 'Exercício'}
                  </div>
                  <div style={{ fontSize: 11, color: 'var(--text-faint)' }}>
                    {e.sets}×{e.reps} · {e.suggested_load ? `${e.suggested_load}kg` : 'peso corp.'}
                  </div>
                </div>
              </button>
            )
          })}
        </div>
      </div>

      {/* CENTER — Exercício atual */}
      <div className="col flex-1 gap-5 forja-treino-center" style={{ minWidth: 0 }}>
        {/* Header do exercício */}
        <div className="card" style={{ padding: 0, overflow: 'hidden' }}>
          <div className="forja-treino-exhead">
            <MuscleImage
              group={ex.exercise?.muscle_group}
              className="forja-treino-thumb"
            />
            <div className="col flex-1" style={{ padding: '26px 28px' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', gap: 12 }}>
                <div>
                  <div className="eyebrow" style={{ color: 'var(--accent)' }}>
                    Exercício {String(currentIdx + 1).padStart(2, '0')}
                  </div>
                  <h1 className="f-display forja-treino-exname">
                    {(ex.exercise?.name ?? 'Exercício').toUpperCase()}
                  </h1>
                  <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap', marginTop: 6 }}>
                    {ex.exercise?.muscle_group && (
                      <span className="chip muscle">{MUSCLE_GROUP_LABELS[ex.exercise.muscle_group]}</span>
                    )}
                    <span className="chip">{ex.sets} séries</span>
                    <span className="chip">{ex.reps} reps</span>
                    {ex.rest_seconds > 0 && <span className="chip">desc. {ex.rest_seconds}s</span>}
                  </div>
                  {ex.notes && (
                    <div
                      style={{
                        marginTop: 10,
                        padding: '7px 12px',
                        background: 'rgba(212,255,58,0.06)',
                        borderLeft: '2px solid var(--accent)',
                        borderRadius: '0 var(--r-1) var(--r-1) 0',
                        fontSize: 12,
                        color: 'var(--text-dim)',
                        fontStyle: 'italic',
                        lineHeight: 1.5,
                      }}
                    >
                      {ex.notes}
                    </div>
                  )}
                </div>
              </div>

              {/* Última vez / PR / Volume */}
              <div className="forja-treino-stats">
                <div>
                  <div className="stat-label">Última vez</div>
                  <div className="f-display" style={{ fontSize: 22, color: 'var(--text)' }}>
                    {(() => {
                      const last = lastSetData[ex.exercise?.id ?? '']?.[1]
                      return last
                        ? `${last.loadKg ?? 0}kg × ${last.reps}`
                        : '—'
                    })()}
                  </div>
                </div>
                <div className="divider-v" style={{ height: 36, alignSelf: 'center' }} />
                <div>
                  <div className="stat-label">Progresso</div>
                  <div className="f-display" style={{ fontSize: 22, color: 'var(--accent)' }}>
                    {exDoneCount}/{ex.sets}
                  </div>
                </div>
                <div className="divider-v" style={{ height: 36, alignSelf: 'center' }} />
                <div>
                  <div className="stat-label">Sessão</div>
                  <div className="f-display" style={{ fontSize: 22, color: 'var(--text)' }}>
                    {totalSets}<span className="stat-unit">séries</span>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Instruções — fora do overflow:hidden para expandir sem sobrepor */}
        <ExerciseInstructions
          description={ex.exercise?.description}
          videoUrl={ex.exercise?.video_url}
        />

        {/* Séries */}
        <SetList
          ex={ex}
          exDoneCount={exDoneCount}
          lastSetData={lastSetData}
          onSetComplete={onSetComplete}
          onSetUpdate={onSetUpdate}
        />
      </div>

      {/* RIGHT — Descanso + próximo */}
      <div className="col gap-4 forja-treino-side">
        <div className="card card-accent" style={{ padding: 24 }}>
          <div className="eyebrow" style={{ color: 'rgba(0,0,0,0.55)' }}>Descanso</div>
          <div
            className="f-display"
            style={{ fontSize: 96, lineHeight: 0.9, marginTop: 6, color: '#0a0a0a' }}
          >
            {formatMMSS(timerSeconds)}
          </div>
          <div className="bar" style={{ background: 'rgba(0,0,0,0.2)', margin: '12px 0', height: 4 }}>
            <div
              style={{
                width: ex.rest_seconds > 0 ? `${(timerSeconds / ex.rest_seconds) * 100}%` : '0%',
                height: '100%',
                background: '#0a0a0a',
                borderRadius: 99,
                transition: 'width 1s linear',
              }}
            />
          </div>
        </div>

        {nextExercise && (
          <div className="card">
            <div className="label-sm">Próximo</div>
            <div className="f-display" style={{ fontSize: 26, marginTop: 6, lineHeight: 1.05, color: 'var(--text)' }}>
              {(nextExercise.exercise?.name ?? '').toUpperCase()}
            </div>
            <div style={{ color: 'var(--text-dim)', fontSize: 13, marginTop: 4 }}>
              {nextExercise.sets} séries · {nextExercise.reps} reps
              {nextExercise.suggested_load ? ` · ${nextExercise.suggested_load}kg` : ''}
            </div>
            <MuscleImage
              group={nextExercise.exercise?.muscle_group}
              style={{ height: 100, marginTop: 14, width: '100%' }}
            />
          </div>
        )}

        <div className="card card-flat">
          <div className="label-sm">Sessão</div>
          <div style={{ display: 'flex', justifyContent: 'space-between', marginTop: 10, fontSize: 13 }}>
            <span style={{ color: 'var(--text-dim)' }}>Séries</span>
            <span className="f-mono">{totalSets}</span>
          </div>
          <div style={{ display: 'flex', justifyContent: 'space-between', marginTop: 6, fontSize: 13 }}>
            <span style={{ color: 'var(--text-dim)' }}>Exercícios</span>
            <span className="f-mono">
              {exercisesDone} / {exercises.length}
            </span>
          </div>
          <div style={{ display: 'flex', justifyContent: 'space-between', marginTop: 6, fontSize: 13 }}>
            <span style={{ color: 'var(--text-dim)' }}>Ficha</span>
            <span className="f-mono" style={{ fontSize: 11 }}>{workout?.name ?? '—'}</span>
          </div>
        </div>
      </div>

      <style>{`
        .forja-treino-a { gap: 24px; }
        .forja-treino-list { width: 280px; flex-shrink: 0; }
        .forja-treino-side { width: 300px; flex-shrink: 0; }
        .forja-treino-exhead { display: flex; align-items: stretch; }
        .forja-treino-thumb { width: 220px; height: 220px; border-radius: 0; flex-shrink: 0; }
        .forja-treino-exname { font-size: 48px; margin: 4px 0 0; color: var(--text); line-height: 0.95; }
        .forja-treino-stats { margin-top: auto; display: flex; gap: 28px; padding-top: 18px; border-top: 1px solid var(--hairline); flex-wrap: wrap; }

        @media (max-width: 1100px) {
          .forja-treino-a { flex-direction: column !important; }
          .forja-treino-list, .forja-treino-side { width: 100% !important; }
          .forja-treino-thumb { display: none; }
          .forja-treino-exname { font-size: 36px; }
        }

        @media (max-width: 768px) {
          .forja-layout-toggle { display: none !important; }
        }
      `}</style>
    </div>
  )
}

// ═══════════════════════════════════════════════════════════════════
// LAYOUT B — Cronômetro hero · Topbar viva
// ═══════════════════════════════════════════════════════════════════

interface LayoutBProps extends LayoutACommonProps {
  currentIdx: number
}

function LayoutB(props: LayoutBProps) {
  const {
    currentIdx, exercises, currentExercise,
    setsCompleted, lastSetData, onSetComplete, onSetUpdate,
    timerSeconds,
  } = props

  const ex = currentExercise
  const exDoneCount = setsCompleted[ex.id] ?? 0

  return (
    <div className="content" style={{ padding: 0, gap: 0 }}>
      {/* HERO — exercício + cronômetro */}
      <div className="forja-treino-b-hero">
        <div className="forja-treino-b-info">
          <div>
            <div className="eyebrow">
              Exercício {String(currentIdx + 1).padStart(2, '0')} de {String(exercises.length).padStart(2, '0')}
              {ex.exercise?.muscle_group && ` · ${MUSCLE_GROUP_LABELS[ex.exercise.muscle_group]}`}
            </div>
            <h1 className="f-display forja-treino-b-exname">
              {(ex.exercise?.name ?? 'Exercício').toUpperCase()}
            </h1>
            {ex.notes && (
              <div
                style={{
                  marginTop: 10,
                  padding: '7px 12px',
                  background: 'rgba(212,255,58,0.06)',
                  borderLeft: '2px solid var(--accent)',
                  borderRadius: '0 var(--r-1) var(--r-1) 0',
                  fontSize: 12,
                  color: 'var(--text-dim)',
                  fontStyle: 'italic',
                  lineHeight: 1.5,
                }}
              >
                {ex.notes}
              </div>
            )}
          </div>
          <div className="forja-treino-b-meta">
            <div>
              <div className="stat-label">Meta</div>
              <div className="f-display" style={{ fontSize: 40, color: 'var(--text)' }}>
                {ex.sets}
                <span style={{ color: 'var(--text-dim)' }}>×</span>
                {ex.reps}
              </div>
            </div>
            <div className="divider-v" style={{ height: 56, alignSelf: 'center' }} />
            <div>
              <div className="stat-label">Carga base</div>
              <div className="f-display" style={{ fontSize: 40, color: 'var(--text)' }}>
                {ex.suggested_load ?? '—'}
                <span className="stat-unit">kg</span>
              </div>
            </div>
            <div className="divider-v" style={{ height: 56, alignSelf: 'center' }} />
            <div>
              <div className="stat-label">Feitas</div>
              <div className="f-display" style={{ fontSize: 40, color: 'var(--accent)' }}>
                {exDoneCount}
                <span className="stat-unit">/ {ex.sets}</span>
              </div>
            </div>
          </div>
        </div>
        <div className="forja-treino-b-timer">
          <div
            style={{
              position: 'absolute',
              inset: -1,
              opacity: 0.04,
              background: `radial-gradient(circle at center, var(--accent) 0%, transparent 70%)`,
            }}
          />
          <div className="eyebrow" style={{ color: 'var(--accent)' }}>DESCANSO</div>
          <div
            className="f-display forja-treino-b-timer-num"
            style={{ color: timerSeconds > 0 ? 'var(--accent)' : 'var(--text-faint)' }}
          >
            {formatMMSS(timerSeconds)}
          </div>
        </div>
      </div>

      {/* Instruções — fora do hero para expandir sem sobrepor os stats */}
      {(ex.exercise?.description || ex.exercise?.video_url) && (
        <div style={{ borderBottom: '1px solid var(--hairline)', padding: '0 40px' }}>
          <ExerciseInstructions
            description={ex.exercise?.description}
            videoUrl={ex.exercise?.video_url}
          />
        </div>
      )}

      {/* MIDDLE — séries + próximos */}
      <div className="forja-treino-b-bottom">
        <div className="forja-treino-b-sets">
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16 }}>
            <div className="f-display" style={{ fontSize: 24, color: 'var(--text)' }}>SÉRIES</div>
            <div style={{ display: 'flex', gap: 6 }}>
              <span className="chip">{ex.sets} planejadas</span>
              {ex.rest_seconds > 0 && <span className="chip">Desc. {ex.rest_seconds}s</span>}
            </div>
          </div>
          <SetList
            ex={ex}
            exDoneCount={exDoneCount}
            lastSetData={lastSetData}
            onSetComplete={onSetComplete}
            onSetUpdate={onSetUpdate}
            embedded
          />
        </div>

        <div className="forja-treino-b-next">
          <div className="label-sm">Próximos exercícios</div>
          <div className="col gap-3" style={{ marginTop: 14 }}>
            {exercises.slice(currentIdx + 1, currentIdx + 5).map((e, i) => (
              <div
                key={e.id}
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: 12,
                  padding: '8px 0',
                  borderBottom: '1px solid var(--hairline)',
                }}
              >
                <MuscleImage
                  group={e.exercise?.muscle_group}
                  style={{ width: 48, height: 48, flexShrink: 0, borderRadius: 'var(--r-1)' }}
                />
                <div style={{ flex: 1, minWidth: 0 }}>
                  <div
                    style={{
                      fontSize: 13,
                      fontWeight: 600,
                      whiteSpace: 'nowrap',
                      overflow: 'hidden',
                      textOverflow: 'ellipsis',
                      color: 'var(--text)',
                    }}
                  >
                    {e.exercise?.name ?? 'Exercício'}
                  </div>
                  <div style={{ fontSize: 11, color: 'var(--text-dim)' }}>
                    {e.sets}×{e.reps}
                    {e.suggested_load ? ` · ${e.suggested_load}kg` : ''}
                  </div>
                </div>
                <div className="pill-num">{String(currentIdx + 2 + i).padStart(2, '0')}</div>
              </div>
            ))}
            {currentIdx >= exercises.length - 1 && (
              <div style={{ color: 'var(--text-faint)', fontSize: 12, fontStyle: 'italic' }}>
                último exercício 🔥
              </div>
            )}
          </div>
        </div>
      </div>

      <style>{`
        .forja-treino-b-hero {
          display: grid;
          grid-template-columns: 1.4fr 1fr;
          min-height: 360px;
          border-bottom: 1px solid var(--hairline);
        }
        .forja-treino-b-info {
          padding: 36px 40px;
          display: flex;
          flex-direction: column;
          justify-content: space-between;
        }
        .forja-treino-b-exname {
          font-size: 80px;
          margin: 10px 0 0;
          max-width: 14ch;
          color: var(--text);
          line-height: 0.92;
        }
        .forja-treino-b-meta {
          display: flex;
          gap: 36px;
          margin-top: 24px;
          flex-wrap: wrap;
        }
        .forja-treino-b-timer {
          background: #050506;
          border-left: 1px solid var(--hairline);
          display: flex;
          flex-direction: column;
          align-items: center;
          justify-content: center;
          padding: 32px;
          position: relative;
          overflow: hidden;
        }
        .forja-treino-b-timer-num {
          font-size: 180px;
          line-height: 0.85;
          margin-top: 8px;
          position: relative;
        }
        .forja-treino-b-bottom {
          display: grid;
          grid-template-columns: 1fr 320px;
          min-height: 380px;
        }
        .forja-treino-b-sets {
          padding: 28px 40px;
          border-right: 1px solid var(--hairline);
        }
        .forja-treino-b-next {
          padding: 24px 22px;
          background: var(--bg-1);
        }

        @media (max-width: 1100px) {
          .forja-treino-b-hero { grid-template-columns: 1fr; }
          .forja-treino-b-timer-num { font-size: 120px; }
          .forja-treino-b-bottom { grid-template-columns: 1fr; }
          .forja-treino-b-sets { padding: 20px; border-right: none; border-bottom: 1px solid var(--hairline); }
          .forja-treino-b-exname { font-size: 48px; }
        }
      `}</style>
    </div>
  )
}

// ═══════════════════════════════════════════════════════════════════
// SET LIST — usada por A e B
// ═══════════════════════════════════════════════════════════════════

interface SetListProps {
  ex: WorkoutExercise
  exDoneCount: number
  lastSetData: Record<string, Record<number, LastSetRecord>>
  onSetComplete: (ex: WorkoutExercise, setNumber: number, reps: number, loadKg: number | null) => void
  onSetUpdate: (ex: WorkoutExercise, setNumber: number, reps: number, loadKg: number | null) => void
  /** se true, remove o wrapper .card */
  embedded?: boolean
}

function SetList({ ex, exDoneCount, lastSetData, onSetComplete, onSetUpdate, embedded = false }: SetListProps) {
  const sets = Array.from({ length: ex.sets }, (_, i) => i + 1)
  const exId = ex.exercise?.id ?? ''

  const Header = (
    <div
      style={{
        display: 'grid',
        gridTemplateColumns: '36px 1fr 1fr 32px',
        gap: 12,
        padding: '14px 16px',
        borderBottom: '1px solid var(--hairline)',
      }}
    >
      <div className="label-sm">#</div>
      <div className="label-sm">Carga (kg)</div>
      <div className="label-sm">Reps</div>
      <div></div>
    </div>
  )

  const Rows = (
    <>
      {sets.map((setNumber) => {
        const isDone = setNumber <= exDoneCount
        const isCurrent = setNumber === exDoneCount + 1
        return (
          <SetRow
            key={`${ex.id}-${setNumber}`}
            setNumber={setNumber}
            isDone={isDone}
            isCurrent={isCurrent}
            suggestedReps={ex.reps}
            suggestedLoad={ex.suggested_load ?? null}
            lastReps={lastSetData[exId]?.[setNumber]?.reps}
            lastLoad={lastSetData[exId]?.[setNumber]?.loadKg}
            onComplete={(reps, load) => onSetComplete(ex, setNumber, reps, load)}
          onUpdate={(reps, load) => onSetUpdate(ex, setNumber, reps, load)}
          />
        )
      })}
    </>
  )

  if (embedded) {
    return (
      <div>
        {Header}
        {Rows}
      </div>
    )
  }

  return (
    <div className="card" style={{ padding: 0 }}>
      {Header}
      {Rows}
    </div>
  )
}

// ═══════════════════════════════════════════════════════════════════
// SET ROW — linha de série editável
// ═══════════════════════════════════════════════════════════════════

interface SetRowProps {
  setNumber: number
  isDone: boolean
  isCurrent: boolean
  suggestedReps: string
  suggestedLoad: number | null
  lastReps?: number
  lastLoad?: number | null
  onComplete: (reps: number, loadKg: number | null) => void
  onUpdate: (reps: number, loadKg: number | null) => void
}

function SetRow({
  setNumber, isDone, isCurrent, suggestedReps, suggestedLoad, lastReps, lastLoad, onComplete, onUpdate,
}: SetRowProps) {
  // Prioridade: histórico > sugerido
  const defaultReps = lastReps != null
    ? String(lastReps)
    : (suggestedReps.includes('-') ? suggestedReps.split('-')[1] : suggestedReps)

  const defaultLoad = lastLoad != null
    ? String(lastLoad)
    : (suggestedLoad != null ? String(suggestedLoad) : '')

  const [reps, setReps] = useState(defaultReps)
  const [load, setLoad] = useState(defaultLoad)

  function complete() {
    const repsNum = parseInt(reps, 10)
    const loadNum = load !== '' ? parseFloat(load) : null
    if (!isNaN(repsNum) && repsNum > 0) {
      onComplete(repsNum, loadNum)
    }
  }

  function handleDoneUpdate() {
    if (!isDone) return
    const repsNum = parseInt(reps, 10)
    const loadNum = load !== '' ? parseFloat(load) : null
    if (!isNaN(repsNum) && repsNum > 0) onUpdate(repsNum, loadNum)
  }

  return (
    <div className={'set-row' + (isDone ? ' done' : '') + (isCurrent ? ' current' : '')}
         style={{ gridTemplateColumns: '36px 1fr 1fr 32px' }}>
      <div className="set-idx">{String(setNumber).padStart(2, '0')}</div>
      <input
        className="set-input"
        type="number"
        inputMode="decimal"
        value={load}
        onChange={(e) => setLoad(e.target.value)}
        onBlur={handleDoneUpdate}
        placeholder="—"
        step={0.5}
        min={0}
      />
      <input
        className="set-input"
        type="number"
        inputMode="numeric"
        value={reps}
        onChange={(e) => setReps(e.target.value)}
        onBlur={handleDoneUpdate}
        placeholder="—"
        min={1}
      />
      {isDone ? (
        <div className="check checked">
          <Icon name="check" size={14} stroke={3} />
        </div>
      ) : (
        <button
          onClick={complete}
          className="check"
          style={{ background: isCurrent ? 'var(--accent)' : 'transparent', border: 'none', cursor: 'pointer' }}
          title="Marcar série como feita"
        >
          <Icon name="check" size={14} stroke={3} color={isCurrent ? 'var(--accent-fg)' : 'currentColor'} />
        </button>
      )}
    </div>
  )
}

// ═══════════════════════════════════════════════════════════════════
// MUSCLE IMAGE — imagem do grupo muscular com fallback para placeholder
// ═══════════════════════════════════════════════════════════════════

function MuscleImage({
  group,
  className,
  style,
}: {
  group?: string
  className?: string
  style?: React.CSSProperties
}) {
  const [err, setErr] = useState(false)
  const src = group ? MUSCLE_GROUP_IMAGES[group as MuscleGroup] : undefined

  if (!src || err) {
    return <div className={`ph-img ${className ?? ''}`} style={style} />
  }

  return (
    <img
      src={src}
      alt=""
      aria-hidden="true"
      className={className}
      style={{ objectFit: 'cover', flexShrink: 0, display: 'block', ...style }}
      onError={() => setErr(true)}
    />
  )
}

// ═══════════════════════════════════════════════════════════════════
// EXERCISE INSTRUCTIONS — toggle descrição + modal de vídeo embutido
// ═══════════════════════════════════════════════════════════════════

/** Converte URL de vídeo para URL de embed (YouTube / Vimeo) */
function getEmbedUrl(url: string): string {
  // YouTube: youtube.com/watch?v=ID ou youtu.be/ID
  const yt = url.match(/(?:youtube\.com\/watch\?v=|youtu\.be\/)([^&?\s]+)/)
  if (yt) return `https://www.youtube.com/embed/${yt[1]}?autoplay=1&rel=0&modestbranding=1`
  // Vimeo: vimeo.com/ID
  const vm = url.match(/vimeo\.com\/(\d+)/)
  if (vm) return `https://player.vimeo.com/video/${vm[1]}?autoplay=1`
  // URL genérica — exibe diretamente no iframe
  return url
}

function ExerciseInstructions({ description, videoUrl }: { description?: string; videoUrl?: string }) {
  const [open, setOpen] = useState(false)
  const [videoOpen, setVideoOpen] = useState(false)

  // Fecha o modal de vídeo com Escape
  useEffect(() => {
    if (!videoOpen) return
    function onKey(e: KeyboardEvent) {
      if (e.key === 'Escape') setVideoOpen(false)
    }
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  }, [videoOpen])

  if (!description && !videoUrl) return null

  return (
    <>
      <div style={{ marginTop: 12 }}>
        <button
          onClick={() => setOpen((o) => !o)}
          aria-expanded={open}
          style={{
            display: 'inline-flex',
            alignItems: 'center',
            gap: 5,
            background: 'transparent',
            border: 'none',
            cursor: 'pointer',
            padding: 0,
            color: open ? 'var(--accent)' : 'var(--text-faint)',
            fontFamily: "'JetBrains Mono', monospace",
            fontSize: 9,
            letterSpacing: '0.15em',
            textTransform: 'uppercase',
            transition: 'color 0.15s',
          }}
        >
          <Icon
            name="chevron"
            size={12}
            style={{ transform: open ? 'rotate(180deg)' : 'none', transition: 'transform 0.2s ease' }}
          />
          Instruções
        </button>

        <AnimatePresence>
          {open && (
            <motion.div
              key="instructions-panel"
              initial={{ height: 0, opacity: 0 }}
              animate={{ height: 'auto', opacity: 1 }}
              exit={{ height: 0, opacity: 0 }}
              transition={{ duration: 0.18, ease: 'easeOut' }}
              style={{ overflow: 'hidden' }}
            >
              <div
                style={{
                  marginTop: 8,
                  padding: '12px 14px',
                  background: 'rgba(255,255,255,0.02)',
                  border: '1px solid var(--border)',
                  borderLeft: '2px solid var(--accent)',
                  borderRadius: '0 4px 4px 0',
                }}
              >
                {description && (
                  <p
                    style={{
                      margin: 0,
                      fontFamily: "'JetBrains Mono', monospace",
                      fontSize: 11,
                      color: 'var(--text-dim)',
                      lineHeight: 1.65,
                    }}
                  >
                    {description}
                  </p>
                )}
                {videoUrl && (
                  <button
                    onClick={() => setVideoOpen(true)}
                    style={{
                      display: 'inline-flex',
                      alignItems: 'center',
                      gap: 6,
                      marginTop: description ? 10 : 0,
                      color: 'var(--accent)',
                      fontFamily: "'JetBrains Mono', monospace",
                      fontSize: 9,
                      letterSpacing: '0.15em',
                      textTransform: 'uppercase',
                      background: 'transparent',
                      padding: '5px 10px',
                      border: '1px solid var(--accent)',
                      borderRadius: 3,
                      cursor: 'pointer',
                      transition: 'background 0.15s',
                    }}
                    onMouseEnter={(e) => { (e.currentTarget as HTMLButtonElement).style.background = 'rgba(212,255,58,0.08)' }}
                    onMouseLeave={(e) => { (e.currentTarget as HTMLButtonElement).style.background = 'transparent' }}
                  >
                    <Icon name="play" size={10} />
                    Ver vídeo
                  </button>
                )}
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>

      {/* ── Modal de vídeo ───────────────────────────────────────── */}
      <AnimatePresence>
        {videoOpen && videoUrl && (
          <motion.div
            key="video-modal-overlay"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.2 }}
            onClick={() => setVideoOpen(false)}
            role="dialog"
            aria-modal="true"
            aria-label="Vídeo do exercício"
            style={{
              position: 'fixed',
              inset: 0,
              zIndex: 100,
              background: 'rgba(0,0,0,0.94)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              padding: '20px',
            }}
          >
            <motion.div
              key="video-modal-content"
              initial={{ scale: 0.96, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.96, opacity: 0 }}
              transition={{ duration: 0.18 }}
              onClick={(e) => e.stopPropagation()}
              style={{ width: '100%', maxWidth: 900 }}
            >
              {/* Cabeçalho do modal */}
              <div style={{
                display: 'flex',
                justifyContent: 'space-between',
                alignItems: 'center',
                marginBottom: 10,
              }}>
                <span style={{
                  fontFamily: "'JetBrains Mono', monospace",
                  fontSize: 9,
                  color: 'var(--text-faint)',
                  letterSpacing: '0.15em',
                  textTransform: 'uppercase',
                }}>
                  // vídeo do exercício
                </span>
                <button
                  onClick={() => setVideoOpen(false)}
                  style={{
                    display: 'inline-flex',
                    alignItems: 'center',
                    gap: 5,
                    background: 'transparent',
                    border: '1px solid var(--border)',
                    borderRadius: 4,
                    padding: '5px 12px',
                    color: 'var(--text-faint)',
                    cursor: 'pointer',
                    fontFamily: "'JetBrains Mono', monospace",
                    fontSize: 9,
                    letterSpacing: '0.1em',
                    textTransform: 'uppercase',
                    transition: 'border-color 0.15s, color 0.15s',
                  }}
                  onMouseEnter={(e) => {
                    const el = e.currentTarget as HTMLButtonElement
                    el.style.borderColor = 'var(--danger)'
                    el.style.color = 'var(--danger)'
                  }}
                  onMouseLeave={(e) => {
                    const el = e.currentTarget as HTMLButtonElement
                    el.style.borderColor = 'var(--border)'
                    el.style.color = 'var(--text-faint)'
                  }}
                >
                  <Icon name="x" size={12} /> Fechar
                </button>
              </div>

              {/* Área de vídeo — aspect ratio 16:9 */}
              <div style={{
                position: 'relative',
                paddingBottom: '56.25%',
                height: 0,
                borderRadius: 6,
                overflow: 'hidden',
                border: '1px solid var(--border)',
                background: '#000',
              }}>
                <iframe
                  src={getEmbedUrl(videoUrl)}
                  title="Vídeo do exercício"
                  allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share"
                  allowFullScreen
                  style={{
                    position: 'absolute',
                    top: 0, left: 0,
                    width: '100%', height: '100%',
                    border: 'none',
                  }}
                />
              </div>

              {/* Dica de fechar */}
              <div style={{
                textAlign: 'center',
                marginTop: 10,
                fontFamily: "'JetBrains Mono', monospace",
                fontSize: 9,
                color: 'var(--text-faint)',
                opacity: 0.5,
                letterSpacing: '0.1em',
              }}>
                clique fora ou pressione ESC para fechar
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </>
  )
}
