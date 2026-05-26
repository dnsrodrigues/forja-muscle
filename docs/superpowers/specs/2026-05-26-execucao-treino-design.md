# Fase 6 — Execução de Treino: Design Document

**Versão:** 1.0  
**Criado em:** 26 de maio de 2026  
**Autor:** Denis Rodrigues  
**Status:** Aprovado ✅

---

## Contexto

A Fase 5 entregou a criação e visualização de fichas de treino. A Fase 6 é a continuação natural: o aluno seleciona uma ficha e registra o treino em tempo real — série por série — com timer de descanso automático.

**Pré-requisitos já implementados:**
- Tabelas `workout_logs` e `exercise_logs` existem no Supabase com RLS ativo
- Tipos `WorkoutLog` e `ExerciseLog` existem em `src/types/index.ts`
- `WorkoutDetailPage` exibe a ficha completa (ponto de entrada para o botão "Iniciar Treino")

---

## Decisões de Design

| Decisão | Escolha | Justificativa |
|---------|---------|---------------|
| Navegação entre exercícios | Exercício atual em destaque + outros colapsados abaixo | Foco + visão geral simultâneos |
| Registro de série | Preenche reps/kg → toca "✓ Feita" | Dados precisos antes de confirmar |
| Timer de descanso | Automático ao marcar série feita + pode pausar/pular | Disciplina o descanso, mas mantém flexibilidade |
| Persistência dos dados | Salva cada série imediatamente no Supabase | Dados nunca se perdem se o app fechar |
| Instruções do professor | Colapsadas atrás de toggle "ℹ Instruções" | Tela mais limpa; aluno expande quando precisar |

---

## Arquivos

### Novos

| Arquivo | Responsabilidade |
|---------|-----------------|
| `src/services/workout-log.service.ts` | Funções de banco: iniciar sessão, registrar série, finalizar |
| `src/pages/WorkoutSessionPage.tsx` | Tela principal do treino ativo — orquestra tudo |
| `src/components/ExerciseSetRow.tsx` | Uma linha de série: inputs de reps/kg + botão "✓ Feita" |
| `src/components/RestTimer.tsx` | Banner fixo de countdown com pausar/pular |
| `src/components/WorkoutFinishModal.tsx` | Modal de finalização com dificuldade + observações |

### Modificados

| Arquivo | O que muda |
|---------|-----------|
| `src/pages/WorkoutDetailPage.tsx` | Botão "Iniciar Treino" no topo → navega para `/workouts/:id/session` |
| `src/App.tsx` | Nova rota `/workouts/:id/session` protegida por `ProtectedRoute` |

---

## Rota

```
/workouts/:id/session    → WorkoutSessionPage    logado
```

Ponto de entrada: botão "Iniciar Treino" em `WorkoutDetailPage`.  
Ao finalizar ou sair: navega de volta para `/workouts`.

---

## Serviço — `workout-log.service.ts`

### `startWorkoutSession(workoutId: string, userId: string): Promise<string>`

- Insere em `workout_logs`: `{ workout_id, user_id, started_at: new Date() }`
- Retorna o `id` da linha criada (`workoutLogId`)
- Chamado no `useEffect` de montagem do `WorkoutSessionPage`

### `logExerciseSet(workoutLogId: string, exerciseId: string, data: { setNumber: number, repsCompleted: number, loadKg: number | null }): Promise<void>`

- Insere em `exercise_logs`: `{ workout_log_id, exercise_id, set_number, reps_completed, load_kg, completed: true }`
- Chamado imediatamente quando o aluno toca "✓ Feita"
- Erros são logados no console mas não bloqueiam o fluxo (UX não pode travar)

### `finishWorkoutSession(workoutLogId: string, data: { difficulty: 'easy' | 'medium' | 'hard' | 'terrible', notes: string, durationMinutes: number }): Promise<void>`

- Atualiza `workout_logs` SET `finished_at = now()`, `difficulty`, `notes`, `duration_minutes`
- Chamado ao confirmar no `WorkoutFinishModal`

---

## Componentes

### `ExerciseSetRow`

```ts
interface ExerciseSetRowProps {
  setNumber: number
  suggestedReps: string      // ex: "8-12" ou "12" — vem da ficha
  suggestedLoad: number | null
  isCompleted: boolean
  onChange: (reps: number, loadKg: number | null) => void
  onComplete: () => void
}
```

**Comportamento:**
- Inputs de reps e kg pré-preenchidos com `suggestedReps` e `suggestedLoad`
- `suggestedReps` é string (pode ser "8-12") — input aceita número livre
- Botão "✓ Feita" chama `onChange(reps, loadKg)` → `onComplete()`
- Quando `isCompleted=true`: inputs ficam com estilo verde, ícone ✓ substitui botão
- Séries completadas ainda permitem editar os valores (correção posterior)

---

### `RestTimer`

```ts
interface RestTimerProps {
  seconds: number         // contador atual — controlado pelo pai
  isRunning: boolean
  onPause: () => void
  onSkip: () => void
}
```

**Comportamento:**
- Banner fixo no topo da página (abaixo do header), visível só quando `seconds > 0` ou `isRunning`
- Exibe countdown em formato `mm:ss`
- Botões "⏸ Pausar" e "Pular →"
- Quando `seconds === 0`: banner muda para cor de destaque e exibe "Pronto! Próxima série"
- O `setInterval` vive em `WorkoutSessionPage` — `RestTimer` só renderiza e emite eventos

