import { useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { getTrainers, getTrainerStudents, deactivateTrainer } from '../../services/trainer.service'
import type { UserProfile } from '../../types'

export function TrainersAdminPage() {
  const navigate = useNavigate()
  const [trainers, setTrainers] = useState<UserProfile[]>([])
  const [studentCounts, setStudentCounts] = useState<Record<string, number>>({})
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    loadTrainers()
  }, [])

  async function loadTrainers() {
    try {
      const data = await getTrainers()
      setTrainers(data)
      const counts: Record<string, number> = {}
      await Promise.all(
        data.map(async (t) => {
          const students = await getTrainerStudents(t.id)
          counts[t.id] = students.length
        })
      )
      setStudentCounts(counts)
    } catch {
      setError('Erro ao carregar trainers')
    } finally {
      setLoading(false)
    }
  }

  async function handleDeactivate(trainerId: string) {
    if (!confirm('Desativar este trainer? Os alunos vinculados ficarão sem trainer.')) return
    try {
      await deactivateTrainer(trainerId)
      setTrainers((prev) => prev.filter((t) => t.id !== trainerId))
    } catch {
      alert('Erro ao desativar trainer')
    }
  }

  if (loading) return (
    <div style={{ padding: 24 }}>
      {[1, 2, 3].map((i) => (
        <div key={i} className="skeleton" style={{ height: 64, borderRadius: 8, marginBottom: 8 }} />
      ))}
    </div>
  )

  if (error) return <div style={{ padding: 24, color: 'var(--danger)' }}>{error}</div>

  return (
    <div style={{ padding: 24, maxWidth: 720 }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 24 }}>
        <div>
          <div style={{
            fontFamily: "'JetBrains Mono', monospace",
            fontSize: 9,
            color: 'var(--fg-3)',
            letterSpacing: '0.15em',
            textTransform: 'uppercase',
            marginBottom: 4,
          }}>
            Gestão
          </div>
          <h1 className="gradient-text" style={{
            fontFamily: "'Outfit', sans-serif",
            fontWeight: 800,
            fontSize: 24,
            margin: 0,
          }}>
            Trainers
          </h1>
        </div>
        <button
          onClick={() => navigate('/admin/trainers/new')}
          style={{
            background: 'var(--accent)',
            color: '#fff',
            border: 'none',
            borderRadius: 8,
            padding: '10px 20px',
            fontFamily: "'JetBrains Mono', monospace",
            fontSize: 12,
            fontWeight: 600,
            cursor: 'pointer',
          }}
        >
          + Novo Trainer
        </button>
      </div>

      {trainers.length === 0 ? (
        <div className="glass-card" style={{ borderRadius: 12, padding: 32, textAlign: 'center', color: 'var(--fg-2)' }}>
          Nenhum trainer cadastrado ainda.
        </div>
      ) : (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
          {trainers.map((trainer) => (
            <div
              key={trainer.id}
              className="glass-card"
              style={{
                borderRadius: 12,
                padding: '14px 16px',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'space-between',
              }}
            >
              <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
                <div style={{
                  width: 36,
                  height: 36,
                  borderRadius: 8,
                  background: 'var(--accent-muted)',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  fontFamily: "'Outfit', sans-serif",
                  fontWeight: 800,
                  fontSize: 16,
                  color: 'var(--accent)',
                }}>
                  {trainer.full_name.charAt(0).toUpperCase()}
                </div>
                <div>
                  <div style={{ fontWeight: 600, fontSize: 14 }}>{trainer.full_name}</div>
                  <div style={{ fontSize: 12, color: 'var(--fg-2)' }}>
                    {trainer.email} · {studentCounts[trainer.id] ?? 0} aluno(s)
                  </div>
                </div>
              </div>
              <button
                onClick={() => handleDeactivate(trainer.id)}
                style={{
                  background: 'transparent',
                  border: '1px solid var(--border)',
                  borderRadius: 6,
                  padding: '6px 12px',
                  fontSize: 11,
                  color: 'var(--danger)',
                  cursor: 'pointer',
                  fontFamily: "'JetBrains Mono', monospace",
                }}
              >
                Desativar
              </button>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}
