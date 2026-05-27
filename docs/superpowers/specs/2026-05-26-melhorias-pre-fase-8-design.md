# Melhorias pré-Fase 8 — Design

> Data: 2026-05-26
> Status: aguardando revisão do usuário

## Contexto

Após concluir as fases 1–7 (foundation, banco, auth, perfil, fichas, execução, histórico) e o redesign visual completo FORJA, há um conjunto de melhorias de pequeno-médio porte que vale a pena fazer antes de partir para a Fase 8 (Nutrição + IA com Gemini).

Essas melhorias têm três objetivos:

1. **Substituir placeholders** do dashboard por dados reais agregados do histórico.
2. **Fechar o redesign FORJA** migrando os 3 últimos componentes que ainda usam `lucide-react`.
3. **Adicionar acessibilidade básica** ao critical path (login, treino, modais).

Não envolve mudanças no schema do banco — todos os cálculos novos são feitos client-side a partir de `workout_logs` e `exercise_logs` que já existem.

## Objetivos

- Dashboard mostra métricas reais (streak, PRs do mês, volume da semana, tempo médio) ao invés de `—`/"em breve".
- Coerência visual: todos os ícones vêm do `<Icon>` do design system FORJA.
- Modais e botões com `role`, `aria-label` e foco visível para uso com teclado/leitor de tela.

## Fora de escopo

- Mudanças de schema no Supabase.
- Auditoria WCAG completa (apenas o básico do critical path).
- Anúncios `aria-live` ao concluir séries (fica para uma iteração futura).
- Testes com leitor de tela real.
- Code-split de rotas (build não está crítico).
- Qualquer feature nova de produto — só polish do que já existe.

---

## Decisões de design

### Definição de PR (Personal Record)

**Decisão:** PR é a **maior carga absoluta** já levantada em um exercício, em qualquer número de repetições.

- 1 PR no mês = 1 exercício em que a maior carga registrada durante o mês supera a maior carga de antes do mês.
- Não considera 1RM estimado (fórmula Epley) nem PRs por faixa de reps — simples e intuitivo.
- Quando o usuário troca de exercício, cada exercício mantém seu próprio histórico de PR.

### Regra do streak

**Decisão:** Streak = quantos dias consecutivos com pelo menos 1 sessão finalizada (`finished_at IS NOT NULL`).

- Granularidade: dia (não hora). Uma sessão por dia conta como 1.
- Quebra: qualquer dia sem treino quebra o streak. Não há "dias de descanso programados" — se você descansa, o streak zera.
- Retorna `current` (atual) e `longest` (maior histórico).

### Onde mostrar no Dashboard

A coluna direita do hero passa de:

```
┌─────────────────────────┐
│ Treinos: 12             │  ← card com mini-bars decorativos (sem dado real)
├──────────┬──────────────┤
│ Peso     │ PRs no mês   │
│ 82.4 kg  │ — (em breve) │
└──────────┴──────────────┘
```

Para:

```
┌─────────────────────────┐
│ STREAK · 17 dias        │
│ atual / max: 17 / 42    │
├──────────┬──────────────┤
│ PRs MÊS  │ VOLUME SEM   │
│ 06       │ 8,4t  ↗ +12% │
└──────────┴──────────────┘
```

- "Peso atual" migra para o card **Atalhos** no rodapé do dashboard (já tem ícone scale lá).
- Tempo médio de sessão entra como sufixo discreto no hero card do treino do dia: `07 EXERCÍCIOS · 24 SÉRIES · ~58min`.

---

## Arquitetura

### Camada de dados — `src/services/history.service.ts`

Quatro funções novas, todas seguindo o padrão das existentes (`getLoadProgression`, `getWeeklyFrequency`):

```ts
// 1. Streak — dias consecutivos com sessão
export async function getCurrentStreak(
  userId: string
): Promise<{ current: number; longest: number }>

// 2. PRs do mês — exercícios que bateram recorde no mês corrente
export async function getPersonalRecordsThisMonth(
  userId: string
): Promise<number>

// 3. Volume da semana (atual + anterior para delta)
export async function getVolumeLastWeek(
  userId: string
): Promise<{ thisWeek: number; lastWeek: number }>

// 4. Tempo médio das últimas 10 sessões
export async function getAverageSessionDuration(
  userId: string
): Promise<number | null>  // null se < 3 sessões
```

**Algoritmos (cliente, em JS):**

- `getCurrentStreak`: busca todos `workout_logs` finalizados ordenados desc. Converte cada `started_at` para chave `YYYY-MM-DD`. Itera de hoje pra trás contando dias consecutivos no `Set` de chaves; idem para `longest` percorrendo a sequência inteira.
- `getPersonalRecordsThisMonth`:
  1. Define janela de tempo: início e fim do mês corrente (timezone do navegador).
  2. Busca `workout_logs` finalizados do usuário, dividindo em "do mês" e "antes do mês".
  3. Para cada `exercise_id`, calcula `max(load_kg)` antes e dentro do mês.
  4. Conta exercícios em que o max do mês > max anterior.
- `getVolumeLastWeek`: calcula início da semana atual (segunda 00:00) e da semana anterior. Soma `reps_completed × load_kg` (ignora `load_kg = null` — peso corporal não conta volume em kg). Retorna ambas.
- `getAverageSessionDuration`: busca últimas 10 sessões finalizadas com `duration_minutes IS NOT NULL`, retorna média. `null` se < 3.

### Camada de UI — `src/pages/DashboardPage.tsx`

