# Painel Administrativo (Fase 9) — Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Completar o painel administrativo: painel do personal com estatísticas reais, perfil completo do aluno (abas + ações) e biblioteca de exercícios.

**Architecture:** Reaproveita os serviços existentes (todos aceitam `userId` explícito) e os componentes de gráfico/modal já prontos. Cria um serviço de estatísticas (`admin.service.ts`), uma página de perfil do aluno com abas (carregamento sob demanda), uma página de biblioteca de exercícios, e dois modais pequenos. Mudanças de banco ficam em um único Patch v6 (RLS) e uma ação nova na Edge Function `manage-users`.

**Tech Stack:** React 19 + TypeScript, React Router v7, Motion, Recharts, Supabase (PostgREST + Edge Functions + RLS).

**Observação sobre testes:** este projeto **não tem framework de testes automatizados**. O padrão de verificação estabelecido (ver planos anteriores) é `npx tsc --noEmit` (checagem de tipos) + teste manual no navegador. Este plano segue esse padrão.

---

## Mapa de arquivos

| Arquivo | Tipo | Responsabilidade |
|---------|------|------------------|
| `src/lib/bmi.ts` | **novo** | Helper `getBmiStatus(weight, height)` — cor/rótulo/tooltip do IMC (DRY) |
| `src/pages/ProfilePage.tsx` | modificar | Usa `getBmiStatus` em vez da lógica inline |
| `src/types/index.ts` | modificar | Tipos `AttentionStudent`, `AdminDashboardStats` |
| `src/services/admin.service.ts` | **novo** | `getAdminDashboardStats(ctx)` — números do painel |
| `src/pages/DashboardPage.tsx` | modificar | Troca o card placeholder do admin pelo painel real |
| `src/services/workout.service.ts` | modificar | Expande `updateExercise` (nome + grupo) |
| `src/components/admin/ExerciseFormModal.tsx` | **novo** | Modal criar/editar exercício |
| `src/pages/admin/ExerciseLibraryPage.tsx` | **novo** | Biblioteca de exercícios |
| `src/pages/admin/StudentDetailPage.tsx` | **novo** | Perfil completo do aluno (abas + ações) |
| `src/components/admin/AssignToStudentModal.tsx` | **novo** | Atribuir template a este aluno |
| `src/components/admin/StudentEditModal.tsx` | **novo** | Editar dados seguros do aluno |
| `src/pages/admin/StudentsAdminPage.tsx` | modificar | Linhas clicáveis → perfil do aluno |
| `src/services/trainer.service.ts` | modificar | `resetStudentPassword(studentId)` |
| `src/lib/navigation.ts` | modificar | Item "Exercícios" na navegação de gestão |
| `src/App.tsx` | modificar | Rotas `/admin/students/:id` e `/admin/exercises` |
| `supabase-setup.sql` | modificar | Patch v6 (4 políticas RLS) |
| `supabase/functions/manage-users/index.ts` | modificar | Ação `reset-password` |
| `Plan.md` / `CLAUDE.md` | modificar | Marcar Fase 9 concluída |

---

## Task 1: Helper de IMC (DRY)

**Files:**
- Create: `src/lib/bmi.ts`
- Modify: `src/pages/ProfilePage.tsx`

- [ ] **Step 1: Criar o helper**

Crie `src/lib/bmi.ts` com exatamente o conteúdo abaixo (os textos batem com os que já existem hoje no ProfilePage):

```ts
export interface BmiStatus {
  bmi: number
  color: string
  label: string
  tooltip: string
}

/**
 * Calcula o IMC e devolve cor + rótulo + texto explicativo.
 * Retorna null quando peso ou altura não estão preenchidos.
 * IMC = peso(kg) / altura(m)². Faixas conforme OMS.
 */
export function getBmiStatus(
  weight?: number | null,
  height?: number | null,
): BmiStatus | null {
  if (!weight || !height) return null
  const bmi = weight / Math.pow(height / 100, 2)
  const bmiStr = bmi.toFixed(1)
  if (bmi < 18.5) return {
    bmi,
    color: '#f9c74f',
    label: 'Abaixo do peso',
    tooltip: `IMC ${bmiStr} — Abaixo do peso ideal. Considere aumentar a ingestão calórica com orientação profissional.`,
  }
  if (bmi < 25) return {
    bmi,
    color: 'var(--success)',
    label: 'Faixa saudável',
    tooltip: `IMC ${bmiStr} — Peso dentro da faixa saudável recomendada pela OMS. Continue assim!`,
  }
  if (bmi < 30) return {
    bmi,
    color: 'var(--warn)',
    label: 'Sobrepeso',
    tooltip: `IMC ${bmiStr} — Sobrepeso. Alimentação equilibrada e treino consistente ajudam a atingir o peso ideal.`,
  }
  return {
    bmi,
    color: 'var(--danger)',
    label: 'Obesidade',
    tooltip: `IMC ${bmiStr} — Acima do peso recomendado. Recomenda-se acompanhamento com profissional de saúde.`,
  }
}
```

- [ ] **Step 2: Importar o helper no ProfilePage**

Em `src/pages/ProfilePage.tsx`, adicione o import junto aos outros imports do topo:

```tsx
import { getBmiStatus } from '../lib/bmi'
```

- [ ] **Step 3: Substituir a lógica inline de `weightStatus`**

Em `src/pages/ProfilePage.tsx`, localize o bloco que começa em `const weightStatus = (() => {` (por volta da linha 169) e termina em `})()` (por volta da linha 193). Substitua **todo** esse bloco por uma única linha:

```tsx
  // Indicador de IMC (só quando peso E altura estão preenchidos)
  const weightStatus = getBmiStatus(profile?.weight, profile?.height)
```

Não altere mais nada — o JSX que usa `weightStatus.color`, `weightStatus.label` e `weightStatus.tooltip` continua igual.

- [ ] **Step 4: Verificar TypeScript**

Run: `npx tsc --noEmit`
Expected: zero erros.

- [ ] **Step 5: Commit**

```bash
git add src/lib/bmi.ts src/pages/ProfilePage.tsx
git commit -m "refactor(perfil): extrai logica de IMC para src/lib/bmi.ts (DRY)"
```

---

## Task 2: Tipos + serviço de estatísticas do painel

**Files:**
- Modify: `src/types/index.ts`
- Create: `src/services/admin.service.ts`

- [ ] **Step 1: Adicionar os tipos**

Em `src/types/index.ts`, adicione ao final do arquivo:

```ts
// --- Painel administrativo (Fase 9) ---

export interface AttentionStudent {
  id: string
  full_name: string
  reason: 'sem-ficha' | 'parado'
  /** dias desde o último treino concluído; null = nunca treinou */
  daysSinceLastWorkout: number | null
}

export interface AdminDashboardStats {
  totalStudents: number
  activeStudents: number
  /** sessões concluídas pelos alunos nos últimos 7 dias */
  sessionsThisWeek: number
  needAttention: AttentionStudent[]
}
```

- [ ] **Step 2: Criar o serviço**

Crie `src/services/admin.service.ts` com o conteúdo abaixo. Ele reaproveita `getAllStudents` / `getTrainerStudents` de `trainer.service` e faz a agregação em JavaScript (mesmo padrão de `history.service`).

```ts
import { supabase } from '../lib/supabase'
import { getAllStudents, getTrainerStudents } from './trainer.service'
import type { AdminDashboardStats, AttentionStudent, UserProfile } from '../types'

interface DashboardCtx {
  isSuperAdmin: boolean
  trainerId: string
}

const ATTENTION_DAYS = 7

/**
 * Estatísticas do painel do personal.
 * - super_admin: considera todos os alunos
 * - trainer: considera apenas os seus alunos (trainer_id = ele)
 */
export async function getAdminDashboardStats(ctx: DashboardCtx): Promise<AdminDashboardStats> {
  // 1. Alunos (ativos + inativos)
  const students: UserProfile[] = ctx.isSuperAdmin
    ? await getAllStudents()
    : await getTrainerStudents(ctx.trainerId)

  const activeStudents = students.filter((s) => s.is_active)
  const activeIds = activeStudents.map((s) => s.id)

  if (activeIds.length === 0) {
    return {
      totalStudents: students.length,
      activeStudents: 0,
      sessionsThisWeek: 0,
      needAttention: [],
    }
  }

  // 2. Fichas ativas dos alunos (para saber quem está SEM ficha)
  const { data: workoutsData, error: workoutsError } = await supabase
    .from('workouts')
    .select('user_id')
    .in('user_id', activeIds)
    .eq('is_active', true)
    .eq('is_template', false)
  if (workoutsError) throw new Error(workoutsError.message)
  const studentsWithWorkout = new Set((workoutsData ?? []).map((w: { user_id: string }) => w.user_id))

  // 3. Sessões concluídas dos alunos (cabeçalho apenas — RLS já libera para o trainer)
  const { data: logsData, error: logsError } = await supabase
    .from('workout_logs')
    .select('user_id, started_at')
    .in('user_id', activeIds)
    .not('finished_at', 'is', null)
    .order('started_at', { ascending: false })
  if (logsError) throw new Error(logsError.message)

  // Último treino por aluno + contagem da semana
  const lastWorkoutByStudent: Record<string, string> = {}
  const weekAgo = new Date()
  weekAgo.setDate(weekAgo.getDate() - ATTENTION_DAYS)
  let sessionsThisWeek = 0

  for (const row of (logsData ?? []) as { user_id: string; started_at: string }[]) {
    if (!lastWorkoutByStudent[row.user_id]) {
      lastWorkoutByStudent[row.user_id] = row.started_at
    }
    if (new Date(row.started_at) >= weekAgo) sessionsThisWeek++
  }

  // 4. Monta lista "precisam de atenção"
  const now = Date.now()
  const needAttention: AttentionStudent[] = []
  for (const s of activeStudents) {
    if (!studentsWithWorkout.has(s.id)) {
      needAttention.push({ id: s.id, full_name: s.full_name, reason: 'sem-ficha', daysSinceLastWorkout: null })
      continue
    }
    const last = lastWorkoutByStudent[s.id]
    if (!last) {
      needAttention.push({ id: s.id, full_name: s.full_name, reason: 'parado', daysSinceLastWorkout: null })
      continue
    }
    const days = Math.floor((now - new Date(last).getTime()) / 86400000)
    if (days >= ATTENTION_DAYS) {
      needAttention.push({ id: s.id, full_name: s.full_name, reason: 'parado', daysSinceLastWorkout: days })
    }
  }

  return {
    totalStudents: students.length,
    activeStudents: activeStudents.length,
    sessionsThisWeek,
    needAttention,
  }
}
```

