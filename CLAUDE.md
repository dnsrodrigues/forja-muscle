# MUSCLE TRAINING — Guia Operacional para o Claude Code

## O que é este projeto

MUSCLE TRAINING é um PWA (app web instalável no celular) de gerenciamento de treinos de musculação. Dois tipos de usuário: **Admin (Personal Trainer)** que cria fichas e gerencia alunos, e **Aluno** que registra treinos e acompanha evolução.

> Documentação completa: [PRD](docs/superpowers/specs/2026-05-22-musctrainig-prd.md) | [Plan.md](Plan.md)  
> Toda decisão de funcionalidade deve ser validada contra o PRD. Não implementar nada fora do escopo sem confirmar com o usuário.

**Fases concluídas:** 1, 2, 3, 4, 4.5 (Design System), 5 (Fichas de Treino)  
**Próxima fase:** 6 — Execução de Treino

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
    layout/
      ProtectedRoute.tsx   — bloqueia rota se não estiver logado
      AdminRoute.tsx       — bloqueia rota se não for admin
    ui/
      Button.tsx           — botão com variantes primary/secondary/ghost
      Input.tsx            — campo de formulário com label e erro
      Avatar.tsx           — avatar quadrado com fallback nas iniciais
      ThemeSwitcher.tsx    — toggle dark/light mode
    WorkoutCard.tsx        — card de ficha (aluno + admin, badge HOJE)
    ExerciseRow.tsx        — linha de exercício (leitura + edição)
    ExerciseSelector.tsx   — modal de busca + criação de exercício novo
    AssignWorkoutModal.tsx — atribuir template a aluno(s)
  context/
    AuthContext.tsx        — profile, isAdmin, signOut, loading
    ThemeContext.tsx       — mode ('dark'|'light'), toggleMode
  hooks/                   — hooks customizados (ainda vazios)
  lib/
    supabase.ts            — cliente Supabase
  pages/
    LoginPage.tsx          — tela de login
    DashboardPage.tsx      — dashboard principal (aluno e admin)
    ProfilePage.tsx        — perfil do usuário (edição)
    WorkoutsPage.tsx       — aluno: fichas + destaque do dia
    WorkoutDetailPage.tsx  — aluno: detalhe de uma ficha
    NotFoundPage.tsx       — página 404
    admin/
      WorkoutsAdminPage.tsx  — biblioteca de fichas (templates)
      WorkoutFormPage.tsx    — criar / editar ficha
  services/
    profile.service.ts     — getProfile, updateProfile
    workout.service.ts     — fichas, exercícios, atribuição, catálogo
  types/
    index.ts               — todos os tipos TypeScript do projeto
  App.tsx                  — rotas da aplicação
  index.css                — Tailwind v4 + Design System v2 (vars CSS)
  main.tsx                 — ponto de entrada

supabase-setup.sql         — SQL completo (inclui patches v1, v2, v3)
Plan.md                    — roteiro de fases
CLAUDE.md                  — este arquivo
```

---

## Rotas do App

| Rota | Componente | Acesso |
|------|-----------|--------|
| `/login` | LoginPage | público |
| `/dashboard` | DashboardPage | logado |
| `/perfil` | ProfilePage | logado |
| `/workouts` | WorkoutsPage | logado (aluno vê as suas) |
| `/workouts/:id` | WorkoutDetailPage | logado |
| `/admin/workouts` | WorkoutsAdminPage | admin |
| `/admin/workouts/new` | WorkoutFormPage | admin |
| `/admin/workouts/:id/edit` | WorkoutFormPage | admin |

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
- Nunca excluir registros fisicamente — usar `is_active = false`
- Tabela de exercícios é `exercise_library` (não `exercises`)

### Componentes
- Reutilizáveis em `src/components/ui/`
- Um componente por arquivo, export nomeado

### Segurança
- Credenciais nunca no código — usar `.env` (gitignored)
- Confirmar que `.env` não vai no commit antes de qualquer push

---

## Design System v2 "Nova"

### Tipografia
- **Display/títulos:** `Syne` weight 800 — `fontFamily: "'Syne', sans-serif", fontWeight: 800`
- **Corpo/mono/labels:** `DM Mono` weight 300/400 — `fontFamily: "'DM Mono', monospace"`
- Labels de seção: DM Mono, 9px, `letterSpacing: '0.15em'`, uppercase, `color: var(--fg-3)`
- Comentários de código no UI: `// texto assim` em DM Mono itálico

### Tema Dark / Light
- Toggle via `ThemeSwitcher` — armazena em `localStorage` chave `'musc-color-mode'`
- Aplicado em `document.documentElement.dataset.theme = 'dark' | 'light'`
- Usar **sempre variáveis CSS** — nunca hardcode de cor

### Variáveis CSS (usar estas, não hardcode)

| Variável | Dark | Light | Uso |
|----------|------|-------|-----|
| `var(--bg)` | `#05050a` | `#f5f4ee` | fundo da página |
| `var(--surface)` | `#0e0e16` | `#eceae2` | cards, painéis |
| `var(--accent)` | `#c8f04a` | `#5a9400` | cor primária |
| `var(--fg)` | `#f0ede6` | `#0a0a12` | texto principal |
| `var(--fg-2)` | `rgba(240,237,230,0.7)` | — | texto secundário |
| `var(--fg-3)` | `rgba(240,237,230,0.35)` | — | texto fraco |
| `var(--border)` | `rgba(255,255,255,0.06)` | — | borda sutil |
| `var(--border-md)` | `rgba(255,255,255,0.12)` | — | borda normal |
| `var(--danger)` | `#ef4444` | — | erros |
| `var(--success)` | `#4ade80` | — | sucesso |

### Padrões visuais recorrentes
```tsx
// Card ativo (destaque com borda lime à esquerda)
border: '1px solid var(--border)'
borderLeft: '2px solid var(--accent)'

// Skeleton de loading (classe CSS já definida)
<div className="skeleton" style={{ height: 64, borderRadius: 4 }} />

// Label de seção
fontFamily: "'DM Mono', monospace", fontSize: 9,
color: 'var(--fg-3)', letterSpacing: '0.15em', textTransform: 'uppercase'

// Grid decorativo de fundo (12 colunas)
<div className="fixed inset-0 pointer-events-none z-0"
  style={{ display: 'grid', gridTemplateColumns: 'repeat(12, 1fr)' }}>
  {Array.from({ length: 12 }).map((_, i) => (
    <span key={i} style={{ borderRight: '1px solid var(--border)' }} />
  ))}
</div>
```

---

## Tailwind CSS v4

Não existe `tailwind.config.js`. Cores customizadas ficam em `src/index.css` dentro de `@theme {}`.

| Uso | Classe |
|-----|--------|
| Cor primária lime | `bg-orange-500` / `text-orange-500` ¹ |
| Texto sobre lime | `text-[#05050a]` |
| Bordas sutis | `border-white/10` |

> ¹ `orange-500` foi sobrescrito no `@theme {}` para `#c8f04a`. Use `orange-*` normalmente — já é lime.

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
VITE_GEMINI_API_KEY=...
```

O `.env` existe localmente mas **nunca vai para o git**. O `.env.example` é o template commitado.