- Carrega as 4 novas métricas em paralelo no `useEffect` existente.
- Substitui o card "Treinos" (mini-bars decorativos) pelo novo card de Streak.
- Substitui o card "Peso atual" no sub-grid pelo card "Volume semana" (com delta colorido).
- Substitui o placeholder "—" do card "PRs no mês" pelo valor real.
- Adiciona o tempo médio como sufixo no hero card.
- Move o atalho de "Peso & Medidas" pro footer (atalhos), que já existia.

### Migração de ícones — 3 arquivos

| Arquivo | Imports lucide-react atuais | Substituição |
|---|---|---|
| `WorkoutFinishModal.tsx` | `Clock, Dumbbell, Hash` | `<Icon name="timer">`, `<Icon name="dumbbell">`, `<Icon name="hash">` (novo) |
| `AssignWorkoutModal.tsx` | `X, Search, Check` | `<Icon name="x">`, `<Icon name="search">`, `<Icon name="check">` |
| `ExerciseSelector.tsx` | `X, Search, Plus, ChevronLeft, Loader2` | `<Icon name="x">`, `<Icon name="search">`, `<Icon name="plus">`, `<Icon name="arrowL">`, spinner CSS inline (mesmo padrão usado em "Salvando..." nos forms) |

**1 ícone novo** em `src/components/ui/Icon.tsx`:

```ts
hash: <path d="M9 4l-2 16M17 4l-2 16M4 9h16M3 15h16" />
```

Símbolo `#` estilizado em 4 traços (2 verticais inclinados + 2 horizontais).

**Pós-migração:** remover `lucide-react` do `package.json` se nenhum outro arquivo usar (rodar `grep -r "lucide-react" src/` antes para confirmar).

### Acessibilidade

#### 1. Modais

Os 5 modais ativos (`WorkoutFinishModal`, `AssignWorkoutModal`, `ExerciseSelector`, `WeightEntryModal`, `MeasurementEntryModal`) recebem:

- `role="dialog"` + `aria-modal="true"` no container do conteúdo.
- `aria-labelledby` apontando para o `id` do h2 do título.
- Handler de `Escape` no `useEffect` do modal que chama `onClose`.
- `useRef` no primeiro elemento focável; ao abrir, `.focus()` é chamado.
- O componente que abre o modal guarda `document.activeElement` antes de abrir; ao fechar, restaura o foco via `previousActiveElement.current?.focus()`.

#### 2. Botões icon-only com `aria-label`

Auditoria visual identifica botões que só têm SVG sem texto. Cada um recebe `aria-label` descritivo:

- Topbar de `WorkoutSessionPage`: "Pausar treino", "Encerrar treino", "Sair do treino", "Trocar layout para B/A".
- Ações do `WorkoutCard` (admin): "Editar ficha", "Atribuir a aluno", "Excluir ficha".
- Botões de tema do `ThemeSwitcher` — já têm `aria-label`, confirma.

#### 3. Focus visible global

Em `src/index.css`, adicionar no fim:

```css
:focus-visible {
  outline: 2px solid var(--accent);
  outline-offset: 2px;
  border-radius: 4px;
}

/* Remove o outline default em foco por mouse */
:focus:not(:focus-visible) {
  outline: none;
}
```

#### 4. Skip link

No `AppShell.tsx`, antes da sidebar:

```tsx
<a href="#main-content" className="forja-skip-link">
  Pular para o conteúdo principal
</a>
```

Com CSS que esconde visualmente (clip-path), mas mostra ao receber foco:

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

E `id="main-content"` no `.main` da `AppShell`.

---

## Casos de borda

- **Usuário novo sem nenhum treino:** todas as funções retornam zero/null. Dashboard mostra `0` em streak, `—` em PRs, `0t` em volume, e omite o tempo médio do hero.
- **PR em exercício que nunca foi feito antes do mês:** a primeira vez que o usuário registra um exercício, a `max(load_kg) antes do mês` é `null`. Considera como `0` → toda primeira aparição do exercício no mês conta como PR. Comportamento desejado (incentiva variedade).
- **Volume sem carga:** séries com `load_kg = null` (peso corporal) não somam volume em kg. São contadas como séries, mas não entram no cálculo de volume.
- **Streak entre fusos horários:** usa timezone do navegador (`new Date()`). Aceitável — alunos viajando em fuso diferente vão ver o streak "correto" no fuso do dispositivo.
- **Esc fecha modal em formulário com mudanças:** sem confirmação. Aceitável nesse escopo — adicionar "Tem certeza?" pra modais com forms fica como melhoria futura.

## Critérios de sucesso

- Dashboard mostra valores reais nos 3 cards (Streak, PRs, Volume) sem nenhum placeholder.
- `grep -r "lucide-react" src/` retorna zero matches após a migração.
- Build sem erros TS.
- Tab pelos elementos do dashboard mostra outline lime claramente.
- Esc fecha qualquer modal aberto.
- Leitor de tela (NVDA/VoiceOver no caminho feliz) anuncia título dos modais ao abrir.

---

## Plano de execução em fases

Não é estritamente necessário, mas se a implementação for fragmentada em commits:

1. **Métricas + Dashboard** (#1+#2 da auditoria) — adiciona funções em `history.service.ts`, atualiza `DashboardPage`.
2. **Migração de ícones** (#3) — 3 arquivos + adiciona ícone `hash`.
3. **Acessibilidade** (#4) — modais, aria-labels, focus visible, skip link.

Cada fase pode ser um commit separado.
