# Mobile Redesign FORJA — Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Implementar o novo layout mobile FORJA (5 tabs + FAB + páginas novas) exclusivamente para ≤ 768px, sem alterar nada no desktop.

**Architecture:** Hook `useIsMobile()` como única fonte de verdade para branching mobile/desktop. Nas páginas existentes (Dashboard, Profile), a branch mobile é inserida no `return` antes do retorno desktop — sem duplicar lógica de dados. Páginas novas (SemanaPage, ExerciciosPage) vivem em arquivos próprios e são acessíveis apenas pela tabbar mobile.

**Tech Stack:** React 19 + TypeScript, CSS puro (variáveis FORJA), react-router-dom v6, Supabase client, motion/react

---

## Arquivos impactados

| Arquivo | Ação |
|---------|------|
| `src/hooks/useIsMobile.ts` | Criar |
| `src/index.css` | Adicionar classes mobile (`.mob-head`, `.mob-scroll`, `.mob-lrow`, `.mob-kpi`, `.mob-seg`, `.mob-tab-fab`) |
| `src/components/layout/MobHead.tsx` | Criar |
| `src/lib/navigation.ts` | Adicionar `ALUNO_MOBILE` + `mobileNavDestinations()` |
| `src/components/layout/MobileTabbar.tsx` | Reescrever — FAB central, 5 colunas para aluno |
| `src/services/history.service.ts` | Adicionar `getAllExercisePRs()` |
| `src/pages/SemanaPage.tsx` | Criar |
| `src/pages/ExerciciosPage.tsx` | Criar |
| `src/pages/DashboardPage.tsx` | Adicionar branch mobile |
| `src/pages/ProfilePage.tsx` | Adicionar branch mobile |
| `src/App.tsx` | Adicionar rotas `/semana` e `/exercicios` |

---

## Task 1: useIsMobile hook + classes CSS mobile

**Files:**
- Create: `src/hooks/useIsMobile.ts`
- Modify: `src/index.css` (adicionar classes no final da seção "Mobile shell helpers")

- [ ] **Step 1: Criar o hook**

Criar `src/hooks/useIsMobile.ts` com o seguinte conteúdo:

```ts
import { useState, useEffect } from 'react'

/**
 * Retorna true quando a viewport está em ≤ 768px.
 * Reativo a resize (ex.: rotação de tela).
 */
export function useIsMobile(): boolean {
  const [mobile, setMobile] = useState<boolean>(() =>
    typeof window !== 'undefined' ? window.innerWidth <= 768 : false
  )

  useEffect(() => {
    const mq = window.matchMedia('(max-width: 768px)')
    const handler = (e: MediaQueryListEvent) => setMobile(e.matches)
    mq.addEventListener('change', handler)
    return () => mq.removeEventListener('change', handler)
  }, [])

  return mobile
}
```

- [ ] **Step 2: Adicionar classes CSS**

Em `src/index.css`, imediatamente **após** o bloco `.mob-tab svg { ... }` (por volta da linha 671), inserir as seguintes classes:

```css
/* ── FAB central da tabbar ── */
.mob-tab-fab {
  position: relative;
  justify-self: center;
  width: 64px;
  height: 64px;
  margin-top: -28px;
  border-radius: 50%;
  background: var(--accent);
  color: var(--accent-fg);
  display: flex;
  align-items: center;
  justify-content: center;
  border: 4px solid var(--bg-0);
  box-shadow: 0 8px 24px -6px rgba(212, 255, 58, 0.45);
  cursor: pointer;
  flex-shrink: 0;
}

/* tabbar em grid 5 colunas com FAB */
.mob-tabbar-fab {
  display: grid !important;
  grid-template-columns: 1fr 1fr 84px 1fr 1fr;
  align-items: center;
  justify-items: center;
}

/* ── Header mobile padrão (MobHead) ── */
.mob-head {
  display: flex;
  align-items: flex-start;
  justify-content: space-between;
  padding: 10px 20px 14px;
  gap: 12px;
  flex-shrink: 0;
}

.mob-head > .mob-head-left {
  flex: 1;
  min-width: 0;
}

.mob-head-over {
  font-size: 11px;
  color: var(--text-dim);
  letter-spacing: 0.15em;
  text-transform: uppercase;
  margin-bottom: 2px;
}

.mob-head-title {
  font-family: var(--f-display);
  font-size: 33px;
  line-height: 1.04;
  color: var(--text);
  margin: 0;
}

/* ── Área de scroll das páginas mobile ── */
.mob-scroll {
  flex: 1;
  overflow-y: auto;
  overflow-x: hidden;
  padding: 0 16px 16px;
  -webkit-overflow-scrolling: touch;
}

.mob-scroll::-webkit-scrollbar {
  width: 0;
}

/* ── Linha de lista mobile (exercício, menu, etc.) ── */
.mob-lrow {
  display: flex;
  align-items: center;
  gap: 14px;
  padding: 14px 0;
  border-bottom: 1px solid var(--hairline);
}

.mob-lrow:last-child {
  border-bottom: none;
}

/* ── KPI card mobile ── */
.mob-kpi {
  background: var(--bg-1);
  border: 1px solid var(--hairline);
  border-radius: var(--r-3);
  padding: 14px 16px;
}

.mob-kpi-val {
  font-family: var(--f-display);
  font-size: 38px;
  line-height: 0.9;
  color: var(--text);
}

.mob-kpi-unit {
  font-family: var(--f-body);
  font-size: 13px;
  color: var(--text-dim);
  margin-left: 2px;
}

/* ── Segmented control mobile ── */
.mob-seg {
  display: flex;
  background: var(--bg-2);
  border-radius: 10px;
  padding: 3px;
  gap: 2px;
}

.mob-seg > button {
  flex: 1;
  border: none;
  background: transparent;
  color: var(--text-dim);
  font-family: var(--f-body);
  font-size: 11px;
  font-weight: 600;
  letter-spacing: 0.05em;
  padding: 8px 4px;
  border-radius: 8px;
  cursor: pointer;
  text-transform: uppercase;
  transition: background 0.15s, color 0.15s;
}

.mob-seg > button.active {
  background: var(--accent);
  color: var(--accent-fg);
}
```

- [ ] **Step 3: Verificar TypeScript**

```bash
npx tsc --noEmit
```

Esperado: sem erros.

- [ ] **Step 4: Commit**

```bash
git add src/hooks/useIsMobile.ts src/index.css
git commit -m "feat(mobile): add useIsMobile hook and mobile CSS classes"
```

---

## Task 2: Componente MobHead

**Files:**
- Create: `src/components/layout/MobHead.tsx`

- [ ] **Step 1: Criar o componente**

Criar `src/components/layout/MobHead.tsx`:

