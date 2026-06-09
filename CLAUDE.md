# MUSCLE TRAINING — Guia Operacional para o Claude Code

## O que é este projeto

MUSCLE TRAINING é um PWA (app web instalável no celular) de gerenciamento de treinos de musculação. Dois tipos de usuário: **Admin (Personal Trainer)** que cria fichas e gerencia alunos, e **Aluno** que registra treinos e acompanha evolução.

> Documentação completa: [PRD](docs/superpowers/specs/2026-05-22-musctrainig-prd.md) | [Plan.md](Plan.md)  
> Toda decisão de funcionalidade deve ser validada contra o PRD. Não implementar nada fora do escopo sem confirmar com o usuário.

**Fases concluídas:** 1, 2, 3, 4, 4.5 (Design System), 5 (Fichas de Treino), 6 (Execução de Treino), 7 (Histórico e Progressão), 8 (Nutrição + IA com Groq/Llama), 9 (Painel Administrativo), 10 (Polish + PWA), 11 (Deploy Vercel), 12 (Redesign Mobile FORJA)  
**Status:** ✅ Projeto completo e em produção — **https://forjamuscle.vercel.app**

> **Fase 12 — Redesign Mobile FORJA:** layout dedicado para celular (≤768px) sem alterar o desktop. Navegação por 5 abas com botão central (FAB), páginas novas (Semana, Exercícios, Alertas), perfil reformulado e tela de execução de treino + cronômetro de descanso redesenhados. Ver seção **Mobile (≤768px)** abaixo.

---

## Como se comunicar com o usuário

- **Sempre em português brasileiro**
- Explicar como se o usuário tivesse 15 anos — sem jargões
- Quando um termo técnico for inevitável, explicar o que significa na mesma frase
- Antes de executar qualquer coisa: dizer o que vai ser feito e por quê
- Depois de executar: confirmar o que foi feito em linguagem simples
- Nunca assumir que o usuário conhece: schema, RLS, deploy, commit, hook, build, migration, endpoint

---

## Skills disponíveis

| Quando usar | Skill | Comando |
|-------------|-------|---------|
| Antes de fase **complexa** (Treino, IA, Admin) | Brainstorming | `/brainstorming` |
| Criar ou melhorar componentes visuais | Frontend Design | `/frontend-design` |
| Escrever ou revisar queries no banco | Supabase Best Practices | `/supabase-postgres-best-practices` |
| Confirmar que uma mudança funcionou | Verify | `/verify` |
| Melhorar código após implementar | Simplify | `/simplify` |
| Revisar segurança antes de commit importante | Security Review | `/security-review` |

**Fluxo para fase simples:** `/frontend-design` → implementar → `/verify` → `/simplify` → commit  
**Fluxo para fase complexa:** `/brainstorming` → design aprovado → implementar → `/verify` → `/simplify` → `/security-review` → commit

---

## Estrutura de arquivos

