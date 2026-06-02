import { useState, useEffect, useRef } from 'react'
import { useNavigate } from 'react-router-dom'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import { motion } from 'motion/react'
import { useAuth } from '../context/AuthContext'
import { Icon } from '../components/ui/Icon'
import { ThemeSwitcher } from '../components/ui/ThemeSwitcher'
import { ShaderBackdrop } from '../components/ShaderBackdrop'

// ─── Validação ────────────────────────────────────────────────────────────────

const loginSchema = z.object({
  email: z.string().min(1, 'E-mail é obrigatório').email('Digite um e-mail válido'),
  password: z.string().min(1, 'Senha é obrigatória').min(6, 'Senha deve ter pelo menos 6 caracteres'),
})

type LoginForm = z.infer<typeof loginSchema>

// ─── Hook: anima um número de 0 até o target ─────────────────────────────────

function useCountUp(target: number, duration = 1400): number {
  const [value, setValue] = useState(0)
  const raf = useRef<number | null>(null)

  useEffect(() => {
    const start = performance.now()
    function tick(now: number) {
      const elapsed = now - start
      const progress = Math.min(elapsed / duration, 1)
      // easing: ease-out cubic
      const eased = 1 - Math.pow(1 - progress, 3)
      setValue(Math.round(target * eased))
      if (progress < 1) raf.current = requestAnimationFrame(tick)
    }
    raf.current = requestAnimationFrame(tick)
    return () => { if (raf.current) cancelAnimationFrame(raf.current) }
  }, [target, duration])

  return value
}

// ─── Página ───────────────────────────────────────────────────────────────────

