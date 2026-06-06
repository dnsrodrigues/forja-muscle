# MUSCLE TRAINING — Plan.md

**Versão:** 4.1  
**Atualizado em:** 05 de junho de 2026  
**Status:** ✅ Projeto completo — em produção

> Este é o documento central de execução do projeto.  
> Referências: [PRD](docs/superpowers/specs/2026-05-22-musctrainig-prd.md) | [CLAUDE.md](CLAUDE.md)

---

## Estado atual do projeto

| Fase | Descrição | Status |
|------|-----------|--------|
| 1 | Fundação (Vite + React + TypeScript + Tailwind) | ✅ Completa |
| 2 | Banco de dados (Supabase: tabelas, RLS, seed) | ✅ Completa |
| 3 | Autenticação (login, logout, rotas protegidas) | ✅ Completa |
| 4 | Perfil do usuário + upload/recorte de foto | ✅ Completa |
| 4.5 | Design System v3 "Aurora" FORJA (Outfit + JetBrains Mono + azul/roxo + glassmorphism) | ✅ Completa |
| 5 | Fichas de treino (CRUD admin + visualização aluno) | ✅ Completa |
| 6 | Execução de treino (séries, timer) | ✅ Completa |
| 7 | Histórico e progressão (gráficos) | ✅ Completa |
| 7.5 | Melhorias pré-Fase 8 (métricas reais, ícones FORJA, acessibilidade) | ✅ Completa |
| 8 | Nutrição + IA (Groq/Llama) | ✅ Completa |
| 9 | Painel admin (gestão de alunos) | ✅ Completa |
| 10 | Polish + PWA | ✅ Completa |
| 11 | Deploy (Vercel) | ✅ Completa |

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
- v3 (Fase 5): `is_template` e `template_id` em `workouts`, RLS para alunos lerem templates
- v4 (Fase 8): coluna `is_active` em `nutrition_logs`, RLS para trainer ver diário do aluno
- v5 (Fase 9): tabelas de trainers, RLS para gestão de alunos
- v6 (05/06/2026): RLS corrigida — `super_admin` e `trainer` agora têm permissão de gestores em `workout_exercises`, `workouts` e `exercise_library` (`supabase-patch-v6-roles.sql`)

---

### FASE 3 — Autenticação ✅
Login/logout via Supabase Auth. `ProtectedRoute` e `AdminRoute` protegem as rotas. `AuthContext` disponibiliza `profile`, `isAdmin`, `signOut`.

---

### FASE 4 — Perfil do usuário ✅
`ProfilePage` com edição de nome, peso, altura, objetivo, peso alvo, foto. Serviço em `profile.service.ts`.  
**Adicionado (28/05):** upload e recorte de foto de perfil diretamente no app — crop circular, imagem salva no Supabase Storage.

---

### FASE 4.5 — Design System v3 "Aurora" (FORJA) ✅
Redesign completo aplicado a todas as páginas (login, dashboard, fichas, execução, histórico, perfil, admin).
- **Tipografia:** Outfit 800 (display/títulos) + JetBrains Mono 400 (labels/mono)
- **Paleta dark:** fundo `#06071a`, superfície `#0c0e28`, acento azul `#6c8ef7`, acento roxo `#c44fe0`
- **Paleta light:** fundo `#f0f1ff`, superfície `#e6e8ff`, acento `#3d5ee8`
- **Tema:** Dark (padrão) + Light via `[data-theme]` no `<html>` — salvo em `localStorage`
- **Variáveis CSS:** todas em `src/index.css` — `var(--accent)`, `var(--accent-2)`, `var(--fg)`, etc.
- **Efeitos:** `.glass-card` (glassmorphism), `.glow-border` (conic-gradient animado), `.gradient-text`, shader WebGL no Login (Three.js)
- **Ícones:** SVG próprios FORJA — Lucide React completamente removido

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

### FASE 7 — Histórico & Progressão ⏳
**Complexidade:** 🟡 Média  
**Spec:** [2026-05-26-historico-progressao-design.md](docs/superpowers/specs/2026-05-26-historico-progressao-design.md)

**O que entrega:** Histórico completo de sessões, gráficos de progressão de carga e frequência, registro de peso corporal e medidas com gráficos de evolução. Cards de resumo no Dashboard.

---

#### Plano de implementação — ordem de execução

