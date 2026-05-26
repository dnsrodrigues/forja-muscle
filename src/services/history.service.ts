import { supabase } from '../lib/supabase'
import type { WorkoutLog, WorkoutLogDetail, Exercise, LoadPoint, WeekFrequency } from '../types'

// ─────────────────────────────────────────────
// Histórico de sessões
// ─────────────────────────────────────────────

/** Lista todas as sessões concluídas do aluno, da mais recente para a mais antiga */
export async function getWorkoutHistory(userId: string): Promise<WorkoutLog[]> {
  const { data, error } = await supabase
    .from('workout_logs')
    .select(`
      *,
      workout:workouts(id, name, week_days)
    `)
    .eq('user_id', userId)
    .not('finished_at', 'is', null)
    .order('started_at', { ascending: false })

  if (error) throw new Error(error.message)
  return (data ?? []) as WorkoutLog[]
}

/** Retorna detalhe completo de uma sessão: exercícios + séries registradas */
export async function getSessionDetail(logId: string): Promise<WorkoutLogDetail | null> {
  const { data, error } = await supabase
    .from('workout_logs')
    .select(`
      *,
      workout:workouts(id, name, week_days, description),
      exercise_logs(
        *,
        exercise:exercise_library(id, name, muscle_group, video_url)
      )
    `)
    .eq('id', logId)
    .single()

  if (error) {
    if (error.code === 'PGRST116') return null
    throw new Error(error.message)
  }

  // Ordena as séries por exercício e número de série
  if (data?.exercise_logs) {
    data.exercise_logs.sort((a: { exercise_id: string; set_number: number }, b: { exercise_id: string; set_number: number }) => {
      if (a.exercise_id !== b.exercise_id) return a.exercise_id.localeCompare(b.exercise_id)
      return a.set_number - b.set_number
    })
  }

  return data as WorkoutLogDetail
}

/** Lista exercícios únicos que o aluno já treinou (para o dropdown de progresso) */
export async function getExercisesTrainedByUser(userId: string): Promise<Exercise[]> {
  // Busca todos os exercise_logs do usuário via workout_logs
  const { data: logs, error: logsError } = await supabase
    .from('workout_logs')
    .select('id')
    .eq('user_id', userId)
    .not('finished_at', 'is', null)

  if (logsError) throw new Error(logsError.message)
  if (!logs || logs.length === 0) return []

  const logIds = logs.map((l: { id: string }) => l.id)

  const { data, error } = await supabase
    .from('exercise_logs')
    .select('exercise:exercise_library(id, name, muscle_group, video_url, description, created_at)')
    .in('workout_log_id', logIds)

  if (error) throw new Error(error.message)

  // Deduplica por exercise id
  const seen = new Set<string>()
  const exercises: Exercise[] = []
  for (const row of (data ?? [])) {
    const rawEx = (row as unknown as { exercise: Exercise | Exercise[] }).exercise
    const ex = Array.isArray(rawEx) ? rawEx[0] : rawEx
    if (ex && !seen.has(ex.id)) {
      seen.add(ex.id)
      exercises.push(ex)
    }
  }

  return exercises.sort((a, b) => a.name.localeCompare(b.name))
}

/**
 * Progressão de carga de um exercício ao longo do tempo.
 * Retorna carga máxima registrada por sessão (dia), ordenada por data.
 * Agregação feita em JavaScript (PostgREST não suporta GROUP BY).
 */
export async function getLoadProgression(userId: string, exerciseId: string): Promise<LoadPoint[]> {
  // 1. Busca IDs das sessões do usuário
  const { data: logs, error: logsError } = await supabase
    .from('workout_logs')
    .select('id, started_at')
    .eq('user_id', userId)
    .not('finished_at', 'is', null)
    .order('started_at', { ascending: true })

  if (logsError) throw new Error(logsError.message)
  if (!logs || logs.length === 0) return []

  const logMap = Object.fromEntries(
    (logs as { id: string; started_at: string }[]).map((l) => [l.id, l.started_at])
  )
  const logIds = Object.keys(logMap)

  // 2. Busca exercise_logs desse exercício nessas sessões
  const { data, error } = await supabase
    .from('exercise_logs')
    .select('workout_log_id, load_kg')
    .in('workout_log_id', logIds)
    .eq('exercise_id', exerciseId)

  if (error) throw new Error(error.message)

  // 3. Agrupa por data (dia), pega MAX load_kg
  const byDate: Record<string, number> = {}
  for (const row of (data ?? []) as { workout_log_id: string; load_kg: number }[]) {
    const startedAt = logMap[row.workout_log_id]
    if (!startedAt) continue
    const date = startedAt.substring(0, 10) // 'YYYY-MM-DD'
    byDate[date] = Math.max(byDate[date] ?? 0, row.load_kg ?? 0)
  }

  return Object.entries(byDate)
    .map(([date, maxLoad]) => ({ date, maxLoad }))
    .sort((a, b) => a.date.localeCompare(b.date))
}