- [ ] **Step 3: Verificar TypeScript**

Run: `npx tsc --noEmit`
Expected: zero erros.

- [ ] **Step 4: Commit**

```bash
git add src/types/index.ts src/services/admin.service.ts
git commit -m "feat(admin): servico de estatisticas do painel do personal"
```

---

## Task 3: Painel do personal no DashboardPage

**Files:**
- Modify: `src/pages/DashboardPage.tsx`

- [ ] **Step 1: Adicionar imports e estado**

Em `src/pages/DashboardPage.tsx`:

No import de `useAuth`, troque a desestruturação (linha ~48) para incluir `isSuperAdmin`:

```tsx
  const { profile, isManager, isSuperAdmin, trainerMode } = useAuth()
```

Adicione o import do serviço e do tipo junto aos outros imports do topo:

```tsx
import { getAdminDashboardStats } from '../services/admin.service'
import type { AdminDashboardStats } from '../types'
```

Adicione um estado novo logo após `const [loading, setLoading] = useState(true)`:

```tsx
  const [adminStats, setAdminStats] = useState<AdminDashboardStats | null>(null)
```

- [ ] **Step 2: Buscar as estatísticas quando em modo gestão**

Logo após o `useEffect` existente que carrega os dados do aluno, adicione um novo `useEffect`:

```tsx
  useEffect(() => {
    if (!profile?.id || !showAdminView) return
    setAdminStats(null)
    getAdminDashboardStats({ isSuperAdmin, trainerId: profile.id })
      .then(setAdminStats)
      .catch(() => setAdminStats(null))
  }, [profile?.id, showAdminView, isSuperAdmin])
```

- [ ] **Step 3: Substituir o card placeholder pelo painel real**

Localize o bloco `{showAdminView && ( ... )}` (por volta das linhas 125–144 — o card com "GERENCIE SUAS FICHAS"). Substitua **todo** esse bloco por:

```tsx
        {/* ════════ ADMIN: painel com números reais ════════ */}
        {showAdminView && (
          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.4 }}
          >
            {/* Cards de número */}
            <div className="forja-admin-stats" style={{ marginBottom: 20 }}>
              <div className="card">
                <div className="stat-label">ALUNOS</div>
                <div className="f-display" style={{ fontSize: 48, color: 'var(--accent)' }}>
                  {adminStats ? adminStats.totalStudents : '…'}
                </div>
                <div style={{ fontSize: 12, color: 'var(--text-dim)' }}>
                  {adminStats ? `${adminStats.activeStudents} ativos` : ' '}
                </div>
              </div>
              <div className="card">
                <div className="stat-label">TREINOS NA SEMANA</div>
                <div className="f-display" style={{ fontSize: 48, color: 'var(--text)' }}>
                  {adminStats ? adminStats.sessionsThisWeek : '…'}
                </div>
                <div style={{ fontSize: 12, color: 'var(--text-dim)' }}>últimos 7 dias</div>
              </div>
              <div
                className="card"
                style={{ borderLeft: adminStats && adminStats.needAttention.length > 0 ? '2px solid var(--warn)' : undefined }}
              >
                <div className="stat-label">PRECISAM DE ATENÇÃO</div>
                <div
                  className="f-display"
                  style={{ fontSize: 48, color: adminStats && adminStats.needAttention.length > 0 ? 'var(--warn)' : 'var(--text)' }}
                >
                  {adminStats ? adminStats.needAttention.length : '…'}
                </div>
                <div style={{ fontSize: 12, color: 'var(--text-dim)' }}>sem ficha ou parados</div>
              </div>
            </div>

            {/* Lista: precisam de atenção */}
            <div className="card" style={{ marginBottom: 20 }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 14 }}>
                <h2 className="card-title">PRECISAM DE ATENÇÃO</h2>
                <Link to="/admin/students" className="btn ghost">
                  Ver alunos <Icon name="arrow" size={14} />
                </Link>
              </div>
              {!adminStats ? (
                <div className="skeleton" style={{ height: 64, borderRadius: 14 }} />
              ) : adminStats.needAttention.length === 0 ? (
                <div style={{ padding: 20, textAlign: 'center', color: 'var(--text-dim)', fontSize: 13 }}>
                  🎉 Todos os alunos estão em dia!
                </div>
              ) : (
                <div className="col gap-2">
                  {adminStats.needAttention.map((s) => (
                    <button
                      key={s.id}
                      onClick={() => navigate(`/admin/students/${s.id}`)}
                      style={{
                        display: 'flex', alignItems: 'center', justifyContent: 'space-between',
                        gap: 12, padding: '12px 14px', textAlign: 'left',
                        background: 'var(--bg-2)', border: '1px solid var(--hairline)',
                        borderRadius: 'var(--r-2)', cursor: 'pointer', color: 'var(--text)',
                      }}
                    >
                      <span style={{ fontWeight: 600, fontSize: 14 }}>{s.full_name}</span>
                      <span
                        className="chip"
                        style={{ color: 'var(--warn)', borderColor: 'var(--warn)' }}
                      >
                        {s.reason === 'sem-ficha'
                          ? 'Sem ficha'
                          : s.daysSinceLastWorkout === null
                            ? 'Nunca treinou'
                            : `Parado há ${s.daysSinceLastWorkout} dias`}
                      </span>
                    </button>
                  ))}
                </div>
              )}
            </div>

            {/* Atalhos */}
            <div style={{ display: 'flex', gap: 10, flexWrap: 'wrap' }}>
              <Link to="/admin/students" className="btn">
                <Icon name="user" size={14} /> Alunos
              </Link>
              <Link to="/admin/workouts/new" className="btn primary">
                <Icon name="plus" size={14} /> Nova ficha
              </Link>
            </div>
          </motion.div>
        )}
```

- [ ] **Step 4: Adicionar o CSS do grid de stats**

No bloco `<style>{` ... `}</style>` no final do componente, adicione (logo após a regra de `.forja-dash-grid`):

```css
        .forja-admin-stats {
          display: grid;
          grid-template-columns: repeat(3, 1fr);
          gap: 14px;
        }
        @media (max-width: 768px) {
          .forja-admin-stats { grid-template-columns: 1fr; }
        }
```

- [ ] **Step 5: Verificar TypeScript**

Run: `npx tsc --noEmit`
Expected: zero erros.

- [ ] **Step 6: Commit**

```bash
git add src/pages/DashboardPage.tsx
git commit -m "feat(admin): painel do personal com estatisticas reais"
```

---

## Task 4: Biblioteca de exercícios

**Files:**
- Modify: `src/services/workout.service.ts`
- Create: `src/components/admin/ExerciseFormModal.tsx`
- Create: `src/pages/admin/ExerciseLibraryPage.tsx`
- Modify: `src/lib/navigation.ts`
- Modify: `src/App.tsx`

- [ ] **Step 1: Expandir `updateExercise` para aceitar nome e grupo**

Em `src/services/workout.service.ts`, localize a função `updateExercise` (por volta da linha 374) e substitua-a inteira por:

```ts
/** Atualiza um exercício da biblioteca (nome, grupo, descrição e/ou vídeo) */
export async function updateExercise(
  exerciseId: string,
  data: { name?: string; muscle_group?: string; description?: string; video_url?: string }
): Promise<void> {
  const updates: Record<string, unknown> = {}
  if (data.name !== undefined) updates.name = data.name.trim()
  if (data.muscle_group !== undefined) updates.muscle_group = data.muscle_group
  if (data.description !== undefined) updates.description = data.description.trim() || null
  if (data.video_url !== undefined) updates.video_url = data.video_url.trim() || null
  const { error } = await supabase
    .from('exercise_library')
    .update(updates)
    .eq('id', exerciseId)
  if (error) throw new Error(error.message)
}
```

> Apenas adicionamos os campos opcionais `name` e `muscle_group`. Chamadas antigas (que passam só `description`/`video_url`) continuam funcionando.

- [ ] **Step 2: Criar o modal de criar/editar exercício**

Crie `src/components/admin/ExerciseFormModal.tsx`:

```tsx
import { useState } from 'react'
import { motion, AnimatePresence } from 'motion/react'
import { useModalA11y } from '../../hooks/useModalA11y'
import { useAuth } from '../../context/AuthContext'
import { createExercise, updateExercise } from '../../services/workout.service'
import { MUSCLE_GROUP_LABELS } from '../../types'
import type { Exercise, MuscleGroup } from '../../types'

interface Props {
  /** quando presente, o modal está em modo edição */
  exercise?: Exercise | null
  isOpen: boolean
  onClose: () => void
  onSaved: () => void
}

const GROUPS = Object.entries(MUSCLE_GROUP_LABELS) as [MuscleGroup, string][]

export function ExerciseFormModal({ exercise, isOpen, onClose, onSaved }: Props) {
  const { profile } = useAuth()
  const isEditing = !!exercise
  const [name, setName] = useState(exercise?.name ?? '')
  const [group, setGroup] = useState<MuscleGroup>(exercise?.muscle_group ?? 'chest')
  const [description, setDescription] = useState(exercise?.description ?? '')
  const [videoUrl, setVideoUrl] = useState(exercise?.video_url ?? '')
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const { initialFocusRef } = useModalA11y(isOpen, onClose)

  const canSave = name.trim().length > 1

  async function handleSave() {
    if (!canSave || !profile) return
    setSaving(true)
    setError(null)
    try {
      if (isEditing && exercise) {
        await updateExercise(exercise.id, { name, muscle_group: group, description, video_url: videoUrl })
      } else {
        await createExercise({ name, muscle_group: group, description, video_url: videoUrl, createdBy: profile.id })
      }
      onSaved()
      onClose()
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Erro ao salvar')
    } finally {
      setSaving(false)
    }
  }

  return (
    <AnimatePresence>
      {isOpen && (
        <>
          <motion.div
            initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
            style={{ position: 'fixed', inset: 0, background: 'rgba(6,7,26,0.85)', backdropFilter: 'blur(8px)', zIndex: 50 }}
            onClick={onClose}
          />
          <motion.div
            initial={{ opacity: 0, y: 40, scale: 0.96 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 40, scale: 0.96 }}
            transition={{ type: 'spring', stiffness: 350, damping: 28 }}
            role="dialog" aria-modal="true" aria-labelledby="modal-exercise-title"
            style={{
              position: 'fixed', bottom: 0, left: 0, right: 0, zIndex: 51,
              background: 'var(--bg-1)', borderTop: '1px solid var(--border)',
              borderRadius: '16px 16px 0 0', padding: '24px 20px 40px',
              maxWidth: 560, margin: '0 auto', maxHeight: '88vh', overflowY: 'auto',
            }}
          >
            <div style={{ width: 36, height: 3, borderRadius: 2, background: 'var(--border-strong)', margin: '0 auto 20px' }} />
            <div className="eyebrow" style={{ color: 'var(--accent)', marginBottom: 6 }}>
              // {isEditing ? 'editar exercício' : 'novo exercício'}
            </div>
            <div id="modal-exercise-title" className="f-display" style={{ fontSize: 22, color: 'var(--text)', marginBottom: 20 }}>
              {isEditing ? 'Editar exercício' : 'Criar exercício'}
            </div>

            <div className="col gap-3">
              <div>
                <div className="label-sm" style={{ marginBottom: 6 }}>Nome</div>
                <input
                  ref={(el) => { initialFocusRef.current = el }}
                  className="input" value={name}
                  onChange={(e) => setName(e.target.value)} placeholder="Ex: Supino reto"
                />
              </div>
              <div>
                <div className="label-sm" style={{ marginBottom: 6 }}>Grupo muscular</div>
                <select className="input" value={group} onChange={(e) => setGroup(e.target.value as MuscleGroup)}>
                  {GROUPS.map(([value, label]) => (
                    <option key={value} value={value}>{label}</option>
                  ))}
                </select>
              </div>
              <div>
                <div className="label-sm" style={{ marginBottom: 6 }}>Descrição (opcional)</div>
                <textarea
                  className="input" value={description}
                  onChange={(e) => setDescription(e.target.value)} rows={3}
                  placeholder="Como executar, dicas de postura..."
                />
              </div>
              <div>
                <div className="label-sm" style={{ marginBottom: 6 }}>Link de vídeo (opcional)</div>
                <input
                  className="input" value={videoUrl}
                  onChange={(e) => setVideoUrl(e.target.value)} placeholder="https://..."
                />
              </div>
            </div>

            {error && (
              <div style={{ color: 'var(--danger)', fontSize: 12, marginTop: 12, fontFamily: 'var(--f-mono)' }}>⚠ {error}</div>
            )}

            <div className="row gap-2" style={{ marginTop: 20 }}>
              <button onClick={onClose} className="btn ghost" style={{ flex: 1 }}>Cancelar</button>
              <button onClick={handleSave} disabled={!canSave || saving} className="btn primary" style={{ flex: 2 }}>
                {saving ? 'Salvando...' : isEditing ? 'Salvar alterações' : 'Criar exercício'}
              </button>
            </div>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  )
}
```

- [ ] **Step 3: Criar a página da biblioteca**

Crie `src/pages/admin/ExerciseLibraryPage.tsx`:

```tsx
import { useEffect, useState } from 'react'
import { motion } from 'motion/react'
import { getExercises } from '../../services/workout.service'
import { Topbar } from '../../components/layout/Topbar'
import { Icon } from '../../components/ui/Icon'
import { ExerciseFormModal } from '../../components/admin/ExerciseFormModal'
import { MUSCLE_GROUP_LABELS } from '../../types'
import type { Exercise, MuscleGroup } from '../../types'

const GROUPS = Object.entries(MUSCLE_GROUP_LABELS) as [MuscleGroup, string][]

export function ExerciseLibraryPage() {
  const [exercises, setExercises] = useState<Exercise[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [search, setSearch] = useState('')
  const [groupFilter, setGroupFilter] = useState<MuscleGroup | 'all'>('all')
  const [modalOpen, setModalOpen] = useState(false)
  const [editing, setEditing] = useState<Exercise | null>(null)

  async function load() {
    setLoading(true)
    setError(null)
    try {
      setExercises(await getExercises())
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Erro ao carregar exercícios')
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => { void load() }, [])

  const filtered = exercises.filter((ex) => {
    const matchGroup = groupFilter === 'all' || ex.muscle_group === groupFilter
    const matchSearch = !search.trim() || ex.name.toLowerCase().includes(search.toLowerCase())
    return matchGroup && matchSearch
  })

  // Agrupa por grupo muscular
  const grouped = GROUPS
    .map(([group, label]) => ({ group, label, items: filtered.filter((ex) => ex.muscle_group === group) }))
    .filter((g) => g.items.length > 0)

  function openNew() { setEditing(null); setModalOpen(true) }
  function openEdit(ex: Exercise) { setEditing(ex); setModalOpen(true) }

  return (
    <>
      <Topbar
        eyebrow="CATÁLOGO"
        title="EXERCÍCIOS"
        actions={
          <button onClick={openNew} className="btn primary">
            <Icon name="plus" size={14} /> Novo exercício
          </button>
        }
      />

      <div className="content">
        {/* Busca */}
        <input
          className="input"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          placeholder="Buscar exercício pelo nome..."
          style={{ marginBottom: 12 }}
        />

        {/* Filtro por grupo (chips) */}
        <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap', marginBottom: 20 }}>
          <button
            onClick={() => setGroupFilter('all')}
            className={'chip' + (groupFilter === 'all' ? ' solid' : '')}
            style={{ cursor: 'pointer' }}
          >
            Todos
          </button>
          {GROUPS.map(([value, label]) => (
            <button
              key={value}
              onClick={() => setGroupFilter(value)}
              className={'chip' + (groupFilter === value ? ' solid' : '')}
              style={{ cursor: 'pointer' }}
            >
              {label}
            </button>
          ))}
        </div>

        {loading && (
          <div className="col gap-2">
            {[1, 2, 3, 4].map((i) => (
              <div key={i} className="skeleton" style={{ height: 56, borderRadius: 8 }} />
            ))}
          </div>
        )}

        {!loading && error && (
          <div className="card" style={{ borderLeft: '2px solid var(--danger)', background: 'rgba(255,61,85,0.05)' }}>
            <div style={{ color: 'var(--danger)', marginBottom: 8 }}>⚠ {error}</div>
            <button onClick={load} className="btn ghost">Tentar novamente</button>
          </div>
        )}

        {!loading && !error && filtered.length === 0 && (
          <div className="card" style={{ textAlign: 'center', padding: '32px 24px', borderStyle: 'dashed', color: 'var(--text-dim)' }}>
            Nenhum exercício encontrado.
          </div>
        )}

        {!loading && !error && grouped.map(({ group, label, items }) => (
          <motion.div
            key={group}
            initial={{ opacity: 0, y: 8 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.25 }}
            style={{ marginBottom: 24 }}
          >
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 10 }}>
              <h2 className="card-title">{label.toUpperCase()}</h2>
              <span className="chip">{items.length}</span>
            </div>
            <div className="col gap-2">
              {items.map((ex) => (
                <div
                  key={ex.id}
                  className="card"
                  style={{ padding: '12px 16px', display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 12 }}
                >
                  <div style={{ minWidth: 0 }}>
                    <div style={{ fontWeight: 600, fontSize: 14, color: 'var(--text)' }}>{ex.name}</div>
                    {ex.description && (
                      <div style={{ fontSize: 12, color: 'var(--text-dim)', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                        {ex.description}
                      </div>
                    )}
                  </div>
                  <button onClick={() => openEdit(ex)} className="btn ghost" style={{ fontSize: 11, padding: '6px 12px', flexShrink: 0 }}>
                    <Icon name="edit" size={12} /> Editar
                  </button>
                </div>
              ))}
            </div>
          </motion.div>
        ))}
      </div>

      <ExerciseFormModal
        key={editing?.id ?? 'new'}
        exercise={editing}
        isOpen={modalOpen}
        onClose={() => setModalOpen(false)}
        onSaved={load}
      />
    </>
  )
}
```

> O `key={editing?.id ?? 'new'}` força o modal a recriar o estado interno (campos) ao trocar entre criar e editar.

