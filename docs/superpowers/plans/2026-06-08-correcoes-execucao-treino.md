# Correções e Melhorias na Execução de Treino — Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Corrigir 7 bugs e melhorias identificados durante uso real no mobile: timer sem botões, layout mobile fixo, séries editáveis após conclusão, pré-preenchimento correto entre exercícios, observações visíveis, descrição editável pelo admin e modo de edição no histórico.

**Architecture:** Todas as mudanças são cirúrgicas — sem novos componentes, sem nova estrutura de rotas. As correções ficam nos arquivos já existentes. Dois novos service functions são adicionados a `workout-log.service.ts` para suportar updates no banco.

**Tech Stack:** React 19, TypeScript, Supabase, Motion

---

## Mapa de arquivos impactados

| Arquivo | Tarefas |
|---------|---------|
| `src/services/workout-log.service.ts` | 1, 6, 7 |
| `src/pages/WorkoutSessionPage.tsx` | 2, 3, 4, 5, 6 |
| `src/pages/admin/WorkoutFormPage.tsx` | 7 |
| `src/pages/SessionDetailPage.tsx` | 8 |

---

## Tarefa 1 — Adicionar funções de update ao serviço de treino

**Arquivo:** `src/services/workout-log.service.ts`

Adicionar três novas funções ao final do arquivo. Estas funções serão usadas nas Tarefas 6 e 8.

- [ ] **Passo 1: Adicionar as três funções ao final de `workout-log.service.ts`**

Adicionar após a função `deleteWorkoutSession`:

```typescript
// ─────────────────────────────────────────────
// Atualizar série já registrada
// ─────────────────────────────────────────────

/**
 * Atualiza reps e carga de uma série já registrada.
 * Identificada por workout_log_id + exercise_id + set_number (único por sessão).
 */
export async function updateExerciseSet(
  workoutLogId: string,
  exerciseId: string,
  setNumber: number,
  data: { repsCompleted: number; loadKg: number | null }
): Promise<void> {
  const { error } = await supabase
    .from('exercise_logs')
    .update({
      reps_completed: data.repsCompleted,
      load_kg: data.loadKg ?? 0,
    })
    .eq('workout_log_id', workoutLogId)
    .eq('exercise_id', exerciseId)
    .eq('set_number', setNumber)

  if (error) throw new Error(error.message)
}

// ─────────────────────────────────────────────
// Atualizar sessão no histórico
// ─────────────────────────────────────────────

/**
 * Atualiza duração, dificuldade e notas de uma sessão finalizada.
 * Usado pelo modo de edição em SessionDetailPage.
 */
export async function updateWorkoutLog(
  logId: string,
  data: { durationMinutes: number; difficulty: string; notes: string }
): Promise<void> {
  const { error } = await supabase
    .from('workout_logs')
    .update({
      duration_minutes: Math.round(data.durationMinutes),
      difficulty: data.difficulty || null,
      notes: data.notes || null,
    })
    .eq('id', logId)

  if (error) throw new Error(error.message)
}

/**
 * Atualiza reps e carga de uma série no histórico, pelo ID da linha.
 * Os IDs são carregados com a sessão em SessionDetailPage.
 */
export async function updateExerciseLog(
  logId: string,
  data: { repsCompleted: number; loadKg: number | null }
): Promise<void> {
  const { error } = await supabase
    .from('exercise_logs')
    .update({
      reps_completed: data.repsCompleted,
      load_kg: data.loadKg ?? 0,
    })
    .eq('id', logId)

  if (error) throw new Error(error.message)
}
```

- [ ] **Passo 2: Verificar TypeScript**

```bash
npx tsc --noEmit
```

Esperado: zero erros.

- [ ] **Passo 3: Commit**

```bash
git add src/services/workout-log.service.ts
git commit -m "feat(service): adiciona updateExerciseSet, updateWorkoutLog e updateExerciseLog"
```

---

## Tarefa 2 — Corrigir pré-preenchimento entre exercícios (bug de key React)

**Arquivo:** `src/pages/WorkoutSessionPage.tsx` — componente `SetList` (≈ linha 1022)

Quando o aluno troca de exercício, o React reutiliza os componentes `SetRow` (mesmo `key={setNumber}`) e mantém o estado do exercício anterior. Basta incluir o ID do exercício na key para forçar remontagem.

- [ ] **Passo 1: Alterar key em `SetList`**

Localizar no componente `SetList` o trecho onde `sets.map` renderiza os `SetRow`:

```typescript
// ANTES — buscar esta linha:
          key={setNumber}
// DEPOIS — substituir por:
          key={`${ex.id}-${setNumber}`}
```

O trecho completo ao redor da linha fica:

```tsx
{sets.map((setNumber) => {
  const isDone = setNumber <= exDoneCount
  const isCurrent = setNumber === exDoneCount + 1
  return (
    <SetRow
      key={`${ex.id}-${setNumber}`}   // ← alterado
      setNumber={setNumber}
      isDone={isDone}
      isCurrent={isCurrent}
      suggestedReps={ex.reps}
      suggestedLoad={ex.suggested_load ?? null}
      lastReps={lastSetData[exId]?.[setNumber]?.reps}
      lastLoad={lastSetData[exId]?.[setNumber]?.loadKg}
      onComplete={(reps, load) => onSetComplete(ex, setNumber, reps, load)}
    />
  )
})}
```

- [ ] **Passo 2: Verificar TypeScript**

```bash
npx tsc --noEmit
```

Esperado: zero erros.

- [ ] **Passo 3: Commit**

