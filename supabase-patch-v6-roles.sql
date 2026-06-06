-- =============================================================================
-- PATCH v6 — Corrige permissões (RLS) para os cargos super_admin e trainer
-- =============================================================================
--
-- PROBLEMA:
--   As regras de segurança (RLS) originais só liberavam acesso para o cargo
--   antigo 'admin'. Quando o sistema ganhou os cargos 'super_admin' e 'trainer'
--   (Fase 9), essas regras não foram atualizadas. Resultado: super_admin/trainer
--   não conseguem INSERIR nem ATUALIZAR exercícios das fichas
--   ("new row violates row-level security policy for table workout_exercises").
--
-- SOLUÇÃO:
--   Adicionar políticas que reconhecem 'super_admin' e 'trainer' como gestores.
--   É SEGURO: políticas no Postgres são somadas (OR), então isto apenas ADICIONA
--   permissão — não remove nada do que já funciona.
--
-- COMO APLICAR:
--   Supabase → seu projeto → SQL Editor → cole este arquivo inteiro → RUN.
--   Pode rodar mais de uma vez sem problema (é idempotente).
-- =============================================================================

-- Função auxiliar: o usuário logado é um gestor? (super_admin ou trainer)
CREATE OR REPLACE FUNCTION public.is_manager()
RETURNS BOOLEAN
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1 FROM profiles
    WHERE id = auth.uid()
      AND role IN ('super_admin', 'trainer')
  );
$$;

-- ── exercise_library: gestor cria/edita exercícios ──────────────────────────
DROP POLICY IF EXISTS "exercise_library: manager gerencia" ON exercise_library;
CREATE POLICY "exercise_library: manager gerencia"
  ON exercise_library FOR ALL
  USING (public.is_manager())
  WITH CHECK (public.is_manager());

-- ── workouts: gestor vê e gerencia todas as fichas ──────────────────────────
DROP POLICY IF EXISTS "workouts: manager vê todas" ON workouts;
CREATE POLICY "workouts: manager vê todas"
  ON workouts FOR SELECT
  USING (public.is_manager());

DROP POLICY IF EXISTS "workouts: manager gerencia" ON workouts;
CREATE POLICY "workouts: manager gerencia"
  ON workouts FOR ALL
  USING (public.is_manager())
  WITH CHECK (public.is_manager());

-- ── workout_exercises: gestor vê e gerencia exercícios das fichas ───────────
DROP POLICY IF EXISTS "workout_exercises: manager vê" ON workout_exercises;
CREATE POLICY "workout_exercises: manager vê"
  ON workout_exercises FOR SELECT
  USING (public.is_manager());

DROP POLICY IF EXISTS "workout_exercises: manager gerencia" ON workout_exercises;
CREATE POLICY "workout_exercises: manager gerencia"
  ON workout_exercises FOR ALL
  USING (public.is_manager())
  WITH CHECK (public.is_manager());

-- ── workout_logs: gestor vê todas as sessões ────────────────────────────────
DROP POLICY IF EXISTS "workout_logs: manager vê todos" ON workout_logs;
CREATE POLICY "workout_logs: manager vê todos"
  ON workout_logs FOR SELECT
  USING (public.is_manager());

-- ── user_weights / body_measurements: gestor vê dados dos alunos ────────────
DROP POLICY IF EXISTS "user_weights: manager vê todos" ON user_weights;
CREATE POLICY "user_weights: manager vê todos"
  ON user_weights FOR SELECT
  USING (public.is_manager());

DROP POLICY IF EXISTS "body_measurements: manager vê todos" ON body_measurements;
CREATE POLICY "body_measurements: manager vê todos"
  ON body_measurements FOR SELECT
  USING (public.is_manager());

-- =============================================================================
-- FIM DO PATCH v6
-- =============================================================================
