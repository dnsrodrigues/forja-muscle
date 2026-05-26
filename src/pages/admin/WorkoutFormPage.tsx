import { useState, useEffect } from 'react'
import { useParams, useSearchParams, useNavigate, Link } from 'react-router-dom'
import { motion } from 'motion/react'
import { ArrowLeft, Plus, Save, Loader2, GripVertical } from 'lucide-react'
import { useAuth } from '../../context/AuthContext'
import {
  DndContext,
  closestCenter,
  KeyboardSensor,
  PointerSensor,
  useSensor,
  useSensors,
  type DragEndEvent,
} from '@dnd-kit/core'
import {
  arrayMove,
  SortableContext,
  sortableKeyboardCoordinates,
  useSortable,
  verticalListSortingStrategy,
} from '@dnd-kit/sortable'
import { CSS } from '@dnd-kit/utilities'
import {
  getWorkoutById,
  createWorkout,
  updateWorkout,
  addExerciseToWorkout,
  updateWorkoutExercise,
} from '../../services/workout.service'
import { ExerciseRow } from '../../components/ExerciseRow'
import { ExerciseSelector } from '../../components/ExerciseSelector'
import type { WorkoutExercise, Exercise, WeekDay } from '../../types'
import { WEEK_DAY_LABELS } from '../../types'

// ─── Wrapper arrastável para cada exercício ───────────────────────────────────
function SortableExerciseItem({
  exercise,
  index,
  onRemove,
  onChange,
}: {
  exercise: WorkoutExercise & { exercise?: Exercise }
  index: number
  onRemove: () => void
  onChange: (updates: Partial<WorkoutExercise>) => void
}) {
  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
    isDragging,
  } = useSortable({ id: exercise.id })

  return (
    <div
      ref={setNodeRef}
      style={{
        transform: CSS.Transform.toString(transform),
        transition,
        opacity: isDragging ? 0.4 : 1,
        display: 'flex',
        alignItems: 'flex-start',
        gap: 6,
      }}
    >
      {/* Handle de arrastar */}
      <div
        {...attributes}
        {...listeners}
        style={{
          paddingTop: 14,
          paddingBottom: 4,
          cursor: isDragging ? 'grabbing' : 'grab',
          color: 'var(--fg-3)',
          opacity: 0.5,
          flexShrink: 0,
          touchAction: 'none',
          display: 'flex',
          alignItems: 'flex-start',
        }}
      >
        <GripVertical size={16} />
      </div>

      {/* Linha do exercício */}
      <div style={{ flex: 1, minWidth: 0 }}>
        <ExerciseRow
          item={exercise as any}
          index={index}
          editable
          onRemove={onRemove}
          onChange={onChange}
        />
      </div>
    </div>
  )
}

const ALL_WEEK_DAYS: WeekDay[] = [
  'monday', 'tuesday', 'wednesday', 'thursday', 'friday', 'saturday', 'sunday',
]

