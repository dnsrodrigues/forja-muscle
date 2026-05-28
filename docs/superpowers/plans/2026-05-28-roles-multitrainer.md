# Roles Multi-Trainer + Trainer como Aluno — Plano de Implementação

> **Para agentes:** Use superpowers:executing-plans para implementar tarefa a tarefa.

**Goal:** Adicionar 3 papéis (`super_admin`, `trainer`, `user`), vínculo 1:1 trainer→aluno, e toggle "Gestão / Meu Treino" para trainers e super_admins.

**Architecture:** O banco já foi migrado (Patch v4). O trabalho é todo no frontend: atualizar tipos, AuthContext, navegação e criar as páginas de gestão de trainers. O isolamento de dados é garantido pelo RLS — o frontend só precisa renderizar o UI correto para cada papel.

**Tech Stack:** React 19, TypeScript, React Router v7, Supabase JS SDK, Design System FORJA (variáveis CSS + ícones SVG próprios)

**Spec:** `docs/superpowers/specs/2026-05-28-roles-multitrainer-design.md`

---

## Mapa de arquivos

| Arquivo | Ação |
|---------|------|
| `src/types/index.ts` | Modificar — atualizar `UserRole` e `UserProfile` |
| `src/context/AuthContext.tsx` | Modificar — adicionar `isSuperAdmin`, `isTrainer`, `isManager`, `trainerMode`, `setTrainerMode` |
| `src/components/ui/ModeToggle.tsx` | Criar — botão de alternância Gestão / Meu Treino |
| `src/components/layout/AdminRoute.tsx` | Modificar — virar `TrainerRoute`, permite `isManager` |
| `src/components/layout/Sidebar.tsx` | Modificar — novos links por papel + modo + ModeToggle |
| `src/App.tsx` | Modificar — usar `TrainerRoute`, adicionar rota `/admin/trainers` |
| `src/services/trainer.service.ts` | Criar — getTrainers, getTrainerStudents, assignStudentToTrainer |
| `src/pages/admin/TrainersAdminPage.tsx` | Criar — lista de trainers (só super_admin) |
| `src/pages/admin/TrainerFormPage.tsx` | Criar — criar novo trainer |
| `src/pages/admin/WorkoutsAdminPage.tsx` | Modificar — filtrar por trainer quando `isTrainer` |

---

## Tarefa 1 — Tipos e AuthContext

**Arquivos:**
- Modificar: `src/types/index.ts`
- Modificar: `src/context/AuthContext.tsx`

### Por que primeiro?
Todos os outros componentes dependem dos tipos corretos e do contexto atualizado. Começar aqui garante que o TypeScript valide tudo que vier depois.

---

- [ ] **Passo 1: Atualizar `UserRole` e `UserProfile` em `src/types/index.ts`**

Substituir:
```ts
export type UserRole = 'admin' | 'user'

export interface UserProfile {
  id: string
  email: string
  full_name: string
  role: UserRole
  avatar_url?: string
  weight?: number
  height?: number
  birth_date?: string
  gender?: 'male' | 'female' | 'other'
  goal?: string
  target_weight?: number
  is_active: boolean
  created_at: string
  updated_at: string
}
```

Por:
```ts
export type UserRole = 'super_admin' | 'trainer' | 'user'

export interface UserProfile {
  id: string
  email: string
  full_name: string
  role: UserRole
  trainer_id: string | null
  avatar_url?: string
  weight?: number
  height?: number
  birth_date?: string
  gender?: 'male' | 'female' | 'other'
  goal?: string
  target_weight?: number
  is_active: boolean
  created_at: string
  updated_at: string
}
```

- [ ] **Passo 2: Atualizar `AuthContext.tsx` — interface e provider**

