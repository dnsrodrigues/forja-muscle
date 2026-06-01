-- =============================================
-- MUSCLE TRAINING — Script de Criação do Banco de Dados
-- =============================================
-- Como usar:
-- 1. Acesse o painel do Supabase
-- 2. Vá em "SQL Editor"
-- 3. Cole todo o conteúdo deste arquivo
-- 4. Clique em "Run"
-- =============================================

-- Extensões necessárias
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- =============================================
-- TABELA: profiles (perfil dos usuários)
-- =============================================
CREATE TABLE profiles (
  id UUID REFERENCES auth.users(id) ON DELETE CASCADE PRIMARY KEY,
  email TEXT NOT NULL,
  full_name TEXT NOT NULL,
  role TEXT NOT NULL DEFAULT 'user' CHECK (role IN ('admin', 'user')),
  avatar_url TEXT,
  weight DECIMAL(5,2),          -- peso atual em kg
  height INTEGER,               -- altura em cm
  birth_date DATE,
  gender TEXT CHECK (gender IN ('male', 'female', 'other')),
  goal TEXT,                    -- objetivo pessoal
  target_weight DECIMAL(5,2),  -- peso alvo
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- =============================================
-- TABELA: exercise_library (biblioteca de exercícios)
-- =============================================
CREATE TABLE exercise_library (
  id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  name TEXT NOT NULL,
  muscle_group TEXT NOT NULL CHECK (muscle_group IN (
    'chest', 'back', 'legs', 'shoulders', 'biceps', 'triceps',
    'abs', 'forearms', 'trapezius', 'glutes', 'calves'
  )),
  description TEXT,
  video_url TEXT,
  image_url TEXT,
  created_by UUID REFERENCES profiles(id),
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- =============================================
-- TABELA: workouts (fichas de treino)
-- =============================================
CREATE TABLE workouts (
  id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  name TEXT NOT NULL,
  description TEXT,
  user_id UUID REFERENCES profiles(id) ON DELETE CASCADE NOT NULL,
  created_by UUID REFERENCES profiles(id) NOT NULL,
  week_days TEXT[] DEFAULT '{}',
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- =============================================
-- TABELA: workout_exercises (exercícios de cada ficha)
-- =============================================
CREATE TABLE workout_exercises (
  id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  workout_id UUID REFERENCES workouts(id) ON DELETE CASCADE NOT NULL,
  exercise_id UUID REFERENCES exercise_library(id) NOT NULL,
  sets INTEGER NOT NULL DEFAULT 3,
  reps TEXT NOT NULL DEFAULT '12',
  suggested_load DECIMAL(6,2),
  rest_seconds INTEGER DEFAULT 60,
  notes TEXT,
  order_index INTEGER NOT NULL DEFAULT 0,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- =============================================
-- TABELA: workout_logs (sessões de treino realizadas)
-- =============================================
CREATE TABLE workout_logs (
  id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  user_id UUID REFERENCES profiles(id) ON DELETE CASCADE NOT NULL,
  workout_id UUID REFERENCES workouts(id) NOT NULL,
  started_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  finished_at TIMESTAMPTZ,
  duration_minutes INTEGER,
  difficulty TEXT CHECK (difficulty IN ('easy', 'medium', 'hard', 'terrible')),
  notes TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- =============================================
-- TABELA: exercise_logs (séries realizadas em cada sessão)
-- =============================================
CREATE TABLE exercise_logs (
  id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  workout_log_id UUID REFERENCES workout_logs(id) ON DELETE CASCADE NOT NULL,
  exercise_id UUID REFERENCES exercise_library(id) NOT NULL,
  set_number INTEGER NOT NULL,
  reps_completed INTEGER NOT NULL,
  load_kg DECIMAL(6,2) NOT NULL,
  completed BOOLEAN DEFAULT false,
  notes TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- =============================================
-- TABELA: user_weights (histórico de peso corporal)
-- =============================================
CREATE TABLE user_weights (
  id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  user_id UUID REFERENCES profiles(id) ON DELETE CASCADE NOT NULL,
  weight_kg DECIMAL(5,2) NOT NULL,
  measured_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  notes TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- =============================================
-- TABELA: body_measurements (medidas corporais)
-- =============================================
CREATE TABLE body_measurements (
  id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  user_id UUID REFERENCES profiles(id) ON DELETE CASCADE NOT NULL,
  measured_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  waist_cm DECIMAL(5,2),    -- cintura
  hip_cm DECIMAL(5,2),      -- quadril
  abdomen_cm DECIMAL(5,2),  -- abdômen
  thigh_cm DECIMAL(5,2),    -- coxa
  arm_cm DECIMAL(5,2),      -- braço
  chest_cm DECIMAL(5,2),    -- peitoral
  calf_cm DECIMAL(5,2),     -- panturrilha
  notes TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- =============================================
-- TABELA: nutrition_logs (diário alimentar)
-- =============================================
CREATE TABLE nutrition_logs (
  id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  user_id UUID REFERENCES profiles(id) ON DELETE CASCADE NOT NULL,
  meal_type TEXT NOT NULL CHECK (meal_type IN (
    'breakfast', 'lunch', 'snack', 'dinner', 'pre_workout', 'post_workout'
  )),
  description TEXT NOT NULL,
  calories INTEGER,
  protein_g DECIMAL(6,2),
  carbs_g DECIMAL(6,2),
  fat_g DECIMAL(6,2),
  ai_feedback TEXT,
  logged_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- =============================================
-- FUNÇÃO: atualizar updated_at automaticamente
-- =============================================
CREATE OR REPLACE FUNCTION update_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER profiles_updated_at
  BEFORE UPDATE ON profiles
  FOR EACH ROW EXECUTE FUNCTION update_updated_at();

CREATE TRIGGER workouts_updated_at
  BEFORE UPDATE ON workouts
  FOR EACH ROW EXECUTE FUNCTION update_updated_at();

-- =============================================
-- FUNÇÃO: criar perfil ao cadastrar usuário
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
$$ LANGUAGE plpgsql SECURITY DEFINER;

CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION handle_new_user();

-- =============================================
-- SEGURANÇA: Ativar RLS em todas as tabelas
-- =============================================
ALTER TABLE profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE exercise_library ENABLE ROW LEVEL SECURITY;
ALTER TABLE workouts ENABLE ROW LEVEL SECURITY;
ALTER TABLE workout_exercises ENABLE ROW LEVEL SECURITY;
ALTER TABLE workout_logs ENABLE ROW LEVEL SECURITY;
ALTER TABLE exercise_logs ENABLE ROW LEVEL SECURITY;
ALTER TABLE user_weights ENABLE ROW LEVEL SECURITY;
ALTER TABLE body_measurements ENABLE ROW LEVEL SECURITY;
ALTER TABLE nutrition_logs ENABLE ROW LEVEL SECURITY;

-- =============================================
-- FUNÇÃO AUXILIAR: verificar se usuário é admin
-- (evita recursão infinita nas políticas de profiles)
-- =============================================
CREATE OR REPLACE FUNCTION public.is_admin_user()
RETURNS BOOLEAN AS $$
  SELECT EXISTS (
    SELECT 1 FROM public.profiles
    WHERE id = (SELECT auth.uid()) AND role = 'admin'
  );
$$ LANGUAGE sql SECURITY DEFINER STABLE SET search_path = public;

-- =============================================
-- POLÍTICAS DE ACESSO — profiles
-- =============================================
CREATE POLICY "profiles: usuário vê o próprio perfil"
  ON profiles FOR SELECT
  USING (auth.uid() = id);

CREATE POLICY "profiles: admin vê todos"
  ON profiles FOR SELECT
  USING (public.is_admin_user());

CREATE POLICY "profiles: usuário edita o próprio perfil"
  ON profiles FOR UPDATE
  USING (auth.uid() = id);

-- =============================================
-- POLÍTICAS DE ACESSO — exercise_library
-- =============================================
CREATE POLICY "exercise_library: todos leem"
  ON exercise_library FOR SELECT
  USING (auth.uid() IS NOT NULL);

CREATE POLICY "exercise_library: admin gerencia"
  ON exercise_library FOR ALL
  USING (
    EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND role = 'admin')
  );

-- =============================================
-- POLÍTICAS DE ACESSO — workouts
-- =============================================
CREATE POLICY "workouts: usuário vê as suas fichas"
  ON workouts FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "workouts: admin vê todas"
  ON workouts FOR SELECT
  USING (
    EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND role = 'admin')
  );

CREATE POLICY "workouts: admin gerencia"
  ON workouts FOR ALL
  USING (
    EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND role = 'admin')
  );

-- =============================================
-- POLÍTICAS DE ACESSO — workout_exercises
-- =============================================
CREATE POLICY "workout_exercises: acesso via ficha"
  ON workout_exercises FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM workouts
      WHERE workouts.id = workout_exercises.workout_id
        AND (
          workouts.user_id = auth.uid()
          OR EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND role = 'admin')
        )
    )
  );

CREATE POLICY "workout_exercises: admin gerencia"
  ON workout_exercises FOR ALL
  USING (
    EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND role = 'admin')
  );

-- =============================================
-- POLÍTICAS DE ACESSO — workout_logs
-- =============================================
CREATE POLICY "workout_logs: usuário vê os seus"
  ON workout_logs FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "workout_logs: usuário cria os seus"
  ON workout_logs FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "workout_logs: usuário edita os seus"
  ON workout_logs FOR UPDATE
  USING (auth.uid() = user_id);

CREATE POLICY "workout_logs: admin vê todos"
  ON workout_logs FOR SELECT
  USING (
    EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND role = 'admin')
  );

-- =============================================
-- POLÍTICAS DE ACESSO — exercise_logs
-- =============================================
CREATE POLICY "exercise_logs: acesso via sessão"
  ON exercise_logs FOR ALL
  USING (
    EXISTS (
      SELECT 1 FROM workout_logs
      WHERE workout_logs.id = exercise_logs.workout_log_id
        AND workout_logs.user_id = auth.uid()
    )
  );

-- =============================================
-- POLÍTICAS DE ACESSO — dados pessoais
-- =============================================
CREATE POLICY "user_weights: próprio usuário"
  ON user_weights FOR ALL
  USING (auth.uid() = user_id);

CREATE POLICY "user_weights: admin vê todos"
  ON user_weights FOR SELECT
  USING (
    EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND role = 'admin')
  );

