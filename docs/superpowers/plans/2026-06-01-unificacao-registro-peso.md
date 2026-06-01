# Unificação do Registro de Peso — Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Tornar `/medidas` a única fonte de registro de peso, sincronizando automaticamente `profiles.weight` toda vez que um peso é salvo, e transformar o campo de peso no perfil em somente-leitura.

**Architecture:** Duas mudanças independentes: (1) `MeasurementsPage` chama `updateProfile` + `refreshProfile` após salvar um peso em `user_weights`; (2) `ProfilePage` substitui o campo editável de peso por um display estático com link para `/medidas`. Sem alterações no banco, sem novos componentes.

**Tech Stack:** React 19 + TypeScript, React Hook Form + Zod, Supabase.

---

## Mapa de arquivos

| Arquivo | Mudança |
|---------|---------|
| `src/pages/MeasurementsPage.tsx` | `onSaved` do WeightEntryModal passa a sincronizar `profiles.weight` |
| `src/pages/ProfilePage.tsx` | Campo peso: editável → somente-leitura + link para `/medidas`; removido do schema e do submit |

---

## Task 1: Sincronizar `profiles.weight` ao registrar peso em Medidas

**Files:**
- Modify: `src/pages/MeasurementsPage.tsx`

- [ ] **Passo 1: Adicionar imports necessários**

No topo do arquivo, adicione `updateProfile` ao import do serviço de perfil e `refreshProfile` à desestruturação do `useAuth`:

```tsx
// Linha 4 — adicionar refreshProfile:
const { profile, refreshProfile } = useAuth()

// Após a linha de import de measurements.service, adicionar:
import { updateProfile } from '../services/profile.service'
```

Resultado: linha 4 passa de:
```tsx
const { profile } = useAuth()
```
para:
```tsx
const { profile, refreshProfile } = useAuth()
```

E adicionar antes do import de `WeightChart`:
```tsx
import { updateProfile } from '../services/profile.service'
```

- [ ] **Passo 2: Atualizar o callback `onSaved` do `WeightEntryModal`**

Localize o bloco do `WeightEntryModal` (linhas 336–342):

```tsx
<WeightEntryModal
  isOpen={showWeightModal}
  lastWeight={lastWeight ? Number(lastWeight.weight_kg) : undefined}
  onClose={() => setShowWeightModal(false)}
  onSaved={(w) => setWeights((prev) => [w, ...prev])}
  onSave={(kg, at) => addUserWeight(profile!.id, kg, at)}
/>
```

Substitua por:

```tsx
<WeightEntryModal
  isOpen={showWeightModal}
  lastWeight={lastWeight ? Number(lastWeight.weight_kg) : undefined}
  onClose={() => setShowWeightModal(false)}
  onSaved={(w) => {
    setWeights((prev) => [w, ...prev])
    // Sincroniza profiles.weight para que metas de nutrição (Harris-Benedict)
    // usem sempre o peso mais recente registrado em /medidas
    void updateProfile(profile!.id, { weight: Number(w.weight_kg) })
      .then(() => refreshProfile())
  }}
  onSave={(kg, at) => addUserWeight(profile!.id, kg, at)}
/>
```

- [ ] **Passo 3: Verificar TypeScript**

```bash
npx tsc --noEmit
```

Saída esperada: nenhuma (zero erros).

- [ ] **Passo 4: Commit**

```bash
git add src/pages/MeasurementsPage.tsx
git commit -m "feat(medidas): sincroniza profiles.weight ao registrar peso"
```

---

## Task 2: Campo peso no Perfil → somente-leitura

**Files:**
- Modify: `src/pages/ProfilePage.tsx`

- [ ] **Passo 1: Remover `weight` do schema Zod**

Localize em `profileSchema` (em torno da linha 34):

```tsx
  weight: z.preprocess(toOptionalNumber, z.number().positive('Peso inválido').optional()),
```

Remova essa linha inteira. O campo `weight` não faz mais parte do formulário.

- [ ] **Passo 2: Remover `weight` dos `defaultValues`**

Localize no `useForm` (em torno da linha 123):

```tsx
      weight: profile?.weight ?? ('' as unknown as number),
```

Remova essa linha inteira.

- [ ] **Passo 3: Remover `weight` do objeto `cleaned` no `onSubmit`**

Localize dentro de `onSubmit` (em torno da linha 139):

```tsx
      const cleaned = {
        full_name: data.full_name,
        weight: data.weight,
        height: data.height,
```

Substitua por:

```tsx
      const cleaned = {
        full_name: data.full_name,
        height: data.height,
```

(remove apenas a linha `weight: data.weight,`.)

- [ ] **Passo 4: Substituir o campo editável pelo display somente-leitura**

Localize o bloco do campo peso (em torno das linhas 346–354):

```tsx
            <Field label="Peso atual (kg)" error={errors.weight?.message}>
              <input
                className="input"
                type="number"
                step={0.1}
                placeholder="Ex: 82.5"
                {...register('weight')}
              />
            </Field>
```

Substitua por:

```tsx
            <div>
              <div className="label-sm" style={{ marginBottom: 6 }}>Peso atual (kg)</div>
              <div style={{ display: 'flex', alignItems: 'center', gap: 12, flexWrap: 'wrap' }}>
                <span style={{ fontFamily: 'var(--f-mono)', fontSize: 20, color: 'var(--accent)', fontWeight: 700 }}>
                  {profile?.weight ? `${profile.weight} kg` : '—'}
                </span>
                <Link
                  to="/medidas"
                  style={{
                    fontFamily: 'var(--f-mono)',
                    fontSize: 10,
                    color: 'var(--text-faint)',
                    textDecoration: 'none',
                    letterSpacing: '0.1em',
                    textTransform: 'uppercase',
                    border: '1px solid var(--border)',
                    borderRadius: 'var(--r-1)',
                    padding: '3px 8px',
                  }}
                >
                  Registrar em Medidas →
                </Link>
              </div>
            </div>
```

> `Link` já está importado no topo do arquivo (linha 6). Não é necessário adicionar novo import.

- [ ] **Passo 5: Verificar TypeScript**

```bash
npx tsc --noEmit
```

Saída esperada: nenhuma (zero erros).

- [ ] **Passo 6: Commit**

```bash
git add src/pages/ProfilePage.tsx
git commit -m "fix(perfil): campo peso vira somente-leitura com link para /medidas"
```

---

## Task 3: Verificação final e push

- [ ] **Passo 1: Build de produção**

```bash
npm run build
```

Resultado esperado: `✓ built in X.XXs` sem erros de TypeScript ou bundler.

- [ ] **Passo 2: Teste manual rápido**

1. Abra `/medidas` → clique em "Registrar Peso" → informe um valor (ex: 83 kg) → salve.
2. Abra `/perfil` → verifique que "Peso atual" mostra **83 kg** (sincronizou automaticamente).
3. Confirme que não há campo editável de peso no formulário do perfil.
4. Clique em "Registrar em Medidas →" → deve navegar para `/medidas`.

- [ ] **Passo 3: Push**

```bash
git push
```
