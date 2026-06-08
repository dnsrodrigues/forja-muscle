# Design — Redesign Mobile FORJA

**Data:** 08 de junho de 2026  
**Status:** ✅ Aprovado (3 seções)  
**Escopo:** Implementar o design handoff mobile exclusivamente para `≤ 768px`. Desktop intacto.  
**Referência:** `C:\Users\Denis\Desktop\Forja Mobile\Forja\design_handoff_forja_mobile`

---

## Contexto

O app já tem o Design System FORJA v4 (mesmas fontes, mesmas variáveis CSS, mesmos tokens). O handoff mobile usa os mesmos tokens — por isso não há conflito visual. O que muda é a **estrutura de navegação e os layouts** no mobile.

---

## Seção 1 — Shell mobile (tabbar + FAB + header)

### Nova MobileTabbar

Substitui completamente o componente atual. Grade de 5 colunas:

```
| Hoje | Semana | [▶ FAB] | Exercícios | Perfil |
  1fr    1fr      84px       1fr          1fr
```

**FAB central:**
- Círculo de 64px, `background: var(--accent)`, ícone play em `var(--accent-fg)`
- `margin-top: -28px` — sobe acima da barra
- Borda de 4px na cor `var(--bg-0)` para criar o recorte visual
- Sombra: `0 8px 24px -6px rgba(212,255,58,0.5)`
- Ação: localizar o treino de hoje entre as fichas do aluno e navegar para `/workouts/:id/session`. Se não houver treino hoje → navega para `/semana`

**CSS do tabbar (acrescentar em `src/index.css`):**
```css
@media (max-width: 768px) {
  .mob-tabbar {
    grid-template-columns: 1fr 1fr 84px 1fr 1fr;
    padding: 10px 8px 26px;
    background: #0a0b0c;
  }
  .mob-tab-fab {
    position: relative;
    justify-self: center;
    width: 64px; height: 64px;
    margin-top: -28px;
    border-radius: 50%;
    background: var(--accent);
    color: var(--accent-fg);
    display: flex; align-items: center; justify-content: center;
    border: 4px solid var(--bg-0);
    box-shadow: 0 8px 24px -6px rgba(212,255,58,0.5);
  }
}
```

### Rotas novas (mobile-only)

| Rota | Componente | Acesso |
|------|-----------|--------|
| `/semana` | `SemanaPage` | aluno logado |
| `/exercicios` | `ExerciciosPage` | aluno logado |

Ambas visíveis somente pela tabbar mobile. No desktop não aparecem na sidebar.

### `navigation.ts` — destinos mobile

```ts
const ALUNO_MOBILE: NavDest[] = [
  { to: '/dashboard',   label: 'Hoje',       icon: 'home',     primary: true },
  { to: '/semana',      label: 'Semana',     icon: 'calendar', primary: true },
  // FAB central — tratado separadamente no componente
  { to: '/exercicios',  label: 'Exercícios', icon: 'dumbbell', primary: true },
  { to: '/perfil',      label: 'Perfil',     icon: 'user',     primary: true },
]
```

O FAB não entra na lista de NavDest — é tratado como elemento especial no componente `MobileTabbar`.

### `MobHead` — novo componente de header mobile

```tsx
// src/components/layout/MobHead.tsx
// Visível APENAS em ≤ 768px (via CSS display:none no desktop)
interface MobHeadProps {
  over?: string       // eyebrow — ex: "Qui · 21 mai"
  title: string       // título Bebas — ex: "BOM DIA, LUCAS"
  right?: ReactNode   // avatar, botão +, etc.
}
```

Cada página mobile usa `MobHead` em vez do `Topbar`. O `Topbar` continua sendo renderizado mas fica oculto no mobile via CSS quando `MobHead` está presente — ou, alternativamente, `MobHead` é renderizado condicionalmente pelo hook `useIsMobile`.

**`useIsMobile` hook:**
```ts
// src/hooks/useIsMobile.ts
export function useIsMobile(): boolean {
  const [mobile, setMobile] = useState(() => window.innerWidth <= 768)
  useEffect(() => {
    const mq = window.matchMedia('(max-width: 768px)')
    const handler = (e: MediaQueryListEvent) => setMobile(e.matches)
    mq.addEventListener('change', handler)
    return () => mq.removeEventListener('change', handler)
  }, [])
  return mobile
}
```

---

## Seção 2 — Páginas novas (mobile-only)

### `SemanaPage` — `/semana`

**Dados:** `getMyWorkouts(userId)` (já existente) + `getWorkoutHistory()` para marcar dias concluídos.

**Layout:**
```
MobHead: over="Ciclo · Sem X" | title="SUA SEMANA" | right=<botão +>
─────────────────────────────────────────────────────────
[card SEG — PULL A — Costas · Bíceps]  ✓ (concluído)
[card TER — LEGS A — Perna]             ✓ (concluído)
[card QUA — DESCANSO]                   (tracejado, opacidade 60%)
[card QUI — PUSH A — Peito · Ombro]    ▶ HOJE (borda accent)
[card SEX — PULL B]                     vol. estimado
[card SAB — LEGS B]                     vol. estimado
[card DOM — DESCANSO]                   (tracejado)
```

**Card de cada dia:**
- Dia em display pequeno (SEG…DOM), 36px de largura
- Nome da ficha em Bebas 30 + grupos musculares em 12px dim
- Estado à direita:
  - `done` → `div.check.checked`
  - `today` → `<button class="btn primary">▶</button>` + borda do card em accent
  - `rest` → opacidade 0.6, borda tracejada
  - futuro → volume estimado em f-mono dim
- Toque → `navigate('/workouts/:id')`

