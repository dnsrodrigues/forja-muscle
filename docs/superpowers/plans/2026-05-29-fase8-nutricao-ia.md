# Fase 8 — Nutrição + IA (Gemini) — Plano de Implementação

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Implementar diário alimentar onde o aluno descreve refeições em texto livre, o Google Gemini estima macros automaticamente e dá feedback nutricional, com metas calculadas pelo perfil do usuário.

**Architecture:** Edge Function `analyze-meal` no Supabase chama o Gemini com a chave de API protegida no servidor. O frontend usa um bottom sheet para registro, mostra o resultado editável antes de salvar, e exibe um resumo diário com anel de calorias + barras de macros comparados às metas calculadas por Harris-Benedict.

**Tech Stack:** React 19 + TypeScript, Supabase (PostgreSQL + Edge Functions Deno), Google Gemini API (gemini-1.5-flash), Motion (animações), Design System FORJA (CSS vars, classes `.card`, `.btn`, `.chip`, `.skeleton`).

---

## Mapa de arquivos

| Arquivo | Ação | Responsabilidade |
|---------|------|-----------------|
| `supabase/functions/analyze-meal/index.ts` | **Criar** | Edge Function: autenticar → chamar Gemini → retornar macros + feedback |
| `supabase-setup.sql` | **Modificar** | Patch v5: coluna `is_active` + RLS trainer |
| `src/types/index.ts` | **Modificar** | Adicionar `MealType`, `MEAL_TYPE_LABELS`, `NutritionLog`, `NewNutritionLog`, `DailyTotals`, `DailyGoals` |
| `src/lib/nutritionGoals.ts` | **Criar** | Função pura: calcula metas diárias pelo perfil (Harris-Benedict) |
| `src/services/ai.service.ts` | **Criar** | Chama Edge Function `analyze-meal` via `supabase.functions.invoke` |
| `src/services/nutrition.service.ts` | **Criar** | CRUD do `nutrition_logs`: listar dia, adicionar, desativar, totais |
| `src/components/MealCard.tsx` | **Criar** | Card de uma refeição: tipo, horário, descrição, macros, feedback IA, excluir |
| `src/components/MealBottomSheet.tsx` | **Criar** | Bottom sheet: chips de tipo → textarea → analisar IA → editar macros → salvar |
| `src/pages/NutritionPage.tsx` | **Criar** | Tela principal: navegador de dia, card resumo com anel, lista de refeições, botão FAB |
| `src/components/layout/Sidebar.tsx` | **Modificar** | Adicionar link "Nutrição" (`/nutricao`) na lista `alunoLinks()` |
| `src/components/layout/MobileTabbar.tsx` | **Modificar** | Adicionar tab "Nutrição" em `ALUNO_TABS` |
| `src/App.tsx` | **Modificar** | Adicionar rota `/nutricao` dentro de `ProtectedRoute` |

---

## Task 1: Patch de banco — coluna `is_active` + RLS trainer

**Files:**
- Modify: `supabase-setup.sql`

- [ ] **Passo 1: Adicionar o Patch v5 ao final do `supabase-setup.sql`**

Abra `supabase-setup.sql` e adicione ao final:

```sql
-- =============================================
-- PATCH v5 — Nutrição + IA (Fase 8)
-- =============================================

-- Soft delete em nutrition_logs
ALTER TABLE nutrition_logs ADD COLUMN IF NOT EXISTS is_active BOOLEAN DEFAULT true;

-- RLS: trainer lê logs dos seus alunos
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

- [ ] **Passo 2: Rodar o SQL no Supabase**

No painel Supabase → **SQL Editor**, cole e execute apenas as 2 instruções do Patch v5 acima (não o arquivo inteiro).

Resultado esperado: `Success. No rows returned`

- [ ] **Passo 3: Commit**

```bash
git add supabase-setup.sql
git commit -m "feat(db): patch v5 — is_active em nutrition_logs + RLS trainer"
```

---

## Task 2: Edge Function `analyze-meal`

**Files:**
- Create: `supabase/functions/analyze-meal/index.ts`

- [ ] **Passo 1: Criar a Edge Function**

Crie o arquivo `supabase/functions/analyze-meal/index.ts` com este conteúdo:

```typescript
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders })
  }

  try {
    // Verificar autenticação
    const authHeader = req.headers.get('Authorization')
    if (!authHeader) throw new Error('Não autorizado')

    const supabaseUser = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_ANON_KEY') ?? '',
      { global: { headers: { Authorization: authHeader } } },
    )
    const { data: { user }, error: userError } = await supabaseUser.auth.getUser()
    if (userError || !user) throw new Error('Token inválido')

    // Ler body
    const { meal_type, description } = await req.json() as {
      meal_type: string
      description: string
    }
    if (!meal_type || !description) throw new Error('meal_type e description são obrigatórios')

    // Chamar Gemini
    const geminiKey = Deno.env.get('GEMINI_API_KEY')
    if (!geminiKey) throw new Error('GEMINI_API_KEY não configurada')

    const prompt = `Você é um nutricionista especialista em musculação.
Analise a refeição abaixo e retorne SOMENTE um JSON válido, sem markdown, com este formato exato:
{
  "calories": <número inteiro>,
  "protein_g": <número inteiro>,
  "carbs_g": <número inteiro>,
  "fat_g": <número inteiro>,
  "feedback": "<máximo 2 frases em português, tom positivo e prático>"
}
Tipo de refeição: ${meal_type}
Descrição: ${description}`

    const geminiRes = await fetch(
      `https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash:generateContent?key=${geminiKey}`,
      {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          contents: [{ parts: [{ text: prompt }] }],
        }),
      },
    )

    if (!geminiRes.ok) throw new Error(`Gemini error: ${geminiRes.status}`)

    const geminiData = await geminiRes.json()
    const rawText: string = geminiData?.candidates?.[0]?.content?.parts?.[0]?.text ?? ''

    // Parse JSON da resposta (remove possível markdown ```json ... ```)
    const cleaned = rawText.replace(/```json\n?/g, '').replace(/```\n?/g, '').trim()

    let result: {
      calories: number
      protein_g: number
      carbs_g: number
      fat_g: number
      feedback: string
    }

    try {
      result = JSON.parse(cleaned)
    } catch {
      // Fallback se o Gemini não retornar JSON válido
      result = {
        calories: 0,
        protein_g: 0,
        carbs_g: 0,
        fat_g: 0,
        feedback: 'Não foi possível analisar. Preencha os valores manualmente.',
      }
    }

    return new Response(JSON.stringify({ success: true, ...result }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    })
  } catch (err) {
    const message = err instanceof Error ? err.message : 'Erro desconhecido'
    return new Response(
      JSON.stringify({ error: message }),
      { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } },
    )
  }
})
```

- [ ] **Passo 2: Fazer deploy no Supabase**

No painel Supabase → **Edge Functions** → **New Function** → nome: `analyze-meal`.
Cole o código acima e clique em **Deploy**.

Em seguida, vá em **Edge Functions** → `analyze-meal` → **Secrets** e adicione:
- Nome: `GEMINI_API_KEY`
- Valor: sua chave da API do Google Gemini (obtida em https://aistudio.google.com/apikey)

- [ ] **Passo 3: Commit**

```bash
git add supabase/functions/analyze-meal/index.ts
git commit -m "feat(edge): edge function analyze-meal — Gemini estima macros + feedback"
```

---

## Task 3: Tipos TypeScript novos

**Files:**
- Modify: `src/types/index.ts`

- [ ] **Passo 1: Adicionar os novos tipos ao final de `src/types/index.ts`**

```typescript
// --- Nutrição ---

