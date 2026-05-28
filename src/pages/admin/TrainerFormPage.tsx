import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { supabase } from '../../lib/supabase'

export function TrainerFormPage() {
  const navigate = useNavigate()
  const [fullName, setFullName] = useState('')
  const [email, setEmail] = useState('')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [success, setSuccess] = useState(false)

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setError(null)
    setLoading(true)

    try {
      // 1. Cria a conta no Supabase Auth
      const { data: signUpData, error: signUpError } = await supabase.auth.signUp({
        email,
        password: crypto.randomUUID(),
        options: { data: { full_name: fullName } },
      })

      if (signUpError) throw signUpError
      if (!signUpData.user) throw new Error('Usuário não criado')

      // 2. Chama Edge Function para promover para trainer
      const { error: promoteError } = await supabase.functions.invoke('promote-to-trainer', {
        body: { userId: signUpData.user.id },
      })

      if (promoteError) throw promoteError

      setSuccess(true)
      setTimeout(() => navigate('/admin/trainers'), 2000)
    } catch (e: unknown) {
      setError(e instanceof Error ? e.message : 'Erro ao criar trainer')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div style={{ padding: 24, maxWidth: 480 }}>
      <div style={{ marginBottom: 24 }}>
        <div style={{
          fontFamily: "'JetBrains Mono', monospace",
          fontSize: 9,
          color: 'var(--fg-3)',
          letterSpacing: '0.15em',
          textTransform: 'uppercase',
          marginBottom: 4,
        }}>
          Trainers
        </div>
        <h1 className="gradient-text" style={{
          fontFamily: "'Outfit', sans-serif",
          fontWeight: 800,
          fontSize: 24,
          margin: 0,
        }}>
          Novo Trainer
        </h1>
      </div>

      {success ? (
        <div className="glass-card" style={{
          borderRadius: 12,
          padding: 24,
          color: 'var(--success)',
          textAlign: 'center',
        }}>
          ✓ Trainer criado com sucesso! Redirecionando...
        </div>
      ) : (
        <form onSubmit={handleSubmit} className="glass-card" style={{
          borderRadius: 12,
          padding: 24,
          display: 'flex',
          flexDirection: 'column',
          gap: 16,
        }}>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
            <label style={{
              fontSize: 12,
              color: 'var(--fg-2)',
              fontFamily: "'JetBrains Mono', monospace",
            }}>
              Nome completo
            </label>
            <input
              value={fullName}
              onChange={(e) => setFullName(e.target.value)}
              required
              placeholder="Ex: João Silva"
              style={{
                background: 'var(--surface)',
                border: '1px solid var(--border-md)',
                borderRadius: 8,
                padding: '10px 12px',
                color: 'var(--fg)',
                fontSize: 14,
                outline: 'none',
              }}
            />
          </div>

          <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
            <label style={{
              fontSize: 12,
              color: 'var(--fg-2)',
              fontFamily: "'JetBrains Mono', monospace",
            }}>
              E-mail
            </label>
            <input
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
              placeholder="trainer@email.com"
              style={{
                background: 'var(--surface)',
                border: '1px solid var(--border-md)',
                borderRadius: 8,
                padding: '10px 12px',
                color: 'var(--fg)',
                fontSize: 14,
                outline: 'none',
              }}
            />
          </div>

          {error && (
            <div style={{
              color: 'var(--danger)',
              fontSize: 13,
              padding: '8px 12px',
              background: 'rgba(248,113,113,0.08)',
              borderRadius: 6,
            }}>
              {error}
            </div>
          )}

          <div style={{ display: 'flex', gap: 8, marginTop: 8 }}>
            <button
              type="button"
              onClick={() => navigate('/admin/trainers')}
              style={{
                flex: 1,
                padding: '10px',
                borderRadius: 8,
                background: 'transparent',
                border: '1px solid var(--border-md)',
                color: 'var(--fg-2)',
                cursor: 'pointer',
                fontSize: 13,
                fontFamily: "'JetBrains Mono', monospace",
              }}
            >
              Cancelar
            </button>
            <button
              type="submit"
              disabled={loading}
              style={{
                flex: 2,
                padding: '10px',
                borderRadius: 8,
                background: 'var(--accent)',
                border: 'none',
                color: '#fff',
                cursor: loading ? 'not-allowed' : 'pointer',
                fontSize: 13,
                fontWeight: 600,
                fontFamily: "'JetBrains Mono', monospace",
                opacity: loading ? 0.7 : 1,
              }}
            >
              {loading ? 'Criando...' : 'Criar Trainer'}
            </button>
          </div>
        </form>
      )}
    </div>
  )
}
