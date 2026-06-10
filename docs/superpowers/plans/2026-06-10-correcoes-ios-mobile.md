# Correções iOS Mobile — Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Acabar com o zoom automático ao focar campos no iPhone e tornar a sessão de treino resistente a recarregamentos do iOS (retomar de onde parou + manter a tela acesa).

**Architecture:** (1) Garantir fonte ≥16px em todos os campos. (2) Em vez de sempre criar um `workout_log` novo ao abrir a tela de treino, retomar uma sessão não finalizada recente; reconstruir séries feitas e tempo decorrido a partir do banco; manter a tela acesa via Screen Wake Lock API. Tudo seguro no desktop.

**Tech Stack:** React 19 + TypeScript, Supabase JS, CSS (Design System FORJA), Screen Wake Lock API.

**Verificação:** Este projeto não tem runner de testes unitários. Cada tarefa é verificada com `npx tsc --noEmit` (checagem de tipos) e, no fim, `npm run build`. Há também passos de teste manual no iPhone.

---

## Estrutura de arquivos

| Arquivo | Ação | Responsabilidade |
|---------|------|------------------|
| `src/index.css` | Modificar | `.input` font-size 14→16px |
| `src/hooks/useWakeLock.ts` | Criar | Hook que mantém a tela acesa (Wake Lock) com degradação graciosa |
| `src/services/workout-log.service.ts` | Modificar | `resumeOrStartWorkoutSession()` + `getSessionProgress()` |
| `src/pages/WorkoutSessionPage.tsx` | Modificar | inputs 16px; retomar sessão; reconstruir progresso/tempo; usar `useWakeLock` |

---

## Task 1: Fonte 16px nos campos (fim do zoom no iPhone)

**Files:**
- Modify: `src/index.css` (classe `.input`)
- Modify: `src/pages/WorkoutSessionPage.tsx` (inputs de série no `LayoutMobile`)

- [ ] **Step 1: Aumentar a fonte do `.input` para 16px**

Em `src/index.css`, na regra `.input` (por volta da linha 452), trocar `font-size: 14px;` por `font-size: 16px;`.

Bloco atual:
```css
.input {
  width: 100%;
  background: var(--bg-3);
  border: 1px solid var(--border);
  border-radius: var(--r-2);
  padding: 12px 14px;
  color: var(--text);
  font-family: var(--f-body);
  font-size: 14px;
  outline: none;
}
```

Trocar apenas a linha da fonte:
```css
  font-size: 16px;
```

> Observação: se o `padding`/demais propriedades estiverem ligeiramente diferentes no arquivo, **não** alterá-las — mudar somente `font-size: 14px` → `font-size: 16px` dentro da regra `.input`.

- [ ] **Step 2: Remover o override de 14px nos inputs de série (mobile)**

Em `src/pages/WorkoutSessionPage.tsx`, no componente `LayoutMobile`, os dois inputs da tabela de séries usam `style={{ fontSize: 14, padding: '8px' }}`. Trocar **as duas ocorrências** por `style={{ padding: '8px' }}` (passam a herdar os 16px de `.set-input`).

Antes (aparece 2x — carga e reps):
```tsx
                  style={{ fontSize: 14, padding: '8px' }}
```

Depois (2x):
```tsx
                  style={{ padding: '8px' }}
```

- [ ] **Step 3: Verificar que não restou campo abaixo de 16px**

Run: `npx tsc --noEmit`
Expected: sem saída (sem erros).

Conferência manual de código: garantir que nenhum `input`/`textarea`/`select` tem `font-size` menor que 16px (a classe `.set-input` já é 16px; `.input` agora é 16px; o override de 14 foi removido).

- [ ] **Step 4: Commit**

```bash
git add src/index.css src/pages/WorkoutSessionPage.tsx
git commit -m "fix(ios): bump form inputs to 16px to stop Safari auto-zoom"
```

---

## Task 2: Hook useWakeLock (manter a tela acesa)

