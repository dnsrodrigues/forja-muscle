import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import { motion } from 'motion/react'
import { useAuth } from '../context/AuthContext'

// ─── Validação ────────────────────────────────────────────────────────────────

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

// ─── Página ───────────────────────────────────────────────────────────────────

export function LoginPage() {
  const { signIn } = useAuth()
  const navigate = useNavigate()
  const [errorMessage, setErrorMessage] = useState('')
  const [focusedField, setFocusedField] = useState<string | null>(null)

  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
  } = useForm<LoginForm>({ resolver: zodResolver(loginSchema) })

  async function onSubmit(data: LoginForm) {
    setErrorMessage('')
    try {
      await signIn(data.email, data.password)
      navigate('/dashboard', { replace: true })
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : ''
      if (msg.includes('Invalid login credentials') || msg.includes('invalid_credentials')) {
        setErrorMessage('E-mail ou senha incorretos.')
      } else if (msg.includes('Email not confirmed')) {
        setErrorMessage('Confirme seu e-mail antes de entrar.')
      } else if (msg.includes('Too many requests')) {
        setErrorMessage('Muitas tentativas. Aguarde alguns minutos.')
      } else {
        setErrorMessage('Erro ao entrar. Verifique sua conexão.')
      }
    }
  }

  return (
    <div
      style={{
        minHeight: '100vh',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        padding: '24px 16px',
        background: 'var(--bg)',
        position: 'relative',
        overflow: 'hidden',
      }}
    >

      {/* Blob extra centrado atrás do card */}
      <div style={{
        position: 'fixed',
        top: '50%',
        left: '50%',
        transform: 'translate(-50%, -50%)',
        width: 600,
        height: 600,
        borderRadius: '50%',
        background: 'radial-gradient(circle, rgba(108,142,247,0.08) 0%, transparent 70%)',
        pointerEvents: 'none',
        zIndex: 0,
      }} />

      <motion.div
        initial={{ opacity: 0, y: 32, scale: 0.97 }}
        animate={{ opacity: 1, y: 0, scale: 1 }}
        transition={{ duration: 0.7, ease: [0.22, 1, 0.36, 1] }}
        style={{ width: '100%', maxWidth: 400, position: 'relative', zIndex: 1 }}
      >

        {/* ── Brand ─────────────────────────────────── */}
        <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', marginBottom: 32, gap: 20 }}>

          {/* Anéis animados */}
          <div style={{ position: 'relative', display: 'flex', alignItems: 'center', justifyContent: 'center', width: 120, height: 120 }}>
            {/* Ring externo */}
            <div style={{
              position: 'absolute',
              width: 110, height: 110,
              borderRadius: '50%',
              border: '1px solid rgba(108,142,247,0.2)',
              animation: 'loginSpin 28s linear infinite',
            }}>
              <div style={{
                position: 'absolute',
                width: 7, height: 7,
                background: 'var(--accent)',
                borderRadius: '50%',
                top: 0, left: '50%',
                transform: 'translate(-50%, -50%)',
                boxShadow: '0 0 12px var(--accent)',
              }} />
            </div>

            {/* Ring médio */}
            <div style={{
              position: 'absolute',
              width: 78, height: 78,
              borderRadius: '50%',
              border: '1px dashed rgba(196,79,224,0.18)',
              animation: 'loginSpin 18s linear infinite reverse',
            }}>
              <div style={{
                position: 'absolute',
                width: 5, height: 5,
                background: 'var(--accent-2)',
                borderRadius: '50%',
                bottom: 0, left: '50%',
                transform: 'translate(-50%, 50%)',
                boxShadow: '0 0 8px var(--accent-2)',
              }} />
            </div>

            {/* Ring interno */}
            <div style={{
              position: 'absolute',
              width: 50, height: 50,
              borderRadius: '50%',
              border: '1px solid rgba(108,142,247,0.3)',
              animation: 'loginSpin 10s linear infinite',
            }} />

            {/* Core */}
            <div style={{
              width: 26, height: 26,
              borderRadius: '50%',
              background: 'linear-gradient(135deg, var(--accent-2) 0%, var(--accent) 100%)',
              boxShadow: '0 0 24px rgba(108,142,247,0.7), 0 0 48px rgba(108,142,247,0.25)',
              animation: 'coreGlow 4s ease-in-out infinite',
              position: 'relative',
              zIndex: 2,
            }} />
          </div>

          {/* Nome com gradient text */}
          <div style={{ textAlign: 'center' }}>
            <h1 style={{
              fontFamily: "'Outfit', sans-serif",
              fontSize: 22,
              fontWeight: 800,
              letterSpacing: '0.2em',
              textTransform: 'uppercase',
              backgroundImage: 'linear-gradient(160deg, #8ba8fb 0%, #ffffff 60%)',
              backgroundClip: 'text',
              WebkitBackgroundClip: 'text',
              color: 'transparent',
              lineHeight: 1,
              margin: 0,
            }}>
              MUSCLE TRAINING
            </h1>

            {/* Pill badge */}
            <div style={{
              display: 'inline-flex',
              alignItems: 'center',
              gap: 6,
              marginTop: 10,
              padding: '4px 14px',
              borderRadius: '50rem',
              border: '1px solid rgba(108,142,247,0.3)',
              background: 'rgba(108,142,247,0.08)',
            }}>
              <span style={{
                width: 5, height: 5,
                borderRadius: '50%',
                background: 'var(--accent)',
                display: 'inline-block',
                boxShadow: '0 0 6px var(--accent)',
              }} />
              <span style={{
                fontFamily: "'JetBrains Mono', monospace",
                fontSize: 10,
                fontStyle: 'italic',
                color: 'var(--fg-2)',
                letterSpacing: '0.06em',
              }}>
                seu treino · sua evolução
              </span>
            </div>
          </div>
        </div>

        {/* ── Card com glassmorphism + glow-border ──────── */}
        <div
          className="glow-border deep-card"
          style={{
            background: 'rgba(255,255,255,0.05)',
            backdropFilter: 'blur(24px)',
            WebkitBackdropFilter: 'blur(24px)',
            borderRadius: 24,
            boxShadow: '0 0 3rem 1.5rem rgba(0,0,0,0.6), inset 0 0 1px 0 rgba(255,255,255,0.18)',
            padding: '32px 28px',
          }}
        >
          <div style={{ marginBottom: 28 }}>
            <h2 style={{
              fontFamily: "'Outfit', sans-serif",
              fontSize: 22,
              fontWeight: 800,
              color: 'var(--fg)',
              margin: '0 0 4px',
              letterSpacing: '-0.01em',
            }}>
              Bem-vindo de volta
            </h2>
            <p style={{
              fontFamily: "'JetBrains Mono', monospace",
              fontSize: 11,
              fontStyle: 'italic',
              color: 'var(--fg-3)',
              margin: 0,
              letterSpacing: '0.05em',
            }}>
              // entre com seu e-mail e senha
            </p>
          </div>

          <form onSubmit={handleSubmit(onSubmit)} style={{ display: 'flex', flexDirection: 'column', gap: 16 }} noValidate>

            {/* Campo E-mail */}
            <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
              <label style={{
                fontFamily: "'JetBrains Mono', monospace",
                fontSize: 10,
                letterSpacing: '0.12em',
                textTransform: 'uppercase',
                color: focusedField === 'email' ? 'var(--accent-light)' : 'var(--fg-3)',
                transition: 'color 0.2s',
              }}>
                E-mail
              </label>
              <input
                type="email"
                placeholder="seu@email.com"
                autoComplete="email"
                {...register('email')}
                onFocus={() => setFocusedField('email')}
                onBlur={() => setFocusedField(null)}
                style={{
                  background: focusedField === 'email'
                    ? 'rgba(108,142,247,0.08)'
                    : 'rgba(255,255,255,0.06)',
                  border: focusedField === 'email'
                    ? '1px solid rgba(108,142,247,0.45)'
                    : errors.email
                      ? '1px solid rgba(248,113,113,0.4)'
                      : '1px solid rgba(255,255,255,0.12)',
                  borderRadius: 12,
                  padding: '12px 16px',
                  color: 'var(--fg)',
                  fontFamily: "'Outfit', sans-serif",
                  fontSize: 14,
                  outline: 'none',
                  transition: 'background 0.2s, border-color 0.2s',
                  width: '100%',
                  boxSizing: 'border-box',
                }}
              />
              {errors.email && (
                <span style={{
                  fontFamily: "'JetBrains Mono', monospace",
                  fontSize: 10,
                  color: 'var(--danger)',
                  letterSpacing: '0.04em',
                }}>
                  ⚠ {errors.email.message}
                </span>
              )}
            </div>

            {/* Campo Senha */}
            <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
              <label style={{
                fontFamily: "'JetBrains Mono', monospace",
                fontSize: 10,
                letterSpacing: '0.12em',
                textTransform: 'uppercase',
                color: focusedField === 'password' ? 'var(--accent-light)' : 'var(--fg-3)',
                transition: 'color 0.2s',
              }}>
                Senha
              </label>
              <input
                type="password"
                placeholder="••••••••"
                autoComplete="current-password"
                {...register('password')}
                onFocus={() => setFocusedField('password')}
                onBlur={() => setFocusedField(null)}
                style={{
                  background: focusedField === 'password'
                    ? 'rgba(108,142,247,0.08)'
                    : 'rgba(255,255,255,0.06)',
                  border: focusedField === 'password'
                    ? '1px solid rgba(108,142,247,0.45)'
                    : errors.password
                      ? '1px solid rgba(248,113,113,0.4)'
                      : '1px solid rgba(255,255,255,0.12)',
                  borderRadius: 12,
                  padding: '12px 16px',
                  color: 'var(--fg)',
                  fontFamily: "'Outfit', sans-serif",
                  fontSize: 14,
                  outline: 'none',
                  transition: 'background 0.2s, border-color 0.2s',
                  width: '100%',
                  boxSizing: 'border-box',
                }}
              />
              {errors.password && (
                <span style={{
                  fontFamily: "'JetBrains Mono', monospace",
                  fontSize: 10,
                  color: 'var(--danger)',
                  letterSpacing: '0.04em',
                }}>
                  ⚠ {errors.password.message}
                </span>
              )}
            </div>

            {/* Mensagem de erro geral */}
            {errorMessage && (
              <motion.div
                initial={{ opacity: 0, y: -6 }}
                animate={{ opacity: 1, y: 0 }}
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: 8,
                  padding: '10px 14px',
                  background: 'rgba(248,113,113,0.08)',
                  border: '1px solid rgba(248,113,113,0.25)',
                  borderRadius: 10,
                  color: 'var(--danger)',
                  fontFamily: "'JetBrains Mono', monospace",
                  fontSize: 11,
                  letterSpacing: '0.03em',
                }}
              >
                <span style={{ flexShrink: 0 }}>⚠</span>
                {errorMessage}
              </motion.div>
            )}

            {/* Botão submit */}
            <button
              type="submit"
              disabled={isSubmitting}
              style={{
                marginTop: 4,
                padding: '14px 24px',
                background: isSubmitting
                  ? 'rgba(108,142,247,0.3)'
                  : 'linear-gradient(134deg, var(--accent-2) 0%, var(--accent) 63%)',
                border: '2px solid rgba(255,255,255,0.2)',
                borderRadius: 12,
                color: '#fff',
                fontFamily: "'Outfit', sans-serif",
                fontSize: 15,
                fontWeight: 700,
                letterSpacing: '0.04em',
                cursor: isSubmitting ? 'not-allowed' : 'pointer',
                transition: 'opacity 0.2s, transform 0.15s',
                boxShadow: isSubmitting
                  ? 'none'
                  : '0 4px 24px rgba(108,142,247,0.35), 0 2px 8px rgba(196,79,224,0.25)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                gap: 8,
                width: '100%',
              }}
              onMouseEnter={(e) => {
                if (!isSubmitting) {
                  e.currentTarget.style.opacity = '0.9'
                  e.currentTarget.style.transform = 'translateY(-1px)'
                }
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.opacity = '1'
                e.currentTarget.style.transform = 'translateY(0)'
              }}
            >
              {isSubmitting ? (
                <>
                  <span style={{
                    display: 'inline-block',
                    width: 14, height: 14,
                    borderRadius: '50%',
                    border: '2px solid rgba(255,255,255,0.3)',
                    borderTopColor: '#fff',
                    animation: 'btnSpin 0.7s linear infinite',
                  }} />
                  Entrando...
                </>
              ) : (
                'Entrar →'
              )}
            </button>
          </form>
        </div>

        {/* Rodapé */}
        <p style={{
          textAlign: 'center',
          fontFamily: "'JetBrains Mono', monospace",
          fontSize: 11,
          fontStyle: 'italic',
          color: 'var(--fg-3)',
          marginTop: 24,
          letterSpacing: '0.04em',
        }}>
          // não tem conta? fale com seu personal trainer.
        </p>
      </motion.div>

      {/* Keyframes */}
      <style>{`
        @keyframes loginSpin {
          from { transform: rotate(0deg); }
          to   { transform: rotate(360deg); }
        }
        @keyframes coreGlow {
          0%, 100% { transform: scale(1);   box-shadow: 0 0 20px rgba(108,142,247,0.7), 0 0 40px rgba(108,142,247,0.25); }
          50%       { transform: scale(1.2); box-shadow: 0 0 35px rgba(108,142,247,1),   0 0 60px rgba(108,142,247,0.4); }
        }
        @keyframes btnSpin {
          to { transform: rotate(360deg); }
        }
      `}</style>
    </div>
  )
}