Substituir o arquivo inteiro por:
```tsx
import { createContext, useContext, useEffect, useState } from 'react'
import type { User, Session } from '@supabase/supabase-js'
import { supabase } from '../lib/supabase'
import type { UserProfile } from '../types'

const TRAINER_MODE_KEY = 'musc-trainer-mode'

interface AuthContextType {
  user: User | null
  profile: UserProfile | null
  session: Session | null
  loading: boolean
  isAdmin: boolean        // mantido para não quebrar código existente = isSuperAdmin
  isSuperAdmin: boolean
  isTrainer: boolean
  isManager: boolean      // true para super_admin e trainer
  trainerMode: 'gestao' | 'treino'
  setTrainerMode: (mode: 'gestao' | 'treino') => void
  signIn: (email: string, password: string) => Promise<void>
  signOut: () => Promise<void>
  refreshProfile: () => Promise<void>
}

const AuthContext = createContext<AuthContextType | undefined>(undefined)

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<User | null>(null)
  const [profile, setProfile] = useState<UserProfile | null>(null)
  const [session, setSession] = useState<Session | null>(null)
  const [loading, setLoading] = useState(true)
  const [trainerMode, setTrainerModeState] = useState<'gestao' | 'treino'>(() => {
    const saved = localStorage.getItem(TRAINER_MODE_KEY)
    return saved === 'treino' ? 'treino' : 'gestao'
  })

  async function fetchProfile(userId: string) {
    const { data, error } = await supabase
      .from('profiles')
      .select('*')
      .eq('id', userId)
      .single()
    if (!error && data) setProfile(data as UserProfile)
    setLoading(false)
  }

  useEffect(() => {
    supabase.auth.getSession().then(({ data: { session } }) => {
      setSession(session)
      setUser(session?.user ?? null)
      if (session?.user) fetchProfile(session.user.id)
      else setLoading(false)
    })

    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
      setSession(session)
      setUser(session?.user ?? null)
      if (session?.user) fetchProfile(session.user.id)
      else { setProfile(null); setLoading(false) }
    })

    return () => subscription.unsubscribe()
  }, [])

  function setTrainerMode(mode: 'gestao' | 'treino') {
    setTrainerModeState(mode)
    localStorage.setItem(TRAINER_MODE_KEY, mode)
  }

  const isSuperAdmin = profile?.role === 'super_admin'
  const isTrainer = profile?.role === 'trainer'
  const isManager = isSuperAdmin || isTrainer

  return (
    <AuthContext.Provider value={{
      user, profile, session, loading,
      isAdmin: isSuperAdmin,
      isSuperAdmin, isTrainer, isManager,
      trainerMode, setTrainerMode,
      signIn: async (email, password) => {
        const { error } = await supabase.auth.signInWithPassword({ email, password })
        if (error) throw error
      },
      signOut: async () => {
        const { error } = await supabase.auth.signOut()
        if (error) throw error
      },
      refreshProfile: async () => { if (user) await fetchProfile(user.id) },
    }}>
      {children}
    </AuthContext.Provider>
  )
}

export function useAuth() {
  const context = useContext(AuthContext)
  if (!context) throw new Error('useAuth precisa estar dentro do AuthProvider')
  return context
}
```

- [ ] **Passo 3: Verificar build**

```bash
npm run build
```

Esperado: sem erros de TypeScript relacionados a `UserRole` ou `isAdmin`.

- [ ] **Passo 4: Commit**

```bash
git add src/types/index.ts src/context/AuthContext.tsx
git commit -m "feat(auth): 3 roles — super_admin, trainer, user + trainerMode toggle"
```

---

## Tarefa 2 — Componente ModeToggle

**Arquivo:**
- Criar: `src/components/ui/ModeToggle.tsx`

---

- [ ] **Passo 1: Criar `src/components/ui/ModeToggle.tsx`**

```tsx
import { useAuth } from '../../context/AuthContext'

export function ModeToggle() {
  const { trainerMode, setTrainerMode } = useAuth()

  return (
    <div style={{
      display: 'flex',
      gap: 4,
      background: 'var(--surface)',
      borderRadius: 20,
      padding: 3,
      border: '1px solid var(--border)',
    }}>
      <button
        onClick={() => setTrainerMode('gestao')}
        style={{
          padding: '4px 12px',
          borderRadius: 16,
          border: 'none',
          cursor: 'pointer',
          fontSize: 11,
          fontFamily: "'JetBrains Mono', monospace",
          fontWeight: 600,
          background: trainerMode === 'gestao' ? 'var(--accent)' : 'transparent',
          color: trainerMode === 'gestao' ? '#fff' : 'var(--fg-2)',
          transition: 'all 0.15s',
        }}
      >
        Gestão
      </button>
      <button
        onClick={() => setTrainerMode('treino')}
        style={{
          padding: '4px 12px',
          borderRadius: 16,
          border: 'none',
          cursor: 'pointer',
          fontSize: 11,
          fontFamily: "'JetBrains Mono', monospace",
          fontWeight: 600,
          background: trainerMode === 'treino' ? 'var(--accent)' : 'transparent',
          color: trainerMode === 'treino' ? '#fff' : 'var(--fg-2)',
          transition: 'all 0.15s',
        }}
      >
        Meu Treino
      </button>
    </div>
  )
}
```