**Files:**
- Create: `src/hooks/useWakeLock.ts`

- [ ] **Step 1: Criar o hook**

Criar `src/hooks/useWakeLock.ts`:

```ts
import { useEffect, useRef } from 'react'

/**
 * Mantém a tela acesa enquanto `enabled` for true (Screen Wake Lock API).
 *
 * - Degradação graciosa: se o navegador não suportar, não faz nada.
 * - Reaquire o lock quando a aba volta a ficar visível (o iOS libera o lock
 *   automaticamente ao sair/bloquear).
 */
export function useWakeLock(enabled: boolean): void {
  const sentinelRef = useRef<WakeLockSentinel | null>(null)

  useEffect(() => {
    if (!enabled) return
    if (!('wakeLock' in navigator)) return

    let released = false

    async function acquire() {
      try {
        sentinelRef.current = await navigator.wakeLock.request('screen')
      } catch {
        // Silencioso: aba não visível, sem permissão, etc.
      }
    }

    function onVisibility() {
      if (document.visibilityState === 'visible' && !released) void acquire()
    }

    void acquire()
    document.addEventListener('visibilitychange', onVisibility)

    return () => {
      released = true
      document.removeEventListener('visibilitychange', onVisibility)
      void sentinelRef.current?.release().catch(() => {})
      sentinelRef.current = null
    }
  }, [enabled])
}
```

- [ ] **Step 2: Verificar tipos**

Run: `npx tsc --noEmit`
Expected: sem erros.

> Se o `tsc` reclamar que `WakeLockSentinel` ou `navigator.wakeLock` não existem (lib DOM antiga), adicionar no topo do arquivo, logo após o import:
> ```ts
> // Fallback de tipos caso a lib DOM do TS não inclua Wake Lock
> declare global {
>   interface Navigator { wakeLock?: { request(type: 'screen'): Promise<WakeLockSentinel> } }
>   interface WakeLockSentinel { release(): Promise<void> }
> }
> ```
> Só adicionar isso **se** o tsc acusar erro — em TS recente esses tipos já existem.

- [ ] **Step 3: Commit**

```bash
git add src/hooks/useWakeLock.ts
git commit -m "feat(mobile): add useWakeLock hook (keep screen awake)"
```

---

## Task 3: Serviços — retomar sessão + ler progresso

**Files:**
- Modify: `src/services/workout-log.service.ts`

- [ ] **Step 1: Adicionar `resumeOrStartWorkoutSession`**

Em `src/services/workout-log.service.ts`, **substituir** a função `startWorkoutSession` inteira (atualmente em ~linhas 12-28) por esta versão que retoma uma sessão em andamento ou cria uma nova:

```ts
export interface ResumableSession {
  id: string
  startedAt: string
  resumed: boolean
}

/**
 * Retoma a sessão em andamento (finished_at IS NULL) deste aluno para esta
 * ficha, começada nas últimas 6 horas. Se não houver, cria uma nova.
 *
 * Isso torna o treino resistente a recarregamentos do iOS: ao reabrir a
 * tela no meio do treino, continua a mesma sessão em vez de zerar.
 */
export async function resumeOrStartWorkoutSession(
  workoutId: string,
  userId: string,
): Promise<ResumableSession> {
  const sixHoursAgo = new Date(Date.now() - 6 * 60 * 60 * 1000).toISOString()

  // 1. Procura uma sessão recente ainda não finalizada para esta ficha
  const { data: existing, error: findErr } = await supabase
    .from('workout_logs')
    .select('id, started_at')
    .eq('user_id', userId)
    .eq('workout_id', workoutId)
    .is('finished_at', null)
    .gte('started_at', sixHoursAgo)
    .order('started_at', { ascending: false })
    .limit(1)
    .maybeSingle()

  if (findErr) throw new Error(findErr.message)
  if (existing) {
    return {
      id: existing.id as string,
      startedAt: existing.started_at as string,
      resumed: true,
    }
  }

  // 2. Não há sessão em andamento → cria nova
  const startedAt = new Date().toISOString()
  const { data, error } = await supabase
    .from('workout_logs')
    .insert({ workout_id: workoutId, user_id: userId, started_at: startedAt })
    .select('id')
    .single()

  if (error) throw new Error(error.message)
  return { id: data.id as string, startedAt, resumed: false }
}
```