- [ ] **Step 4: Adicionar "Exercícios" à navegação de gestão**

Em `src/lib/navigation.ts`, dentro da função `gestao`, adicione o item **antes** do `list.push` do Perfil:

```ts
  list.push({ to: '/admin/exercises', label: 'Exercícios', icon: 'dumbbell', matches: (p) => p.startsWith('/admin/exercises') })
  list.push({ to: '/perfil', label: 'Perfil', icon: 'user' })
  return list
```

(Ou seja: o `list.push` de `/admin/exercises` fica logo acima do `list.push` de `/perfil` que já existe.)

- [ ] **Step 5: Registrar a rota**

Em `src/App.tsx`:

Adicione o import junto aos outros imports de páginas admin:

```tsx
import { ExerciseLibraryPage } from './pages/admin/ExerciseLibraryPage'
```

Dentro do bloco `<Route element={<AdminRoute />}>`, adicione:

```tsx
                  <Route path="/admin/exercises" element={<ExerciseLibraryPage />} />
```

- [ ] **Step 6: Verificar TypeScript**

Run: `npx tsc --noEmit`
Expected: zero erros.

- [ ] **Step 7: Commit**

```bash
git add src/services/workout.service.ts src/components/admin/ExerciseFormModal.tsx src/pages/admin/ExerciseLibraryPage.tsx src/lib/navigation.ts src/App.tsx
git commit -m "feat(admin): biblioteca de exercicios (listar, filtrar, criar, editar)"
```

---

## Task 5: Perfil do aluno — estrutura + abas de leitura + atribuir ficha

**Files:**
- Create: `src/components/admin/AssignToStudentModal.tsx`
- Create: `src/pages/admin/StudentDetailPage.tsx`
- Modify: `src/pages/admin/StudentsAdminPage.tsx`
- Modify: `src/App.tsx`

- [ ] **Step 1: Criar o modal "Atribuir ficha a este aluno"**

Crie `src/components/admin/AssignToStudentModal.tsx`. Lista os templates ativos e atribui o escolhido a este aluno (reusa `assignTemplateToStudent`). Também oferece criar uma ficha do zero (navega para o formulário com `?userId=`).

```tsx
import { useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { motion, AnimatePresence } from 'motion/react'
import { useModalA11y } from '../../hooks/useModalA11y'
import { useAuth } from '../../context/AuthContext'
import { getTemplates, assignTemplateToStudent } from '../../services/workout.service'
import { Icon } from '../ui/Icon'
import type { Workout } from '../../types'

interface Props {
  studentId: string
  studentName: string
  isOpen: boolean
  onClose: () => void
  onAssigned: () => void
}

export function AssignToStudentModal({ studentId, studentName, isOpen, onClose, onAssigned }: Props) {
  const navigate = useNavigate()
  const { profile } = useAuth()
  const [templates, setTemplates] = useState<Workout[]>([])
  const [loading, setLoading] = useState(false)
  const [assigning, setAssigning] = useState<string | null>(null)
  const [assigned, setAssigned] = useState<Set<string>>(new Set())
  const [error, setError] = useState<string | null>(null)
  const { initialFocusRef } = useModalA11y(isOpen, onClose)

  useEffect(() => {
    if (!isOpen) return
    setLoading(true)
    getTemplates()
      .then(setTemplates)
      .catch((e) => setError(e instanceof Error ? e.message : 'Erro ao carregar templates'))
      .finally(() => setLoading(false))
  }, [isOpen])

  async function handleAssign(template: Workout) {
    if (!profile) return
    setAssigning(template.id)
    setError(null)
    try {
      await assignTemplateToStudent(template.id, studentId, profile.id)
      setAssigned((prev) => new Set([...prev, template.id]))
      onAssigned()
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Erro ao atribuir ficha')
    } finally {
      setAssigning(null)
    }
  }

  return (
    <AnimatePresence>
      {isOpen && (
        <>
          <motion.div
            initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
            style={{ position: 'fixed', inset: 0, background: 'rgba(6,7,26,0.85)', backdropFilter: 'blur(8px)', zIndex: 50 }}
            onClick={onClose}
          />
          <motion.div
            initial={{ opacity: 0, y: 40, scale: 0.96 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 40, scale: 0.96 }}
            transition={{ type: 'spring', stiffness: 350, damping: 28 }}
            role="dialog" aria-modal="true" aria-labelledby="modal-assign2-title"
            style={{
              position: 'fixed', bottom: 0, left: 0, right: 0, zIndex: 51,
              background: 'var(--bg-1)', borderTop: '1px solid var(--border)',
              borderRadius: '16px 16px 0 0', padding: '24px 20px 40px',
              maxWidth: 560, margin: '0 auto', maxHeight: '88vh', overflowY: 'auto',
            }}
          >
            <div style={{ width: 36, height: 3, borderRadius: 2, background: 'var(--border-strong)', margin: '0 auto 20px' }} />
            <div className="eyebrow" style={{ color: 'var(--accent)', marginBottom: 6 }}>// atribuir ficha</div>
            <div id="modal-assign2-title" className="f-display" style={{ fontSize: 20, color: 'var(--text)', marginBottom: 4 }}>
              Atribuir ficha a {studentName}
            </div>

            <button
              ref={(el) => { initialFocusRef.current = el }}
              onClick={() => navigate(`/admin/workouts/new?userId=${studentId}`)}
              className="btn"
              style={{ width: '100%', marginTop: 16, marginBottom: 16, justifyContent: 'center' }}
            >
              <Icon name="plus" size={14} /> Criar ficha do zero
            </button>

            <div className="label-sm" style={{ marginBottom: 10 }}>Ou use um template da biblioteca</div>

            {error && <div style={{ color: 'var(--danger)', fontSize: 12, marginBottom: 10, fontFamily: 'var(--f-mono)' }}>⚠ {error}</div>}

            {loading ? (
              <div className="skeleton" style={{ height: 56, borderRadius: 8 }} />
            ) : templates.length === 0 ? (
              <div style={{ color: 'var(--text-dim)', fontSize: 13, fontStyle: 'italic', padding: '12px 0' }}>
                Nenhum template na biblioteca ainda.
              </div>
            ) : (
              <div className="col gap-2">
                {templates.map((t) => {
                  const isAssigned = assigned.has(t.id)
                  return (
                    <div
                      key={t.id}
                      style={{
                        display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 12,
                        padding: '12px 14px', background: 'var(--bg-2)',
                        border: '1px solid var(--hairline)', borderRadius: 'var(--r-2)',
                      }}
                    >
                      <span style={{ fontWeight: 600, fontSize: 14, color: 'var(--text)' }}>{t.name}</span>
                      <button
                        onClick={() => !isAssigned && handleAssign(t)}
                        disabled={isAssigned || assigning === t.id}
                        className={'btn ' + (isAssigned ? 'ghost' : 'primary')}
                        style={{ fontSize: 11, padding: '6px 12px', flexShrink: 0 }}
                      >
                        {assigning === t.id ? '...' : isAssigned ? <><Icon name="check" size={12} /> Atribuída</> : 'Atribuir'}
                      </button>
                    </div>
                  )
                })}
              </div>
            )}
          </motion.div>
        </>
      )}
    </AnimatePresence>
  )
}
```

- [ ] **Step 2: Criar a página de perfil do aluno (abas de leitura + atribuir)**

Crie `src/pages/admin/StudentDetailPage.tsx`. Nesta task as abas são **somente leitura** e a única ação ligada é **Atribuir ficha** (que já funciona com a RLS atual). Os botões Editar / Peso·Medidas / Resetar senha entram na Task 8.