```
src/
  components/
    admin/
      AssignToStudentModal.tsx — atribuir template a aluno específico
      ExerciseFormModal.tsx    — criar/editar exercício da biblioteca
      StudentEditModal.tsx     — editar dados do aluno (nome, objetivo, altura, peso alvo)
    charts/
      LoadProgressChart.tsx    — gráfico de progressão de carga (Recharts)
      WeightChart.tsx          — gráfico de evolução de peso (Recharts)
    layout/
      AdminRoute.tsx           — bloqueia rota se não for admin/trainer
      AppShell.tsx             — shell com sidebar + topbar + conteúdo
      MobHead.tsx              — cabeçalho padrão das páginas mobile (over/title/right)
      MobileTabbar.tsx         — barra inferior mobile: 5 abas + FAB central (sempre "meu treino")
      ProtectedRoute.tsx       — bloqueia rota se não estiver logado
      Sidebar.tsx              — navegação lateral (desktop) + ModeToggle + logout
      Topbar.tsx               — barra superior com eyebrow, título e actions
    ui/
      Avatar.tsx               — avatar quadrado com fallback nas iniciais
      AvatarCropModal.tsx      — recorte circular de foto de perfil
      ConfirmModal.tsx         — modal de confirmação genérico
      ForcePasswordModal.tsx   — força troca de senha no primeiro login
      Icon.tsx                 — ícones SVG do sistema FORJA (inclui trash, power)
      ModeToggle.tsx           — alterna Gestão / Meu Treino (só no desktop, na sidebar)
      ThemeSwitcher.tsx        — seletor de cor accent (compact = só as bolinhas)
      ToastStack.tsx           — stack de notificações toast (Fase 10)
    AssignWorkoutModal.tsx     — atribuir template a aluno(s) (template-centric)
    ExerciseRow.tsx            — linha de exercício (leitura + edição)
    ExerciseSelector.tsx       — modal de busca + criação de exercício
    MealBottomSheet.tsx        — bottom sheet para registrar refeição
    MealCard.tsx               — card de refeição no diário alimentar
    MeasurementEntryModal.tsx  — registrar medidas corporais
    ShaderBackdrop.tsx         — fundo WebGL animado na tela de login
    WeightEntryModal.tsx       — registrar peso corporal
    WorkoutCard.tsx            — card de ficha (badge HOJE, ações)
  context/
    AuthContext.tsx            — profile, isManager, isSuperAdmin, trainerMode, signOut
    ThemeContext.tsx           — mode ('dark'|'light'), accent, toggleMode
    ToastContext.tsx           — showToast(), sistema global de toasts
  hooks/
    useIsMobile.ts             — true quando viewport ≤768px (reativo a resize)
    useModalA11y.ts            — foco e teclado para modais (acessibilidade)
  lib/
    bmi.ts                     — getBmiStatus(weight, height) → cor/rótulo/tooltip IMC
    navigation.ts              — navDestinations() (sidebar) + mobileNavDestinations() (tabbar)
    nutritionGoals.ts          — calculateDailyGoals(profile) — metas calóricas
    supabase.ts                — cliente Supabase
    workout-sort.ts            — sortWorkoutsByWeekday() — ordena fichas por dia da semana
  pages/
    DashboardPage.tsx          — dashboard (aluno: hoje + stats | admin: painel) — branch mobile dedicado
    ExerciciosPage.tsx         — catálogo de exercícios do aluno + PR (mobile)
    HistoryPage.tsx            — histórico de sessões do aluno (com botão de apagar por sessão)
    LoginPage.tsx              — tela de login com shader e números animados
    MeasurementsPage.tsx       — peso + medidas corporais com gráficos
    NotFoundPage.tsx           — página 404
    NutritionPage.tsx          — diário alimentar + IA Groq/Llama
    ProfilePage.tsx            — perfil do usuário (branch mobile = hub com GESTÃO + cor + sair)
    ProgressPage.tsx           — progresso: PRs, volume, gráfico de carga
    SemanaPage.tsx             — visão semanal das fichas (mobile)
    SessionDetailPage.tsx      — detalhe de uma sessão de treino (editável)
    WorkoutDetailPage.tsx      — detalhe de uma ficha (aluno)
    WorkoutsPage.tsx           — fichas do aluno + destaque do dia
    WorkoutSessionPage.tsx     — execução de treino ativo (branch mobile + cronômetro de descanso)
    admin/
      AlertasPage.tsx          — painel de gestão (alunos que precisam de atenção, métricas)
      ExerciseLibraryPage.tsx  — biblioteca de exercícios (listar, filtrar, criar, editar)
      StudentDetailPage.tsx    — perfil completo do aluno (abas + ações)
      StudentFormPage.tsx      — criar novo aluno
      StudentsAdminPage.tsx    — lista de alunos (ações por ícone: power/trash)
      TrainerFormPage.tsx      — criar novo trainer
      TrainersAdminPage.tsx    — lista de trainers (ações por ícone: power/trash)
      WorkoutFormPage.tsx      — criar / editar ficha
      WorkoutsAdminPage.tsx    — biblioteca de templates do admin
  services/
    admin.service.ts           — getAdminDashboardStats() — números do painel
    history.service.ts         — histórico, streak, progressão, PRs, getAllExercisePRs()
    measurements.service.ts    — peso corporal e medidas
    nutrition.service.ts       — diário alimentar, totais diários
    profile.service.ts         — getProfile, updateProfile, uploadAvatar
    trainer.service.ts         — alunos, trainers, resetStudentPassword
    workout.service.ts         — fichas, exercícios, atribuição, catálogo
    workout-log.service.ts     — sessão: start/log/update/finish/deleteWorkoutSession
  types/
    index.ts                   — todos os tipos TypeScript do projeto
  App.tsx                      — rotas com AnimatedRoutes + ToastProvider
  index.css                    — Tailwind v4 + Design System v4 "FORJA" (vars CSS)
  main.tsx                     — ponto de entrada

supabase-setup.sql             — SQL base (schema + patches v1–v3)
supabase-patch-v2.sql          — índices, RLS refinada
supabase-patch-v6-roles.sql    — RLS corrigida para super_admin e trainer
supabase/functions/
  analyze-meal/index.ts        — Edge Function: IA nutricional (Groq/Llama)
  manage-users/index.ts        — Edge Function: criar/excluir/resetar usuários
vercel.json                    — configuração de deploy (SPA redirect)
vite.config.ts                 — Vite + vite-plugin-pwa (service worker)
public/
  manifest.json                — PWA manifest (nome, ícones, cores)
  favicon.svg / favicon.ico / favicon-192.png / favicon-512.png
Plan.md                        — roteiro de fases
CLAUDE.md                      — este arquivo
```

