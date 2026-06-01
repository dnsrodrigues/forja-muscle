# Navegação Mobile — Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Consertar a navegação no celular do FORJA — barra fixa no rodapé (em vez de flutuando na lateral) e botão "Mais" dando acesso a todos os destinos que hoje somem.

**Architecture:** Uma fonte única de navegação (`src/lib/navigation.ts`) alimenta tanto o menu lateral (desktop) quanto a barra inferior (mobile). A barra mostra os 4 destinos principais + um botão "Mais" que abre uma gaveta (bottom sheet) com o restante e as ações de conta. A barra passa de `position: sticky` para `fixed`.

**Tech Stack:** React 19 + TypeScript, React Router 7, `motion` (animação da gaveta), Tailwind v4 + CSS vars (Design System FORJA v4).

**Verificação:** O projeto **não tem framework de testes unitários**. A verificação de cada tarefa é: (1) checagem de tipos com `npx tsc -b --noEmit` (esperado: sem saída, exit 0) e (2) teste visual manual com `npm run dev` redimensionando o navegador para ≤768px (ou modo dispositivo no DevTools). Os passos refletem isso.

---

## Estrutura de arquivos

| Arquivo | Responsabilidade |
|---------|------------------|
| `src/lib/navigation.ts` | **novo** — fonte única dos destinos de navegação (com flag `primary`) |
| `src/index.css` | barra `.mob-tabbar`: `sticky` → `fixed` + área segura; padding do `.content` |
| `src/components/layout/Sidebar.tsx` | consome `navDestinations`; remove listas próprias; Perfil deixa de duplicar |
| `src/components/layout/MobileMoreSheet.tsx` | **novo** — gaveta com destinos secundários + tema + sair |
| `src/components/layout/MobileTabbar.tsx` | consome `navDestinations` (primary) + botão "Mais" + gaveta |

Ordem das tarefas: a Task 1 (CSS) já conserta o bug visual da lateral sozinha; as demais constroem a fonte única e o "Mais".

---

## Task 1: Conserto de posicionamento da barra (Bug 1)

**Files:**
- Modify: `src/index.css` (bloco `.mob-tabbar` e media query `≤768px`)

- [ ] **Step 1: Trocar `position: sticky` por `fixed` na `.mob-tabbar`**

Localize o bloco atual:

```css
.mob-tabbar {
  display: flex;
  justify-content: space-around;
  align-items: center;
  padding: 12px 8px 22px;
  border-top: 1px solid var(--hairline);
  background: #0a0b0c;
  gap: 0;
  position: sticky;
  bottom: 0;
  z-index: 10;
}
```

Substitua por:

```css
.mob-tabbar {
  display: flex;
  justify-content: space-around;
  align-items: center;
  padding: 12px 8px;
  padding-bottom: calc(14px + env(safe-area-inset-bottom));
  border-top: 1px solid var(--hairline);
  background: #0a0b0c;
  gap: 0;
  position: fixed;
  left: 0;
  right: 0;
  bottom: 0;
  width: 100%;
  z-index: 40;
}
```

- [ ] **Step 2: Ajustar o padding inferior do `.content` no mobile (pra conteúdo não ficar atrás da barra)**

Localize a media query:

```css
@media (max-width: 768px) {
  .nav { display: none; }
  .topbar { padding: 16px 18px; }
  .topbar-title { font-size: 22px; }
  .content { padding: 18px; padding-bottom: 80px; }
  [data-mobile-tabbar] { display: flex !important; }
  .scr { position: relative; }
}
```

Troque a linha do `.content` por:

```css
  .content { padding: 18px; padding-bottom: calc(88px + env(safe-area-inset-bottom)); }
```

- [ ] **Step 3: Checagem de tipos**

Run: `npx tsc -b --noEmit`
Expected: sem saída de erro, exit 0.

- [ ] **Step 4: Teste visual**

Run: `npm run dev` → abrir o app → DevTools → modo dispositivo (largura ≤768px) → logar como aluno.
Expected: a barra de navegação fica **fixa no rodapé**, ocupando a largura toda — **não** mais na lateral direita.

- [ ] **Step 5: Commit**

```bash
git add src/index.css
git commit -m "fix(mobile): barra de navegacao fixa no rodape (sticky -> fixed)

Co-Authored-By: Claude Opus 4.8 (1M context) <noreply@anthropic.com>"
```

---

