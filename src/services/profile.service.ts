import { supabase } from '../lib/supabase'
import type { UserProfile } from '../types'

// Campos que o próprio usuário pode editar no perfil
export type UpdateProfileData = Partial<
  Pick<
    UserProfile,
    'full_name' | 'weight' | 'height' | 'birth_date' | 'gender' | 'goal' | 'target_weight'
  >
>

// Busca o perfil completo de um usuário pelo ID
export async function getProfile(userId: string): Promise<UserProfile> {
  const { data, error } = await supabase
    .from('profiles')
    .select('*')
    .eq('id', userId)
    .single()

  if (error) throw error
  return data as UserProfile
}

// Atualiza os dados do perfil de um usuário
export async function updateProfile(
  userId: string,
  updates: UpdateProfileData
): Promise<UserProfile> {
  const { data, error } = await supabase
    .from('profiles')
    .update({ ...updates, updated_at: new Date().toISOString() })
    .eq('id', userId)
    .select()
    .single()

  if (error) throw error
  return data as UserProfile
}