CREATE POLICY "body_measurements: próprio usuário"
  ON body_measurements FOR ALL
  USING (auth.uid() = user_id);

CREATE POLICY "body_measurements: admin vê todos"
  ON body_measurements FOR SELECT
  USING (
    EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND role = 'admin')
  );

CREATE POLICY "nutrition_logs: próprio usuário"
  ON nutrition_logs FOR ALL
  USING (auth.uid() = user_id);

-- =============================================
-- DADOS INICIAIS: Biblioteca de exercícios
-- =============================================
INSERT INTO exercise_library (name, muscle_group, description) VALUES
  -- Peito
  ('Supino Reto com Barra', 'chest', 'Exercício básico de peito com barra. Deitado no banco plano.'),
  ('Supino Inclinado com Halteres', 'chest', 'Foco na parte superior do peitoral. Banco inclinado 30-45°.'),
  ('Crucifixo com Halteres', 'chest', 'Isolamento do peitoral. Movimento de abertura dos braços.'),
  ('Peck Deck (Voador)', 'chest', 'Máquina de isolamento do peitoral.'),
  ('Flexão de Braços', 'chest', 'Exercício com peso corporal para peito e tríceps.'),
  -- Costas
  ('Puxada Frontal', 'back', 'Puxada na máquina com pegada aberta, foco no grande dorsal.'),
  ('Remada Curvada com Barra', 'back', 'Exercício composto para costas. Tronco inclinado ~45°.'),
  ('Remada Unilateral com Haltere', 'back', 'Remada com haltere em apoio no banco. Um lado por vez.'),
  ('Pulldown com Cabo', 'back', 'Puxada com cabo no cross. Similar à puxada, mais controle.'),
  ('Levantamento Terra', 'back', 'Exercício composto que trabalha costas, glúteos e pernas.'),
  -- Pernas
  ('Agachamento Livre', 'legs', 'Exercício básico de pernas com barra. Rei dos exercícios.'),
  ('Leg Press 45°', 'legs', 'Máquina de leg press. Ótimo volume para quadríceps.'),
  ('Extensora', 'legs', 'Isolamento do quadríceps na máquina extensora.'),
  ('Flexora Deitada', 'legs', 'Isolamento do bíceps femoral na máquina flexora.'),
  ('Agachamento Hack', 'legs', 'Agachamento na máquina hack. Foco no quadríceps.'),
  ('Stiff', 'legs', 'Levantamento terra com pernas semiflexionadas. Posterior de coxa.'),
  -- Ombros
  ('Desenvolvimento com Barra', 'shoulders', 'Press de ombros com barra. Pode ser sentado ou em pé.'),
  ('Desenvolvimento com Halteres', 'shoulders', 'Press de ombros com halteres. Maior amplitude.'),
  ('Elevação Lateral', 'shoulders', 'Isolamento do deltoide lateral. Com halteres ou cabos.'),
  ('Elevação Frontal', 'shoulders', 'Isolamento do deltoide frontal. Com halteres ou barra.'),
  ('Crucifixo Invertido', 'shoulders', 'Deltoide posterior. Tronco inclinado, braços abrindo para trás.'),
  -- Bíceps
  ('Rosca Direta com Barra', 'biceps', 'Exercício básico de bíceps. Barra W ou reta.'),
  ('Rosca Alternada com Halteres', 'biceps', 'Rosca com halteres alternando os braços.'),
  ('Rosca Martelo', 'biceps', 'Pegada neutra. Foco no braquial e braquiorradial.'),
  ('Rosca Scott', 'biceps', 'Isolador de bíceps no banco Scott. Elimina trapaça.'),
  ('Rosca Concentrada', 'biceps', 'Cotovelo apoiado na coxa. Máximo isolamento do bíceps.'),
  -- Tríceps
  ('Tríceps Testa com Barra', 'triceps', 'Exercício básico de tríceps. Deitado no banco.'),
  ('Tríceps Pulley', 'triceps', 'Extensão de tríceps no cabo com corda ou barra.'),
  ('Mergulho no Banco', 'triceps', 'Exercício com peso corporal para tríceps.'),
  ('Tríceps Francês com Haltere', 'triceps', 'Extensão acima da cabeça com haltere.'),
  ('Tríceps Coice', 'triceps', 'Extensão posterior com haltere. Tronco inclinado.'),
  -- Abdômen
  ('Abdominal Crunch', 'abs', 'Exercício básico de abdômen. Contração do reto abdominal.'),
  ('Prancha', 'abs', 'Isometria de core. Posição de flexão de braços sem movimento.'),
  ('Abdominal na Máquina', 'abs', 'Crunch na máquina de abdômen com resistência.'),
  ('Elevação de Pernas', 'abs', 'Abdômen inferior. Deitado ou suspenso.'),
  ('Abdominal Oblíquo', 'abs', 'Rotação do tronco. Trabalha oblíquos.'),
  -- Panturrilha
  ('Panturrilha em Pé', 'calves', 'Elevação de panturrilha em pé. Máquina ou livre.'),
  ('Panturrilha Sentado', 'calves', 'Elevação de panturrilha sentado. Foco no sóleo.'),
  -- Glúteos
  ('Afundo', 'glutes', 'Exercício de glúteos e pernas. Com ou sem peso.'),
  ('Cadeira Abdutora', 'glutes', 'Isolamento dos glúteos médio e mínimo.'),
  ('Hip Thrust', 'glutes', 'Elevação de quadril com barra. Melhor exercício para glúteos.');