export function WorkoutFormPage() {
  const { id } = useParams<{ id: string }>()
  const [searchParams] = useSearchParams()
  const navigate = useNavigate()
  const { profile } = useAuth()

  const isEditing = Boolean(id)
  const presetUserId = searchParams.get('userId') // criação via perfil do aluno

  // DnD sensors
  const sensors = useSensors(
    useSensor(PointerSensor, { activationConstraint: { distance: 5 } }),
    useSensor(KeyboardSensor, { coordinateGetter: sortableKeyboardCoordinates })
  )

  function handleDragEnd(event: DragEndEvent) {
    const { active, over } = event
    if (!over || active.id === over.id) return
    setExercises((prev) => {
      const oldIdx = prev.findIndex((e) => e.id === active.id)
      const newIdx = prev.findIndex((e) => e.id === over.id)
      return arrayMove(prev, oldIdx, newIdx)
    })
  }

  // Form state
  const [name, setName] = useState('')
  const [weekDays, setWeekDays] = useState<WeekDay[]>([])
  const [isTemplate, setIsTemplate] = useState(true)
  const [exercises, setExercises] = useState<(WorkoutExercise & { exercise?: Exercise })[]>([])
  const [selectorOpen, setSelectorOpen] = useState(false)

  // UI state
  const [loading, setLoading] = useState(isEditing)
  const [saving, setSaving] = useState(false)
  const [errors, setErrors] = useState<{ name?: string; exercises?: string }>({})
  const [loadError, setLoadError] = useState<string | null>(null)
  const [workoutId] = useState<string | null>(id ?? null)

  // Carrega ficha existente ao editar
  useEffect(() => {
    if (!isEditing || !id) return
    getWorkoutById(id)
      .then((data) => {
        if (!data) { setLoadError('Ficha não encontrada'); return }
        setName(data.name)
        setWeekDays(data.week_days)
        setIsTemplate(data.is_template)
        setExercises((data.exercises as any[]) ?? [])
      })
      .catch((err) => setLoadError(err.message))
      .finally(() => setLoading(false))
  }, [id, isEditing])

  // Quando criação via perfil do aluno → não é template
  useEffect(() => {
    if (presetUserId) setIsTemplate(false)
  }, [presetUserId])

  // ─── Dias da semana ────────────────────────────────
  function toggleDay(day: WeekDay) {
    setWeekDays((prev) =>
      prev.includes(day) ? prev.filter((d) => d !== day) : [...prev, day]
    )
  }

  // ─── Exercícios ────────────────────────────────────
  function handleExerciseSelect(exercise: Exercise) {
    const newEx: WorkoutExercise & { exercise: Exercise } = {
      id: `temp-${Date.now()}`,
      workout_id: workoutId ?? '',
      exercise_id: exercise.id,
      exercise,
      sets: 3,
      reps: '12',
      suggested_load: undefined,
      rest_seconds: 60,
      notes: undefined,
      order_index: exercises.length,
    }
    setExercises((prev) => [...prev, newEx])
  }

  function handleExerciseChange(
    index: number,
    updates: Partial<WorkoutExercise>
  ) {
    setExercises((prev) => {
      const updated = [...prev]
      updated[index] = { ...updated[index], ...updates }
      return updated
    })
  }

  function handleExerciseRemove(index: number) {
    setExercises((prev) => prev.filter((_, i) => i !== index))
  }

  // ─── Salvar ────────────────────────────────────────
  function validate(): boolean {
    const errs: typeof errors = {}
    if (!name.trim()) errs.name = 'Nome da ficha é obrigatório'
    if (exercises.length === 0) errs.exercises = 'Adicione ao menos 1 exercício'
    setErrors(errs)
    return Object.keys(errs).length === 0
  }

  async function handleSave() {
    if (!validate() || !profile) return
    setSaving(true)
    try {
      const targetUserId = presetUserId ?? profile.id

      if (!isEditing) {
        // ── Criar nova ficha ──
        const created = await createWorkout(
          {
            name: name.trim(),
            user_id: targetUserId,
            week_days: weekDays,
            is_template: isTemplate && !presetUserId,
          },
          profile.id
        )
        // Adiciona exercícios
        for (const [idx, ex] of exercises.entries()) {
          await addExerciseToWorkout(created.id, {
            exercise_id: ex.exercise_id,
            sets: ex.sets,
            reps: ex.reps,
            suggested_load: ex.suggested_load,
            rest_seconds: ex.rest_seconds,
            notes: ex.notes,
            order_index: idx,
          })
        }
      } else if (workoutId) {
        // ── Atualizar ficha existente ──
        await updateWorkout(workoutId, {
          name: name.trim(),
          week_days: weekDays,
          is_template: isTemplate,
        })

        // Exercícios: persist changes para os que já têm ID no banco
        // (os que têm id começando com 'temp-' são novos)
        for (const [idx, ex] of exercises.entries()) {
          if (ex.id.startsWith('temp-')) {
            await addExerciseToWorkout(workoutId, {
              exercise_id: ex.exercise_id,
              sets: ex.sets,
              reps: ex.reps,
              suggested_load: ex.suggested_load,
              rest_seconds: ex.rest_seconds,
              notes: ex.notes,
              order_index: idx,
            })
          } else {
            await updateWorkoutExercise(ex.id, {
              sets: ex.sets,
              reps: ex.reps,
              suggested_load: ex.suggested_load,
              rest_seconds: ex.rest_seconds,
              notes: ex.notes,
              order_index: idx,
            })
          }
        }
      }

      navigate('/admin/workouts')
    } catch (err) {
      alert(err instanceof Error ? err.message : 'Erro ao salvar ficha')
    } finally {
      setSaving(false)
    }
  }

  const excludeIds = exercises.map((e) => e.exercise_id)

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
        <div className="max-w-xl mx-auto flex items-center justify-between gap-3">
          <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
            <Link
              to="/admin/workouts"
              style={{ color: 'var(--fg-3)', opacity: 0.5, display: 'flex', alignItems: 'center' }}
            >
              <ArrowLeft size={16} />
            </Link>
            <div>
              <div style={{ fontFamily: "'JetBrains Mono', monospace", fontSize: 9, color: 'var(--fg-3)', letterSpacing: '0.15em', textTransform: 'uppercase', marginBottom: 1 }}>
                // {isEditing ? 'editar' : 'nova'} ficha
              </div>
              <div style={{ fontFamily: "'Outfit', sans-serif", fontWeight: 800, fontSize: 16, color: 'var(--fg)' }}>
                {isEditing ? (name || 'Carregando...') : 'Criar Ficha'}
              </div>
            </div>
          </div>

          {/* Botão salvar */}
          <button
            onClick={handleSave}
            disabled={saving}
            style={{
              display: 'flex', alignItems: 'center', gap: 5,
              background: saving ? 'rgba(108, 142, 247,0.5)' : 'var(--accent)',
              border: 'none', borderRadius: 4,
              padding: '8px 14px',
              color: 'var(--bg)',
              fontFamily: "'Outfit', sans-serif", fontWeight: 800,
              fontSize: 10, letterSpacing: '0.15em', textTransform: 'uppercase',
              cursor: saving ? 'not-allowed' : 'pointer',
            }}
          >
            {saving
              ? <><Loader2 size={12} style={{ animation: 'spin 1s linear infinite' }} /> Salvando...</>
              : <><Save size={12} /> Salvar</>
            }
          </button>
        </div>
      </header>

      {/* Loading do modo edição */}
      {loading && (
        <div className="max-w-xl mx-auto" style={{ padding: '20px 16px' }}>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
            {[1, 2, 3].map((i) => (
              <div key={i} className="skeleton" style={{ height: 48, borderRadius: 4 }} />
            ))}
          </div>
        </div>
      )}

      {/* Erro de carregamento */}
      {loadError && (
        <div className="max-w-xl mx-auto" style={{ padding: '20px 16px' }}>
          <div style={{ borderLeft: '2px solid var(--danger)', background: 'rgba(239,68,68,0.05)', padding: '12px 16px', fontFamily: "'JetBrains Mono', monospace", fontSize: 11, color: 'var(--danger)' }}>
            ⚠ {loadError}
          </div>
        </div>
      )}

      {/* Formulário */}
      {!loading && !loadError && (
        <main className="relative z-10">
          <motion.div
            className="max-w-xl mx-auto"
            style={{ padding: '20px 16px 60px' }}
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.3 }}
          >

            {/* ─── Nome ─── */}
            <div style={{ marginBottom: 20 }}>
              <label>
                <div style={{ fontFamily: "'JetBrains Mono', monospace", fontSize: 9, color: 'var(--fg-3)', letterSpacing: '0.15em', textTransform: 'uppercase', marginBottom: 6 }}>
                  Nome da Ficha *
                </div>
                <input
                  type="text"
                  value={name}
                  onChange={(e) => { setName(e.target.value); setErrors((p) => ({ ...p, name: undefined })) }}
                  placeholder="Ex: Treino A — Peito e Tríceps"
                  style={{
                    width: '100%',
                    background: 'rgba(255,255,255,0.03)',
                    border: `1px solid ${errors.name ? 'var(--danger)' : 'var(--border-md)'}`,
                    borderRadius: 4,
                    padding: '10px 12px',
                    color: 'var(--fg)',
                    fontFamily: "'Outfit', sans-serif",
                    fontWeight: 700,
                    fontSize: 14,
                    outline: 'none',
                  }}
                  onFocus={(e) => (e.target.style.borderColor = 'var(--accent)')}
                  onBlur={(e) => (e.target.style.borderColor = errors.name ? 'var(--danger)' : 'var(--border-md)')}
                />
                {errors.name && (
                  <div style={{ fontFamily: "'JetBrains Mono', monospace", fontSize: 9, color: 'var(--danger)', marginTop: 4 }}>
                    // {errors.name}
                  </div>
                )}
              </label>
            </div>

            {/* ─── Dias da semana ─── */}
            <div style={{ marginBottom: 20 }}>
              <div style={{ fontFamily: "'JetBrains Mono', monospace", fontSize: 9, color: 'var(--fg-3)', letterSpacing: '0.15em', textTransform: 'uppercase', marginBottom: 8 }}>
                Dias da Semana
              </div>
              <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap' }}>
                {ALL_WEEK_DAYS.map((day) => {
                  const active = weekDays.includes(day)
                  return (
                    <button
                      key={day}
                      onClick={() => toggleDay(day)}
                      style={{
                        background: active ? 'var(--accent)' : 'transparent',
                        border: `1px solid ${active ? 'var(--accent)' : 'var(--border-md)'}`,
                        borderRadius: 3,
                        padding: '5px 10px',
                        color: active ? 'var(--bg)' : 'var(--fg-3)',
                        fontFamily: "'JetBrains Mono', monospace",
                        fontSize: 10,
                        letterSpacing: '0.08em',
                        cursor: 'pointer',
                        transition: 'all 0.15s',
                      }}
                    >
                      {WEEK_DAY_LABELS[day].slice(0, 3)}
                    </button>
                  )
                })}
              </div>
            </div>

            {/* ─── Tipo: template ou ficha do aluno ─── */}
            {!presetUserId && (
              <div style={{
                marginBottom: 24,
                padding: '12px 14px',
                background: 'var(--surface)',
                border: '1px solid var(--border)',
                borderRadius: 4,
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'space-between',
              }}>
                <div>
                  <div style={{ fontFamily: "'Outfit', sans-serif", fontWeight: 700, fontSize: 12, color: 'var(--fg)', marginBottom: 2 }}>
                    Ficha de biblioteca
                  </div>
                  <div style={{ fontFamily: "'JetBrains Mono', monospace", fontSize: 9, color: 'var(--fg-3)', fontStyle: 'italic' }}>
                    // reutilizável para múltiplos alunos
                  </div>
                </div>
                <button
                  onClick={() => setIsTemplate((p) => !p)}
                  style={{
                    width: 40, height: 22,
                    background: isTemplate ? 'var(--accent)' : 'var(--border)',
                    border: 'none', borderRadius: 11,
                    cursor: 'pointer',
                    position: 'relative',
                    transition: 'background 0.2s',
                    flexShrink: 0,
                  }}
                >
                  <span style={{
                    position: 'absolute',
                    top: 3, left: isTemplate ? 21 : 3,
                    width: 16, height: 16,
                    background: 'white',
                    borderRadius: '50%',
                    transition: 'left 0.2s',
                  }} />
                </button>
              </div>
            )}

            {/* ─── Exercícios ─── */}
            <div>
              <div style={{
                display: 'flex', alignItems: 'center', justifyContent: 'space-between',
                marginBottom: 10,
              }}>
                <div style={{ fontFamily: "'JetBrains Mono', monospace", fontSize: 9, color: 'var(--fg-3)', letterSpacing: '0.15em', textTransform: 'uppercase' }}>
                  // {exercises.length} exercício{exercises.length !== 1 ? 's' : ''}
                </div>
                {errors.exercises && (
                  <div style={{ fontFamily: "'JetBrains Mono', monospace", fontSize: 9, color: 'var(--danger)' }}>
                    // {errors.exercises}
                  </div>
                )}
              </div>

              {/* Lista com drag & drop */}
              {exercises.length > 0 && (
                <DndContext
                  sensors={sensors}
                  collisionDetection={closestCenter}
                  onDragEnd={handleDragEnd}
                >
                  <SortableContext
                    items={exercises.map((e) => e.id)}
                    strategy={verticalListSortingStrategy}
                  >
                    <div style={{ display: 'flex', flexDirection: 'column', gap: 8, marginBottom: 10 }}>
                      {exercises.map((ex, idx) => (
                        <SortableExerciseItem
                          key={ex.id}
                          exercise={ex}
                          index={idx}
                          onRemove={() => handleExerciseRemove(idx)}
                          onChange={(updates) => handleExerciseChange(idx, updates)}
                        />
                      ))}
                    </div>
                  </SortableContext>
                </DndContext>
              )}

              {/* Botão adicionar */}
              <button
                onClick={() => setSelectorOpen(true)}
                style={{
                  width: '100%',
                  display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 6,
                  background: 'transparent',
                  border: `1px dashed ${errors.exercises ? 'var(--danger)' : 'rgba(108, 142, 247,0.3)'}`,
                  borderRadius: 4,
                  padding: '12px',
                  color: 'var(--accent)',
                  fontFamily: "'JetBrains Mono', monospace",
                  fontSize: 10, letterSpacing: '0.1em', textTransform: 'uppercase',
                  cursor: 'pointer',
                  transition: 'background 0.15s, border-color 0.15s',
                }}
                onMouseEnter={(e) => {
                  (e.currentTarget as HTMLButtonElement).style.background = 'rgba(108, 142, 247,0.04)'
                  ;(e.currentTarget as HTMLButtonElement).style.borderColor = 'var(--accent)'
                }}
                onMouseLeave={(e) => {
                  (e.currentTarget as HTMLButtonElement).style.background = 'transparent'
                  ;(e.currentTarget as HTMLButtonElement).style.borderColor = errors.exercises ? 'var(--danger)' : 'rgba(108, 142, 247,0.3)'
                }}
              >
                <Plus size={13} />
                Adicionar Exercício
              </button>
            </div>

          </motion.div>
        </main>
      )}

      {/* Modal de seleção de exercício */}
      <ExerciseSelector
        isOpen={selectorOpen}
        onClose={() => setSelectorOpen(false)}
        onSelect={handleExerciseSelect}
        excludeIds={excludeIds}
      />

      {/* CSS para animação do spinner */}
      <style>{`
        @keyframes spin { from { transform: rotate(0deg); } to { transform: rotate(360deg); } }
      `}</style>
    </div>
  )
}
