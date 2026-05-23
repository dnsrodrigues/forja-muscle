import { useState } from 'react'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import { motion } from 'motion/react'
import {
  ArrowLeft,
  Scale,
  Ruler,
  CheckCircle2,
  AlertCircle,
  Dumbbell,
  Target,
  User,
  CalendarDays,
  ChevronDown,
} from 'lucide-react'
import { Link } from 'react-router-dom'
import { useAuth } from '../context/AuthContext'
import { updateProfile } from '../services/profile.service'
import { Button } from '../components/ui/Button'
import { Input } from '../components/ui/Input'
import { Avatar } from '../components/ui/Avatar'

// ─── Schema de validação ────────────────────────────────────────────────────

const toOptionalNumber = (val: unknown) => {
  if (val === '' || val === null || val === undefined) return undefined
  const n = Number(val)
  return isNaN(n) ? undefined : n
}

const profileSchema = z.object({
  full_name: z
    .string()
    .min(2, 'Nome deve ter pelo menos 2 caracteres')
    .max(80, 'Nome muito longo'),
  weight: z.preprocess(toOptionalNumber, z.number().positive('Peso inválido').optional()),
  height: z.preprocess(toOptionalNumber, z.number().positive('Altura inválida').optional()),
  birth_date: z.string().optional(),
  gender: z.enum(['male', 'female', 'other', '']).optional(),
  goal: z.string().max(300, 'Máximo de 300 caracteres').optional(),
  target_weight: z.preprocess(
    toOptionalNumber,
    z.number().positive('Peso alvo inválido').optional()
  ),
})

type ProfileFormData = z.infer<typeof profileSchema>

// ─── Componente ─────────────────────────────────────────────────────────────