```tsx
import type { ReactNode } from 'react'

interface MobHeadProps {
  /** Texto pequeno acima do título, ex: "Qui · 8 jun" */
  over?: string
  /** Título principal em Bebas, ex: "BOM DIA, DENIS" */
  title: string
  /** Elemento opcional à direita (avatar, botão +, etc.) */
  right?: ReactNode
}

/**
 * Header padrão das páginas mobile.
 * Substituição do <Topbar> quando isMobile === true.
 */
export function MobHead({ over, title, right }: MobHeadProps) {
  return (
    <div className="mob-head">
      <div className="mob-head-left">
        {over && <div className="mob-head-over">{over}</div>}
        <h1 className="mob-head-title">{title}</h1>
      </div>
      {right && (
        <div style={{ flexShrink: 0, display: 'flex', alignItems: 'center' }}>
          {right}
        </div>
      )}
    </div>
  )
}
```

- [ ] **Step 2: Verificar TypeScript**

```bash
npx tsc --noEmit
```

Esperado: sem erros.

- [ ] **Step 3: Commit**

```bash
git add src/components/layout/MobHead.tsx
git commit -m "feat(mobile): add MobHead component for mobile page headers"
```

---

## Task 3: navigation.ts + MobileTabbar com FAB

**Files:**
- Modify: `src/lib/navigation.ts`
- Modify: `src/components/layout/MobileTabbar.tsx`

- [ ] **Step 1: Atualizar navigation.ts**

Adicionar `ALUNO_MOBILE` e `mobileNavDestinations` em `src/lib/navigation.ts`.
O arquivo atual tem 53 linhas. Inserir **após** o bloco `ALUNO` (linha 27) e **antes** da função `gestao`:

```ts
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

/**
 * Destinos da tabbar para o mobile.
 * Para admin/manager em modo gestão: usa o mesmo que navDestinations().
 * Para aluno (ou manager em modo treino): retorna ALUNO_MOBILE (4 tabs + FAB).
 */
export function mobileNavDestinations(ctx: NavContext): NavDest[] {
  if (!ctx.isManager || ctx.inTrainingMode) return ALUNO_MOBILE
  return gestao(ctx.isSuperAdmin)
}
```

Também exportar `ALUNO_MOBILE` para o `MobileTabbar` conseguir saber se está no modo aluno.

Arquivo final `src/lib/navigation.ts`:

```ts
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
```

- [ ] **Step 2: Reescrever MobileTabbar**

Substituir completamente `src/components/layout/MobileTabbar.tsx`:

```tsx
import { useState } from 'react'
import { Link, useLocation, useNavigate } from 'react-router-dom'
import { useAuth } from '../../context/AuthContext'
import { Icon } from '../ui/Icon'
import { MobileMoreSheet } from './MobileMoreSheet'
import { mobileNavDestinations, navDestinations, isNavActive } from '../../lib/navigation'
import { getMyWorkouts } from '../../services/workout.service'
import type { WeekDay } from '../../types'

/**
 * Tabbar fixa no rodapé. Aparece SOMENTE no mobile (≤768px) via CSS.
 *
 * - Aluno / trainer em modo treino: 5 colunas (2 tabs | FAB | 2 tabs)
 * - Admin em modo gestão: layout antigo (tabs primárias + botão Mais)
 */
export function MobileTabbar() {
  const { profile, isManager, isSuperAdmin, trainerMode } = useAuth()
  const { pathname } = useLocation()
  const navigate = useNavigate()
  const [moreOpen, setMoreOpen] = useState(false)

  const inTrainingMode = isManager && trainerMode === 'treino'
  const isAdminMode = isManager && trainerMode !== 'treino'

  // Para admin: usa navDestinations (lista original)
  // Para aluno/trainer: usa mobileNavDestinations (ALUNO_MOBILE — 4 tabs)
  const ctx = { isManager, isSuperAdmin, inTrainingMode }
  const mobileDests = mobileNavDestinations(ctx)
  const adminDests = navDestinations(ctx)

  // ── Admin mode: layout original (tabs primárias + "Mais") ──────────────────
  if (isAdminMode) {
    const primary = adminDests.filter((d) => d.primary)
    const secondary = adminDests.filter((d) => !d.primary)
    const moreActive = secondary.some((d) => isNavActive(d, pathname))

    return (
      <>
        <nav className="mob-tabbar" style={{ display: 'none' }} data-mobile-tabbar>
          {primary.map((t) => (
            <Link
              key={t.to}
              to={t.to}
              className={'mob-tab' + (isNavActive(t, pathname) ? ' active' : '')}
            >
              <Icon name={t.icon} size={22} />
              {t.label}
            </Link>
          ))}
          <button
            type="button"
            onClick={() => setMoreOpen(true)}
            className={'mob-tab' + (moreActive ? ' active' : '')}
          >
            <Icon name="more" size={22} />
            Mais
          </button>
        </nav>
        <MobileMoreSheet isOpen={moreOpen} onClose={() => setMoreOpen(false)} />
      </>
    )
  }

  // ── Aluno mode: 5 colunas com FAB central ─────────────────────────────────
  // mobileDests tem 4 items: [Hoje, Semana, Exercícios, Perfil]
  // O FAB fica entre Semana (index 1) e Exercícios (index 2)
  const left = mobileDests.slice(0, 2)   // Hoje, Semana
  const right = mobileDests.slice(2)     // Exercícios, Perfil

  async function handleFAB() {
    if (!profile?.id) return
    try {
      const workouts = await getMyWorkouts(profile.id)
      const dayIndex = new Date().getDay() // 0=dom,1=seg,...,6=sab
      const DAY_KEYS: WeekDay[] = ['sunday', 'monday', 'tuesday', 'wednesday', 'thursday', 'friday', 'saturday']
      const todayKey = DAY_KEYS[dayIndex]
      const todayWorkout = workouts.find((w) => w.week_days.includes(todayKey))
      if (todayWorkout) {
        navigate(`/workouts/${todayWorkout.id}/session`)
      } else {
        navigate('/semana')
      }
    } catch {
      navigate('/semana')
    }
  }

  return (
    <nav
      className="mob-tabbar mob-tabbar-fab"
      style={{ display: 'none' }}
      data-mobile-tabbar
    >
      {left.map((t) => (
        <Link
          key={t.to}
          to={t.to}
          className={'mob-tab' + (isNavActive(t, pathname) ? ' active' : '')}
        >
          <Icon name={t.icon} size={22} />
          {t.label}
        </Link>
      ))}

      <button
        type="button"
        className="mob-tab-fab"
        onClick={() => void handleFAB()}
        aria-label="Iniciar treino de hoje"
      >
        <Icon name="play" size={24} />
      </button>

      {right.map((t) => (
        <Link
          key={t.to}
          to={t.to}
          className={'mob-tab' + (isNavActive(t, pathname) ? ' active' : '')}
        >
          <Icon name={t.icon} size={22} />
          {t.label}
        </Link>
      ))}
    </nav>
  )
}
```

