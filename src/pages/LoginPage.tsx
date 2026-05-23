import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import { Dumbbell } from 'lucide-react'
import { useAuth } from '../context/AuthContext'
import { Button } from '../components/ui/Button'
import { Input } from '../components/ui/Input'

// -------------------------------------------------------------------
// Validação do formulário
// -------------------------------------------------------------------
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

// -------------------------------------------------------------------
// Página de Login
// -------------------------------------------------------------------
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
      // Traduz as mensagens de erro do Supabase para português
      const message = err instanceof Error ? err.message : 'Erro desconhecido'
      if (
        message.includes('Invalid login credentials') ||
        message.includes('invalid_credentials')
      ) {
        setErrorMessage('E-mail ou senha incorretos. Tente novamente.')
      } else if (message.includes('Email not confirmed')) {
        setErrorMessage('Confirme seu e-mail antes de entrar.')
      } else if (message.includes('Too many requests')) {
        setErrorMessage('Muitas tentativas. Aguarde alguns minutos.')
      } else {
        setErrorMessage('Erro ao entrar. Verifique sua conexão e tente novamente.')
      }
    }
  }

  return (
    <div className="min-h-screen bg-[#0f0f0f] flex items-center justify-center p-4">
      <div className="w-full max-w-sm">

        {/* Logo */}
        <div className="flex flex-col items-center mb-8 gap-3">
          <div className="w-16 h-16 bg-orange-500 rounded-2xl flex items-center justify-center shadow-lg shadow-orange-500/20">
            <Dumbbell size={32} className="text-white" />
          </div>
          <div className="text-center">
            <h1 className="text-2xl font-bold text-white tracking-tight">
              MUSCTRAINIG
            </h1>
            <p className="text-gray-400 text-sm mt-1">
              Seu treino, sua evolução
            </p>
          </div>
        </div>

        {/* Card */}
        <div className="bg-[#1a1a1a] rounded-2xl p-6 border border-white/5 shadow-xl">
          <h2 className="text-lg font-semibold text-white mb-1">
            Bem-vindo de volta 👋
          </h2>
          <p className="text-sm text-gray-400 mb-6">
            Entre com seu e-mail e senha para continuar
          </p>

          <form onSubmit={handleSubmit(onSubmit)} className="flex flex-col gap-4">
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

            {/* Mensagem de erro geral */}
            {errorMessage && (
              <div className="bg-red-500/10 border border-red-500/20 rounded-xl px-4 py-3 text-sm text-red-400">
                {errorMessage}
              </div>
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

        {/* Rodapé */}
        <p className="text-center text-xs text-gray-600 mt-6">
          Não tem conta? Fale com seu personal trainer.
        </p>
      </div>
    </div>
  )
}
