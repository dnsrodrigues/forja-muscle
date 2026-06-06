import { useState, useEffect } from 'react'
import { useParams, useSearchParams, useNavigate } from 'react-router-dom'
import { motion } from 'motion/react'
import { useAuth } from '../../context/AuthContext'
import { useToast } from '../../context/ToastContext'
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
  removeExerciseFromWorkout,
  updateExercise,
} from '../../services/workout.service'
import { ExerciseRow } from '../../components/ExerciseRow'
import { ExerciseSelector } from '../../components/ExerciseSelector'
import { Topbar } from '../../components/layout/Topbar'
import { Icon } from '../../components/ui/Icon'
import type { WorkoutExercise, Exercise, WeekDay } from '../../types'
import { WEEK_DAY_LABELS } from '../../types'

// ─── Wrapper arrastável ──────────────────────────────────────────────────────

function SortableExerciseItem({
  exercise,
  index,
  onRemove,
  onChange,
  onExerciseLibraryUpdate,
}: {
  exercise: WorkoutExercise & { exercise?: Exercise }
  index: number
  onRemove: () => void
  onChange: (updates: Partial<WorkoutExercise>) => void
  onExerciseLibraryUpdate: (updates: { description?: string; video_url?: string }) => Promise<void>
}) {
  const { attributes, listeners, setNodeRef, transform, transition, isDragging } = useSortable({
    id: exercise.id,
  })

  return (
    <div
      ref={setNodeRef}
      style={{
        transform: CSS.Transform.toString(transform),
        transition,
        opacity: isDragging ? 0.4 : 1,
        display: 'flex',
        alignItems: 'flex-start',
        gap: 8,
      }}
    >
      <button
        {...attributes}
        {...listeners}
        type="button"
        style={{
          paddingTop: 18,
          paddingBottom: 4,
          cursor: isDragging ? 'grabbing' : 'grab',
          color: 'var(--text-faint)',
          flexShrink: 0,
          touchAction: 'none',
          background: 'transparent',
          border: 'none',
        }}
        title="Arrastar para reordenar"
      >
        <svg width="16" height="16" viewBox="0 0 24 24" fill="currentColor">
          <circle cx="9" cy="6" r="1.5" />
          <circle cx="15" cy="6" r="1.5" />
          <circle cx="9" cy="12" r="1.5" />
          <circle cx="15" cy="12" r="1.5" />
          <circle cx="9" cy="18" r="1.5" />
          <circle cx="15" cy="18" r="1.5" />
        </svg>
      </button>

      <div style={{ flex: 1, minWidth: 0 }}>
        <ExerciseRow
          item={exercise as any}
          index={index}
          editable
          onRemove={onRemove}
          onChange={onChange}
          onExerciseLibraryUpdate={onExerciseLibraryUpdate}
        />
      </div>
    </div>
  )
}

const ALL_WEEK_DAYS: WeekDay[] = [
  'monday', 'tuesday', 'wednesday', 'thursday', 'friday', 'saturday', 'sunday',
]

// ─── Página ──────────────────────────────────────────────────────────────────