---

## Rotas do App

| Rota | Componente | Acesso |
|------|-----------|--------|
| `/login` | LoginPage | público |
| `/dashboard` | DashboardPage | logado |
| `/perfil` | ProfilePage | logado |
| `/workouts` | WorkoutsPage | logado |
| `/workouts/:id` | WorkoutDetailPage | logado |
| `/workouts/:id/session` | WorkoutSessionPage | logado |
| `/historico` | HistoryPage | logado |
| `/historico/:logId` | SessionDetailPage | logado |
| `/progresso` | ProgressPage | logado |
| `/medidas` | MeasurementsPage | logado |
| `/nutricao` | NutritionPage | logado |
| `/semana` | SemanaPage | logado (mobile) |
| `/exercicios` | ExerciciosPage | logado (mobile) |
| `/admin/alertas` | AlertasPage | admin |
| `/admin/workouts` | WorkoutsAdminPage | admin |
| `/admin/workouts/new` | WorkoutFormPage | admin |
| `/admin/workouts/:id/edit` | WorkoutFormPage | admin |
| `/admin/students` | StudentsAdminPage | admin |
| `/admin/students/new` | StudentFormPage | admin |
| `/admin/students/:id` | StudentDetailPage | admin |
| `/admin/trainers` | TrainersAdminPage | admin |
| `/admin/trainers/new` | TrainerFormPage | admin |
| `/admin/exercises` | ExerciseLibraryPage | admin |

---

## Regras de código obrigatórias

### TypeScript
- TypeScript em tudo — nunca JavaScript puro
- Componentes funcionais com interface de props tipada
- Tipos centralizados em `src/types/index.ts`

### Formulários
- Validar todos os formulários com Zod + React Hook Form

### Supabase
- Lógica de banco sempre em `src/services/`
- Sempre verificar erros: `const { data, error } = await supabase...`
- RLS ativo em todas as tabelas — nunca desativar
- Nunca excluir registros fisicamente — usar `is_active = false`. **Exceções explícitas:** sessões de treino (`deleteWorkoutSession` — o aluno pediu para descartar/apagar) e exclusão de usuários (Edge Function `manage-users`, ação `delete`)
- Tabela de exercícios é `exercise_library` (não `exercises`)

### Componentes
- Reutilizáveis em `src/components/ui/`
- Um componente por arquivo, export nomeado

### Segurança
- Credenciais nunca no código — usar `.env` (gitignored)
- Confirmar que `.env` não vai no commit antes de qualquer push

---

## Design System v4 "FORJA"

Inspirado em apps de treino premium (vigor./GASLUR): **preto absoluto**, tipografia condensada em caixa-alta, um acento elétrico (verde-limão) e layout horizontal desktop-first. Toda a definição vive em `src/index.css`.

### Tipografia — REGRA CRÍTICA
- **Títulos/display:** `Bebas Neue` — **só existe no peso 400**. Use SEMPRE a classe `.f-display`. **Nunca** escreva `fontWeight: 700/800` em título: a fonte não tem esses pesos e o navegador inventa um "negrito falso" (faux-bold) que fica borrado e foge do padrão.
- **Corpo:** `Space Grotesk` (`var(--f-body)`) — textos, parágrafos, botões, inputs.
- **Números/mono:** `JetBrains Mono` (`var(--f-mono)`) — macros, cargas, horários, rótulos técnicos.
- **Tamanho mínimo de fonte: 10px.** Nunca usar menor que isso.