```tsx
import { useEffect, useState } from 'react'
import { useParams, useNavigate, Link } from 'react-router-dom'
import { motion } from 'motion/react'
import { Topbar } from '../../components/layout/Topbar'
import { Icon } from '../../components/ui/Icon'
import { Avatar } from '../../components/ui/Avatar'
import { WeightChart } from '../../components/charts/WeightChart'
import { LoadProgressChart } from '../../components/charts/LoadProgressChart'
import { AssignToStudentModal } from '../../components/admin/AssignToStudentModal'
import { getProfile } from '../../services/profile.service'
import { getStudentWorkouts, deactivateWorkout } from '../../services/workout.service'
import { getWorkoutHistory, getCurrentStreak, getExercisesTrainedByUser, getLoadProgression } from '../../services/history.service'
import { getUserWeights, getBodyMeasurements } from '../../services/measurements.service'
import { getNutritionLogs, computeDailyTotals } from '../../services/nutrition.service'
import { getBmiStatus } from '../../lib/bmi'
import { DIFFICULTY_LABELS } from '../../types'
import type { UserProfile, Workout, WorkoutLog, UserWeight, BodyMeasurement, Exercise, LoadPoint, NutritionLog } from '../../types'

type TabKey = 'overview' | 'workouts' | 'progress' | 'nutrition'

const TABS: { key: TabKey; label: string }[] = [
  { key: 'overview', label: 'Visão geral' },
  { key: 'workouts', label: 'Treinos' },
  { key: 'progress', label: 'Evolução' },
  { key: 'nutrition', label: 'Nutrição' },
]

function formatDate(iso: string): string {
  return new Date(iso).toLocaleDateString('pt-BR', { day: '2-digit', month: 'short', year: 'numeric' })
}

export function StudentDetailPage() {
  const { id } = useParams<{ id: string }>()
  const navigate = useNavigate()
  const [student, setStudent] = useState<UserProfile | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [tab, setTab] = useState<TabKey>('overview')
  const [assignOpen, setAssignOpen] = useState(false)

  // dados por aba
  const [workouts, setWorkouts] = useState<Workout[]>([])
  const [streak, setStreak] = useState({ current: 0, longest: 0 })
  const [history, setHistory] = useState<WorkoutLog[]>([])
  const [weights, setWeights] = useState<UserWeight[]>([])
  const [measurements, setMeasurements] = useState<BodyMeasurement[]>([])
  const [trainedExercises, setTrainedExercises] = useState<Exercise[]>([])
  const [selectedExercise, setSelectedExercise] = useState<string>('')
  const [loadData, setLoadData] = useState<LoadPoint[]>([])
  const [nutritionLogs, setNutritionLogs] = useState<NutritionLog[]>([])

  // carga inicial: perfil + overview
  async function loadCore() {
    if (!id) return
    setLoading(true)
    setError(null)
    try {
      const [p, w, str] = await Promise.all([
        getProfile(id),
        getStudentWorkouts(id),
        getCurrentStreak(id),
      ])
      setStudent(p)
      setWorkouts(w)
      setStreak(str)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Erro ao carregar aluno')
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => { void loadCore() }, [id])

  // carregamento sob demanda por aba
  useEffect(() => {
    if (!id) return
    if (tab === 'workouts' && history.length === 0) {
      getWorkoutHistory(id).then(setHistory).catch(() => {})
    }
    if (tab === 'progress') {
      if (weights.length === 0) getUserWeights(id).then(setWeights).catch(() => {})
      if (measurements.length === 0) getBodyMeasurements(id).then(setMeasurements).catch(() => {})
      if (trainedExercises.length === 0) {
        getExercisesTrainedByUser(id).then((list) => {
          setTrainedExercises(list)
          if (list.length > 0) setSelectedExercise(list[0].id)
        }).catch(() => {})
      }
    }
    if (tab === 'nutrition' && nutritionLogs.length === 0) {
      const today = new Date().toISOString().substring(0, 10)
      getNutritionLogs(id, today).then(setNutritionLogs).catch(() => {})
    }
  }, [tab, id])

  // recarrega gráfico de carga ao trocar exercício
  useEffect(() => {
    if (!id || !selectedExercise) return
    getLoadProgression(id, selectedExercise).then(setLoadData).catch(() => setLoadData([]))
  }, [id, selectedExercise])

  async function handleRemoveWorkout(workoutId: string) {
    try {
      await deactivateWorkout(workoutId)
      setWorkouts((prev) => prev.filter((w) => w.id !== workoutId))
    } catch { /* silencioso */ }
  }

  const bmi = student ? getBmiStatus(student.weight, student.height) : null
  const lastWeight = weights[0]
  const lastMeasurement = measurements[0]
  const nutritionTotals = computeDailyTotals(nutritionLogs)

  return (
    <>
      <Topbar
        eyebrow="PERFIL DO ALUNO"
        title={student ? student.full_name.toUpperCase() : 'CARREGANDO...'}
        actions={
          <Link to="/admin/students" className="btn ghost">
            <Icon name="arrowL" size={14} /> Voltar
          </Link>
        }
      />

      <div className="content">
        {loading && <div className="skeleton" style={{ height: 200, borderRadius: 14 }} />}

        {!loading && error && (
          <div className="card" style={{ borderLeft: '2px solid var(--danger)', background: 'rgba(255,61,85,0.05)' }}>
            <div style={{ color: 'var(--danger)', marginBottom: 8 }}>⚠ {error}</div>
            <button onClick={loadCore} className="btn ghost">Tentar novamente</button>
          </div>
        )}

        {!loading && !error && student && (
          <>
            {/* Barra de ações */}
            <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap', marginBottom: 18 }}>
              <button onClick={() => setAssignOpen(true)} className="btn primary">
                <Icon name="plus" size={14} /> Atribuir ficha
              </button>
              {/* Editar / Peso·Medidas / Resetar senha: adicionados na Task 8 */}
            </div>

            {/* Abas */}
            <div style={{ display: 'flex', gap: 4, borderBottom: '1px solid var(--hairline)', marginBottom: 20, overflowX: 'auto' }}>
              {TABS.map((t) => (
                <button
                  key={t.key}
                  onClick={() => setTab(t.key)}
                  style={{
                    background: 'transparent', border: 'none', cursor: 'pointer',
                    padding: '10px 14px', fontSize: 13, fontWeight: 600, whiteSpace: 'nowrap',
                    color: tab === t.key ? 'var(--accent)' : 'var(--text-dim)',
                    borderBottom: tab === t.key ? '2px solid var(--accent)' : '2px solid transparent',
                  }}
                >
                  {t.label}
                </button>
              ))}
            </div>

            {/* ─── Aba: Visão geral ─── */}
            {tab === 'overview' && (
              <motion.div initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.25 }} className="col gap-3">
                <div className="card" style={{ display: 'flex', alignItems: 'center', gap: 16, flexWrap: 'wrap' }}>
                  <Avatar name={student.full_name} src={student.avatar_url} size="lg" />
                  <div style={{ minWidth: 0 }}>
                    <div className="f-display" style={{ fontSize: 28, color: 'var(--text)', lineHeight: 1 }}>
                      {student.full_name.toUpperCase()}
                    </div>
                    <div style={{ fontSize: 13, color: 'var(--text-dim)', marginTop: 4 }}>{student.email}</div>
                    {!student.is_active && (
                      <span className="chip danger" style={{ marginTop: 6 }}>INATIVO</span>
                    )}
                  </div>
                </div>

                {/* mini stats */}
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(120px, 1fr))', gap: 12 }}>
                  <div className="card">
                    <div className="stat-label">PESO ATUAL</div>
                    <div className="f-mono" style={{ fontSize: 22, color: bmi ? bmi.color : 'var(--text)', fontWeight: 700 }}>
                      {student.weight ? `${student.weight} kg` : '—'}
                    </div>
                    {bmi && <div style={{ fontSize: 10, color: bmi.color, fontFamily: 'var(--f-mono)', textTransform: 'uppercase' }}>{bmi.label}</div>}
                  </div>
                  <div className="card">
                    <div className="stat-label">STREAK</div>
                    <div className="f-display" style={{ fontSize: 32, color: 'var(--accent)' }}>{streak.current}<span className="stat-unit">dias</span></div>
                  </div>
                  <div className="card">
                    <div className="stat-label">OBJETIVO</div>
                    <div style={{ fontSize: 13, color: 'var(--text)' }}>{student.goal || '—'}</div>
                  </div>
                </div>

                {/* Fichas ativas */}
                <div className="card">
                  <h2 className="card-title" style={{ marginBottom: 12 }}>FICHAS ATIVAS</h2>
                  {workouts.length === 0 ? (
                    <div style={{ color: 'var(--text-dim)', fontSize: 13, fontStyle: 'italic' }}>Nenhuma ficha atribuída.</div>
                  ) : (
                    <div className="col gap-2">
                      {workouts.map((w) => (
                        <div key={w.id} style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 12, padding: '10px 12px', background: 'var(--bg-2)', borderRadius: 'var(--r-2)', border: '1px solid var(--hairline)' }}>
                          <div>
                            <div style={{ fontWeight: 600, fontSize: 14, color: 'var(--text)' }}>{w.name}</div>
                            <div style={{ fontSize: 11, color: 'var(--text-dim)' }}>{w.exercises?.length ?? 0} exercícios</div>
                          </div>
                          <button onClick={() => handleRemoveWorkout(w.id)} className="btn ghost" style={{ fontSize: 11, padding: '6px 10px', color: 'var(--danger)', borderColor: 'var(--danger)' }}>
                            Remover
                          </button>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              </motion.div>
            )}

            {/* ─── Aba: Treinos ─── */}
            {tab === 'workouts' && (
              <motion.div initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.25 }}>
                {history.length === 0 ? (
                  <div className="card" style={{ textAlign: 'center', padding: '32px 24px', borderStyle: 'dashed', color: 'var(--text-dim)' }}>
                    Nenhum treino registrado ainda.
                  </div>
                ) : (
                  <div className="col gap-2">
                    {history.map((log) => (
                      <Link
                        key={log.id}
                        to={`/historico/${log.id}`}
                        className="card"
                        style={{ textDecoration: 'none', display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 12 }}
                      >
                        <div>
                          <div className="f-display" style={{ fontSize: 20, color: 'var(--text)' }}>
                            {(log as WorkoutLog & { workout?: { name: string } }).workout?.name?.toUpperCase() ?? 'TREINO'}
                          </div>
                          <div style={{ fontSize: 12, color: 'var(--text-dim)', marginTop: 4 }}>{formatDate(log.started_at)}</div>
                        </div>
                        <div style={{ textAlign: 'right' }}>
                          <div className="f-display" style={{ fontSize: 22, color: 'var(--accent)' }}>
                            {log.duration_minutes ?? '—'}<span className="stat-unit">min</span>
                          </div>
                          {log.difficulty && <div style={{ fontSize: 11, color: 'var(--text-dim)' }}>{DIFFICULTY_LABELS[log.difficulty]}</div>}
                        </div>
                      </Link>
                    ))}
                  </div>
                )}
              </motion.div>
            )}

            {/* ─── Aba: Evolução ─── */}
            {tab === 'progress' && (
              <motion.div initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.25 }} className="col gap-3">
                <div className="card">
                  <h2 className="card-title" style={{ marginBottom: 12 }}>PESO {lastWeight ? `· ${Number(lastWeight.weight_kg).toFixed(1)} kg` : ''}</h2>
                  {weights.length === 0 ? (
                    <div style={{ color: 'var(--text-dim)', fontSize: 13, fontStyle: 'italic' }}>Nenhum peso registrado.</div>
                  ) : (
                    <WeightChart data={weights.slice(0, 20)} />
                  )}
                </div>

                <div className="card">
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 12, flexWrap: 'wrap', gap: 8 }}>
                    <h2 className="card-title">CARGA POR EXERCÍCIO</h2>
                    {trainedExercises.length > 0 && (
                      <select className="input" value={selectedExercise} onChange={(e) => setSelectedExercise(e.target.value)} style={{ maxWidth: 220 }}>
                        {trainedExercises.map((ex) => <option key={ex.id} value={ex.id}>{ex.name}</option>)}
                      </select>
                    )}
                  </div>
                  {trainedExercises.length === 0 ? (
                    <div style={{ color: 'var(--text-dim)', fontSize: 13, fontStyle: 'italic' }}>Sem dados de carga ainda.</div>
                  ) : loadData.length === 0 ? (
                    <div className="skeleton" style={{ height: 180, borderRadius: 8 }} />
                  ) : (
                    <LoadProgressChart data={loadData} exerciseName={trainedExercises.find((e) => e.id === selectedExercise)?.name ?? ''} />
                  )}
                </div>

                {lastMeasurement && (
                  <div className="card">
                    <h2 className="card-title" style={{ marginBottom: 12 }}>ÚLTIMAS MEDIDAS · {formatDate(lastMeasurement.measured_at)}</h2>
                    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(110px, 1fr))', gap: 10 }}>
                      {([['waist_cm', 'Cintura'], ['hip_cm', 'Quadril'], ['abdomen_cm', 'Abdômen'], ['chest_cm', 'Peitoral'], ['arm_cm', 'Braço'], ['thigh_cm', 'Coxa'], ['calf_cm', 'Panturrilha']] as [keyof BodyMeasurement, string][])
                        .filter(([k]) => lastMeasurement[k] != null)
                        .map(([k, label]) => (
                          <div key={k} style={{ background: 'var(--bg-2)', border: '1px solid var(--hairline)', borderRadius: 'var(--r-2)', padding: 12 }}>
                            <div className="stat-label" style={{ fontSize: 10 }}>{label}</div>
                            <div className="f-display" style={{ fontSize: 26, color: 'var(--text)' }}>{Number(lastMeasurement[k]).toFixed(1)}<span className="stat-unit" style={{ fontSize: 11 }}>cm</span></div>
                          </div>
                        ))}
                    </div>
                  </div>
                )}
              </motion.div>
            )}

            {/* ─── Aba: Nutrição ─── */}
            {tab === 'nutrition' && (
              <motion.div initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.25 }} className="col gap-3">
                <div className="card">
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 12 }}>
                    <h2 className="card-title">HOJE</h2>
                    <Link to={`/nutricao?userId=${student.id}`} className="btn ghost">
                      Ver diário <Icon name="arrow" size={14} />
                    </Link>
                  </div>
                  {nutritionLogs.length === 0 ? (
                    <div style={{ color: 'var(--text-dim)', fontSize: 13, fontStyle: 'italic' }}>Nenhuma refeição registrada hoje.</div>
                  ) : (
                    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: 10 }}>
                      <div><div className="stat-label">KCAL</div><div className="f-display" style={{ fontSize: 24, color: 'var(--accent)' }}>{Math.round(nutritionTotals.calories)}</div></div>
                      <div><div className="stat-label">PROT</div><div className="f-display" style={{ fontSize: 24, color: 'var(--text)' }}>{Math.round(nutritionTotals.protein_g)}g</div></div>
                      <div><div className="stat-label">CARB</div><div className="f-display" style={{ fontSize: 24, color: 'var(--info)' }}>{Math.round(nutritionTotals.carbs_g)}g</div></div>
                      <div><div className="stat-label">GORD</div><div className="f-display" style={{ fontSize: 24, color: 'var(--warn)' }}>{Math.round(nutritionTotals.fat_g)}g</div></div>
                    </div>
                  )}
                </div>
              </motion.div>
            )}
          </>
        )}
      </div>

      {student && (
        <AssignToStudentModal
          studentId={student.id}
          studentName={student.full_name}
          isOpen={assignOpen}
          onClose={() => setAssignOpen(false)}
          onAssigned={() => { void loadCore() }}
        />
      )}
    </>
  )
}
```

