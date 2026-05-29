# Fase 8 — Nutrição + IA (Gemini)

**Data:** 29 de maio de 2026  
**Status:** Aprovado ✅  
**Autor:** Denis Rodrigues

---

## 1. Objetivo

Implementar um diário alimentar onde o aluno descreve livremente o que comeu, a IA (Google Gemini) estima os macros automaticamente e dá um feedback nutricional, e os dados são salvos para acompanhamento diário.

---

## 2. Decisões de design

| Decisão | Escolha | Motivo |
|---------|---------|--------|
| O que a IA faz | Estima macros + dá feedback em texto | Mais prático — aluno não precisa digitar números |
| Como a IA é chamada | Via Edge Function segura no Supabase | Chave da API nunca exposta no navegador |
| Revisão antes de salvar | Sim — aluno pode editar os macros estimados | Garante dados confiáveis no histórico |
| Metas diárias | Calculadas automaticamente pelo perfil | Baseado em Harris-Benedict × objetivo do perfil |
| Layout da tela principal | Anel de calorias + macros no topo, lista de refeições abaixo | Escolhido pelo usuário (Opção A) |
| Formulário | Bottom sheet (sobe de baixo) | Natural em mobile, padrão de app nativo |
| Acesso trainer | Trainer lê o diário dos seus alunos via `?userId=` | RLS pronta na Fase 8; navegação admin na Fase 9 |

---

## 3. Banco de dados

### 3.1 Tabela `nutrition_logs` (já existe)

```sql
CREATE TABLE nutrition_logs (
  id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  user_id UUID REFERENCES profiles(id) ON DELETE CASCADE NOT NULL,
  meal_type TEXT NOT NULL CHECK (meal_type IN (
    'breakfast', 'lunch', 'snack', 'dinner', 'pre_workout', 'post_workout'
  )),
  description TEXT NOT NULL,
  calories INTEGER,
  protein_g DECIMAL(6,2),
  carbs_g DECIMAL(6,2),
  fat_g DECIMAL(6,2),
  ai_feedback TEXT,
  logged_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  created_at TIMESTAMPTZ DEFAULT NOW()
);
```

### 3.2 Migração necessária (Patch v5)

> A policy `"nutrition_logs: próprio usuário"` já existe — não recriar.

```sql
-- Soft delete (regra do projeto: nunca apagar fisicamente)
ALTER TABLE nutrition_logs ADD COLUMN IF NOT EXISTS is_active BOOLEAN DEFAULT true;

-- RLS nova: trainer lê logs dos seus alunos
CREATE POLICY "nutrition_logs: trainer lê seus alunos"
  ON nutrition_logs FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM profiles
      WHERE id = nutrition_logs.user_id
        AND trainer_id = auth.uid()
    )
  );
```

---

## 4. Edge Function `analyze-meal`

**Arquivo:** `supabase/functions/analyze-meal/index.ts`

**Variável de ambiente necessária no Supabase:** `GEMINI_API_KEY`

**Fluxo:**
1. Recebe `{ meal_type, description }` no body
2. Verifica token do usuário (mesma estrutura do `manage-users`)
3. Chama `https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash:generateContent`
4. Prompt estruturado para retornar JSON:

```
Você é um nutricionista especialista em musculação.
Analise a refeição abaixo e retorne SOMENTE um JSON válido, sem markdown, com este formato exato:
{
  "calories": <número inteiro>,
  "protein_g": <número inteiro>,
  "carbs_g": <número inteiro>,
  "fat_g": <número inteiro>,
  "feedback": "<máximo 2 frases em português, tom positivo e prático>"
}
Tipo de refeição: {meal_type}
Descrição: {description}
```

5. Faz parse do JSON retornado pelo Gemini
6. Retorna `{ calories, protein_g, carbs_g, fat_g, feedback }`
7. Em caso de erro de parse: retorna `{ calories: 0, protein_g: 0, carbs_g: 0, fat_g: 0, feedback: "Não foi possível analisar. Preencha os valores manualmente." }`

**Deploy:** usuário cola o código no painel Supabase → Edge Functions (mesmo processo do `manage-users`).

---

## 5. Serviços frontend

### 5.1 `src/services/ai.service.ts`

```typescript
analyzeMeal(mealType: string, description: string): Promise<{
  calories: number
  protein_g: number
  carbs_g: number
  fat_g: number
  feedback: string
}>
```

Chama `supabase.functions.invoke('analyze-meal', { body: { meal_type, description } })`.

### 5.2 `src/services/nutrition.service.ts`

```typescript
getNutritionLogs(userId: string, date: string): Promise<NutritionLog[]>
// Busca logs do dia (date no formato 'YYYY-MM-DD'), is_active = true, ordenado por logged_at

addNutritionLog(data: NewNutritionLog): Promise<NutritionLog>
// Insere novo registro

deactivateNutritionLog(logId: string): Promise<void>
// Soft delete: is_active = false

getDailyTotals(userId: string, date: string): Promise<DailyTotals>
// Soma calorias, protein_g, carbs_g, fat_g do dia
```

### 5.3 Cálculo de metas (`src/lib/nutritionGoals.ts`)

```typescript
calculateDailyGoals(profile: UserProfile): DailyGoals | null
```

**Fórmula Harris-Benedict revisada:**
- Homem: `88.362 + (13.397 × peso) + (4.799 × altura) − (5.677 × idade)`
- Mulher: `447.593 + (9.247 × peso) + (3.098 × altura) − (4.330 × idade)`
- Multiplica por `1.55` (moderadamente ativo)
- Ajusta pelo objetivo: se `target_weight < weight` → `-300 kcal`; se `target_weight > weight` → `+300 kcal`; senão sem ajuste

