# Design — Correções iOS Mobile (zoom em campos + treino à prova de recarregamento)

**Data:** 10 de junho de 2026
**Status:** ✅ Aprovado
**Escopo:** Duas correções de uso no iPhone (Safari / PWA na tela inicial), sem alterar o desktop.
**Ambiente do problema:** iPhone 16E, Safari, app adicionado à tela inicial (standalone PWA).

---

## Contexto

Dois problemas relatados em uso real no iPhone:

1. **Zoom automático ao focar campos** — ao tocar num campo para digitar, o Safari dá um zoom automático e o usuário precisa reduzir manualmente (pinça).
2. **Treino "reseta" sozinho** — após ~30 min com o app aberto durante o treino, o app recarrega sozinho (comportamento do iOS para PWAs) e a sessão recomeça do zero: tempo zerado e exercícios anteriores desmarcados (só o exercício atual mantém dados).

Ambas as correções são **mobile-friendly mas não exclusivas de mobile** — as mudanças (fonte 16px, retomar sessão, wake lock) são seguras no desktop também.

---

## Problema 1 — Zoom automático ao focar campos

### Causa
O Safari no iOS dá zoom automático quando o campo focado tem `font-size < 16px`. Vários campos do app estão em **14px**:
- `.input` (perfil, login, busca, formulários) → `font-size: 14px`
- Campos de carga/reps na execução de treino mobile (`LayoutMobile` em `WorkoutSessionPage.tsx`) → override inline `fontSize: 14`

### Solução
Garantir **mínimo de 16px** em todos os controles de digitação.

1. Em `src/index.css`, classe `.input`: `font-size: 14px` → `font-size: 16px`.
2. Em `src/pages/WorkoutSessionPage.tsx` (componente `LayoutMobile`), nos dois `<input className="set-input">` da tabela de séries: remover o override `fontSize: 14` (passa a herdar os 16px de `.set-input`). Manter o `padding: '8px'`.
3. Varredura: qualquer outro `input`/`textarea`/`select` com `font-size` inline ou em classe menor que 16px deve ir para 16px. (`.set-input` já é 16px; `textarea.input`/`select.input` herdam de `.input`.)

### O que NÃO fazer
- **Não** adicionar `maximum-scale=1` / `user-scalable=no` ao `<meta viewport>`. Isso desativaria o zoom de pinça intencional e prejudica acessibilidade. A correção correta é a fonte de 16px.

### Critério de conclusão
- [ ] Focar qualquer campo no iPhone não dispara mais o zoom automático.
- [ ] Zoom de pinça manual continua funcionando.
- [ ] Desktop sem mudança perceptível.

---

## Problema 2 — Treino à prova de recarregamento

### Causa
1. PWAs no iOS são recarregados pelo sistema após inatividade/tela apagada/pressão de memória — mesmo "abertos".
2. O andamento do treino (tempo decorrido, séries concluídas, índice do exercício atual) vive **só na memória** (estado React). Ao recarregar, `WorkoutSessionPage` remonta e o `boot()` **sempre cria um novo `workout_log`** via `startWorkoutSession`, zerando a visão.
3. As séries concluídas **já são persistidas** em `exercise_logs` na hora (via `logExerciseSet`) — então o dado existe no banco, só fica "órfão" no log antigo.

### Solução — 3 peças

#### a) Retomar sessão em andamento (em vez de sempre criar nova)

Nova função em `src/services/workout-log.service.ts`:

```ts
export interface ResumableSession {
  id: string
  startedAt: string
  resumed: boolean
}

/**
 * Retoma a sessão em andamento (finished_at IS NULL) deste aluno para esta
 * ficha, começada nas últimas 6 horas. Se não houver, cria uma nova.
 */
export async function resumeOrStartWorkoutSession(
  workoutId: string,
  userId: string,
): Promise<ResumableSession>
```

Lógica:
- Buscar em `workout_logs` o registro mais recente com `user_id = userId`, `workout_id = workoutId`, `finished_at IS NULL`, `started_at >= (agora − 6h)`, ordenado por `started_at` desc, `limit 1`.
- Se encontrado → retornar `{ id, startedAt, resumed: true }` (não cria nada novo).
- Se não → `insert` normal (como hoje) e retornar `{ id, startedAt: agora, resumed: false }`.