> **Verifique a prop `src` do `Avatar`:** se o componente `Avatar` usar outro nome para a URL da imagem (ex.: `url` ou `avatarUrl`), ajuste a linha `<Avatar name={...} src={student.avatar_url} size="lg" />` conforme a interface real. Confira `src/components/ui/Avatar.tsx` ao implementar.

- [ ] **Step 3: Tornar as linhas de alunos clicáveis**

Em `src/pages/admin/StudentsAdminPage.tsx`:

(a) Adicione `useNavigate` ao import do react-router (a linha 2 já importa `useNavigate`; confirme que está lá).

(b) Localize a interface `StudentRowProps` e o componente `StudentRow`. Adicione a prop `onOpen` e torne a área do nome clicável. Substitua a interface e a parte interna do `StudentRow` por:

```tsx
interface StudentRowProps {
  student: UserProfile
  inactive?: boolean
  onOpen: () => void
  onDeactivate?: () => void
  onActivate?: () => void
  onDelete: () => void
}

function StudentRow({ student, inactive, onOpen, onDeactivate, onActivate, onDelete }: StudentRowProps) {
  return (
    <div
      className="card"
      style={{
        padding: '14px 16px',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        opacity: inactive ? 0.6 : 1,
        gap: 12,
      }}
    >
      <button
        onClick={onOpen}
        style={{
          display: 'flex', alignItems: 'center', gap: 12, flex: 1, minWidth: 0,
          background: 'transparent', border: 'none', cursor: 'pointer', textAlign: 'left', color: 'inherit', padding: 0,
        }}
      >
        <div style={{
          width: 36, height: 36, borderRadius: 8,
          background: inactive ? 'var(--bg-3)' : 'rgba(212,255,58,0.1)',
          display: 'flex', alignItems: 'center', justifyContent: 'center',
          fontFamily: "'Outfit', sans-serif", fontWeight: 800, fontSize: 16,
          color: inactive ? 'var(--text-dim)' : 'var(--accent)', flexShrink: 0,
        }}>
          {student.full_name.charAt(0).toUpperCase()}
        </div>
        <div style={{ minWidth: 0 }}>
          <div style={{ fontWeight: 600, fontSize: 14, color: inactive ? 'var(--text-dim)' : 'var(--text)' }}>
            {student.full_name}
          </div>
          <div style={{ fontSize: 12, color: 'var(--text-dim)' }}>
            {student.email}
            {inactive && <span style={{ marginLeft: 8, color: 'var(--danger)', fontSize: 10, fontFamily: "'JetBrains Mono', monospace" }}>INATIVO</span>}
          </div>
        </div>
      </button>
      <div style={{ display: 'flex', gap: 6, flexShrink: 0 }}>
        {inactive ? (
          <button onClick={onActivate} className="btn ghost" style={{ fontSize: 11, padding: '6px 12px', color: 'var(--accent)' }}>
            Reativar
          </button>
        ) : (
          <button onClick={onDeactivate} className="btn ghost" style={{ fontSize: 11, padding: '6px 12px' }}>
            Desativar
          </button>
        )}
        <button onClick={onDelete} className="btn ghost" style={{ fontSize: 11, padding: '6px 12px', color: 'var(--danger)', borderColor: 'var(--danger)' }}>
          Excluir
        </button>
      </div>
    </div>
  )
}
```

(c) Nas duas chamadas de `<StudentRow ... />` (na lista de ativos e na de inativos), adicione a prop `onOpen`:

```tsx
                  <StudentRow
                    key={student.id}
                    student={student}
                    onOpen={() => navigate(`/admin/students/${student.id}`)}
                    onDeactivate={() => handleDeactivate(student.id)}
                    onDelete={() => handleDelete(student.id)}
                  />
```

e, na lista de inativos:

```tsx
                  <StudentRow
                    key={student.id}
                    student={student}
                    inactive
                    onOpen={() => navigate(`/admin/students/${student.id}`)}
                    onActivate={() => handleActivate(student.id)}
                    onDelete={() => handleDelete(student.id)}
                  />
```

- [ ] **Step 4: Registrar a rota**

Em `src/App.tsx`:

Adicione o import:

```tsx
import { StudentDetailPage } from './pages/admin/StudentDetailPage'
```

Dentro do bloco `<Route element={<AdminRoute />}>`, adicione (antes da rota `/admin/students/new` para boa ordem de leitura, mas a ordem não afeta o matching pois são paths distintos):

```tsx
                  <Route path="/admin/students/:id" element={<StudentDetailPage />} />
```

- [ ] **Step 5: Verificar TypeScript**

Run: `npx tsc --noEmit`
Expected: zero erros.

- [ ] **Step 6: Commit**

```bash
git add src/components/admin/AssignToStudentModal.tsx src/pages/admin/StudentDetailPage.tsx src/pages/admin/StudentsAdminPage.tsx src/App.tsx
git commit -m "feat(admin): perfil do aluno com abas (leitura) e atribuir ficha"
```

---

## Task 6: Patch v6 no banco (RLS) — ⚠️ PASSO MANUAL

**Files:**
- Modify: `supabase-setup.sql`

- [ ] **Step 1: Acrescentar o Patch v6 ao arquivo SQL**

Em `supabase-setup.sql`, adicione ao **final** do arquivo:

