# Navegação Mobile — Correção e Redesenho

**Data:** 1 de junho de 2026
**Status:** Aprovado ✅
**Autor:** Denis Rodrigues

---

## 1. Objetivo

Corrigir a navegação no celular do FORJA. Dois problemas reportados:

1. **A barra de navegação aparece na lateral direita** (flutuando no meio da tela) em vez de fixa no rodapé.
2. **Somem opções de navegação no celular** — Progresso, Medidas, trocar tema e Sair ficam inacessíveis.

Mais uma revisão geral leve de responsividade nas telas principais.

---

## 2. Diagnóstico (causa-raiz)

### 2.1 Barra na lateral

`AppShell` monta a tela como um flex em **linha** (`.scr`, `display: flex`):

```
[ Sidebar (.nav) ] [ conteúdo (.main) ] [ MobileTabbar (.mob-tabbar) ]
```

No mobile (≤768px), `.nav` recebe `display: none`, mas a `.mob-tabbar` continua sendo um **item flex da linha**. Como ela está marcada como `position: sticky` (e não `fixed`), não sai do fluxo — vira uma coluna espremida na lateral direita.

> A `.mob-tabbar` foi originalmente desenhada para um shell em coluna (`.mob`), que não é usado pelo `AppShell`. Daí o conflito.

### 2.2 Opções que somem

Duas listas de navegação **separadas e dessincronizadas**:

| Item | Sidebar (desktop) | MobileTabbar (atual) |
|------|:---:|:---:|
| Hoje | ✅ | ✅ |
| Treino | ✅ | ✅ |
| Histórico | ✅ | ✅ |
| Progresso | ✅ | ❌ |
| Medidas | ✅ | ❌ |
| Nutrição | ✅ | ✅ |
| Perfil | ✅ | ✅ |
| Trocar tema | ✅ | ❌ |
| Sair | ✅ | ❌ |

No celular o aluno perde **Progresso, Medidas, tema e Sair**. Para admin/trainer perde também **Alunos, Trainers** e o alternador **Gestão/Meu Treino** (`ModeToggle`).

---

## 3. Solução aprovada

Padrão escolhido: **barra inferior fixa (4 principais) + botão "Mais"** que abre uma gaveta (bottom sheet) com o restante.

### 3.1 Conserto de posicionamento (Bug 1)

Em `src/index.css`, a `.mob-tabbar` passa de `position: sticky` para **`position: fixed; left: 0; right: 0; bottom: 0`**, ocupando a largura toda do rodapé. Continua escondida no desktop (`display: none` padrão + `display: flex` só na media query `≤768px`).

- O `.content` no mobile já tem `padding-bottom: 80px` — mantém o conteúdo acima da barra.
- Acrescentar **área segura**: `padding-bottom: calc(22px + env(safe-area-inset-bottom))` na `.mob-tabbar` (evita colar no "tracinho" de iPhones).

### 3.2 Fonte única de navegação (anti-desencontro)

Criar `src/lib/navigation.ts` com a definição **única** dos destinos, consumida por Sidebar, MobileTabbar e a nova gaveta.

```typescript
import type { IconName } from '../components/ui/Icon'

export interface NavDest {
  to: string
  label: string
  icon: IconName
  /** Aparece na barra inferior do mobile (máx. 4). Caso contrário vai pro "Mais". */
  primary?: boolean
  matches?: (path: string) => boolean
}

export interface NavContext {
  isManager: boolean
  isSuperAdmin: boolean
  /** true quando manager está em modo "treino" (usa navegação de aluno). */
  inTrainingMode: boolean
}

/** Lista ordenada de destinos de navegação para o contexto atual. */
export function navDestinations(ctx: NavContext): NavDest[]
```

**Aluno** (e manager em modo treino):

| to | label | icon | primary |
|----|-------|------|:---:|
| `/dashboard` | Hoje | `home` | ✅ |
| `/workouts` | Treino | `flame` | ✅ |
| `/historico` | Histórico | `history` | ✅ |
| `/nutricao` | Nutrição | `flash` | ✅ |
| `/progresso` | Progresso | `chart` | — |
| `/medidas` | Medidas | `scale` | — |
| `/perfil` | Perfil | `user` | — |

**Gestão** (manager fora do modo treino):

| to | label | icon | primary |
|----|-------|------|:---:|
| `/dashboard` | Hoje | `home` | ✅ |
| `/admin/workouts` | Fichas | `edit` | ✅ |
| `/admin/students` | Alunos | `user` | ✅ |
| `/admin/trainers` | Trainers | `trophy` | ✅ *(só super admin)* |
| `/perfil` | Perfil | `user` | — |