export type MealType =
  | 'breakfast'
  | 'lunch'
  | 'snack'
  | 'dinner'
  | 'pre_workout'
  | 'post_workout'

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

export type NewNutritionLog = Omit<NutritionLog, 'id' | 'created_at' | 'is_active'>

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
```

- [ ] **Passo 2: Verificar TypeScript**

```bash
npx tsc --noEmit
```

Resultado esperado: nenhuma saída (zero erros).

- [ ] **Passo 3: Commit**

```bash
git add src/types/index.ts
git commit -m "feat(types): adiciona MealType, NutritionLog, DailyTotals, DailyGoals"
```

---

## Task 4: Cálculo de metas nutricionais

**Files:**
- Create: `src/lib/nutritionGoals.ts`

- [ ] **Passo 1: Criar `src/lib/nutritionGoals.ts`**

```typescript
import type { UserProfile, DailyGoals } from '../types'

/**
 * Calcula as metas diárias de macronutrientes com base no perfil do usuário.
 * Usa a fórmula Harris-Benedict revisada × fator de atividade 1.55 (moderadamente ativo).
 * Retorna null se o perfil não tiver dados suficientes (peso, altura, nascimento, gênero).
 */
export function calculateDailyGoals(profile: UserProfile): DailyGoals | null {
  if (!profile.weight || !profile.height || !profile.birth_date || !profile.gender) {
    return null
  }

  // Calcular idade em anos
  const birthYear = new Date(profile.birth_date).getFullYear()
  const currentYear = new Date().getFullYear()
  const age = currentYear - birthYear

  const weight = profile.weight   // kg
  const height = profile.height   // cm

  // Metabolismo basal (Harris-Benedict revisada)
  let bmr: number
  if (profile.gender === 'male') {
    bmr = 88.362 + (13.397 * weight) + (4.799 * height) - (5.677 * age)
  } else {
    // female e other usam fórmula feminina
    bmr = 447.593 + (9.247 * weight) + (3.098 * height) - (4.330 * age)
  }

  // TDEE: moderadamente ativo (treina regularmente)
  let tdee = bmr * 1.55

  // Ajuste pelo objetivo: perder / manter / ganhar
  if (profile.target_weight && profile.target_weight < weight) {
    tdee -= 300  // déficit para perda de peso
  } else if (profile.target_weight && profile.target_weight > weight) {
    tdee += 300  // superávit para ganho de massa
  }

  const calories = Math.round(tdee)

  // Distribuição de macros para musculação
  const protein_g = Math.round(2 * weight)                          // 2g por kg
  const protein_kcal = protein_g * 4

  const fat_kcal = calories * 0.25
  const fat_g = Math.round(fat_kcal / 9)

  const carbs_kcal = calories - protein_kcal - fat_kcal
  const carbs_g = Math.round(carbs_kcal / 4)

  return { calories, protein_g, carbs_g: Math.max(carbs_g, 0), fat_g }
}
```

- [ ] **Passo 2: Verificar TypeScript**

```bash
npx tsc --noEmit
```

Resultado esperado: nenhuma saída.

- [ ] **Passo 3: Commit**

```bash
git add src/lib/nutritionGoals.ts
git commit -m "feat(lib): nutritionGoals — Harris-Benedict com ajuste por objetivo"
```

---

## Task 5: Serviço de IA (`ai.service.ts`)

**Files:**
- Create: `src/services/ai.service.ts`

- [ ] **Passo 1: Criar `src/services/ai.service.ts`**

```typescript
import { supabase } from '../lib/supabase'

export interface MealAnalysis {
  calories: number
  protein_g: number
  carbs_g: number
  fat_g: number
  feedback: string
}

