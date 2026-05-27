# Plano de implementação — Melhorias pré-Fase 8

> Plano tático correspondente ao spec `2026-05-26-melhorias-pre-fase-8-design.md`.
> Lista de passos concretos em ordem de execução. Cada passo é um commit independente.

## Resumo do que vai mudar

- **3 commits** previstos (1 por fase do escopo)
- **Arquivos novos:** 0
- **Arquivos modificados:** ~10
- **Dependências:** remover `lucide-react` ao final, se ninguém mais usar
- **Schema:** zero mudanças

---

## Fase 1 — Métricas + Dashboard *(~1.5h)*

### Passo 1.1 — Adicionar 4 funções em `src/services/history.service.ts`

Cada função segue o padrão das existentes: busca via Supabase + agregação em JS + retorno tipado.

**Ordem de implementação:**

1. **`getCurrentStreak(userId)`** → `{ current: number; longest: number }`
   - Query: `workout_logs` finalizados, ordem desc por `started_at`
   - Agrega em `Set<string>` de chaves `YYYY-MM-DD` (timezone do navegador)
   - Para `current`: itera de hoje pra trás, conta consecutivos até quebra
   - Para `longest`: percorre todas as chaves ordenadas, calcula maior corrida

2. **`getPersonalRecordsThisMonth(userId)`** → `number`
   - Calcula `monthStart` (dia 1 do mês corrente, 00:00 local) e `monthEnd` (próximo dia 1 menos 1ms)
   - Query: `workout_logs` finalizados do usuário (só id + started_at)
   - Para cada log, busca seus `exercise_logs` com `load_kg IS NOT NULL`
   - Agrupa em JS: `maxBefore[exerciseId]` e `maxThisMonth[exerciseId]`
   - Conta exercícios com `maxThisMonth > (maxBefore ?? 0)`

3. **`getVolumeLastWeek(userId)`** → `{ thisWeek: number; lastWeek: number }`
   - `thisWeekStart` = segunda-feira da semana atual 00:00
   - `lastWeekStart` = segunda-feira da semana anterior
   - `lastWeekEnd` = `thisWeekStart - 1ms`
   - Query: `exercise_logs` joinados com `workout_logs` do usuário com `finished_at IS NOT NULL`
   - Filtra por janela; ignora `load_kg = null`
   - Soma `reps_completed × load_kg`

4. **`getAverageSessionDuration(userId)`** → `number | null`
   - Query: últimas 10 sessões com `duration_minutes IS NOT NULL`
   - Retorna média (arredondada) ou `null` se `< 3`

**Critério de pronto:** TypeScript compila. As 4 funções têm assinatura conforme spec.

### Passo 1.2 — Atualizar `src/pages/DashboardPage.tsx`

1. Importar as 4 funções novas.
2. Adicionar 4 estados: `streak`, `prsThisMonth`, `volumeWeek`, `avgDuration` — todos com valor inicial que faça sentido em loading.
3. No `useEffect` de boot, adicionar `Promise.all` paralelo (5 promises totais junto com as existentes).
4. **Trocar o card "Treinos"** pelo card de Streak:
   - Título: "STREAK"
   - Valor grande: `${streak.current} dias`
   - Subtítulo: `máx: ${streak.longest}`
   - Cor accent quando `current >= 7`, text-dim quando `0`
   - Remover as mini-bars decorativas
5. **Trocar o card "Peso atual"** do sub-grid pelo card "VOLUME SEM":
   - Valor grande: `(volumeWeek.thisWeek / 1000).toFixed(1)` + `t` se >= 1000kg, senão `${volumeWeek.thisWeek}` + `kg`
   - Delta colorido: se `lastWeek > 0`, calcular `((thisWeek - lastWeek) / lastWeek) * 100`. Verde se positivo (e nonzero), vermelho se negativo
   - Quando `lastWeek === 0`: omitir o delta
6. **Atualizar card "PRs no mês":**
   - Valor: `prsThisMonth` (número direto)
   - Cor accent quando `> 0`
   - Subtítulo: remover "em breve" → "este mês" ou similar
7. **Adicionar tempo médio no hero card** (no rodapé das 3 metricas):
   - Se `avgDuration !== null`, adicionar `· ~${avgDuration}min` ao texto que mostra exercícios e séries totais
8. **Adicionar atalho "Peso & Medidas" no card "ATALHOS"** se ainda não estiver lá *(já está)*.

