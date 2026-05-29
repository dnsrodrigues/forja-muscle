/**
 * Mapeamento de imagens por grupo muscular.
 * As imagens ficam no bucket público "muscles" do Supabase Storage.
 * Nomes esperados: chest.jpg, back.jpg, legs.jpg, etc.
 */
import type { MuscleGroup } from '../types'

const BASE = `${import.meta.env.VITE_SUPABASE_URL}/storage/v1/object/public/muscles`

export const MUSCLE_GROUP_IMAGES: Record<MuscleGroup, string> = {
  chest:     `${BASE}/chest.jpg`,
  back:      `${BASE}/back.jpg`,
  legs:      `${BASE}/legs.jpg`,
  shoulders: `${BASE}/shoulders.jpg`,
  biceps:    `${BASE}/biceps.jpg`,
  triceps:   `${BASE}/triceps.jpg`,
  abs:       `${BASE}/abs.jpg`,
  forearms:  `${BASE}/forearms.jpg`,
  trapezius: `${BASE}/trapezius.jpg`,
  glutes:    `${BASE}/glutes.jpg`,
  calves:    `${BASE}/calves.jpg`,
}
