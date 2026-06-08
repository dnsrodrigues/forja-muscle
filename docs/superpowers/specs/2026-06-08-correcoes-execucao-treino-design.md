# Design — Correções e Melhorias na Execução de Treino

**Data:** 08 de junho de 2026  
**Status:** ✅ Aprovado  
**Escopo:** 7 correções e melhorias identificadas pelo usuário durante uso real no mobile

---

## Contexto

O projeto está em produção (https://forjamuscle.vercel.app). Após uso real no celular, Denis identificou 7 pontos de melhoria: 5 na tela de execução de treino, 1 na visualização de ficha e 1 no histórico de treino.

---

## Seção A — Tela de Execução de Treino (`WorkoutSessionPage.tsx`)

### Ponto 1 — Timer de descanso sem botões de controle

**Problema:** Após concluir uma série, aparece um timer de descanso com botões "+15s", "Pular" (Layout A) e "-15s / +15s / Pular" (Layout B). Os botões atrapalham o fluxo durante o treino.

**Solução:**
- Remover todos os botões de controle do timer em ambos os layouts (LayoutA e LayoutB)
- Manter apenas o display visual (MM:SS) e a barra de progresso
- O timer já inicia automaticamente via `startTimer()` em `handleSetComplete` — sem mudança
- O timer já para sozinho ao chegar em zero — sem mudança
- O timer é reiniciado ao completar a próxima série — sem mudança
- Remover os props `onAdjustTimer` e `onSkipTimer` das interfaces `LayoutACommonProps` e `LayoutBProps` (manter `skipTimer` internamente pois ainda é usado em `handleSetComplete` quando todos os exercícios terminam)

**Arquivos:** `src/pages/WorkoutSessionPage.tsx` (LayoutA — painel direito; LayoutB — área hero do timer)

---

### Ponto 2 — Sem botão de troca de layout no mobile

**Problema:** No mobile, o botão "LAYOUT B/A" aparece na topbar e ocupa espaço desnecessário.

**Solução:**
- Ocultar o botão de troca de layout via CSS em telas `max-width: 768px`
- Ao iniciar a sessão no mobile, forçar Layout A mesmo que o `localStorage` tenha salvo "B" (checar `window.innerWidth <= 768` no `useState` inicial do layout)

**Arquivos:** `src/pages/WorkoutSessionPage.tsx` (topbar + inicialização do estado `layout`)

---

### Ponto 3 — Séries concluídas editáveis

**Problema:** Após marcar uma série como feita, os inputs de peso e reps ficam bloqueados (`disabled={isDone}`). Não é possível corrigir um valor digitado errado.

**Solução:**
- Remover `disabled={isDone}` dos dois inputs em `SetRow`
- A série mantém o visual de "concluída" (checkmark verde) e pode ter seus valores editados
- Quando o usuário edita um campo de uma série já concluída e sai do campo (`onBlur`), o app chama `updateExerciseSet()` para salvar a alteração
- Para localizar o registro no banco, usar `workout_log_id + exercise_id + set_number` como identificadores no UPDATE (sem precisar rastrear o ID da linha)
- Não é possível "desmarcar" uma série — apenas editar os valores

**Nova função em `workout-log.service.ts`:**
```ts
updateExerciseSet(
  workoutLogId: string,
  exerciseId: string,
  setNumber: number,
  data: { repsCompleted: number; loadKg: number | null }
): Promise<void>
// UPDATE exercise_logs WHERE workout_log_id = ? AND exercise_id = ? AND set_number = ?
```

**Arquivos:** `src/pages/WorkoutSessionPage.tsx` (`SetRow`), `src/services/workout-log.service.ts`

---

### Ponto 4 — Pré-preenchimento incorreto entre exercícios

**Problema:** Ao passar de um exercício para o próximo, os campos de peso e reps ficam com os valores do exercício anterior. Isso ocorre porque o `key` dos componentes `SetRow` é apenas o número da série (`key={setNumber}`), o que faz o React reutilizar o componente (e seu estado interno) ao trocar de exercício.

**Solução:**
- Alterar o `key` de `setNumber` para `${ex.id}-${setNumber}` no mapeamento das séries dentro de `SetList`
- Com isso, ao trocar de exercício, o React cria componentes novos com estado zerado — e o pré-preenchimento vem corretamente do `lastSetData` do novo exercício

**Arquivos:** `src/pages/WorkoutSessionPage.tsx` (componente `SetList`, mapeamento `sets.map`)

---

### Ponto 5 — Observações dos exercícios visíveis na tela de treino

**Problema:** O campo `notes` (observações que o admin coloca em cada exercício dentro da ficha, ex: "1 aquec + 2 feeders antes") existe no banco mas não aparece durante o treino.

**Solução:**
- Exibir `ex.notes` logo abaixo dos chips de grupo muscular/séries/reps no cabeçalho do exercício
- Estilo: texto com destaque visual (borda esquerda accent + fundo sutil), visível em ambos os layouts
- Só renderizar se `ex.notes` não for vazio/null

**Onde exibir:**
- **Layout A:** dentro do card de cabeçalho do exercício, após os chips
- **Layout B:** dentro da área `.forja-treino-b-info`, após os chips/meta

**Arquivos:** `src/pages/WorkoutSessionPage.tsx` (LayoutA — bloco de chips; LayoutB — bloco de info)

---

## Seção B — Visualização de Ficha (`WorkoutDetailPage` + `WorkoutFormPage`)

### Ponto 6 — Campo de descrição editável pelo admin

**Problema:** O campo `description` da ficha aparece na tela do aluno mas não tem onde editar/apagar no painel admin. O formulário de criação/edição de fichas (`WorkoutFormPage`) não tem campo para esse campo.

**Solução:**
- Adicionar campo "Descrição" (textarea opcional) ao formulário de fichas no admin (`WorkoutFormPage`)
- Posição: logo abaixo do campo "Nome da ficha", antes dos dias da semana
- Placeholder: "Descrição opcional da ficha (método, observações gerais...)"
- O campo já é suportado pelo banco e pela função `updateWorkout()` — só falta o input no formulário
- Na tela do aluno (`WorkoutDetailPage`), o comportamento não muda: descrição só aparece se não estiver vazia

**Arquivos:** `src/pages/admin/WorkoutFormPage.tsx`

---

## Seção C — Histórico de Treino (`SessionDetailPage`)

### Ponto 7 — Editar sessão no histórico (Modo Edição)

**Problema:** A tela de detalhe de sessão é somente leitura. Não é possível corrigir valores registrados erroneamente (reps, carga, duração, dificuldade).

**Solução — Modo de Edição (Opção B aprovada):**

**UI:**
- Adicionar botão "Editar sessão" nas ações da Topbar (ao lado de "Voltar")
- Estado: `const [isEditing, setIsEditing] = useState(false)`
- Em modo de edição, os campos viram inputs:
  - **Duração:** input numérico (minutos)
  - **Dificuldade:** seletor com os 4 emojis (easy / medium / hard / terrible)
  - **Observações da sessão:** textarea
  - **Cada série:** colunas de reps e carga viram inputs numéricos
- Botões ao final da tela em modo edição: "Salvar alterações" (primário) e "Cancelar"
- "Cancelar" restaura os valores originais (sem chamar o banco)
- "Salvar alterações" chama as funções de update e sai do modo de edição

**Limitação intencional:** não é possível adicionar ou remover séries — apenas editar os valores das séries já registradas.

**Novas funções em `workout-log.service.ts`:**
```ts
updateWorkoutLog(
  logId: string,
  data: { durationMinutes: number; difficulty: string; notes: string }
): Promise<void>
// UPDATE workout_logs WHERE id = ?

updateExerciseLog(
  logId: string,
  data: { repsCompleted: number; loadKg: number | null }
): Promise<void>
// UPDATE exercise_logs WHERE id = ?
// Os IDs das séries já estão carregados em session.exercise_logs
```

**Arquivos:** `src/pages/SessionDetailPage.tsx`, `src/services/workout-log.service.ts`

---

## Resumo de arquivos impactados

| Arquivo | Pontos |
|---------|--------|
| `src/pages/WorkoutSessionPage.tsx` | 1, 2, 3, 4, 5 |
| `src/services/workout-log.service.ts` | 3, 7 |
| `src/pages/admin/WorkoutFormPage.tsx` | 6 |
| `src/pages/SessionDetailPage.tsx` | 7 |

---

## Critério de conclusão

- [ ] Timer de descanso não tem mais botões de controle em nenhum layout
- [ ] Botão de troca de layout não aparece no mobile (≤ 768px)
- [ ] Séries marcadas como concluídas continuam editáveis; alterações são salvas no banco
- [ ] Ao trocar de exercício, os campos resetam corretamente com dados do novo exercício
- [ ] Observações (`ex.notes`) aparecem no cabeçalho do exercício durante o treino
- [ ] Admin consegue editar/apagar a descrição da ficha no formulário
- [ ] Tela de histórico tem modo de edição que permite corrigir duração, dificuldade, notas e séries
- [ ] Build sem erros de TypeScript