```bash
git add src/pages/WorkoutSessionPage.tsx
git commit -m "fix(treino): corrige contaminacao de estado entre exercicios (key com ex.id)"
```

---

## Tarefa 3 — Remover botões de controle do timer de descanso

**Arquivo:** `src/pages/WorkoutSessionPage.tsx` — interfaces e componentes LayoutA e LayoutB

Remover `onAdjustTimer` e `onSkipTimer` das interfaces e de todos os lugares onde são usados. A função `skipTimer` permanece como função interna do componente pai (ainda usada ao terminar todos os exercícios).

- [ ] **Passo 1: Remover props das interfaces**

Localizar `interface LayoutACommonProps` e remover as duas linhas:

```typescript
// REMOVER estas duas linhas da interface LayoutACommonProps:
  onAdjustTimer: (delta: number) => void
  onSkipTimer: () => void
```

A interface final fica:

```typescript
interface LayoutACommonProps {
  exercises: WorkoutExercise[]
  currentExercise: WorkoutExercise
  setsCompleted: Record<string, number>
  lastSetData: Record<string, Record<number, LastSetRecord>>
  onSetComplete: (ex: WorkoutExercise, setNumber: number, reps: number, loadKg: number | null) => void
  timerSeconds: number
  isTimerRunning: boolean
}
```

Localizar `interface LayoutBProps extends LayoutACommonProps` — como estende LayoutACommonProps, não tem props extras a remover.

- [ ] **Passo 2: Remover props da desestruturação em LayoutA**

Localizar a desestruturação no início da função `LayoutA` e remover `onAdjustTimer` e `onSkipTimer`:

```typescript
// ANTES:
  const {
    workout, currentIdx, setCurrentIdx, exercises, currentExercise,
    setsCompleted, lastSetData, onSetComplete,
    timerSeconds, isTimerRunning, onAdjustTimer, onSkipTimer,
    exercisesDone, totalSets,
  } = props

// DEPOIS:
  const {
    workout, currentIdx, setCurrentIdx, exercises, currentExercise,
    setsCompleted, lastSetData, onSetComplete,
    timerSeconds, isTimerRunning,
    exercisesDone, totalSets,
  } = props
```

- [ ] **Passo 3: Remover botões do painel direito do LayoutA**

Localizar no painel direito de LayoutA (card de descanso) o div com os botões e removê-lo inteiro:

```tsx
// REMOVER este bloco inteiro (fica dentro do card card-accent de Descanso):
          <div style={{ display: 'flex', gap: 8, marginTop: 14 }}>
            <button
              onClick={() => onAdjustTimer(15)}
              className="btn"
              style={{ background: '#0a0a0a', color: 'var(--accent)', borderColor: '#0a0a0a', flex: 1, justifyContent: 'center' }}
            >
              +15s
            </button>
            <button
              onClick={onSkipTimer}
              className="btn"
              style={{ background: '#0a0a0a', color: 'var(--accent)', borderColor: '#0a0a0a', flex: 1, justifyContent: 'center' }}
            >
              {isTimerRunning ? 'Pular' : 'Pronto'}
            </button>
          </div>
```

- [ ] **Passo 4: Remover props da desestruturação em LayoutB**

```typescript
// ANTES:
  const {
    currentIdx, exercises, currentExercise,
    setsCompleted, lastSetData, onSetComplete,
    timerSeconds, onAdjustTimer, onSkipTimer,
  } = props

// DEPOIS:
  const {
    currentIdx, exercises, currentExercise,
    setsCompleted, lastSetData, onSetComplete,
    timerSeconds,
  } = props
```

- [ ] **Passo 5: Remover botões do hero timer do LayoutB**

Localizar no bloco `.forja-treino-b-timer` o div com os botões e removê-lo inteiro:

```tsx
// REMOVER este bloco inteiro (está dentro de .forja-treino-b-timer):
          <div style={{ display: 'flex', gap: 10, marginTop: 18, position: 'relative' }}>
            <button onClick={() => onAdjustTimer(-15)} className="btn">-15s</button>
            <button onClick={() => onAdjustTimer(15)} className="btn">+15s</button>
            <button onClick={onSkipTimer} className="btn primary">
              <Icon name="play" size={12} /> Pular
            </button>
          </div>
```

- [ ] **Passo 6: Remover props nas chamadas de LayoutA e LayoutB no render principal**

Localizar onde `<LayoutA ... />` e `<LayoutB ... />` são chamados (dentro do return do WorkoutSessionPage) e remover `onAdjustTimer={adjustTimer}` e `onSkipTimer={skipTimer}` de ambos:

```tsx
// LayoutA — remover as duas linhas:
          onAdjustTimer={adjustTimer}
          onSkipTimer={skipTimer}

// LayoutB — remover as duas linhas:
          onAdjustTimer={adjustTimer}
          onSkipTimer={skipTimer}
```

- [ ] **Passo 7: Remover a função `adjustTimer` (não é mais usada)**

Localizar e remover a função `adjustTimer` do WorkoutSessionPage:

```typescript
// REMOVER esta função inteira:
  function adjustTimer(delta: number) {
    setTimerSeconds((s) => Math.max(0, s + delta))
    if (!isTimerRunning && timerSeconds + delta > 0) setIsTimerRunning(true)
  }
```

- [ ] **Passo 8: Verificar TypeScript**

```bash
npx tsc --noEmit
```

Esperado: zero erros.

- [ ] **Passo 9: Commit**

```bash
git add src/pages/WorkoutSessionPage.tsx
git commit -m "fix(treino): remove botoes de controle do timer de descanso"
```

