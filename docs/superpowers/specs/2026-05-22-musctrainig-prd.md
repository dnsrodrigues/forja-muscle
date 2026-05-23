# MUSCTRAINIG — Documento de Requisitos do Produto (PRD)

**Versão:** 1.0  
**Data:** 22 de maio de 2026  
**Autor:** Denis Rodrigues  
**Status:** Aprovado ✅

---

## 1. Visão Geral do Produto

**MUSCTRAINIG** é um aplicativo web progressivo (PWA) de gerenciamento de treinos de musculação, desenvolvido para uso pessoal. O sistema permite que um personal trainer (administrador) cadastre alunos, crie fichas de treino personalizadas, e acompanhe o progresso de cada aluno. Os alunos, por sua vez, registram seus treinos e monitoram sua evolução.

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
- Cria e edita fichas de treino
- Atribui fichas aos alunos
- Visualiza progresso e histórico de todos os alunos
- Gerencia biblioteca de exercícios

### Usuário (Aluno)
- Visualiza suas fichas de treino
- Registra sessões de treino (séries, repetições, carga)
- Registra peso corporal e medidas
- Registra alimentação (com análise de IA)
- Visualiza seu próprio histórico e evolução

---

## 3. Funcionalidades por Módulo

### 3.1 Autenticação
- Login com e-mail e senha (via Supabase Auth)
- Registro de novos usuários (apenas admin pode criar alunos)
- Sessão persistente (lembrar login)
- Proteção de rotas por papel (admin vs. usuário)
- Logout

### 3.2 Perfil do Usuário
- Nome completo, e-mail, foto de perfil
- Dados físicos: peso atual, altura, data de nascimento, gênero
- Objetivo pessoal (campo de texto livre)
- Peso alvo
- Ativação/desativação de conta (apenas admin)

### 3.3 Biblioteca de Exercícios
- Lista de exercícios pré-cadastrados (39 exercícios iniciais)
- Filtro por grupo muscular
- Campos: nome, grupo muscular, descrição, URL de vídeo/imagem
- Admin pode adicionar, editar e remover exercícios
- Grupos musculares: Peito, Costas, Pernas, Ombros, Bíceps, Tríceps, Abdômen, Antebraço, Trapézio, Glúteos, Panturrilha

### 3.4 Fichas de Treino
- Admin cria fichas e atribui a alunos específicos
- Cada ficha tem: nome, descrição, dias da semana sugeridos, lista de exercícios
- Cada exercício na ficha tem: séries, repetições (pode ser range: "8-12"), carga sugerida, descanso em segundos, observações, ordem
- Admin pode editar e desativar fichas
- Aluno pode visualizar suas fichas (somente leitura)

### 3.5 Registro de Treino (Execução)
- Aluno seleciona uma ficha para treinar
- Interface de treino ativa: lista de exercícios com campos para preencher
- Para cada série: registrar repetições realizadas e carga usada
- Marcar séries como concluídas
- Timer de descanso automático entre séries
- Ao finalizar: registrar dificuldade percebida (Fácil / Médio / Difícil / Destruidor) e observações gerais
- Duração total do treino calculada automaticamente

### 3.6 Histórico e Progressão
- Lista de todas as sessões realizadas com data, duração e dificuldade
- Detalhe de cada sessão: todos os exercícios com cargas e repetições registradas
- Gráfico de evolução de carga por exercício ao longo do tempo
- Gráfico de frequência de treinos (por semana/mês)

### 3.7 Peso e Medidas Corporais
- Registro de peso com data (histórico completo)
- Gráfico de evolução do peso
- Registro de medidas corporais: cintura, quadril, abdômen, coxa, braço, peitoral, panturrilha
- Histórico de medidas com comparativo entre datas

### 3.8 Diário Nutricional com IA
- Registro de refeições por tipo (café, almoço, lanche, jantar, pré/pós-treino)
- Descrição livre do que foi consumido
- Campos opcionais: calorias, proteínas, carboidratos, gorduras
- Análise por IA (Google Gemini): feedback automático sobre a refeição registrada
- Histórico de refeições por dia

### 3.9 Painel Administrativo
- Lista de todos os alunos cadastrados com status
- Criar novo aluno (nome, e-mail, senha inicial)
- Ver perfil e histórico de qualquer aluno
- Atribuir / alterar fichas de treino de um aluno
- Estatísticas gerais: total de alunos, treinos realizados, etc.

---

## 4. Requisitos Não-Funcionais

### Performance
- Carregamento inicial < 3 segundos (rede 4G)
- Navegação entre páginas instantânea (SPA)
- Otimização de imagens e assets

### Segurança
- Autenticação obrigatória para todas as rotas
- RLS (Row Level Security) no banco: cada usuário vê apenas seus dados
- Admin tem acesso global
- Credenciais nunca expostas no frontend (variáveis de ambiente)
- HTTPS obrigatório em produção

### Usabilidade (Mobile-First)
- Design responsivo — funciona bem em celular, tablet e desktop
- Interface dark mode (tema escuro padrão)
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
| Estilo | Tailwind CSS 4 (dark theme customizado) |
| Roteamento | React Router v7 |
| Animações | Motion (Framer Motion) v11 |
| Formulários | React Hook Form + Zod |
| Gráficos | Recharts |
| Ícones | Lucide React |
| Backend/DB | Supabase (PostgreSQL + Auth + Storage) |
| IA | Google Gemini API |
| Hospedagem | Vercel (previsto) |

---

## 6. Modelo de Dados (Resumo)

| Tabela | Descrição |
|--------|-----------|
| `profiles` | Dados dos usuários (alunos e admin) |
| `exercise_library` | Catálogo de exercícios |
| `workouts` | Fichas de treino |
| `workout_exercises` | Exercícios de cada ficha |
| `workout_logs` | Sessões de treino realizadas |
| `exercise_logs` | Séries registradas por sessão |
| `user_weights` | Histórico de peso corporal |
| `body_measurements` | Medidas corporais |
| `nutrition_logs` | Diário alimentar |

---

## 7. Design e Tema Visual

- **Paleta:** Fundo escuro (#0f0f0f), superfície (#1a1a1a), laranja primário (#f97316)
- **Tema:** Dark mode exclusivo (sem toggle claro/escuro)
- **Linguagem visual:** Moderno, energético, focado em fitness
- **Tipografia:** Sistema (sans-serif nativo do dispositivo)

---

## 8. Critérios de Sucesso (MVP)

1. ✅ Admin consegue criar uma ficha de treino e atribuir a um aluno
2. ✅ Aluno consegue fazer login e visualizar sua ficha
3. ✅ Aluno consegue registrar um treino completo
4. ✅ Histórico de treinos é exibido corretamente
5. ✅ Aluno consegue registrar peso e ver o gráfico de evolução
6. ✅ App é instalável como PWA no celular

---

## 9. Fora do Escopo (por ora)

- App nativo (iOS/Android) — apenas PWA
- Pagamentos / assinaturas
- Chat entre admin e aluno
- Integração com smartwatch ou wearables
- Planos de treino com periodização automática por IA
- Export de dados para PDF

---

*Documento aprovado por Denis Rodrigues em 22/05/2026*