/**
 * Chama a Edge Function 'analyze-meal' que usa o Gemini para
 * estimar macros e gerar feedback nutricional da refeição.
 */
export async function analyzeMeal(
  mealType: string,
  description: string,
): Promise<MealAnalysis> {
  const { data, error } = await supabase.functions.invoke('analyze-meal', {
    body: { meal_type: mealType, description },
  })

  if (error) throw new Error(error.message)

  const result = data as MealAnalysis & { success?: boolean; error?: string }
  if (result.error) throw new Error(result.error)

  return {
    calories: result.calories ?? 0,
    protein_g: result.protein_g ?? 0,
    carbs_g: result.carbs_g ?? 0,
    fat_g: result.fat_g ?? 0,
    feedback: result.feedback ?? '',
  }
}
```

- [ ] **Passo 2: Verificar TypeScript**

```bash
npx tsc --noEmit
```

- [ ] **Passo 3: Commit**

```bash
git add src/services/ai.service.ts
git commit -m "feat(services): ai.service — chama Edge Function analyze-meal"
```

---

## Task 6: Serviço de nutrição (`nutrition.service.ts`)

**Files:**
- Create: `src/services/nutrition.service.ts`

- [ ] **Passo 1: Criar `src/services/nutrition.service.ts`**

```typescript
import { supabase } from '../lib/supabase'
import type { NutritionLog, NewNutritionLog, DailyTotals } from '../types'

/**
 * Busca todos os logs ativos de um dia específico para um usuário.
 * @param userId  ID do usuário
 * @param date    Formato 'YYYY-MM-DD'
 */
export async function getNutritionLogs(
  userId: string,
  date: string,
): Promise<NutritionLog[]> {
  const startOfDay = `${date}T00:00:00.000Z`
  const endOfDay = `${date}T23:59:59.999Z`

  const { data, error } = await supabase
    .from('nutrition_logs')
    .select('*')
    .eq('user_id', userId)
    .eq('is_active', true)
    .gte('logged_at', startOfDay)
    .lte('logged_at', endOfDay)
    .order('logged_at', { ascending: true })

  if (error) throw new Error(error.message)
  return (data ?? []) as NutritionLog[]
}

/** Insere um novo registro de refeição. */
export async function addNutritionLog(
  data: NewNutritionLog,
): Promise<NutritionLog> {
  const { data: created, error } = await supabase
    .from('nutrition_logs')
    .insert({
      user_id: data.user_id,
      meal_type: data.meal_type,
      description: data.description,
      calories: data.calories ?? null,
      protein_g: data.protein_g ?? null,
      carbs_g: data.carbs_g ?? null,
      fat_g: data.fat_g ?? null,
      ai_feedback: data.ai_feedback ?? null,
      logged_at: data.logged_at,
    })
    .select()
    .single()

  if (error) throw new Error(error.message)
  return created as NutritionLog
}

/** Soft delete: marca o log como inativo. */
export async function deactivateNutritionLog(logId: string): Promise<void> {
  const { error } = await supabase
    .from('nutrition_logs')
    .update({ is_active: false })
    .eq('id', logId)

  if (error) throw new Error(error.message)
}

/**
 * Calcula os totais de macros consumidos num dia.
 * Usa os logs já carregados para evitar uma query extra.
 */
export function computeDailyTotals(logs: NutritionLog[]): DailyTotals {
  return logs.reduce(
    (acc, log) => ({
      calories: acc.calories + (log.calories ?? 0),
      protein_g: acc.protein_g + (log.protein_g ?? 0),
      carbs_g: acc.carbs_g + (log.carbs_g ?? 0),
      fat_g: acc.fat_g + (log.fat_g ?? 0),
    }),
    { calories: 0, protein_g: 0, carbs_g: 0, fat_g: 0 },
  )
}
```

- [ ] **Passo 2: Verificar TypeScript**

```bash
npx tsc --noEmit
```

- [ ] **Passo 3: Commit**

```bash
git add src/services/nutrition.service.ts
git commit -m "feat(services): nutrition.service — CRUD logs + computeDailyTotals"
```

---

## Task 7: Componente `MealCard`

**Files:**
- Create: `src/components/MealCard.tsx`

- [ ] **Passo 1: Criar `src/components/MealCard.tsx`**

```tsx
import { useState } from 'react'
import { Icon } from './ui/Icon'
import { ConfirmModal } from './ui/ConfirmModal'
import type { NutritionLog, MealType } from '../types'
import { MEAL_TYPE_LABELS } from '../types'

interface MealCardProps {
  log: NutritionLog
  onDelete: () => void
  readOnly?: boolean  // true quando trainer visualiza diário de aluno
}

function formatTime(isoString: string): string {
  return new Date(isoString).toLocaleTimeString('pt-BR', {
    hour: '2-digit',
    minute: '2-digit',
  })
}