Janela de 6h: evita retomar um treino abandonado de dias atrás. Sessão finalizada (com `finished_at`) nunca é retomada.

#### b) Reconstruir o progresso ao retomar

No `boot()` de `WorkoutSessionPage.tsx`:
- Trocar a chamada `startWorkoutSession(id, profile.id)` por `resumeOrStartWorkoutSession(id, profile.id)`.
- `startTimeRef.current = new Date(session.startedAt)` — o cronômetro continua do tempo real decorrido (não reinicia do zero).
- Se `session.resumed`, reconstruir `setsCompleted`:
  - Buscar os `exercise_logs` desse `workout_log_id`.
  - Para cada exercício da ficha (`workout_exercises`), contar quantos `set_number` distintos foram concluídos com aquele `exercise_id` → `setsCompleted[workoutExercise.id] = contagem`.
  - Definir `currentIdx` = primeiro exercício cujo total de séries feitas `< sets` (ou 0 se todos já feitos).
- O pré-preenchimento de carga/reps já funciona via `getLastSetData` (que lê as últimas sessões, incluindo a retomada), então as séries concluídas mostram os valores corretos.

Nova função auxiliar de leitura (em `workout-log.service.ts` ou `history.service.ts`):

```ts
/** Séries concluídas de uma sessão, agrupadas por exercise_id → set_numbers. */
export async function getSessionProgress(
  workoutLogId: string,
): Promise<Record<string, number[]>>
```

#### c) Manter a tela acesa (Screen Wake Lock)

Novo hook `src/hooks/useWakeLock.ts`:
- Quando ativo (`enabled = true`), chama `navigator.wakeLock.request('screen')`.
- Reaquire no evento `visibilitychange` quando a aba volta a ficar visível (o iOS libera o wake lock ao sair).
- Libera o lock ao desativar/desmontar.
- **Degradação graciosa:** se `navigator.wakeLock` não existir, o hook não faz nada (sem erro).

Uso em `WorkoutSessionPage.tsx`: `useWakeLock(!isBooting && !!workoutLogId)` — ativo enquanto a sessão está em andamento. Liberado naturalmente ao finalizar/sair (desmonta a página).

### Edge cases
- **Sessão finalizada**: tem `finished_at` → nunca retomada. Iniciar a mesma ficha depois de finalizar cria sessão nova. ✔
- **Sessão abandonada há mais de 6h**: não retomada (começa nova); o log antigo fica órfão (comportamento já existente para treinos abandonados). ✔
- **Descartar** (modal de sair → "Descartar sessão"): continua apagando via `deleteWorkoutSession`. ✔
- **Wake Lock não suportado**: silencioso, sem efeito. ✔

### Critério de conclusão
- [ ] Recarregar a página no meio do treino retoma a mesma sessão: tempo continua e exercícios feitos seguem marcados.
- [ ] O app posiciona no próximo exercício não concluído ao retomar.
- [ ] A tela não apaga sozinha durante o treino (onde o navegador suporta).
- [ ] Finalizar/descartar/sair funcionam como antes.
- [ ] Build sem erros de TypeScript; desktop intacto.

---

## Arquivos impactados

| Arquivo | Mudança |
|---------|---------|
| `src/index.css` | `.input` font-size 14→16px |
| `src/pages/WorkoutSessionPage.tsx` | inputs de série 14→16px; usar `resumeOrStartWorkoutSession`; reconstruir progresso; `useWakeLock` |
| `src/services/workout-log.service.ts` | `resumeOrStartWorkoutSession()` + `getSessionProgress()` |
| `src/hooks/useWakeLock.ts` | Criar — hook de Screen Wake Lock com degradação graciosa |

---

## Fora de escopo
- Notificações/alarme de fim de descanso.
- Sincronização offline completa (o app continua exigindo conexão para salvar séries).
- Limpeza automática de sessões abandonadas antigas.