## Task 2: Fonte única de navegação

**Files:**
- Create: `src/lib/navigation.ts`

- [ ] **Step 1: Criar `src/lib/navigation.ts`**

```typescript
import type { IconName } from '../components/ui/Icon'

export interface NavDest {
  to: string
  label: string
  icon: IconName
  /** Aparece na barra inferior do mobile (máx. 4). Caso contrário, vai pro "Mais". */
  primary?: boolean
  matches?: (path: string) => boolean
}

export interface NavContext {
  isManager: boolean
  isSuperAdmin: boolean
  /** true quando manager está em modo "treino" (usa navegação de aluno). */
  inTrainingMode: boolean
}

const ALUNO: NavDest[] = [
  { to: '/dashboard', label: 'Hoje', icon: 'home', primary: true },
  { to: '/workouts', label: 'Treino', icon: 'flame', primary: true, matches: (p) => p.startsWith('/workouts') },
  { to: '/historico', label: 'Histórico', icon: 'history', primary: true, matches: (p) => p.startsWith('/historico') },
  { to: '/nutricao', label: 'Nutrição', icon: 'flash', primary: true, matches: (p) => p.startsWith('/nutricao') },
  { to: '/progresso', label: 'Progresso', icon: 'chart' },
  { to: '/medidas', label: 'Medidas', icon: 'scale' },
  { to: '/perfil', label: 'Perfil', icon: 'user' },
]

function gestao(isSuperAdmin: boolean): NavDest[] {
  const list: NavDest[] = [
    { to: '/dashboard', label: 'Hoje', icon: 'home', primary: true },
    { to: '/admin/workouts', label: 'Fichas', icon: 'edit', primary: true, matches: (p) => p.startsWith('/admin/workouts') },
    { to: '/admin/students', label: 'Alunos', icon: 'user', primary: true, matches: (p) => p.startsWith('/admin/students') },
  ]
  if (isSuperAdmin) {
    list.push({ to: '/admin/trainers', label: 'Trainers', icon: 'trophy', primary: true, matches: (p) => p.startsWith('/admin/trainers') })
  }
  list.push({ to: '/perfil', label: 'Perfil', icon: 'user' })
  return list
}

/** Lista ordenada de destinos de navegação para o contexto atual. */
export function navDestinations(ctx: NavContext): NavDest[] {
  if (!ctx.isManager || ctx.inTrainingMode) return ALUNO
  return gestao(ctx.isSuperAdmin)
}

/** Diz se um destino está ativo dado o pathname atual. */
export function isNavActive(dest: NavDest, pathname: string): boolean {
  return dest.matches ? dest.matches(pathname) : pathname === dest.to
}
```

- [ ] **Step 2: Checagem de tipos**

Run: `npx tsc -b --noEmit`
Expected: sem saída de erro, exit 0. (O arquivo ainda não é usado — isso é normal nesta etapa.)

- [ ] **Step 3: Commit**

```bash
git add src/lib/navigation.ts
git commit -m "feat(nav): fonte unica de destinos de navegacao

Co-Authored-By: Claude Opus 4.8 (1M context) <noreply@anthropic.com>"
```

---

## Task 3: Sidebar consome a fonte única

**Files:**
- Modify: `src/components/layout/Sidebar.tsx` (substituição completa do arquivo)

- [ ] **Step 1: Substituir todo o conteúdo de `Sidebar.tsx`**

