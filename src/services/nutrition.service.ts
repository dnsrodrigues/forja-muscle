import { supabase } from '../lib/supabase'
import type { NutritionLog, NewNutritionLog, DailyTotals } from '../types'

/**
 * Busca todos os logs ativos de um dia específico para um usuário.
 * @param userId  ID do usuário
 * @param date    Formato 'YYYY-MM-DD'
 */
export async function getNutritionLogs(
  userId: string,
  date: string,
): Promise<NutritionLog[]> {
  // Limites do dia no FUSO LOCAL do usuário (não em UTC).
  // 'date' chega como data local 'YYYY-MM-DD'. Montamos o início e o fim
  // do dia no relógio local e convertemos para ISO (UTC) para comparar com
  // logged_at, que é salvo em UTC. Sem isso, refeições da noite "vazavam"
  // para o dia seguinte (ex.: 22h no Brasil = 01h UTC do dia seguinte).
  const [y, m, d] = date.split('-').map(Number)
  const startOfDay = new Date(y, m - 1, d, 0, 0, 0, 0).toISOString()
  const endOfDay = new Date(y, m - 1, d, 23, 59, 59, 999).toISOString()

  const { data, error } = await supabase
    .from('nutrition_logs')
    .select('*')
    .eq('user_id', userId)
    .eq('is_active', true)
    .gte('logged_at', startOfDay)
    .lte('logged_at', endOfDay)
    .order('logged_at', { ascending: true })

  if (error) throw new Error(error.message)
  return (data ?? []) as NutritionLog[]
}

/** Insere um novo registro de refeição. */
export async function addNutritionLog(
  data: NewNutritionLog,
): Promise<NutritionLog> {
  const { data: created, error } = await supabase
    .from('nutrition_logs')
    .insert({
      user_id: data.user_id,
      meal_type: data.meal_type,
      description: data.description,
      calories: data.calories ?? null,
      protein_g: data.protein_g ?? null,
      carbs_g: data.carbs_g ?? null,
      fat_g: data.fat_g ?? null,
      ai_feedback: data.ai_feedback ?? null,
      logged_at: data.logged_at,
    })
    .select()
    .single()

  if (error) throw new Error(error.message)
  return created as NutritionLog
}

/** Soft delete: marca o log como inativo. */
export async function deactivateNutritionLog(logId: string): Promise<void> {
  const { error } = await supabase
    .from('nutrition_logs')
    .update({ is_active: false })
    .eq('id', logId)

  if (error) throw new Error(error.message)
}

/**
 * Calcula os totais de macros consumidos num dia.
 * Usa os logs já carregados para evitar uma query extra.
 */
export function computeDailyTotals(logs: NutritionLog[]): DailyTotals {
  return logs.reduce(
    (acc, log) => ({
      calories: acc.calories + (log.calories ?? 0),
      protein_g: acc.protein_g + (log.protein_g ?? 0),
      carbs_g: acc.carbs_g + (log.carbs_g ?? 0),
      fat_g: acc.fat_g + (log.fat_g ?? 0),
    }),
    { calories: 0, protein_g: 0, carbs_g: 0, fat_g: 0 },
  )
}