---

## Tarefa 4 — Ocultar botão de troca de layout no mobile

**Arquivo:** `src/pages/WorkoutSessionPage.tsx` — estado `layout` e botão na topbar

- [ ] **Passo 1: Forçar Layout A em dispositivos mobile na inicialização**

Localizar o `useState<Layout>` (início do componente, antes dos outros estados) e adicionar o check de largura de tela:

```typescript
// ANTES:
  const [layout, setLayout] = useState<Layout>(() => {
    const v = localStorage.getItem('forja-workout-layout')
    return v === 'B' ? 'B' : 'A'
  })

// DEPOIS:
  const [layout, setLayout] = useState<Layout>(() => {
    if (typeof window !== 'undefined' && window.innerWidth <= 768) return 'A'
    const v = localStorage.getItem('forja-workout-layout')
    return v === 'B' ? 'B' : 'A'
  })
```

- [ ] **Passo 2: Ocultar o botão de troca de layout no mobile**

Localizar o botão de troca de layout na topbar (o `<button>` com `aria-label="Trocar para layout..."`) e adicionar a className `forja-layout-toggle`:

```tsx
// ANTES:
          <button
            className="btn ghost"
            onClick={() => setLayout((l) => (l === 'A' ? 'B' : 'A'))}
            aria-label={`Trocar para layout ${layout === 'A' ? 'B' : 'A'}`}
            style={
              layout === 'B'
                ? { background: 'transparent', color: '#0a0a0a', borderColor: 'rgba(0,0,0,0.3)' }
                : undefined
            }
          >
            LAYOUT {layout === 'A' ? 'B' : 'A'}
          </button>

// DEPOIS — adicionar className="btn ghost forja-layout-toggle":
          <button
            className="btn ghost forja-layout-toggle"
            onClick={() => setLayout((l) => (l === 'A' ? 'B' : 'A'))}
            aria-label={`Trocar para layout ${layout === 'A' ? 'B' : 'A'}`}
            style={
              layout === 'B'
                ? { background: 'transparent', color: '#0a0a0a', borderColor: 'rgba(0,0,0,0.3)' }
                : undefined
            }
          >
            LAYOUT {layout === 'A' ? 'B' : 'A'}
          </button>
```

- [ ] **Passo 3: Adicionar regra CSS no final do arquivo**

O WorkoutSessionPage tem blocos `<style>` dentro de LayoutA e LayoutB. Adicionar a regra `.forja-layout-toggle` no bloco `<style>` de LayoutA (que já tem `@media (max-width: 1100px)`):

```tsx
// Dentro do bloco <style> existente em LayoutA, adicionar a regra:
        @media (max-width: 768px) {
          .forja-layout-toggle { display: none !important; }
        }
```

O bloco `<style>` de LayoutA fica assim:

```tsx
      <style>{`
        .forja-treino-a { gap: 24px; }
        .forja-treino-list { width: 280px; flex-shrink: 0; }
        .forja-treino-side { width: 300px; flex-shrink: 0; }
        .forja-treino-exhead { display: flex; align-items: stretch; }
        .forja-treino-thumb { width: 220px; height: 220px; border-radius: 0; flex-shrink: 0; }
        .forja-treino-exname { font-size: 48px; margin: 4px 0 0; color: var(--text); line-height: 0.95; }
        .forja-treino-stats { margin-top: auto; display: flex; gap: 28px; padding-top: 18px; border-top: 1px solid var(--hairline); flex-wrap: wrap; }

        @media (max-width: 1100px) {
          .forja-treino-a { flex-direction: column !important; }
          .forja-treino-list, .forja-treino-side { width: 100% !important; }
          .forja-treino-thumb { display: none; }
          .forja-treino-exname { font-size: 36px; }
        }

        @media (max-width: 768px) {
          .forja-layout-toggle { display: none !important; }
        }
      `}</style>
```

- [ ] **Passo 4: Verificar TypeScript**

```bash
npx tsc --noEmit
```

Esperado: zero erros.

- [ ] **Passo 5: Commit**

```bash
git add src/pages/WorkoutSessionPage.tsx
git commit -m "fix(treino): oculta botao de layout no mobile e forca Layout A em telas pequenas"
```

---

## Tarefa 5 — Exibir observações do exercício na tela de treino

**Arquivo:** `src/pages/WorkoutSessionPage.tsx` — LayoutA e LayoutB

O campo `ex.notes` (observações que o admin coloca em cada exercício da ficha, como "1 aquec + 2 feeders antes") existe mas não é exibido durante o treino.

- [ ] **Passo 1: Adicionar notas no cabeçalho do exercício em LayoutA**

No LayoutA, localizar o bloco de chips do exercício (após os `<span className="chip">` de séries, reps e descanso) e adicionar logo abaixo:

```tsx
// Adicionar após o div dos chips (o que contém ex.exercise?.muscle_group, séries, reps, desc.):
                  {ex.notes && (
                    <div
                      style={{
                        marginTop: 10,
                        padding: '7px 12px',
                        background: 'rgba(212,255,58,0.06)',
                        borderLeft: '2px solid var(--accent)',
                        borderRadius: '0 var(--r-1) var(--r-1) 0',
                        fontSize: 12,
                        color: 'var(--text-dim)',
                        fontStyle: 'italic',
                        lineHeight: 1.5,
                      }}
                    >
                      {ex.notes}
                    </div>
                  )}
```

- [ ] **Passo 2: Adicionar notas no bloco de info do LayoutB**

