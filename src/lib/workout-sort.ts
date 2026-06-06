import type { WeekDay } from '../types'

// Ordem oficial dos dias: Segunda (0) → Domingo (6)
const WEEK_DAY_ORDER: WeekDay[] = [
  'monday', 'tuesday', 'wednesday', 'thursday', 'friday', 'saturday', 'sunday',
]

/**
 * Índice do primeiro dia da semana de uma ficha (Segunda=0 ... Domingo=6).
 * Fichas sem dia definido recebem 99, para irem para o fim da lista.
 */
function firstWeekdayIndex(week_days?: WeekDay[] | null): number {
  if (!week_days || week_days.length === 0) return 99
  return Math.min(
    ...week_days.map((d) => {
      const i = WEEK_DAY_ORDER.indexOf(d)
      return i === -1 ? 99 : i
    })
  )
}

/**
 * Ordena uma lista de fichas pelo dia da semana (Segunda → Domingo).
 * Fichas sem dia vão para o fim. Empates são desfeitos pelo nome,
 * deixando a ordem estável e previsível.
 */
export function sortWorkoutsByWeekday<T extends { week_days: WeekDay[]; name: string }>(
  workouts: T[]
): T[] {
  return [...workouts].sort((a, b) => {
    const diff = firstWeekdayIndex(a.week_days) - firstWeekdayIndex(b.week_days)
    if (diff !== 0) return diff
    return a.name.localeCompare(b.name, 'pt-BR')
  })
}
