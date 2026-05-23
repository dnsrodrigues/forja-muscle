# MUSCTRAINIG — Guia Operacional para o Claude Code

## O que é este projeto

MUSCTRAINIG é um PWA (app web instalável no celular) de gerenciamento de treinos de musculação. Dois tipos de usuário: **Admin (Personal Trainer)** que cria fichas e gerencia alunos, e **Aluno** que registra treinos e acompanha evolução.

> Documentação completa: [PRD](docs/superpowers/specs/2026-05-22-musctrainig-prd.md) | [Plan.md](Plan.md)  
> Toda decisão de funcionalidade deve ser validada contra o PRD. Não implementar nada fora do escopo sem confirmar com o usuário.

---

## Como se comunicar com o usuário

- **Sempre em português brasileiro**
- Explicar como se o usuário tivesse 15 anos — sem jargões
- Quando um termo técnico for inevitável, explicar o que significa na mesma frase
- Antes de executar qualquer coisa: dizer o que vai ser feito e por quê
- Depois de executar: confirmar o que foi feito em linguagem simples
- Nunca assumir que o usuário conhece: schema, RLS, deploy, commit, hook, build, migration, endpoint

---

## Skills disponíveis

| Quando usar | Skill | Comando |
|-------------|-------|---------|
| Antes de fase **complexa** (Fichas, Treino, IA, Admin) | Brainstorming | `/brainstorming` |
| Criar ou melhorar componentes visuais | Frontend Design | `/frontend-design` |
| Escrever ou revisar queries no banco | Supabase Best Practices | `/supabase-postgres-best-practices` |
| Confirmar que uma mudança funcionou | Verify | `/verify` |
| Melhorar código após implementar | Simplify | `/simplify` |
| Revisar segurança antes de commit importante | Security Review | `/security-review` |

**Fluxo para fase simples:** `/frontend-design` → implementar → `/verify` → `/simplify` → commit  
**Fluxo para fase complexa:** `/brainstorming` → design aprovado → implementar → `/verify` → `/simplify` → `/security-review` → commit

---

## Estrutura de arquivos

```
src/
  components/
    layout/     — ProtectedRoute, AdminRoute, Sidebar, Header
    ui/         — Button, Input, Card e outros componentes reutilizáveis
  context/      — AuthContext e outros contextos React
  hooks/        — Hooks customizados
  lib/
    supabase.ts — Cliente Supabase (usa variáveis de ambiente)
  pages/
    admin/      — Páginas exclusivas do admin
  services/     — Funções de acesso ao banco (Supabase queries)
  types/
    index.ts    — Todos os tipos TypeScript do projeto
  App.tsx       — Componente raiz com rotas
  index.css     — Tailwind + tema dark customizado
  main.tsx      — Ponto de entrada
supabase-setup.sql — Script SQL completo para criar o banco
Plan.md            — Roteiro de fases + fluxo de trabalho
```

---

## Regras de código obrigatórias

### TypeScript
- TypeScript em tudo — nunca JavaScript puro
- Componentes funcionais com interface de props tipada
- Tipos centralizados em `src/types/index.ts`

### Formulários
- Validar todos os formulários com Zod + React Hook Form

### Supabase
- Lógica de banco sempre em `src/services/`
- Sempre verificar erros: `const { data, error } = await supabase...`
- RLS ativo em todas as tabelas — nunca desativar
- Nunca excluir registros fisicamente — usar `is_active = false`

### Componentes
- Reutilizáveis em `src/components/ui/`
- Um componente por arquivo, export nomeado

### Segurança
- Credenciais nunca no código — usar `.env` (gitignored)
- Confirmar que `.env` não vai no commit antes de qualquer push

---

## Tailwind CSS v4

Não existe `tailwind.config.js`. Cores customizadas ficam em `src/index.css` dentro de `@theme {}`.

| Uso | Classe / Valor |
|-----|---------------|
| Fundo principal | `bg-[#05050a]` |
| Superfície (cards) | `bg-[#0e0e16]` |
| Cor primária (verde-limão `#c8f04a`) | `bg-orange-500` / `text-orange-500` ¹ |
| Texto sobre fundo lime | `text-[#05050a]` (escuro — lime é claro!) |
| Bordas sutis | `border-white/10` |
| Texto secundário | `text-gray-400` |

> ¹ `orange-500` foi sobrescrito no `@theme {}` do `index.css` para apontar para `#c8f04a`. Use as classes `orange-*` normalmente — elas já são lime.

---

## Variáveis de ambiente

```
VITE_SUPABASE_URL=https://xfcblbdwaibpzcpwzkow.supabase.co
VITE_SUPABASE_ANON_KEY=sb_publishable_...
VITE_GEMINI_API_KEY=...
```

O `.env` existe localmente mas **nunca vai para o git**. O `.env.example` é o template commitado.