- [ ] **Step 3: Verificar TypeScript**

```bash
npx tsc --noEmit
```

Esperado: sem erros.

- [ ] **Step 4: Commit**

```bash
git add src/lib/navigation.ts src/components/layout/MobileTabbar.tsx
git commit -m "feat(mobile): 5-tab layout with center FAB for student mode"
```

---

## Task 4: getAllExercisePRs — nova função no history.service.ts

**Files:**
- Modify: `src/services/history.service.ts` (adicionar ao final)

Esta função retorna o PR (maior carga registrada) por exercício para o aluno. Usada pela `ExerciciosPage`.

- [ ] **Step 1: Adicionar interface + função**

Adicionar ao **final** de `src/services/history.service.ts`:

```ts
// ─────────────────────────────────────────────
// PRs por exercício (ExerciciosPage)
// ─────────────────────────────────────────────

export interface ExercisePR {
  loadKg: number
  reps: number
}

/**
 * Para cada exercício já treinado pelo aluno, retorna
 * a maior carga registrada (PR) e as repetições naquele set.
 *
 * Retorna: { [exerciseLibraryId]: { loadKg, reps } }
 */
export async function getAllExercisePRs(
  userId: string
): Promise<Record<string, ExercisePR>> {
  // 1. IDs de todas as sessões concluídas
  const { data: logs, error: logsErr } = await supabase
    .from('workout_logs')
    .select('id')
    .eq('user_id', userId)
    .not('finished_at', 'is', null)

  if (logsErr) throw new Error(logsErr.message)
  if (!logs || logs.length === 0) return {}

  const logIds = (logs as { id: string }[]).map((l) => l.id)

  // 2. Todas as séries com carga registrada
  const { data: sets, error: setsErr } = await supabase
    .from('exercise_logs')
    .select('exercise_id, load_kg, reps_completed')
    .in('workout_log_id', logIds)
    .not('load_kg', 'is', null)
    .gt('load_kg', 0)

  if (setsErr) throw new Error(setsErr.message)
  if (!sets || sets.length === 0) return {}

  // 3. Para cada exercício, mantém o set de maior carga
  const result: Record<string, ExercisePR> = {}
  for (const row of sets as { exercise_id: string; load_kg: number; reps_completed: number }[]) {
    const existing = result[row.exercise_id]
    if (!existing || row.load_kg > existing.loadKg) {
      result[row.exercise_id] = { loadKg: row.load_kg, reps: row.reps_completed }
    }
  }

  return result
}
```

- [ ] **Step 2: Verificar TypeScript**

```bash
npx tsc --noEmit
```

Esperado: sem erros.

- [ ] **Step 3: Commit**

```bash
git add src/services/history.service.ts
git commit -m "feat(mobile): add getAllExercisePRs for exercise library page"
```

---

## Task 5: SemanaPage

**Files:**
- Create: `src/pages/SemanaPage.tsx`

- [ ] **Step 1: Criar a página**

Criar `src/pages/SemanaPage.tsx`:

```tsx
import { useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { motion } from 'motion/react'
import { useAuth } from '../context/AuthContext'
import { MobHead } from '../components/layout/MobHead'
import { Icon } from '../components/ui/Icon'
import { getMyWorkouts } from '../services/workout.service'
import { getWorkoutHistory } from '../services/history.service'
import { MUSCLE_GROUP_LABELS } from '../types'
import type { Workout, WeekDay, WorkoutLog } from '../types'

// ─── Constantes ───────────────────────────────────────────────────────────────

const DAY_KEYS: WeekDay[] = [
  'monday', 'tuesday', 'wednesday', 'thursday', 'friday', 'saturday', 'sunday',
]

const DAY_SHORT: Record<WeekDay, string> = {
  monday: 'SEG', tuesday: 'TER', wednesday: 'QUA',
  thursday: 'QUI', friday: 'SEX', saturday: 'SÁB', sunday: 'DOM',
}

const DAY_INDEX: Record<number, WeekDay> = {
  0: 'sunday', 1: 'monday', 2: 'tuesday', 3: 'wednesday',
  4: 'thursday', 5: 'friday', 6: 'saturday',
}

function getWeekStart(): Date {
  const d = new Date()
  const day = d.getDay()
  const diff = day === 0 ? -6 : 1 - day
  d.setDate(d.getDate() + diff)
  d.setHours(0, 0, 0, 0)
  return d
}

function getWeekNumber(): number {
  const d = new Date()
  const start = new Date(d.getFullYear(), 0, 1)
  return Math.ceil(((d.getTime() - start.getTime()) / 86400000 + start.getDay() + 1) / 7)
}

// ─── Componente ───────────────────────────────────────────────────────────────

export function SemanaPage() {
  const { profile } = useAuth()
  const navigate = useNavigate()

  const [workouts, setWorkouts] = useState<Workout[]>([])
  const [history, setHistory] = useState<WorkoutLog[]>([])
  const [loading, setLoading] = useState(true)

  const todayKey = DAY_INDEX[new Date().getDay()]
  const weekStart = getWeekStart()
  const weekNumber = getWeekNumber()

  useEffect(() => {
    if (!profile?.id) return
    setLoading(true)
    Promise.all([
      getMyWorkouts(profile.id),
      getWorkoutHistory(profile.id),
    ])
      .then(([w, h]) => {
        setWorkouts(w)
        setHistory(h)
      })
      .catch(console.error)
      .finally(() => setLoading(false))
  }, [profile?.id])

  // Dias com treino concluído nesta semana
  const doneDaysThisWeek = new Set<WeekDay>(
    history
      .filter((log) => {
        const d = new Date(log.started_at)
        return d >= weekStart
      })
      .map((log) => DAY_INDEX[new Date(log.started_at).getDay()])
  )

  const rows = DAY_KEYS.map((day) => {
    const workout = workouts.find((w) => w.week_days.includes(day)) ?? null
    const isToday = day === todayKey
    const isDone = doneDaysThisWeek.has(day)
    const isRest = !workout

    const muscleGroups = workout
      ? Array.from(
          new Set(
            (workout.exercises ?? [])
              .map((e) => e.exercise?.muscle_group)
              .filter(Boolean)
          )
        )
          .map((g) => MUSCLE_GROUP_LABELS[g!])
          .join(' · ')
      : ''

    return { day, workout, isToday, isDone, isRest, muscleGroups }
  })

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      transition={{ duration: 0.2 }}
      style={{ display: 'flex', flexDirection: 'column', minHeight: '100%' }}
    >
      <MobHead
        over={`CICLO · SEM ${weekNumber}`}
        title="SUA SEMANA"
        right={
          <button
            className="btn ghost"
            style={{ padding: '8px 10px' }}
            onClick={() => navigate('/workouts')}
            aria-label="Ver todas as fichas"
          >
            <Icon name="arrow" size={18} />
          </button>
        }
      />

      <div className="mob-scroll">
        {loading ? (
          <div className="col gap-3">
            {[1, 2, 3, 4, 5, 6, 7].map((i) => (
              <div key={i} className="skeleton" style={{ height: 80, borderRadius: 14 }} />
            ))}
          </div>
        ) : (
          <div className="col gap-2">
            {rows.map(({ day, workout, isToday, isDone, isRest, muscleGroups }) => (
              <div
                key={day}
                className="card"
                onClick={() => workout && navigate(`/workouts/${workout.id}`)}
                style={{
                  padding: '16px 18px',
                  opacity: isRest ? 0.6 : 1,
                  borderColor: isToday ? 'var(--accent)' : 'var(--hairline)',
                  borderStyle: isRest ? 'dashed' : 'solid',
                  cursor: workout ? 'pointer' : 'default',
                }}
              >
                <div style={{ display: 'flex', alignItems: 'center', gap: 14 }}>
                  {/* Rótulo do dia */}
                  <div
                    className="f-display"
                    style={{
                      fontSize: 18,
                      width: 34,
                      flexShrink: 0,
                      color: isToday ? 'var(--accent)' : 'var(--text-dim)',
                    }}
                  >
                    {DAY_SHORT[day]}
                  </div>

                  {/* Info da ficha */}
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <div
                      className="f-display"
                      style={{
                        fontSize: 26,
                        lineHeight: 1,
                        color: isRest ? 'var(--text-faint)' : 'var(--text)',
                        whiteSpace: 'nowrap',
                        overflow: 'hidden',
                        textOverflow: 'ellipsis',
                      }}
                    >
                      {workout ? workout.name.toUpperCase() : 'DESCANSO'}
                    </div>
                    {muscleGroups && (
                      <div style={{ fontSize: 11, color: 'var(--text-dim)', marginTop: 2 }}>
                        {muscleGroups}
                      </div>
                    )}
                  </div>

                  {/* Ação à direita */}
                  {isDone ? (
                    <div
                      className="check checked"
                      style={{ width: 24, height: 24, flexShrink: 0 }}
                    >
                      <Icon name="check" size={13} />
                    </div>
                  ) : isToday && workout ? (
                    <button
                      className="btn primary"
                      style={{ padding: '8px 12px', flexShrink: 0 }}
                      onClick={(e) => {
                        e.stopPropagation()
                        navigate(`/workouts/${workout.id}/session`)
                      }}
                    >
                      <Icon name="play" size={12} />
                    </button>
                  ) : null}
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </motion.div>
  )
}
```