- [ ] **Step 2: Adicionar `getSessionProgress`**

No mesmo arquivo, logo **após** `resumeOrStartWorkoutSession`, adicionar:

```ts
/**
 * Séries concluídas de uma sessão, agrupadas por exercise_id (id da
 * exercise_library) → lista de set_numbers distintos já registrados.
 * Usado para reconstruir o progresso ao retomar uma sessão.
 */
export async function getSessionProgress(
  workoutLogId: string,
): Promise<Record<string, number[]>> {
  const { data, error } = await supabase
    .from('exercise_logs')
    .select('exercise_id, set_number')
    .eq('workout_log_id', workoutLogId)
    .eq('completed', true)

  if (error) throw new Error(error.message)

  const result: Record<string, number[]> = {}
  for (const row of (data ?? []) as { exercise_id: string; set_number: number }[]) {
    const arr = result[row.exercise_id] ?? (result[row.exercise_id] = [])
    if (!arr.includes(row.set_number)) arr.push(row.set_number)
  }
  return result
}
```

- [ ] **Step 3: Verificar tipos**

Run: `npx tsc --noEmit`
Expected: vai falhar em `src/pages/WorkoutSessionPage.tsx` porque ele ainda importa `startWorkoutSession` (que foi renomeado). Isso é esperado e será corrigido na Task 4. Se aparecer **apenas** esse erro de import em WorkoutSessionPage, pode prosseguir.

- [ ] **Step 4: Commit**

```bash
git add src/services/workout-log.service.ts
git commit -m "feat(workout): resumeOrStartWorkoutSession + getSessionProgress"
```

---

## Task 4: Ligar tudo na tela de execução

**Files:**
- Modify: `src/pages/WorkoutSessionPage.tsx`

- [ ] **Step 1: Atualizar imports**

No topo de `src/pages/WorkoutSessionPage.tsx`, no import de `../services/workout-log.service`, trocar `startWorkoutSession` por `resumeOrStartWorkoutSession, getSessionProgress`.

Antes:
```ts
import {
  startWorkoutSession,
  logExerciseSet,
  updateExerciseSet,
  finishWorkoutSession,
  deleteWorkoutSession,
} from '../services/workout-log.service'
```

Depois:
```ts
import {
  resumeOrStartWorkoutSession,
  getSessionProgress,
  logExerciseSet,
  updateExerciseSet,
  finishWorkoutSession,
  deleteWorkoutSession,
} from '../services/workout-log.service'
```

E adicionar o import do hook logo após o import de `useIsMobile`:
```ts
import { useWakeLock } from '../hooks/useWakeLock'
```

- [ ] **Step 2: Retomar sessão + reconstruir progresso no boot()**

Dentro do `boot()` (no `useEffect` de boot), substituir este trecho:
```ts
        const logId = await startWorkoutSession(id!, profile!.id)
        setWorkoutLogId(logId)
        startTimeRef.current = new Date()
```

Por:
```ts
        const session = await resumeOrStartWorkoutSession(id!, profile!.id)
        setWorkoutLogId(session.id)
        startTimeRef.current = new Date(session.startedAt)

        // Sessão retomada: remarca séries feitas e posiciona no próximo exercício
        if (session.resumed && data.exercises) {
          const progress = await getSessionProgress(session.id)
          const completed: Record<string, number> = {}
          for (const we of data.exercises) {
            const exLibId = we.exercise?.id
            if (!exLibId) continue
            const doneSets = progress[exLibId]?.length ?? 0
            if (doneSets > 0) completed[we.id] = Math.min(doneSets, we.sets)
          }
          setSetsCompleted(completed)
          const firstUnfinished = data.exercises.findIndex(
            (we) => (completed[we.id] ?? 0) < we.sets,
          )
          setCurrentIdx(firstUnfinished === -1 ? 0 : firstUnfinished)
        }
```

