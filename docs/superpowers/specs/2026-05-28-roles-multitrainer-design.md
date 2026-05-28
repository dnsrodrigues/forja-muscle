# Roles Multi-Trainer + Trainer como Aluno — Design

**Criado em:** 28 de maio de 2026  
**Autor:** Denis Rodrigues  
**Status:** Aprovado ✅

---

## 1. Contexto e Objetivo

O sistema atual tem apenas dois papéis: `admin` (vê tudo) e `user` (vê só os seus dados). Não existe vínculo entre aluno e trainer, e o admin não pode usar o app como aluno para gerenciar seu próprio treino.

Esta spec adiciona:
1. **3 papéis hierárquicos:** `super_admin`, `trainer`, `user`
2. **Vínculo 1:1 trainer → aluno** via coluna `trainer_id` na tabela `profiles`
3. **Trainer como aluno:** toggle de modo no header para alternar entre "Gestão" e "Meu Treino"
4. **Isolamento de dados:** cada trainer vê apenas os seus alunos

---

## 2. Hierarquia de Papéis

| Papel | Vê alunos | Cria trainers | Toggle de treino | trainer_id |
|-------|-----------|---------------|-----------------|------------|
| `super_admin` | Todos | ✓ Sim | ✓ Sim | NULL |
| `trainer` | Só os seus | ✗ Não | ✓ Sim | NULL |
| `user` | ✗ Não | ✗ Não | ✗ Não | UUID do trainer |

**Regras:**
- `super_admin` vê todos os alunos de todos os trainers — poder global
- `trainer` vê somente os alunos onde `profiles.trainer_id = auth.uid()`
- `user` vê apenas os próprios dados — comportamento igual ao app atual
- Tanto `super_admin` quanto `trainer` podem alternar para o modo "Meu Treino" e registrar os próprios treinos
- O trainer é seu próprio personal: cria e gerencia as próprias fichas sem depender de outro usuário

---

## 3. Mudanças no Banco de Dados

### 3.1 Tabela `profiles`

**Adicionar coluna:**
```sql
ALTER TABLE profiles
  ADD COLUMN trainer_id UUID REFERENCES profiles(id) ON DELETE SET NULL;
```

**Atualizar restrição de `role`:**
```sql
ALTER TABLE profiles DROP CONSTRAINT IF EXISTS profiles_role_check;
ALTER TABLE profiles ADD CONSTRAINT profiles_role_check
  CHECK (role IN ('super_admin', 'trainer', 'user'));
```

**Migrar dados existentes:**
```sql
-- Admin atual vira super_admin
UPDATE profiles SET role = 'super_admin' WHERE role = 'admin';

-- Alunos existentes: trainer_id precisa ser preenchido manualmente
-- via painel do super_admin após o deploy
```

### 3.2 Trigger de novos usuários

O trigger `handle_new_user()` já cria perfis com `role = 'user'` por padrão — sem alteração necessária.

### 3.3 Funções auxiliares RLS

Substituir `is_admin_user()` por funções específicas:

```sql
-- Verifica se é super_admin
CREATE OR REPLACE FUNCTION is_super_admin()
RETURNS boolean LANGUAGE sql SECURITY DEFINER AS $$
  SELECT EXISTS (
    SELECT 1 FROM profiles WHERE id = auth.uid() AND role = 'super_admin'
  );
$$;

-- Verifica se é trainer ou super_admin (acesso de gestão)
CREATE OR REPLACE FUNCTION is_trainer_or_above()
RETURNS boolean LANGUAGE sql SECURITY DEFINER AS $$
  SELECT EXISTS (
    SELECT 1 FROM profiles WHERE id = auth.uid() AND role IN ('super_admin', 'trainer')
  );
$$;
```

### 3.4 Políticas RLS atualizadas

**Tabela `profiles`:**
```sql
-- super_admin vê todos
CREATE POLICY "profiles: super_admin vê todos" ON profiles FOR SELECT
  USING (is_super_admin());

-- trainer vê os próprios alunos + si mesmo
CREATE POLICY "profiles: trainer vê seus alunos" ON profiles FOR SELECT
  USING (trainer_id = auth.uid() OR id = auth.uid());

-- usuário vê só o próprio perfil
CREATE POLICY "profiles: usuário vê o próprio" ON profiles FOR SELECT
  USING (id = auth.uid());
```