```tsx
import { Link, useLocation } from 'react-router-dom'
import { useAuth } from '../../context/AuthContext'
import { Icon } from '../ui/Icon'
import { ThemeSwitcher } from '../ui/ThemeSwitcher'
import { ModeToggle } from '../ui/ModeToggle'
import { navDestinations, isNavActive } from '../../lib/navigation'

export function Sidebar() {
  const { profile, isManager, isSuperAdmin, trainerMode, signOut } = useAuth()
  const { pathname } = useLocation()

  const inTrainingMode = isManager && trainerMode === 'treino'
  const dests = navDestinations({ isManager, isSuperAdmin, inTrainingMode })

  const initial = (profile?.full_name ?? 'A').charAt(0).toUpperCase()
  const firstName = profile?.full_name?.split(' ')[0] ?? 'Atleta'

  const roleLabel = profile?.role === 'super_admin'
    ? 'Super Admin'
    : profile?.role === 'trainer'
    ? 'Personal Trainer'
    : 'Aluno'

  return (
    <aside className="nav">
      <Link to="/dashboard" className="nav-brand" style={{ textDecoration: 'none' }}>
        FORJA<span className="nav-brand-dot">.</span>
      </Link>

      {isManager && (
        <div style={{ padding: '8px 12px 4px' }}>
          <ModeToggle />
        </div>
      )}

      <div className="nav-section">
        {inTrainingMode ? 'Meu Treino' : isManager ? 'Gestão' : 'Treino'}
      </div>

      {dests.map((dest) => (
        <Link
          key={dest.to}
          to={dest.to}
          className={'nav-item' + (isNavActive(dest, pathname) ? ' active' : '')}
        >
          <span className="nav-ico"><Icon name={dest.icon} size={18} /></span>
          {dest.label}
        </Link>
      ))}

      <div className="nav-section">Conta</div>
      <button
        type="button"
        onClick={() => void signOut()}
        className="nav-item"
        style={{ background: 'transparent', border: 'none', textAlign: 'left', width: '100%', cursor: 'pointer' }}
      >
        <span className="nav-ico"><Icon name="logout" size={18} /></span>
        Sair
      </button>

      <ThemeSwitcher />

      <div className="nav-user">
        <div className="nav-avatar">{initial}</div>
        <div style={{ display: 'flex', flexDirection: 'column', fontSize: 12, minWidth: 0 }}>
          <span style={{ fontWeight: 600, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
            {firstName}
          </span>
          <span style={{ color: 'var(--text-faint)' }}>{roleLabel}</span>
        </div>
      </div>
    </aside>
  )
}
```

> Mudança-chave: Perfil agora vem da lista `dests` (aparece uma vez só na lista principal); a seção "Conta" tem apenas "Sair".

- [ ] **Step 2: Checagem de tipos**

Run: `npx tsc -b --noEmit`
Expected: sem saída de erro, exit 0.

- [ ] **Step 3: Teste visual (desktop)**

Run: `npm run dev` → largura desktop → logar como aluno.
Expected: menu lateral mostra Hoje, Treino, Histórico, Nutrição, Progresso, Medidas, Perfil (uma vez), depois "Conta" → Sair, tema e usuário. Como admin: Hoje, Fichas, Alunos, (Trainers se super admin), Perfil.

- [ ] **Step 4: Commit**

```bash
git add src/components/layout/Sidebar.tsx
git commit -m "refactor(nav): Sidebar usa a fonte unica de navegacao

Co-Authored-By: Claude Opus 4.8 (1M context) <noreply@anthropic.com>"
```

---

## Task 4: Gaveta "Mais" (MobileMoreSheet)

**Files:**
- Create: `src/components/layout/MobileMoreSheet.tsx`

- [ ] **Step 1: Criar `src/components/layout/MobileMoreSheet.tsx`**