### Tema Dark / Light
- Toggle via `ThemeSwitcher` — aplicado em `document.documentElement.dataset.theme = 'dark' | 'light'`.
- Usar **sempre variáveis CSS** — nunca cor fixa (hex/rgb) no código.

### Variáveis CSS (usar estas, não hardcode)

| Variável | Valor (dark) | Uso |
|----------|------|-----|
| `var(--bg-0)` | `#08090a` | fundo da página |
| `var(--bg-1)` | `#101113` | card padrão |
| `var(--bg-2)` | `#181a1c` | hover / nested |
| `var(--bg-3)` | `#23262a` | input / chip / trilho de barra |
| `var(--bg-4)` | `#2e3236` | nested mais claro |
| `var(--hairline)` | `rgba(255,255,255,0.06)` | borda sutil |
| `var(--border)` | `rgba(255,255,255,0.10)` | borda normal |
| `var(--border-strong)` | `rgba(255,255,255,0.20)` | borda forte |
| `var(--text)` | `#f5f5f3` | texto principal |
| `var(--text-dim)` | `#9a9a96` | texto secundário |
| `var(--text-faint)` | `#5a5a56` | texto fraco |
| `var(--accent)` | `#d4ff3a` | cor primária (verde-limão) |
| `var(--accent-2)` | `#b6e02a` | accent hover |
| `var(--accent-fg)` | `#0a0a0a` | texto sobre o accent |
| `var(--danger)` | `#ff3d55` | erros |
| `var(--warn)` | `#ffb547` | atenção / acima da meta |
| `var(--success)` | `#6affb9` | sucesso |
| `var(--info)` | `#6ec6ff` | informação / azul |

> Para gráficos com várias cores (ex.: macros), use a paleta semântica: **proteína = `--accent`, carboidrato = `--info`, gordura = `--warn`**. Nunca inventar hex novo (ex.: `#60a5fa`).

### Raios e sombra (use só estes valores)
- `--r-1` 4px · `--r-2` 8px · `--r-3` 14px · `--r-4` 22px
- `--sh-pop` — sombra de cards/modais em destaque

### Classes prontas (em `src/index.css`) — preferir à estilo inline
- Tipografia: `.f-display` `.f-mono` `.eyebrow` `.label-sm`
- Botões: `.btn` (+ `.primary` `.ghost` `.danger` `.lg` `.xl`)
- Cartões: `.card` `.card-flat` `.card-accent` `.card-dark` `.card-title`
- Etiquetas/seletores: `.chip` (+ `.solid` `.danger` `.success`)
- Formulário: `.input` (+ `textarea.input`, `select.input`); `.set-input` para campo numérico
- Números grandes: `.stat-num` `.stat-label` `.stat-unit`
- Outros: `.bar` (progresso) · `.skeleton` (carregando) · `.topbar` `.content` `.nav` `.mob-tabbar` (estrutura)
- Ações: `.cta` (botão grande full-width) · `.icon-btn` (+ `.accent` `.danger`) — botão compacto só com ícone
- Mobile: `.mob-head` (cabeçalho) · `.mob-scroll` (área rolável) · `.mob-kpi` (card de número) · `.mob-lrow` (linha de lista) · `.mob-seg` (segmented control) · `.mob-tab-fab` (FAB central da tabbar)

### Padrões visuais recorrentes
```tsx
// Card com destaque (borda accent à esquerda)
<div className="card" style={{ borderLeft: '2px solid var(--accent)' }} />

// Título de card / seção
<h2 className="card-title">FREQUÊNCIA</h2>

// Número grande
<div className="f-display" style={{ fontSize: 56, color: 'var(--accent)' }}>12</div>

// Skeleton de loading
<div className="skeleton" style={{ height: 64, borderRadius: 14 }} />

// Estado de erro
<div className="card" style={{ borderLeft: '2px solid var(--danger)', background: 'rgba(255,61,85,0.05)' }} />
```

---

## Mobile (≤768px)

O app tem um layout mobile dedicado, **sem alterar o desktop**. Regra de ouro: **toda mudança mobile fica isolada** — nunca quebrar o desktop.

### Como funciona
- O hook **`useIsMobile()`** (`src/hooks/useIsMobile.ts`) retorna `true` em telas ≤768px. As páginas com versão mobile fazem um `if (isMobile) return (<JSX mobile/>)` **antes** do `return` do desktop. O caminho do desktop fica intocado.
- O cabeçalho mobile é o **`MobHead`** (over/title/right) no lugar do `Topbar`.
- A área rolável usa a classe `.mob-scroll`.