export function MealCard({ log, onDelete, readOnly = false }: MealCardProps) {
  const [showConfirm, setShowConfirm] = useState(false)

  const hasMacros = log.calories != null || log.protein_g != null

  return (
    <>
      <div
        className="card"
        style={{
          padding: '14px 16px',
          borderLeft: '2px solid var(--accent)',
        }}
      >
        {/* Header: tipo + horário + botão excluir */}
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 8 }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
            <span className="chip" style={{ fontSize: 10, padding: '2px 8px' }}>
              {MEAL_TYPE_LABELS[log.meal_type as MealType] ?? log.meal_type}
            </span>
            <span style={{ fontFamily: 'var(--f-mono)', fontSize: 10, color: 'var(--text-faint)' }}>
              {formatTime(log.logged_at)}
            </span>
          </div>
          {!readOnly && (
            <button
              onClick={() => setShowConfirm(true)}
              style={{ background: 'transparent', border: 'none', cursor: 'pointer', color: 'var(--text-faint)', padding: 4, lineHeight: 0 }}
              onMouseEnter={(e) => { (e.currentTarget as HTMLButtonElement).style.color = 'var(--danger)' }}
              onMouseLeave={(e) => { (e.currentTarget as HTMLButtonElement).style.color = 'var(--text-faint)' }}
              title="Excluir refeição"
            >
              <Icon name="x" size={14} />
            </button>
          )}
        </div>

        {/* Descrição */}
        <p style={{ margin: 0, fontSize: 13, color: 'var(--text)', lineHeight: 1.5 }}>
          {log.description}
        </p>

        {/* Macros */}
        {hasMacros && (
          <div style={{ display: 'flex', gap: 16, marginTop: 8, flexWrap: 'wrap' }}>
            {log.calories != null && (
              <span style={{ fontFamily: 'var(--f-mono)', fontSize: 11, color: 'var(--accent)', fontWeight: 700 }}>
                {log.calories} kcal
              </span>
            )}
            {log.protein_g != null && (
              <span style={{ fontFamily: 'var(--f-mono)', fontSize: 11, color: 'var(--text-dim)' }}>
                P {log.protein_g}g
              </span>
            )}
            {log.carbs_g != null && (
              <span style={{ fontFamily: 'var(--f-mono)', fontSize: 11, color: 'var(--text-dim)' }}>
                C {log.carbs_g}g
              </span>
            )}
            {log.fat_g != null && (
              <span style={{ fontFamily: 'var(--f-mono)', fontSize: 11, color: 'var(--text-dim)' }}>
                G {log.fat_g}g
              </span>
            )}
          </div>
        )}

        {/* Feedback da IA */}
        {log.ai_feedback && (
          <p style={{
            margin: '8px 0 0',
            fontSize: 11,
            color: 'var(--text-faint)',
            fontStyle: 'italic',
            borderTop: '1px solid var(--hairline)',
            paddingTop: 6,
            lineHeight: 1.5,
          }}>
            ✦ {log.ai_feedback}
          </p>
        )}
      </div>

      {showConfirm && (
        <ConfirmModal
          title="Excluir refeição"
          message="Esta refeição será removida do diário. Você poderá adicionar novamente se quiser."
          confirmLabel="Excluir"
          danger
          onConfirm={() => { setShowConfirm(false); onDelete() }}
          onCancel={() => setShowConfirm(false)}
        />
      )}
    </>
  )
}
```

- [ ] **Passo 2: Verificar TypeScript**

```bash
npx tsc --noEmit
```

- [ ] **Passo 3: Commit**

```bash
git add src/components/MealCard.tsx
git commit -m "feat(components): MealCard — card de refeição com macros e feedback IA"
```

---

## Task 8: Bottom sheet `MealBottomSheet`

**Files:**
- Create: `src/components/MealBottomSheet.tsx`

- [ ] **Passo 1: Criar `src/components/MealBottomSheet.tsx`**

```tsx
import { useState, useEffect } from 'react'
import { motion, AnimatePresence } from 'motion/react'
import { Icon } from './ui/Icon'
import { analyzeMeal } from '../services/ai.service'
import { addNutritionLog } from '../services/nutrition.service'
import type { NutritionLog, MealType } from '../types'
import { MEAL_TYPE_LABELS } from '../types'

interface MealBottomSheetProps {
  isOpen: boolean
  onClose: () => void
  onSaved: (log: NutritionLog) => void
  userId: string
}

const MEAL_TYPES = Object.keys(MEAL_TYPE_LABELS) as MealType[]