export function LoginPage() {
  // Números aleatórios gerados uma vez por visita
  const [targets] = useState(() => ({
    treinos: Math.floor(Math.random() * 120) + 210,   // 210–329
    volume:  Math.floor(Math.random() * 800) + 900,   // 900–1699 (em kg, exibido como kt)
  }))
  const treinos = useCountUp(targets.treinos, 1400)
  const volumeRaw = useCountUp(targets.volume, 1600)
  // Formata volume: abaixo de 1000 mostra "NNN kg", acima mostra "N,Nkt"
  const volumeLabel = volumeRaw >= 1000
    ? `${Math.floor(volumeRaw / 100) / 10}`.replace('.', ',') + 'kt'
    : `${volumeRaw}`

  const { signIn } = useAuth()
  const navigate = useNavigate()
  const [errorMessage, setErrorMessage] = useState('')
  const [showPw, setShowPw] = useState(false)

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
    <div className="scr forja-login" style={{ minHeight: '100vh' }}>

      {/* ════════════ LATERAL ARTE ════════════ */}
      <div className="forja-login-art">

        {/* Shader WebGL animado — ondas com aberracao cromatica tingidas pela accent */}
        <ShaderBackdrop intensity={1.05} />

        {/* Vinheta para legibilidade do texto sobre o shader */}
        <div
          style={{
            position: 'absolute',
            inset: 0,
            pointerEvents: 'none',
            background: `
              radial-gradient(circle at 30% 50%, transparent 0%, rgba(0,0,0,0.55) 70%, rgba(0,0,0,0.85) 100%),
              linear-gradient(180deg, rgba(0,0,0,0.25) 0%, transparent 25%, transparent 75%, rgba(0,0,0,0.4) 100%)
            `,
          }}
        />

        {/* Marca FORJA no topo */}
        <div className="nav-brand" style={{ fontSize: 56, margin: 0, position: 'relative', color: '#f5f5f3' }}>
          FORJA<span className="nav-brand-dot">.</span>
        </div>

        {/* Letras FORJA gigantes no canto */}
        <div className="forja-login-bg-text">FORJA</div>

        {/* Copy editorial */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.7, ease: [0.22, 1, 0.36, 1] }}
          style={{ position: 'relative', maxWidth: '24ch' }}
        >
          <div className="eyebrow" style={{ color: 'var(--accent)', marginBottom: 14 }}>
            SEU TREINO. SEU CONTROLE.
          </div>
          <h1 className="f-display forja-login-headline">
            FORJADO PELO <span style={{ color: 'var(--accent)' }}>ESFORÇO</span> DIÁRIO.
          </h1>

          <div className="forja-login-stats" style={{ display: 'flex', gap: 22, marginTop: 32 }}>
            <div>
              <div className="f-display" style={{ fontSize: 38, color: 'var(--accent)' }}>
                {treinos}
              </div>
              <div style={{ fontSize: 11, color: 'rgba(255,255,255,0.6)', letterSpacing: '0.1em' }}>
                TREINOS REGISTRADOS HOJE
              </div>
            </div>
            <div>
              <div className="f-display" style={{ fontSize: 38, color: '#f5f5f3' }}>
                {volumeLabel}
              </div>
              <div style={{ fontSize: 11, color: 'rgba(255,255,255,0.6)', letterSpacing: '0.1em' }}>
                VOLUME MOVIMENTADO
              </div>
            </div>
          </div>
        </motion.div>
      </div>

      {/* ════════════ FORMULÁRIO ════════════ */}
      <div className="forja-login-form">
        <div style={{ position: 'absolute', top: 28, right: 32 }}>
          <ThemeSwitcher compact />
        </div>

        <motion.div
          initial={{ opacity: 0, y: 16 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, ease: [0.22, 1, 0.36, 1] }}
          style={{ width: '100%', maxWidth: 380 }}
        >
          <div className="eyebrow">Bem-vindo de volta</div>
          <h2 className="f-display" style={{ fontSize: 52, lineHeight: 1, margin: '8px 0 32px', color: 'var(--text)' }}>
            ENTRE NO<br />SEU PAINEL
          </h2>

          <form onSubmit={handleSubmit(onSubmit)} className="col gap-4" noValidate>

            <div>
              <div className="label-sm" style={{ marginBottom: 6 }}>Email</div>
              <input
                type="email"
                className="input"
                placeholder="seu@email.com"
                autoComplete="email"
                {...register('email')}
              />
              {errors.email && (
                <div style={{ fontSize: 11, color: 'var(--danger)', marginTop: 4, letterSpacing: '0.04em' }}>
                  ⚠ {errors.email.message}
                </div>
              )}
            </div>

            <div>
              <div className="label-sm" style={{ marginBottom: 6 }}>Senha</div>
              <div style={{ position: 'relative' }}>
                <input
                  type={showPw ? 'text' : 'password'}
                  className="input"
                  placeholder="••••••••••"
                  autoComplete="current-password"
                  style={{ paddingRight: 40 }}
                  {...register('password')}
                />
                <button
                  type="button"
                  tabIndex={-1}
                  onClick={() => setShowPw((v) => !v)}
                  aria-label={showPw ? 'Ocultar senha' : 'Mostrar senha'}
                  style={{ position: 'absolute', right: 10, top: '50%', transform: 'translateY(-50%)', background: 'none', border: 'none', cursor: 'pointer', color: 'var(--text-dim)', padding: 4, display: 'flex', alignItems: 'center' }}
                >
                  <Icon name={showPw ? 'eyeOff' : 'eye'} size={16} />
                </button>
              </div>
              {errors.password && (
                <div style={{ fontSize: 11, color: 'var(--danger)', marginTop: 4, letterSpacing: '0.04em' }}>
                  ⚠ {errors.password.message}
                </div>
              )}
            </div>

            {errorMessage && (
              <motion.div
                initial={{ opacity: 0, y: -6 }}
                animate={{ opacity: 1, y: 0 }}
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: 8,
                  padding: '10px 14px',
                  background: 'rgba(255,61,85,0.08)',
                  border: '1px solid rgba(255,61,85,0.25)',
                  borderRadius: 'var(--r-2)',
                  color: 'var(--danger)',
                  fontSize: 12,
                  letterSpacing: '0.03em',
                }}
              >
                <span style={{ flexShrink: 0 }}>⚠</span>
                {errorMessage}
              </motion.div>
            )}

            <button
              type="submit"
              disabled={isSubmitting}
              className="btn primary xl"
              style={{ width: '100%', justifyContent: 'center', marginTop: 12 }}
            >
              {isSubmitting ? (
                <>
                  <span
                    style={{
                      display: 'inline-block',
                      width: 14,
                      height: 14,
                      borderRadius: '50%',
                      border: '2px solid currentColor',
                      borderTopColor: 'transparent',
                      animation: 'forjaSpin 0.7s linear infinite',
                    }}
                  />
                  ENTRANDO...
                </>
              ) : (
                <>
                  ENTRAR <Icon name="arrow" size={14} />
                </>
              )}
            </button>

            <div style={{ textAlign: 'center', fontSize: 13, color: 'var(--text-dim)', marginTop: 18 }}>
              Primeira vez no FORJA?{' '}
              <span style={{ color: 'var(--text-faint)', fontStyle: 'italic' }}>
                Fale com seu personal trainer.
              </span>
            </div>
          </form>
        </motion.div>
      </div>

      {/* Keyframes + responsivo do Login */}
      <style>{`
        @keyframes forjaSpin { to { transform: rotate(360deg); } }
        @keyframes forjaBgShift {
          0%   { transform: translate(0, 0) scale(1); }
          100% { transform: translate(-5%, 5%) scale(1.1); }
        }

        .forja-login { display: flex; }
        .forja-login-art {
          flex: 1.1;
          background: #050506;
          position: relative;
          overflow: hidden;
          display: flex;
          flex-direction: column;
          justify-content: space-between;
          padding: 48px;
          min-height: 100vh;
          color: #f5f5f3;
        }
        .forja-login-bg-text {
          position: absolute;
          right: -60px;
          bottom: -40px;
          font-family: var(--f-display);
          font-size: 420px;
          color: rgba(255,255,255,0.04);
          line-height: 0.8;
          pointer-events: none;
        }
        .forja-login-headline {
          font-size: 88px;
          line-height: 0.9;
          margin: 0;
          color: #f5f5f3;
        }
        .forja-login-form {
          flex: 1;
          display: flex;
          align-items: center;
          justify-content: center;
          padding: 48px;
          background: var(--bg-0);
          position: relative;
          min-height: 100vh;
        }

        @media (max-width: 768px) {
          .forja-login { flex-direction: column; }
          .forja-login-art {
            min-height: auto;
            padding: 32px 28px 28px;
            justify-content: flex-start;
            gap: 20px;
          }
          .forja-login-headline { font-size: 44px; }
          .forja-login-bg-text { font-size: 180px; bottom: -20px; }
          .forja-login-form { padding: 32px 24px; min-height: auto; }
          .forja-login-stats { display: none; }
        }
      `}</style>
    </div>
  )
}