No LayoutB, localizar a `<h1 className="f-display forja-treino-b-exname">` e adicionar o bloco de notas logo após ela:

```tsx
// Localizar:
            <h1 className="f-display forja-treino-b-exname">
              {(ex.exercise?.name ?? 'Exercício').toUpperCase()}
            </h1>

// Adicionar imediatamente após o </h1>:
            {ex.notes && (
              <div
                style={{
                  marginTop: 10,
                  padding: '7px 12px',
                  background: 'rgba(212,255,58,0.06)',
                  borderLeft: '2px solid var(--accent)',
                  borderRadius: '0 var(--r-1) var(--r-1) 0',
                  fontSize: 12,
                  color: 'var(--text-dim)',
                  fontStyle: 'italic',
                  lineHeight: 1.5,
                }}
              >
                {ex.notes}
              </div>
            )}
```

- [ ] **Passo 3: Verificar TypeScript**

```bash
npx tsc --noEmit
```

Esperado: zero erros.

- [ ] **Passo 4: Commit**

```bash
git add src/pages/WorkoutSessionPage.tsx
git commit -m "feat(treino): exibe observacoes do exercicio durante execucao do treino"
```

---

## Tarefa 6 — Permitir edição de séries já concluídas

**Arquivo:** `src/pages/WorkoutSessionPage.tsx` — interfaces `SetListProps`, `SetRowProps`, componentes `SetList` e `SetRow`; importar `updateExerciseSet` de `workout-log.service.ts`

- [ ] **Passo 1: Adicionar import de `updateExerciseSet`**

No topo de `WorkoutSessionPage.tsx`, localizar o import do serviço:

```typescript
// ANTES:
import {
  startWorkoutSession,
  logExerciseSet,
  finishWorkoutSession,
  deleteWorkoutSession,
} from '../services/workout-log.service'

// DEPOIS:
import {
  startWorkoutSession,
  logExerciseSet,
  updateExerciseSet,
  finishWorkoutSession,
  deleteWorkoutSession,
} from '../services/workout-log.service'
```

- [ ] **Passo 2: Adicionar `onSetUpdate` à interface `SetListProps`**

```typescript
// ANTES:
interface SetListProps {
  ex: WorkoutExercise
  exDoneCount: number
  lastSetData: Record<string, Record<number, LastSetRecord>>
  onSetComplete: (ex: WorkoutExercise, setNumber: number, reps: number, loadKg: number | null) => void
  embedded?: boolean
}

// DEPOIS:
interface SetListProps {
  ex: WorkoutExercise
  exDoneCount: number
  lastSetData: Record<string, Record<number, LastSetRecord>>
  onSetComplete: (ex: WorkoutExercise, setNumber: number, reps: number, loadKg: number | null) => void
  onSetUpdate: (ex: WorkoutExercise, setNumber: number, reps: number, loadKg: number | null) => void
  embedded?: boolean
}
```

- [ ] **Passo 3: Adicionar `onUpdate` à interface `SetRowProps`**

```typescript
// ANTES:
interface SetRowProps {
  setNumber: number
  isDone: boolean
  isCurrent: boolean
  suggestedReps: string
  suggestedLoad: number | null
  lastReps?: number
  lastLoad?: number | null
  onComplete: (reps: number, loadKg: number | null) => void
}

// DEPOIS:
interface SetRowProps {
  setNumber: number
  isDone: boolean
  isCurrent: boolean
  suggestedReps: string
  suggestedLoad: number | null
  lastReps?: number
  lastLoad?: number | null
  onComplete: (reps: number, loadKg: number | null) => void
  onUpdate: (reps: number, loadKg: number | null) => void
}
```

- [ ] **Passo 4: Adicionar `handleSetUpdate` no `WorkoutSessionPage`**

Localizar `handleSetComplete` e adicionar logo após:

```typescript
  const handleSetUpdate = useCallback(async (
    exercise: WorkoutExercise,
    setNumber: number,
    reps: number,
    loadKg: number | null,
  ) => {
    if (!workoutLogId || !exercise.exercise) return
    try {
      await updateExerciseSet(workoutLogId, exercise.exercise.id, setNumber, {
        repsCompleted: reps,
        loadKg,
      })
    } catch (err) {
      console.error('Erro ao atualizar série:', err)
    }
  }, [workoutLogId])
```

- [ ] **Passo 5: Passar `onSetUpdate` nas chamadas de `SetList` em LayoutA e LayoutB**

Em LayoutA, localizar `<SetList` e adicionar o novo prop:

```tsx
// Localizar em LayoutA:
        <SetList
          ex={ex}
          exDoneCount={exDoneCount}
          lastSetData={lastSetData}
          onSetComplete={onSetComplete}
        />

// Alterar para:
        <SetList
          ex={ex}
          exDoneCount={exDoneCount}
          lastSetData={lastSetData}
          onSetComplete={onSetComplete}
          onSetUpdate={onSetUpdate}
        />
```

Fazer o mesmo em LayoutB:

```tsx
// Localizar em LayoutB:
          <SetList
            ex={ex}
            exDoneCount={exDoneCount}
            lastSetData={lastSetData}
            onSetComplete={onSetComplete}
            embedded
          />

// Alterar para:
          <SetList
            ex={ex}
            exDoneCount={exDoneCount}
            lastSetData={lastSetData}
            onSetComplete={onSetComplete}
            onSetUpdate={onSetUpdate}
            embedded
          />
```

- [ ] **Passo 6: Adicionar `onSetUpdate` à interface `LayoutACommonProps` e desestruturação**

