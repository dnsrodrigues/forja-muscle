import { supabase } from '../lib/supabase'
import type { WorkoutDifficulty } from '../types'

// ─────────────────────────────────────────────
// Iniciar sessão de treino
// ─────────────────────────────────────────────

/**
 * Cria um registro em workout_logs para a sessão que está começando.
 * Retorna o ID da linha criada — usado em todas as chamadas seguintes.
 */
export async function startWorkoutSession(
  workoutId: string,
  userId: string
): Promise<string> {
  const { data, error } = await supabase
    .from('workout_logs')
    .insert({
      workout_id: workoutId,
      user_id: userId,
      started_at: new Date().toISOString(),
    })
    .select('id')
    .single()

  if (error) throw new Error(error.message)
  return data.id as string
}

// ─────────────────────────────────────────────
// Registrar uma série
// ─────────────────────────────────────────────

/**
 * Salva uma série realizada em exercise_logs imediatamente.
 * Chamado ao tocar "✓ Feita" — dados nunca se perdem se o app fechar.
 * Erros são propagados para o chamador tratar.
 */
export async function logExerciseSet(
  workoutLogId: string,
  exerciseId: string,
  data: {
    setNumber: number
    repsCompleted: number
    loadKg: number | null
  }
): Promise<void> {
  const { error } = await supabase
    .from('exercise_logs')
    .insert({
      workout_log_id: workoutLogId,
      exercise_id: exerciseId,
      set_number: data.setNumber,
      reps_completed: data.repsCompleted,
      load_kg: data.loadKg ?? 0,
      completed: true,
    })

  if (error) throw new Error(error.message)
}

// ─────────────────────────────────────────────
// Finalizar sessão
// ─────────────────────────────────────────────

/**
 * Atualiza o workout_log com os dados de conclusão.
 * Chamado ao confirmar no modal de finalização.
 */
export async function finishWorkoutSession(
  workoutLogId: string,
  data: {
    difficulty: WorkoutDifficulty
    notes: string
    durationMinutes: number
  }
): Promise<void> {
  const { error } = await supabase
    .from('workout_logs')
    .update({
      finished_at: new Date().toISOString(),
      difficulty: data.difficulty,
      notes: data.notes || null,
      duration_minutes: Math.round(data.durationMinutes),
    })
    .eq('id', workoutLogId)

  if (error) throw new Error(error.message)
}

// ─────────────────────────────────────────────
// Descartar sessão
// ─────────────────────────────────────────────

/**
 * Apaga fisicamente o workout_log e todos os exercise_logs associados.
 * Exceção explícita à regra de soft delete — o aluno pediu para descartar.
 */
export async function deleteWorkoutSession(workoutLogId: string): Promise<void> {
  // Apaga exercise_logs primeiro (chave estrangeira)
  const { error: logsError } = await supabase
    .from('exercise_logs')
    .delete()
    .eq('workout_log_id', workoutLogId)

  if (logsError) throw new Error(logsError.message)

  // Apaga o workout_log
  const { error: logError } = await supabase
    .from('workout_logs')
    .delete()
    .eq('id', workoutLogId)

  if (logError) throw new Error(logError.message)
}

// ─────────────────────────────────────────────
// Atualizar série já registrada
// ─────────────────────────────────────────────

/**
 * Atualiza reps e carga de uma série já registrada.
 * Identificada por workout_log_id + exercise_id + set_number (único por sessão).
 */
export async function updateExerciseSet(
  workoutLogId: string,
  exerciseId: string,
  setNumber: number,
  data: { repsCompleted: number; loadKg: number | null }
): Promise<void> {
  const { error } = await supabase
    .from('exercise_logs')
    .update({
      reps_completed: data.repsCompleted,
      load_kg: data.loadKg ?? 0,
    })
    .eq('workout_log_id', workoutLogId)
    .eq('exercise_id', exerciseId)
    .eq('set_number', setNumber)

  if (error) throw new Error(error.message)
}

// ─────────────────────────────────────────────
// Atualizar sessão no histórico
// ─────────────────────────────────────────────

/**
 * Atualiza duração, dificuldade e notas de uma sessão finalizada.
 * Usado pelo modo de edição em SessionDetailPage.
 */
export async function updateWorkoutLog(
  logId: string,
  data: { durationMinutes: number; difficulty: string; notes: string }
): Promise<void> {
  const { error } = await supabase
    .from('workout_logs')
    .update({
      duration_minutes: Math.round(data.durationMinutes),
      difficulty: data.difficulty || null,
      notes: data.notes || null,
    })
    .eq('id', logId)

  if (error) throw new Error(error.message)
}

/**
 * Atualiza reps e carga de uma série no histórico, pelo ID da linha.
 * Os IDs são carregados com a sessão em SessionDetailPage.
 */
export async function updateExerciseLog(
  logId: string,
  data: { repsCompleted: number; loadKg: number | null }
): Promise<void> {
  const { error } = await supabase
    .from('exercise_logs')
    .update({
      reps_completed: data.repsCompleted,
      load_kg: data.loadKg ?? 0,
    })
    .eq('id', logId)

  if (error) throw new Error(error.message)
}