**Tabela `workouts`:**
```sql
-- super_admin vê tudo
CREATE POLICY "workouts: super_admin vê tudo" ON workouts FOR ALL
  USING (is_super_admin());

-- trainer vê fichas dos seus alunos + as próprias + templates
CREATE POLICY "workouts: trainer acessa os seus" ON workouts FOR ALL
  USING (
    is_template = true
    OR user_id = auth.uid()
    OR user_id IN (SELECT id FROM profiles WHERE trainer_id = auth.uid())
  );

-- usuário vê as suas + templates (igual hoje)
CREATE POLICY "workouts: usuário vê as suas" ON workouts FOR SELECT
  USING (user_id = auth.uid() OR is_template = true);
```

**Tabelas de logs (`workout_logs`, `exercise_logs`):**
```sql
-- trainer vê logs dos seus alunos + os próprios
CREATE POLICY "workout_logs: trainer acessa os seus" ON workout_logs FOR ALL
  USING (
    user_id = auth.uid()
    OR user_id IN (SELECT id FROM profiles WHERE trainer_id = auth.uid())
    OR is_super_admin()
  );
```

**Tabelas pessoais (`user_weights`, `body_measurements`):**
```sql
-- trainer pode ver dados dos seus alunos (para acompanhamento)
CREATE POLICY "user_weights: trainer vê seus alunos" ON user_weights FOR SELECT
  USING (
    user_id = auth.uid()
    OR user_id IN (SELECT id FROM profiles WHERE trainer_id = auth.uid())
    OR is_super_admin()
  );
-- INSERT/UPDATE/DELETE: apenas o próprio usuário
```

---

## 4. Mudanças no Frontend

### 4.1 Tipos (`src/types/index.ts`)

```ts
// Atualizar tipo de role
type UserRole = 'super_admin' | 'trainer' | 'user'

// Atualizar interface Profile
interface Profile {
  // ...campos existentes...
  role: UserRole
  trainer_id: string | null   // novo campo
}
```

### 4.2 AuthContext (`src/context/AuthContext.tsx`)

Substituir `isAdmin` por três booleanos derivados:

```ts
interface AuthContextType {
  // ...existentes...
  isSuperAdmin: boolean   // role === 'super_admin'
  isTrainer: boolean      // role === 'trainer'
  isManager: boolean      // role === 'super_admin' || role === 'trainer'
  trainerMode: 'gestao' | 'treino'       // estado do toggle (só relevante se isManager)
  setTrainerMode: (mode: 'gestao' | 'treino') => void
}
```

`isAdmin` é removido — todos os usos no código devem ser migrados para `isSuperAdmin` ou `isManager`.

### 4.3 Componente ModeToggle (`src/components/ui/ModeToggle.tsx`)

Novo componente exibido no header apenas quando `isManager = true`:

- Dois estados visuais: **Gestão** (ativo em azul) / **Meu Treino**
- Ao trocar, atualiza `trainerMode` no AuthContext
- Persiste o modo escolhido em `localStorage` chave `'musc-trainer-mode'`

### 4.4 Rotas (`src/App.tsx`)

Criar `TrainerRoute` para proteger rotas de gestão:

```tsx
// Permite super_admin e trainer — baseado em PAPEL, não no modo ativo
// O modo (Gestão/Meu Treino) é apenas visual — a segurança real está no RLS do banco
<TrainerRoute> → redireciona user para /dashboard
```

Nova rota para gestão de trainers (apenas super_admin):
```
/admin/trainers              → TrainersAdminPage
/admin/trainers/new          → TrainerFormPage
```

### 4.5 Navegação por papel

**super_admin (modo Gestão):**
- Dashboard, Todos os Alunos, Fichas, Trainers (novo), Exercícios

**super_admin (modo Meu Treino):**
- Dashboard pessoal, Minhas Fichas, Histórico, Progresso, Medidas

**trainer (modo Gestão):**
- Dashboard dos alunos, Meus Alunos, Fichas dos Alunos