### Navegação mobile
- A barra inferior (`MobileTabbar`) é **sempre "meu treino"**: 5 colunas → **Hoje · Semana · [FAB ▶] · Histórico · Perfil**. O FAB central inicia o treino de hoje (ou abre `/semana` se não houver).
- **Não existe** alternância Gestão/Meu Treino no mobile. As funções de gestão (Fichas, Alunos, Trainers, Exercícios, **Alertas**) ficam na lista **GESTÃO** dentro do **Perfil** (só aparece para `isManager`).
- `mobileNavDestinations()` em `navigation.ts` sempre devolve a lista do aluno. O `ModeToggle` (Gestão/Meu Treino) existe **só no desktop**, na sidebar.

### Páginas mobile
- **Dashboard** (`/dashboard`): no mobile sempre mostra a visão do aluno (hero do treino de hoje, KPIs, mini-semana, última sessão) — mesmo logado como admin.
- **Semana** (`/semana`): os 7 dias com status (concluído / hoje / descanso / futuro).
- **Exercícios** (`/exercicios`): catálogo do aluno com busca, filtro por grupo e PR.
- **Perfil** (`/perfil`): hub com avatar sobreposto ao banner, seletor de cor no banner, KPIs, lista GESTÃO (manager), lista MEU TREINO e botão de **sair** (ícone, no banner).
- **Alertas** (`/admin/alertas`): painel de gestão (métricas + alunos que precisam de atenção).
- **Execução de treino** (`/workouts/:id/session`): tela imersiva (cabeçalho com cronômetro, séries, próximo, botão "CONCLUIR SÉRIE") + **tela de descanso** em tela cheia (cronômetro circular + próxima série).

---

## Tailwind CSS v4

Não existe `tailwind.config.js`. Cores customizadas ficam em `src/index.css` dentro de `@theme {}`.

---

## Banco de dados

**Projeto Supabase:** `https://xfcblbdwaibpzcpwzkow.supabase.co`

### Tabelas existentes

| Tabela | Descrição |
|--------|-----------|
| `profiles` | Usuários (alunos + admin), papel em `role` |
| `exercise_library` | Catálogo de 39+ exercícios |
| `workouts` | Fichas de treino (templates + fichas de alunos) |
| `workout_exercises` | Exercícios dentro de cada ficha |
| `workout_logs` | Sessões de treino realizadas |
| `exercise_logs` | Séries registradas por sessão |
| `user_weights` | Histórico de peso corporal |
| `body_measurements` | Medidas corporais |
| `nutrition_logs` | Diário alimentar |

### Coluna `is_template` em `workouts`
- `true` = ficha da biblioteca do admin (reutilizável, atribuível a vários alunos)
- `false` = ficha de um aluno específico (tem `user_id` do aluno)
- Soft delete: sempre `is_active = false`, nunca `DELETE`

---

## Variáveis de ambiente

```
VITE_SUPABASE_URL=https://xfcblbdwaibpzcpwzkow.supabase.co
VITE_SUPABASE_ANON_KEY=sb_publishable_...
```

O `.env` existe localmente mas **nunca vai para o git**. O `.env.example` é o template commitado.

> **IA (Nutrição):** a chave do Groq **não** é variável de frontend. Ela fica como *secret* `GROQ_API_KEY` na Edge Function `analyze-meal` do Supabase, para nunca ficar exposta no navegador. Obter (grátis, sem cartão) em https://console.groq.com.

---

## Deploy

**Produção:** https://forjamuscle.vercel.app  
**Plataforma:** Vercel (deploy automático a cada push na branch `main`)  
**Repositório:** https://github.com/dnsrodrigues/forja-muscle  

### Como funciona o deploy
1. Qualquer `git push origin main` dispara o build automático no Vercel
2. O Vercel roda `npm run build` (TypeScript + Vite)
3. A pasta `dist/` é publicada como site estático
4. O `vercel.json` redireciona todas as rotas para `index.html` (necessário para SPA)

### Variáveis de ambiente no Vercel
As mesmas do `.env` local precisam estar configuradas no painel do Vercel:
- `VITE_SUPABASE_URL`
- `VITE_SUPABASE_ANON_KEY`

### PWA
O app é instalável no celular via `vite-plugin-pwa`. O `manifest.json` está em `public/` com ícones 192px e 512px.
