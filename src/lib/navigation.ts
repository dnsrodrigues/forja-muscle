import type { IconName } from '../components/ui/Icon'

export interface NavDest {
  to: string
  label: string
  icon: IconName
  /** Aparece na barra inferior do mobile (máx. 4). Caso contrário, vai pro "Mais". */
  primary?: boolean
  matches?: (path: string) => boolean
}

export interface NavContext {
  isManager: boolean
  isSuperAdmin: boolean
  /** true quando manager está em modo "treino" (usa navegação de aluno). */
  inTrainingMode: boolean
}

const ALUNO: NavDest[] = [
  { to: '/dashboard', label: 'Hoje', icon: 'home', primary: true },
  { to: '/workouts', label: 'Treino', icon: 'flame', primary: true, matches: (p) => p.startsWith('/workouts') },
  { to: '/historico', label: 'Histórico', icon: 'history', primary: true, matches: (p) => p.startsWith('/historico') },
  { to: '/nutricao', label: 'Nutrição', icon: 'flash', primary: true, matches: (p) => p.startsWith('/nutricao') },
  { to: '/progresso', label: 'Progresso', icon: 'chart' },
  { to: '/medidas', label: 'Medidas', icon: 'scale' },
  { to: '/perfil', label: 'Perfil', icon: 'user' },
]

/**
 * Destinos da tabbar mobile para o aluno.
 * 4 itens (o FAB central é tratado no componente, não aqui).
 */
const ALUNO_MOBILE: NavDest[] = [
  { to: '/dashboard',   label: 'Hoje',       icon: 'home',     primary: true },
  { to: '/semana',      label: 'Semana',     icon: 'calendar', primary: true },
  { to: '/exercicios',  label: 'Exercícios', icon: 'dumbbell', primary: true },
  { to: '/perfil',      label: 'Perfil',     icon: 'user',     primary: true },
]

function gestao(isSuperAdmin: boolean): NavDest[] {
  const list: NavDest[] = [
    { to: '/dashboard', label: 'Hoje', icon: 'home', primary: true },
    { to: '/admin/workouts', label: 'Fichas', icon: 'edit', primary: true, matches: (p) => p.startsWith('/admin/workouts') },
    { to: '/admin/students', label: 'Alunos', icon: 'user', primary: true, matches: (p) => p.startsWith('/admin/students') },
  ]
  if (isSuperAdmin) {
    list.push({ to: '/admin/trainers', label: 'Trainers', icon: 'trophy', primary: true, matches: (p) => p.startsWith('/admin/trainers') })
  }
  list.push({ to: '/admin/exercises', label: 'Exercícios', icon: 'dumbbell', matches: (p) => p.startsWith('/admin/exercises') })
  list.push({ to: '/perfil', label: 'Perfil', icon: 'user' })
  return list
}

/** Lista ordenada de destinos de navegação para o contexto atual. */
export function navDestinations(ctx: NavContext): NavDest[] {
  if (!ctx.isManager || ctx.inTrainingMode) return ALUNO
  return gestao(ctx.isSuperAdmin)
}

/**
 * Destinos da tabbar para o mobile.
 * Para admin/manager em modo gestão: usa o mesmo que navDestinations().
 * Para aluno (ou manager em modo treino): retorna ALUNO_MOBILE (4 tabs + FAB).
 */
export function mobileNavDestinations(ctx: NavContext): NavDest[] {
  if (!ctx.isManager || ctx.inTrainingMode) return ALUNO_MOBILE
  return gestao(ctx.isSuperAdmin)
}

/** Diz se um destino está ativo dado o pathname atual. */
export function isNavActive(dest: NavDest, pathname: string): boolean {
  return dest.matches ? dest.matches(pathname) : pathname === dest.to
}
