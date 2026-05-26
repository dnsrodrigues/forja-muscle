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
import { ThemeSwitcher } from '../components/ui/ThemeSwitcher'

// ─── Schema de validação ─────────────────────────────────────────────────────

const toOptionalNumber = (val: unknown) => {
  if (val === '' || val === null || val === undefined) return undefined
  const n = Number(val)
  return isNaN(n) ? undefined : n
}

const profileSchema = z.object({
  full_name: z.string().min(2, 'Nome deve ter pelo menos 2 caracteres').max(80, 'Nome muito longo'),
  weight: z.preprocess(toOptionalNumber, z.number().positive('Peso inválido').optional()),
  height: z.preprocess(toOptionalNumber, z.number().positive('Altura inválida').optional()),
  birth_date: z.string().optional(),
  gender: z.enum(['male', 'female', 'other', '']).optional(),
  goal: z.string().max(300, 'Máximo de 300 caracteres').optional(),
  target_weight: z.preprocess(toOptionalNumber, z.number().positive('Peso alvo inválido').optional()),
})

type ProfileFormData = z.infer<typeof profileSchema>

// ─── Componente ──────────────────────────────────────────────────────────────

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
      reset(data)
      setTimeout(() => setSaveStatus('idle'), 3000)
    } catch (err) {
      setSaveStatus('error')
      setErrorMsg(err instanceof Error ? err.message : 'Erro ao salvar. Tente novamente.')
    }
  }

  const displayName = profile?.full_name ?? 'Usuário'

  // ── Render ─────────────────────────────────────────────────────────────────
  return (
    <div className="min-h-screen">

      {/* ── Header ──────────────────────────────────────── */}
      <header
        className="sticky top-0 z-20 px-4 py-3"
        style={{
          background: 'rgba(6,4,4,0.7)',
          borderBottom: '1px solid var(--line)',
          backdropFilter: 'blur(20px)',
        }}
      >
        <div className="max-w-2xl mx-auto flex items-center justify-between">
          <Link
            to="/dashboard"
            className="flex items-center gap-2 text-sm font-medium transition-colors"
            style={{ color: 'var(--faint)' }}
            onMouseEnter={(e) => { e.currentTarget.style.color = 'var(--ink)' }}
            onMouseLeave={(e) => { e.currentTarget.style.color = 'var(--faint)' }}
          >
            <ArrowLeft size={14} />
            Voltar
          </Link>
          <div className="flex items-center gap-3">
            <ThemeSwitcher />
            <div style={{ width: 1, height: 20, background: 'var(--line)' }} />
            <div className="flex items-center gap-2">
              <div
                className="w-6 h-6 rounded-md flex items-center justify-center"
                style={{ background: 'linear-gradient(135deg, var(--accent-two), var(--accent) 60%)' }}
              >
                <Dumbbell size={12} style={{ color: 'var(--bg)' }} />
              </div>
              <span
                className="font-display text-sm font-bold"
                style={{ color: 'var(--ink)' }}
              >
                MUSCLE TRAINING
              </span>
            </div>
          </div>
        </div>
      </header>

      <main className="max-w-2xl mx-auto px-4 pb-16">

        {/* ── Hero do perfil ───────────────────────────── */}
        <motion.div
          initial={{ opacity: 0, y: -16 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, ease: [0.22, 1, 0.36, 1] }}
          className="relative mt-6 mb-6 rounded-2xl overflow-hidden"
          style={{
            background: 'linear-gradient(135deg, color-mix(in srgb, var(--accent) 8%, var(--bg-soft)), var(--bg-soft))',
            border: '1px solid var(--line)',
          }}
        >
          {/* Grade decorativa sutil */}
          <div
            className="absolute inset-0 opacity-[0.04]"
            style={{
              backgroundImage:
                'repeating-linear-gradient(0deg, var(--accent) 0, var(--accent) 1px, transparent 1px, transparent 44px), repeating-linear-gradient(90deg, var(--accent) 0, var(--accent) 1px, transparent 1px, transparent 44px)',
            }}
          />

          {/* Barra de acento lateral */}
          <div
            className="absolute left-0 top-0 bottom-0 w-0.5"
            style={{ background: 'linear-gradient(to bottom, var(--accent), transparent)' }}
          />

          <div className="relative px-6 py-8 flex items-center gap-5">
            <Avatar
              name={displayName}
              src={profile?.avatar_url}
              size="xl"
              style={{ boxShadow: '0 16px 40px var(--accent-glow)' } as React.CSSProperties}
            />
            <div className="flex-1 min-w-0">
              <h1
                className="font-display text-2xl font-bold tracking-tight truncate"
                style={{ color: 'var(--ink)' }}
              >
                {displayName}
              </h1>
              <p
                className="text-xs font-light mt-0.5 truncate"
                style={{ color: 'var(--faint)' }}
              >
                {profile?.email}
              </p>
              <span
                className="inline-flex items-center gap-1.5 mt-2 text-xs font-medium px-3 py-1 rounded-lg"
                style={{
                  background: isAdmin
                    ? 'color-mix(in srgb, var(--accent) 14%, transparent)'
                    : 'var(--glass)',
                  color: isAdmin ? 'var(--accent)' : 'var(--muted)',
                  border: '1px solid var(--line)',
                }}
              >
                {isAdmin ? '⭐ Admin' : '💪 Aluno'}
              </span>
            </div>
          </div>

          {/* Métricas rápidas */}
          {(profile?.weight || profile?.height || profile?.target_weight) && (
            <div
              className="relative px-6 py-4 flex gap-6"
              style={{ borderTop: '1px solid var(--line)' }}
            >
              {profile?.weight && (
                <div className="flex items-center gap-2">
                  <Scale size={13} style={{ color: 'var(--accent)' }} />
                  <span className="font-display text-lg font-bold" style={{ color: 'var(--ink)' }}>{profile.weight}</span>
                  <span className="text-xs" style={{ color: 'var(--faint)' }}>kg</span>
                </div>
              )}
              {profile?.height && (
                <div className="flex items-center gap-2">
                  <Ruler size={13} style={{ color: 'var(--accent)' }} />
                  <span className="font-display text-lg font-bold" style={{ color: 'var(--ink)' }}>{profile.height}</span>
                  <span className="text-xs" style={{ color: 'var(--faint)' }}>cm</span>
                </div>
              )}
              {profile?.target_weight && (
                <div className="flex items-center gap-2">
                  <Target size={13} style={{ color: 'var(--accent)' }} />
                  <span className="font-display text-lg font-bold" style={{ color: 'var(--ink)' }}>{profile.target_weight}</span>
                  <span className="text-xs" style={{ color: 'var(--faint)' }}>kg alvo</span>
                </div>
              )}
            </div>
          )}
        </motion.div>

        {/* ── Formulário ──────────────────────────────── */}
        <form onSubmit={handleSubmit(onSubmit)} noValidate>

          {/* DADOS PESSOAIS */}
          <motion.section
            initial={{ opacity: 0, y: 12 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.4, delay: 0.1 }}
            className="mb-5"
          >
            <SectionTitle icon={<User size={13} />} label="Dados pessoais" />

            <div className="glass-card rounded-2xl p-5 flex flex-col gap-4">
              <Input
                label="Nome completo"
                placeholder="Seu nome"
                error={errors.full_name?.message}
                {...register('full_name')}
              />

              <div className="flex flex-col gap-1.5">
                <label className="text-sm font-medium flex items-center gap-1.5" style={{ color: 'var(--muted)' }}>
                  <CalendarDays size={12} style={{ color: 'var(--faint)' }} />
                  Data de nascimento
                </label>
                <input
                  type="date"
                  className="w-full h-11 px-4 rounded-xl text-sm outline-none transition-all [color-scheme:dark]"
                  style={{
                    background: 'var(--glass)',
                    color: 'var(--ink)',
                    border: '1px solid var(--line)',
                  }}
                  {...register('birth_date')}
                />
              </div>

              <div className="flex flex-col gap-1.5">
                <label className="text-sm font-medium flex items-center gap-1.5" style={{ color: 'var(--muted)' }}>
                  <ChevronDown size={12} style={{ color: 'var(--faint)' }} />
                  Gênero
                </label>
                <div className="relative">
                  <select
                    className="w-full h-11 px-4 pr-10 rounded-xl text-sm outline-none transition-all appearance-none cursor-pointer [color-scheme:dark]"
                    style={{
                      background: 'var(--glass)',
                      color: 'var(--ink)',
                      border: '1px solid var(--line)',
                    }}
                    {...register('gender')}
                  >
                    <option value="">Prefiro não informar</option>
                    <option value="male">Masculino</option>
                    <option value="female">Feminino</option>
                    <option value="other">Outro</option>
                  </select>
                  <ChevronDown size={14} className="absolute right-3 top-1/2 -translate-y-1/2 pointer-events-none" style={{ color: 'var(--faint)' }} />
                </div>
              </div>
            </div>
          </motion.section>

          {/* DADOS FÍSICOS */}
          <motion.section
            initial={{ opacity: 0, y: 12 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.4, delay: 0.16 }}
            className="mb-5"
          >
            <SectionTitle icon={<Scale size={13} />} label="Dados físicos" />

            <div className="glass-card rounded-2xl p-5 flex flex-col gap-4">
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
            transition={{ duration: 0.4, delay: 0.22 }}
            className="mb-8"
          >
            <SectionTitle icon={<Target size={13} />} label="Meu objetivo" />

            <div className="glass-card rounded-2xl p-5">
              <div className="flex flex-col gap-1.5">
                <label className="text-sm font-medium" style={{ color: 'var(--muted)' }}>
                  O que você quer conquistar?
                </label>
                <textarea
                  rows={3}
                  placeholder="Ex: Ganhar massa muscular, emagrecer 10kg..."
                  className="w-full px-4 py-3 rounded-xl text-sm resize-none outline-none transition-all"
                  style={{
                    background: 'var(--glass)',
                    color: 'var(--ink)',
                    border: '1px solid var(--line)',
                  }}
                  onFocus={(e) => {
                    e.currentTarget.style.borderColor = 'color-mix(in srgb, var(--accent) 60%, white)'
                    e.currentTarget.style.boxShadow = '0 0 0 4px var(--accent-glow)'
                  }}
                  {...register('goal', {
                    onBlur: (e) => {
                      e.currentTarget.style.borderColor = 'var(--line)'
                      e.currentTarget.style.boxShadow = 'none'
                    },
                  })}
                />
                {errors.goal && (
                  <p className="text-xs text-red-400 flex items-center gap-1">
                    <span>⚠</span> {errors.goal.message}
                  </p>
                )}
                <p className="text-xs text-right" style={{ color: 'var(--faint)' }}>máx. 300 caracteres</p>
              </div>
            </div>
          </motion.section>

          {/* ── Feedback + Botão ─────────────────────── */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ duration: 0.4, delay: 0.28 }}
            className="flex flex-col gap-3"
          >
            {saveStatus === 'success' && (
              <motion.div
                initial={{ opacity: 0, y: 4 }}
                animate={{ opacity: 1, y: 0 }}
                className="flex items-center gap-2 text-sm rounded-xl px-4 py-3"
                style={{
                  background: 'rgba(34,197,94,0.08)',
                  border: '1px solid rgba(34,197,94,0.2)',
                  color: 'rgb(134,239,172)',
                }}
              >
                <CheckCircle2 size={15} />
                Perfil salvo com sucesso!
              </motion.div>
            )}

            {saveStatus === 'error' && (
              <motion.div
                initial={{ opacity: 0, y: 4 }}
                animate={{ opacity: 1, y: 0 }}
                className="flex items-center gap-2 text-sm rounded-xl px-4 py-3"
                style={{
                  background: 'rgba(239,68,68,0.08)',
                  border: '1px solid rgba(239,68,68,0.2)',
                  color: 'rgb(252,165,165)',
                }}
              >
                <AlertCircle size={15} />
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
              <p className="text-center text-xs" style={{ color: 'var(--faint)' }}>
                Faça uma alteração para habilitar o botão
              </p>
            )}
          </motion.div>

        </form>
      </main>
    </div>
  )
}

// ─── Componente auxiliar ──────────────────────────────────────────────────────

function SectionTitle({ icon, label }: { icon: React.ReactNode; label: string }) {
  return (
    <div className="flex items-center gap-2 mb-3 px-1">
      <span style={{ color: 'var(--accent)' }}>{icon}</span>
      <span
        className="text-xs font-semibold uppercase tracking-[0.16em]"
        style={{ color: 'var(--faint)' }}
      >
        {label}
      </span>
      <div className="flex-1 h-px" style={{ background: 'var(--line)' }} />
    </div>
  )
}