export function ProfilePage() {
  const { user, profile, isAdmin } = useAuth()
  const [saveStatus, setSaveStatus] = useState<'idle' | 'success' | 'error'>('idle')
  const [errorMsg, setErrorMsg] = useState('')

  const {
    register,
    handleSubmit,
    formState: { errors, isDirty, isSubmitting },
    reset,
  } = useForm<ProfileFormData>({
    resolver: zodResolver(profileSchema),
    defaultValues: {
      full_name: profile?.full_name ?? '',
      weight: profile?.weight ?? ('' as unknown as number),
      height: profile?.height ?? ('' as unknown as number),
      birth_date: profile?.birth_date ?? '',
      gender: (profile?.gender as ProfileFormData['gender']) ?? '',
      goal: profile?.goal ?? '',
      target_weight: profile?.target_weight ?? ('' as unknown as number),
    },
  })

  async function onSubmit(data: ProfileFormData) {
    if (!user) return
    setSaveStatus('idle')
    setErrorMsg('')

    try {
      const cleaned = {
        full_name: data.full_name,
        weight: data.weight,
        height: data.height,
        birth_date: data.birth_date || undefined,
        gender: data.gender || undefined,
        goal: data.goal || undefined,
        target_weight: data.target_weight,
      } as Parameters<typeof updateProfile>[1]

      await updateProfile(user.id, cleaned)
      setSaveStatus('success')
      reset(data) // marca o form como "não sujo" após salvar
      setTimeout(() => setSaveStatus('idle'), 3000)
    } catch (err) {
      setSaveStatus('error')
      setErrorMsg(err instanceof Error ? err.message : 'Erro ao salvar. Tente novamente.')
    }
  }

  const displayName = profile?.full_name ?? 'Usuário'

  // ── Render ──────────────────────────────────────────────────────────────

  return (
    <div className="min-h-screen bg-[#0f0f0f]">

      {/* ── Barra de navegação ────────────────────────────────────── */}
      <header className="sticky top-0 z-10 bg-[#0f0f0f]/80 backdrop-blur border-b border-white/5 px-4 py-3">
        <div className="max-w-2xl mx-auto flex items-center justify-between">
          <Link
            to="/dashboard"
            className="flex items-center gap-2 text-gray-400 hover:text-white transition-colors text-sm font-medium"
          >
            <ArrowLeft size={16} />
            Voltar
          </Link>
          <div className="flex items-center gap-2">
            <div className="w-6 h-6 bg-orange-500 rounded-lg flex items-center justify-center">
              <Dumbbell size={12} className="text-white" />
            </div>
            <span className="text-white text-sm font-bold tracking-wide">MUSCTRAINIG</span>
          </div>
        </div>
      </header>

      <main className="max-w-2xl mx-auto px-4 pb-16">

        {/* ── Hero do perfil ────────────────────────────────────────── */}
        <motion.div
          initial={{ opacity: 0, y: -16 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.4 }}
          className="relative mt-6 mb-6 rounded-3xl overflow-hidden border border-white/5"
          style={{
            background: 'linear-gradient(135deg, #1e1200 0%, #1a1a1a 60%, #0f0f0f 100%)',
          }}
        >
          {/* Grade decorativa de fundo */}
          <div
            className="absolute inset-0 opacity-5"
            style={{
              backgroundImage:
                'repeating-linear-gradient(0deg, #f97316 0, #f97316 1px, transparent 1px, transparent 40px), repeating-linear-gradient(90deg, #f97316 0, #f97316 1px, transparent 1px, transparent 40px)',
            }}
          />

          {/* Barra laranja lateral */}
          <div className="absolute left-0 top-0 bottom-0 w-1 bg-gradient-to-b from-orange-500 via-orange-400 to-transparent rounded-l-3xl" />

          <div className="relative px-6 py-8 flex items-center gap-5">
            <Avatar
              name={displayName}
              src={profile?.avatar_url}
              size="xl"
              className="ring-4 ring-orange-500/20 shadow-xl shadow-orange-500/10"
            />
            <div className="flex-1 min-w-0">
              <h1 className="text-2xl font-bold text-white tracking-tight truncate">
                {displayName}
              </h1>
              <p className="text-gray-400 text-sm mt-0.5 truncate">{profile?.email}</p>
              <span
                className={`inline-flex items-center gap-1.5 mt-2 text-xs font-semibold px-2.5 py-1 rounded-full ${
                  isAdmin
                    ? 'bg-orange-500/20 text-orange-400 border border-orange-500/20'
                    : 'bg-white/10 text-gray-300 border border-white/10'
                }`}
              >
                {isAdmin ? '⭐ Admin' : '💪 Aluno'}
              </span>
            </div>
          </div>

          {/* Métricas rápidas */}
          {(profile?.weight || profile?.height) && (
            <div className="relative border-t border-white/5 px-6 py-4 flex gap-6">
              {profile.weight && (
                <div className="flex items-center gap-2">
                  <Scale size={14} className="text-orange-500" />
                  <span className="text-white font-bold">{profile.weight}</span>
                  <span className="text-gray-500 text-xs">kg</span>
                </div>
              )}
              {profile.height && (
                <div className="flex items-center gap-2">
                  <Ruler size={14} className="text-orange-500" />
                  <span className="text-white font-bold">{profile.height}</span>
                  <span className="text-gray-500 text-xs">cm</span>
                </div>
              )}
              {profile.target_weight && (
                <div className="flex items-center gap-2">
                  <Target size={14} className="text-orange-500" />
                  <span className="text-white font-bold">{profile.target_weight}</span>
                  <span className="text-gray-500 text-xs">kg alvo</span>
                </div>
              )}
            </div>
          )}
        </motion.div>

        {/* ── Formulário de edição ───────────────────────────────────── */}
        <form onSubmit={handleSubmit(onSubmit)} noValidate>

          {/* DADOS PESSOAIS */}
          <motion.section
            initial={{ opacity: 0, y: 12 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.4, delay: 0.1 }}
            className="mb-6"
          >
            <SectionTitle icon={<User size={14} />} label="Dados pessoais" />

            <div className="bg-[#1a1a1a] rounded-2xl border border-white/5 p-5 flex flex-col gap-4">
              <Input
                label="Nome completo"
                placeholder="Seu nome"
                error={errors.full_name?.message}
                {...register('full_name')}
              />

              <div className="flex flex-col gap-1.5">
                <label className="text-sm font-medium text-gray-300 flex items-center gap-1.5">
                  <CalendarDays size={13} className="text-gray-500" />
                  Data de nascimento
                </label>
                <input
                  type="date"
                  className="w-full h-11 px-4 rounded-xl bg-white/5 border border-white/10 hover:border-white/20 text-white text-sm focus:outline-none focus:ring-2 focus:ring-orange-500 focus:border-transparent transition-colors [color-scheme:dark]"
                  {...register('birth_date')}
                />
              </div>

              <div className="flex flex-col gap-1.5">
                <label className="text-sm font-medium text-gray-300 flex items-center gap-1.5">
                  <ChevronDown size={13} className="text-gray-500" />
                  Gênero
                </label>
                <div className="relative">
                  <select
                    className="w-full h-11 px-4 pr-10 rounded-xl bg-white/5 border border-white/10 hover:border-white/20 text-white text-sm focus:outline-none focus:ring-2 focus:ring-orange-500 focus:border-transparent transition-colors appearance-none cursor-pointer [color-scheme:dark]"
                    {...register('gender')}
                  >
                    <option value="">Prefiro não informar</option>
                    <option value="male">Masculino</option>
                    <option value="female">Feminino</option>
                    <option value="other">Outro</option>
                  </select>
                  <ChevronDown
                    size={16}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-500 pointer-events-none"
                  />
                </div>
              </div>
            </div>
          </motion.section>

          {/* DADOS FÍSICOS */}
          <motion.section
            initial={{ opacity: 0, y: 12 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.4, delay: 0.2 }}
            className="mb-6"
          >
            <SectionTitle icon={<Scale size={14} />} label="Dados físicos" />

            <div className="bg-[#1a1a1a] rounded-2xl border border-white/5 p-5 flex flex-col gap-4">
              <div className="grid grid-cols-2 gap-3">
                <Input
                  label="Peso atual (kg)"
                  placeholder="Ex: 80"
                  type="number"
                  step="0.1"
                  min="0"
                  error={errors.weight?.message}
                  {...register('weight')}
                />
                <Input
                  label="Altura (cm)"
                  placeholder="Ex: 175"
                  type="number"
                  min="0"
                  error={errors.height?.message}
                  {...register('height')}
                />
              </div>
              <Input
                label="Peso alvo (kg)"
                placeholder="Ex: 75"
                type="number"
                step="0.1"
                min="0"
                hint="Quanto você quer pesar?"
                error={errors.target_weight?.message}
                {...register('target_weight')}
              />
            </div>
          </motion.section>

          {/* MEU OBJETIVO */}
          <motion.section
            initial={{ opacity: 0, y: 12 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.4, delay: 0.3 }}
            className="mb-8"
          >
            <SectionTitle icon={<Target size={14} />} label="Meu objetivo" />

            <div className="bg-[#1a1a1a] rounded-2xl border border-white/5 p-5">
              <div className="flex flex-col gap-1.5">
                <label className="text-sm font-medium text-gray-300">
                  O que você quer conquistar?
                </label>
                <textarea
                  rows={3}
                  placeholder="Ex: Ganhar massa muscular, emagrecer 10kg, melhorar condicionamento..."
                  className="w-full px-4 py-3 rounded-xl bg-white/5 border border-white/10 hover:border-white/20 text-white placeholder-gray-500 text-sm resize-none focus:outline-none focus:ring-2 focus:ring-orange-500 focus:border-transparent transition-colors"
                  {...register('goal')}
                />
                {errors.goal && (
                  <p className="text-xs text-red-400 flex items-center gap-1">
                    <span>⚠</span> {errors.goal.message}
                  </p>
                )}
                <p className="text-xs text-gray-600 text-right">máx. 300 caracteres</p>
              </div>
            </div>
          </motion.section>

          {/* ── Feedback + Botão salvar ────────────────────────────── */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ duration: 0.4, delay: 0.4 }}
            className="flex flex-col gap-3"
          >
            {/* Mensagem de sucesso */}
            {saveStatus === 'success' && (
              <motion.div
                initial={{ opacity: 0, y: 4 }}
                animate={{ opacity: 1, y: 0 }}
                className="flex items-center gap-2 bg-green-500/10 border border-green-500/20 text-green-400 text-sm rounded-xl px-4 py-3"
              >
                <CheckCircle2 size={16} />
                Perfil salvo com sucesso!
              </motion.div>
            )}

            {/* Mensagem de erro */}
            {saveStatus === 'error' && (
              <motion.div
                initial={{ opacity: 0, y: 4 }}
                animate={{ opacity: 1, y: 0 }}
                className="flex items-center gap-2 bg-red-500/10 border border-red-500/20 text-red-400 text-sm rounded-xl px-4 py-3"
              >
                <AlertCircle size={16} />
                {errorMsg}
              </motion.div>
            )}

            <Button
              type="submit"
              size="lg"
              loading={isSubmitting}
              disabled={!isDirty || isSubmitting}
              className="w-full"
            >
              {isSubmitting ? 'Salvando...' : 'Salvar perfil'}
            </Button>

            {!isDirty && saveStatus === 'idle' && (
              <p className="text-center text-xs text-gray-600">
                Faça uma alteração para habilitar o botão
              </p>
            )}
          </motion.div>

        </form>
      </main>
    </div>
  )
}

// ─── Componente auxiliar ─────────────────────────────────────────────────────

function SectionTitle({ icon, label }: { icon: React.ReactNode; label: string }) {
  return (
    <div className="flex items-center gap-2 mb-3 px-1">
      <span className="text-orange-500">{icon}</span>
      <span className="text-xs font-semibold text-gray-400 uppercase tracking-widest">
        {label}
      </span>
      <div className="flex-1 h-px bg-white/5" />
    </div>
  )
}
