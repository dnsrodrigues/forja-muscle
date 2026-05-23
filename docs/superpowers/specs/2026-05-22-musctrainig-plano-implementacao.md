# MUSCTRAINIG — Plano de Implementação Detalhado

**Versão:** 1.0  
**Data:** 22 de maio de 2026  
**Status:** Em andamento 🚧

---

## Visão Geral das Fases

| Fase | Descrição | Status |
|------|-----------|--------|
| 1 | Fundação do projeto (estrutura, dependências, configuração) | ✅ Completo |
| 2 | Banco de dados (Supabase: tabelas, RLS, dados iniciais) | 🚧 Em andamento |
| 3 | Autenticação (login, logout, proteção de rotas) | ⏳ Pendente |
| 4 | Perfil do usuário | ⏳ Pendente |
| 5 | Fichas de treino (CRUD admin + visualização aluno) | ⏳ Pendente |
| 6 | Execução de treino (registro de séries, timer) | ⏳ Pendente |
| 7 | Histórico e progressão (gráficos, evolução) | ⏳ Pendente |
| 8 | Nutrição + IA (diário alimentar, Gemini) | ⏳ Pendente |
| 9 | Painel admin (gestão de alunos) | ⏳ Pendente |
| 10 | Polish + PWA (ícones, splash, otimizações) | ⏳ Pendente |
| 11 | Deploy (Vercel, domínio, variáveis de ambiente) | ⏳ Pendente |

---

## FASE 1 — Fundação ✅ COMPLETO

### O que foi feito
- [x] Projeto criado com Vite 6 + React 19 + TypeScript
- [x] Tailwind CSS 4 configurado (plugin Vite, sem tailwind.config.js)
- [x] Tema dark customizado em `src/index.css` com variáveis CSS
- [x] Todas as dependências instaladas (248 pacotes)
- [x] Tipos TypeScript globais em `src/types/index.ts`
- [x] Cliente Supabase em `src/lib/supabase.ts`
- [x] Estrutura de pastas criada (components, pages, context, hooks, services)
- [x] `.env` com credenciais reais (gitignored)
- [x] `.env.example` com template (commitado)
- [x] `.gitattributes` para compatibilidade Windows/Unix
- [x] Git inicializado com commit inicial
- [x] Build verificado sem erros (`npm run build`)

### Arquivos criados
- `package.json` — dependências do projeto
- `vite.config.ts` — Vite + React + Tailwind plugin
- `tsconfig.json`, `tsconfig.app.json`, `tsconfig.node.json` — TypeScript strict
- `eslint.config.js` — ESLint configurado
- `index.html` — HTML base com meta tags
- `src/main.tsx` — ponto de entrada React
- `src/App.tsx` — componente raiz
- `src/index.css` — Tailwind + tema dark
- `src/types/index.ts` — tipos globais TypeScript
- `src/lib/supabase.ts` — cliente Supabase
- `.env` — credenciais reais (NÃO no git)
- `.env.example` — template (no git)
- `.gitignore`, `.gitattributes`

---

## FASE 2 — Banco de Dados 🚧 EM ANDAMENTO

### Objetivo
Configurar o Supabase com todas as tabelas, triggers, RLS e dados iniciais.

### Checklist
- [x] Script SQL completo criado (`supabase-setup.sql`)
- [ ] Script executado no Supabase SQL Editor
- [ ] 9 tabelas verificadas no Table Editor
- [ ] 39 exercícios pré-cadastrados confirmados
- [ ] Conexão testada via `npm run dev`
- [ ] Commit da fase

### Passos para rodar o SQL
1. Acessar https://app.supabase.com
2. Selecionar o projeto MUSCTRAINIG
3. Menu lateral → **SQL Editor**
4. Clicar em **New Query**
5. Copiar todo o conteúdo de `supabase-setup.sql`
6. Colar no editor e clicar em **Run**
7. Verificar em **Table Editor** as 9 tabelas:
   - `profiles`
   - `exercise_library`
   - `workouts`
   - `workout_exercises`
   - `workout_logs`
   - `exercise_logs`
   - `user_weights`
   - `body_measurements`
   - `nutrition_logs`

### Tabelas criadas pelo script
```
profiles           — perfis dos usuários (criado automaticamente no signup)
exercise_library   — catálogo de 39 exercícios pré-cadastrados
workouts           — fichas de treino
workout_exercises  — exercícios de cada ficha (com séries, reps, carga)
workout_logs       — sessões de treino realizadas
exercise_logs      — séries individuais de cada sessão
user_weights       — histórico de peso corporal
body_measurements  — medidas corporais (cintura, quadril, etc.)
nutrition_logs     — diário alimentar com feedback de IA
```