**Lógica de mapeamento dias:**
- Cada ficha tem `week_days: WeekDay[]`
- Para cada dia da semana atual, busca qual ficha tem aquele dia em `week_days`
- Cruza com `workout_logs` da semana para marcar `done`
- Dia sem ficha → "Descanso"

---

### `ExerciciosPage` — `/exercicios`

**Dados:**
- Lista: `getExercises()` (catálogo público) — já existe em `workout.service.ts`
- PRs: `getPersonalRecords(userId)` — já existe em `history.service.ts`

**Layout:**
```
MobHead: over="X exercícios" | title="EXERCÍCIOS"
─────────────────────────────────────────────────
[input busca com ícone lupa]
[chips filtro: Todos | Peito | Costas | Ombro | ...]  ← scroll horizontal
─────────────────────────────────────────────────
[lrow] [img 56px] [Nome exercício]       [PR: 30kg×8]
                  [chip grupo][chip equip]
...
```

**Filtro:** ao selecionar chip, filtra a lista por `exercise.muscle_group`. "Todos" mostra tudo.

**Busca:** filtra por `exercise.name.toLowerCase().includes(query)`.

**PR:** se o aluno tem PR para aquele exercício, exibe em f-mono accent. Senão, exibe "—".

**Thumbnail:** placeholder `div.ph-img` (60×60px, fundo bg-2 com hachura) enquanto não há imagens — ou `exercise.image_url` se disponível.

---

## Seção 3 — Redesign mobile das páginas existentes

### `DashboardPage` — layout mobile condicional

Condição: `const isMobile = useIsMobile()` — renderiza JSX diferente no return.

**Mobile:**
```
MobHead: over="Qui · 21 mai" | title="BOM DIA, [NOME]" | right=<Avatar>
──────────────────────────────────────────────────────────────────────
Card herói (card-accent, overflow:hidden):
  [número fantasma gigante atrás, opacity 0.08]
  eyebrow "HOJE · DIA X / Y"
  h1 Bebas 68 — nome da ficha (ex: PUSH)
  grupos musculares 13px dim
  métricas mono: X exercícios · Ymin · Z.Zt volume
  [botão "▶ COMEÇAR TREINO" (escuro, cor accent)]

2 KPIs: [Streak Xd] [Vol. semana X.Xt]

Mini-semana (card): S T Q Q S S D
  dia atual = accent, concluídos = ✓, descanso = tracejado

Card Último PR: ícone troféu + exercício + valor mono accent
──────────────────────────────────────────────────────────────────────
```

Se não houver treino hoje: card neutro "Dia de descanso / nenhum treino programado".

**Desktop:** layout atual preservado sem alteração.

---

### `ProfilePage` — layout mobile condicional

**Mobile:**
```
[Banner placeholder 120px]
  [Avatar 100px quadrado arredondado, sobreposto ao banner, -50px margin]
  [NOME EM BEBAS 36]
  [chip objetivo] [chip personal: Bruno R.]

3 KPIs: [Treinos] [Streak] [PRs]

Card menu:
  → Dados pessoais    (ícone user)
  → Medidas corporais (ícone scale)
  → Preferências      (ícone settings) — abre seletor de tema accent
  → Conquistas        (ícone trophy)

[btn ghost danger "Sair da conta"]
```

**Desktop:** layout atual preservado.

---

### `ProgressPage` — ajustes mobile

Apenas reorganização do que já existe:
- Segmented control (7d/30d/90d/1a) fica no topo, largura cheia
- KPIs em grade 2×2 (em vez de linha horizontal)
- Gráfico de carga ocupa largura cheia
- Barras de volume por grupo ficam abaixo do gráfico

Sem mudança de dados ou lógica — só CSS/layout responsivo.

---

## Arquivos impactados

| Arquivo | Mudança |
|---------|---------|
| `src/index.css` | Adicionar classes: `.mob-tab-fab`, `.mob-head`, `.mob-scroll`, `.seg`, `.lrow`, `.kpi` (mobile), `.cta`, `.dots` |
| `src/hooks/useIsMobile.ts` | Criar — hook de detecção de mobile |
| `src/components/layout/MobileTabbar.tsx` | Substituir — novo FAB central, 5 colunas |
| `src/components/layout/MobHead.tsx` | Criar — header mobile padrão |
| `src/lib/navigation.ts` | Adicionar `ALUNO_MOBILE` + função `mobileNavDestinations()` |
| `src/pages/SemanaPage.tsx` | Criar — lista semanal de treinos |
| `src/pages/ExerciciosPage.tsx` | Criar — biblioteca do aluno com PRs |
| `src/pages/DashboardPage.tsx` | Adicionar branch mobile no return |
| `src/pages/ProfilePage.tsx` | Adicionar branch mobile no return |
| `src/pages/ProgressPage.tsx` | Ajustes de layout responsivo |
| `src/App.tsx` | Adicionar rotas `/semana` e `/exercicios` |

---

## Critério de conclusão

- [ ] Tabbar mobile tem 5 colunas com FAB central accent que sobe acima da barra
- [ ] FAB navega para o treino de hoje ou para `/semana` se não houver treino
- [ ] `/semana` exibe os 7 dias com status visual (done/hoje/descanso/futuro)
- [ ] `/exercicios` exibe catálogo com busca, filtro por grupo e PR do aluno
- [ ] Dashboard mobile exibe hero card, 2 KPIs, mini-semana e último PR
- [ ] Perfil mobile exibe avatar sobreposto ao banner, menu de lista, botão sair
- [ ] Progresso mobile tem KPIs em grade 2×2 e gráfico em largura cheia
- [ ] Desktop: zero mudança visual ou funcional
- [ ] Build sem erros de TypeScript