> Ícone de "Trainers" muda de `user` para `trophy`, para não ficar idêntico ao de "Alunos".

Regras de consumo:
- **Sidebar:** renderiza **todos** os destinos na lista vertical principal (incluindo Perfil). A seção "Conta" passa a ter apenas `ThemeSwitcher` e **Sair** (`ModeToggle` segue no topo, só para manager). Perfil **não** é duplicado.
- **MobileTabbar:** renderiza os destinos `primary` (no máximo 4) + um botão fixo **"Mais"** (ícone `more`) que abre a gaveta.
- **Gaveta "Mais":** renderiza os destinos **não-primary** + ações de conta (tema, sair, e `ModeToggle` para manager).

### 3.3 Gaveta "Mais" — `src/components/layout/MobileMoreSheet.tsx`

Bottom sheet reutilizando o padrão visual do `MealBottomSheet` (overlay com blur + slide de baixo pra cima via `motion/react`, fecha com ESC / toque fora / X).

**Props:**
```typescript
interface MobileMoreSheetProps {
  isOpen: boolean
  onClose: () => void
}
```

**Conteúdo (de cima pra baixo):**
1. Alça visual + header "MAIS" + botão X.
2. *(Só manager)* `ModeToggle` — alternar Gestão / Meu Treino.
3. Lista de destinos **não-primary** (linhas com ícone + label, estado ativo destacado). Ao tocar: navega e fecha a gaveta.
4. Divisória.
5. `ThemeSwitcher` (trocar tema).
6. **Sair** — linha com ícone `logout`, estilo `danger`, chama `signOut()`.

A gaveta fecha automaticamente ao navegar (escuta mudança de rota ou fecha no `onClick` do link).

### 3.4 MobileTabbar — ajustes

- Lê `navDestinations(ctx)` e filtra `primary`.
- Acrescenta o botão "Mais" como último item (`<button>` com ícone `more`, mesmo estilo `.mob-tab`), controlando o estado `moreOpen`.
- Renderiza `<MobileMoreSheet isOpen={moreOpen} onClose={...} />`.
- Estado ativo do "Mais": destacado quando a rota atual é um destino não-primary (ex.: em `/progresso`, o "Mais" fica aceso).

### 3.5 Revisão geral mobile ("outras coisas")

Passada leve nas telas principais (Dashboard, Workouts, Histórico, Progresso, Nutrição) no tamanho celular:
- **Topbar:** garantir que título + ações não se espremam — permitir quebra/empilhamento das ações quando faltar largura.
- Conferir que o conteúdo não fica escondido atrás da barra fixa (padding inferior).
- Conferir convivência da barra fixa com elementos próprios das páginas (ex.: o FAB "Registrar" da Nutrição, que fica em `bottom: 80`).

> Itens específicos adicionais que o usuário apontar entram como ajustes pontuais durante a implementação.

---

## 4. Arquivos afetados

| Arquivo | Mudança |
|---------|---------|
| `src/index.css` | `.mob-tabbar`: `sticky` → `fixed` + área segura |
| `src/lib/navigation.ts` | **novo** — fonte única de destinos |
| `src/components/layout/Sidebar.tsx` | consome `navDestinations` (remove lista própria) |
| `src/components/layout/MobileTabbar.tsx` | consome `navDestinations` (primary) + botão "Mais" + gaveta |
| `src/components/layout/MobileMoreSheet.tsx` | **novo** — gaveta com destinos secundários + tema + sair |
| Telas principais | ajustes pontuais de responsividade na Topbar/espaçamentos |

---

## 5. Critérios de conclusão

- [ ] No celular (≤768px) a barra fica **fixa no rodapé**, largura toda, nunca na lateral.
- [ ] Barra mostra 4 destinos principais + botão "Mais".
- [ ] "Mais" abre gaveta com Progresso, Medidas, Perfil, trocar tema e Sair (aluno).
- [ ] Manager vê Alunos/Trainers na barra e o alternador Gestão/Treino no "Mais".
- [ ] Sidebar (desktop) e barra (mobile) usam a **mesma** fonte de navegação.
- [ ] Conteúdo nunca fica escondido atrás da barra.
- [ ] Build sem erros de TypeScript.

---

## 6. Fora do escopo

- Redesenho visual das telas internas (só ajustes de encaixe no mobile).
- Novos destinos/páginas de navegação.
- Animações além do slide padrão da gaveta.
- Gestos (swipe) para abrir/fechar a gaveta.
