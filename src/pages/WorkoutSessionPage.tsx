import { useState, useEffect, useRef, useCallback } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import { motion, AnimatePresence } from 'motion/react'
import { X, ChevronDown, ChevronUp, ExternalLink, Check } from 'lucide-react'
import { useAuth } from '../context/AuthContext'
import { getWorkoutById } from '../services/workout.service'
import {
  startWorkoutSession,
  logExerciseSet,
  finishWorkoutSession,
  deleteWorkoutSession,
} from '../services/workout-log.service'
import { getLastSetData } from '../services/history.service'
import type { LastSetRecord } from '../services/history.service'
import { ExerciseSetRow } from '../components/ExerciseSetRow'
import { RestTimer } from '../components/RestTimer'
import { WorkoutFinishModal } from '../components/WorkoutFinishModal'
import { MUSCLE_GROUP_LABELS } from '../types'
import type { Workout, WorkoutExercise } from '../types'

// ─────────────────────────────────────────────────────────────────
// Tipos locais
// ─────────────────────────────────────────────────────────────────

type ExitChoice = 'discard' | 'save' | null

// ─────────────────────────────────────────────────────────────────
// Página principal
// ─────────────────────────────────────────────────────────────────

export function WorkoutSessionPage() {
  const { id } = useParams<{ id: string }>()
  const navigate = useNavigate()
  const { profile } = useAuth()

  // ── Dados da ficha ──
  const [workout, setWorkout] = useState<Workout | null>(null)
  const [loadError, setLoadError] = useState<string | null>(null)
  const [isBooting, setIsBooting] = useState(true)  // carregamento inicial

  // ── Sessão ──
  const [workoutLogId, setWorkoutLogId] = useState<string | null>(null)
  const startTimeRef = useRef<Date>(new Date())

  // ── Navegação entre exercícios ──
  const [currentIdx, setCurrentIdx] = useState(0)
  const [expandedInstructions, setExpandedInstructions] = useState(false)

  // ── Séries concluídas: Record<workoutExercise.id, número de séries feitas> ──
  const [setsCompleted, setSetsCompleted] = useState<Record<string, number>>({})

  // ── Histórico da última sessão: { [exerciseLibraryId]: { [setNumber]: {reps, loadKg} } }
  const [lastSetData, setLastSetData] = useState<Record<string, Record<number, LastSetRecord>>>({})

  // ── Timer de descanso ──
  const [timerSeconds, setTimerSeconds] = useState(0)
  const [isTimerRunning, setIsTimerRunning] = useState(false)
  const timerRef = useRef<ReturnType<typeof setInterval> | null>(null)

  // ── Modais ──
  const [showFinishModal, setShowFinishModal] = useState(false)
  const [showExitModal, setShowExitModal] = useState(false)
  const [isFinishing, setIsFinishing] = useState(false)
  const [exitChoice, setExitChoice] = useState<ExitChoice>(null)
  const [isExiting, setIsExiting] = useState(false)

  // ─────────────────────────────────────────────────────────────────
  // Inicialização: carrega ficha + cria workout_log
  // ─────────────────────────────────────────────────────────────────

  useEffect(() => {
    if (!id || !profile) return

    async function boot() {
      setIsBooting(true)
      try {
        const data = await getWorkoutById(id!)
        if (!data) throw new Error('Ficha não encontrada')

        // Ordena exercícios por order_index
        if (data.exercises) {
          data.exercises.sort((a, b) => a.order_index - b.order_index)
        }
        setWorkout(data)

        // Busca histórico da última sessão para pré-preencher os inputs
        const exerciseLibraryIds = (data.exercises ?? [])
          .map(ex => ex.exercise?.id)
          .filter((id): id is string => Boolean(id))

        if (exerciseLibraryIds.length > 0) {
          const lastData = await getLastSetData(profile!.id, exerciseLibraryIds)
          setLastSetData(lastData)
        }

        // Cria sessão no banco
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
            clearInterval(timerRef.current!)
            return 0
          }
          return s - 1
        })
      }, 1000)
    } else {
      if (timerRef.current) clearInterval(timerRef.current)
    }
    return () => { if (timerRef.current) clearInterval(timerRef.current) }
  }, [isTimerRunning])

  function startTimer(seconds: number) {
    if (timerRef.current) clearInterval(timerRef.current)
    setTimerSeconds(seconds)
    setIsTimerRunning(true)
  }

  function pauseTimer() { setIsTimerRunning(false) }
  function resumeTimer() { if (timerSeconds > 0) setIsTimerRunning(true) }
  function skipTimer() {
    if (timerRef.current) clearInterval(timerRef.current)
    setTimerSeconds(0)
    setIsTimerRunning(false)
  }

  // ─────────────────────────────────────────────────────────────────
  // Registrar série concluída
  // ─────────────────────────────────────────────────────────────────

  const handleSetComplete = useCallback(async (
    exercise: WorkoutExercise,
    setNumber: number,
    reps: number,
    loadKg: number | null,
  ) => {
    if (!workoutLogId || !exercise.exercise) return

    // Salva no banco (fire-and-handle)
    try {
      await logExerciseSet(workoutLogId, exercise.exercise.id, {
        setNumber,
        repsCompleted: reps,
        loadKg,
      })
    } catch (err) {
      console.error('Erro ao salvar série:', err)
      // Não bloqueia o fluxo — aluno continua o treino
    }

    // Atualiza estado local
    setSetsCompleted((prev) => {
      const next = { ...prev, [exercise.id]: (prev[exercise.id] ?? 0) + 1 }

      // Inicia timer de descanso
      if (exercise.rest_seconds > 0) {
        startTimer(exercise.rest_seconds)
      }

      // Verificar se terminou todas as séries deste exercício
      if (next[exercise.id] >= exercise.sets) {
        const allExercises = workout?.exercises ?? []
        const isLast = currentIdx >= allExercises.length - 1

        // Só abre o modal quando TODOS os exercícios estiverem concluídos
        const allDone = allExercises.every(ex => (next[ex.id] ?? 0) >= ex.sets)

        setTimeout(() => {
          if (allDone) {
            // Todos os exercícios concluídos — abre modal de finalização
            skipTimer()
            setShowFinishModal(true)
          } else if (!isLast) {
            // Avança para o próximo, mas só se o aluno não navegou manualmente
            // durante o intervalo de 800ms (evita pular exercícios)
            setCurrentIdx((i) => {
              if (i === currentIdx) return currentIdx + 1
              return i // aluno navegou manualmente — respeita a escolha dele
            })
            setExpandedInstructions(false)
          }
          // Se é o último por índice mas ainda há exercícios pendentes:
          // não avança automaticamente — aluno navega pela lista abaixo
        }, 800)
      }

      return next
    })
  }, [workoutLogId, workout, currentIdx])

  // ─────────────────────────────────────────────────────────────────
  // Finalizar treino
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

  // ─────────────────────────────────────────────────────────────────
  // Sair do treino
  // ─────────────────────────────────────────────────────────────────

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
  // Computed values
  // ─────────────────────────────────────────────────────────────────

  const exercises = workout?.exercises ?? []
  const currentExercise = exercises[currentIdx] ?? null

  function isExerciseDone(ex: WorkoutExercise) {
    return (setsCompleted[ex.id] ?? 0) >= ex.sets
  }

  const exercisesDone = exercises.filter(isExerciseDone).length
  const exercisesLeft = exercises.length - exercisesDone
  const totalSets = Object.values(setsCompleted).reduce((a, b) => a + b, 0)

  // ─────────────────────────────────────────────────────────────────
  // Estado de erro/boot
  // ─────────────────────────────────────────────────────────────────

  if (isBooting) {
    return (
      <div className="min-h-screen" style={{ background: 'var(--bg)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
        <div style={{ textAlign: 'center' }}>
          <div style={{
            fontFamily: "'Outfit', sans-serif",
            fontWeight: 800,
            fontSize: 18,
            color: 'var(--accent)',
            marginBottom: 8,
            letterSpacing: '-0.01em',
          }}>
            Iniciando treino...
          </div>
          <div style={{
            fontFamily: "'JetBrains Mono', monospace",
            fontSize: 10,
            color: 'var(--fg-3)',
            letterSpacing: '0.1em',
          }}>
            // preparando sessão
          </div>
        </div>
      </div>
    )
  }

  if (loadError) {
    return (
      <div className="min-h-screen" style={{ background: 'var(--bg)', display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 24 }}>
        <div style={{ maxWidth: 400, width: '100%', textAlign: 'center' }}>
          <div style={{ fontFamily: "'JetBrains Mono', monospace", fontSize: 11, color: 'var(--danger)', marginBottom: 12 }}>
            ⚠ {loadError}
          </div>
          <button
            onClick={() => navigate(-1)}
            style={{
              background: 'transparent',
              border: '1px solid var(--border-md)',
              borderRadius: 4,
              padding: '8px 16px',
              color: 'var(--fg-2)',
              fontFamily: "'JetBrains Mono', monospace",
              fontSize: 10,
              cursor: 'pointer',
            }}
          >
            ← Voltar
          </button>
        </div>
      </div>
    )
  }

  // ─────────────────────────────────────────────────────────────────
  // Render principal
  // ─────────────────────────────────────────────────────────────────

  return (
    <div className="min-h-screen" style={{ background: 'var(--bg)' }}>

      {/* Grid lines decorativo */}
      <div className="fixed inset-0 pointer-events-none z-0"
        style={{ display: 'grid', gridTemplateColumns: 'repeat(12, 1fr)' }}>
        {Array.from({ length: 12 }).map((_, i) => (
          <span key={i} style={{ borderRight: '1px solid var(--border)' }} />
        ))}
      </div>

      {/* ── HEADER ── */}
      <header
        className="sticky top-0 z-30"
        style={{
          padding: '12px 16px',
          background: 'rgba(6, 7, 26,0.85)',
          borderBottom: '1px solid var(--border)',
          backdropFilter: 'blur(12px)',
        }}
      >
        <div className="max-w-xl mx-auto flex items-center gap-3">
          {/* Sair */}
          <button
            onClick={() => setShowExitModal(true)}
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: 5,
              background: 'transparent',
              border: 'none',
              color: 'var(--fg-3)',
              fontFamily: "'JetBrains Mono', monospace",
              fontSize: 10,
              letterSpacing: '0.08em',
              cursor: 'pointer',
              padding: '4px 0',
              flexShrink: 0,
            }}
          >
            <X size={14} /> Sair
          </button>

          {/* Nome da ficha */}
          <div style={{ flex: 1, minWidth: 0, textAlign: 'center' }}>
            <div style={{
              fontFamily: "'Outfit', sans-serif",
              fontWeight: 800,
              fontSize: 15,
              color: 'var(--fg)',
              overflow: 'hidden',
              textOverflow: 'ellipsis',
              whiteSpace: 'nowrap',
              letterSpacing: '-0.01em',
            }}>
              {workout?.name}
            </div>
          </div>

          {/* Finalizar */}
          <button
            onClick={() => { skipTimer(); setShowFinishModal(true) }}
            style={{
              background: 'var(--accent-muted)',
              border: '1px solid var(--accent-glow)',
              borderRadius: 4,
              padding: '5px 10px',
              color: 'var(--accent)',
              fontFamily: "'JetBrains Mono', monospace",
              fontSize: 9,
              letterSpacing: '0.08em',
              textTransform: 'uppercase',
              cursor: 'pointer',
              flexShrink: 0,
            }}
          >
            Finalizar
          </button>
        </div>
      </header>

      {/* ── TIMER BANNER ── */}
      <div className="sticky z-20" style={{ top: 49 }}>
        <div className="max-w-xl mx-auto">
          <RestTimer
            seconds={timerSeconds}
            isRunning={isTimerRunning}
            onPause={pauseTimer}
            onResume={resumeTimer}
            onSkip={skipTimer}
          />
        </div>
      </div>

      {/* ── CONTEÚDO ── */}
      <main className="relative z-10">
        <div className="max-w-xl mx-auto" style={{ padding: '16px 16px 60px' }}>

          {/* Barra de progresso */}
          <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 20 }}>
            <div style={{
              fontFamily: "'JetBrains Mono', monospace",
              fontSize: 9,
              color: exercisesDone > 0 ? 'var(--accent)' : 'var(--fg-3)',
              letterSpacing: '0.1em',
              textTransform: 'uppercase',
              whiteSpace: 'nowrap',
              transition: 'color 0.3s',
            }}>
              {exercisesDone}/{exercises.length}
            </div>
            <div style={{
              flex: 1,
              height: 2,
              background: 'var(--border)',
              borderRadius: 2,
              overflow: 'hidden',
            }}>
              <motion.div
                animate={{ width: exercises.length > 0 ? `${(exercisesDone / exercises.length) * 100}%` : '0%' }}
                transition={{ duration: 0.4 }}
                style={{ height: '100%', background: 'var(--accent)', borderRadius: 2 }}
              />
            </div>
            <div style={{
              fontFamily: "'JetBrains Mono', monospace",
              fontSize: 9,
              color: 'var(--fg-3)',
              letterSpacing: '0.1em',
              textTransform: 'uppercase',
              whiteSpace: 'nowrap',
            }}>
              {exercisesLeft > 0
                ? `${exercisesLeft} restante${exercisesLeft !== 1 ? 's' : ''}`
                : '✓ todos feitos'
              }
            </div>
          </div>

          {/* ── Exercício atual em destaque ── */}
          {currentExercise && (
            <AnimatePresence mode="wait">
              <motion.div
                key={currentExercise.id}
                initial={{ opacity: 0, x: 20 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: -20 }}
                transition={{ duration: 0.25 }}
                style={{
                  background: 'var(--surface)',
                  border: '1px solid var(--border-md)',
                  borderLeft: '3px solid var(--accent)',
                  borderRadius: 10,
                  marginBottom: 20,
                  overflow: 'hidden',
                }}
              >
                {/* Header do exercício */}
                <div style={{
                  padding: '14px 16px 12px',
                  borderBottom: '1px solid var(--border)',
                }}>
                  <div style={{
                    display: 'flex',
                    alignItems: 'baseline',
                    gap: 8,
                    marginBottom: 4,
                  }}>
                    <span style={{
                      fontFamily: "'JetBrains Mono', monospace",
                      fontSize: 11,
                      fontWeight: 700,
                      color: 'var(--accent)',
                      opacity: 0.7,
                      letterSpacing: '0.05em',
                      flexShrink: 0,
                    }}>
                      {String(currentIdx + 1).padStart(2, '0')}
                    </span>
                    <span style={{
                      fontFamily: "'JetBrains Mono', monospace",
                      fontSize: 8,
                      color: 'var(--fg-3)',
                      letterSpacing: '0.15em',
                      textTransform: 'uppercase',
                    }}>
                      {currentExercise.exercise?.muscle_group
                        ? MUSCLE_GROUP_LABELS[currentExercise.exercise.muscle_group]
                        : ''}
                      {' · '}
                      {currentExercise.sets} × {currentExercise.reps}
                      {currentExercise.rest_seconds > 0 && ` · ${currentExercise.rest_seconds}s`}
                    </span>
                  </div>
                  <div style={{
                    fontFamily: "'Outfit', sans-serif",
                    fontWeight: 800,
                    fontSize: 18,
                    color: 'var(--fg)',
                    letterSpacing: '-0.01em',
                  }}>
                    {currentExercise.exercise?.name ?? '—'}
                  </div>
                </div>

                {/* Toggle instruções */}
                {(currentExercise.notes || currentExercise.exercise?.video_url || currentExercise.exercise?.description) && (
                  <div>
                    <button
                      onClick={() => setExpandedInstructions((v) => !v)}
                      style={{
                        width: '100%',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'space-between',
                        padding: '8px 16px',
                        background: 'transparent',
                        border: 'none',
                        borderBottom: expandedInstructions ? '1px solid var(--border)' : 'none',
                        cursor: 'pointer',
                      }}
                    >
                      <div style={{
                        fontFamily: "'JetBrains Mono', monospace",
                        fontSize: 9,
                        color: 'var(--fg-3)',
                        letterSpacing: '0.1em',
                        textTransform: 'uppercase',
                      }}>
                        ℹ instruções do professor
                      </div>
                      {expandedInstructions
                        ? <ChevronUp size={12} color="var(--fg-3)" />
                        : <ChevronDown size={12} color="var(--fg-3)" />
                      }
                    </button>

                    <AnimatePresence>
                      {expandedInstructions && (
                        <motion.div
                          initial={{ height: 0, opacity: 0 }}
                          animate={{ height: 'auto', opacity: 1 }}
                          exit={{ height: 0, opacity: 0 }}
                          transition={{ duration: 0.2 }}
                          style={{ overflow: 'hidden' }}
                        >
                          <div style={{
                            padding: '10px 16px 12px',
                            borderBottom: '1px solid var(--border)',
                          }}>
                            {/* Notas da ficha */}
                            {currentExercise.notes && (
                              <div style={{
                                fontFamily: "'JetBrains Mono', monospace",
                                fontSize: 11,
                                color: 'var(--fg-2)',
                                fontStyle: 'italic',
                                lineHeight: 1.6,
                                marginBottom: currentExercise.exercise?.video_url ? 8 : 0,
                              }}>
                                "{currentExercise.notes}"
                              </div>
                            )}
                            {/* Descrição do exercício */}
                            {!currentExercise.notes && currentExercise.exercise?.description && (
                              <div style={{
                                fontFamily: "'JetBrains Mono', monospace",
                                fontSize: 11,
                                color: 'var(--fg-2)',
                                fontStyle: 'italic',
                                lineHeight: 1.6,
                                marginBottom: currentExercise.exercise?.video_url ? 8 : 0,
                              }}>
                                "{currentExercise.exercise.description}"
                              </div>
                            )}
                            {/* Link de vídeo */}
                            {currentExercise.exercise?.video_url && (
                              <a
                                href={currentExercise.exercise.video_url}
                                target="_blank"
                                rel="noopener noreferrer"
                                style={{
                                  display: 'inline-flex',
                                  alignItems: 'center',
                                  gap: 5,
                                  fontFamily: "'JetBrains Mono', monospace",
                                  fontSize: 9,
                                  color: 'var(--accent)',
                                  letterSpacing: '0.08em',
                                  textTransform: 'uppercase',
                                  textDecoration: 'none',
                                }}
                              >
                                <ExternalLink size={10} /> Ver demonstração
                              </a>
                            )}
                          </div>
                        </motion.div>
                      )}
                    </AnimatePresence>
                  </div>
                )}

                {/* Lista de séries */}
                <div style={{ padding: '8px 16px 12px' }}>
                  {/* Indicador de histórico disponível */}
                  {currentExercise.exercise?.id && lastSetData[currentExercise.exercise.id] && (
                    <div style={{
                      fontFamily: "'JetBrains Mono', monospace",
                      fontSize: 8,
                      color: 'var(--accent)',
                      opacity: 0.6,
                      letterSpacing: '0.12em',
                      textTransform: 'uppercase',
                      marginBottom: 6,
                    }}>
                      ↺ pré-preenchido com a última sessão
                    </div>
                  )}
                  {Array.from({ length: currentExercise.sets }).map((_, i) => {
                    const setNum = i + 1
                    const doneCount = setsCompleted[currentExercise.id] ?? 0
                    const isCompleted = setNum <= doneCount
                    const exLibId = currentExercise.exercise?.id
                    const lastSet = exLibId ? lastSetData[exLibId]?.[setNum] : undefined

                    return (
                      <ExerciseSetRow
                        key={`${currentExercise.id}-${setNum}`}
                        setNumber={setNum}
                        suggestedReps={currentExercise.reps}
                        suggestedLoad={currentExercise.suggested_load ?? null}
                        lastReps={lastSet?.reps}
                        lastLoad={lastSet?.loadKg}
                        isCompleted={isCompleted}
                        onComplete={(reps, loadKg) =>
                          handleSetComplete(currentExercise, setNum, reps, loadKg)
                        }
                      />
                    )
                  })}
                </div>
              </motion.div>
            </AnimatePresence>
          )}

          {/* ── Outros exercícios ── */}
          {exercises.length > 1 && (
            <>
              <div style={{
                fontFamily: "'JetBrains Mono', monospace",
                fontSize: 9,
                color: 'var(--fg-3)',
                letterSpacing: '0.15em',
                textTransform: 'uppercase',
                marginBottom: 8,
              }}>
                // outros exercícios
              </div>

              <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
                {exercises.map((ex, idx) => {
                  if (idx === currentIdx) return null
                  const done = isExerciseDone(ex)
                  const isActive = idx === currentIdx

                  return (
                    <motion.button
                      key={ex.id}
                      onClick={() => {
                        if (!isActive) {
                          setCurrentIdx(idx)
                          setExpandedInstructions(false)
                          skipTimer()
                        }
                      }}
                      whileHover={{ opacity: 0.85 }}
                      whileTap={{ scale: 0.98 }}
                      style={{
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'space-between',
                        gap: 10,
                        background: done ? 'var(--success-muted)' : 'var(--surface)',
                        border: `1px solid ${done ? 'rgba(74,222,128,0.2)' : 'var(--border)'}`,
                        borderRadius: 8,
                        padding: '10px 14px',
                        cursor: 'pointer',
                        textAlign: 'left',
                        width: '100%',
                      }}
                    >
                      {/* Número de ordem */}
                      <div style={{
                        fontFamily: "'JetBrains Mono', monospace",
                        fontSize: 11,
                        fontWeight: 700,
                        color: done ? 'var(--success)' : 'var(--fg-3)',
                        opacity: done ? 0.7 : 0.4,
                        letterSpacing: '0.05em',
                        flexShrink: 0,
                        minWidth: 20,
                      }}>
                        {String(idx + 1).padStart(2, '0')}
                      </div>

                      <div style={{ minWidth: 0, flex: 1 }}>
                        <div style={{
                          fontFamily: "'Outfit', sans-serif",
                          fontWeight: 800,
                          fontSize: 12,
                          color: done ? 'var(--success)' : 'var(--fg-2)',
                          letterSpacing: '-0.01em',
                          overflow: 'hidden',
                          textOverflow: 'ellipsis',
                          whiteSpace: 'nowrap',
                          marginBottom: 1,
                        }}>
                          {ex.exercise?.name ?? '—'}
                        </div>
                        <div style={{
                          fontFamily: "'JetBrains Mono', monospace",
                          fontSize: 9,
                          color: 'var(--fg-3)',
                          letterSpacing: '0.06em',
                        }}>
                          {ex.sets} × {ex.reps}
                          {ex.exercise?.muscle_group
                            ? ` · ${MUSCLE_GROUP_LABELS[ex.exercise.muscle_group]}`
                            : ''
                          }
                        </div>
                      </div>
                      {done && (
                        <div style={{
                          display: 'flex',
                          alignItems: 'center',
                          gap: 4,
                          flexShrink: 0,
                          marginLeft: 8,
                        }}>
                          <Check size={12} color="var(--success)" strokeWidth={3} />
                          <span style={{
                            fontFamily: "'JetBrains Mono', monospace",
                            fontSize: 8,
                            color: 'var(--success)',
                            letterSpacing: '0.1em',
                            textTransform: 'uppercase',
                          }}>
                            feito
                          </span>
                        </div>
                      )}
                    </motion.button>
                  )
                })}
              </div>
            </>
          )}

          {/* Botão ghost encerrar treino */}
          <div style={{ marginTop: 28, textAlign: 'center' }}>
            <button
              onClick={() => { skipTimer(); setShowFinishModal(true) }}
              style={{
                background: 'transparent',
                border: 'none',
                fontFamily: "'JetBrains Mono', monospace",
                fontSize: 9,
                color: 'var(--fg-3)',
                letterSpacing: '0.15em',
                textTransform: 'uppercase',
                cursor: 'pointer',
                padding: '8px 16px',
              }}
            >
              // encerrar treino
            </button>
          </div>

        </div>
      </main>

      {/* ── MODAL DE FINALIZAÇÃO ── */}
      <WorkoutFinishModal
        isOpen={showFinishModal}
        durationMinutes={(new Date().getTime() - startTimeRef.current.getTime()) / 1000 / 60}
        totalExercises={exercises.length}
        totalSets={totalSets}
        onConfirm={handleFinish}
        onClose={() => setShowFinishModal(false)}
        isLoading={isFinishing}
      />

      {/* ── MODAL DE SAÍDA ── */}
      <AnimatePresence>
        {showExitModal && (
          <>
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              style={{
                position: 'fixed',
                inset: 0,
                background: 'rgba(6, 7, 26,0.85)',
                backdropFilter: 'blur(8px)',
                zIndex: 50,
              }}
              onClick={() => !isExiting && setShowExitModal(false)}
            />
            <motion.div
              initial={{ opacity: 0, y: 40 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: 40 }}
              transition={{ type: 'spring', stiffness: 350, damping: 28 }}
              style={{
                position: 'fixed',
                bottom: 0,
                left: 0,
                right: 0,
                zIndex: 51,
                background: 'var(--surface)',
                borderTop: '1px solid var(--border-md)',
                borderRadius: '16px 16px 0 0',
                padding: '24px 20px 40px',
                maxWidth: 560,
                margin: '0 auto',
              }}
            >
              {/* Handle */}
              <div style={{
                width: 36,
                height: 3,
                borderRadius: 2,
                background: 'var(--border-strong)',
                margin: '0 auto 20px',
              }} />

              <div style={{
                fontFamily: "'JetBrains Mono', monospace",
                fontSize: 9,
                color: 'var(--fg-3)',
                letterSpacing: '0.15em',
                textTransform: 'uppercase',
                marginBottom: 4,
              }}>
                // sair do treino
              </div>
              <div style={{
                fontFamily: "'Outfit', sans-serif",
                fontWeight: 800,
                fontSize: 18,
                color: 'var(--fg)',
                letterSpacing: '-0.01em',
                marginBottom: 6,
              }}>
                Tem certeza?
              </div>
              <div style={{
                fontFamily: "'JetBrains Mono', monospace",
                fontSize: 11,
                color: 'var(--fg-3)',
                lineHeight: 1.6,
                marginBottom: 20,
              }}>
                {totalSets > 0
                  ? `Você registrou ${totalSets} série${totalSets > 1 ? 's' : ''} até agora.`
                  : 'Nenhuma série registrada ainda.'
                }
              </div>

              <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
                {/* Salvar incompleto */}
                <button
                  onClick={() => handleExit('save')}
                  disabled={isExiting}
                  style={{
                    background: 'var(--accent-muted)',
                    border: '1px solid var(--accent-glow)',
                    borderRadius: 8,
                    padding: '13px',
                    fontFamily: "'Outfit', sans-serif",
                    fontWeight: 800,
                    fontSize: 12,
                    color: 'var(--accent)',
                    letterSpacing: '0.04em',
                    textTransform: 'uppercase',
                    cursor: isExiting ? 'not-allowed' : 'pointer',
                    opacity: isExiting && exitChoice !== 'save' ? 0.4 : 1,
                  }}
                >
                  {isExiting && exitChoice === 'save' ? '// saindo...' : 'Salvar incompleto e sair'}
                </button>

                {/* Descartar */}
                <button
                  onClick={() => handleExit('discard')}
                  disabled={isExiting}
                  style={{
                    background: 'var(--danger-muted)',
                    border: '1px solid rgba(248,113,113,0.2)',
                    borderRadius: 8,
                    padding: '13px',
                    fontFamily: "'Outfit', sans-serif",
                    fontWeight: 800,
                    fontSize: 12,
                    color: 'var(--danger)',
                    letterSpacing: '0.04em',
                    textTransform: 'uppercase',
                    cursor: isExiting ? 'not-allowed' : 'pointer',
                    opacity: isExiting && exitChoice !== 'discard' ? 0.4 : 1,
                  }}
                >
                  {isExiting && exitChoice === 'discard' ? '// descartando...' : 'Descartar treino'}
                </button>

                {/* Cancelar */}
                <button
                  onClick={() => setShowExitModal(false)}
                  disabled={isExiting}
                  style={{
                    background: 'transparent',
                    border: '1px solid var(--border)',
                    borderRadius: 8,
                    padding: '11px',
                    fontFamily: "'JetBrains Mono', monospace",
                    fontSize: 10,
                    color: 'var(--fg-3)',
                    letterSpacing: '0.1em',
                    textTransform: 'uppercase',
                    cursor: isExiting ? 'not-allowed' : 'pointer',
                  }}
                >
                  Continuar treinando
                </button>
              </div>
            </motion.div>
          </>
        )}
      </AnimatePresence>

    </div>
  )
}
