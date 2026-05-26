import { supabase } from '../lib/supabase'
import type {
  Workout,
  WorkoutExercise,
  WorkoutWithStudent,
  Exercise,
  CreateWorkoutDTO,
  UpdateWorkoutDTO,
  AddExerciseDTO,
} from '../types'

// ─────────────────────────────────────────────
// Helpers de query
// ─────────────────────────────────────────────

const WORKOUT_WITH_EXERCISES = `
  *,
  exercises:workout_exercises(
    *,
    exercise:exercise_library(*)
  )
` as const

// ─────────────────────────────────────────────
// Aluno — fichas do próprio usuário
// ─────────────────────────────────────────────

/** Ordena os exercícios de uma ficha por order_index (helper interno) */
function sortExercises(workout: Workout): Workout {
  if (workout?.exercises) {
    workout.exercises = [...workout.exercises].sort(
      (a, b) => a.order_index - b.order_index
    )
  }
  return workout
}

/** Retorna todas as fichas ativas do aluno, com seus exercícios */
export async function getMyWorkouts(
  userId: string
): Promise<Workout[]> {
  const { data, error } = await supabase
    .from('workouts')
    .select(WORKOUT_WITH_EXERCISES)
    .eq('user_id', userId)
    .eq('is_active', true)
    .eq('is_template', false)
    .order('created_at', { ascending: true })

  if (error) throw new Error(error.message)
  return ((data ?? []) as Workout[]).map(sortExercises)
}

/** Retorna uma ficha específica com todos os exercícios */
export async function getWorkoutById(
  id: string
): Promise<Workout | null> {
  const { data, error } = await supabase
    .from('workouts')
    .select(WORKOUT_WITH_EXERCISES)
    .eq('id', id)
    .single()

  if (error) {
    if (error.code === 'PGRST116') return null // not found
    throw new Error(error.message)
  }
  return sortExercises(data as Workout)
}

// ─────────────────────────────────────────────
// Admin — biblioteca de templates
// ─────────────────────────────────────────────

/** Retorna todos os templates da biblioteca (is_template = true) */
export async function getTemplates(): Promise<Workout[]> {
  const { data, error } = await supabase
    .from('workouts')
    .select(WORKOUT_WITH_EXERCISES)
    .eq('is_template', true)
    .eq('is_active', true)
    .order('created_at', { ascending: false })

  if (error) throw new Error(error.message)
  return (data ?? []) as Workout[]
}

/** Retorna fichas de treino de um aluno específico (visão admin) */
export async function getStudentWorkouts(
  studentId: string
): Promise<Workout[]> {
  const { data, error } = await supabase
    .from('workouts')
    .select(WORKOUT_WITH_EXERCISES)
    .eq('user_id', studentId)
    .eq('is_active', true)
    .eq('is_template', false)
    .order('created_at', { ascending: true })

  if (error) throw new Error(error.message)
  return (data ?? []) as Workout[]
}

/**
 * Admin: retorna TODAS as fichas de alunos (is_template=false)
 * com o perfil do aluno embutido. Usado na tela de admin para ver fichas por aluno.
 *
 * Faz duas queries separadas para evitar ambiguidade de FK entre
 * workouts.user_id e workouts.created_by (ambas apontam para profiles).
 */
export async function getAllStudentWorkouts(): Promise<WorkoutWithStudent[]> {
  // 1. Busca todas as fichas de alunos com exercícios
  const { data: workoutsData, error: workoutsError } = await supabase
    .from('workouts')
    .select(`
      *,
      exercises:workout_exercises(*, exercise:exercise_library(*))
    `)
    .eq('is_template', false)
    .eq('is_active', true)
    .order('created_at', { ascending: true })

  if (workoutsError) throw new Error(workoutsError.message)
  const workouts = workoutsData ?? []

  if (workouts.length === 0) return []

  // 2. Coleta IDs únicos de alunos
  const userIds = [...new Set(
    workouts.map((w: Record<string, unknown>) => w.user_id as string).filter(Boolean)
  )]

  // 3. Busca perfis dos alunos em uma query separada
  const { data: profilesData, error: profilesError } = await supabase
    .from('profiles')
    .select('id, full_name, email')
    .in('id', userIds)

  if (profilesError) throw new Error(profilesError.message)

  const profileMap = Object.fromEntries(
    (profilesData ?? []).map((p) => [p.id, p])
  )

  // 4. Junta fichas + perfis manualmente
  return workouts.map((w: Record<string, unknown>) => ({
    ...w,
    student: profileMap[w.user_id as string] ?? undefined,
  })) as WorkoutWithStudent[]
}

/** Retorna todos os usuários que têm uma determinada ficha (por template_id) */
export async function getWorkoutUsageCount(templateId: string): Promise<number> {
  const { count, error } = await supabase
    .from('workouts')
    .select('id', { count: 'exact', head: true })
    .eq('template_id', templateId)
    .eq('is_active', true)

  if (error) throw new Error(error.message)
  return count ?? 0
}

// ─────────────────────────────────────────────
// Admin — criar / editar / desativar fichas
// ─────────────────────────────────────────────