-- =============================================
-- PATCH v3 — Fase 5: Fichas de Treino
-- Executar no painel SQL do Supabase
-- =============================================

-- Adiciona suporte a fichas-template na biblioteca do admin
ALTER TABLE workouts
  ADD COLUMN IF NOT EXISTS is_template BOOLEAN NOT NULL DEFAULT FALSE,
  ADD COLUMN IF NOT EXISTS template_id UUID REFERENCES workouts(id);

-- Índice para buscar rapidamente fichas de um template
CREATE INDEX IF NOT EXISTS idx_workouts_template ON workouts(template_id) WHERE template_id IS NOT NULL;

-- Permite que alunos leiam fichas-template (biblioteca pública do admin)
DROP POLICY IF EXISTS "workouts: usuário vê as suas fichas" ON workouts;
CREATE POLICY "workouts: usuário vê as suas fichas"
  ON workouts FOR SELECT
  USING (user_id = auth.uid() OR is_template = true);

-- =============================================
-- PATCH v4 — Roles Multi-Trainer + Trainer como Aluno
-- Executar no painel SQL do Supabase (SQL Editor)
-- Spec: docs/superpowers/specs/2026-05-28-roles-multitrainer-design.md
-- =============================================

-- 1. Adiciona coluna de vínculo trainer → aluno
ALTER TABLE profiles
  ADD COLUMN IF NOT EXISTS trainer_id UUID REFERENCES profiles(id) ON DELETE SET NULL;