**Critério de pronto:** abrir Dashboard como aluno mostra os 3 cards com dados reais. Como admin a tela continua igual (admin não vê esses cards).

### Passo 1.3 — Commit

```
feat(forja): metricas reais no Dashboard (streak, PRs, volume, tempo medio)
```

---

## Fase 2 — Migração de ícones *(~45min)*

### Passo 2.1 — Adicionar ícone `hash` em `src/components/ui/Icon.tsx`

Adicionar na tipagem `IconName`:
```ts
| 'hash'
```

Adicionar no objeto `PATHS`:
```tsx
hash: <path d="M9 4l-2 16M17 4l-2 16M4 9h16M3 15h16" />,
```

(Sufuxo `#` estilizado com inclinação típica.)

### Passo 2.2 — Migrar `src/components/WorkoutFinishModal.tsx`

- Remover import `Clock, Dumbbell, Hash` do `lucide-react`.
- Adicionar `import { Icon } from './ui/Icon'`.
- Substituir `<Clock size={n} />` → `<Icon name="timer" size={n} />`.
- Substituir `<Dumbbell size={n} />` → `<Icon name="dumbbell" size={n} />`.
- Substituir `<Hash size={n} />` → `<Icon name="hash" size={n} />`.

### Passo 2.3 — Migrar `src/components/AssignWorkoutModal.tsx`

- Remover `X, Search, Check` do `lucide-react`.
- Adicionar import do `Icon`.
- Substituir cada uso pelo `<Icon name="x|search|check">`.

### Passo 2.4 — Migrar `src/components/ExerciseSelector.tsx`

- Remover `X, Search, Plus, ChevronLeft, Loader2` do `lucide-react`.
- Substituir `X, Search, Plus` por seus equivalentes.
- Substituir `ChevronLeft` por `<Icon name="arrowL">`.
- Substituir `Loader2` (com `animate-spin`) por:
  ```tsx
  <span
    style={{
      display: 'inline-block',
      width: 14, height: 14,
      borderRadius: '50%',
      border: '2px solid currentColor',
      borderTopColor: 'transparent',
      animation: 'forjaSpin 0.7s linear infinite',
    }}
  />
  ```
  (mesmo padrão usado em "Salvando..." nos botões dos forms).

### Passo 2.5 — Limpar dependência

1. `grep -r "lucide-react" src/` — confirmar zero matches.
2. Se zero: `npm uninstall lucide-react`.
3. Se ainda houver: deixar a dependência e anotar arquivos restantes.

### Passo 2.6 — Commit

```
feat(forja): migra modais para Icon FORJA + remove lucide-react
```

---

## Fase 3 — Acessibilidade *(~2-3h)*

### Passo 3.1 — Hook reutilizável `useModalA11y`

Em `src/hooks/useModalA11y.ts` (novo arquivo):

```ts
import { useEffect, useRef } from 'react'

export function useModalA11y(isOpen: boolean, onClose: () => void) {
  const previouslyFocused = useRef<HTMLElement | null>(null)
  const initialFocusRef = useRef<HTMLElement | null>(null)

  useEffect(() => {
    if (!isOpen) return

    previouslyFocused.current = document.activeElement as HTMLElement
    initialFocusRef.current?.focus()

    function handleKey(e: KeyboardEvent) {
      if (e.key === 'Escape') onClose()
    }
    window.addEventListener('keydown', handleKey)

    return () => {
      window.removeEventListener('keydown', handleKey)
      previouslyFocused.current?.focus()
    }
  }, [isOpen, onClose])

  return { initialFocusRef }
}
```

### Passo 3.2 — Aplicar nos 5 modais

Para cada um (`WorkoutFinishModal`, `AssignWorkoutModal`, `ExerciseSelector`, `WeightEntryModal`, `MeasurementEntryModal`):

1. Importar `useModalA11y` e usar: `const { initialFocusRef } = useModalA11y(isOpen, onClose)`.
2. No container do modal, adicionar:
   ```tsx
   role="dialog"
   aria-modal="true"
   aria-labelledby="<id-do-titulo>"
   ```
3. Adicionar `id` correspondente no `<h2>` do modal.
4. Adicionar `ref={initialFocusRef}` no primeiro input ou no botão de fechar.

**Para o modal de exit do `WorkoutSessionPage`** (que é inline, não componente próprio): aplicar a mesma lógica diretamente com `useRef`.

### Passo 3.3 — Adicionar `aria-label` aos botões icon-only