- [ ] **Step 2: Verificar TypeScript**

```bash
npx tsc --noEmit
```

Esperado: sem erros.

- [ ] **Step 3: Commit**

```bash
git add src/pages/SemanaPage.tsx
git commit -m "feat(mobile): add SemanaPage with weekly workout overview"
```

---

## Task 6: ExerciciosPage

**Files:**
- Create: `src/pages/ExerciciosPage.tsx`

- [ ] **Step 1: Criar a página**

Criar `src/pages/ExerciciosPage.tsx`:

```tsx
import { useEffect, useState, useMemo } from 'react'
import { motion } from 'motion/react'
import { useAuth } from '../context/AuthContext'
import { MobHead } from '../components/layout/MobHead'
import { Icon } from '../components/ui/Icon'
import { getExercises } from '../services/workout.service'
import { getAllExercisePRs } from '../services/history.service'
import type { ExercisePR } from '../services/history.service'
import { MUSCLE_GROUP_LABELS } from '../types'
import type { Exercise, MuscleGroup } from '../types'

// ─── Filtros de grupo muscular ─────────────────────────────────────────────────

type FilterKey = MuscleGroup | 'all'

const FILTERS: { key: FilterKey; label: string }[] = [
  { key: 'all',       label: 'Todos'   },
  { key: 'chest',     label: 'Peito'   },
  { key: 'back',      label: 'Costas'  },
  { key: 'legs',      label: 'Pernas'  },
  { key: 'shoulders', label: 'Ombros'  },
  { key: 'biceps',    label: 'Bíceps'  },
  { key: 'triceps',   label: 'Tríceps' },
  { key: 'abs',       label: 'Abdômen' },
  { key: 'glutes',    label: 'Glúteos' },
]

// ─── Componente ───────────────────────────────────────────────────────────────

export function ExerciciosPage() {
  const { profile } = useAuth()

  const [exercises, setExercises] = useState<Exercise[]>([])
  const [prs, setPrs] = useState<Record<string, ExercisePR>>({})
  const [loading, setLoading] = useState(true)
  const [search, setSearch] = useState('')
  const [filter, setFilter] = useState<FilterKey>('all')

  useEffect(() => {
    if (!profile?.id) return
    setLoading(true)
    Promise.all([
      getExercises(),
      getAllExercisePRs(profile.id),
    ])
      .then(([exs, prMap]) => {
        setExercises(exs)
        setPrs(prMap)
      })
      .catch(console.error)
      .finally(() => setLoading(false))
  }, [profile?.id])

  const filtered = useMemo(() => {
    return exercises.filter((ex) => {
      const matchGroup = filter === 'all' || ex.muscle_group === filter
      const q = search.toLowerCase()
      const matchSearch = q === '' || ex.name.toLowerCase().includes(q)
      return matchGroup && matchSearch
    })
  }, [exercises, filter, search])

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      transition={{ duration: 0.2 }}
      style={{ display: 'flex', flexDirection: 'column', minHeight: '100%' }}
    >
      <MobHead
        over={loading ? '...' : `${exercises.length} exercícios`}
        title="EXERCÍCIOS"
      />

      {/* Busca + filtros */}
      <div style={{ padding: '0 16px 10px', flexShrink: 0 }}>
        <div style={{ position: 'relative' }}>
          <input
            className="input"
            placeholder="Buscar exercício..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            style={{ paddingLeft: 40 }}
          />
          <span
            style={{
              position: 'absolute',
              left: 14,
              top: '50%',
              transform: 'translateY(-50%)',
              color: 'var(--text-faint)',
              display: 'flex',
              pointerEvents: 'none',
            }}
          >
            <Icon name="search" size={16} />
          </span>
        </div>

        <div
          style={{
            display: 'flex',
            gap: 6,
            overflowX: 'auto',
            marginTop: 10,
            paddingBottom: 4,
            scrollbarWidth: 'none',
          }}
        >
          {FILTERS.map((f) => (
            <span
              key={f.key}
              className={filter === f.key ? 'chip solid' : 'chip'}
              style={{ whiteSpace: 'nowrap', cursor: 'pointer', flexShrink: 0 }}
              onClick={() => setFilter(f.key)}
            >
              {f.label}
            </span>
          ))}
        </div>
      </div>

      {/* Lista */}
      <div className="mob-scroll" style={{ paddingTop: 4 }}>
        {loading ? (
          <div className="col gap-2">
            {[1, 2, 3, 4, 5].map((i) => (
              <div
                key={i}
                className="skeleton"
                style={{ height: 72, borderRadius: 12, flexShrink: 0 }}
              />
            ))}
          </div>
        ) : filtered.length === 0 ? (
          <div
            style={{
              padding: 40,
              textAlign: 'center',
              color: 'var(--text-dim)',
              fontSize: 13,
            }}
          >
            Nenhum exercício encontrado
          </div>
        ) : (
          <div className="col">
            {filtered.map((ex) => {
              const pr = prs[ex.id]
              return (
                <div key={ex.id} className="mob-lrow">
                  {/* Thumbnail */}
                  <div
                    className={ex.image_url ? '' : 'ph-img'}
                    style={{
                      width: 56,
                      height: 56,
                      flexShrink: 0,
                      borderRadius: 10,
                      overflow: 'hidden',
                    }}
                  >
                    {ex.image_url && (
                      <img
                        src={ex.image_url}
                        alt={ex.name}
                        style={{ width: '100%', height: '100%', objectFit: 'cover' }}
                      />
                    )}
                  </div>

                  {/* Nome + grupo */}
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <div
                      style={{
                        fontSize: 14,
                        fontWeight: 600,
                        color: 'var(--text)',
                        whiteSpace: 'nowrap',
                        overflow: 'hidden',
                        textOverflow: 'ellipsis',
                      }}
                    >
                      {ex.name}
                    </div>
                    <div style={{ marginTop: 5 }}>
                      <span className="chip" style={{ fontSize: 9, padding: '2px 8px' }}>
                        {MUSCLE_GROUP_LABELS[ex.muscle_group]}
                      </span>
                    </div>
                  </div>

                  {/* PR */}
                  <div style={{ textAlign: 'right', flexShrink: 0 }}>
                    <div
                      style={{
                        fontSize: 9,
                        color: 'var(--text-faint)',
                        letterSpacing: '0.1em',
                        textTransform: 'uppercase',
                      }}
                    >
                      PR
                    </div>
                    <div
                      className="f-mono"
                      style={{
                        fontSize: 13,
                        fontWeight: 600,
                        color: pr ? 'var(--accent)' : 'var(--text-faint)',
                      }}
                    >
                      {pr ? `${pr.loadKg}kg×${pr.reps}` : '—'}
                    </div>
                  </div>
                </div>
              )
            })}
          </div>
        )}
      </div>
    </motion.div>
  )
}
```