### Teste de conexão
Após rodar o SQL, executar `npm run dev` e verificar que não há erros de Supabase no console.

---

## FASE 3 — Autenticação ⏳ PENDENTE

### Objetivo
Sistema completo de login/logout com proteção de rotas e controle por papel.

### Arquivos a criar
```
src/context/AuthContext.tsx    — estado global de autenticação
src/components/layout/
  ├── ProtectedRoute.tsx       — wrapper para rotas que exigem login
  └── AdminRoute.tsx           — wrapper para rotas exclusivas do admin
src/pages/
  ├── LoginPage.tsx            — tela de login
  └── NotFoundPage.tsx         — tela 404
src/App.tsx                    — atualizar com React Router + rotas
```

### Funcionalidades
- Login com e-mail + senha (Supabase Auth)
- Sessão persistente (localStorage via Supabase)
- Listener de mudança de sessão (`onAuthStateChange`)
- Rota pública: `/login`
- Rotas protegidas: todo o resto
- Redirecionamento automático: não logado → `/login`, logado → `/dashboard`
- Role-based: admin vê painel admin, user vê dashboard de aluno

### Interface da tela de login
- Fundo escuro com logo centralizado
- Campo e-mail + campo senha
- Botão "Entrar" (laranja)
- Mensagem de erro clara em caso de falha

---

## FASE 4 — Perfil do Usuário ⏳ PENDENTE

### Objetivo
Página de perfil onde o usuário visualiza e edita seus dados.

### Arquivos a criar
```
src/services/profile.service.ts  — buscar e atualizar perfil no Supabase
src/pages/ProfilePage.tsx        — tela de perfil
src/components/ui/
  ├── Input.tsx                  — campo de texto reutilizável
  ├── Button.tsx                 — botão reutilizável
  └── Avatar.tsx                 — foto de perfil com fallback
```

### Funcionalidades
- Exibir dados atuais do perfil
- Editar: nome, peso, altura, data de nascimento, gênero, objetivo, peso alvo
- Upload de foto de perfil (Supabase Storage)
- Feedback visual ao salvar (toast/notificação)

---

## FASE 5 — Fichas de Treino ⏳ PENDENTE

### Objetivo
Admin cria e gerencia fichas. Alunos visualizam as suas.

### Arquivos a criar
```
src/services/workout.service.ts    — CRUD de fichas e exercícios
src/pages/
  ├── WorkoutsPage.tsx             — lista de fichas (aluno)
  ├── WorkoutDetailPage.tsx        — detalhe de uma ficha
  └── admin/
      ├── WorkoutsAdminPage.tsx    — gestão de fichas (admin)
      └── WorkoutFormPage.tsx      — criar/editar ficha
src/components/
  ├── WorkoutCard.tsx              — card de ficha
  └── ExerciseSelector.tsx        — seletor de exercícios (modal)
```

### Fluxo do Admin
1. Lista todas as fichas (com filtro por aluno)
2. Criar nova ficha: nome, descrição, dias da semana, aluno destinatário
3. Adicionar exercícios: buscar na biblioteca, definir séries/reps/carga/descanso
4. Reordenar exercícios (drag and drop ou setas)
5. Editar / desativar ficha existente

### Fluxo do Aluno
1. Ver suas fichas ativas
2. Ver detalhe: lista de exercícios com instruções
3. Botão "Iniciar Treino" que leva para Fase 6

---

## FASE 6 — Execução de Treino ⏳ PENDENTE

### Objetivo
Interface de treino ativo para o aluno registrar cada série.

### Arquivos a criar
```
src/services/workout-log.service.ts  — salvar sessões e exercise logs
src/pages/WorkoutSessionPage.tsx     — tela de treino ativo
src/components/
  ├── ExerciseSetRow.tsx             — linha de série (reps + carga)
  ├── RestTimer.tsx                  — timer de descanso
  └── WorkoutFinishModal.tsx         — modal de finalização
```

### Fluxo
1. Usuário clica "Iniciar Treino" em uma ficha
2. Cria `workout_log` no Supabase com `started_at`
3. Exibe exercícios em sequência
4. Para cada série: campos de reps e carga (pré-preenchidos com o sugerido)
5. Ao completar uma série: marca como feita, inicia timer de descanso
6. Ao completar todos os exercícios: modal de finalização
7. Modal: escolher dificuldade + observações + botão "Finalizar"
8. Salva `finished_at`, calcula `duration_minutes`, salva todos os `exercise_logs`

---

## FASE 7 — Histórico e Progressão ⏳ PENDENTE

### Objetivo
Visualizar histórico de treinos e evolução de performance.