**Passo 1 — Instalar Recharts**
```bash
npm install recharts
```
Recharts é a lib de gráficos especificada no PRD. Instalar antes de qualquer componente de gráfico.

---

**Passo 2 — Novos tipos** `src/types/index.ts`
```ts
// Adicionar ao arquivo existente:

interface WorkoutLogDetail extends WorkoutLog {
  workout?: Workout
  exercise_logs: ExerciseLogDetail[]
}

interface ExerciseLogDetail extends ExerciseLog {
  exercise: Exercise  // non-optional
}

interface LoadPoint {
  date: string      // 'YYYY-MM-DD'
  maxLoad: number   // kg máximo registrado naquela sessão
}

interface WeekFrequency {
  week: string      // 'YYYY-MM-DD' (segunda-feira da semana)
  count: number     // quantidade de treinos naquela semana
}
```

---

**Passo 3 — Serviço de histórico** `src/services/history.service.ts`
```
getWorkoutHistory(userId)
  → SELECT workout_logs + JOIN workouts, ORDER BY started_at DESC

getSessionDetail(logId)
  → SELECT workout_log + exercise_logs + JOIN exercise_library

getExercisesTrainedByUser(userId)
  → SELECT DISTINCT exercícios via exercise_logs → workout_logs WHERE user_id

getLoadProgression(userId, exerciseId)
  → Busca exercise_logs do exercício, agrega MAX(load_kg) por data em JS

getWeeklyFrequency(userId)
  → Busca workout_logs das últimas 8 semanas, agrupa por semana em JS
```

---

**Passo 4 — Serviço de medidas** `src/services/measurements.service.ts`
```
getUserWeights(userId)        → SELECT user_weights ORDER BY measured_at DESC
addUserWeight(userId, kg, at) → INSERT INTO user_weights
getBodyMeasurements(userId)   → SELECT body_measurements LIMIT 3
addBodyMeasurement(userId, d) → INSERT INTO body_measurements
```

---

**Passo 5 — Componentes de gráficos** `src/components/charts/`
```
LoadProgressChart.tsx  — LineChart (carga × data), cor lime, tooltip customizado
FrequencyChart.tsx     — BarChart (treinos × semana), barras arredondadas, cor lime
WeightChart.tsx        — LineChart com área preenchida (peso × data), gradiente lime
```
Props e contratos conforme spec §4.

---

**Passo 6 — Modais de registro**
```
src/components/WeightEntryModal.tsx
  → Bottom sheet (padrão WorkoutFinishModal)
  → Campos: peso (kg, pré-preenchido com último valor), data (default hoje)
  → Props: isOpen, onClose, onSaved(weight)

src/components/MeasurementEntryModal.tsx
  → Bottom sheet
  → Campos opcionais: cintura, quadril, abdômen, coxa, braço, peitoral, panturrilha (cm)
  → Salvar habilitado se ≥ 1 campo preenchido
  → Props: isOpen, onClose, onSaved(measurement)
```

---

**Passo 7 — HistoryPage** `src/pages/HistoryPage.tsx`
```
Rota: /historico
- Lista cronológica reversa de workout_logs
- Card por sessão: data, nome da ficha, duração, emoji dificuldade, nº séries
- Toque → /historico/:logId
- Estado vazio: botão "Começar agora →" → /workouts
```

---

**Passo 8 — SessionDetailPage** `src/pages/SessionDetailPage.tsx`
```
Rota: /historico/:logId
- Header: ← + nome da ficha + data
- Bloco de meta: duração · dificuldade · séries totais
- Notas (se existirem)
- Por exercício: nome + grupo muscular + tabela de séries (nº | reps | kg ✓)
- Botão "📈 ver evolução →" → /progresso?exercise=:exerciseId
```

---

**Passo 9 — ProgressPage** `src/pages/ProgressPage.tsx`
```
Rota: /progresso
- Lê ?exercise= da URL (pré-seleciona dropdown)
- Bloco 1: dropdown de exercício + LoadProgressChart + chip de variação total
- Bloco 2: FrequencyChart (últimas 8 semanas)
- Estado vazio global se nenhum treino registrado
```

---

**Passo 10 — MeasurementsPage** `src/pages/MeasurementsPage.tsx`
```
Rota: /medidas
- Seção peso: WeightChart + lista últimos 10 + botão "+ Registrar peso" → WeightEntryModal
- Seção medidas: grid do último registro + lista últimos 3 + botão "+ Nova medição" → MeasurementEntryModal
```