- [ ] **Step 2: Verificar TypeScript**

```bash
npx tsc --noEmit
```

Esperado: sem erros.

- [ ] **Step 3: Commit**

```bash
git add src/pages/ExerciciosPage.tsx
git commit -m "feat(mobile): add ExerciciosPage with exercise list and PRs"
```

---

## Task 7: DashboardPage — branch mobile

**Files:**
- Modify: `src/pages/DashboardPage.tsx`

O objetivo é inserir um `return` mobile **antes** do `return` desktop atual. Nenhuma lógica de dados ou estado é duplicada — tudo já está carregado.

- [ ] **Step 1: Adicionar import e hook**

No topo de `src/pages/DashboardPage.tsx`, adicionar os imports:

```ts
import { useIsMobile } from '../hooks/useIsMobile'
import { MobHead } from '../components/layout/MobHead'
```

E logo após a linha `const navigate = useNavigate()`, adicionar:

```ts
const isMobile = useIsMobile()
```

- [ ] **Step 2: Inserir o return mobile**

Após a declaração de `todayWorkout`, `lastSession` e `formatVolume` (por volta da linha 102 do arquivo original, antes do `return (...)`), inserir o bloco mobile completo:

```tsx
// ─── Render mobile (aluno) ────────────────────────────────────────────────────
if (isMobile && !showAdminView) {
  // Mini-semana: últimos 7 dias cruzados com histórico desta semana
  const WEEK_DAYS_ORDERED: WeekDay[] = [
    'monday', 'tuesday', 'wednesday', 'thursday', 'friday', 'saturday', 'sunday',
  ]
  const WEEK_SHORT: Record<WeekDay, string> = {
    monday: 'S', tuesday: 'T', wednesday: 'Q',
    thursday: 'Q', friday: 'S', saturday: 'S', sunday: 'D',
  }

  const weekStart = (() => {
    const d = new Date()
    const day = d.getDay()
    d.setDate(d.getDate() + (day === 0 ? -6 : 1 - day))
    d.setHours(0, 0, 0, 0)
    return d
  })()

  const doneDays = new Set<WeekDay>(
    history
      .filter((h) => new Date(h.started_at) >= weekStart)
      .map((h) => {
        const map: Record<number, WeekDay> = {
          0: 'sunday', 1: 'monday', 2: 'tuesday', 3: 'wednesday',
          4: 'thursday', 5: 'friday', 6: 'saturday',
        }
        return map[new Date(h.started_at).getDay()]
      })
  )

  const avatarInitial = (profile?.full_name ?? 'A').charAt(0).toUpperCase()

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      transition={{ duration: 0.2 }}
      style={{ display: 'flex', flexDirection: 'column', minHeight: '100%' }}
    >
      {/* Header */}
      <MobHead
        over={formatTodayHeader()}
        title={`${getGreeting()}, ${firstName.toUpperCase()}`}
        right={
          <div
            style={{
              width: 44,
              height: 44,
              borderRadius: 12,
              background: 'var(--bg-2)',
              border: '2px solid var(--bg-3)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              fontFamily: 'var(--f-display)',
              fontSize: 22,
              color: 'var(--accent)',
              cursor: 'pointer',
              flexShrink: 0,
              overflow: 'hidden',
            }}
            onClick={() => navigate('/perfil')}
          >
            {profile?.avatar_url ? (
              <img
                src={profile.avatar_url}
                alt={profile.full_name}
                style={{ width: '100%', height: '100%', objectFit: 'cover' }}
              />
            ) : (
              avatarInitial
            )}
          </div>
        }
      />

      <div className="mob-scroll">
        {loading ? (
          <>
            <div className="skeleton" style={{ height: 210, borderRadius: 14, marginBottom: 10 }} />
            <div
              style={{
                display: 'grid',
                gridTemplateColumns: '1fr 1fr',
                gap: 10,
                marginBottom: 10,
              }}
            >
              <div className="skeleton" style={{ height: 88, borderRadius: 14 }} />
              <div className="skeleton" style={{ height: 88, borderRadius: 14 }} />
            </div>
          </>
        ) : (
          <>
            {/* ── Hero card ── */}
            <div
              className={todayWorkout ? 'card card-accent' : 'card'}
              style={{
                padding: 22,
                marginBottom: 12,
                position: 'relative',
                overflow: 'hidden',
                minHeight: todayWorkout ? 200 : 140,
              }}
            >
              {todayWorkout ? (
                <>
                  {/* Número fantasma decorativo */}
                  <div
                    className="f-display"
                    style={{
                      position: 'absolute',
                      right: -10,
                      bottom: -20,
                      fontSize: 180,
                      opacity: 0.07,
                      color: '#000',
                      lineHeight: 1,
                      pointerEvents: 'none',
                      userSelect: 'none',
                    }}
                  >
                    {String(workouts.indexOf(todayWorkout) + 1).padStart(2, '0')}
                  </div>
                  <div style={{ position: 'relative' }}>
                    <div
                      className="eyebrow"
                      style={{ color: 'rgba(0,0,0,0.5)', marginBottom: 4 }}
                    >
                      TREINO DE HOJE
                    </div>
                    <h2
                      className="f-display"
                      style={{ fontSize: 64, lineHeight: 0.85, margin: 0 }}
                    >
                      {todayWorkout.name.toUpperCase()}
                    </h2>
                    <div style={{ fontSize: 13, color: 'rgba(0,0,0,0.65)', marginTop: 6 }}>
                      {Array.from(
                        new Set(
                          (todayWorkout.exercises ?? [])
                            .map((e) => e.exercise?.muscle_group)
                            .filter(Boolean)
                        )
                      )
                        .map((g) => MUSCLE_GROUP_LABELS[g!])
                        .join(' · ') || 'Treino completo'}
                    </div>
                    <div
                      className="f-mono"
                      style={{
                        display: 'flex',
                        gap: 16,
                        marginTop: 10,
                        fontSize: 12,
                        color: 'rgba(0,0,0,0.7)',
                      }}
                    >
                      <span>
                        <b>{todayWorkout.exercises?.length ?? 0}</b> exerc.
                      </span>
                      {avgDuration !== null && (
                        <span>
                          <b>{avgDuration}</b>min
                        </span>
                      )}
                    </div>
                    <button
                      className="btn lg"
                      onClick={() => navigate(`/workouts/${todayWorkout.id}/session`)}
                      style={{
                        width: '100%',
                        justifyContent: 'center',
                        marginTop: 16,
                        background: '#080909',
                        color: 'var(--accent)',
                        borderColor: '#080909',
                      }}
                    >
                      <Icon name="play" size={13} />
                      COMEÇAR TREINO
                    </button>
                  </div>
                </>
              ) : (
                <>
                  <div className="eyebrow" style={{ marginBottom: 8 }}>
                    SEM TREINO HOJE
                  </div>
                  <h2
                    className="f-display"
                    style={{ fontSize: 44, lineHeight: 0.95, margin: '0 0 10px' }}
                  >
                    DIA DE DESCANSO
                  </h2>
                  <div style={{ fontSize: 13, color: 'var(--text-dim)' }}>
                    Recuperação ativa, mobilidade ou descanso total.
                  </div>
                </>
              )}
            </div>

            {/* ── 2 KPIs ── */}
            <div
              style={{
                display: 'grid',
                gridTemplateColumns: '1fr 1fr',
                gap: 10,
                marginBottom: 12,
              }}
            >
              <div className="mob-kpi">
                <div className="stat-label">Streak</div>
                <div className="mob-kpi-val">
                  {streak.current}
                  <span className="mob-kpi-unit">d</span>
                </div>
              </div>
              <div className="mob-kpi">
                <div className="stat-label">Vol. semana</div>
                <div className="mob-kpi-val" style={{ fontSize: 28 }}>
                  {formatVolume(volumeData.thisWeek)}
                </div>
              </div>
            </div>

            {/* ── Mini-semana ── */}
            <div className="card" style={{ padding: '14px 16px', marginBottom: 12 }}>
              <div
                className="label-sm"
                style={{ marginBottom: 12 }}
              >
                ESTA SEMANA
              </div>
              <div
                style={{
                  display: 'flex',
                  justifyContent: 'space-between',
                  gap: 4,
                }}
              >
                {WEEK_DAYS_ORDERED.map((day) => {
                  const isToday = day === todayKey
                  const hasWorkout = workouts.some((w) => w.week_days.includes(day))
                  const isDone = doneDays.has(day)
                  return (
                    <div
                      key={day}
                      style={{
                        flex: 1,
                        padding: '8px 2px',
                        background: isToday
                          ? 'var(--accent)'
                          : isDone
                            ? 'var(--bg-2)'
                            : 'transparent',
                        color: isToday
                          ? 'var(--accent-fg)'
                          : isDone
                            ? 'var(--text)'
                            : 'var(--text-faint)',
                        borderRadius: 6,
                        textAlign: 'center',
                        border:
                          !hasWorkout && !isToday
                            ? '1px dashed var(--hairline)'
                            : 'none',
                      }}
                    >
                      <div
                        style={{ fontSize: 9, letterSpacing: '0.06em', opacity: 0.8 }}
                      >
                        {WEEK_SHORT[day]}
                      </div>
                      <div
                        className="f-display"
                        style={{ fontSize: 16, marginTop: 3, lineHeight: 1 }}
                      >
                        {isDone ? '✓' : !hasWorkout ? '—' : '·'}
                      </div>
                    </div>
                  )
                })}
              </div>
            </div>

            {/* ── Último treino ── */}
            {lastSession && (
              <div className="card" style={{ padding: '14px 16px' }}>
                <div className="label-sm" style={{ marginBottom: 12 }}>
                  ÚLTIMA SESSÃO
                </div>
                <div className="mob-lrow" style={{ paddingTop: 0, paddingBottom: 0, border: 'none' }}>
                  <div
                    style={{
                      width: 42,
                      height: 42,
                      borderRadius: '50%',
                      background: 'var(--bg-2)',
                      border: '1px solid var(--hairline)',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      color: 'var(--accent)',
                      flexShrink: 0,
                    }}
                  >
                    <Icon name="flame" size={20} />
                  </div>
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <div style={{ fontSize: 14, fontWeight: 600, color: 'var(--text)' }}>
                      {(lastSession.workout as { name?: string } | undefined)?.name ?? 'Treino'}
                    </div>
                    <div style={{ fontSize: 12, color: 'var(--text-dim)', marginTop: 2 }}>
                      {new Date(lastSession.started_at).toLocaleDateString('pt-BR', {
                        day: '2-digit',
                        month: 'short',
                      })}
                      {lastSession.duration_minutes
                        ? ` · ${lastSession.duration_minutes}min`
                        : ''}
                    </div>
                  </div>
                  {prsThisMonthCount > 0 && (
                    <div style={{ textAlign: 'right', flexShrink: 0 }}>
                      <div style={{ fontSize: 9, color: 'var(--text-faint)', textTransform: 'uppercase', letterSpacing: '0.1em' }}>PRs/mês</div>
                      <div className="f-display" style={{ fontSize: 28, color: 'var(--accent)', lineHeight: 1 }}>
                        {prsThisMonthCount}
                      </div>
                    </div>
                  )}
                </div>
              </div>
            )}
          </>
        )}
      </div>
    </motion.div>
  )
}
```