```typescript
// Na interface LayoutACommonProps, adicionar:
  onSetUpdate: (ex: WorkoutExercise, setNumber: number, reps: number, loadKg: number | null) => void
```

Adicionar na desestruturação de LayoutA e LayoutB:

```typescript
// LayoutA — adicionar onSetUpdate na desestruturação:
  const {
    workout, currentIdx, setCurrentIdx, exercises, currentExercise,
    setsCompleted, lastSetData, onSetComplete, onSetUpdate,
    timerSeconds, isTimerRunning,
    exercisesDone, totalSets,
  } = props

// LayoutB — adicionar onSetUpdate na desestruturação:
  const {
    currentIdx, exercises, currentExercise,
    setsCompleted, lastSetData, onSetComplete, onSetUpdate,
    timerSeconds,
  } = props
```

- [ ] **Passo 7: Passar `onSetUpdate` nas chamadas de LayoutA e LayoutB no render principal**

```tsx
// Em <LayoutA ... />, adicionar:
          onSetUpdate={handleSetUpdate}

// Em <LayoutB ... />, adicionar:
          onSetUpdate={handleSetUpdate}
```

- [ ] **Passo 8: Atualizar `SetList` — desestruturar e passar `onSetUpdate` para `SetRow`**

```tsx
// ANTES — início de SetList:
function SetList({ ex, exDoneCount, lastSetData, onSetComplete, embedded = false }: SetListProps) {

// DEPOIS:
function SetList({ ex, exDoneCount, lastSetData, onSetComplete, onSetUpdate, embedded = false }: SetListProps) {
```

No mapeamento de séries, adicionar `onUpdate`:

```tsx
// ANTES:
          onComplete={(reps, load) => onSetComplete(ex, setNumber, reps, load)}

// DEPOIS:
          onComplete={(reps, load) => onSetComplete(ex, setNumber, reps, load)}
          onUpdate={(reps, load) => onSetUpdate(ex, setNumber, reps, load)}
```

- [ ] **Passo 9: Atualizar `SetRow` — remover disabled e adicionar onBlur para séries concluídas**

```tsx
// ANTES — função SetRow:
function SetRow({
  setNumber, isDone, isCurrent, suggestedReps, suggestedLoad, lastReps, lastLoad, onComplete,
}: SetRowProps) {

// DEPOIS:
function SetRow({
  setNumber, isDone, isCurrent, suggestedReps, suggestedLoad, lastReps, lastLoad, onComplete, onUpdate,
}: SetRowProps) {
```

Adicionar função `handleDoneUpdate` antes do `return`:

```typescript
  function handleDoneUpdate() {
    if (!isDone) return
    const repsNum = parseInt(reps, 10)
    const loadNum = load !== '' ? parseFloat(load) : null
    if (!isNaN(repsNum) && repsNum > 0) onUpdate(repsNum, loadNum)
  }
```

Remover `disabled={isDone}` e adicionar `onBlur={handleDoneUpdate}` em ambos os inputs:

```tsx
      <input
        className="set-input"
        type="number"
        inputMode="decimal"
        value={load}
        onChange={(e) => setLoad(e.target.value)}
        onBlur={handleDoneUpdate}
        placeholder="—"
        step={0.5}
        min={0}
      />
      <input
        className="set-input"
        type="number"
        inputMode="numeric"
        value={reps}
        onChange={(e) => setReps(e.target.value)}
        onBlur={handleDoneUpdate}
        placeholder="—"
        min={1}
      />
```

- [ ] **Passo 10: Verificar TypeScript**

```bash
npx tsc --noEmit
```

Esperado: zero erros.

- [ ] **Passo 11: Commit**

```bash
git add src/pages/WorkoutSessionPage.tsx
git commit -m "feat(treino): permite edicao de series ja concluidas com auto-save no banco"
```

---

## Tarefa 7 — Adicionar campo de descrição ao formulário de fichas (admin)

**Arquivo:** `src/pages/admin/WorkoutFormPage.tsx`

O `CreateWorkoutDTO` e `UpdateWorkoutDTO` já têm `description?: string`. O `updateWorkout` usa spread (`...dto`) então aceita description automaticamente. Só falta o campo no formulário.

- [ ] **Passo 1: Adicionar estado `description`**

Localizar os estados do formulário (≈ linha 141) e adicionar `description` junto com `name`:

```typescript
// ANTES:
  const [name, setName] = useState('')
  const [weekDays, setWeekDays] = useState<WeekDay[]>([])

// DEPOIS:
  const [name, setName] = useState('')
  const [description, setDescription] = useState('')
  const [weekDays, setWeekDays] = useState<WeekDay[]>([])
```

- [ ] **Passo 2: Carregar `description` quando editando**

No `useEffect` que carrega os dados da ficha (≈ linha 158), adicionar `setDescription`:

```typescript
// ANTES:
        setName(data.name)
        setWeekDays(data.week_days)
        setIsTemplate(data.is_template)

// DEPOIS:
        setName(data.name)
        setDescription(data.description ?? '')
        setWeekDays(data.week_days)
        setIsTemplate(data.is_template)
```

- [ ] **Passo 3: Incluir `description` na criação**

No `handleSave`, dentro do bloco `if (!isEditing)`, adicionar `description` na chamada de `createWorkout`:

```typescript
// ANTES:
        const created = await createWorkout(
          {
            name: name.trim(),
            user_id: targetUserId,
            week_days: weekDays,
            is_template: isTemplate && !presetUserId,
          },
          profile.id
        )

// DEPOIS:
        const created = await createWorkout(
          {
            name: name.trim(),
            description: description.trim() || undefined,
            user_id: targetUserId,
            week_days: weekDays,
            is_template: isTemplate && !presetUserId,
          },
          profile.id
        )
```