---

**Passo 11 — Atualizar DashboardPage** `src/pages/DashboardPage.tsx`
```
Adicionar 3 cards abaixo do card de treino do dia:
- "Último treino" (data, ficha, duração, dificuldade) → /historico
- "Progresso" (sequência semanal + peso atual) → /progresso
- "Medidas" (peso atual + variação total) → /medidas
Cada card mostra estado vazio se sem dados.
```

---

**Passo 12 — Rotas** `src/App.tsx`
```tsx
<Route path="/historico" element={<HistoryPage />} />
<Route path="/historico/:logId" element={<SessionDetailPage />} />
<Route path="/progresso" element={<ProgressPage />} />
<Route path="/medidas" element={<MeasurementsPage />} />
```

---

**Critério de conclusão:**
- [x] Aluno vê lista de sessões em `/historico`
- [x] Aluno abre detalhe de sessão com todas as séries
- [x] Gráfico de evolução de carga funciona para pelo menos um exercício
- [x] Gráfico de frequência semanal exibe dados reais
- [x] Aluno registra peso e vê gráfico de evolução
- [x] Aluno registra medidas corporais
- [x] Cards de resumo no Dashboard com dados reais
- [x] Build sem erros de TypeScript

---

### FASE 7.5 — Melhorias pré-Fase 8 ✅
**Spec:** [2026-05-26-melhorias-pre-fase-8-design.md](docs/superpowers/specs/2026-05-26-melhorias-pre-fase-8-design.md)

**O que foi entregue:**
- **Métricas reais no Dashboard:** streak de treinos, PRs do mês, volume da semana, tempo médio de sessão — 4 novas funções em `history.service.ts`
- **Migração de ícones:** todos os ícones migrados para o Design System FORJA (SVG próprios); Lucide React removido do projeto
- **Acessibilidade básica:** `role=dialog` em todos os modais, `focus-visible`, skip link no layout, fechar modal com tecla Esc
- **Upload de foto de perfil:** crop circular, preview antes de salvar, imagem no Supabase Storage
- **Shader WebGL no Login:** fundo animado com Three.js (efeito visual único)
- **Build limpo:** todos os erros de TypeScript corrigidos

---

### FASE 8 — Nutrição + IA ✅
**Spec:** [2026-05-29-nutricao-ia-design.md](docs/superpowers/specs/2026-05-29-nutricao-ia-design.md)

**O que foi entregue:**
- **Diário alimentar** (`/nutricao`): anel de calorias + barras de macros, navegação entre dias, lista de refeições
- **Análise por IA**: Edge Function `analyze-meal` chama Groq API (llama-3.1-8b-instant) → estima calorias + proteína + carbo + gordura + feedback em texto (Groq é gratuito; Gemini exige billing no Brasil)
- **Bottom sheet** de registro: chips de tipo → descrição livre → analisar → macros editáveis → salvar
- **Metas automáticas**: fórmula Harris-Benedict × fator de atividade, ajustada pelo objetivo do perfil (perder/manter/ganhar)
- **Soft delete**: `is_active = false` ao excluir refeição
- **Acesso trainer**: `/nutricao?userId=X` — trainer vê o diário do aluno (somente leitura)
- **Navegação**: item "Nutrição" no menu lateral e na tabbar mobile
- **Banco**: Patch v5 — coluna `is_active` em `nutrition_logs` + RLS para trainer
- **Build limpo**: zero erros TypeScript

**Ação manual necessária (usuário):**
1. Rodar o SQL do Patch v5 no Supabase SQL Editor
2. Deploy da Edge Function `analyze-meal` no painel Supabase
3. Configurar o secret `GEMINI_API_KEY` na função

---

### FASE 9 — Painel administrativo ✅
**Complexidade:** 🔴 Complexa

**O que foi entregue:** Dashboard do admin com estatísticas, lista de alunos, criação de aluno, perfil completo do aluno com histórico e fichas.

**Arquivos criados:**
```
src/services/admin.service.ts
src/pages/admin/AdminDashboardPage.tsx
src/pages/admin/StudentsPage.tsx
src/pages/admin/StudentDetailPage.tsx
src/pages/admin/ExerciseLibraryPage.tsx
```