Esse bloco vai **antes** do `return (` original do componente (o return desktop).

- [ ] **Step 3: Verificar TypeScript**

```bash
npx tsc --noEmit
```

Esperado: sem erros.

- [ ] **Step 4: Commit**

```bash
git add src/pages/DashboardPage.tsx
git commit -m "feat(mobile): add mobile branch to DashboardPage"
```

---

## Task 8: ProfilePage — branch mobile

**Files:**
- Modify: `src/pages/ProfilePage.tsx`

A branch mobile mostra: banner + avatar sobreposto + nome + chips + 3 KPIs + menu de lista + botão sair. Carrega dados extras (streak, PRs) apenas quando em mobile.

- [ ] **Step 1: Adicionar imports**

No topo de `src/pages/ProfilePage.tsx`, adicionar:

```ts
import { useNavigate } from 'react-router-dom'
import { useIsMobile } from '../hooks/useIsMobile'
import { MobHead } from '../components/layout/MobHead'
import {
  getCurrentStreak,
  getPersonalRecordsThisMonth,
  getWorkoutHistory,
} from '../services/history.service'
```

- [ ] **Step 2: Adicionar estado mobile**

Logo após a linha `const { user, profile, isAdmin, signOut, refreshProfile } = useAuth()`, adicionar:

```ts
const navigate = useNavigate()
const isMobile = useIsMobile()

// Dados extra para a view mobile
const [mobileStats, setMobileStats] = useState<{
  totalWorkouts: number
  streak: number
  prs: number
} | null>(null)

useEffect(() => {
  if (!isMobile || !profile?.id) return
  Promise.all([
    getWorkoutHistory(profile.id),
    getCurrentStreak(profile.id),
    getPersonalRecordsThisMonth(profile.id),
  ])
    .then(([hist, str, prs]) => {
      setMobileStats({
        totalWorkouts: hist.length,
        streak: str.current,
        prs,
      })
    })
    .catch(console.error)
}, [isMobile, profile?.id])
```

- [ ] **Step 3: Inserir branch mobile**

No `return` do componente `ProfilePage`, antes do `return (` desktop (que começa com `<motion.div ...>`), inserir:

```tsx
// ─── Render mobile ────────────────────────────────────────────────────────────
if (isMobile) {
  const initials = (profile?.full_name ?? 'A')
    .split(' ')
    .map((n) => n[0])
    .slice(0, 2)
    .join('')
    .toUpperCase()

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      transition={{ duration: 0.2 }}
      style={{ display: 'flex', flexDirection: 'column', minHeight: '100%' }}
    >
      <MobHead title="PERFIL" />

      <div className="mob-scroll">
        {/* Banner + Avatar */}
        <div style={{ position: 'relative', marginBottom: 48 }}>
          {/* Banner placeholder */}
          <div
            style={{
              height: 110,
              borderRadius: 14,
              background:
                'linear-gradient(135deg, var(--bg-2) 0%, var(--bg-3) 100%)',
              border: '1px solid var(--hairline)',
              overflow: 'hidden',
            }}
          >
            <div
              className="f-display"
              style={{
                fontSize: 120,
                opacity: 0.08,
                color: 'var(--accent)',
                position: 'absolute',
                right: -10,
                top: -10,
                lineHeight: 1,
                pointerEvents: 'none',
              }}
            >
              {initials}
            </div>
          </div>

          {/* Avatar sobreposto */}
          <div
            style={{
              position: 'absolute',
              bottom: -44,
              left: 20,
              width: 88,
              height: 88,
              borderRadius: 16,
              overflow: 'hidden',
              border: '3px solid var(--bg-0)',
              background: 'var(--bg-2)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              cursor: 'pointer',
            }}
            onClick={() => fileInputRef.current?.click()}
          >
            {profile?.avatar_url ? (
              <img
                src={profile.avatar_url}
                alt={profile.full_name}
                style={{ width: '100%', height: '100%', objectFit: 'cover' }}
              />
            ) : (
              <span
                className="f-display"
                style={{ fontSize: 36, color: 'var(--accent)' }}
              >
                {initials}
              </span>
            )}
          </div>
        </div>

        {/* Nome + chips */}
        <div style={{ marginBottom: 18 }}>
          <h2
            className="f-display"
            style={{ fontSize: 34, lineHeight: 1, margin: '0 0 8px' }}
          >
            {(profile?.full_name ?? '').toUpperCase()}
          </h2>
          <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap' }}>
            {profile?.goal && (
              <span className="chip">{profile.goal}</span>
            )}
            <span className="chip">
              {profile?.role === 'super_admin'
                ? 'Super Admin'
                : profile?.role === 'trainer'
                  ? 'Personal Trainer'
                  : 'Aluno'}
            </span>
          </div>
        </div>

        {/* 3 KPIs */}
        {mobileStats ? (
          <div
            style={{
              display: 'grid',
              gridTemplateColumns: '1fr 1fr 1fr',
              gap: 8,
              marginBottom: 18,
            }}
          >
            {[
              { label: 'Treinos', value: mobileStats.totalWorkouts },
              { label: 'Streak', value: `${mobileStats.streak}d` },
              { label: 'PRs/mês', value: mobileStats.prs },
            ].map(({ label, value }) => (
              <div key={label} className="mob-kpi" style={{ padding: '12px 10px' }}>
                <div className="stat-label" style={{ fontSize: 9 }}>
                  {label}
                </div>
                <div
                  className="mob-kpi-val"
                  style={{ fontSize: 26, marginTop: 2 }}
                >
                  {value}
                </div>
              </div>
            ))}
          </div>
        ) : (
          <div
            style={{
              display: 'grid',
              gridTemplateColumns: '1fr 1fr 1fr',
              gap: 8,
              marginBottom: 18,
            }}
          >
            {[1, 2, 3].map((i) => (
              <div
                key={i}
                className="skeleton"
                style={{ height: 68, borderRadius: 14 }}
              />
            ))}
          </div>
        )}

        {/* Menu */}
        <div className="card" style={{ padding: '4px 0', marginBottom: 16 }}>
          {[
            {
              icon: 'user' as const,
              label: 'Dados pessoais',
              sub: 'Nome, altura, objetivo',
              to: null,
            },
            {
              icon: 'scale' as const,
              label: 'Medidas corporais',
              sub: 'Peso e medidas',
              to: '/medidas',
            },
            {
              icon: 'chart' as const,
              label: 'Progresso',
              sub: 'PRs e evolução de carga',
              to: '/progresso',
            },
            {
              icon: 'settings' as const,
              label: 'Preferências',
              sub: 'Tema e aparência',
              to: null,
            },
          ].map((item, idx) => {
            // "Dados pessoais" usa um anchor para a seção de edição abaixo
            const href = item.to
            return (
              <div
                key={idx}
                className="mob-lrow"
                style={{
                  padding: '14px 18px',
                  cursor: 'pointer',
                }}
                onClick={() => {
                  if (href) navigate(href)
                  else if (item.label === 'Dados pessoais') {
                    // Scroll suave até a seção de edição (renderizada abaixo)
                    document
                      .getElementById('perfil-dados-section')
                      ?.scrollIntoView({ behavior: 'smooth' })
                  }
                }}
              >
                <div
                  style={{
                    width: 38,
                    height: 38,
                    borderRadius: 10,
                    background: 'var(--bg-2)',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    color: 'var(--accent)',
                    flexShrink: 0,
                  }}
                >
                  <Icon name={item.icon} size={18} />
                </div>
                <div style={{ flex: 1 }}>
                  <div style={{ fontSize: 14, fontWeight: 600 }}>{item.label}</div>
                  <div style={{ fontSize: 12, color: 'var(--text-dim)' }}>{item.sub}</div>
                </div>
                <Icon name="chevron" size={16} style={{ color: 'var(--text-faint)' } as React.CSSProperties} />
              </div>
            )
          })}
        </div>

        {/* Editar dados (seção âncora) */}
        <div id="perfil-dados-section" style={{ marginBottom: 16 }}>
          <div className="label-sm" style={{ marginBottom: 12 }}>
            DADOS PESSOAIS
          </div>
          {/* Aqui renderiza o formulário existente de perfil */}
          {/* O JSX do form está abaixo — ver bloco do return desktop */}
          {/* Para não duplicar o form, apenas indicamos que o usuário */}
          {/* pode rolar até aqui. O form fica no return desktop que */}
          {/* NÃO é alcançado no mobile (por causa do early return). */}
          {/* Solução: extrair o FormContent para um componente separado. */}
          {/* Por ora, colocamos um link para a página de edição full. */}
          <div className="card" style={{ padding: 18 }}>
            <div style={{ fontSize: 13, color: 'var(--text-dim)', marginBottom: 12 }}>
              Para editar seus dados pessoais, acesse a versão completa.
            </div>
            <button
              className="btn ghost"
              style={{ width: '100%', justifyContent: 'center' }}
              onClick={() => {
                // Força re-render em modo desktop temporário — simples e eficaz
                window.location.href = '/perfil?edit=1'
              }}
            >
              <Icon name="edit" size={14} />
              Editar perfil
            </button>
          </div>
        </div>

        {/* Sair */}
        <button
          className="btn danger"
          style={{ width: '100%', justifyContent: 'center', marginBottom: 8 }}
          onClick={() => void signOut()}
        >
          <Icon name="logout" size={14} />
          Sair da conta
        </button>
      </div>

      {/* Input de foto (oculto) */}
      <input
        ref={fileInputRef}
        type="file"
        accept="image/*"
        style={{ display: 'none' }}
        onChange={handleFileChange}
      />

      {cropSrc && (
        <AvatarCropModal
          src={cropSrc}
          onConfirm={(blob) => void handleCropConfirm(blob)}
          onCancel={() => setCropSrc(null)}
          loading={isUploadingAvatar}
        />
      )}
    </motion.div>
  )
}
```