```sql
-- ============================================================
-- PATCH v6 — Painel administrativo (Fase 9)
-- Permite trainer/super_admin: editar dados do aluno, registrar
-- peso/medidas em nome do aluno, e LER as séries (exercise_logs)
-- dos seus alunos (necessário para detalhe de sessão e gráfico
-- de carga no perfil do aluno).
-- As políticas são PERMISSIVAS (somam-se às já existentes).
-- ============================================================

-- 1. Trainer/super_admin ATUALIZAM o perfil dos seus alunos.
--    WITH CHECK impede mudar role (continua 'user') e trainer_id
--    (continua o mesmo dono) — bloqueia escalonamento de permissão.
DROP POLICY IF EXISTS "profiles: trainer edita seus alunos" ON profiles;
CREATE POLICY "profiles: trainer edita seus alunos" ON profiles FOR UPDATE
  USING (
    is_super_admin()
    OR (role = 'user' AND trainer_id = auth.uid())
  )
  WITH CHECK (
    is_super_admin()
    OR (role = 'user' AND trainer_id = auth.uid())
  );

-- 2. Trainer/super_admin INSEREM peso para seus alunos.
DROP POLICY IF EXISTS "user_weights: trainer registra p/ aluno" ON user_weights;
CREATE POLICY "user_weights: trainer registra p/ aluno" ON user_weights FOR INSERT
  WITH CHECK (
    user_id = auth.uid()
    OR is_super_admin()
    OR user_id IN (SELECT id FROM profiles WHERE trainer_id = auth.uid())
  );

-- 3. Trainer/super_admin INSEREM medidas para seus alunos.
DROP POLICY IF EXISTS "body_measurements: trainer registra p/ aluno" ON body_measurements;
CREATE POLICY "body_measurements: trainer registra p/ aluno" ON body_measurements FOR INSERT
  WITH CHECK (
    user_id = auth.uid()
    OR is_super_admin()
    OR user_id IN (SELECT id FROM profiles WHERE trainer_id = auth.uid())
  );

-- 4. Trainer/super_admin LEEM as séries (exercise_logs) dos seus alunos.
DROP POLICY IF EXISTS "exercise_logs: trainer vê seus alunos" ON exercise_logs;
CREATE POLICY "exercise_logs: trainer vê seus alunos" ON exercise_logs FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM workout_logs wl
      JOIN profiles p ON p.id = wl.user_id
      WHERE wl.id = exercise_logs.workout_log_id
        AND (p.trainer_id = auth.uid() OR is_super_admin())
    )
  );
```

- [ ] **Step 2: ⚠️ AÇÃO MANUAL DO USUÁRIO — rodar o SQL no Supabase**

Pausar e pedir ao usuário (Denis):

> Abra o painel do Supabase → menu lateral **SQL Editor** → **New query**. Cole **apenas o bloco do Patch v6** acima e clique em **Run**. Deve aparecer "Success. No rows returned". Me avise quando terminar ("feito").

Aguardar confirmação antes de continuar.

- [ ] **Step 3: Commit (o arquivo SQL versionado)**

```bash
git add supabase-setup.sql
git commit -m "feat(db): patch v6 - RLS para trainer editar aluno, lancar peso/medidas e ler series"
```

---

## Task 7: Edge Function `manage-users` — ação `reset-password` — ⚠️ DEPLOY MANUAL

**Files:**
- Modify: `supabase/functions/manage-users/index.ts`

- [ ] **Step 1: Adicionar a ação `reset-password`**

Em `supabase/functions/manage-users/index.ts`, localize a linha:

```ts
    throw new Error(`Ação desconhecida: ${action}`)
```

**Antes** dessa linha, adicione o bloco:

```ts
    // ── RESETAR SENHA do aluno (super_admin ou trainer dono) ────────
    if (action === 'reset-password') {
      const { userId } = body
      if (!userId) throw new Error('userId é obrigatório')

      // Trainer só pode resetar a senha de seus próprios alunos
      if (isTrainer) {
        const { data: target } = await supabaseAdmin
          .from('profiles')
          .select('trainer_id, role')
          .eq('id', userId)
          .single()

        if (!target || target.trainer_id !== caller.id || target.role !== 'user') {
          throw new Error('Sem permissão para resetar a senha deste usuário')
        }
      }

      const { error: pwError } = await supabaseAdmin.auth.admin.updateUserById(userId, { password: '123456' })
      if (pwError) throw new Error(`Falha ao resetar senha: ${pwError.message}`)

      const { error: flagError } = await supabaseAdmin
        .from('profiles')
        .update({ must_change_password: true })
        .eq('id', userId)
      if (flagError) throw new Error(`Falha ao marcar troca de senha: ${flagError.message}`)

      return ok({})
    }
```

- [ ] **Step 2: ⚠️ AÇÃO MANUAL DO USUÁRIO — deploy da função**

Pausar e pedir ao usuário (Denis):

> No painel do Supabase → **Edge Functions** → função **manage-users** → atualize o código com esta versão e clique em **Deploy** (ou, se você usa a CLI, rode `supabase functions deploy manage-users`). Não precisa mexer em secrets — a função já usa as chaves padrão. Me avise quando terminar ("feito").

Aguardar confirmação antes de continuar.

- [ ] **Step 3: Commit**

```bash
git add supabase/functions/manage-users/index.ts
git commit -m "feat(edge): manage-users ganha acao reset-password"
```

---

## Task 8: Ações de escrita no perfil do aluno

> Depende das Tasks 6 e 7 (RLS + Edge Function). Adiciona os botões **Editar dados**, **Registrar peso/medidas** e **Resetar senha** ao `StudentDetailPage`.

**Files:**
- Modify: `src/services/trainer.service.ts`
- Create: `src/components/admin/StudentEditModal.tsx`
- Modify: `src/pages/admin/StudentDetailPage.tsx`

- [ ] **Step 1: Função `resetStudentPassword` no trainer.service**

Em `src/services/trainer.service.ts`, adicione ao final:

```ts
/**
 * Reseta a senha do aluno para a temporária padrão (123456) e força a troca
 * no próximo login. A operação ocorre na Edge Function manage-users (service role).
 */
export async function resetStudentPassword(studentId: string): Promise<void> {
  const { data, error } = await supabase.functions.invoke('manage-users', {
    body: { action: 'reset-password', userId: studentId },
  })
  if (error) {
    let msg = error.message
    try {
      const body = typeof data === 'object' && data !== null ? data as { error?: string } : await error.context?.json()
      if (body?.error) msg = body.error
    } catch { /* usa msg padrão */ }
    throw new Error(msg)
  }
}
```

- [ ] **Step 2: Modal de editar dados do aluno**

Crie `src/components/admin/StudentEditModal.tsx`. Edita apenas campos seguros via `updateProfile` (a RLS do Patch v6 garante que role/trainer_id não mudam).

```tsx
import { useState } from 'react'
import { motion, AnimatePresence } from 'motion/react'
import { useModalA11y } from '../../hooks/useModalA11y'
import { updateProfile } from '../../services/profile.service'
import type { UserProfile } from '../../types'

interface Props {
  student: UserProfile
  isOpen: boolean
  onClose: () => void
  onSaved: (updated: UserProfile) => void
}

export function StudentEditModal({ student, isOpen, onClose, onSaved }: Props) {
  const [fullName, setFullName] = useState(student.full_name)
  const [goal, setGoal] = useState(student.goal ?? '')
  const [height, setHeight] = useState(student.height ? String(student.height) : '')
  const [targetWeight, setTargetWeight] = useState(student.target_weight ? String(student.target_weight) : '')
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const { initialFocusRef } = useModalA11y(isOpen, onClose)

  const canSave = fullName.trim().length > 1

  async function handleSave() {
    if (!canSave) return
    setSaving(true)
    setError(null)
    try {
      const heightNum = parseFloat(height.replace(',', '.'))
      const targetNum = parseFloat(targetWeight.replace(',', '.'))
      const updated = await updateProfile(student.id, {
        full_name: fullName.trim(),
        goal: goal.trim() || undefined,
        height: isNaN(heightNum) ? undefined : heightNum,
        target_weight: isNaN(targetNum) ? undefined : targetNum,
      })
      onSaved(updated)
      onClose()
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Erro ao salvar')
    } finally {
      setSaving(false)
    }
  }

  return (
    <AnimatePresence>
      {isOpen && (
        <>
          <motion.div
            initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
            style={{ position: 'fixed', inset: 0, background: 'rgba(6,7,26,0.85)', backdropFilter: 'blur(8px)', zIndex: 50 }}
            onClick={onClose}
          />
          <motion.div
            initial={{ opacity: 0, y: 40, scale: 0.96 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 40, scale: 0.96 }}
            transition={{ type: 'spring', stiffness: 350, damping: 28 }}
            role="dialog" aria-modal="true" aria-labelledby="modal-student-edit-title"
            style={{
              position: 'fixed', bottom: 0, left: 0, right: 0, zIndex: 51,
              background: 'var(--bg-1)', borderTop: '1px solid var(--border)',
              borderRadius: '16px 16px 0 0', padding: '24px 20px 40px',
              maxWidth: 560, margin: '0 auto', maxHeight: '88vh', overflowY: 'auto',
            }}
          >
            <div style={{ width: 36, height: 3, borderRadius: 2, background: 'var(--border-strong)', margin: '0 auto 20px' }} />
            <div className="eyebrow" style={{ color: 'var(--accent)', marginBottom: 6 }}>// editar aluno</div>
            <div id="modal-student-edit-title" className="f-display" style={{ fontSize: 22, color: 'var(--text)', marginBottom: 20 }}>
              Editar dados
            </div>

            <div className="col gap-3">
              <div>
                <div className="label-sm" style={{ marginBottom: 6 }}>Nome completo</div>
                <input ref={(el) => { initialFocusRef.current = el }} className="input" value={fullName} onChange={(e) => setFullName(e.target.value)} />
              </div>
              <div>
                <div className="label-sm" style={{ marginBottom: 6 }}>Objetivo</div>
                <textarea className="input" value={goal} onChange={(e) => setGoal(e.target.value)} rows={2} placeholder="Ex: Ganhar massa muscular" />
              </div>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
                <div>
                  <div className="label-sm" style={{ marginBottom: 6 }}>Altura (cm)</div>
                  <input className="input" type="number" value={height} onChange={(e) => setHeight(e.target.value)} placeholder="175" />
                </div>
                <div>
                  <div className="label-sm" style={{ marginBottom: 6 }}>Peso alvo (kg)</div>
                  <input className="input" type="number" value={targetWeight} onChange={(e) => setTargetWeight(e.target.value)} placeholder="80" />
                </div>
              </div>
            </div>

            {error && <div style={{ color: 'var(--danger)', fontSize: 12, marginTop: 12, fontFamily: 'var(--f-mono)' }}>⚠ {error}</div>}

            <div className="row gap-2" style={{ marginTop: 20 }}>
              <button onClick={onClose} className="btn ghost" style={{ flex: 1 }}>Cancelar</button>
              <button onClick={handleSave} disabled={!canSave || saving} className="btn primary" style={{ flex: 2 }}>
                {saving ? 'Salvando...' : 'Salvar alterações'}
              </button>
            </div>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  )
}
```

