# MUSCLE TRAINING — Documento de Requisitos do Produto (PRD)

**Versão:** 1.2  
**Criado em:** 22 de maio de 2026  
**Atualizado em:** 25 de maio de 2026  
**Autor:** Denis Rodrigues  
**Status:** Em execução 🚧

---

## Histórico de versões

| Versão | Data | Mudança |
|--------|------|---------|
| 1.0 | 22/05/2026 | Documento inicial aprovado |
| 1.1 | 23/05/2026 | Design system v2 "Nova" aplicado; tema dark/light adicionado |
| 1.2 | 25/05/2026 | Fase 5 (Fichas de Treino) concluída; modelo de dados atualizado |

---

## 1. Visão Geral do Produto

**MUSCLE TRAINING** é um aplicativo web progressivo (PWA) de gerenciamento de treinos de musculação, desenvolvido para uso pessoal. O sistema permite que um personal trainer (administrador) cadastre alunos, crie fichas de treino personalizadas, e acompanhe o progresso de cada aluno. Os alunos, por sua vez, registram seus treinos e monitoram sua evolução.

### Problema que resolve
- Fichas de treino em papel se perdem ou ficam difíceis de acompanhar
- Difícil rastrear evolução de carga e repetições ao longo do tempo
- Sem centralização de dados de peso corporal, medidas e alimentação
- Personal trainers sem ferramenta dedicada para gestão de alunos

### Solução
Um app web acessível pelo celular (PWA instalável) que digitaliza todo o processo: da criação da ficha pelo admin até o registro do treino pelo aluno, com histórico completo e análise nutricional por IA.

---

## 2. Usuários e Papéis

### Administrador (Personal Trainer)
- Cadastra e gerencia alunos
- Cria e edita fichas de treino (templates reutilizáveis ou fichas diretas de alunos)
- Atribui fichas aos alunos
- Gerencia biblioteca de exercícios (incluindo criação de exercícios personalizados)
- Visualiza progresso e histórico de todos os alunos

### Usuário (Aluno)
- Visualiza suas fichas de treino (vê destaque da ficha do dia)
- Registra sessões de treino (séries, repetições, carga)
- Registra peso corporal e medidas
- Registra alimentação (com análise de IA)
- Visualiza seu próprio histórico e evolução

---

## 3. Funcionalidades por Módulo

### 3.1 Autenticação ✅
- Login com e-mail e senha (via Supabase Auth)
- Registro de novos usuários (apenas admin pode criar alunos — Fase 9)
- Sessão persistente (lembrar login)
- Proteção de rotas por papel (admin vs. usuário)
- Logout

### 3.2 Perfil do Usuário ✅
- Nome completo, e-mail, foto de perfil
- Dados físicos: peso atual, altura, data de nascimento, gênero
- Objetivo pessoal (campo de texto livre)
- Peso alvo
- Ativação/desativação de conta (apenas admin — Fase 9)

### 3.3 Biblioteca de Exercícios ✅ (parcial)
- Lista de 39+ exercícios pré-cadastrados em `exercise_library`
- Filtro por grupo muscular (11 grupos)
- Campos: nome, grupo muscular, descrição, URL de vídeo/imagem
- **Admin pode criar exercícios personalizados** diretamente no modal de busca (Fase 5)
- Página dedicada de gerenciamento: Fase 9

### 3.4 Fichas de Treino ✅
- **Dois tipos de ficha:**
  - Template (`is_template = true`): na biblioteca do admin, reutilizável para múltiplos alunos
  - Ficha do aluno (`is_template = false`): atribuída a um aluno específico, pode ter `template_id` apontando para a origem
- Cada ficha tem: nome, descrição, dias da semana, lista de exercícios
- Cada exercício na ficha tem: séries, repetições (suporta range "8-12"), carga sugerida em kg, descanso em segundos, observações, ordem
- **Dois fluxos de criação para o admin:**
  - Via Biblioteca: cria template → atribui a alunos via modal
  - Via Perfil do Aluno: cria diretamente vinculada ao aluno (antecipado na Fase 5, expandido na Fase 9)
- **Visão do aluno:** ficha do dia em destaque (detectada pelo dia da semana) + lista das outras fichas
- Admin pode editar e desativar fichas (soft delete: `is_active = false`)

### 3.5 Registro de Treino (Execução) ⏳ Fase 6
- Aluno seleciona uma ficha para treinar
- Interface de treino ativa: lista de exercícios com campos para preencher
- Para cada série: registrar repetições realizadas e carga usada
- Marcar séries como concluídas
- Timer de descanso automático entre séries
- Ao finalizar: registrar dificuldade percebida (Fácil / Médio / Difícil / Destruidor) e observações
- Duração total calculada automaticamente

### 3.6 Histórico e Progressão ⏳ Fase 7
- Lista de todas as sessões realizadas com data, duração e dificuldade
- Detalhe de cada sessão: exercícios com cargas e repetições registradas
- Gráfico de evolução de carga por exercício ao longo do tempo
- Gráfico de frequência de treinos (por semana/mês)