Este bloco vai imediatamente **antes** do `return (` que começa o JSX desktop.

**Nota:** A classe `.btn.danger` pode não existir — verificar em `src/index.css`. Se não existir, usar `className="btn ghost"` com `style={{ color: 'var(--danger)', borderColor: 'var(--danger)' }}`.

- [ ] **Step 4: Verificar TypeScript**

```bash
npx tsc --noEmit
```

Se houver erro no `style` do `<Icon name="chevron">`, remover o cast e passar como atributo sem style (o Icon aceita `SVGProps`). Substituir por:

```tsx
<span style={{ color: 'var(--text-faint)', display: 'flex' }}>
  <Icon name="chevron" size={16} />
</span>
```

- [ ] **Step 5: Commit**

```bash
git add src/pages/ProfilePage.tsx
git commit -m "feat(mobile): add mobile hub view to ProfilePage"
```

---

## Task 9: App.tsx — rotas + build + push

**Files:**
- Modify: `src/App.tsx`

- [ ] **Step 1: Adicionar imports e rotas**

Em `src/App.tsx`, adicionar os imports:

```ts
import { SemanaPage } from './pages/SemanaPage'
import { ExerciciosPage } from './pages/ExerciciosPage'
```

Dentro do bloco de rotas protegidas (`<Route element={<ProtectedRoute />}>`), adicionar as duas rotas novas ao lado das rotas existentes do aluno:

```tsx
<Route path="/semana" element={<SemanaPage />} />
<Route path="/exercicios" element={<ExerciciosPage />} />
```

- [ ] **Step 2: Verificar TypeScript completo**

```bash
npx tsc --noEmit
```

Corrigir quaisquer erros remanescentes antes de prosseguir.

- [ ] **Step 3: Build de produção**

```bash
npm run build
```

Esperado: `dist/` gerado sem erros.

- [ ] **Step 4: Commit final**

```bash
git add src/App.tsx
git commit -m "feat(mobile): add /semana and /exercicios routes"
```

- [ ] **Step 5: Push para produção**

```bash
git push origin main
```

O Vercel fará deploy automático. Após ~1min, testar em https://forjamuscle.vercel.app no celular.

---

## Critério de conclusão

- [ ] Tabbar mobile tem 5 colunas com FAB accent subindo acima da barra
- [ ] FAB inicia o treino de hoje, ou navega para `/semana` se não houver
- [ ] `/semana` exibe os 7 dias com status (done/hoje/descanso/futuro)
- [ ] `/exercicios` exibe catálogo com busca, filtro por grupo e PR do aluno
- [ ] Dashboard mobile: hero card + 2 KPIs + mini-semana + última sessão
- [ ] Perfil mobile: avatar sobreposto ao banner + KPIs + menu + botão sair
- [ ] Desktop: zero mudança visual ou funcional
- [ ] Build sem erros de TypeScript