- [ ] **Passo 2: Commit**

```bash
git add src/components/ui/ModeToggle.tsx
git commit -m "feat(ui): componente ModeToggle — alterna Gestão / Meu Treino"
```

---

## Tarefa 3 — TrainerRoute + App.tsx

**Arquivos:**
- Modificar: `src/components/layout/AdminRoute.tsx`
- Modificar: `src/App.tsx`

---

- [ ] **Passo 1: Atualizar `AdminRoute.tsx` para aceitar `isManager`**

Substituir conteúdo de `src/components/layout/AdminRoute.tsx`:
```tsx
import { Navigate, Outlet } from 'react-router-dom'
import { useAuth } from '../../context/AuthContext'

// Permite super_admin e trainer. Segurança real está no RLS do banco.
export function AdminRoute() {
  const { loading, isManager } = useAuth()
  if (loading) return null
  if (!isManager) return <Navigate to="/dashboard" replace />
  return <Outlet />
}
```

- [ ] **Passo 2: Adicionar rota `/admin/trainers` em `src/App.tsx`**

Localizar o bloco de rotas admin (dentro de `<AdminRoute>`) e adicionar:
```tsx
<Route path="trainers" element={<TrainersAdminPage />} />
<Route path="trainers/new" element={<TrainerFormPage />} />
```

Adicionar os imports no topo do App.tsx:
```tsx
import { TrainersAdminPage } from './pages/admin/TrainersAdminPage'
import { TrainerFormPage } from './pages/admin/TrainerFormPage'
```

- [ ] **Passo 3: Verificar build**

```bash
npm run build
```

Esperado: erros apenas de "módulo não encontrado" para TrainersAdminPage e TrainerFormPage (ainda não criados — normal neste passo).

- [ ] **Passo 4: Commit**

```bash
git add src/components/layout/AdminRoute.tsx src/App.tsx
git commit -m "feat(routing): AdminRoute aceita trainer + rotas /admin/trainers"
```

---

## Tarefa 4 — Sidebar atualizada

**Arquivo:**
- Modificar: `src/components/layout/Sidebar.tsx`

---

- [ ] **Passo 1: Substituir `Sidebar.tsx` com suporte a papéis e ModeToggle**

