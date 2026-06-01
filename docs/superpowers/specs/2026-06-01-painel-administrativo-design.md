# Painel Administrativo (Fase 9) — Design

**Data:** 01 de junho de 2026
**Status:** Aprovado ✅
**Autor:** Denis Rodrigues

---

## 1. Contexto

A Fase 9 já estava ~60% construída antes deste design. O que **já existe e funciona**:

- Sistema de papéis: `super_admin`, `trainer`, `user`
- `StudentsAdminPage` (`/admin/students`) — listar, criar, desativar, reativar e excluir aluno
- `TrainersAdminPage` (`/admin/trainers`) — gerenciar personais (só super_admin)
- `StudentFormPage` / `TrainerFormPage` — criação via Edge Function `manage-users`
- `WorkoutsAdminPage` — templates + fichas por aluno, com atribuição (`AssignWorkoutModal`)
- Edge Functions: `manage-users` (create-trainer, create-student, delete), `promote-to-trainer`
- RLS já permite trainer/super_admin **lerem** os dados dos seus alunos (workout_logs, user_weights, body_measurements, nutrition_logs)

Este design cobre **apenas o que falta** para completar o painel, conforme o critério do Plan.md: *"Admin consegue criar um novo aluno, atribuir uma ficha e ver o histórico desse aluno."* Criar e atribuir já funcionam — falta **ver o aluno por inteiro** e o **painel com números reais**.

---

## 2. Escopo (3 peças)

| Peça | Rota | Resumo |
|------|------|--------|
| Painel do personal | `/dashboard` (modo gestão) | Troca o card placeholder por estatísticas reais + lista de alunos que precisam de atenção |
| Perfil completo do aluno | `/admin/students/:id` (nova) | Tela com abas: dados, treinos, evolução, nutrição + 4 ações |
| Biblioteca de exercícios | `/admin/exercises` (nova) | Ver/filtrar/criar/editar exercícios do catálogo |

**Abordagem do perfil do aluno:** abas (Visão geral · Treinos · Evolução · Nutrição), cada aba carrega seus dados sob demanda (lazy). Escolhida por organização, performance no celular e reaproveitamento dos gráficos existentes.

---

## 3. Peça 1 — Painel do personal

Hoje, em modo gestão, o `DashboardPage` mostra um único card "GERENCIE SUAS FICHAS". Será substituído por um painel real **dentro do mesmo branch `showAdminView`** (sem nova rota).

### 3.1 Conteúdo

- **3 cards de número grande:**
  - **Alunos** — total + quantos ativos (ex.: "12 · 10 ativos")
  - **Treinos na semana** — soma de `workout_logs` dos alunos do personal nos últimos 7 dias
  - **Precisam de atenção** — contagem de alunos sem ficha ativa OU parados há +7 dias
- **Lista "Precisam de atenção":** cada item mostra nome + motivo (`sem ficha` / `parado há N dias`), clicável → `/admin/students/:id`
- **Atalhos:** botões para "Alunos" e "Nova ficha"

### 3.2 Diferença por papel

- **trainer:** números referentes apenas aos seus alunos (`trainer_id = auth.uid()`)
- **super_admin:** números globais (todos os alunos)

### 3.3 Dados

Novo serviço `src/services/admin.service.ts`:

```ts
interface AttentionStudent {
  id: string
  full_name: string
  reason: 'sem-ficha' | 'parado'
  daysSinceLastWorkout: number | null
}

interface AdminDashboardStats {
  totalStudents: number
  activeStudents: number
  sessionsThisWeek: number
  needAttention: AttentionStudent[]
}

getAdminDashboardStats(ctx: { isSuperAdmin: boolean; trainerId: string }): Promise<AdminDashboardStats>
```

Implementação: busca os alunos (reusa `getAllStudents` / `getTrainerStudents` de `trainer.service`), busca `workout_logs` dos últimos 7 dias desses alunos e dos workouts ativos atribuídos, e calcula em JS. RLS já permite essas leituras.

---

## 4. Peça 2 — Perfil completo do aluno

### 4.1 Rota e navegação

- Nova rota protegida por `AdminRoute`: `/admin/students/:id` → `StudentDetailPage`
- As linhas de `StudentsAdminPage` passam a ser **clicáveis** → navegam para o perfil
- A lista "precisam de atenção" do painel também navega para cá

### 4.2 Estrutura

```
Topbar: ← voltar | nome do aluno | (badge INATIVO se desativado)
Barra de ações (4 botões): Atribuir ficha · Editar dados · Registrar peso/medidas · Resetar senha
Abas: [ Visão geral ] [ Treinos ] [ Evolução ] [ Nutrição ]
Conteúdo da aba ativa (lazy)
```

### 4.3 Abas

- **Visão geral:** avatar, e-mail, objetivo, peso atual + IMC (reusa lógica de IMC do perfil), peso alvo, altura, ficha(s) ativa(s), streak atual. Reusa `getCurrentStreak`, `getMyWorkouts`.
- **Treinos:** lista de `workout_logs` do aluno (reusa `getWorkoutHistory(studentId)`); cada sessão navegável para um detalhe somente-leitura.
- **Evolução:** `WeightChart` + `LoadProgressChart` + último bloco de medidas (reusa `getUserWeights`, `getBodyMeasurements`, `getLoadProgression`).
- **Nutrição:** resumo do diário do dia (reusa `nutrition.service` com `userId` do aluno; somente leitura, igual ao acesso trainer já existente em `/nutricao?userId=`).

