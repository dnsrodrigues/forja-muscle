# MUSCTRAINIG — Guia para o Claude Code

## O que é este projeto

MUSCTRAINIG é um aplicativo web progressivo (PWA) de gerenciamento de treinos de musculação. O sistema tem dois tipos de usuário:

- **Admin (Personal Trainer)** — cria fichas de treino, cadastra alunos, acompanha progresso de todos
- **Usuário (Aluno)** — visualiza suas fichas, registra treinos, acompanha sua própria evolução

O app roda no navegador e pode ser instalado no celular como um app normal (PWA).

## Documentos de referência

- `docs/superpowers/specs/2026-05-22-musctrainig-prd.md` — PRD completo (requisitos do produto)
- `docs/superpowers/specs/2026-05-22-musctrainig-plano-implementacao.md` — Plano de 11 fases com checklist de progresso

Toda decisão de funcionalidade deve ser validada contra o PRD. Não implementar nada fora do escopo sem confirmar com o usuário.

## Stack tecnológica

- **React 19** com TypeScript (interface do usuário)
- **Vite 6** (build e servidor de desenvolvimento)
- **Tailwind CSS v4** — configurado como plugin do Vite, sem `tailwind.config.js`; apenas `@import "tailwindcss"` no CSS
- **React Router v7** (navegação entre páginas)
- **Motion v11** (animações — antigo Framer Motion)
- **React Hook Form + Zod** (formulários e validação)
- **Recharts** (gráficos de evolução)
- **Lucide React** (ícones)
- **Supabase** (banco PostgreSQL + autenticação + storage)
- **Google Gemini API** (análise nutricional por IA)
- **Vercel** (hospedagem — planejado)

## Estrutura de arquivos

```
src/
  components/
    layout/          — Layout geral (sidebar, header, rotas protegidas)
    ui/              — Componentes reutilizáveis (Button, Input, Card, etc.)
  context/           — Contextos React (AuthContext, etc.)
  hooks/             — Hooks customizados
  lib/
    supabase.ts      — Cliente Supabase (usa variáveis de ambiente)
  pages/             — Páginas da aplicação
    admin/           — Páginas exclusivas do admin
  services/          — Funções de acesso ao banco (Supabase queries)
  types/
    index.ts         — Todos os tipos TypeScript do projeto
  App.tsx            — Componente raiz com rotas
  index.css          — Tailwind + tema dark customizado
  main.tsx           — Ponto de entrada
supabase-setup.sql   — Script SQL completo para criar o banco
docs/
  superpowers/specs/ — PRD e plano de implementação
```

## Banco de dados (9 tabelas)

| Tabela | Descrição |
| :--- | :--- |
| `profiles` | Perfis dos usuários (criado automaticamente no cadastro) |
| `exercise_library` | Catálogo de exercícios (39 pré-cadastrados) |
| `workouts` | Fichas de treino |
| `workout_exercises` | Exercícios de cada ficha (séries, reps, carga) |
| `workout_logs` | Sessões de treino realizadas |
| `exercise_logs` | Séries individuais registradas em cada sessão |
| `user_weights` | Histórico de peso corporal |
| `body_measurements` | Medidas corporais (cintura, quadril, etc.) |
| `nutrition_logs` | Diário alimentar com feedback de IA |

RLS (Row Level Security) está ativo em todas as tabelas. Cada usuário vê apenas seus próprios dados. Admin vê tudo.

## Como se comunicar com o usuário

- **Sempre em português brasileiro**
- Explicar cada passo como se o usuário tivesse 15 anos — sem jargões desnecessários
- Quando um termo técnico for inevitável, explicar o que significa na mesma frase
- Antes de executar qualquer coisa: dizer o que vai ser feito e por quê
- Depois de executar: confirmar o que foi feito em linguagem simples
- Nunca assumir que o usuário conhece termos como: schema, RLS, deploy, commit, hook, build, migration, endpoint, etc.

## Boas práticas obrigatórias

### Código
- TypeScript em tudo — nunca JavaScript puro
- Componentes funcionais com interface de props tipada
- Validar todos os formulários com Zod
- Nunca salvar credenciais no código — usar `.env` (que está no `.gitignore`)
- Componentes reutilizáveis em `src/components/ui/`
- Lógica de banco em `src/services/`
- Tipos centralizados em `src/types/index.ts`

### Tailwind CSS v4
- Não existe `tailwind.config.js` — as cores customizadas ficam no `src/index.css` dentro de `@theme {}`
- Cores do tema:
  - Fundo principal: `#0f0f0f`
  - Superfície (cards): `#1a1a1a`
  - Cor primária (laranja): `#f97316` → usar `bg-orange-500` ou `text-orange-500`
  - Bordas sutis: `border-white/10`
  - Texto secundário: `text-gray-400`

### Banco de dados (Supabase)
- RLS ativo em todas as tabelas — nunca desativar
- Sempre verificar erros nas queries: `const { data, error } = await supabase...`
- Nunca excluir registros fisicamente — usar `is_active = false` quando aplicável
- O arquivo `.env` tem as credenciais reais e NUNCA deve ser commitado no git

### Segurança
- O arquivo `.env` está no `.gitignore` — confirmar antes de qualquer commit
- Credenciais nunca vão para o repositório
- Usar `.env.example` como template público (sem valores reais)

## Variáveis de ambiente

```
VITE_SUPABASE_URL=https://xfcblbdwaibpzcpwzkow.supabase.co
VITE_SUPABASE_ANON_KEY=sb_publishable_...
VITE_GEMINI_API_KEY=...
```

O arquivo `.env` existe localmente mas não está no git. O `.env.example` é o template commitado.

## Status das fases

| Fase | Descrição | Status |
| :--- | :--- | :--- |
| 1 | Fundação (estrutura, dependências, configuração) | ✅ Completo |
| 2 | Banco de dados (Supabase: tabelas, RLS, seed) | 🚧 Em andamento |
| 3 | Autenticação (login, logout, rotas protegidas) | ⏳ Pendente |
| 4 | Perfil do usuário | ⏳ Pendente |
| 5 | Fichas de treino (CRUD admin + visualização aluno) | ⏳ Pendente |
| 6 | Execução de treino (registro de séries, timer) | ⏳ Pendente |
| 7 | Histórico e progressão (gráficos) | ⏳ Pendente |
| 8 | Nutrição + IA (diário alimentar, Gemini) | ⏳ Pendente |
| 9 | Painel admin (gestão de alunos) | ⏳ Pendente |
| 10 | Polish + PWA (ícones, animações, otimizações) | ⏳ Pendente |
| 11 | Deploy (Vercel) | ⏳ Pendente |

## Escopo do MVP (o que ESTÁ incluído)

- Autenticação com e-mail e senha
- Cadastro de alunos pelo admin
- Biblioteca de exercícios (39 pré-cadastrados + admin gerencia)
- Fichas de treino personalizadas por aluno
- Registro de treinos com séries, repetições e carga
- Timer de descanso entre séries
- Histórico de treinos com gráficos de evolução
- Registro de peso corporal e medidas com gráficos
- Diário nutricional com análise por IA (Gemini)
- Painel administrativo para o personal trainer
- PWA instalável no celular

## Fora do MVP (não implementar agora)

- App nativo iOS/Android
- Pagamentos ou assinaturas
- Chat entre admin e aluno
- Integração com smartwatch ou wearables
- Planos de treino com periodização automática por IA
- Recuperação de senha por e-mail
- Export de dados para PDF
- QR Code de exercícios
