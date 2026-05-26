# MUSCLE TRAINING — Plan.md

**Versão:** 3.0  
**Atualizado em:** 25 de maio de 2026  
**Status:** Em andamento 🚧

> Este é o documento central de execução do projeto.  
> Referências: [PRD](docs/superpowers/specs/2026-05-22-musctrainig-prd.md) | [CLAUDE.md](CLAUDE.md)

---

## Estado atual do projeto

| Fase | Descrição | Status |
|------|-----------|--------|
| 1 | Fundação (Vite + React + TypeScript + Tailwind) | ✅ Completa |
| 2 | Banco de dados (Supabase: tabelas, RLS, seed) | ✅ Completa |
| 3 | Autenticação (login, logout, rotas protegidas) | ✅ Completa |
| 4 | Perfil do usuário | ✅ Completa |
| 4.5 | Design System v2 "Nova" (Syne + DM Mono + lime #c8f04a + dark/light) | ✅ Completa |
| 5 | Fichas de treino (CRUD admin + visualização aluno) | ✅ Completa |
| 6 | Execução de treino (séries, timer) | ✅ Completa |
| 7 | Histórico e progressão (gráficos) | ⏳ Pendente |
| 8 | Nutrição + IA (Gemini) | ⏳ Pendente |
| 9 | Painel admin (gestão de alunos) | ⏳ Pendente |
| 10 | Polish + PWA | ⏳ Pendente |
| 11 | Deploy (Vercel) | ⏳ Pendente |

---

## Fluxo de trabalho padrão

### 🟡 Fase Simples
```
/frontend-design (ou skill específica)
  → implementar
  → /verify (confirmar que funcionou)
  → /simplify (melhorar o código)
  → commit
```

### 🔴 Fase Complexa
```
/brainstorming (design + decisões aprovadas)
  → implementar
  → /verify (confirmar que funcionou)
  → /simplify (melhorar o código)
  → /security-review (se houver dados sensíveis)
  → commit
```

---

## Fases concluídas

---

### FASE 1 — Fundação ✅
React 19 + TypeScript + Vite 6 + Tailwind CSS v4 + React Router v7 + Motion.

---

### FASE 2 — Banco de dados ✅
**O que foi entregue:** 9 tabelas no Supabase, RLS ativo em todas, 39 exercícios pré-cadastrados em `exercise_library`.

**SQL:** `supabase-setup.sql` — rodar no Supabase SQL Editor sempre que montar o banco do zero.

**Patches aplicados:**
- v1: criação inicial das tabelas
- v2: índices, RLS refinada, segurança
- v3 (Fase 5): `is_template` e `template_id` em `workouts`, RLS atualizada para alunos lerem templates

---

### FASE 3 — Autenticação ✅
Login/logout via Supabase Auth. `ProtectedRoute` e `AdminRoute` protegem as rotas. `AuthContext` disponibiliza `profile`, `isAdmin`, `signOut`.

---

### FASE 4 — Perfil do usuário ✅
`ProfilePage` com edição de nome, peso, altura, objetivo, peso alvo, foto. Serviço em `profile.service.ts`.

---

### FASE 4.5 — Design System v2 "Nova" ✅
- **Tipografia:** Syne 800 (display) + DM Mono 300 (mono/corpo)
- **Cor primária:** Verde-limão `#c8f04a` (mapeado como `orange-500` no Tailwind)
- **Tema:** Dark (`#05050a` bg) + Light (`#f5f4ee` bg) via `[data-theme]` no `<html>`
- **Toggle:** `ThemeSwitcher` no header — armazena preferência em `localStorage`
- **Variáveis CSS:** todas em `src/index.css` — `var(--accent)`, `var(--fg)`, `var(--surface)`, etc.
- **Efeitos:** noise texture (`body::before`), orb glow (`body::after`), skeleton shimmer

---

### FASE 5 — Fichas de treino ✅
**Spec:** [2026-05-25-fichas-treino-design.md](docs/superpowers/specs/2026-05-25-fichas-treino-design.md)

**O que foi entregue:**

*Aluno:*
- `/workouts` — `WorkoutsPage`: ficha do dia em destaque (detectada pelo dia da semana) + lista das outras
- `/workouts/:id` — `WorkoutDetailPage`: lista ordenada dos exercícios com séries × reps × carga

*Admin:*
- `/admin/workouts` — `WorkoutsAdminPage`: biblioteca de templates com contagem de uso por aluno
- `/admin/workouts/new` e `/:id/edit` — `WorkoutFormPage`: criar/editar ficha com seletor de exercícios

*Componentes:*
- `WorkoutCard` — card reutilizável (badge HOJE, botões editar/atribuir)
- `ExerciseRow` — linha de exercício (modo leitura e modo edição com inputs)
- `ExerciseSelector` — modal de busca no catálogo + **criação de exercício novo** diretamente no modal
- `AssignWorkoutModal` — atribuição de template para um ou mais alunos

*Serviço:* `workout.service.ts` com 13 funções cobrindo tudo — aluno, admin, biblioteca, atribuição, exercícios.

**Decisões de design adotadas (brainstorming 554-1779734956):**
- Modelo misto: fichas podem ser templates reutilizáveis (`is_template = true`) ou fichas de alunos
- Campos de exercício avançados: séries, reps (string para suportar "8-12"), carga, descanso, obs
- Aluno vê "hoje em destaque" (detectado pelo `week_days`)
- Admin tem dois caminhos: biblioteca global E via perfil do aluno
- Seletor de exercício via modal (não drag-and-drop)
- Admin pode criar exercícios personalizados diretamente no modal de busca

---

## Próxima fase

---

### FASE 6 — Execução de treino ⏳
**Complexidade:** 🔴 Complexa  
**Spec:** [2026-05-26-execucao-treino-design.md](docs/superpowers/specs/2026-05-26-execucao-treino-design.md)

**O que entrega:** Interface de treino ativo — o aluno registra cada série, usa o timer de descanso e finaliza o treino.

---

#### Plano de implementação — ordem de execução

**Passo 1 — Serviço de banco** `src/services/workout-log.service.ts`
```
startWorkoutSession(workoutId, userId)   → cria workout_log, retorna ID
logExerciseSet(workoutLogId, exerciseId, { setNumber, repsCompleted, loadKg })
                                          → cria exercise_log imediatamente
finishWorkoutSession(workoutLogId, { difficulty, notes, durationMinutes })
                                          → atualiza workout_log com finished_at
deleteWorkoutSession(workoutLogId)        → apaga exercise_logs + workout_log
```

**Passo 2 — Componente ExerciseSetRow** `src/components/ExerciseSetRow.tsx`
```
Props: setNumber, suggestedReps (string), suggestedLoad, isCompleted,
       onChange(reps, loadKg), onComplete()
- Inputs de reps e kg pré-preenchidos com valores sugeridos da ficha
- Botão "✓ Feita" → onChange → onComplete
- isCompleted=true: estilo verde, ícone substitui botão, ainda editável
```

**Passo 3 — Componente RestTimer** `src/components/RestTimer.tsx`
```
Props: seconds, isRunning, onPause(), onSkip()
- Banner fixo abaixo do header — visível apenas quando seconds > 0
- Countdown mm:ss em verde-limão
- Botões "⏸ Pausar" e "Pular →"
- seconds === 0: banner pulsa, texto "Pronto! Próxima série"
- setInterval vive no pai (WorkoutSessionPage)
```

**Passo 4 — Componente WorkoutFinishModal** `src/components/WorkoutFinishModal.tsx`
```
Props: isOpen, durationMinutes, totalExercises, totalSets,
       onConfirm({ difficulty, notes }), onClose(), isLoading
- Stats: duração / exercícios / séries
- Grid 2×2: 😊 Fácil · 💪 Médio · 🔥 Difícil · 💀 Destruidor
- Textarea observações (opcional)
- Botão "SALVAR TREINO →" — desabilitado até escolher dificuldade
```

**Passo 5 — Página WorkoutSessionPage** `src/pages/WorkoutSessionPage.tsx`
```
Estado: workoutLogId, currentExerciseIdx, setsCompleted, timerSeconds,
        isTimerRunning, showFinishModal, startTime, isFinishing, showExitModal

useEffect (montagem):
  → getWorkoutById(id) para carregar ficha e exercícios
  → startWorkoutSession(id, userId) → workoutLogId

Layout:
  Header: "← Sair" | nome da ficha | "Finalizar"
  RestTimer (quando ativo)
  Barra de progresso exercício X/Y
  Card exercício atual (borda lime, grande):
    Toggle "ℹ Instruções" → notas + video_url do exercício
    ExerciseSetRow × N séries
  Seção "// outros exercícios":
    Cards colapsados clicáveis → setCurrentExerciseIdx
    Badge "✓ concluído" se todas séries feitas
  Botão ghost "// encerrar treino"
  WorkoutFinishModal (sobreposto)
  Modal "Sair?" com opções: "Descartar" | "Salvar incompleto"

Lógica de progressão:
  handleSetComplete → logExerciseSet → setsCompleted++ → inicia timer
  se setsCompleted === exercise.sets → 800ms → avança exercício
  se último exercício → abre WorkoutFinishModal automaticamente

handleExit (botão ← Sair):
  "Descartar" → deleteWorkoutSession → /workouts
  "Salvar incompleto" → /workouts (workout_log sem finished_at)
```

**Passo 6 — Rota e botão de entrada**
```
App.tsx: adicionar <Route path="/workouts/:id/session" element={<WorkoutSessionPage />} />
WorkoutDetailPage.tsx: botão "Iniciar Treino →" no topo → navigate(`/workouts/${id}/session`)
```

**Critério de conclusão:** Aluno inicia, registra séries, timer funciona, dados aparecem em `workout_logs` e `exercise_logs` no Supabase.

**Critério de conclusão:** Aluno inicia treino, registra séries, timer funciona, ao finalizar os dados aparecem em `workout_logs` e `exercise_logs` no Supabase.

---

### FASE 7 — Histórico e progressão ⏳
**Complexidade:** 🟡 Simples → usar `/frontend-design`

**O que entrega:** Lista de treinos realizados + gráficos de evolução de carga e frequência.

**Arquivos a criar:**
```
src/services/history.service.ts
src/pages/HistoryPage.tsx
src/pages/SessionDetailPage.tsx
src/pages/ProgressPage.tsx
src/components/charts/LoadProgressChart.tsx
src/components/charts/WorkoutFrequencyChart.tsx
```

**Critério de conclusão:** Aluno vê lista de treinos passados e gráfico de evolução de pelo menos um exercício.

---

### FASE 8 — Nutrição + IA ⏳
**Complexidade:** 🔴 Complexa → iniciar com `/brainstorming`

**O que entrega:** Diário alimentar com análise automática por Google Gemini.

**Arquivos a criar:**
```
src/services/nutrition.service.ts
src/services/ai.service.ts          — chamada ao Gemini
src/pages/NutritionPage.tsx
src/components/MealCard.tsx
src/components/MealForm.tsx
```

**Prompt base para o Gemini:**
```
Você é um nutricionista especialista em musculação.
Analise esta refeição e dê um feedback construtivo em português:
Tipo: {meal_type} | Descrição: {description}
Seja direto, positivo e prático. Máximo 3 frases.
```

**Critério de conclusão:** Aluno registra refeição e recebe feedback da IA abaixo do registro.

---

### FASE 9 — Painel administrativo ⏳
**Complexidade:** 🔴 Complexa → iniciar com `/brainstorming`

**O que entrega:** Dashboard do admin com estatísticas, lista de alunos, criação de aluno, perfil completo do aluno com histórico e fichas.

**Arquivos a criar:**
```
src/services/admin.service.ts
src/pages/admin/AdminDashboardPage.tsx
src/pages/admin/StudentsPage.tsx
src/pages/admin/StudentDetailPage.tsx   — inclui fichas atribuídas (simplificado na Fase 5)
src/pages/admin/ExerciseLibraryPage.tsx
```

**Nota:** O `StudentDetailPage` foi parcialmente antecipado na Fase 5 — o fluxo de atribuição via perfil já funciona com `?userId=` na `WorkoutFormPage`. A Fase 9 o expande com histórico, medidas e gestão completa.

**Critério de conclusão:** Admin consegue criar um novo aluno, atribuir uma ficha e ver o histórico desse aluno.

---

### FASE 10 — Polish + PWA ⏳
**Complexidade:** 🟡 Simples → usar `/frontend-design` para componentes visuais

**Checklist:**
- [ ] Componente Toast (notificações de sucesso/erro) — substituir `alert()` ainda presente em alguns lugares
- [ ] Tratamento de erros amigável em toda a app (auditar todos os `catch`)
- [ ] Animações de transição entre páginas (Motion `AnimatePresence`)
- [ ] Ícones PWA (192×192 e 512×512)
- [ ] `manifest.json` configurado
- [ ] Testes no celular (Chrome DevTools → modo mobile)
- [ ] Lighthouse audit (meta: PWA score > 90)
- [ ] Substituir `confirm()` nos diálogos de confirmação por modal próprio

**Critério de conclusão:** App instalável no Android, Lighthouse PWA ≥ 90, sem `alert()`/`confirm()` no código.

---

### FASE 11 — Deploy ⏳
**Complexidade:** 🟡 Simples (checklist)

**Passos:**
1. Criar conta em [vercel.com](https://vercel.com) e conectar o repositório GitHub `dnsrodrigues/musctrainig`
2. Configurar variáveis de ambiente no Vercel:
   ```
   VITE_SUPABASE_URL=https://xfcblbdwaibpzcpwzkow.supabase.co
   VITE_SUPABASE_ANON_KEY=sb_publishable_...
   VITE_GEMINI_API_KEY=...
   ```
3. Fazer deploy e testar a URL de produção
4. (Opcional) Configurar domínio personalizado

**Critério de conclusão:** URL pública funciona, login funciona, dados são salvos no Supabase de produção.

---

## Ordem de execução

```
✅2 → ✅4 → ✅4.5 → ✅5 → 6 → 7 → 8 → 9 → 10 → 11
```

> A partir da fase 6, seguir a sequência — cada fase depende da anterior.

---

*Atualizado por Denis Rodrigues em 25/05/2026*
