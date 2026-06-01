import { supabase } from '../lib/supabase'
import type { UserProfile } from '../types'

export async function getTrainers(): Promise<UserProfile[]> {
  const { data, error } = await supabase
    .from('profiles')
    .select('*')
    .eq('role', 'trainer')
    .order('full_name')
  if (error) throw error
  return data as UserProfile[]
}

export async function getTrainerStudents(trainerId: string): Promise<UserProfile[]> {
  const { data, error } = await supabase
    .from('profiles')
    .select('*')
    .eq('trainer_id', trainerId)
    .eq('role', 'user')
    .order('full_name')
  if (error) throw error
  return data as UserProfile[]
}

export async function getAllStudents(): Promise<UserProfile[]> {
  const { data, error } = await supabase
    .from('profiles')
    .select('*')
    .eq('role', 'user')
    .order('full_name')
  if (error) throw error
  return data as UserProfile[]
}

export async function assignStudentToTrainer(studentId: string, trainerId: string | null): Promise<void> {
  const { error } = await supabase
    .from('profiles')
    .update({ trainer_id: trainerId })
    .eq('id', studentId)
  if (error) throw error
}

export async function deactivateTrainer(trainerId: string): Promise<void> {
  const { error } = await supabase
    .from('profiles')
    .update({ is_active: false })
    .eq('id', trainerId)
  if (error) throw error
}

export async function activateProfile(profileId: string): Promise<void> {
  const { error } = await supabase
    .from('profiles')
    .update({ is_active: true })
    .eq('id', profileId)
  if (error) throw error
}

export async function deactivateStudent(studentId: string): Promise<void> {
  const { error } = await supabase
    .from('profiles')
    .update({ is_active: false })
    .eq('id', studentId)
  if (error) throw error
}

/**
 * Reseta a senha do aluno para a temporária padrão (123456) e força a troca
 * no próximo login. A operação ocorre na Edge Function manage-users (service role).
 */
export async function resetStudentPassword(studentId: string): Promise<void> {
  const { data, error } = await supabase.functions.invoke('manage-users', {
    body: { action: 'reset-password', userId: studentId },
  })
  if (error) {
    let msg = error.message
    try {
      const body = typeof data === 'object' && data !== null ? data as { error?: string } : await error.context?.json()
      if (body?.error) msg = body.error
    } catch { /* usa msg padrão */ }
    throw new Error(msg)
  }
}