-- 2. Expande os valores permitidos para o campo role
ALTER TABLE profiles DROP CONSTRAINT IF EXISTS profiles_role_check;
ALTER TABLE profiles ADD CONSTRAINT profiles_role_check
  CHECK (role IN ('super_admin', 'trainer', 'user'));

-- 3. Migra o admin existente para super_admin
UPDATE profiles SET role = 'super_admin' WHERE role = 'admin';

-- 4. Funções auxiliares para as novas políticas RLS
CREATE OR REPLACE FUNCTION is_super_admin()
RETURNS boolean LANGUAGE sql SECURITY DEFINER AS $$
  SELECT EXISTS (
    SELECT 1 FROM profiles WHERE id = auth.uid() AND role = 'super_admin'
  );
$$;

CREATE OR REPLACE FUNCTION is_trainer_or_above()
RETURNS boolean LANGUAGE sql SECURITY DEFINER AS $$
  SELECT EXISTS (
    SELECT 1 FROM profiles WHERE id = auth.uid() AND role IN ('super_admin', 'trainer')
  );
$$;

-- 5. Atualiza RLS de profiles
DROP POLICY IF EXISTS "usuários podem ver o próprio perfil" ON profiles;
DROP POLICY IF EXISTS "admin vê todos os perfis" ON profiles;