> Todos os serviços citados já aceitam `userId` explícito e a RLS já libera a leitura para o trainer/super_admin. Nenhuma mudança de banco necessária para **ver**.

### 4.4 As 4 ações

| Ação | Como funciona | Precisa de ajuste? |
|------|---------------|--------------------|
| **Atribuir/trocar ficha** | Reusa `AssignWorkoutModal` (template) e link para `WorkoutFormPage?userId=` (ficha direta) | ✅ Já funciona |
| **Editar dados** | Modal/painel com campos seguros: `full_name`, `goal`, `target_weight`, `height`, `birth_date`, `gender`. Chama `updateProfile(studentId, ...)` | ⚠️ Precisa Patch v6 (RLS UPDATE) |
| **Registrar peso/medidas** | Reusa `WeightEntryModal` / `MeasurementEntryModal` apontando para o `studentId` | ⚠️ Precisa Patch v6 (RLS INSERT) |
| **Resetar senha** | Chama `manage-users` ação `reset-password` → senha `123456` + `must_change_password = true` | ⚠️ Precisa atualizar Edge Function |

---

## 5. Peça 3 — Biblioteca de exercícios

### 5.1 Rota e navegação

- Nova rota protegida por `AdminRoute`: `/admin/exercises` → `ExerciseLibraryPage`
- Adicionada à navegação de gestão (`navigation.ts`) como destino secundário (aparece no menu lateral e no "Mais" do celular)

### 5.2 Conteúdo

- Lista de exercícios **agrupada por grupo muscular**, com filtro por grupo (chips)
- Busca por nome
- Botão "Novo exercício" → modal de criação (reusa a lógica de criação já existente no `ExerciseSelector`)
- Editar exercício existente (nome, grupo, descrição, vídeo/imagem) via modal

### 5.3 Dados

Reusa/expande `workout.service.ts`:

```ts
getExerciseLibrary(): Promise<Exercise[]>          // já existe (catálogo completo)
createExercise(dto): Promise<Exercise>             // já existe (usado no seletor)
updateExercise(id, dto): Promise<Exercise>         // NOVO
```

> **Sem exclusão de exercícios** nesta fase (YAGNI): apagar um exercício do catálogo quebraria fichas que o referenciam. Fora do escopo.

---

## 6. Mudanças no banco e no servidor (passos manuais)

### 6.1 Patch v6 (SQL) — novas políticas RLS

Adiciona ao `supabase-setup.sql` e roda no SQL Editor do Supabase:

1. **UPDATE de perfil de aluno pelo trainer/super_admin**, com `WITH CHECK` que impede mudar `role` (continua `user`) e `trainer_id` (continua o mesmo dono) — bloqueia escalonamento de permissão.
2. **INSERT em `user_weights`** para alunos do trainer (ou qualquer aluno, se super_admin).
3. **INSERT em `body_measurements`** para alunos do trainer (ou qualquer aluno, se super_admin).

### 6.2 Edge Function `manage-users` — nova ação `reset-password`

Adiciona ao `index.ts`:
- Verifica que o chamador é dono do aluno (mesma checagem da ação `delete`)
- `supabaseAdmin.auth.admin.updateUserById(userId, { password: '123456' })`
- `profiles.update({ must_change_password: true })`
- Requer **deploy** da função no painel Supabase

---

## 7. Arquivos afetados

| Arquivo | Mudança |
|---------|---------|
| `src/services/admin.service.ts` | **Novo** — estatísticas do painel + alunos que precisam de atenção |
| `src/pages/DashboardPage.tsx` | Substitui o card placeholder do `showAdminView` pelo painel real |
| `src/pages/admin/StudentDetailPage.tsx` | **Novo** — perfil completo do aluno com abas + ações |
| `src/pages/admin/StudentsAdminPage.tsx` | Linhas clicáveis → `/admin/students/:id` |
| `src/pages/admin/ExerciseLibraryPage.tsx` | **Novo** — biblioteca de exercícios |
| `src/services/workout.service.ts` | Adiciona `updateExercise` (e expõe `getExerciseLibrary` se necessário) |
| `src/lib/navigation.ts` | Adiciona "Exercícios" à navegação de gestão |
| `src/App.tsx` | Rotas `/admin/students/:id` e `/admin/exercises` |
| `src/types/index.ts` | Tipos `AdminDashboardStats`, `AttentionStudent` |
| `supabase-setup.sql` | Patch v6 (RLS) |
| `supabase/functions/manage-users/index.ts` | Ação `reset-password` |

---

## 8. O que NÃO muda

- Login, papéis e criação/exclusão de aluno (já funcionam)
- Atribuição de ficha (já funciona)
- Leitura de histórico/peso/medidas/nutrição pelo trainer (RLS já libera)
- Telas do aluno (dashboard aluno, treino, histórico, nutrição) permanecem iguais

---

## 9. Critérios de conclusão

- [ ] Painel do personal mostra total de alunos, treinos na semana e lista "precisam de atenção" com dados reais
- [ ] Clicar num aluno abre o perfil completo com as 4 abas funcionando
- [ ] Personal consegue atribuir ficha, editar dados, registrar peso/medidas e resetar senha do aluno
- [ ] Biblioteca de exercícios lista, filtra, cria e edita exercícios
- [ ] Patch v6 aplicado e Edge Function `manage-users` atualizada (passos manuais)
- [ ] Build sem erros de TypeScript