---

### `WorkoutFinishModal`

```ts
interface WorkoutFinishModalProps {
  isOpen: boolean
  durationMinutes: number
  totalExercises: number
  totalSets: number
  onConfirm: (data: { difficulty: string, notes: string }) => void
  onClose: () => void
  isLoading: boolean
}
```

**Renderiza:**
1. Stats rápidas: duração / total de exercícios / total de séries
2. Grid 2×2 de dificuldade com emoji:
   - 😊 Fácil (`easy`)
   - 💪 Médio (`medium`)
   - 🔥 Difícil (`hard`)
   - 💀 Destruidor (`terrible`)
3. Textarea de observações (opcional, placeholder "Como foi o treino?")
4. Botão "SALVAR TREINO →" (desabilitado até selecionar dificuldade)
5. Botão "Fechar" secundário

---

## `WorkoutSessionPage` — Estado e Lógica

### Estado local

```ts
workoutLogId: string | null         // ID criado no início
currentExerciseIdx: number          // índice do exercício ativo (começa em 0)
setsCompleted: Record<string, number> // workoutExercise.id → nº de séries feitas
timerSeconds: number                // segundos restantes do timer
isTimerRunning: boolean
showFinishModal: boolean
startTime: Date                     // para calcular duração total
isFinishing: boolean                // loading state do save final
```

### Ciclo de vida

```
useEffect (montagem)
  → carrega ficha via getWorkoutById(id)
  → chama startWorkoutSession(id, userId)
  → salva workoutLogId no estado

useEffect (limpeza / desmontagem)
  → se workoutLogId existe e treino NÃO foi finalizado:
     → não faz nada (dados das séries já foram salvos)
     → workout_log fica sem finished_at (sessão incompleta — ok)
```

### Lógica de progressão

```
handleSetComplete(workoutExercise, setNumber, reps, loadKg):
  1. chama logExerciseSet(...)       // salva no banco
  2. incrementa setsCompleted[workoutExercise.id]
  3. inicia timer (timerSeconds = workoutExercise.rest_seconds, isTimerRunning = true)
  4. se setsCompleted[id] === workoutExercise.sets:
     → aguarda 800ms → avança currentExerciseIdx
     → se era o último exercício → abre WorkoutFinishModal automaticamente

handleTimerTick():  // via setInterval
  → decrementa timerSeconds
  → se chega em 0: isTimerRunning = false
```

### Layout da página

```
[ Header: ← Sair | Nome da ficha | Finalizar ]
[ RestTimer banner — visível apenas durante descanso ]
──────────────────────────────────────────────────────
[ Barra de progresso: exercício X de Y ]
[ Exercício atual — card grande com borda lime ]
  [ toggle "ℹ Instruções" — expande notas + link vídeo ]
  [ Série 1: input reps | input kg | ✓ Feita ]
  [ Série 2: input reps | input kg | ✓ Feita ]
  ...
[ // outros exercícios — label de seção ]
[ Exercício 2 — card pequeno, opaco, colapsado ]
[ Exercício 3 — card pequeno, opaco, colapsado ]
...
[ // encerrar treino — botão ghost no rodapé ]
──────────────────────────────────────────────────────
[ WorkoutFinishModal — sobrepõe a tela ]
```

**Outros exercícios (colapsados):** são informativos — mostram nome, grupo muscular e nº de séries. O aluno **não pode tocar para pular** para eles diretamente; o avanço acontece automaticamente quando todas as séries do exercício atual são concluídas. Isso mantém o fluxo linear e evita séries puladas acidentalmente.

**Botão "← Sair":** exibe um diálogo de confirmação antes de sair ("Tem certeza? O progresso das séries já registradas não se perde, mas o treino ficará incompleto."). Se confirmar, navega para `/workouts`. O `workout_log` fica com `finished_at = null` — tratado como sessão incompleta.

---

## Tratamento de Erros

| Situação | Comportamento |
|----------|--------------|
| `startWorkoutSession` falha | Exibe mensagem de erro e botão "Tentar novamente" — não permite iniciar sem ID |
| `logExerciseSet` falha | Loga no console, mostra toast discreto de erro, mas NÃO reverte a série na UI (aluno continua o treino) |
| `finishWorkoutSession` falha | Exibe erro no modal, botão volta a ficar ativo para tentar de novo |
| Aluno fecha o app sem finalizar | `workout_log` fica com `finished_at = null` — aceitável na Fase 6; tratamento na Fase 7 |

---

## Critério de Conclusão

- [ ] Aluno inicia treino a partir de `WorkoutDetailPage`
- [ ] Cada série registrada aparece em `exercise_logs` no Supabase imediatamente
- [ ] Timer inicia automaticamente, pode pausar e pular
- [ ] Instruções do professor e link de vídeo aparecem ao expandir o toggle
- [ ] Modal de finalização salva dificuldade e observações em `workout_logs`
- [ ] Após finalizar, `workout_log` tem `finished_at`, `duration_minutes` e `difficulty` preenchidos
- [ ] Navega de volta para `/workouts` após salvar

---

## Fora do Escopo desta Fase

- Visualização do histórico de treinos (Fase 7)
- Editar ou excluir uma sessão já finalizada
- Retomar sessão interrompida (workout_log sem finished_at)
- Notificações push quando o timer zera

---

*Spec criada por Denis Rodrigues em 26/05/2026*
