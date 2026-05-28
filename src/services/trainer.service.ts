import { supabase } from '../lib/supabase'
import type { UserProfile } from '../types'

export async function getTrainers(): Promise<UserProfile[]> {
  const { data, error } = await supabase
    .from('profiles')
    .select('*')
    .eq('role', 'trainer')
    .eq('is_active', true)
    .order('full_name')
  if (error) throw error
  return data as UserProfile[]
}

export async function getTrainerStudents(trainerId: string): Promise<UserProfile[]> {
  const { data, error } = await supabase
    .from('profiles')
    .select('*')
    .eq('trainer_id', trainerId)
    .eq('is_active', true)
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