```tsx
import { Link, useLocation } from 'react-router-dom'
import { useAuth } from '../../context/AuthContext'
import { Icon, type IconName } from '../ui/Icon'
import { ThemeSwitcher } from '../ui/ThemeSwitcher'
import { ModeToggle } from '../ui/ModeToggle'

interface NavLink {
  to: string
  label: string
  icon: IconName
  matches?: (path: string) => boolean
}

function alunoLinks(): NavLink[] {
  return [
    { to: '/dashboard', label: 'Hoje', icon: 'home' },
    { to: '/workouts', label: 'Treino', icon: 'flame', matches: (p) => p.startsWith('/workouts') },
    { to: '/historico', label: 'Histórico', icon: 'history', matches: (p) => p.startsWith('/historico') },
    { to: '/progresso', label: 'Progresso', icon: 'chart' },
    { to: '/medidas', label: 'Medidas', icon: 'scale' },
  ]
}

function gestaoLinks(isSuperAdmin: boolean): NavLink[] {
  const links: NavLink[] = [
    { to: '/dashboard', label: 'Hoje', icon: 'home' },
    { to: '/admin/workouts', label: 'Fichas', icon: 'edit', matches: (p) => p.startsWith('/admin/workouts') },
  ]
  if (isSuperAdmin) {
    links.push({
      to: '/admin/trainers',
      label: 'Trainers',
      icon: 'user',
      matches: (p) => p.startsWith('/admin/trainers'),
    })
  }
  return links
}

export function Sidebar() {
  const { profile, isManager, isSuperAdmin, trainerMode, signOut } = useAuth()
  const { pathname } = useLocation()

  const inTrainingMode = isManager && trainerMode === 'treino'
  const links = (!isManager || inTrainingMode) ? alunoLinks() : gestaoLinks(isSuperAdmin)

  const isActive = (link: NavLink) =>
    link.matches ? link.matches(pathname) : pathname === link.to

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

      <div className="nav-section">{inTrainingMode ? 'Meu Treino' : isManager ? 'Gestão' : 'Treino'}</div>
      {links.map((link) => (
        <Link
          key={link.to}
          to={link.to}
          className={'nav-item' + (isActive(link) ? ' active' : '')}
        >
          <span className="nav-ico"><Icon name={link.icon} size={18} /></span>
          {link.label}
        </Link>
      ))}

      <div className="nav-section">Conta</div>
      <Link to="/perfil" className={'nav-item' + (pathname === '/perfil' ? ' active' : '')}>
        <span className="nav-ico"><Icon name="user" size={18} /></span>
        Perfil
      </Link>
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

- [ ] **Passo 2: Verificar no browser**

Logar como super_admin e confirmar:
- Toggle "Gestão / Meu Treino" aparece na sidebar
- Em modo Gestão: links de admin (Fichas, Trainers)
- Em modo Meu Treino: links de aluno (Treino, Histórico, Progresso, Medidas)

- [ ] **Passo 3: Commit**

```bash
git add src/components/layout/Sidebar.tsx
git commit -m "feat(nav): sidebar adapta links por papel e modo (Gestão/Meu Treino)"
```

---

## Tarefa 5 — Trainer service

**Arquivo:**
- Criar: `src/services/trainer.service.ts`

---

- [ ] **Passo 1: Criar `src/services/trainer.service.ts`**

```ts
import { supabase } from '../lib/supabase'
import type { UserProfile } from '../types'

export async function getTrainers(): Promise<UserProfile[]> {
  const { data, error } = await supabase
    .from('profiles')
    .select('*')
    .eq('role', 'trainer')
    .eq('is_active', true)
    .order('full_name')
  if (error) throw error
  return data as UserProfile[]
}

export async function getTrainerStudents(trainerId: string): Promise<UserProfile[]> {
  const { data, error } = await supabase
    .from('profiles')
    .select('*')
    .eq('trainer_id', trainerId)
    .eq('is_active', true)
    .order('full_name')
  if (error) throw error
  return data as UserProfile[]
}

export async function assignStudentToTrainer(studentId: string, trainerId: string | null): Promise<void> {
  const { error } = await supabase
    .from('profiles')
    .update({ trainer_id: trainerId })
    .eq('id', studentId)
  if (error) throw error
}

