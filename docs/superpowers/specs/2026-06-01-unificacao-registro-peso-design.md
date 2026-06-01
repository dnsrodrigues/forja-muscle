# Unificação do Registro de Peso Corporal

**Data:** 01 de junho de 2026  
**Status:** Aprovado ✅  
**Autor:** Denis Rodrigues

---

## 1. Problema

O peso corporal está sendo registrado em dois lugares:

| Local | Tabela | Uso |
|-------|--------|-----|
| `/perfil` → campo "Peso Atual (KG)" | `profiles.weight` | Cálculo de metas de nutrição (Harris-Benedict) |
| `/medidas` → "Registrar Peso" | `user_weights` | Histórico + gráfico de evolução |

Resultado: os dois ficam fora de sincronia (perfil dizia 84 kg mas histórico estava vazio). O aluno não sabe onde registrar.

---

## 2. Solução

**Fonte única:** o peso é registrado **apenas em `/medidas`**.  
Quando salvo lá, automaticamente atualiza também `profiles.weight`.  
No perfil, o campo vira somente-leitura.

---

## 3. Mudanças técnicas

### 3.1 `src/pages/MeasurementsPage.tsx`

Na função `handleWeightSave` (que já salva em `user_weights`), adicionar uma chamada para sincronizar o perfil:

```typescript
// Depois de salvar em user_weights:
await updateProfile(profile!.id, { weight: weightKg })
await refreshProfile()   // atualiza o AuthContext
```

Imports a adicionar:
- `updateProfile` de `'../services/profile.service'`
- `useAuth` já está importado — adicionar `refreshProfile` à desestruturação

### 3.2 `src/pages/ProfilePage.tsx`

O campo "Peso Atual (KG)" passa a ser somente-leitura:

```tsx
<div>
  <div className="label-sm">Peso atual (kg)</div>
  <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
    <span style={{ fontFamily: 'var(--f-mono)', fontSize: 18, color: 'var(--accent)' }}>
      {profile?.weight ? `${profile.weight} kg` : '—'}
    </span>
    <Link to="/medidas" style={{ fontFamily: 'var(--f-mono)', fontSize: 10,
      color: 'var(--text-faint)', textDecoration: 'none', letterSpacing: '0.1em' }}>
      Registrar em Medidas →
    </Link>
  </div>
</div>
```

O campo `weight` é removido do objeto enviado ao `updateProfile` no submit do formulário.

---

## 4. O que NÃO muda

- Banco de dados — sem migrations
- `user_weights` continua sendo a tabela de histórico
- `profiles.weight` continua sendo lido para cálculo de metas de nutrição
- `WeightEntryModal` não muda (só quem o chama ganha a sincronização)

---

## 5. Arquivos afetados

| Arquivo | Mudança |
|---------|---------|
| `src/pages/MeasurementsPage.tsx` | Após salvar peso, chamar `updateProfile` + `refreshProfile` |
| `src/pages/ProfilePage.tsx` | Campo peso → somente-leitura com link para `/medidas` |

---

## 6. Critérios de conclusão

- [ ] Registrar peso em `/medidas` atualiza automaticamente o peso exibido no perfil
- [ ] O perfil não tem mais campo editável de peso — mostra o valor atual + link
- [ ] Build sem erros de TypeScript