```tsx
import { useEffect } from 'react'
import { Link, useLocation } from 'react-router-dom'
import { motion, AnimatePresence } from 'motion/react'
import { useAuth } from '../../context/AuthContext'
import { Icon } from '../ui/Icon'
import { ThemeSwitcher } from '../ui/ThemeSwitcher'
import { ModeToggle } from '../ui/ModeToggle'
import { navDestinations, isNavActive } from '../../lib/navigation'

interface MobileMoreSheetProps {
  isOpen: boolean
  onClose: () => void
}

export function MobileMoreSheet({ isOpen, onClose }: MobileMoreSheetProps) {
  const { isManager, isSuperAdmin, trainerMode, signOut } = useAuth()
  const { pathname } = useLocation()

  const inTrainingMode = isManager && trainerMode === 'treino'
  const secondary = navDestinations({ isManager, isSuperAdmin, inTrainingMode })
    .filter((d) => !d.primary)

  // Fechar com Escape
  useEffect(() => {
    if (!isOpen) return
    function onKey(e: KeyboardEvent) {
      if (e.key === 'Escape') onClose()
    }
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  }, [isOpen, onClose])

  return (
    <AnimatePresence>
      {isOpen && (
        <>
          {/* Overlay */}
          <motion.div
            key="more-overlay"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={onClose}
            style={{
              position: 'fixed', inset: 0, zIndex: 60,
              background: 'rgba(0,0,0,0.7)', backdropFilter: 'blur(4px)',
            }}
          />

          {/* Gaveta */}
          <motion.div
            key="more-sheet"
            role="dialog"
            aria-modal="true"
            aria-label="Mais opções"
            initial={{ y: '100%' }}
            animate={{ y: 0 }}
            exit={{ y: '100%' }}
            transition={{ type: 'spring', damping: 30, stiffness: 300 }}
            style={{
              position: 'fixed', bottom: 0, left: 0, right: 0, zIndex: 61,
              background: 'var(--bg-1)',
              borderTop: '2px solid var(--accent)',
              borderRadius: '16px 16px 0 0',
              maxHeight: '85vh', overflowY: 'auto',
              padding: '20px 16px calc(28px + env(safe-area-inset-bottom))',
            }}
          >
            {/* Alça visual */}
            <div style={{ width: 40, height: 4, background: 'var(--border)', borderRadius: 99, margin: '0 auto 16px' }} />

            {/* Header */}
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16 }}>
              <div className="f-display" style={{ fontSize: 24, color: 'var(--text)' }}>MAIS</div>
              <button
                onClick={onClose}
                style={{ background: 'transparent', border: 'none', cursor: 'pointer', color: 'var(--text-faint)', padding: 4, lineHeight: 0 }}
                aria-label="Fechar"
              >
                <Icon name="x" size={18} />
              </button>
            </div>

            {/* Alternador de modo (só manager) */}
            {isManager && (
              <div style={{ marginBottom: 16 }}>
                <ModeToggle />
              </div>
            )}

            {/* Destinos secundários */}
            <div style={{ display: 'flex', flexDirection: 'column', gap: 4 }}>
              {secondary.map((dest) => {
                const active = isNavActive(dest, pathname)
                return (
                  <Link
                    key={dest.to}
                    to={dest.to}
                    onClick={onClose}
                    style={{
                      display: 'flex', alignItems: 'center', gap: 12,
                      padding: '12px 14px', borderRadius: 'var(--r-2)',
                      textDecoration: 'none',
                      background: active ? 'var(--accent)' : 'var(--bg-2)',
                      color: active ? 'var(--accent-fg)' : 'var(--text)',
                      fontWeight: active ? 700 : 500, fontSize: 15,
                    }}
                  >
                    <Icon name={dest.icon} size={20} />
                    {dest.label}
                  </Link>
                )
              })}
            </div>

            <hr className="divider" style={{ margin: '16px 0' }} />

            {/* Tema */}
            <ThemeSwitcher />

            {/* Sair */}
            <button
              type="button"
              onClick={() => { onClose(); void signOut() }}
              className="btn danger"
              style={{ width: '100%', justifyContent: 'center', marginTop: 12 }}
            >
              <Icon name="logout" size={16} /> Sair
            </button>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  )
}
```

- [ ] **Step 2: Checagem de tipos**

Run: `npx tsc -b --noEmit`
Expected: sem saída de erro, exit 0. (Ainda não importado por ninguém — normal nesta etapa.)

- [ ] **Step 3: Commit**

```bash
git add src/components/layout/MobileMoreSheet.tsx
git commit -m "feat(mobile): gaveta 'Mais' com destinos secundarios, tema e sair

Co-Authored-By: Claude Opus 4.8 (1M context) <noreply@anthropic.com>"
```

---

## Task 5: MobileTabbar com 4 principais + "Mais"

**Files:**
- Modify: `src/components/layout/MobileTabbar.tsx` (substituição completa do arquivo)

- [ ] **Step 1: Substituir todo o conteúdo de `MobileTabbar.tsx`**