- [ ] **Passo 4: Incluir `description` na edição**

No `handleSave`, dentro do bloco `else if (workoutId)`, adicionar `description` na chamada de `updateWorkout`:

```typescript
// ANTES:
        await updateWorkout(workoutId, {
          name: name.trim(),
          week_days: weekDays,
          is_template: isTemplate,
        })

// DEPOIS:
        await updateWorkout(workoutId, {
          name: name.trim(),
          description: description.trim() || undefined,
          week_days: weekDays,
          is_template: isTemplate,
        })
```

- [ ] **Passo 5: Adicionar textarea no formulário**

Localizar o bloco do campo "Nome da ficha" (≈ linha 378) e adicionar o campo de descrição logo abaixo, entre o nome e os dias da semana:

```tsx
              {/* Descrição */}
              <div style={{ marginTop: 18 }}>
                <div className="label-sm" style={{ marginBottom: 6 }}>Descrição da ficha</div>
                <textarea
                  className="input"
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  placeholder="Opcional — método, observações gerais para o aluno..."
                  rows={3}
                  maxLength={500}
                  style={{ resize: 'vertical', minHeight: 80 }}
                />
              </div>
```

O trecho final da seção "DADOS DA FICHA" fica na ordem: Nome → Descrição → Dias da semana → Template.

- [ ] **Passo 6: Verificar TypeScript**

```bash
npx tsc --noEmit
```

Esperado: zero erros.

- [ ] **Passo 7: Commit**

```bash
git add src/pages/admin/WorkoutFormPage.tsx
git commit -m "feat(admin): adiciona campo de descricao editavel no formulario de fichas"
```

---

## Tarefa 8 — Modo de edição no histórico de treino

**Arquivo:** `src/pages/SessionDetailPage.tsx`

- [ ] **Passo 1: Adicionar imports necessários**

```typescript
// ANTES:
import { useState, useEffect } from 'react'
import { useParams, Link, useNavigate } from 'react-router-dom'
import { motion } from 'motion/react'
import { getSessionDetail } from '../services/history.service'
import { Topbar } from '../components/layout/Topbar'
import { Icon } from '../components/ui/Icon'
import { MUSCLE_GROUP_LABELS } from '../types'
import type { WorkoutLogDetail, ExerciseLogDetail } from '../types'

// DEPOIS:
import { useState, useEffect } from 'react'
import { useParams, Link, useNavigate } from 'react-router-dom'
import { motion } from 'motion/react'
import { getSessionDetail } from '../services/history.service'
import { updateWorkoutLog, updateExerciseLog } from '../services/workout-log.service'
import { Topbar } from '../components/layout/Topbar'
import { Icon } from '../components/ui/Icon'
import { useToast } from '../context/ToastContext'
import { MUSCLE_GROUP_LABELS } from '../types'
import type { WorkoutLogDetail, ExerciseLogDetail } from '../types'
```

- [ ] **Passo 2: Definir tipo e estados de edição**

Logo após `const navigate = useNavigate()` dentro de `SessionDetailPage`, adicionar:

```typescript
  const { showToast } = useToast()

  const [isEditing, setIsEditing] = useState(false)
  const [isSaving, setIsSaving] = useState(false)
  const [editDuration, setEditDuration] = useState(0)
  const [editDifficulty, setEditDifficulty] = useState('')
  const [editNotes, setEditNotes] = useState('')
  // Mapa de ID da série → { reps, load }
  const [editSets, setEditSets] = useState<Record<string, { reps: string; load: string }>>({})
```

- [ ] **Passo 3: Adicionar funções `startEdit`, `cancelEdit` e `handleSaveEdit`**

Adicionar após a função `load()`:

```typescript
  function startEdit() {
    if (!session) return
    setEditDuration(session.duration_minutes ?? 0)
    setEditDifficulty(session.difficulty ?? '')
    setEditNotes(session.notes ?? '')
    const setsMap: Record<string, { reps: string; load: string }> = {}
    session.exercise_logs.forEach((log) => {
      setsMap[log.id] = {
        reps: String(log.reps_completed),
        load: log.load_kg != null && log.load_kg !== 0 ? String(log.load_kg) : '',
      }
    })
    setEditSets(setsMap)
    setIsEditing(true)
  }

  function cancelEdit() {
    setIsEditing(false)
  }

  async function handleSaveEdit() {
    if (!session) return
    setIsSaving(true)
    try {
      await updateWorkoutLog(session.id, {
        durationMinutes: Number(editDuration) || 0,
        difficulty: editDifficulty,
        notes: editNotes,
      })
      await Promise.all(
        Object.entries(editSets).map(([logId, data]) =>
          updateExerciseLog(logId, {
            repsCompleted: parseInt(data.reps, 10) || 0,
            loadKg: data.load !== '' ? parseFloat(data.load) : null,
          })
        )
      )
      await load()
      setIsEditing(false)
      showToast('Sessão atualizada com sucesso', 'success')
    } catch (err) {
      showToast(err instanceof Error ? err.message : 'Erro ao salvar', 'error')
    } finally {
      setIsSaving(false)
    }
  }
```

- [ ] **Passo 4: Adicionar botão "Editar sessão" na Topbar**

