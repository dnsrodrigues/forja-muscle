import { supabase } from '../lib/supabase'

export interface MealAnalysis {
  calories: number
  protein_g: number
  carbs_g: number
  fat_g: number
  feedback: string
}

/**
 * Chama a Edge Function 'analyze-meal' que usa o Gemini para
 * estimar macros e gerar feedback nutricional da refeição.
 */
export async function analyzeMeal(
  mealType: string,
  description: string,
): Promise<MealAnalysis> {
  const { data, error } = await supabase.functions.invoke('analyze-meal', {
    body: { meal_type: mealType, description },
  })

  if (error) throw new Error(error.message)

  const result = data as MealAnalysis & { success?: boolean; error?: string }
  if (result.error) throw new Error(result.error)

  return {
    calories: result.calories ?? 0,
    protein_g: result.protein_g ?? 0,
    carbs_g: result.carbs_g ?? 0,
    fat_g: result.fat_g ?? 0,
    feedback: result.feedback ?? '',
  }
}
