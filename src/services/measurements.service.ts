import { supabase } from '../lib/supabase'
import type { UserWeight, BodyMeasurement } from '../types'

// ─────────────────────────────────────────────
// Peso corporal
// ─────────────────────────────────────────────

/** Histórico completo de peso do aluno, do mais recente para o mais antigo */
export async function getUserWeights(userId: string): Promise<UserWeight[]> {
  const { data, error } = await supabase
    .from('user_weights')
    .select('*')
    .eq('user_id', userId)
    .order('measured_at', { ascending: false })

  if (error) throw new Error(error.message)
  return (data ?? []) as UserWeight[]
}

/** Registra um novo peso */
export async function addUserWeight(
  userId: string,
  weightKg: number,
  measuredAt: string, // ISO string
  notes?: string
): Promise<UserWeight> {
  const { data, error } = await supabase
    .from('user_weights')
    .insert({
      user_id: userId,
      weight_kg: weightKg,
      measured_at: measuredAt,
      notes: notes ?? null,
    })
    .select()
    .single()

  if (error) throw new Error(error.message)
  return data as UserWeight
}

// ─────────────────────────────────────────────
// Medidas corporais
// ─────────────────────────────────────────────

/** Últimos 10 registros de medidas do aluno */
export async function getBodyMeasurements(userId: string): Promise<BodyMeasurement[]> {
  const { data, error } = await supabase
    .from('body_measurements')
    .select('*')
    .eq('user_id', userId)
    .order('measured_at', { ascending: false })
    .limit(10)

  if (error) throw new Error(error.message)
  return (data ?? []) as BodyMeasurement[]
}

/** Registra um novo conjunto de medidas corporais */
export async function addBodyMeasurement(
  userId: string,
  measurementData: Partial<Omit<BodyMeasurement, 'id' | 'user_id' | 'created_at'>>
): Promise<BodyMeasurement> {
  const { data, error } = await supabase
    .from('body_measurements')
    .insert({
      user_id: userId,
      measured_at: measurementData.measured_at ?? new Date().toISOString(),
      waist_cm: measurementData.waist_cm ?? null,
      hip_cm: measurementData.hip_cm ?? null,
      abdomen_cm: measurementData.abdomen_cm ?? null,
      thigh_cm: measurementData.thigh_cm ?? null,
      arm_cm: measurementData.arm_cm ?? null,
      chest_cm: measurementData.chest_cm ?? null,
      calf_cm: measurementData.calf_cm ?? null,
      notes: measurementData.notes ?? null,
    })
    .select()
    .single()

  if (error) throw new Error(error.message)
  return data as BodyMeasurement
}