```tsx
// ANTES — actions da Topbar:
        actions={
          <Link to="/historico" className="btn ghost">
            <Icon name="arrowL" size={14} /> Voltar
          </Link>
        }

// DEPOIS:
        actions={
          <>
            <Link to="/historico" className="btn ghost">
              <Icon name="arrowL" size={14} /> Voltar
            </Link>
            {session && !isEditing && (
              <button className="btn ghost" onClick={startEdit}>
                <Icon name="edit" size={14} /> Editar sessão
              </button>
            )}
          </>
        }
```

- [ ] **Passo 5: Substituir o card de meta por versão com modo de edição**

Localizar o card `card-accent` com `className="forja-session-meta"` e substituir o bloco de duração, exercícios, séries e volume pelo seguinte (que adapta para modo de edição nos campos editáveis):

```tsx
            {/* Meta da sessão */}
            <div
              className="card card-accent"
              style={{ padding: 32, position: 'relative', overflow: 'hidden' }}
            >
              <div className="eyebrow" style={{ color: 'rgba(0,0,0,0.55)' }}>
                {isEditing ? 'EDITANDO SESSÃO' : 'SESSÃO COMPLETA'}
              </div>
              <div className="forja-session-meta">
                <div>
                  <div className="stat-label" style={{ color: 'rgba(0,0,0,0.55)' }}>Duração</div>
                  {isEditing ? (
                    <div style={{ display: 'flex', alignItems: 'baseline', gap: 4 }}>
                      <input
                        type="number"
                        value={editDuration}
                        onChange={(e) => setEditDuration(Number(e.target.value))}
                        min={0}
                        style={{
                          width: 72,
                          fontSize: 40,
                          fontFamily: 'var(--f-display)',
                          background: 'rgba(0,0,0,0.15)',
                          border: '1px solid rgba(0,0,0,0.3)',
                          borderRadius: 6,
                          color: '#0a0a0a',
                          padding: '2px 6px',
                          textAlign: 'center',
                        }}
                      />
                      <span style={{ color: 'rgba(0,0,0,0.6)', fontSize: 16 }}>min</span>
                    </div>
                  ) : (
                    <div className="f-display" style={{ fontSize: 64, lineHeight: 0.95 }}>
                      {session.duration_minutes ?? '—'}
                      <span className="stat-unit" style={{ color: 'rgba(0,0,0,0.6)' }}>min</span>
                    </div>
                  )}
                </div>
                <div style={{ width: 1, height: 70, background: 'rgba(0,0,0,0.2)' }} />
                <div>
                  <div className="stat-label" style={{ color: 'rgba(0,0,0,0.55)' }}>Exercícios</div>
                  <div className="f-display" style={{ fontSize: 64, lineHeight: 0.95 }}>
                    {String(exerciseGroups.length).padStart(2, '0')}
                  </div>
                </div>
                <div style={{ width: 1, height: 70, background: 'rgba(0,0,0,0.2)' }} />
                <div>
                  <div className="stat-label" style={{ color: 'rgba(0,0,0,0.55)' }}>Séries</div>
                  <div className="f-display" style={{ fontSize: 64, lineHeight: 0.95 }}>
                    {totalSets}
                  </div>
                </div>
                <div style={{ width: 1, height: 70, background: 'rgba(0,0,0,0.2)' }} />
                <div>
                  <div className="stat-label" style={{ color: 'rgba(0,0,0,0.55)' }}>Volume</div>
                  <div className="f-display" style={{ fontSize: 64, lineHeight: 0.95 }}>
                    {Math.round(totalVolume)}
                    <span className="stat-unit" style={{ color: 'rgba(0,0,0,0.6)' }}>kg</span>
                  </div>
                </div>
              </div>

              {/* Dificuldade + Notas — modo leitura */}
              {!isEditing && (session.difficulty || session.notes) && (
                <div style={{ marginTop: 18, display: 'flex', gap: 18, flexWrap: 'wrap' }}>
                  {session.difficulty && (
                    <div style={{ fontSize: 14, color: 'rgba(0,0,0,0.7)' }}>
                      {DIFFICULTY_LABEL[session.difficulty]}
                    </div>
                  )}
                  {session.notes && (
                    <div style={{ fontSize: 14, color: 'rgba(0,0,0,0.7)', fontStyle: 'italic' }}>
                      "{session.notes}"
                    </div>
                  )}
                </div>
              )}

              {/* Dificuldade + Notas — modo edição */}
              {isEditing && (
                <div style={{ marginTop: 20, display: 'flex', flexDirection: 'column', gap: 14 }}>
                  <div>
                    <div className="label-sm" style={{ marginBottom: 8, color: 'rgba(0,0,0,0.55)' }}>
                      Dificuldade
                    </div>
                    <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
                      {(['easy', 'medium', 'hard', 'terrible'] as const).map((d) => (
                        <button
                          key={d}
                          onClick={() => setEditDifficulty(d)}
                          style={{
                            padding: '8px 14px',
                            borderRadius: 8,
                            border: '1px solid rgba(0,0,0,0.25)',
                            background: editDifficulty === d ? 'rgba(0,0,0,0.75)' : 'rgba(0,0,0,0.1)',
                            color: editDifficulty === d ? 'var(--accent)' : '#0a0a0a',
                            fontSize: 13,
                            cursor: 'pointer',
                            fontWeight: editDifficulty === d ? 700 : 400,
                          }}
                        >
                          {DIFFICULTY_LABEL[d]}
                        </button>
                      ))}
                    </div>
                  </div>
                  <div>
                    <div className="label-sm" style={{ marginBottom: 6, color: 'rgba(0,0,0,0.55)' }}>
                      Observações
                    </div>
                    <textarea
                      value={editNotes}
                      onChange={(e) => setEditNotes(e.target.value)}
                      rows={2}
                      placeholder="Anotações sobre o treino..."
                      style={{
                        width: '100%',
                        background: 'rgba(0,0,0,0.12)',
                        border: '1px solid rgba(0,0,0,0.25)',
                        borderRadius: 8,
                        color: '#0a0a0a',
                        padding: '8px 12px',
                        fontSize: 13,
                        resize: 'vertical',
                        fontFamily: 'inherit',
                      }}
                    />
                  </div>
                </div>
              )}
            </div>
```

