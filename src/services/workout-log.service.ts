import { supabase } from '../lib/supabase'
import type { WorkoutDifficulty } from '../types'

// ─────────────────────────────────────────────
// Iniciar sessão de treino
// ─────────────────────────────────────────────

export interface ResumableSession {
  id: string
  startedAt: string
  resumed: boolean
}

/**
 * Retoma a sessão em andamento (finished_at IS NULL) deste aluno para esta
 * ficha, começada nas últimas 6 horas. Se não houver, cria uma nova.
 *
 * Isso torna o treino resistente a recarregamentos do iOS: ao reabrir a
 * tela no meio do treino, continua a mesma sessão em vez de zerar.
 */
export async function resumeOrStartWorkoutSession(
  workoutId: string,
  userId: string,
): Promise<ResumableSession> {
  const sixHoursAgo = new Date(Date.now() - 6 * 60 * 60 * 1000).toISOString()

  // 1. Procura uma sessão recente ainda não finalizada para esta ficha
  const { data: existing, error: findErr } = await supabase
    .from('workout_logs')
    .select('id, started_at')
    .eq('user_id', userId)
    .eq('workout_id', workoutId)
    .is('finished_at', null)
    .gte('started_at', sixHoursAgo)
    .order('started_at', { ascending: false })
    .limit(1)
    .maybeSingle()

  if (findErr) throw new Error(findErr.message)
  if (existing) {
    return {
      id: existing.id as string,
      startedAt: existing.started_at as string,
      resumed: true,
    }
  }

  // 2. Não há sessão em andamento → cria nova
  const startedAt = new Date().toISOString()
  const { data, error } = await supabase
    .from('workout_logs')
    .insert({ workout_id: workoutId, user_id: userId, started_at: startedAt })
    .select('id')
    .single()

  if (error) throw new Error(error.message)
  return { id: data.id as string, startedAt, resumed: false }
}

/**
 * Séries concluídas de uma sessão, agrupadas por exercise_id (id da
 * exercise_library) → lista de set_numbers distintos já registrados.
 * Usado para reconstruir o progresso ao retomar uma sessão.
 */
export async function getSessionProgress(
  workoutLogId: string,
): Promise<Record<string, number[]>> {
  const { data, error } = await supabase
    .from('exercise_logs')
    .select('exercise_id, set_number')
    .eq('workout_log_id', workoutLogId)
    .eq('completed', true)

  if (error) throw new Error(error.message)

  const result: Record<string, number[]> = {}
  for (const row of (data ?? []) as { exercise_id: string; set_number: number }[]) {
    const arr = result[row.exercise_id] ?? (result[row.exercise_id] = [])
    if (!arr.includes(row.set_number)) arr.push(row.set_number)
  }
  return result
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