> `data` é a ficha já carregada acima no mesmo `boot()` (via `getWorkoutById`), com `data.exercises` ordenados por `order_index`. `setSetsCompleted`, `setCurrentIdx` e `startTimeRef` já existem no componente.

- [ ] **Step 3: Ativar o Wake Lock enquanto a sessão está ativa**

No corpo do componente `WorkoutSessionPage`, adicionar a chamada do hook junto aos outros hooks — por exemplo, logo após o `useEffect` do timer de descanso (antes da seção `// Registrar série`). Inserir:

```ts
  // Mantém a tela acesa durante o treino (reduz recarregamento do iOS)
  useWakeLock(!isBooting && workoutLogId !== null)
```

> Hooks devem ficar no nível superior do componente (não dentro de condições). `isBooting` e `workoutLogId` já são estados existentes.

- [ ] **Step 4: Verificar tipos**

Run: `npx tsc --noEmit`
Expected: sem erros.

- [ ] **Step 5: Commit**

```bash
git add src/pages/WorkoutSessionPage.tsx
git commit -m "feat(workout): resume in-progress session + keep screen awake"
```

---

## Task 5: Build de produção + deploy

**Files:** nenhum (verificação + publicação)

- [ ] **Step 1: Build de produção**

Run: `npm run build`
Expected: build conclui sem erros (`✓ built in ...`), pasta `dist/` gerada.

- [ ] **Step 2: Push para produção**

```bash
git push origin main
```

O Vercel publica automaticamente em ~1 min.

- [ ] **Step 3: Teste manual no iPhone (após o deploy)**

Zoom:
1. Abrir o app no iPhone (Safari / ícone na tela inicial).
2. Tocar em campos: login, perfil (editar dados), busca de exercícios, e carga/reps durante um treino.
3. Esperado: **nenhum zoom automático** ao focar; zoom de pinça manual ainda funciona.

Treino à prova de recarregamento:
1. Iniciar um treino, concluir 2-3 séries de exercícios diferentes.
2. Forçar um recarregamento (puxar a página para baixo no Safari para atualizar, ou trocar de app e voltar após a tela bloquear).
3. Esperado: ao reabrir, o treino **continua** — exercícios feitos seguem marcados, o tempo continua de onde estava, e o app posiciona no próximo exercício que falta.
4. Esperado: a tela **não apaga sozinha** durante o treino.

---

## Self-review (cobertura do spec)

- **Problema 1 (zoom):** Task 1 cobre `.input` (16px) e os inputs de série mobile (remoção do override 14px), mais a conferência de que nada ficou < 16px. ✔
- **Problema 2a (retomar sessão):** Task 3 (`resumeOrStartWorkoutSession`, janela 6h, só não finalizadas) + Task 4 Step 2. ✔
- **Problema 2b (reconstruir progresso/tempo):** Task 3 (`getSessionProgress`) + Task 4 Step 2 (rebuild de `setsCompleted`, `currentIdx`, `startTimeRef` a partir de `started_at`). ✔
- **Problema 2c (Wake Lock):** Task 2 (hook) + Task 4 Step 3 (uso). Degradação graciosa incluída. ✔
- **Edge cases:** sessão finalizada nunca é retomada (`finished_at IS NULL`); abandonada >6h não retoma; descartar continua via `deleteWorkoutSession` (intocado); Wake Lock não suportado é silencioso. ✔
- **Desktop intacto:** fonte 16px é neutra no desktop; retomar sessão e wake lock são seguros no desktop; nenhuma branch de layout foi alterada. ✔
