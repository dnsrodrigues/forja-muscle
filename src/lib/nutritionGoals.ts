import type { UserProfile, DailyGoals } from '../types'

/**
 * Calcula as metas diárias de macronutrientes com base no perfil do usuário.
 * Usa a fórmula Harris-Benedict revisada × fator de atividade 1.55 (moderadamente ativo).
 * Retorna null se o perfil não tiver dados suficientes (peso, altura, nascimento, gênero).
 */
export function calculateDailyGoals(profile: UserProfile): DailyGoals | null {
  if (!profile.weight || !profile.height || !profile.birth_date || !profile.gender) {
    return null
  }

  const birthYear = new Date(profile.birth_date).getFullYear()
  const currentYear = new Date().getFullYear()
  const age = currentYear - birthYear

  const weight = profile.weight  // kg
  const height = profile.height  // cm

  // Metabolismo basal (Harris-Benedict revisada)
  let bmr: number
  if (profile.gender === 'male') {
    bmr = 88.362 + (13.397 * weight) + (4.799 * height) - (5.677 * age)
  } else {
    bmr = 447.593 + (9.247 * weight) + (3.098 * height) - (4.330 * age)
  }

  // TDEE: moderadamente ativo
  let tdee = bmr * 1.55

  // Ajuste pelo objetivo
  if (profile.target_weight && profile.target_weight < weight) {
    tdee -= 300  // déficit para perda de peso
  } else if (profile.target_weight && profile.target_weight > weight) {
    tdee += 300  // superávit para ganho de massa
  }

  const calories = Math.round(tdee)

  // Distribuição de macros para musculação
  const protein_g = Math.round(2 * weight)
  const protein_kcal = protein_g * 4
  const fat_kcal = calories * 0.25
  const fat_g = Math.round(fat_kcal / 9)
  const carbs_kcal = calories - protein_kcal - fat_kcal
  const carbs_g = Math.max(Math.round(carbs_kcal / 4), 0)

  return { calories, protein_g, carbs_g, fat_g }
}