### 3.7 Peso e Medidas Corporais ⏳ Fase 7
- Registro de peso com data (histórico completo)
- Gráfico de evolução do peso
- Registro de medidas: cintura, quadril, abdômen, coxa, braço, peitoral, panturrilha
- Histórico de medidas com comparativo entre datas

### 3.8 Diário Nutricional com IA ⏳ Fase 8
- Registro de refeições por tipo (café, almoço, lanche, jantar, pré/pós-treino)
- Descrição livre do que foi consumido
- Campos opcionais: calorias, proteínas, carboidratos, gorduras
- Análise por IA (Google Gemini): feedback automático sobre a refeição
- Histórico de refeições por dia

### 3.9 Painel Administrativo ⏳ Fase 9
- Lista de todos os alunos cadastrados com status
- Criar novo aluno (nome, e-mail, senha inicial)
- Ver perfil e histórico de qualquer aluno
- Atribuir / alterar fichas de treino de um aluno
- Página de gerenciamento da biblioteca de exercícios
- Estatísticas gerais: total de alunos, treinos realizados, etc.

---

## 4. Requisitos Não-Funcionais

### Performance
- Carregamento inicial < 3 segundos (rede 4G)
- Navegação entre páginas instantânea (SPA)
- Otimização de imagens e assets

### Segurança
- Autenticação obrigatória para todas as rotas (exceto login)
- RLS (Row Level Security) no banco: cada usuário vê apenas seus dados
- Admin tem acesso global
- Credenciais nunca expostas no frontend (variáveis de ambiente)
- Soft delete em todos os registros (`is_active = false`)
- HTTPS obrigatório em produção

### Usabilidade (Mobile-First)
- Design responsivo — funciona bem em celular, tablet e desktop
- Interface com tema dark (padrão) e light (toggle no header)
- Fonte e botões grandes o suficiente para toque no celular
- Navegação intuitiva sem necessidade de tutorial

### PWA
- Instalável na tela inicial do celular (Android e iOS)
- Ícone personalizado
- Tela de splash

---

## 5. Stack Tecnológica

| Camada | Tecnologia |
|--------|-----------|
| Frontend | React 19 + TypeScript + Vite 6 |
| Estilo | Tailwind CSS v4 + Design System v2 "Nova" |
| Roteamento | React Router v7 |
| Animações | Motion (Framer Motion) v11 |
| Formulários | React Hook Form + Zod |
| Gráficos | Recharts (Fase 7) |
| Ícones | Lucide React |
| Backend/DB | Supabase (PostgreSQL + Auth + Storage) |
| IA | Google Gemini API (Fase 8) |
| Hospedagem | Vercel (Fase 11) |

---

## 6. Modelo de Dados

| Tabela | Descrição | Status |
|--------|-----------|--------|
| `profiles` | Dados dos usuários (alunos e admin) | ✅ |
| `exercise_library` | Catálogo de exercícios (39 pré-cadastrados + personalizados) | ✅ |
| `workouts` | Fichas de treino — `is_template` distingue biblioteca de fichas de alunos | ✅ |
| `workout_exercises` | Exercícios de cada ficha (séries, reps, carga, descanso, obs, ordem) | ✅ |
| `workout_logs` | Sessões de treino realizadas | ✅ (estrutura) |
| `exercise_logs` | Séries registradas por sessão | ✅ (estrutura) |
| `user_weights` | Histórico de peso corporal | ✅ (estrutura) |
| `body_measurements` | Medidas corporais | ✅ (estrutura) |
| `nutrition_logs` | Diário alimentar | ✅ (estrutura) |

> Tabelas marcadas com "estrutura" existem no banco mas ainda não têm interface implementada.

---

## 7. Design e Tema Visual

### Design System v2 "Nova" ✅
- **Paleta dark:** fundo `#05050a`, superfície `#0e0e16`, acento `#c8f04a` (verde-limão)
- **Paleta light:** fundo `#f5f4ee`, superfície `#eceae2`, acento `#5a9400`
- **Tema:** Dark (padrão) com toggle para Light — preferência salva em `localStorage`
- **Tipografia:** Syne 800 (display/títulos) + DM Mono 300 (corpo/mono/labels)
- **Linguagem visual:** editorial, técnico, atlético — comentários de código `// assim` como elementos de UI
- **Efeitos:** noise texture no background, orb glow animado com a cor de acento

---

## 8. Critérios de Sucesso (MVP)

1. ✅ Admin consegue criar uma ficha de treino e atribuir a um aluno
2. ✅ Aluno consegue fazer login e visualizar sua ficha
3. ⏳ Aluno consegue registrar um treino completo (Fase 6)
4. ⏳ Histórico de treinos é exibido corretamente (Fase 7)
5. ⏳ Aluno consegue registrar peso e ver o gráfico de evolução (Fase 7)
6. ⏳ App é instalável como PWA no celular (Fase 10)

---

## 9. Fora do Escopo (por ora)

- App nativo (iOS/Android) — apenas PWA
- Pagamentos / assinaturas
- Chat entre admin e aluno
- Integração com smartwatch ou wearables
- Planos de treino com periodização automática por IA
- Export de dados para PDF

---

*Documento criado por Denis Rodrigues em 22/05/2026 — última atualização: 25/05/2026*