### Arquivos a criar
```
src/services/history.service.ts     — buscar histórico do Supabase
src/pages/
  ├── HistoryPage.tsx               — lista de sessões realizadas
  ├── SessionDetailPage.tsx         — detalhe de uma sessão
  └── ProgressPage.tsx             — gráficos de evolução
src/components/charts/
  ├── LoadProgressChart.tsx         — evolução de carga por exercício
  └── WorkoutFrequencyChart.tsx     — frequência de treinos
```

### Métricas exibidas
- Total de treinos realizados
- Treinos por semana/mês (gráfico de barras)
- Evolução de carga por exercício (linha do tempo)
- Duração média dos treinos
- Distribuição de dificuldade (pizza/donut)

---

## FASE 8 — Nutrição + IA ⏳ PENDENTE

### Objetivo
Diário alimentar com análise automática por Gemini AI.

### Arquivos a criar
```
src/services/nutrition.service.ts   — CRUD de nutrition_logs
src/services/ai.service.ts          — integração Gemini API
src/pages/NutritionPage.tsx         — tela de nutrição
src/components/
  ├── MealCard.tsx                  — card de refeição
  └── MealForm.tsx                  — formulário de registro
```

### Fluxo
1. Aluno registra refeição: tipo + descrição (texto livre) + macros opcionais
2. Ao salvar: chamada ao Gemini com a descrição da refeição
3. Gemini responde com feedback: avaliação nutricional, sugestões de melhoria
4. Feedback exibido abaixo da refeição
5. Histórico do dia e semana

### Prompt Gemini
```
Você é um nutricionista especialista em fitness e musculação.
Analise brevemente esta refeição e dê um feedback construtivo em português:
Tipo: {meal_type}
Descrição: {description}
{macros se fornecidos}
Seja direto, positivo e prático. Máximo 3 frases.
```

---

## FASE 9 — Painel Administrativo ⏳ PENDENTE

### Objetivo
Interface do admin para gerenciar alunos.

### Arquivos a criar
```
src/services/admin.service.ts       — operações de admin
src/pages/admin/
  ├── AdminDashboardPage.tsx        — painel admin com stats
  ├── StudentsPage.tsx              — lista de alunos
  ├── StudentDetailPage.tsx         — perfil detalhado do aluno
  └── ExerciseLibraryPage.tsx       — gerenciar biblioteca de exercícios
```

### Funcionalidades
- Dashboard: total de alunos, treinos hoje, treinos essa semana
- Lista de alunos: nome, status, último treino
- Criar novo aluno (Supabase Auth Admin API)
- Ver histórico completo de um aluno
- Gerenciar biblioteca de exercícios (adicionar, editar, remover)

---

## FASE 10 — Polish + PWA ⏳ PENDENTE

### Objetivo
Refinamentos de UX e configuração PWA.

### Checklist
- [ ] Componentes de loading (skeleton screens)
- [ ] Componente Toast para notificações
- [ ] Tratamento de erros amigável em toda a app
- [ ] Animações de transição entre páginas (Motion)
- [ ] Ícones PWA (múltiplos tamanhos: 192x192, 512x512)
- [ ] `manifest.json` configurado
- [ ] Meta tags Open Graph
- [ ] Testes em mobile (Chrome DevTools)
- [ ] Lighthouse audit (performance, PWA, acessibilidade)

---

## FASE 11 — Deploy ⏳ PENDENTE

### Objetivo
Colocar o app em produção.

### Checklist
- [ ] Criar conta no Vercel (vercel.com)
- [ ] Conectar repositório GitHub
- [ ] Configurar variáveis de ambiente no Vercel
- [ ] Deploy automático na branch main
- [ ] Testar URL de produção
- [ ] (Opcional) Domínio personalizado

### Variáveis de ambiente no Vercel
```
VITE_SUPABASE_URL=https://xfcblbdwaibpzcpwzkow.supabase.co
VITE_SUPABASE_ANON_KEY=sb_publishable_...
VITE_GEMINI_API_KEY=...
```

---

## Convenções de Código

### Estrutura de componentes
```typescript
// Props sempre com interface tipada
interface ComponentProps {
  label: string
  onClick: () => void
  disabled?: boolean
}

// Componente funcional com export nomeado
export function Component({ label, onClick, disabled = false }: ComponentProps) {
  return (...)
}
```

### Chamadas ao Supabase
```typescript
// Sempre tratar erro
const { data, error } = await supabase
  .from('table')
  .select('*')
  .eq('user_id', userId)

if (error) throw error
return data
```

### Cores Tailwind (tema customizado)
```
bg-[#0f0f0f]    — fundo principal
bg-[#1a1a1a]    — superfície (cards, modais)
text-white       — texto principal
text-gray-400    — texto secundário
bg-orange-500    — cor primária (botões, destaques)
border-white/10  — bordas sutis
```

---

*Plano criado por Denis Rodrigues em 22/05/2026*