export function MealBottomSheet({ isOpen, onClose, onSaved, userId }: MealBottomSheetProps) {
  const [mealType, setMealType] = useState<MealType>('breakfast')
  const [description, setDescription] = useState('')
  const [calories, setCalories] = useState('')
  const [proteinG, setProteinG] = useState('')
  const [carbsG, setCarbsG] = useState('')
  const [fatG, setFatG] = useState('')
  const [feedback, setFeedback] = useState('')
  const [analyzing, setAnalyzing] = useState(false)
  const [saving, setSaving] = useState(false)
  const [analyzed, setAnalyzed] = useState(false)
  const [analyzeError, setAnalyzeError] = useState<string | null>(null)

  // Reset ao fechar
  useEffect(() => {
    if (!isOpen) {
      setTimeout(() => {
        setDescription('')
        setCalories('')
        setProteinG('')
        setCarbsG('')
        setFatG('')
        setFeedback('')
        setAnalyzed(false)
        setAnalyzeError(null)
        setMealType('breakfast')
      }, 300)
    }
  }, [isOpen])

  // Fechar com Escape
  useEffect(() => {
    if (!isOpen) return
    function onKey(e: KeyboardEvent) {
      if (e.key === 'Escape') onClose()
    }
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  }, [isOpen, onClose])

  async function handleAnalyze() {
    if (!description.trim()) return
    setAnalyzing(true)
    setAnalyzeError(null)
    try {
      const result = await analyzeMeal(mealType, description.trim())
      setCalories(String(result.calories))
      setProteinG(String(result.protein_g))
      setCarbsG(String(result.carbs_g))
      setFatG(String(result.fat_g))
      setFeedback(result.feedback)
      setAnalyzed(true)
    } catch (err) {
      setAnalyzeError(err instanceof Error ? err.message : 'Erro ao analisar')
    } finally {
      setAnalyzing(false)
    }
  }

  async function handleSave() {
    if (!analyzed) return
    setSaving(true)
    try {
      const log = await addNutritionLog({
        user_id: userId,
        meal_type: mealType,
        description: description.trim(),
        calories: calories ? Number(calories) : undefined,
        protein_g: proteinG ? Number(proteinG) : undefined,
        carbs_g: carbsG ? Number(carbsG) : undefined,
        fat_g: fatG ? Number(fatG) : undefined,
        ai_feedback: feedback || undefined,
        logged_at: new Date().toISOString(),
      })
      onSaved(log)
      onClose()
    } catch (err) {
      setAnalyzeError(err instanceof Error ? err.message : 'Erro ao salvar')
    } finally {
      setSaving(false)
    }
  }

  return (
    <AnimatePresence>
      {isOpen && (
        <>
          {/* Overlay */}
          <motion.div
            key="bs-overlay"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={onClose}
            style={{
              position: 'fixed', inset: 0, zIndex: 60,
              background: 'rgba(0,0,0,0.7)', backdropFilter: 'blur(4px)',
            }}
          />

          {/* Sheet */}
          <motion.div
            key="bs-sheet"
            role="dialog"
            aria-modal="true"
            aria-labelledby="bs-title"
            initial={{ y: '100%' }}
            animate={{ y: 0 }}
            exit={{ y: '100%' }}
            transition={{ type: 'spring', damping: 30, stiffness: 300 }}
            style={{
              position: 'fixed', bottom: 0, left: 0, right: 0, zIndex: 61,
              background: 'var(--bg-1)',
              borderTop: '2px solid var(--accent)',
              borderRadius: '16px 16px 0 0',
              maxHeight: '92vh',
              overflowY: 'auto',
              padding: '20px 20px 40px',
            }}
          >
            {/* Alça visual */}
            <div style={{ width: 40, height: 4, background: 'var(--border)', borderRadius: 99, margin: '0 auto 16px' }} />

            {/* Header */}
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16 }}>
              <div id="bs-title" style={{ fontFamily: 'var(--f-display)', fontWeight: 800, fontSize: 18, color: 'var(--text)' }}>
                NOVA REFEIÇÃO
              </div>
              <button
                onClick={onClose}
                style={{ background: 'transparent', border: 'none', cursor: 'pointer', color: 'var(--text-faint)', padding: 4, lineHeight: 0 }}
              >
                <Icon name="x" size={18} />
              </button>
            </div>

            {/* Tipo da refeição */}
            <div className="label-sm" style={{ marginBottom: 8 }}>Tipo</div>
            <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap', marginBottom: 16 }}>
              {MEAL_TYPES.map((type) => (
                <button
                  key={type}
                  onClick={() => setMealType(type)}
                  style={{
                    background: mealType === type ? 'var(--accent)' : 'transparent',
                    border: `1px solid ${mealType === type ? 'var(--accent)' : 'var(--border)'}`,
                    color: mealType === type ? 'var(--accent-fg)' : 'var(--text-dim)',
                    borderRadius: 4, padding: '6px 12px',
                    fontFamily: 'var(--f-mono)', fontSize: 10,
                    letterSpacing: '0.05em', cursor: 'pointer',
                    transition: 'all 0.15s',
                  }}
                >
                  {MEAL_TYPE_LABELS[type]}
                </button>
              ))}
            </div>

            {/* Descrição */}
            <div className="label-sm" style={{ marginBottom: 6 }}>O que você comeu?</div>
            <textarea
              value={description}
              onChange={(e) => { setDescription(e.target.value); setAnalyzed(false) }}
              placeholder="Ex: 2 ovos mexidos, 1 fatia de pão integral, café preto sem açúcar..."
              rows={3}
              style={{
                width: '100%', boxSizing: 'border-box',
                background: 'rgba(255,255,255,0.03)',
                border: '1px solid var(--border)',
                borderRadius: 6, padding: '10px 12px',
                color: 'var(--text)',
                fontFamily: 'var(--f-mono)', fontSize: 12,
                resize: 'vertical', outline: 'none',
                marginBottom: 12,
              }}
              onFocus={(e) => { e.target.style.borderColor = 'var(--accent)' }}
              onBlur={(e) => { e.target.style.borderColor = 'var(--border)' }}
            />

            {/* Botão analisar */}
            <button
              onClick={handleAnalyze}
              disabled={analyzing || !description.trim()}
              className="btn primary"
              style={{ width: '100%', justifyContent: 'center', marginBottom: 12 }}
            >
              {analyzing ? (
                <>
                  <span style={{
                    display: 'inline-block', width: 14, height: 14, borderRadius: '50%',
                    border: '2px solid currentColor', borderTopColor: 'transparent',
                    animation: 'forjaSpin 0.7s linear infinite',
                  }} />
                  Analisando...
                </>
              ) : (
                <><Icon name="flash" size={14} /> ANALISAR COM IA</>
              )}
            </button>

            {/* Erro de análise */}
            {analyzeError && (
              <div style={{
                padding: '8px 12px', marginBottom: 12,
                background: 'rgba(255,61,85,0.06)',
                borderLeft: '2px solid var(--danger)',
                borderRadius: '0 4px 4px 0',
                fontFamily: 'var(--f-mono)', fontSize: 10, color: 'var(--danger)',
              }}>
                ⚠ {analyzeError}
              </div>
            )}

            {/* Resultado editável */}
            <AnimatePresence>
              {analyzed && (
                <motion.div
                  key="result"
                  initial={{ opacity: 0, y: 8 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0 }}
                >
                  {/* Feedback da IA */}
                  {feedback && (
                    <div style={{
                      background: 'rgba(212,255,58,0.04)',
                      border: '1px solid rgba(212,255,58,0.2)',
                      borderRadius: 6, padding: '10px 12px', marginBottom: 12,
                    }}>
                      <div className="label-sm" style={{ color: 'var(--accent)', marginBottom: 4 }}>✦ Análise Gemini</div>
                      <p style={{ margin: 0, fontSize: 12, color: 'var(--text-dim)', fontStyle: 'italic', lineHeight: 1.5 }}>
                        {feedback}
                      </p>
                    </div>
                  )}

                  {/* Campos de macros editáveis */}
                  <div className="label-sm" style={{ marginBottom: 8 }}>Macros estimados — ajuste se necessário</div>
                  <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 8, marginBottom: 16 }}>
                    {[
                      { label: 'Calorias (kcal)', value: calories, set: setCalories },
                      { label: 'Proteína (g)', value: proteinG, set: setProteinG },
                      { label: 'Carboidrato (g)', value: carbsG, set: setCarbsG },
                      { label: 'Gordura (g)', value: fatG, set: setFatG },
                    ].map(({ label, value, set }) => (
                      <div key={label}>
                        <div className="label-sm" style={{ marginBottom: 4 }}>{label}</div>
                        <input
                          type="number"
                          min={0}
                          value={value}
                          onChange={(e) => set(e.target.value)}
                          className="set-input"
                          style={{ width: '100%', textAlign: 'left' }}
                        />
                      </div>
                    ))}
                  </div>

                  {/* Botão salvar */}
                  <button
                    onClick={handleSave}
                    disabled={saving}
                    className="btn primary"
                    style={{ width: '100%', justifyContent: 'center' }}
                  >
                    {saving ? 'Salvando...' : <><Icon name="check" size={14} stroke={2.5} /> SALVAR REFEIÇÃO</>}
                  </button>
                </motion.div>
              )}
            </AnimatePresence>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  )
}
```

- [ ] **Passo 2: Verificar TypeScript**

```bash
npx tsc --noEmit
```

- [ ] **Passo 3: Commit**

```bash
git add src/components/MealBottomSheet.tsx
git commit -m "feat(components): MealBottomSheet — bottom sheet com IA + macros editáveis"
```

---

## Task 9: Página `NutritionPage`

**Files:**
- Create: `src/pages/NutritionPage.tsx`

- [ ] **Passo 1: Criar `src/pages/NutritionPage.tsx`**

```tsx
import { useState, useEffect } from 'react'
import { useSearchParams, Link } from 'react-router-dom'
import { motion } from 'motion/react'
import { useAuth } from '../context/AuthContext'
import {
  getNutritionLogs,
  deactivateNutritionLog,
  computeDailyTotals,
} from '../services/nutrition.service'
import { calculateDailyGoals } from '../lib/nutritionGoals'
import { MealCard } from '../components/MealCard'
import { MealBottomSheet } from '../components/MealBottomSheet'
import { Topbar } from '../components/layout/Topbar'
import { Icon } from '../components/ui/Icon'
import type { NutritionLog, DailyTotals, DailyGoals } from '../types'