/** Cria uma nova ficha (template ou ficha de aluno) */
export async function createWorkout(
  dto: CreateWorkoutDTO,
  createdBy: string
): Promise<Workout> {
  const { data, error } = await supabase
    .from('workouts')
    .insert({
      name: dto.name,
      description: dto.description,
      user_id: dto.user_id,
      created_by: createdBy,
      week_days: dto.week_days,
      is_template: dto.is_template,
      template_id: dto.template_id ?? null,
    })
    .select()
    .single()

  if (error) throw new Error(error.message)
  return data as Workout
}

/** Atualiza campos de uma ficha existente */
export async function updateWorkout(
  id: string,
  dto: UpdateWorkoutDTO
): Promise<Workout> {
  const { data, error } = await supabase
    .from('workouts')
    .update({
      ...dto,
      updated_at: new Date().toISOString(),
    })
    .eq('id', id)
    .select()
    .single()

  if (error) throw new Error(error.message)
  return data as Workout
}

/** Desativa uma ficha (soft delete — nunca deleta fisicamente) */
export async function deactivateWorkout(id: string): Promise<void> {
  const { error } = await supabase
    .from('workouts')
    .update({ is_active: false, updated_at: new Date().toISOString() })
    .eq('id', id)

  if (error) throw new Error(error.message)
}

/**
 * Atribui um template a um aluno:
 * cria uma cópia da ficha (is_template=false) vinculada ao aluno,
 * copiando também os exercícios do template.
 */
export async function assignTemplateToStudent(
  templateId: string,
  studentId: string,
  adminId: string
): Promise<Workout> {
  // 1. Busca o template com exercícios
  const template = await getWorkoutById(templateId)
  if (!template) throw new Error('Template não encontrado')

  // 2. Cria a cópia para o aluno
  const newWorkout = await createWorkout(
    {
      name: template.name,
      description: template.description,
      user_id: studentId,
      week_days: template.week_days,
      is_template: false,
      template_id: templateId,
    },
    adminId
  )

  // 3. Copia os exercícios
  if (template.exercises && template.exercises.length > 0) {
    const exercisesToInsert = template.exercises.map((ex) => ({
      workout_id: newWorkout.id,
      exercise_id: ex.exercise_id,
      sets: ex.sets,
      reps: ex.reps,
      suggested_load: ex.suggested_load,
      rest_seconds: ex.rest_seconds,
      notes: ex.notes,
      order_index: ex.order_index,
    }))

    const { error } = await supabase
      .from('workout_exercises')
      .insert(exercisesToInsert)

    if (error) throw new Error(error.message)
  }

  return newWorkout
}

// ─────────────────────────────────────────────
// Exercícios dentro de uma ficha
// ─────────────────────────────────────────────

/** Adiciona um exercício a uma ficha */
export async function addExerciseToWorkout(
  workoutId: string,
  dto: AddExerciseDTO
): Promise<WorkoutExercise> {
  const { data, error } = await supabase
    .from('workout_exercises')
    .insert({
      workout_id: workoutId,
      exercise_id: dto.exercise_id,
      sets: dto.sets,
      reps: dto.reps,
      suggested_load: dto.suggested_load ?? null,
      rest_seconds: dto.rest_seconds,
      notes: dto.notes ?? null,
      order_index: dto.order_index,
    })
    .select('*, exercise:exercise_library(*)')
    .single()

  if (error) throw new Error(error.message)
  return data as WorkoutExercise
}

/** Atualiza configuração de um exercício na ficha */
export async function updateWorkoutExercise(
  id: string,
  updates: Partial<Pick<WorkoutExercise, 'sets' | 'reps' | 'suggested_load' | 'rest_seconds' | 'notes' | 'order_index'>>
): Promise<void> {
  const { error } = await supabase
    .from('workout_exercises')
    .update(updates)
    .eq('id', id)

  if (error) throw new Error(error.message)
}

/** Remove um exercício de uma ficha */
export async function removeExerciseFromWorkout(
  workoutExerciseId: string
): Promise<void> {
  const { error } = await supabase
    .from('workout_exercises')
    .delete()
    .eq('id', workoutExerciseId)

  if (error) throw new Error(error.message)
}

// ─────────────────────────────────────────────
// Catálogo de exercícios
// ─────────────────────────────────────────────

/** Busca exercícios do catálogo com filtros opcionais */
export async function getExercises(filters?: {
  muscleGroup?: string
  search?: string
}): Promise<Exercise[]> {
  let query = supabase
    .from('exercise_library')
    .select('*')
    .order('name', { ascending: true })

  if (filters?.muscleGroup) {
    query = query.eq('muscle_group', filters.muscleGroup)
  }

  if (filters?.search) {
    query = query.ilike('name', `%${filters.search}%`)
  }

  const { data, error } = await query
  if (error) throw new Error(error.message)
  return (data ?? []) as Exercise[]
}

/** Cria um novo exercício na biblioteca */
export async function createExercise(data: {
  name: string
  muscle_group: string
  description?: string
  createdBy: string
}): Promise<Exercise> {
  const { data: created, error } = await supabase
    .from('exercise_library')
    .insert({
      name: data.name.trim(),
      muscle_group: data.muscle_group,
      description: data.description?.trim() || null,
      created_by: data.createdBy,
    })
    .select()
    .single()

  if (error) throw new Error(error.message)
  return created as Exercise
}
