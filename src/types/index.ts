// ============================================================
// MUSCLE TRAINING — Tipos globais do sistema
// ============================================================

// --- Usuário ---

export type UserRole = 'super_admin' | 'trainer' | 'user'

export interface UserProfile {
  id: string
  email: string
  full_name: string
  role: UserRole
  trainer_id: string | null
  avatar_url?: string
  weight?: number         // peso atual em kg
  height?: number         // altura em cm
  birth_date?: string
  gender?: 'male' | 'female' | 'other'
  goal?: string
  target_weight?: number  // peso alvo em kg
  is_active: boolean
  created_at: string
  updated_at: string
}

// --- Exercício ---

export type MuscleGroup =
  | 'chest'       // Peito
  | 'back'        // Costas
  | 'legs'        // Pernas
  | 'shoulders'   // Ombros
  | 'biceps'      // Bíceps
  | 'triceps'     // Tríceps
  | 'abs'         // Abdômen
  | 'forearms'    // Antebraço
  | 'trapezius'   // Trapézio
  | 'glutes'      // Glúteos
  | 'calves'      // Panturrilha

export const MUSCLE_GROUP_LABELS: Record<MuscleGroup, string> = {
  chest: 'Peito',
  back: 'Costas',
  legs: 'Pernas',
  shoulders: 'Ombros',
  biceps: 'Bíceps',
  triceps: 'Tríceps',
  abs: 'Abdômen',
  forearms: 'Antebraço',
  trapezius: 'Trapézio',
  glutes: 'Glúteos',
  calves: 'Panturrilha',
}

export interface Exercise {
  id: string
  name: string
  muscle_group: MuscleGroup
  description?: string
  video_url?: string
  image_url?: string
  created_by?: string
  created_at: string
}

// --- Ficha de Treino ---

export type WeekDay =
  | 'monday'
  | 'tuesday'
  | 'wednesday'
  | 'thursday'
  | 'friday'
  | 'saturday'
  | 'sunday'

export const WEEK_DAY_LABELS: Record<WeekDay, string> = {
  monday: 'Segunda',
  tuesday: 'Terça',
  wednesday: 'Quarta',
  thursday: 'Quinta',
  friday: 'Sexta',
  saturday: 'Sábado',
  sunday: 'Domingo',
}

export const WEEK_DAY_SHORT: Record<WeekDay, string> = {
  monday: 'Seg',
  tuesday: 'Ter',
  wednesday: 'Qua',
  thursday: 'Qui',
  friday: 'Sex',
  saturday: 'Sáb',
  sunday: 'Dom',
}

export interface Workout {
  id: string
  name: string
  description?: string
  user_id: string
  created_by: string
  week_days: WeekDay[]
  is_template: boolean    // ficha na biblioteca do admin (reutilizável)
  template_id?: string    // se criada a partir de um template
  is_active: boolean
  created_at: string
  updated_at: string
  exercises?: WorkoutExercise[]
}

export interface WorkoutExercise {
  id: string
  workout_id: string
  exercise_id: string
  exercise?: Exercise
  sets: number            // número de séries
  reps: string            // ex: "12" ou "8-12"
  suggested_load?: number // carga sugerida em kg
  rest_seconds: number    // tempo de descanso em segundos
  notes?: string
  order_index: number     // posição na lista
}

// --- DTOs para Fichas ---

export interface CreateWorkoutDTO {
  name: string
  description?: string
  user_id: string
  week_days: WeekDay[]
  is_template: boolean
  template_id?: string
}

export interface UpdateWorkoutDTO {
  name?: string
  description?: string
  week_days?: WeekDay[]
  is_template?: boolean
}

export interface AddExerciseDTO {
  exercise_id: string
  sets: number
  reps: string
  suggested_load?: number
  rest_seconds: number
  notes?: string
  order_index: number
}

// --- Histórico e Progressão (Fase 7) ---

export interface WorkoutLogDetail extends WorkoutLog {
  workout?: Workout
  exercise_logs: ExerciseLogDetail[]
}

export interface ExerciseLogDetail extends ExerciseLog {
  exercise: Exercise
}

export interface LoadPoint {
  date: string      // 'YYYY-MM-DD'
  maxLoad: number   // kg máximo naquela sessão
}

export interface WeekFrequency {
  week: string      // 'YYYY-MM-DD' (segunda-feira da semana)
  count: number
}

// --- Admin — Ficha com dados do aluno ---

export interface StudentSummary {
  id: string
  full_name: string
  email: string
}

export interface WorkoutWithStudent extends Workout {
  student?: StudentSummary
}

// --- Sessão de Treino ---

export type WorkoutDifficulty = 'easy' | 'medium' | 'hard' | 'terrible'

export const DIFFICULTY_LABELS: Record<WorkoutDifficulty, string> = {
  easy: '😊 Fácil',
  medium: '💪 Médio',
  hard: '🔥 Difícil',
  terrible: '💀 Destruidor',
}

export interface WorkoutLog {
  id: string
  user_id: string
  workout_id: string
  workout?: Workout
  started_at: string
  finished_at?: string
  duration_minutes?: number
  difficulty?: WorkoutDifficulty
  notes?: string
  exercise_logs?: ExerciseLog[]
}

export interface ExerciseLog {
  id: string
  workout_log_id: string
  exercise_id: string
  exercise?: Exercise
  set_number: number
  reps_completed: number
  load_kg: number
  completed: boolean
  notes?: string
}

// --- Peso e Medidas ---

export interface UserWeight {
  id: string
  user_id: string
  weight_kg: number
  measured_at: string
  notes?: string
}

export interface BodyMeasurement {
  id: string
  user_id: string
  measured_at: string
  waist_cm?: number    // cintura
  hip_cm?: number      // quadril
  abdomen_cm?: number  // abdômen
  thigh_cm?: number    // coxa
  arm_cm?: number      // braço
  chest_cm?: number    // peitoral
  calf_cm?: number     // panturrilha
  notes?: string
}

// --- Nutrição ---

export type MealType =
  | 'breakfast'    // Café da manhã
  | 'lunch'        // Almoço
  | 'snack'        // Lanche
  | 'dinner'       // Jantar
  | 'pre_workout'  // Pré-treino
  | 'post_workout' // Pós-treino

export const MEAL_TYPE_LABELS: Record<MealType, string> = {
  breakfast: '🌅 Café da Manhã',
  lunch: '☀️ Almoço',
  snack: '🍎 Lanche',
  dinner: '🌙 Jantar',
  pre_workout: '⚡ Pré-Treino',
  post_workout: '🥤 Pós-Treino',
}

export interface NutritionLog {
  id: string
  user_id: string
  meal_type: MealType
  description: string
  calories?: number
  protein_g?: number
  carbs_g?: number
  fat_g?: number
  ai_feedback?: string
  logged_at: string
}