// Formata uma data como 'YYYY-MM-DD' no fuso local
function toLocalDateString(date: Date): string {
  const y = date.getFullYear()
  const m = String(date.getMonth() + 1).padStart(2, '0')
  const d = String(date.getDate()).padStart(2, '0')
  return `${y}-${m}-${d}`
}

// Formata 'YYYY-MM-DD' como 'Hoje, 29 mai' ou '27 mai'
function formatDisplayDate(dateStr: string): string {
  const today = toLocalDateString(new Date())
  const date = new Date(dateStr + 'T12:00:00')
  const day = date.getDate()
  const month = date.toLocaleDateString('pt-BR', { month: 'short' }).replace('.', '')
  if (dateStr === today) return `Hoje, ${day} ${month}`
  return `${day} ${month}`
}

// Barra de progresso de macro
function MacroBar({
  label, value, goal, color,
}: {
  label: string
  value: number
  goal?: number
  color: string
}) {
  const pct = goal && goal > 0 ? Math.min((value / goal) * 100, 100) : 0
  return (
    <div style={{ flex: 1, minWidth: 80 }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'baseline', marginBottom: 4 }}>
        <span style={{ fontFamily: 'var(--f-mono)', fontSize: 8, color: 'var(--text-faint)', letterSpacing: '0.1em', textTransform: 'uppercase' }}>
          {label}
        </span>
        <span style={{ fontFamily: 'var(--f-mono)', fontSize: 10, color }}>
          {Math.round(value)}{goal ? `/${goal}g` : 'g'}
        </span>
      </div>
      <div style={{ height: 4, background: 'var(--bg-3)', borderRadius: 99, overflow: 'hidden' }}>
        <div style={{ width: `${pct}%`, height: '100%', background: color, borderRadius: 99, transition: 'width 0.5s ease' }} />
      </div>
    </div>
  )
}