Auditoria dos seguintes botões e adicionar `aria-label`:

- `WorkoutSessionPage.tsx`:
  - Botão pausar/encerrar (já tem text "Pausar"/"Encerrar"? Confirmar — se só ícone, label "Pausar treino").
  - Botão LAYOUT A/B → `aria-label="Trocar para layout B"` / `"Trocar para layout A"`.
  - Botão Sair → `aria-label="Sair do treino"`.
- `WorkoutCard.tsx` ações admin:
  - Edit → `aria-label="Editar ficha"`.
  - Assign → `aria-label="Atribuir a aluno"`.
  - Delete → `aria-label="Excluir ficha"`.
- `Sidebar.tsx`: botão Sair já tem texto, ok.
- `DashboardPage`: botão "Iniciar treino" já tem texto, ok.

### Passo 3.4 — Focus visible global

Em `src/index.css`, adicionar no final do arquivo:

```css
/* ══════════════════════════════════════════════════════════════════
   Acessibilidade — focus visible
   ══════════════════════════════════════════════════════════════════ */

:focus-visible {
  outline: 2px solid var(--accent);
  outline-offset: 2px;
  border-radius: 4px;
}

/* Sem outline para foco causado por mouse */
:focus:not(:focus-visible) {
  outline: none;
}
```

### Passo 3.5 — Skip link

Em `src/components/layout/AppShell.tsx`, antes do `<Sidebar />`:

```tsx
<a href="#main-content" className="forja-skip-link">
  Pular para o conteúdo principal
</a>
```

Adicionar `id="main-content"` no `<div className="main">`.

Em `src/index.css`, adicionar:

```css
.forja-skip-link {
  position: absolute;
  top: -100px;
  left: 12px;
  background: var(--accent);
  color: var(--accent-fg);
  padding: 12px 18px;
  z-index: 100;
  text-decoration: none;
  font-weight: 600;
  border-radius: 8px;
  transition: top 0.2s;
}
.forja-skip-link:focus {
  top: 12px;
}
```

### Passo 3.6 — Verificação manual

1. Abrir o app no navegador.
2. Pressionar Tab repetidamente — confirmar outline lime visível.
3. Tab no Dashboard → primeiro elemento focado deve ser o skip link (aparece no canto top-left).
4. Abrir um modal qualquer → foco vai pro primeiro input/botão.
5. Pressionar Esc → modal fecha; foco volta pro botão que abriu.

### Passo 3.7 — Commit

```
feat(a11y): role=dialog, focus visible, skip link, Esc fecha modais
```

---

## Fase 4 — Cleanup final e push *(~10min)*

### Passo 4.1 — Verificação final

1. `npx tsc --noEmit` — TypeScript limpo.
2. `npm run build` — build limpo.
3. `npx vite` → testar manualmente: Dashboard, abrir/fechar 1 modal, navegação por Tab.

### Passo 4.2 — Push

```
git push origin main
```

---

## Critérios de aceitação consolidados

- [ ] Dashboard mostra: Streak real (current/max), PRs do mês real, Volume da semana com delta, tempo médio no hero.
- [ ] `grep -r "lucide-react" src/` → zero matches.
- [ ] `npm ls lucide-react` → not found.
- [ ] Tab no app mostra outline lime visivel em todos os elementos clicáveis.
- [ ] Esc fecha qualquer modal aberto.
- [ ] Tab inicial mostra skip link.
- [ ] Build TypeScript limpo.
- [ ] Todos os 3 commits feitos com mensagens descritivas.

## Risco e mitigação

| Risco | Mitigação |
|---|---|
| Cálculo de streak quebra em fuso horário diferente | Aceita o trade-off, documentado em "casos de borda" do spec |
| Volume da semana = 0 mas semana ainda em curso (segunda-feira de manhã) | Mostra `0t` sem delta — comportamento correto, é só early in the week |
| PR detection pesado se usuário tem 1000+ sessões | Para usuário com muita sessão, a query traz todos os logs mas o agrupamento em JS continua O(n). Aceita por enquanto; otimização via materialized view fica para futuro |
| Loader2 spinner inline ficar com tamanho/cor errados | Reusar exatamente o mesmo bloco já usado em outros lugares; testar visualmente |
| Modal `useModalA11y` interferir em modais aninhados (se houver) | Não há modais aninhados no projeto atual. Se aparecer, adicionar stack de handlers |