export function WorkoutFormPage() {
  const { id } = useParams<{ id: string }>()
  const [searchParams] = useSearchParams()
  const navigate = useNavigate()
  const { profile } = useAuth()
  const { showToast } = useToast()

  const isEditing = Boolean(id)
  const presetUserId = searchParams.get('userId')

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

  const [name, setName] = useState('')
  const [weekDays, setWeekDays] = useState<WeekDay[]>([])
  const [isTemplate, setIsTemplate] = useState(true)
  const [exercises, setExercises] = useState<(WorkoutExercise & { exercise?: Exercise })[]>([])
  // IDs dos exercícios que já existiam no banco quando a ficha foi carregada.
  // Serve para descobrir quais foram removidos na hora de salvar.
  const [originalExerciseIds, setOriginalExerciseIds] = useState<string[]>([])
  const [selectorOpen, setSelectorOpen] = useState(false)

  const [loading, setLoading] = useState(isEditing)
  const [saving, setSaving] = useState(false)
  const [errors, setErrors] = useState<{ name?: string; exercises?: string }>({})
  const [loadError, setLoadError] = useState<string | null>(null)
  const [workoutId] = useState<string | null>(id ?? null)

  useEffect(() => {
    if (!isEditing || !id) return
    getWorkoutById(id)
      .then((data) => {
        if (!data) { setLoadError('Ficha não encontrada'); return }
        setName(data.name)
        setWeekDays(data.week_days)
        setIsTemplate(data.is_template)
        const loaded = (data.exercises as any[]) ?? []
        setExercises(loaded)
        setOriginalExerciseIds(loaded.map((ex) => ex.id))
      })
      .catch((err) => setLoadError(err.message))
      .finally(() => setLoading(false))
  }, [id, isEditing])

  useEffect(() => {
    if (presetUserId) setIsTemplate(false)
  }, [presetUserId])

  function toggleDay(day: WeekDay) {
    setWeekDays((prev) => prev.includes(day) ? prev.filter((d) => d !== day) : [...prev, day])
  }

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

  function handleExerciseChange(index: number, updates: Partial<WorkoutExercise>) {
    setExercises((prev) => {
      const updated = [...prev]
      updated[index] = { ...updated[index], ...updates }
      return updated
    })
  }

  function handleExerciseRemove(index: number) {
    setExercises((prev) => prev.filter((_, i) => i !== index))
  }

  async function handleExerciseLibraryUpdate(
    exerciseId: string,
    updates: { description?: string; video_url?: string }
  ) {
    await updateExercise(exerciseId, updates)
    // Atualiza o objeto local pra refletir o valor salvo
    setExercises((prev) =>
      prev.map((ex) =>
        ex.exercise_id === exerciseId
          ? {
              ...ex,
              exercise: ex.exercise
                ? { ...ex.exercise, ...updates }
                : ex.exercise,
            }
          : ex
      )
    )
  }

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
        const created = await createWorkout(
          {
            name: name.trim(),
            user_id: targetUserId,
            week_days: weekDays,
            is_template: isTemplate && !presetUserId,
          },
          profile.id
        )
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
        await updateWorkout(workoutId, {
          name: name.trim(),
          week_days: weekDays,
          is_template: isTemplate,
        })

        // Apaga do banco os exercícios que foram removidos da tela:
        // estavam na lista original mas não estão mais na lista atual.
        const currentIds = new Set(exercises.map((ex) => ex.id))
        const removedIds = originalExerciseIds.filter((oid) => !currentIds.has(oid))
        for (const removedId of removedIds) {
          await removeExerciseFromWorkout(removedId)
        }

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
      showToast(err instanceof Error ? err.message : 'Erro ao salvar ficha', 'error')
    } finally {
      setSaving(false)
    }
  }

  const excludeIds = exercises.map((e) => e.exercise_id)

  return (
    <>
      <Topbar
        eyebrow={isEditing ? 'EDITAR FICHA' : 'NOVA FICHA'}
        title={isEditing ? (name || 'CARREGANDO...').toUpperCase() : 'CRIAR FICHA'}
        actions={
          <>
            <button onClick={() => navigate('/admin/workouts')} className="btn ghost">
              <Icon name="arrowL" size={14} /> Voltar
            </button>
            <button onClick={handleSave} disabled={saving} className="btn primary">
              {saving ? (
                <>
                  <span
                    style={{
                      display: 'inline-block',
                      width: 14,
                      height: 14,
                      borderRadius: '50%',
                      border: '2px solid currentColor',
                      borderTopColor: 'transparent',
                      animation: 'forjaSpin 0.7s linear infinite',
                    }}
                  />
                  Salvando...
                </>
              ) : (
                <>
                  <Icon name="check" size={14} stroke={2.5} /> Salvar
                </>
              )}
            </button>
          </>
        }
      />

      <div className="content">
        {loading && (
          <>
            <div className="skeleton" style={{ height: 80, borderRadius: 14 }} />
            {[1, 2, 3].map((i) => (
              <div key={i} className="skeleton" style={{ height: 60, borderRadius: 14 }} />
            ))}
          </>
        )}

        {loadError && (
          <div
            className="card"
            style={{ borderLeft: '2px solid var(--danger)', background: 'rgba(255,61,85,0.05)' }}
          >
            <div style={{ color: 'var(--danger)' }}>⚠ {loadError}</div>
          </div>
        )}

        {!loading && !loadError && (
          <motion.div
            initial={{ opacity: 0, y: 8 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.3 }}
            style={{ display: 'flex', flexDirection: 'column', gap: 24 }}
          >
            {/* Dados da ficha */}
            <div className="card">
              <h2 className="card-title">DADOS DA FICHA</h2>

              <div style={{ marginTop: 18 }}>
                <div className="label-sm" style={{ marginBottom: 6 }}>Nome da ficha *</div>
                <input
                  type="text"
                  className="input"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  placeholder="Ex: Push A · Peito · Ombro · Tríceps"
                  maxLength={80}
                />
                {errors.name && (
                  <div style={{ fontSize: 11, color: 'var(--danger)', marginTop: 4 }}>
                    ⚠ {errors.name}
                  </div>
                )}
              </div>

              {/* Dias da semana */}
              <div style={{ marginTop: 18 }}>
                <div className="label-sm" style={{ marginBottom: 8 }}>Dias da semana</div>
                <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap' }}>
                  {ALL_WEEK_DAYS.map((day) => {
                    const active = weekDays.includes(day)
                    return (
                      <button
                        key={day}
                        type="button"
                        onClick={() => toggleDay(day)}
                        className={active ? 'chip solid' : 'chip'}
                        style={{
                          padding: '8px 14px',
                          fontSize: 12,
                          cursor: 'pointer',
                          border: active ? '1px solid var(--accent)' : '1px solid var(--border)',
                        }}
                      >
                        {WEEK_DAY_LABELS[day]}
                      </button>
                    )
                  })}
                </div>
              </div>

              {/* Template */}
              {!presetUserId && (
                <div style={{ marginTop: 18, display: 'flex', alignItems: 'center', gap: 12 }}>
                  <button
                    type="button"
                    onClick={() => setIsTemplate(!isTemplate)}
                    className={'check' + (isTemplate ? ' checked' : '')}
                    style={{ flexShrink: 0 }}
                  >
                    {isTemplate && <Icon name="check" size={14} stroke={3} />}
                  </button>
                  <div>
                    <div style={{ fontSize: 13, color: 'var(--text)' }}>
                      Salvar como template
                    </div>
                    <div style={{ fontSize: 11, color: 'var(--text-dim)', marginTop: 2 }}>
                      Templates ficam na biblioteca e podem ser atribuídos a vários alunos.
                    </div>
                  </div>
                </div>
              )}
            </div>

            {/* Exercícios */}
            <div className="card" style={{ padding: 0 }}>
              <div
                style={{
                  display: 'flex',
                  justifyContent: 'space-between',
                  alignItems: 'center',
                  padding: '18px 22px',
                  borderBottom: '1px solid var(--hairline)',
                  flexWrap: 'wrap',
                  gap: 12,
                }}
              >
                <h2 className="card-title">EXERCÍCIOS · {exercises.length}</h2>
                <button onClick={() => setSelectorOpen(true)} className="btn primary">
                  <Icon name="plus" size={14} /> Adicionar exercício
                </button>
              </div>

              <div style={{ padding: 22 }}>
                {errors.exercises && (
                  <div
                    style={{
                      fontSize: 11,
                      color: 'var(--danger)',
                      marginBottom: 12,
                      padding: '8px 12px',
                      background: 'rgba(255,61,85,0.05)',
                      borderLeft: '2px solid var(--danger)',
                    }}
                  >
                    ⚠ {errors.exercises}
                  </div>
                )}

                {exercises.length === 0 ? (
                  <div
                    style={{
                      border: '1px dashed var(--border)',
                      borderRadius: 'var(--r-2)',
                      padding: '32px 20px',
                      textAlign: 'center',
                      color: 'var(--text-dim)',
                      fontSize: 13,
                      fontStyle: 'italic',
                    }}
                  >
                    Nenhum exercício adicionado. Clique em "Adicionar exercício" para começar.
                  </div>
                ) : (
                  <DndContext sensors={sensors} collisionDetection={closestCenter} onDragEnd={handleDragEnd}>
                    <SortableContext items={exercises.map((e) => e.id)} strategy={verticalListSortingStrategy}>
                      <div className="col gap-2">
                        {exercises.map((ex, idx) => (
                          <SortableExerciseItem
                            key={ex.id}
                            exercise={ex}
                            index={idx}
                            onRemove={() => handleExerciseRemove(idx)}
                            onChange={(updates) => handleExerciseChange(idx, updates)}
                            onExerciseLibraryUpdate={(updates) =>
                              handleExerciseLibraryUpdate(ex.exercise_id, updates)
                            }
                          />
                        ))}
                      </div>
                    </SortableContext>
                  </DndContext>
                )}
              </div>
            </div>
          </motion.div>
        )}
      </div>

      {/* Modal selector */}
      {selectorOpen && (
        <ExerciseSelector
          isOpen={selectorOpen}
          onClose={() => setSelectorOpen(false)}
          onSelect={handleExerciseSelect}
          excludeIds={excludeIds}
        />
      )}
    </>
  )
}