export function NutritionPage() {
  const { profile } = useAuth()
  const [searchParams] = useSearchParams()
  const targetUserId = searchParams.get('userId') ?? profile?.id ?? ''
  const isViewingOther = !!searchParams.get('userId') && searchParams.get('userId') !== profile?.id

  const [selectedDate, setSelectedDate] = useState(() => toLocalDateString(new Date()))
  const [logs, setLogs] = useState<NutritionLog[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [sheetOpen, setSheetOpen] = useState(false)

  const today = toLocalDateString(new Date())
  const isToday = selectedDate === today
  const goals: DailyGoals | null = profile ? calculateDailyGoals(profile) : null
  const totals: DailyTotals = computeDailyTotals(logs)

  // Percentual de calorias para o anel
  const calPct = goals ? Math.min((totals.calories / goals.calories) * 100, 100) : 0
  const calConicGradient = `conic-gradient(var(--accent) ${calPct * 3.6}deg, var(--bg-3) 0deg)`

  useEffect(() => {
    if (!targetUserId) return
    void loadLogs()
  }, [selectedDate, targetUserId])

  async function loadLogs() {
    setLoading(true)
    setError(null)
    try {
      const data = await getNutritionLogs(targetUserId, selectedDate)
      setLogs(data)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Erro ao carregar diário')
    } finally {
      setLoading(false)
    }
  }

  function goToPrevDay() {
    const d = new Date(selectedDate + 'T12:00:00')
    d.setDate(d.getDate() - 1)
    setSelectedDate(toLocalDateString(d))
  }

  function goToNextDay() {
    if (isToday) return
    const d = new Date(selectedDate + 'T12:00:00')
    d.setDate(d.getDate() + 1)
    setSelectedDate(toLocalDateString(d))
  }

  async function handleDelete(logId: string) {
    try {
      await deactivateNutritionLog(logId)
      setLogs((prev) => prev.filter((l) => l.id !== logId))
    } catch {
      setError('Erro ao excluir refeição')
    }
  }

  function handleSaved(log: NutritionLog) {
    setLogs((prev) => [...prev, log].sort((a, b) => a.logged_at.localeCompare(b.logged_at)))
  }

  return (
    <>
      <Topbar eyebrow="SAÚDE" title="NUTRIÇÃO" />

      <div className="content">
        {/* Navegador de dia */}
        <div style={{
          display: 'flex', justifyContent: 'space-between', alignItems: 'center',
          padding: '4px 0', marginBottom: 4,
        }}>
          <button
            onClick={goToPrevDay}
            className="btn ghost"
            style={{ padding: '6px 10px' }}
          >
            <Icon name="arrowL" size={16} />
          </button>
          <span style={{ fontFamily: 'var(--f-display)', fontWeight: 800, fontSize: 16, color: 'var(--text)' }}>
            {formatDisplayDate(selectedDate).toUpperCase()}
          </span>
          <button
            onClick={goToNextDay}
            disabled={isToday}
            className="btn ghost"
            style={{ padding: '6px 10px', opacity: isToday ? 0.3 : 1 }}
          >
            <Icon name="arrow" size={16} />
          </button>
        </div>

        {/* Card resumo */}
        <div className="card">
          <div style={{ display: 'flex', gap: 20, alignItems: 'center', flexWrap: 'wrap' }}>
            {/* Anel de calorias */}
            <div style={{ position: 'relative', flexShrink: 0 }}>
              <div style={{
                width: 88, height: 88, borderRadius: '50%',
                background: calConicGradient,
                display: 'flex', alignItems: 'center', justifyContent: 'center',
              }}>
                <div style={{
                  width: 68, height: 68, borderRadius: '50%',
                  background: 'var(--bg-1)',
                  display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center',
                }}>
                  <span style={{ fontFamily: 'var(--f-display)', fontWeight: 800, fontSize: 18, color: 'var(--accent)', lineHeight: 1 }}>
                    {Math.round(totals.calories)}
                  </span>
                  <span style={{ fontFamily: 'var(--f-mono)', fontSize: 7, color: 'var(--text-faint)', letterSpacing: '0.05em' }}>
                    {goals ? `/${goals.calories}` : ''} kcal
                  </span>
                </div>
              </div>
            </div>

            {/* Barras de macros */}
            <div style={{ flex: 1, display: 'flex', flexDirection: 'column', gap: 8, minWidth: 160 }}>
              <MacroBar label="Prot" value={totals.protein_g} goal={goals?.protein_g} color="var(--accent)" />
              <MacroBar label="Carb" value={totals.carbs_g} goal={goals?.carbs_g} color="#60a5fa" />
              <MacroBar label="Gord" value={totals.fat_g} goal={goals?.fat_g} color="#f97316" />
            </div>
          </div>

          {/* Avisos */}
          {!goals && (
            <div style={{ marginTop: 12, display: 'flex', alignItems: 'center', gap: 6 }}>
              <span style={{ fontFamily: 'var(--f-mono)', fontSize: 10, color: 'var(--text-faint)' }}>
                Complete o perfil para ver suas metas →
              </span>
              <Link to="/perfil" style={{ fontFamily: 'var(--f-mono)', fontSize: 10, color: 'var(--accent)', textDecoration: 'none' }}>
                Perfil
              </Link>
            </div>
          )}
          {goals && (
            <div style={{ marginTop: 10, fontFamily: 'var(--f-mono)', fontSize: 9, color: 'var(--text-faint)', fontStyle: 'italic' }}>
              * Estimativa. Consulte um nutricionista para um plano personalizado.
            </div>
          )}
        </div>

        {/* Estado de loading */}
        {loading && (
          <div className="col gap-2">
            {[1, 2].map((i) => (
              <div key={i} className="skeleton" style={{ height: 80, borderRadius: 8 }} />
            ))}
          </div>
        )}

        {/* Erro */}
        {!loading && error && (
          <div className="card" style={{ borderLeft: '2px solid var(--danger)' }}>
            <span style={{ color: 'var(--danger)' }}>{error}</span>
          </div>
        )}

        {/* Lista de refeições */}
        {!loading && !error && (
          <>
            {logs.length === 0 ? (
              <div className="card" style={{
                textAlign: 'center', padding: '32px 24px',
                borderStyle: 'dashed', color: 'var(--text-faint)',
              }}>
                Nenhuma refeição registrada{isToday ? ' hoje' : ' neste dia'}.
              </div>
            ) : (
              <motion.div
                className="col gap-2"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
              >
                {logs.map((log) => (
                  <MealCard
                    key={log.id}
                    log={log}
                    onDelete={() => handleDelete(log.id)}
                    readOnly={isViewingOther}
                  />
                ))}
              </motion.div>
            )}
          </>
        )}
      </div>

      {/* Botão FAB — só aparece para o próprio aluno no dia de hoje */}
      {!isViewingOther && isToday && (
        <div style={{ position: 'fixed', bottom: 80, right: 20, zIndex: 10 }}>
          <button
            onClick={() => setSheetOpen(true)}
            className="btn primary"
            style={{ borderRadius: 99, padding: '12px 20px', boxShadow: '0 4px 20px rgba(0,0,0,0.4)' }}
          >
            <Icon name="plus" size={16} /> Registrar
          </button>
        </div>
      )}

      {/* Bottom Sheet */}
      <MealBottomSheet
        isOpen={sheetOpen}
        onClose={() => setSheetOpen(false)}
        onSaved={handleSaved}
        userId={targetUserId}
      />
    </>
  )
}
```

- [ ] **Passo 2: Verificar TypeScript**

```bash
npx tsc --noEmit
```

- [ ] **Passo 3: Commit**

```bash
git add src/pages/NutritionPage.tsx
git commit -m "feat(pages): NutritionPage — diário alimentar com anel de calorias"
```

---

## Task 10: Rota, navegação e menu

**Files:**
- Modify: `src/App.tsx`
- Modify: `src/components/layout/Sidebar.tsx`
- Modify: `src/components/layout/MobileTabbar.tsx`

- [ ] **Passo 1: Adicionar import e rota em `src/App.tsx`**

Adicione o import após os outros imports de páginas:
```tsx
import { NutritionPage } from './pages/NutritionPage'
```

Adicione a rota dentro do bloco de rotas do aluno (após `/medidas`):
```tsx
<Route path="/nutricao" element={<NutritionPage />} />
```

- [ ] **Passo 2: Adicionar link na função `alunoLinks()` em `src/components/layout/Sidebar.tsx`**

Substitua a função `alunoLinks()`:
```typescript
function alunoLinks(): NavLink[] {
  return [
    { to: '/dashboard', label: 'Hoje', icon: 'home' },
    { to: '/workouts', label: 'Treino', icon: 'flame', matches: (p) => p.startsWith('/workouts') },
    { to: '/historico', label: 'Histórico', icon: 'history', matches: (p) => p.startsWith('/historico') },
    { to: '/progresso', label: 'Progresso', icon: 'chart' },
    { to: '/medidas', label: 'Medidas', icon: 'scale' },
    { to: '/nutricao', label: 'Nutrição', icon: 'flash', matches: (p) => p.startsWith('/nutricao') },
  ]
}
```

- [ ] **Passo 3: Adicionar tab em `ALUNO_TABS` no `MobileTabbar.tsx`**

A tabbar mobile tem espaço limitado — substitua "Medidas" por "Nutrição" para manter 5 tabs, já que Medidas é acessível pela Sidebar:

```typescript
const ALUNO_TABS: Tab[] = [
  { to: '/dashboard', label: 'Hoje', icon: 'home' },
  { to: '/workouts', label: 'Treino', icon: 'flame', matches: (p) => p.startsWith('/workouts') },
  { to: '/historico', label: 'Histórico', icon: 'history', matches: (p) => p.startsWith('/historico') },
  { to: '/nutricao', label: 'Nutrição', icon: 'flash', matches: (p) => p.startsWith('/nutricao') },
  { to: '/perfil', label: 'Perfil', icon: 'user' },
]
```

- [ ] **Passo 4: Verificar TypeScript**

```bash
npx tsc --noEmit
```

- [ ] **Passo 5: Commit**

```bash
git add src/App.tsx src/components/layout/Sidebar.tsx src/components/layout/MobileTabbar.tsx
git commit -m "feat(nav): adiciona rota /nutricao e entrada no menu"
```

---

## Task 11: Atualizar `Plan.md` e verificação final

**Files:**
- Modify: `Plan.md`

- [ ] **Passo 1: Marcar Fase 8 como completa no `Plan.md`**

No `Plan.md`, altere a tabela de status:
```markdown
| 8 | Nutrição + IA (Gemini) | ✅ Completa |
```

E adicione uma seção `### FASE 8 — Nutrição + IA ✅` com o resumo do que foi entregue (seguindo o padrão das fases anteriores).

- [ ] **Passo 2: Build de produção para verificar zero erros**

```bash
npm run build
```

Resultado esperado: `built in X.XXs` sem erros de TypeScript ou bundler.

- [ ] **Passo 3: Commit final**

```bash
git add Plan.md
git commit -m "docs: marca Fase 8 como completa no Plan.md"
git push
```

---

## Checklist de critérios (verificar manualmente após implementar)

- [ ] Aluno registra uma refeição e recebe estimativa de macros + feedback da IA
- [ ] Aluno pode editar os macros antes de salvar
- [ ] Totais do dia somam corretamente no card de resumo
- [ ] Metas automáticas aparecem quando perfil tem peso + altura + nascimento + gênero
- [ ] Quando perfil incompleto, aparece link "Complete seu perfil"
- [ ] Navegação entre dias funciona (seta direita bloqueada no dia atual)
- [ ] Soft delete funciona (excluir refeição some da lista)
- [ ] Bottom sheet fecha com ESC e clique no overlay
- [ ] Trainer consegue acessar `/nutricao?userId=ALUNO_ID` e ver o diário (somente leitura — sem botão registrar)
- [ ] Build sem erros TypeScript (`npx tsc --noEmit`)
- [ ] Edge Function `analyze-meal` deployada no Supabase com `GEMINI_API_KEY` configurada