```tsx
import { useState } from 'react'
import { Link, useLocation } from 'react-router-dom'
import { useAuth } from '../../context/AuthContext'
import { Icon } from '../ui/Icon'
import { MobileMoreSheet } from './MobileMoreSheet'
import { navDestinations, isNavActive } from '../../lib/navigation'

/**
 * Tabbar fixa no rodapé. Aparece SOMENTE no mobile (≤768px) via CSS.
 * Mostra os destinos principais + botão "Mais" (abre a gaveta).
 */
export function MobileTabbar() {
  const { isManager, isSuperAdmin, trainerMode } = useAuth()
  const { pathname } = useLocation()
  const [moreOpen, setMoreOpen] = useState(false)

  const inTrainingMode = isManager && trainerMode === 'treino'
  const dests = navDestinations({ isManager, isSuperAdmin, inTrainingMode })
  const primary = dests.filter((d) => d.primary)
  const secondary = dests.filter((d) => !d.primary)

  // "Mais" fica aceso quando a rota atual é um destino secundário
  const moreActive = secondary.some((d) => isNavActive(d, pathname))

  return (
    <>
      <nav className="mob-tabbar" style={{ display: 'none' }} data-mobile-tabbar>
        {primary.map((t) => (
          <Link
            key={t.to}
            to={t.to}
            className={'mob-tab' + (isNavActive(t, pathname) ? ' active' : '')}
          >
            <Icon name={t.icon} size={22} />
            {t.label}
          </Link>
        ))}
        <button
          type="button"
          onClick={() => setMoreOpen(true)}
          className={'mob-tab' + (moreActive ? ' active' : '')}
        >
          <Icon name="more" size={22} />
          Mais
        </button>
      </nav>

      <MobileMoreSheet isOpen={moreOpen} onClose={() => setMoreOpen(false)} />
    </>
  )
}
```

- [ ] **Step 2: Checagem de tipos**

Run: `npx tsc -b --noEmit`
Expected: sem saída de erro, exit 0.

- [ ] **Step 3: Teste visual (mobile) — fluxo completo**

Run: `npm run dev` → modo dispositivo ≤768px.
Expected (como aluno):
- Barra embaixo: **Hoje · Treino · Histórico · Nutrição · Mais** (5 itens).
- Tocar em "Mais" → gaveta sobe com **Progresso, Medidas, Perfil**, depois tema e **Sair**.
- Tocar em "Progresso" → navega e a gaveta fecha; na barra, "Mais" fica aceso.
- Tocar fora / ESC / X → gaveta fecha.

Expected (como admin/super admin, fora do modo treino):
- Barra: **Hoje · Fichas · Alunos · Trainers · Mais** (Trainers só super admin).
- "Mais" → Perfil + alternador Gestão/Meu Treino + tema + Sair.

- [ ] **Step 4: Commit**

```bash
git add src/components/layout/MobileTabbar.tsx
git commit -m "feat(mobile): tabbar com 4 principais + botao 'Mais'

Co-Authored-By: Claude Opus 4.8 (1M context) <noreply@anthropic.com>"
```

---

## Task 6: Revisão geral mobile — Topbar que se espreme

**Files:**
- Modify: `src/index.css` (media query `≤768px`)

- [ ] **Step 1: Permitir que a Topbar quebre quando faltar largura**

Na media query `@media (max-width: 768px)`, logo após a linha do `.content`, acrescente:

```css
  .topbar { flex-wrap: wrap; row-gap: 10px; }
  .topbar-left { min-width: 0; flex: 1; }
```

Isso faz os botões de ação (ex.: "INICIAR TREINO") caírem pra linha de baixo em telas estreitas, em vez de espremer o título.

- [ ] **Step 2: Checagem de tipos**

Run: `npx tsc -b --noEmit`
Expected: sem saída de erro, exit 0.

- [ ] **Step 3: Teste visual — varredura das telas principais**

Run: `npm run dev` → modo dispositivo (testar ~390px de largura).
Checklist (rolar cada tela e confirmar que nada fica escondido atrás da barra inferior nem espremido no topo):
- Dashboard (título + "INICIAR TREINO")
- Treino (lista de fichas)
- Histórico
- Progresso
- Nutrição (confirmar que o FAB "Registrar" continua acima da barra)

> Itens específicos encontrados nesta varredura que fujam do encaixe básico (topo/espaçamento) viram ajustes pontuais — anotar e tratar como follow-up, fora do escopo deste plano.

- [ ] **Step 4: Commit**

```bash
git add src/index.css
git commit -m "fix(mobile): topbar quebra em vez de espremer em telas estreitas

Co-Authored-By: Claude Opus 4.8 (1M context) <noreply@anthropic.com>"
```

---

## Verificação final

- [ ] `npx tsc -b --noEmit` passa sem erros.
- [ ] No mobile: barra fixa no rodapé, largura toda, nunca na lateral.
- [ ] Barra: 4 principais + "Mais"; gaveta dá acesso a Progresso, Medidas, Perfil, tema e Sair.
- [ ] Admin vê Alunos/Trainers na barra e o alternador no "Mais".
- [ ] Sidebar (desktop) e barra (mobile) usam a mesma fonte (`navDestinations`).
- [ ] Conteúdo nunca fica escondido atrás da barra.