**Distribuição de macros:**
- Proteína: `2g × peso_kg` → `× 4` para kcal
- Gordura: `25%` das kcal totais → `÷ 9` para gramas
- Carboidrato: `(kcal_total − kcal_proteína − kcal_gordura) ÷ 4`

Retorna `null` se `weight`, `height`, `birth_date` ou `gender` estiverem ausentes no perfil.

---

## 6. Tipos novos (`src/types/index.ts`)

```typescript
export type MealType =
  | 'breakfast' | 'lunch' | 'snack'
  | 'dinner' | 'pre_workout' | 'post_workout'

export const MEAL_TYPE_LABELS: Record<MealType, string> = {
  breakfast: '☕ Café da manhã',
  lunch: '🥗 Almoço',
  snack: '🍎 Lanche',
  dinner: '🍽️ Jantar',
  pre_workout: '⚡ Pré-treino',
  post_workout: '💪 Pós-treino',
}

export interface NutritionLog {
  id: string
  user_id: string
  meal_type: MealType
  description: string
  calories?: number
  protein_g?: number
  carbs_g?: number
  fat_g?: number
  ai_feedback?: string
  is_active: boolean
  logged_at: string
  created_at: string
}

export interface DailyTotals {
  calories: number
  protein_g: number
  carbs_g: number
  fat_g: number
}

export interface DailyGoals {
  calories: number
  protein_g: number
  carbs_g: number
  fat_g: number
}

export type NewNutritionLog = Omit<NutritionLog, 'id' | 'created_at' | 'is_active'>
```

---

## 7. Componentes

### 7.1 `src/components/MealCard.tsx`

Exibe uma refeição registrada. Props:
- `log: NutritionLog`
- `onDelete: () => void`

Conteúdo: chip do tipo, horário, descrição, macros em linha, feedback da IA em itálico, botão de excluir (abre `ConfirmModal`).

### 7.2 `src/components/MealBottomSheet.tsx`

Bottom sheet para registrar refeição. Props:
- `isOpen: boolean`
- `onClose: () => void`
- `onSaved: (log: NutritionLog) => void`
- `userId: string`

**Estados internos:** `mealType`, `description`, `calories`, `protein_g`, `carbs_g`, `fat_g`, `feedback`, `analyzing` (loading da IA), `saving`, `analyzed` (controla se mostra o resultado)

**Fluxo UX:**
1. Chips de tipo → textarea de descrição → botão "⚡ ANALISAR COM IA"
2. Enquanto analisa: spinner no botão, desabilitado
3. Após análise: aparecem os 4 campos editáveis preenchidos + feedback da IA
4. Botão "SALVAR REFEIÇÃO" (só aparece após análise)
5. Aluno pode editar os campos antes de salvar
6. Fecha ao salvar, chama `onSaved`

### 7.3 `src/pages/NutritionPage.tsx`

**Rota:** `/nutricao` (aceita `?userId=` para trainer ver aluno)

**Estrutura:**
```
<Topbar eyebrow="SAÚDE" title="NUTRIÇÃO" />

<div className="content">
  {/* Navegador de dia */}
  ‹  Hoje, 29 mai  ›

  {/* Card resumo */}
  <div className="card">
    Anel de calorias (conic-gradient animado)  +  macros P/C/G com barras
    [se sem metas: "Complete o perfil para ver suas metas" → link /perfil]
    [aviso: "Estimativa — consulte um nutricionista"]
  </div>

  {/* Lista de refeições do dia */}
  {logs.map(log => <MealCard key={log.id} log={log} onDelete={...} />)}

  {/* Estado vazio */}
  [se sem refeições: card dashed "Nenhuma refeição registrada hoje"]
</div>

{/* Botão fixo */}
<button className="btn primary fab">+ REGISTRAR REFEIÇÃO</button>

<MealBottomSheet isOpen={...} onClose={...} onSaved={...} userId={...} />
```

**Navegação de dias:** estado `selectedDate` (string 'YYYY-MM-DD'), setas diminuem/aumentam 1 dia, não avança além de hoje.

---

## 8. Navegação

- Adicionar `/nutricao` nas rotas de `App.tsx` (dentro de `ProtectedRoute`)
- Adicionar item "Nutrição" no menu lateral (`Sidebar.tsx`) e na tabbar mobile (`MobileTabbar.tsx`) — ícone: usar `flash` (ícone de raio já existente no DS) ou criar novo ícone `salad`
- Posição no menu: entre "Medidas" e o separador admin

---

## 9. Critérios de conclusão

- [ ] Aluno registra uma refeição e recebe estimativa de macros + feedback da IA
- [ ] Aluno pode editar os macros antes de salvar
- [ ] Totais do dia somam corretamente no card de resumo
- [ ] Metas automáticas aparecem quando perfil está completo
- [ ] Navegação entre dias funciona
- [ ] Soft delete funciona (excluir refeição some da lista mas permanece no banco)
- [ ] Trainer consegue ver o diário de um aluno via `?userId=`
- [ ] Build sem erros de TypeScript
- [ ] Edge Function `analyze-meal` deployada no Supabase

---

## 10. Fora do escopo desta fase

- Navegação admin até o diário do aluno (fica para Fase 9)
- Histórico de dias anteriores em gráfico
- Export de dados nutricionais
- Metas definidas manualmente pelo trainer ou aluno
- Integração com base de dados de alimentos (TACO, etc.)
