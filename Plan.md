# MUSCTRAINIG — Plan.md

**Versão:** 2.0  
**Atualizado em:** 22 de maio de 2026  
**Status:** Em andamento 🚧

> Este é o documento central de execução do projeto. Substitui o `plano-implementacao.md` como referência ativa.  
> Referências: [PRD](docs/superpowers/specs/2026-05-22-musctrainig-prd.md) | [CLAUDE.md](CLAUDE.md)

---

## Estado atual do projeto

| Fase | Descrição | Status |
|------|-----------|--------|
| 1 | Fundação (Vite + React + TypeScript + Tailwind) | ✅ Completa |
| 2 | Banco de dados (Supabase: tabelas, RLS, seed) | 🚧 SQL criado — aguardando execução no Supabase |
| 3 | Autenticação (login, logout, rotas protegidas) | ✅ Completa |
| 4 | Perfil do usuário | ⏳ Pendente |
| 5 | Fichas de treino (CRUD admin + visualização aluno) | ⏳ Pendente |
| 6 | Execução de treino (séries, timer) | ⏳ Pendente |
| 7 | Histórico e progressão (gráficos) | ⏳ Pendente |
| 8 | Nutrição + IA (Gemini) | ⏳ Pendente |
| 9 | Painel admin (gestão de alunos) | ⏳ Pendente |
| 10 | Polish + PWA | ⏳ Pendente |
| 11 | Deploy (Vercel) | ⏳ Pendente |

---

## Fluxo de trabalho padrão

Antes de cada fase, verificar a complexidade e seguir o fluxo correspondente:

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

## Roteiro das fases pendentes

---

### FASE 2 — Banco de dados 🚧
**Complexidade:** 🟡 Simples (manual — executar SQL no Supabase)

**O que entrega:** 9 tabelas criadas, RLS ativo, 39 exercícios pré-cadastrados.

**Passos:**
1. Acessar [app.supabase.com](https://app.supabase.com) → projeto MUSCTRAINIG → SQL Editor
2. Copiar o conteúdo de `supabase-setup.sql` e rodar
3. Verificar no Table Editor que as 9 tabelas apareceram
4. Rodar `npm run dev` e confirmar que não há erros de conexão

**Skill de apoio:** `/supabase-postgres-best-practices` se precisar ajustar queries ou RLS

**Critério de conclusão:** 9 tabelas visíveis no Supabase, `npm run dev` sem erros de banco.

---

### FASE 4 — Perfil do usuário ⏳
**Complexidade:** 🟡 Simples → usar `/frontend-design`

**O que entrega:** Página onde o aluno visualiza e edita seus dados pessoais (nome, peso, altura, objetivo, foto).

**Arquivos a criar:**
```
src/services/profile.service.ts   — buscar e atualizar perfil
src/pages/ProfilePage.tsx         — tela de perfil
src/components/ui/Avatar.tsx      — foto com fallback nas iniciais
```

**Critério de conclusão:** Usuário logado consegue ver e editar seu perfil; mudanças persistem no Supabase.

---

### FASE 5 — Fichas de treino ⏳
**Complexidade:** 🔴 Complexa → iniciar com `/brainstorming`

**O que entrega:** Admin cria fichas e atribui a alunos. Aluno visualiza suas fichas.

**Arquivos principais a criar:**
```
src/services/workout.service.ts
src/pages/WorkoutsPage.tsx              — lista do aluno
src/pages/WorkoutDetailPage.tsx         — detalhe de uma ficha
src/pages/admin/WorkoutsAdminPage.tsx   — gestão admin
src/pages/admin/WorkoutFormPage.tsx     — criar/editar ficha
src/components/WorkoutCard.tsx
src/components/ExerciseSelector.tsx     — modal de busca de exercícios
```

**Critério de conclusão:** Admin cria ficha com exercícios e atribui a aluno; aluno vê a ficha no seu dashboard.

---

### FASE 6 — Execução de treino ⏳
**Complexidade:** 🔴 Complexa → iniciar com `/brainstorming`

**O que entrega:** Interface de treino ativo — o aluno registra cada série, usa o timer de descanso e finaliza o treino.

**Arquivos principais a criar:**
```
src/services/workout-log.service.ts
src/pages/WorkoutSessionPage.tsx
src/components/ExerciseSetRow.tsx       — linha de série (reps + carga)
src/components/RestTimer.tsx            — timer de descanso
src/components/WorkoutFinishModal.tsx   — modal de finalização
```

**Critério de conclusão:** Aluno inicia treino, registra séries, timer funciona, ao finalizar os dados aparecem no histórico.

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

**O que entrega:** Dashboard do admin com estatísticas, lista de alunos, criação de aluno e biblioteca de exercícios.

**Arquivos a criar:**
```
src/services/admin.service.ts
src/pages/admin/AdminDashboardPage.tsx
src/pages/admin/StudentsPage.tsx
src/pages/admin/StudentDetailPage.tsx
src/pages/admin/ExerciseLibraryPage.tsx
```

**Critério de conclusão:** Admin consegue criar um novo aluno, atribuir uma ficha e ver o histórico desse aluno.

---

### FASE 10 — Polish + PWA ⏳
**Complexidade:** 🟡 Simples → usar `/frontend-design` para componentes visuais

**O que entrega:** App polido e instalável no celular.

**Checklist:**
- [ ] Skeleton screens (loading visual enquanto carrega dados)
- [ ] Componente Toast (notificações de sucesso/erro)
- [ ] Tratamento de erros amigável em toda a app
- [ ] Animações de transição entre páginas (Motion)
- [ ] Ícones PWA (192×192 e 512×512)
- [ ] `manifest.json` configurado
- [ ] Testes no celular (Chrome DevTools → modo mobile)
- [ ] Lighthouse audit (meta: PWA score > 90)

**Critério de conclusão:** App instalável no Android, Lighthouse PWA ≥ 90, sem erros visíveis no console.

---

### FASE 11 — Deploy ⏳
**Complexidade:** 🟡 Simples (checklist)

**O que entrega:** App em produção, acessível por URL pública.

**Passos:**
1. Colocar o projeto no GitHub (se ainda não estiver)
2. Criar conta em [vercel.com](https://vercel.com) e conectar o repositório
3. Configurar variáveis de ambiente no Vercel:
   ```
   VITE_SUPABASE_URL=...
   VITE_SUPABASE_ANON_KEY=...
   VITE_GEMINI_API_KEY=...
   ```
4. Fazer deploy e testar a URL de produção
5. (Opcional) Configurar domínio personalizado

**Critério de conclusão:** URL pública funciona, login funciona, dados são salvos no Supabase de produção.

---

## Ordem recomendada de execução

```
2 → 4 → 5 → 6 → 7 → 8 → 9 → 10 → 11
```

> As fases 2 e 4 podem ser feitas em qualquer ordem. A partir da fase 5, seguir a sequência — cada fase depende da anterior.

---

*Atualizado por Denis Rodrigues em 22/05/2026*
