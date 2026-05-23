import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import { motion } from 'motion/react'
import { useAuth } from '../context/AuthContext'
import { Button } from '../components/ui/Button'
import { Input } from '../components/ui/Input'
import { ThemeSwitcher } from '../components/ui/ThemeSwitcher'

// ─── Validação ───────────────────────────────────────────────────────────────

const loginSchema = z.object({
  email: z
    .string()
    .min(1, 'E-mail é obrigatório')
    .email('Digite um e-mail válido'),
  password: z
    .string()
    .min(1, 'Senha é obrigatória')
    .min(6, 'Senha deve ter pelo menos 6 caracteres'),
})

type LoginForm = z.infer<typeof loginSchema>

// ─── Página ──────────────────────────────────────────────────────────────────

export function LoginPage() {
  const { signIn } = useAuth()
  const navigate = useNavigate()
  const [errorMessage, setErrorMessage] = useState('')

  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
  } = useForm<LoginForm>({
    resolver: zodResolver(loginSchema),
  })

  async function onSubmit(data: LoginForm) {
    setErrorMessage('')
    try {
      await signIn(data.email, data.password)
      navigate('/dashboard', { replace: true })
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : 'Erro desconhecido'
      if (message.includes('Invalid login credentials') || message.includes('invalid_credentials')) {
        setErrorMessage('E-mail ou senha incorretos.')
      } else if (message.includes('Email not confirmed')) {
        setErrorMessage('Confirme seu e-mail antes de entrar.')
      } else if (message.includes('Too many requests')) {
        setErrorMessage('Muitas tentativas. Aguarde alguns minutos.')
      } else {
        setErrorMessage('Erro ao entrar. Verifique sua conexão.')
      }
    }
  }

  return (
    <div className="min-h-screen flex items-center justify-center p-4 relative overflow-hidden">

      {/* Theme switcher — canto superior direito */}
      <div className="fixed top-5 right-5 z-50 flex items-center gap-2">
        <span
          className="text-xs font-light tracking-widest uppercase hidden sm:block"
          style={{ color: 'var(--faint)' }}
        >
          Tema
        </span>
        <ThemeSwitcher />
      </div>

      <motion.div
        initial={{ opacity: 0, y: 24 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.6, ease: [0.22, 1, 0.36, 1] }}
        className="w-full max-w-sm relative z-10"
      >

        {/* ── Logo ────────────────────────────────────────── */}
        <div className="flex flex-col items-center mb-10 gap-4">
          <div className="relative">
            {/* Anel externo decorativo */}
            <div
              className="absolute -inset-3 rounded-2xl opacity-30"
              style={{ border: '1px solid var(--accent)' }}
            />
            {/* Anel médio */}
            <div
              className="absolute -inset-1.5 rounded-xl opacity-20"
              style={{ border: '1px solid var(--accent-two)' }}
            />
            {/* Ícone */}
            <div
              className="relative w-16 h-16 rounded-xl flex items-center justify-center shadow-2xl"
              style={{
                background: 'linear-gradient(135deg, var(--accent-two), var(--accent) 55%)',
                boxShadow: '0 20px 48px var(--accent-glow)',
              }}
            >
              <span
                className="font-display text-2xl font-bold leading-none"
                style={{ color: 'var(--bg)' }}
              >
                M
              </span>
            </div>
          </div>

          <div className="text-center">
            <h1
              className="font-display text-3xl font-bold leading-none tracking-tight"
              style={{ color: 'var(--ink)' }}
            >
              MUSCTRAINIG
            </h1>
            <p
              className="text-xs mt-2 tracking-[0.22em] uppercase font-light"
              style={{ color: 'var(--faint)' }}
            >
              Seu treino · Sua evolução
            </p>
          </div>
        </div>

        {/* ── Card do formulário ────────────────────────── */}
        <div
          className="rounded-2xl p-6 relative overflow-hidden"
          style={{
            background: 'linear-gradient(135deg, var(--glass-strong), var(--glass)), rgba(0,0,0,0.16)',
            border: '1px solid var(--line)',
            boxShadow: '0 32px 80px rgba(0,0,0,0.4), inset 0 1px 0 rgba(255,255,255,0.12)',
            backdropFilter: 'blur(24px)',
          }}
        >
          {/* Linha de destaque no topo */}
          <div
            className="absolute top-0 left-6 right-6 h-px opacity-60"
            style={{ background: 'linear-gradient(90deg, transparent, var(--accent), transparent)' }}
          />

          <h2
            className="font-display text-2xl font-bold mb-1"
            style={{ color: 'var(--ink)' }}
          >
            Bem-vindo de volta
          </h2>
          <p
            className="text-sm font-light mb-6"
            style={{ color: 'var(--muted)' }}
          >
            Entre com seu e-mail e senha para continuar
          </p>

          <form onSubmit={handleSubmit(onSubmit)} className="flex flex-col gap-4" noValidate>
            <Input
              label="E-mail"
              type="email"
              placeholder="seu@email.com"
              autoComplete="email"
              error={errors.email?.message}
              {...register('email')}
            />

            <Input
              label="Senha"
              type="password"
              placeholder="••••••••"
              autoComplete="current-password"
              error={errors.password?.message}
              {...register('password')}
            />

            {/* Mensagem de erro */}
            {errorMessage && (
              <motion.div
                initial={{ opacity: 0, y: -4 }}
                animate={{ opacity: 1, y: 0 }}
                className="px-4 py-3 rounded-xl text-sm font-light"
                style={{
                  background: 'rgba(239,68,68,0.08)',
                  border: '1px solid rgba(239,68,68,0.2)',
                  color: 'rgb(252,165,165)',
                }}
              >
                {errorMessage}
              </motion.div>
            )}

            <Button
              type="submit"
              size="lg"
              loading={isSubmitting}
              className="w-full mt-2"
            >
              {isSubmitting ? 'Entrando...' : 'Entrar'}
            </Button>
          </form>
        </div>

        {/* ── Rodapé ───────────────────────────────────── */}
        <p
          className="text-center text-xs font-light mt-6 tracking-wide"
          style={{ color: 'var(--faint)' }}
        >
          Não tem conta? Fale com seu personal trainer.
        </p>
      </motion.div>
    </div>
  )
}