export async function deactivateTrainer(trainerId: string): Promise<void> {
  const { error } = await supabase
    .from('profiles')
    .update({ is_active: false })
    .eq('id', trainerId)
  if (error) throw error
}
```

- [ ] **Passo 2: Commit**

```bash
git add src/services/trainer.service.ts
git commit -m "feat(service): trainer.service — CRUD de trainers e vínculos com alunos"
```

---

## Tarefa 6 — TrainersAdminPage

**Arquivo:**
- Criar: `src/pages/admin/TrainersAdminPage.tsx`

---

- [ ] **Passo 1: Criar `src/pages/admin/TrainersAdminPage.tsx`**

```tsx
import { useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { getTrainers, getTrainerStudents, deactivateTrainer } from '../../services/trainer.service'
import type { UserProfile } from '../../types'

export function TrainersAdminPage() {
  const navigate = useNavigate()
  const [trainers, setTrainers] = useState<UserProfile[]>([])
  const [studentCounts, setStudentCounts] = useState<Record<string, number>>({})
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    loadTrainers()
  }, [])

  async function loadTrainers() {
    try {
      const data = await getTrainers()
      setTrainers(data)
      const counts: Record<string, number> = {}
      await Promise.all(
        data.map(async (t) => {
          const students = await getTrainerStudents(t.id)
          counts[t.id] = students.length
        })
      )
      setStudentCounts(counts)
    } catch (e) {
      setError('Erro ao carregar trainers')
    } finally {
      setLoading(false)
    }
  }

  async function handleDeactivate(trainerId: string) {
    if (!confirm('Desativar este trainer?')) return
    try {
      await deactivateTrainer(trainerId)
      setTrainers((prev) => prev.filter((t) => t.id !== trainerId))
    } catch {
      alert('Erro ao desativar trainer')
    }
  }

  if (loading) return (
    <div style={{ padding: 24 }}>
      {[1, 2, 3].map((i) => (
        <div key={i} className="skeleton" style={{ height: 64, borderRadius: 8, marginBottom: 8 }} />
      ))}
    </div>
  )

  if (error) return <div style={{ padding: 24, color: 'var(--danger)' }}>{error}</div>

  return (
    <div style={{ padding: 24, maxWidth: 720 }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 24 }}>
        <div>
          <div style={{ fontFamily: "'JetBrains Mono', monospace", fontSize: 9, color: 'var(--fg-3)', letterSpacing: '0.15em', textTransform: 'uppercase', marginBottom: 4 }}>
            Gestão
          </div>
          <h1 className="gradient-text" style={{ fontFamily: "'Outfit', sans-serif", fontWeight: 800, fontSize: 24, margin: 0 }}>
            Trainers
          </h1>
        </div>
        <button
          onClick={() => navigate('/admin/trainers/new')}
          style={{
            background: 'var(--accent)',
            color: '#fff',
            border: 'none',
            borderRadius: 8,
            padding: '10px 20px',
            fontFamily: "'JetBrains Mono', monospace",
            fontSize: 12,
            fontWeight: 600,
            cursor: 'pointer',
          }}
        >
          + Novo Trainer
        </button>
      </div>

      {trainers.length === 0 ? (
        <div className="glass-card" style={{ borderRadius: 12, padding: 32, textAlign: 'center', color: 'var(--fg-2)' }}>
          Nenhum trainer cadastrado ainda.
        </div>
      ) : (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
          {trainers.map((trainer) => (
            <div
              key={trainer.id}
              className="glass-card"
              style={{ borderRadius: 12, padding: '14px 16px', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}
            >
              <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
                <div style={{
                  width: 36, height: 36, borderRadius: 8,
                  background: 'var(--accent-muted)',
                  display: 'flex', alignItems: 'center', justifyContent: 'center',
                  fontFamily: "'Outfit', sans-serif", fontWeight: 800, fontSize: 16,
                  color: 'var(--accent)',
                }}>
                  {trainer.full_name.charAt(0).toUpperCase()}
                </div>
                <div>
                  <div style={{ fontWeight: 600, fontSize: 14 }}>{trainer.full_name}</div>
                  <div style={{ fontSize: 12, color: 'var(--fg-2)' }}>
                    {trainer.email} · {studentCounts[trainer.id] ?? 0} aluno(s)
                  </div>
                </div>
              </div>
              <button
                onClick={() => handleDeactivate(trainer.id)}
                style={{
                  background: 'transparent',
                  border: '1px solid var(--border)',
                  borderRadius: 6,
                  padding: '6px 12px',
                  fontSize: 11,
                  color: 'var(--danger)',
                  cursor: 'pointer',
                  fontFamily: "'JetBrains Mono', monospace",
                }}
              >
                Desativar
              </button>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}
```

- [ ] **Passo 2: Commit**

```bash
git add src/pages/admin/TrainersAdminPage.tsx
git commit -m "feat(admin): página de gestão de trainers (/admin/trainers)"
```

---

## Tarefa 7 — TrainerFormPage

**Arquivo:**
- Criar: `src/pages/admin/TrainerFormPage.tsx`

### Atenção sobre criação de trainers
Criar um usuário com `role='trainer'` exige a `service_role key` do Supabase, que não pode ficar no frontend. A solução desta tarefa usa o fluxo de 2 etapas: `signUp` padrão → promoção via Edge Function `promote-to-trainer`. A Edge Function precisa ser criada no painel do Supabase separadamente (fora do escopo desta tarefa de frontend).

---

- [ ] **Passo 1: Criar `src/pages/admin/TrainerFormPage.tsx`**

```tsx
import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { supabase } from '../../lib/supabase'

export function TrainerFormPage() {
  const navigate = useNavigate()
  const [fullName, setFullName] = useState('')
  const [email, setEmail] = useState('')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [success, setSuccess] = useState(false)

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setError(null)
    setLoading(true)

    try {
      // 1. Cria a conta no Supabase Auth
      const { data: signUpData, error: signUpError } = await supabase.auth.signUp({
        email,
        password: crypto.randomUUID(), // senha temporária — trainer deve redefinir via magic link
        options: { data: { full_name: fullName } },
      })

      if (signUpError) throw signUpError
      if (!signUpData.user) throw new Error('Usuário não criado')

      // 2. Chama Edge Function para promover para trainer
      const { error: promoteError } = await supabase.functions.invoke('promote-to-trainer', {
        body: { userId: signUpData.user.id },
      })

      if (promoteError) throw promoteError

      setSuccess(true)
      setTimeout(() => navigate('/admin/trainers'), 2000)
    } catch (e: unknown) {
      setError(e instanceof Error ? e.message : 'Erro ao criar trainer')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div style={{ padding: 24, maxWidth: 480 }}>
      <div style={{ marginBottom: 24 }}>
        <div style={{ fontFamily: "'JetBrains Mono', monospace", fontSize: 9, color: 'var(--fg-3)', letterSpacing: '0.15em', textTransform: 'uppercase', marginBottom: 4 }}>
          Trainers
        </div>
        <h1 className="gradient-text" style={{ fontFamily: "'Outfit', sans-serif", fontWeight: 800, fontSize: 24, margin: 0 }}>
          Novo Trainer
        </h1>
      </div>

      {success ? (
        <div className="glass-card" style={{ borderRadius: 12, padding: 24, color: 'var(--success)', textAlign: 'center' }}>
          ✓ Trainer criado com sucesso! Redirecionando...
        </div>
      ) : (
        <form onSubmit={handleSubmit} className="glass-card" style={{ borderRadius: 12, padding: 24, display: 'flex', flexDirection: 'column', gap: 16 }}>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
            <label style={{ fontSize: 12, color: 'var(--fg-2)', fontFamily: "'JetBrains Mono', monospace" }}>
              Nome completo
            </label>
            <input
              value={fullName}
              onChange={(e) => setFullName(e.target.value)}
              required
              placeholder="Ex: João Silva"
              style={{
                background: 'var(--surface)',
                border: '1px solid var(--border-md)',
                borderRadius: 8,
                padding: '10px 12px',
                color: 'var(--fg)',
                fontSize: 14,
                outline: 'none',
              }}
            />
          </div>

          <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
            <label style={{ fontSize: 12, color: 'var(--fg-2)', fontFamily: "'JetBrains Mono', monospace" }}>
              E-mail
            </label>
            <input
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
              placeholder="trainer@email.com"
              style={{
                background: 'var(--surface)',
                border: '1px solid var(--border-md)',
                borderRadius: 8,
                padding: '10px 12px',
                color: 'var(--fg)',
                fontSize: 14,
                outline: 'none',
              }}
            />
          </div>

          {error && (
            <div style={{ color: 'var(--danger)', fontSize: 13, padding: '8px 12px', background: 'rgba(248,113,113,0.08)', borderRadius: 6 }}>
              {error}
            </div>
          )}

          <div style={{ display: 'flex', gap: 8, marginTop: 8 }}>
            <button
              type="button"
              onClick={() => navigate('/admin/trainers')}
              style={{
                flex: 1, padding: '10px', borderRadius: 8,
                background: 'transparent', border: '1px solid var(--border-md)',
                color: 'var(--fg-2)', cursor: 'pointer', fontSize: 13,
                fontFamily: "'JetBrains Mono', monospace",
              }}
            >
              Cancelar
            </button>
            <button
              type="submit"
              disabled={loading}
              style={{
                flex: 2, padding: '10px', borderRadius: 8,
                background: 'var(--accent)', border: 'none',
                color: '#fff', cursor: loading ? 'not-allowed' : 'pointer',
                fontSize: 13, fontWeight: 600,
                fontFamily: "'JetBrains Mono', monospace",
                opacity: loading ? 0.7 : 1,
              }}
            >
              {loading ? 'Criando...' : 'Criar Trainer'}
            </button>
          </div>
        </form>
      )}
    </div>
  )
}
```

- [ ] **Passo 2: Commit**

```bash
git add src/pages/admin/TrainerFormPage.tsx
git commit -m "feat(admin): formulário de criação de trainer (/admin/trainers/new)"
```

---

## Tarefa 8 — WorkoutsAdminPage filtrada por trainer

**Arquivo:**
- Modificar: `src/pages/admin/WorkoutsAdminPage.tsx`

### O que muda
Quando o usuário logado é `trainer` (não super_admin), a página deve carregar apenas os alunos vinculados a ele. O RLS já garante isso no banco — a mudança aqui é visual: mostrar o título certo e não exibir alunos de outros trainers.

---

- [ ] **Passo 1: Atualizar o import de `useAuth` e ajustar o título**

No início de `WorkoutsAdminPage.tsx`, localizar onde `isAdmin` é usado e substituir pelo `isManager`/`isSuperAdmin` correto. Localizar o título da página e ajustar:

```tsx
// Antes (linha ~20):
const { profile, isAdmin } = useAuth()

// Depois:
const { profile, isSuperAdmin, isManager } = useAuth()
```

Localizar onde o título é renderizado e trocar:
```tsx
// Antes:
<h1>Fichas de Treino</h1>

// Depois:
<h1 className="gradient-text" style={{ fontFamily: "'Outfit', sans-serif", fontWeight: 800, fontSize: 24, margin: 0 }}>
  {isSuperAdmin ? 'Todas as Fichas' : 'Fichas dos Meus Alunos'}
</h1>
```

- [ ] **Passo 2: Verificar build**

```bash
npm run build
```

Esperado: sem erros de TypeScript.

- [ ] **Passo 3: Testar no browser**

Logar como super_admin em modo Gestão → `/admin/workouts` deve mostrar "Todas as Fichas".

- [ ] **Passo 4: Commit**

```bash
git add src/pages/admin/WorkoutsAdminPage.tsx
git commit -m "feat(admin): workouts page — título adapta para papel do usuário"
```

---

## Tarefa 9 — Build final e checklist

- [ ] **Passo 1: Build completo sem erros**

```bash
npm run build
```

Esperado: saída sem erros. Warnings de lint são aceitáveis.

- [ ] **Passo 2: Checklist de critérios da spec**

Testar no browser em `http://localhost:5173`:

- [ ] Super_admin vê o toggle "Gestão / Meu Treino" na sidebar
- [ ] Em modo Gestão: links Fichas + Trainers aparecem
- [ ] Em modo Meu Treino: links de aluno aparecem (Treino, Histórico, Progresso, Medidas)
- [ ] `/admin/trainers` carrega sem erro (lista vazia se nenhum trainer criado ainda)
- [ ] `/admin/trainers/new` exibe o formulário
- [ ] Aluno (`user`) não vê o toggle — navegação igual à original
- [ ] Preferência de modo persiste ao recarregar a página

- [ ] **Passo 3: Commit final**

```bash
git add -A
git commit -m "feat: roles multi-trainer completo — super_admin, trainer, user + toggle Gestão/Meu Treino"
```

---

## Nota: Edge Function `promote-to-trainer`

A criação de trainer via `TrainerFormPage` depende de uma Edge Function no Supabase que ainda não foi criada. Enquanto ela não existir, o formulário vai retornar erro na etapa 2. Para testar antes disso, o super_admin pode promover um usuário manualmente no banco:

```sql
UPDATE profiles SET role = 'trainer' WHERE email = 'trainer@email.com';
```

A Edge Function será implementada em tarefa separada quando a Fase 9 (Painel Admin completo) for iniciada.