CREATE POLICY "profiles: super_admin vê todos" ON profiles FOR SELECT
  USING (is_super_admin());

CREATE POLICY "profiles: trainer vê seus alunos" ON profiles FOR SELECT
  USING (trainer_id = auth.uid() OR id = auth.uid());

CREATE POLICY "profiles: usuário vê o próprio" ON profiles FOR SELECT
  USING (id = auth.uid());

-- 6. Atualiza RLS de workouts
DROP POLICY IF EXISTS "admin gerencia todas as fichas" ON workouts;

CREATE POLICY "workouts: super_admin gerencia tudo" ON workouts FOR ALL
  USING (is_super_admin());

CREATE POLICY "workouts: trainer acessa os seus" ON workouts FOR ALL
  USING (
    is_template = true
    OR user_id = auth.uid()
    OR user_id IN (SELECT id FROM profiles WHERE trainer_id = auth.uid())
  );

-- 7. Atualiza RLS de workout_logs
DROP POLICY IF EXISTS "admin vê todos os logs" ON workout_logs;

CREATE POLICY "workout_logs: trainer e admin acessam os seus" ON workout_logs FOR ALL
  USING (
    user_id = auth.uid()
    OR user_id IN (SELECT id FROM profiles WHERE trainer_id = auth.uid())
    OR is_super_admin()
  );

-- 8. Atualiza RLS de user_weights e body_measurements
DROP POLICY IF EXISTS "admin vê todos os pesos" ON user_weights;
DROP POLICY IF EXISTS "admin vê todas as medidas" ON body_measurements;