- [ ] **Passo 6: Adicionar modo de edição nas séries de cada exercício**

Localizar o bloco que renderiza as séries de cada exercício (o `sets.map((set) => ...)` com os dados de `reps_completed` e `load_kg`). Substituir o bloco inteiro de séries pelo seguinte:

```tsx
                    {/* Séries */}
                    <div style={{ padding: 0 }}>
                      <div
                        style={{
                          display: 'grid',
                          gridTemplateColumns: '40px 1fr 1fr 1fr',
                          gap: 12,
                          padding: '10px 20px',
                          borderBottom: '1px solid var(--hairline)',
                          color: 'var(--text-faint)',
                          fontSize: 9,
                          textTransform: 'uppercase',
                          letterSpacing: '0.12em',
                          fontWeight: 600,
                        }}
                      >
                        <div>SÉR.</div>
                        <div>Reps</div>
                        <div>Carga</div>
                        <div style={{ textAlign: 'right' }}>Volume</div>
                      </div>
                      {sets.map((set) => {
                        const editRow = editSets[set.id]
                        const repsVal = isEditing && editRow ? editRow.reps : String(set.reps_completed)
                        const loadVal = isEditing && editRow ? editRow.load : (set.load_kg ? String(set.load_kg) : '')
                        const volume = (parseFloat(loadVal) || 0) * (parseInt(repsVal, 10) || 0)

                        return (
                          <div
                            key={set.id}
                            style={{
                              display: 'grid',
                              gridTemplateColumns: '40px 1fr 1fr 1fr',
                              gap: 12,
                              padding: '10px 20px',
                              borderBottom: '1px solid var(--hairline)',
                              alignItems: 'center',
                            }}
                          >
                            <div className="f-display" style={{ fontSize: 22, color: 'var(--text-dim)' }}>
                              {String(set.set_number).padStart(2, '0')}
                            </div>
                            {isEditing ? (
                              <>
                                <input
                                  type="number"
                                  inputMode="numeric"
                                  value={editRow?.reps ?? ''}
                                  onChange={(e) =>
                                    setEditSets((prev) => ({
                                      ...prev,
                                      [set.id]: { ...prev[set.id], reps: e.target.value },
                                    }))
                                  }
                                  min={0}
                                  className="set-input"
                                  style={{ maxWidth: 72 }}
                                />
                                <input
                                  type="number"
                                  inputMode="decimal"
                                  value={editRow?.load ?? ''}
                                  onChange={(e) =>
                                    setEditSets((prev) => ({
                                      ...prev,
                                      [set.id]: { ...prev[set.id], load: e.target.value },
                                    }))
                                  }
                                  min={0}
                                  step={0.5}
                                  placeholder="—"
                                  className="set-input"
                                  style={{ maxWidth: 72 }}
                                />
                              </>
                            ) : (
                              <>
                                <div className="f-mono" style={{ fontSize: 13, color: 'var(--text)' }}>
                                  {set.reps_completed}
                                </div>
                                <div className="f-mono" style={{ fontSize: 13, color: 'var(--text)' }}>
                                  {set.load_kg ? `${set.load_kg}kg` : 'peso corp.'}
                                </div>
                              </>
                            )}
                            <div className="f-mono" style={{ fontSize: 13, color: 'var(--text-dim)', textAlign: 'right' }}>
                              {Math.round(volume)}kg
                            </div>
                          </div>
                        )
                      })}
                    </div>
```

- [ ] **Passo 7: Adicionar botões Salvar / Cancelar ao final da tela em modo de edição**

Adicionar logo após o bloco `{/* Exercícios */}`, antes do fechamento do `</motion.div>`:

```tsx
            {/* Ações do modo de edição */}
            {isEditing && (
              <div style={{ display: 'flex', gap: 12, paddingBottom: 32 }}>
                <button
                  className="btn primary"
                  onClick={handleSaveEdit}
                  disabled={isSaving}
                  style={{ flex: 1, justifyContent: 'center' }}
                >
                  {isSaving ? 'Salvando...' : 'Salvar alterações'}
                </button>
                <button
                  className="btn ghost"
                  onClick={cancelEdit}
                  disabled={isSaving}
                  style={{ justifyContent: 'center' }}
                >
                  Cancelar
                </button>
              </div>
            )}
```

- [ ] **Passo 8: Verificar TypeScript**

```bash
npx tsc --noEmit
```

Esperado: zero erros.

- [ ] **Passo 9: Build final**

```bash
npm run build
```

Esperado: build sem erros. O output estará em `dist/`.

- [ ] **Passo 10: Commit**

```bash
git add src/pages/SessionDetailPage.tsx
git commit -m "feat(historico): adiciona modo de edicao de sessao — duracao, dificuldade, notas e series"
```

---

## Passo final — Push para produção

```bash
git push origin main
```

O Vercel fará o deploy automático. Verificar em https://forjamuscle.vercel.app após alguns minutos.