/**
 * Frequência de treinos por semana nas últimas 8 semanas.
 * Agrupa em JavaScript. Semana começa na segunda-feira.
 */
export async function getWeeklyFrequency(userId: string): Promise<WeekFrequency[]> {
  // Últimas 8 semanas = 56 dias
  const since = new Date()
  since.setDate(since.getDate() - 56)

  const { data, error } = await supabase
    .from('workout_logs')
    .select('started_at')
    .eq('user_id', userId)
    .not('finished_at', 'is', null)
    .gte('started_at', since.toISOString())
    .order('started_at', { ascending: true })

  if (error) throw new Error(error.message)

  // Agrupa por semana (segunda-feira)
  const byWeek: Record<string, number> = {}

  for (const row of (data ?? []) as { started_at: string }[]) {
    const d = new Date(row.started_at)
    // Calcula a segunda-feira da semana
    const day = d.getDay() // 0 = dom, 1 = seg, ...
    const diff = (day === 0 ? -6 : 1 - day)
    const monday = new Date(d)
    monday.setDate(d.getDate() + diff)
    const weekKey = monday.toISOString().substring(0, 10)
    byWeek[weekKey] = (byWeek[weekKey] ?? 0) + 1
  }

  // Garante que todas as 8 semanas aparecem (mesmo as sem treino)
  const weeks: WeekFrequency[] = []
  for (let i = 7; i >= 0; i--) {
    const d = new Date()
    const day = d.getDay()
    const diff = (day === 0 ? -6 : 1 - day)
    d.setDate(d.getDate() + diff - i * 7)
    const weekKey = d.toISOString().substring(0, 10)
    weeks.push({ week: weekKey, count: byWeek[weekKey] ?? 0 })
  }

  return weeks
}

// ─────────────────────────────────────────────
// Pré-preenchimento de sessão
// ─────────────────────────────────────────────

export interface LastSetRecord {
  reps: number
  loadKg: number | null
}

/**
 * Para cada exercício + número de série, retorna os valores registrados
 * na sessão mais recente. Usado para pré-preencher os inputs durante o treino.
 *
 * Retorna: { [exerciseLibraryId]: { [setNumber]: { reps, loadKg } } }
 */
export async function getLastSetData(
  userId: string,
  exerciseIds: string[],
): Promise<Record<string, Record<number, LastSetRecord>>> {
  if (exerciseIds.length === 0) return {}

  // 1. Últimas 60 sessões concluídas do aluno (mais recentes primeiro)
  const { data: logs, error: logsErr } = await supabase
    .from('workout_logs')
    .select('id, started_at')
    .eq('user_id', userId)
    .not('finished_at', 'is', null)
    .order('started_at', { ascending: false })
    .limit(60)

  if (logsErr) throw new Error(logsErr.message)
  if (!logs || logs.length === 0) return {}

  const logIds = (logs as { id: string; started_at: string }[]).map(l => l.id)
  const logDateMap: Record<string, string> = Object.fromEntries(
    (logs as { id: string; started_at: string }[]).map(l => [l.id, l.started_at])
  )

  // 2. exercise_logs dessas sessões para os exercícios desta ficha
  const { data: sets, error: setsErr } = await supabase
    .from('exercise_logs')
    .select('exercise_id, set_number, reps_completed, load_kg, workout_log_id')
    .in('workout_log_id', logIds)
    .in('exercise_id', exerciseIds)

  if (setsErr) throw new Error(setsErr.message)
  if (!sets || sets.length === 0) return {}

  // 3. Para cada exercise_id + set_number, mantém apenas o mais recente
  type BestEntry = { reps: number; loadKg: number | null; date: string }
  const best: Record<string, Record<number, BestEntry>> = {}

  for (const row of sets as {
    exercise_id: string
    set_number: number
    reps_completed: number
    load_kg: number | null
    workout_log_id: string
  }[]) {
    const date = logDateMap[row.workout_log_id] ?? ''
    const existing = best[row.exercise_id]?.[row.set_number]
    if (!existing || date > existing.date) {
      if (!best[row.exercise_id]) best[row.exercise_id] = {}
      best[row.exercise_id][row.set_number] = {
        reps: row.reps_completed,
        loadKg: row.load_kg,
        date,
      }
    }
  }

  // 4. Remove o campo 'date' do resultado final
  const result: Record<string, Record<number, LastSetRecord>> = {}
  for (const [exId, setMap] of Object.entries(best)) {
    result[exId] = {}
    for (const [setNum, entry] of Object.entries(setMap)) {
      result[exId][Number(setNum)] = { reps: entry.reps, loadKg: entry.loadKg }
    }
  }

  return result
}
