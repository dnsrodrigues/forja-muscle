import { supabase } from '../lib/supabase'
import type { UserProfile } from '../types'

// Campos que o próprio usuário pode editar no perfil
export type UpdateProfileData = Partial<
  Pick<
    UserProfile,
    'full_name' | 'weight' | 'height' | 'birth_date' | 'gender' | 'goal' | 'target_weight' | 'avatar_url'
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

// Faz upload da foto de perfil para o Storage e atualiza avatar_url no banco
export async function uploadAvatar(userId: string, blob: Blob): Promise<string> {
  const path = `${userId}/avatar.jpg`

  const { error: uploadError } = await supabase.storage
    .from('avatars')
    .upload(path, blob, { upsert: true, contentType: 'image/jpeg' })

  if (uploadError) throw uploadError

  const { data } = supabase.storage.from('avatars').getPublicUrl(path)
  // O timestamp evita que o navegador mostre a foto antiga do cache
  const url = `${data.publicUrl}?t=${Date.now()}`

  await updateProfile(userId, { avatar_url: url })
  return url
}

// Atualiza os dados do perfil de um usuário
export async function updateProfile(
  userId: string,
  updates: UpdateProfileData
): Promise<UserProfile> {
  const { data, error } = await supabase
    .from('profiles')
    .update(updates) // updated_at é atualizado automaticamente pelo trigger do banco
    .eq('id', userId)
    .select()
    .single()

  if (error) throw error
  return data as UserProfile
}
