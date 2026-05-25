-- =============================================
-- MUSCLE TRAINING — Patch v2: Performance + Segurança
-- =============================================
-- O que este patch corrige:
-- 1. Adiciona índices em todas as chaves estrangeiras (CRÍTICO para performance)
-- 2. Adiciona índices nas colunas mais usadas em filtros e ordenação
-- 3. Adiciona índice parcial em workouts ativos (mais comum de buscar)
-- 4. Corrige inconsistência nas políticas RLS (usar is_admin_user() em todo lugar)
-- 5. Protege a função handle_new_user() contra search_path injection
-- =============================================
-- Como usar:
-- 1. Acesse o painel do Supabase → SQL Editor
-- 2. Cole todo o conteúdo deste arquivo
-- 3. Clique em Run
-- =============================================


-- =============================================
-- 1. ÍNDICES EM CHAVES ESTRANGEIRAS
-- (Postgres não cria esses automaticamente!)
-- =============================================

-- workouts
CREATE INDEX IF NOT EXISTS idx_workouts_user_id     ON workouts (user_id);
CREATE INDEX IF NOT EXISTS idx_workouts_created_by  ON workouts (created_by);

-- workout_exercises
CREATE INDEX IF NOT EXISTS idx_workout_exercises_workout_id  ON workout_exercises (workout_id);
CREATE INDEX IF NOT EXISTS idx_workout_exercises_exercise_id ON workout_exercises (exercise_id);

-- workout_logs
CREATE INDEX IF NOT EXISTS idx_workout_logs_user_id    ON workout_logs (user_id);
CREATE INDEX IF NOT EXISTS idx_workout_logs_workout_id ON workout_logs (workout_id);

-- exercise_logs
CREATE INDEX IF NOT EXISTS idx_exercise_logs_workout_log_id ON exercise_logs (workout_log_id);
CREATE INDEX IF NOT EXISTS idx_exercise_logs_exercise_id   ON exercise_logs (exercise_id);

-- dados pessoais
CREATE INDEX IF NOT EXISTS idx_user_weights_user_id       ON user_weights (user_id);
CREATE INDEX IF NOT EXISTS idx_body_measurements_user_id  ON body_measurements (user_id);
CREATE INDEX IF NOT EXISTS idx_nutrition_logs_user_id     ON nutrition_logs (user_id);

-- exercise_library
CREATE INDEX IF NOT EXISTS idx_exercise_library_created_by ON exercise_library (created_by);


-- =============================================
-- 2. ÍNDICES PARA FILTROS E ORDENAÇÃO COMUNS
-- =============================================

-- Filtrar exercícios por grupo muscular (muito comum na busca)
CREATE INDEX IF NOT EXISTS idx_exercise_library_muscle_group ON exercise_library (muscle_group);

-- Ordenar histórico de treinos do mais recente pro mais antigo
CREATE INDEX IF NOT EXISTS idx_workout_logs_started_at ON workout_logs (user_id, started_at DESC);

-- Ordenar registros de nutrição por data
CREATE INDEX IF NOT EXISTS idx_nutrition_logs_logged_at ON nutrition_logs (user_id, logged_at DESC);


-- =============================================
-- 3. ÍNDICE PARCIAL: apenas fichas ativas
-- (a maioria das buscas vai usar is_active = true)
-- =============================================
CREATE INDEX IF NOT EXISTS idx_workouts_active
  ON workouts (user_id)
  WHERE is_active = true;


-- =============================================
-- 4. CORRIGIR POLÍTICAS RLS INCONSISTENTES
-- Substituir subqueries manuais pela função is_admin_user()
-- =============================================

-- exercise_library: admin gerencia
DROP POLICY IF EXISTS "exercise_library: admin gerencia" ON exercise_library;
CREATE POLICY "exercise_library: admin gerencia"
  ON exercise_library FOR ALL
  USING (public.is_admin_user());

-- workouts: admin vê todas
DROP POLICY IF EXISTS "workouts: admin vê todas" ON workouts;
CREATE POLICY "workouts: admin vê todas"
  ON workouts FOR SELECT
  USING (public.is_admin_user());

-- workouts: admin gerencia
DROP POLICY IF EXISTS "workouts: admin gerencia" ON workouts;
CREATE POLICY "workouts: admin gerencia"
  ON workouts FOR ALL
  USING (public.is_admin_user());

-- workout_exercises: acesso via ficha (simplificado)
DROP POLICY IF EXISTS "workout_exercises: acesso via ficha" ON workout_exercises;
CREATE POLICY "workout_exercises: acesso via ficha"
  ON workout_exercises FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM workouts
      WHERE workouts.id = workout_exercises.workout_id
        AND (workouts.user_id = auth.uid() OR public.is_admin_user())
    )
  );

-- workout_exercises: admin gerencia
DROP POLICY IF EXISTS "workout_exercises: admin gerencia" ON workout_exercises;
CREATE POLICY "workout_exercises: admin gerencia"
  ON workout_exercises FOR ALL
  USING (public.is_admin_user());

-- workout_logs: admin vê todos
DROP POLICY IF EXISTS "workout_logs: admin vê todos" ON workout_logs;
CREATE POLICY "workout_logs: admin vê todos"
  ON workout_logs FOR SELECT
  USING (public.is_admin_user());

-- user_weights: admin vê todos
DROP POLICY IF EXISTS "user_weights: admin vê todos" ON user_weights;
CREATE POLICY "user_weights: admin vê todos"
  ON user_weights FOR SELECT
  USING (public.is_admin_user());

-- body_measurements: admin vê todos
DROP POLICY IF EXISTS "body_measurements: admin vê todos" ON body_measurements;
CREATE POLICY "body_measurements: admin vê todos"
  ON body_measurements FOR SELECT
  USING (public.is_admin_user());


-- =============================================
-- 5. PROTEGER handle_new_user() CONTRA SEARCH_PATH INJECTION
-- =============================================
CREATE OR REPLACE FUNCTION handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO profiles (id, email, full_name, role)
  VALUES (
    NEW.id,
    NEW.email,
    COALESCE(NEW.raw_user_meta_data->>'full_name', 'Usuário'),
    COALESCE(NEW.raw_user_meta_data->>'role', 'user')
  );
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public;


-- =============================================
-- FIM DO PATCH v2
-- =============================================
-- Verificar os índices criados (opcional):
-- SELECT tablename, indexname FROM pg_indexes
-- WHERE schemaname = 'public'
-- ORDER BY tablename, indexname;