- [ ] **Step 3: Ligar as ações no StudentDetailPage**

Em `src/pages/admin/StudentDetailPage.tsx`:

(a) Adicione os imports:

```tsx
import { WeightEntryModal } from '../../components/WeightEntryModal'
import { MeasurementEntryModal } from '../../components/MeasurementEntryModal'
import { StudentEditModal } from '../../components/admin/StudentEditModal'
import { ConfirmModal } from '../../components/ui/ConfirmModal'
import { addUserWeight, addBodyMeasurement } from '../../services/measurements.service'
import { resetStudentPassword } from '../../services/trainer.service'
```

(b) Adicione os estados (junto aos outros `useState` do componente):

```tsx
  const [editOpen, setEditOpen] = useState(false)
  const [weightOpen, setWeightOpen] = useState(false)
  const [measureOpen, setMeasureOpen] = useState(false)
  const [resetConfirm, setResetConfirm] = useState(false)
  const [toast, setToast] = useState<string | null>(null)
```

(c) Adicione o handler de reset (dentro do componente):

```tsx
  async function handleResetPassword() {
    if (!student) return
    setResetConfirm(false)
    try {
      await resetStudentPassword(student.id)
      setToast('Senha resetada para 123456. O aluno troca no próximo login.')
    } catch (err) {
      setToast(err instanceof Error ? err.message : 'Erro ao resetar senha')
    }
    setTimeout(() => setToast(null), 4000)
  }
```

(d) Na barra de ações, substitua o comentário `{/* Editar / Peso·Medidas / Resetar senha: adicionados na Task 8 */}` pelos botões:

```tsx
              <button onClick={() => setEditOpen(true)} className="btn">
                <Icon name="edit" size={14} /> Editar dados
              </button>
              <button onClick={() => setWeightOpen(true)} className="btn">
                <Icon name="scale" size={14} /> Registrar peso
              </button>
              <button onClick={() => setMeasureOpen(true)} className="btn">
                <Icon name="scale" size={14} /> Medidas
              </button>
              <button onClick={() => setResetConfirm(true)} className="btn ghost">
                <Icon name="settings" size={14} /> Resetar senha
              </button>
```

(e) Antes do fechamento final do componente (logo após o bloco `{student && (<AssignToStudentModal ... />)}`), adicione os modais e o toast:

```tsx
      {student && (
        <StudentEditModal
          student={student}
          isOpen={editOpen}
          onClose={() => setEditOpen(false)}
          onSaved={(updated) => setStudent(updated)}
        />
      )}

      {student && (
        <WeightEntryModal
          isOpen={weightOpen}
          lastWeight={student.weight}
          onClose={() => setWeightOpen(false)}
          onSaved={(w) => {
            setWeights((prev) => [w, ...prev])
            setStudent((prev) => prev ? { ...prev, weight: Number(w.weight_kg) } : prev)
          }}
          onSave={(kg, at) => addUserWeight(student.id, kg, at)}
        />
      )}

      {student && (
        <MeasurementEntryModal
          isOpen={measureOpen}
          onClose={() => setMeasureOpen(false)}
          onSaved={(m) => setMeasurements((prev) => [m, ...prev])}
          onSave={(data) => addBodyMeasurement(student.id, data)}
        />
      )}

      {resetConfirm && (
        <ConfirmModal
          title="Resetar senha do aluno"
          message="A senha será trocada para 123456 e o aluno precisará criar uma nova no próximo login. Confirmar?"
          confirmLabel="Resetar senha"
          danger
          onConfirm={handleResetPassword}
          onCancel={() => setResetConfirm(false)}
        />
      )}

      {toast && (
        <div
          style={{
            position: 'fixed', bottom: 24, left: '50%', transform: 'translateX(-50%)',
            zIndex: 2000, background: 'var(--bg-2)', border: '1px solid var(--border)',
            borderLeft: '2px solid var(--accent)', borderRadius: 'var(--r-2)',
            padding: '12px 18px', fontSize: 13, color: 'var(--text)', maxWidth: 'calc(100vw - 32px)',
          }}
        >
          {toast}
        </div>
      )}
```

> Observação: como `weightStatus`/peso do `student` é atualizado no estado após registrar peso, o card "PESO ATUAL" da Visão geral reflete o novo valor automaticamente.

- [ ] **Step 4: Verificar TypeScript**

Run: `npx tsc --noEmit`
Expected: zero erros.

- [ ] **Step 5: Commit**

```bash
git add src/services/trainer.service.ts src/components/admin/StudentEditModal.tsx src/pages/admin/StudentDetailPage.tsx
git commit -m "feat(admin): editar dados, registrar peso/medidas e resetar senha no perfil do aluno"
```

---

## Task 9: Verificação final, documentação e push

**Files:**
- Modify: `Plan.md`
- Modify: `CLAUDE.md`

- [ ] **Step 1: Build de produção**

Run: `npm run build`
Expected: `✓ built in X.XXs` sem erros de TypeScript nem do bundler.

- [ ] **Step 2: Teste manual (roteiro)**

Faça login como personal (modo gestão) e confira:

1. **Painel:** a tela inicial mostra 3 números (Alunos, Treinos na semana, Precisam de atenção) e a lista de alunos que precisam de atenção. Clicar num item abre o perfil do aluno.
2. **Lista de alunos:** clicar na área do nome de um aluno abre `/admin/students/:id`.
3. **Perfil — abas:** Visão geral (dados + IMC + fichas), Treinos (histórico; clicar abre o detalhe da sessão com as séries), Evolução (gráfico de peso + gráfico de carga por exercício + medidas), Nutrição (resumo de hoje + link "Ver diário").
4. **Ações:** Atribuir ficha (template ou criar do zero), Editar dados (salva nome/objetivo/altura/peso alvo), Registrar peso (aparece no gráfico e atualiza o card), Medidas, Resetar senha (mostra confirmação e o toast de sucesso).
5. **Biblioteca de exercícios** (`/admin/exercises`): filtra por grupo, busca por nome, cria e edita exercício.

> Se algo no perfil do aluno não carregar (detalhe de sessão, gráfico de carga) ou der erro de permissão ao editar/registrar, confirme que o **Patch v6 (Task 6)** foi rodado e que a **Edge Function (Task 7)** foi deployada.

- [ ] **Step 3: Atualizar Plan.md**

Em `Plan.md`, na tabela "Estado atual do projeto", troque a linha da Fase 9 para:

```
| 9 | Painel admin (gestão de alunos) | ✅ Completa |
```

- [ ] **Step 4: Atualizar CLAUDE.md**

Em `CLAUDE.md`:

(a) Na linha de fases concluídas, acrescente a fase 9. Troque:

```
**Fases concluídas:** 1, 2, 3, 4, 4.5 (Design System), 5 (Fichas de Treino), 6 (Execução de Treino), 7 (Histórico e Progressão), 8 (Nutrição + IA com Groq/Llama)  
**Próxima fase:** 9 — Painel Administrativo
```

por:

```
**Fases concluídas:** 1, 2, 3, 4, 4.5 (Design System), 5 (Fichas de Treino), 6 (Execução de Treino), 7 (Histórico e Progressão), 8 (Nutrição + IA com Groq/Llama), 9 (Painel Administrativo)  
**Próxima fase:** 10 — Polish + PWA
```

(b) Na tabela "Rotas do App", adicione duas linhas (na seção admin):

```
| `/admin/students/:id` | StudentDetailPage | admin |
| `/admin/exercises` | ExerciseLibraryPage | admin |
```

- [ ] **Step 5: Commit e push**

```bash
git add Plan.md CLAUDE.md
git commit -m "docs: marca Fase 9 (painel administrativo) como concluida"
git push
```

---

## Resumo dos passos manuais (para o usuário)

Durante a execução, **dois momentos** vão exigir sua ação no painel do Supabase:

1. **Task 6 — Patch v6 (SQL):** colar o bloco SQL no *SQL Editor* e rodar.
2. **Task 7 — Edge Function:** atualizar e dar *Deploy* na função `manage-users`.

Sem esses dois passos, **ver/atribuir ficha** funciona, mas **editar dados, registrar peso/medidas, resetar senha, ver detalhe de sessão e gráfico de carga do aluno** não funcionam.
