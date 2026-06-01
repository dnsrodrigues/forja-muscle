import { supabase } from '../lib/supabase'
import { getAllStudents, getTrainerStudents } from './trainer.service'
import type { AdminDashboardStats, AttentionStudent, UserProfile } from '../types'

interface DashboardCtx {
  isSuperAdmin: boolean
  trainerId: string
}

const ATTENTION_DAYS = 7

/**
 * Estatísticas do painel do personal.
 * - super_admin: considera todos os alunos
 * - trainer: considera apenas os seus alunos (trainer_id = ele)
 */
export async function getAdminDashboardStats(ctx: DashboardCtx): Promise<AdminDashboardStats> {
  // 1. Alunos (ativos + inativos)
  const students: UserProfile[] = ctx.isSuperAdmin
    ? await getAllStudents()
    : await getTrainerStudents(ctx.trainerId)

  const activeStudents = students.filter((s) => s.is_active)
  const activeIds = activeStudents.map((s) => s.id)

  if (activeIds.length === 0) {
    return {
      totalStudents: students.length,
      activeStudents: 0,
      sessionsThisWeek: 0,
      needAttention: [],
    }
  }

  // 2. Fichas ativas dos alunos (para saber quem está SEM ficha)
  const { data: workoutsData, error: workoutsError } = await supabase
    .from('workouts')
    .select('user_id')
    .in('user_id', activeIds)
    .eq('is_active', true)
    .eq('is_template', false)
  if (workoutsError) throw new Error(workoutsError.message)
  const studentsWithWorkout = new Set((workoutsData ?? []).map((w: { user_id: string }) => w.user_id))

  // 3. Sessões concluídas dos alunos (cabeçalho apenas — RLS já libera para o trainer)
  const { data: logsData, error: logsError } = await supabase
    .from('workout_logs')
    .select('user_id, started_at')
    .in('user_id', activeIds)
    .not('finished_at', 'is', null)
    .order('started_at', { ascending: false })
  if (logsError) throw new Error(logsError.message)

  // Último treino por aluno + contagem da semana
  const lastWorkoutByStudent: Record<string, string> = {}
  const weekAgo = new Date()
  weekAgo.setDate(weekAgo.getDate() - ATTENTION_DAYS)
  let sessionsThisWeek = 0

  for (const row of (logsData ?? []) as { user_id: string; started_at: string }[]) {
    if (!lastWorkoutByStudent[row.user_id]) {
      lastWorkoutByStudent[row.user_id] = row.started_at
    }
    if (new Date(row.started_at) >= weekAgo) sessionsThisWeek++
  }

  // 4. Monta lista "precisam de atenção"
  const now = Date.now()
  const needAttention: AttentionStudent[] = []
  for (const s of activeStudents) {
    if (!studentsWithWorkout.has(s.id)) {
      needAttention.push({ id: s.id, full_name: s.full_name, reason: 'sem-ficha', daysSinceLastWorkout: null })
      continue
    }
    const last = lastWorkoutByStudent[s.id]
    if (!last) {
      needAttention.push({ id: s.id, full_name: s.full_name, reason: 'parado', daysSinceLastWorkout: null })
      continue
    }
    const days = Math.floor((now - new Date(last).getTime()) / 86400000)
    if (days >= ATTENTION_DAYS) {
      needAttention.push({ id: s.id, full_name: s.full_name, reason: 'parado', daysSinceLastWorkout: days })
    }
  }

  return {
    totalStudents: students.length,
    activeStudents: activeStudents.length,
    sessionsThisWeek,
    needAttention,
  }
}
