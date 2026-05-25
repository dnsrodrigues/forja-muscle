# Revisão do Projeto MUSCLE TRAINING — Design da Atualização Documental

**Data:** 22 de maio de 2026  
**Status:** Aprovado ✅  
**Autor:** Denis Rodrigues

---

## Contexto

O projeto avançou além do que os documentos registram. A Fase 3 (Autenticação) está concluída no código mas marcada como pendente no CLAUDE.md e no plano de implementação. Além disso, novas skills foram instaladas no Claude Code e não estão documentadas no fluxo de trabalho.

**Estado real do projeto:**

| Fase | Descrição | Status real |
|------|-----------|-------------|
| 1 | Fundação | ✅ Completa |
| 2 | Banco de dados | 🚧 SQL criado, aguardando execução no Supabase |
| 3 | Autenticação | ✅ Completa |
| 4–11 | Demais fases | ⏳ Pendentes |

---

## O que será feito

### 1. CLAUDE.md — Atualizar e enxugar

**Objetivo:** Tornar o CLAUDE.md um guia operacional enxuto para o Claude, sem duplicar o PRD.

**O que fica:**
- Descrição do projeto (resumida)
- Links para PRD e Plan.md
- Estrutura de arquivos
- Regras de código obrigatórias (TypeScript, Zod, Supabase patterns)
- Configurações do Tailwind v4 (cores, tema)
- Regra de comunicação com o usuário
- **[NOVO]** Seção de skills — quando usar cada uma

**O que sai:**
- Tabela das 9 tabelas do banco (já está no PRD)
- Lista completa da stack (já está no PRD)
- Lista do escopo do MVP (já está no PRD)
- Tabela de status das fases (vai para o Plan.md)

**Seção de skills a adicionar:**

| Quando usar | Skill | Comando |
|-------------|-------|---------|
| Antes de fase complexa (Fichas, Treino, IA, Admin) | Brainstorming | `/brainstorming` |
| Criar componentes visuais | Frontend Design | `/frontend-design` |
| Escrever ou revisar queries no banco | Supabase Best Practices | `/supabase-postgres-best-practices` |
| Confirmar que algo funcionou | Verify | `/verify` |
| Melhorar código após implementar | Simplify | `/simplify` |
| Revisar segurança antes de commit | Security Review | `/security-review` |

---

### 2. Plan.md — Documento central de execução

**Objetivo:** Criar um único documento que substitui o plano de implementação existente, com status real das fases e fluxo de trabalho com skills integradas.

**Estrutura do Plan.md:**

#### Parte 1 — Estado atual
Snapshot honesto de onde o projeto está, com status corrigido.

#### Parte 2 — Roteiro das fases

Para cada fase pendente (2 a 11):
- O que entrega
- Complexidade (define qual skill usar antes de começar)
- Arquivos principais a criar
- Critério de conclusão

**Classificação de complexidade:**

| Fase | Descrição | Complexidade | Skill inicial |
|------|-----------|--------------|---------------|
| 2 | Banco de dados | 🟡 Simples | Direto `/supabase-postgres-best-practices` |
| 4 | Perfil do usuário | 🟡 Simples | Direto `/frontend-design` |
| 5 | Fichas de treino | 🔴 Complexa | `/brainstorming` primeiro |
| 6 | Execução de treino + timer | 🔴 Complexa | `/brainstorming` primeiro |
| 7 | Histórico e gráficos | 🟡 Simples | Direto `/frontend-design` |
| 8 | Nutrição + IA (Gemini) | 🔴 Complexa | `/brainstorming` primeiro |
| 9 | Painel admin | 🔴 Complexa | `/brainstorming` primeiro |
| 10 | Polish + PWA | 🟡 Simples | Direto `/frontend-design` |
| 11 | Deploy (Vercel) | 🟡 Simples | Direto (checklist) |

#### Parte 3 — Fluxo de trabalho padrão

```
FASE SIMPLES:
  /frontend-design (ou skill específica) → implementar → /verify → /simplify → commit

FASE COMPLEXA:
  /brainstorming → design aprovado → implementar → /verify → /simplify → /security-review → commit
```

---

## Critério de sucesso

- CLAUDE.md: menor, sem duplicatas, com seção de skills
- Plan.md: status correto, fluxo de skills por fase, critérios de conclusão por fase
- Plano de implementação antigo (`2026-05-22-MUSCLE TRAINING-plano-implementacao.md`): mantido como referência histórica, sem alterações

---

*Design aprovado por Denis Rodrigues em 22/05/2026*