**trainer (modo Meu Treino):**
- Dashboard pessoal, Minhas Fichas, Histórico, Progresso, Medidas
- Ao criar uma ficha neste modo: `user_id = auth.uid()`, `is_template = false` (ficha pessoal, não visível para alunos)

**user:**
- Dashboard, Fichas, Histórico, Progresso, Medidas (igual hoje — sem mudança)

---

## 5. Novas Páginas

### 5.1 TrainersAdminPage (`src/pages/admin/TrainersAdminPage.tsx`)
- Rota: `/admin/trainers`
- Acesso: apenas `super_admin`
- Lista de trainers cadastrados (nome, e-mail, nº de alunos)
- Botão "Novo Trainer" → `TrainerFormPage`
- Soft delete: `is_active = false`

### 5.2 TrainerFormPage (`src/pages/admin/TrainerFormPage.tsx`)
- Rota: `/admin/trainers/new`
- Fluxo de criação em 2 etapas (sem backend server neste projeto):
  1. Super_admin preenche nome + e-mail do novo trainer
  2. App chama `supabase.auth.signUp()` com os dados — conta criada com `role = 'user'`
  3. Uma **Supabase Edge Function** protegida (`promote-to-trainer`) recebe o novo `user_id` e atualiza o `role` para `'trainer'` usando a `service_role key` (nunca exposta no frontend)
- Campos: nome completo, e-mail
- Após criar: redireciona para `/admin/trainers`

> **Nota:** A criação direta de usuário com `role='trainer'` exige a `service_role key` do Supabase, que não pode ficar no código frontend. A Edge Function é o único caminho seguro sem um servidor próprio.

### 5.3 Atualizar StudentsAdminPage (futura Fase 9)
- Ao criar/editar aluno, campo "Trainer responsável" (dropdown dos trainers ativos)
- Salva o `trainer_id` no perfil do aluno

---

## 6. Componentes a Modificar

| Componente/Arquivo | Mudança |
|-------------------|---------|
| `AdminRoute.tsx` | Renomear para `ManagerRoute` — permite `super_admin` e `trainer` |
| `AuthContext.tsx` | Substituir `isAdmin` por `isSuperAdmin`, `isTrainer`, `isManager`, `trainerMode` |
| `DashboardPage.tsx` | Renderizar conteúdo diferente conforme papel + modo |
| `WorkoutsAdminPage.tsx` | Filtrar fichas pelo `auth.uid()` se for `trainer` (não mostra fichas de outros trainers) |
| `Header/Sidebar` | Exibir `ModeToggle` se `isManager` |
| `supabase-setup.sql` | Adicionar nova seção com SQL de migração e novas policies |

---

## 7. Migração dos Dados Existentes

1. Rodar o SQL da seção 3.1 e 3.2 no Supabase SQL Editor
2. O admin atual (`role = 'admin'`) vira `super_admin` automaticamente
3. Entrar no app como super_admin e acessar `/admin/trainers` para criar os trainers
4. Para cada aluno existente: atribuir o `trainer_id` correto pelo painel

---

## 8. Fora de Escopo

- Aluno com múltiplos trainers (relação M:N) — não previsto
- Trainer ver o diário nutricional dos alunos — mantém privacidade atual
- Notificações entre trainer e aluno
- Transfer de aluno de um trainer para outro via app (pode ser feito direto no banco por ora)

---

## 9. Critérios de Conclusão

- [ ] Coluna `trainer_id` adicionada e `role` atualizado no banco
- [ ] RLS policies funcionando: trainer vê só os seus alunos
- [ ] Toggle "Gestão / Meu Treino" funciona no header para `trainer` e `super_admin`
- [ ] `super_admin` consegue criar um novo trainer em `/admin/trainers`
- [ ] Trainer em modo "Meu Treino" consegue criar fichas e registrar treinos para si mesmo
- [ ] Aluno existente (`user`) não vê dados de outros alunos (comportamento preservado)
- [ ] Aluno sem `trainer_id` não aparece para nenhum trainer (fica visível apenas para `super_admin`)
- [ ] Build sem erros de TypeScript