CREATE POLICY "user_weights: trainer vê seus alunos" ON user_weights FOR SELECT
  USING (
    user_id = auth.uid()
    OR user_id IN (SELECT id FROM profiles WHERE trainer_id = auth.uid())
    OR is_super_admin()
  );

CREATE POLICY "body_measurements: trainer vê seus alunos" ON body_measurements FOR SELECT
  USING (
    user_id = auth.uid()
    OR user_id IN (SELECT id FROM profiles WHERE trainer_id = auth.uid())
    OR is_super_admin()
  );

-- =============================================
-- PATCH v4 — Corrige RLS de exercise_library
-- (a política antiga usava role='admin' que
--  não existe mais após a migração para
--  super_admin / trainer / user)
-- =============================================

-- Remove política antiga (usa role='admin' inexistente)
DROP POLICY IF EXISTS "exercise_library: admin gerencia" ON exercise_library;

-- Nova política: super_admin e trainer podem gerenciar exercícios
CREATE POLICY "exercise_library: trainer e admin gerenciam"
  ON exercise_library FOR ALL
  USING (is_trainer_or_above())
  WITH CHECK (is_trainer_or_above());

-- =============================================
-- PATCH v5 — Nutrição + IA (Fase 8)
-- =============================================

-- Soft delete em nutrition_logs
ALTER TABLE nutrition_logs ADD COLUMN IF NOT EXISTS is_active BOOLEAN DEFAULT true;

-- RLS: trainer lê logs dos seus alunos
CREATE POLICY "nutrition_logs: trainer lê seus alunos"
  ON nutrition_logs FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM profiles
      WHERE id = nutrition_logs.user_id
        AND trainer_id = auth.uid()
    )
  );


-- ============================================================
-- PATCH v6 — Painel administrativo (Fase 9)
-- Permite trainer/super_admin: editar dados do aluno, registrar
-- peso/medidas em nome do aluno, e LER as séries (exercise_logs)
-- dos seus alunos (necessário para detalhe de sessão e gráfico
-- de carga no perfil do aluno).
-- As políticas são PERMISSIVAS (somam-se às já existentes).
-- ============================================================

-- 1. Trainer/super_admin ATUALIZAM o perfil dos seus alunos.
DROP POLICY IF EXISTS "profiles: trainer edita seus alunos" ON profiles;
CREATE POLICY "profiles: trainer edita seus alunos" ON profiles FOR UPDATE
  USING (
    is_super_admin()
    OR (role = 'user' AND trainer_id = auth.uid())
  )
  WITH CHECK (
    is_super_admin()
    OR (role = 'user' AND trainer_id = auth.uid())
  );

-- 2. Trainer/super_admin INSEREM peso para seus alunos.
DROP POLICY IF EXISTS "user_weights: trainer registra p/ aluno" ON user_weights;
CREATE POLICY "user_weights: trainer registra p/ aluno" ON user_weights FOR INSERT
  WITH CHECK (
    user_id = auth.uid()
    OR is_super_admin()
    OR user_id IN (SELECT id FROM profiles WHERE trainer_id = auth.uid())
  );

-- 3. Trainer/super_admin INSEREM medidas para seus alunos.
DROP POLICY IF EXISTS "body_measurements: trainer registra p/ aluno" ON body_measurements;
CREATE POLICY "body_measurements: trainer registra p/ aluno" ON body_measurements FOR INSERT
  WITH CHECK (
    user_id = auth.uid()
    OR is_super_admin()
    OR user_id IN (SELECT id FROM profiles WHERE trainer_id = auth.uid())
  );

-- 4. Trainer/super_admin LEEM as séries (exercise_logs) dos seus alunos.
DROP POLICY IF EXISTS "exercise_logs: trainer vê seus alunos" ON exercise_logs;
CREATE POLICY "exercise_logs: trainer vê seus alunos" ON exercise_logs FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM workout_logs wl
      JOIN profiles p ON p.id = wl.user_id
      WHERE wl.id = exercise_logs.workout_log_id
        AND (p.trainer_id = auth.uid() OR is_super_admin())
    )
  );