**Critério de conclusão:** Admin consegue criar um novo aluno, atribuir uma ficha e ver o histórico desse aluno.

---

### FASE 10 — Polish + PWA ✅

**O que foi entregue:**
- **Toast component** (`src/components/ui/ToastStack.tsx` + `src/context/ToastContext.tsx`): sistema de notificações com tipos success/error/warning/info, auto-dismiss após 4s, animações Motion
- **Tratamento de erros amigável:** padrão `showToast()` em todos os componentes e páginas — zero `alert()` ou `confirm()` no código
- **Animações de transição:** `AnimatePresence` no `App.tsx` com fade + translate entre páginas; Motion extensamente usado em modais
- **Ícones PWA:** `public/favicon-192.png` e `public/favicon-512.png`
- **manifest.json:** completo em `public/manifest.json` (standalone, pt-BR, categorias fitness)
- **Meta tags PWA** no `index.html`: theme-color, apple-touch-icon, mobile-web-app-capable
- **Service Worker:** `vite-plugin-pwa` configurado no `vite.config.ts` — Workbox gera `dist/sw.js` automaticamente no build com precache de todos os assets estáticos

**Critério de conclusão:** ✅ App instalável no Android, Lighthouse PWA ≥ 90, sem `alert()`/`confirm()` no código.

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

### FASE 11 — Deploy ✅
**Complexidade:** 🟡 Simples (checklist)

**Repositório:** `https://github.com/dnsrodrigues/forja-muscle` (renomeado de `musctrainig` em 05/06/2026)  
**URL de produção:** `https://forjamuscle.vercel.app`  
**Deploy:** automático — cada `git push` para `main` publica em ~2 minutos.

**Variáveis de ambiente configuradas no Vercel:**
```
VITE_SUPABASE_URL=https://xfcblbdwaibpzcpwzkow.supabase.co
VITE_SUPABASE_ANON_KEY=sb_publishable_...
```

**Critério de conclusão:** ✅ URL pública funciona, login funciona, dados salvos no Supabase de produção.

---

## Correções e melhorias pós-deploy

### 05 de junho de 2026

**Bug 1 — RLS bloqueava super_admin/trainer ao salvar fichas** ✅ Corrigido
- **Sintoma:** erro "new row violates row-level security policy for table workout_exercises" ao adicionar exercício; edições de séries/reps não salvavam silenciosamente.
- **Causa:** as políticas RLS originais só reconheciam o cargo `admin` (descontinuado). Os cargos `super_admin` e `trainer` da Fase 9 nunca foram adicionados às regras do banco.
- **Correção:** `supabase-patch-v6-roles.sql` — cria a função `is_manager()` e novas políticas para `workout_exercises`, `workouts` e `exercise_library`. Aplicar no Supabase SQL Editor.

**Bug 2 — Exercícios removidos persistiam ao salvar ficha editada** ✅ Corrigido
- **Sintoma:** ao editar uma ficha e remover exercícios, eles continuavam aparecendo após salvar.
- **Causa:** `WorkoutFormPage.handleSave()` adicionava novos e atualizava existentes, mas não chamava `removeExerciseFromWorkout()` para os removidos.
- **Correção:** `WorkoutFormPage.tsx` agora guarda `originalExerciseIds` ao carregar a ficha e, ao salvar, apaga do banco os IDs que não estão mais na lista atual.

**Melhoria — Fichas ordenadas por dia da semana** ✅
- **O que faz:** templates e fichas de alunos aparecem ordenados Segunda → Domingo (em vez de por data de criação).
- **Implementação:** `src/lib/workout-sort.ts` — função `sortWorkoutsByWeekday()` reutilizável. Aplicada em `WorkoutsAdminPage`.

**Melhoria — Tela de login corrigida no mobile** ✅
- Números decorativos (stats animados) ocultados em telas pequenas via `.forja-login-stats { display: none }` no breakpoint `max-width: 768px`, evitando sobreposição sobre o formulário.

---

## Ordem de execução

```
✅1 → ✅2 → ✅3 → ✅4 → ✅4.5 → ✅5 → ✅6 → ✅7 → ✅7.5 → ✅8 → ✅9 → ✅10 → 11
```

> A partir da fase 6, seguir a sequência — cada fase depende da anterior.

---

*Atualizado por Denis Rodrigues em 28/05/2026*
