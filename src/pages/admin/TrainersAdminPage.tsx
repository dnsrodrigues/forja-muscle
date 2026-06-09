import { useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { getTrainers, getTrainerStudents, deactivateTrainer, activateProfile } from '../../services/trainer.service'
import { supabase } from '../../lib/supabase'
import { Topbar } from '../../components/layout/Topbar'
import { Icon } from '../../components/ui/Icon'
import { ConfirmModal } from '../../components/ui/ConfirmModal'
import type { UserProfile } from '../../types'

interface ModalState {
  title: string
  message: string
  confirmLabel: string
  danger?: boolean
  onConfirm: () => void
}

export function TrainersAdminPage() {
  const navigate = useNavigate()
  const [trainers, setTrainers] = useState<UserProfile[]>([])
  const [studentCounts, setStudentCounts] = useState<Record<string, number>>({})
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [modal, setModal] = useState<ModalState | null>(null)

  useEffect(() => { void loadTrainers() }, [])

  async function loadTrainers() {
    setLoading(true)
    setError(null)
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

  function handleDeactivate(trainerId: string) {
    setModal({
      title: 'Desativar trainer',
      message: 'O trainer perderá acesso ao sistema. Os alunos vinculados ficarão sem trainer atribuído.',
      confirmLabel: 'Desativar',
      danger: true,
      onConfirm: async () => {
        setModal(null)
        try {
          await deactivateTrainer(trainerId)
          setTrainers((prev) => prev.map((t) => t.id === trainerId ? { ...t, is_active: false } : t))
        } catch {
          setError('Erro ao desativar trainer')
        }
      },
    })
  }

  async function handleActivate(trainerId: string) {
    try {
      await activateProfile(trainerId)
      setTrainers((prev) => prev.map((t) => t.id === trainerId ? { ...t, is_active: true } : t))
    } catch {
      setError('Erro ao reativar trainer')
    }
  }

  function handleDelete(trainerId: string) {
    setModal({
      title: 'Excluir trainer',
      message: 'Esta ação é permanente e não pode ser desfeita. O trainer será removido do sistema.',
      confirmLabel: 'Excluir',
      danger: true,
      onConfirm: async () => {
        setModal(null)
        try {
          const { error } = await supabase.functions.invoke('manage-users', {
            body: { action: 'delete', userId: trainerId },
          })
          if (error) throw error
          setTrainers((prev) => prev.filter((t) => t.id !== trainerId))
        } catch {
          setError('Erro ao excluir trainer')
        }
      },
    })
  }

  const active = trainers.filter((t) => t.is_active)
  const inactive = trainers.filter((t) => !t.is_active)

  return (
    <>
      {modal && (
        <ConfirmModal
          title={modal.title}
          message={modal.message}
          confirmLabel={modal.confirmLabel}
          danger={modal.danger}
          onConfirm={modal.onConfirm}
          onCancel={() => setModal(null)}
        />
      )}
      <Topbar
        eyebrow="GESTÃO"
        title="TRAINERS"
        actions={
          <button onClick={() => navigate('/admin/trainers/new')} className="btn primary">
            <Icon name="plus" size={14} /> Novo Trainer
          </button>
        }
      />

      <div className="content">
        {loading && (
          <div className="col gap-2">
            {[1, 2, 3].map((i) => (
              <div key={i} className="skeleton" style={{ height: 64, borderRadius: 8 }} />
            ))}
          </div>
        )}

        {!loading && error && (
          <div className="card" style={{ borderLeft: '2px solid var(--danger)' }}>
            <span style={{ color: 'var(--danger)' }}>{error}</span>
          </div>
        )}

        {!loading && !error && (
          <>
            {trainers.length === 0 && (
              <div className="card" style={{ textAlign: 'center', padding: '32px 24px', borderStyle: 'dashed', color: 'var(--text-dim)' }}>
                Nenhum trainer cadastrado ainda.
              </div>
            )}

            {active.length > 0 && (
              <div className="col gap-2">
                {active.map((trainer) => (
                  <TrainerRow
                    key={trainer.id}
                    trainer={trainer}
                    studentCount={studentCounts[trainer.id] ?? 0}
                    onDeactivate={() => handleDeactivate(trainer.id)}
                    onDelete={() => handleDelete(trainer.id)}
                  />
                ))}
              </div>
            )}

            {inactive.length > 0 && (
              <div className="col gap-2" style={{ marginTop: active.length > 0 ? 24 : 0 }}>
                <div style={{ fontSize: 11, color: 'var(--text-dim)', fontFamily: "'JetBrains Mono', monospace", letterSpacing: '0.1em', textTransform: 'uppercase', marginBottom: 4 }}>
                  Inativos ({inactive.length})
                </div>
                {inactive.map((trainer) => (
                  <TrainerRow
                    key={trainer.id}
                    trainer={trainer}
                    studentCount={studentCounts[trainer.id] ?? 0}
                    inactive
                    onActivate={() => handleActivate(trainer.id)}
                    onDelete={() => handleDelete(trainer.id)}
                  />
                ))}
              </div>
            )}
          </>
        )}
      </div>
    </>
  )
}

interface TrainerRowProps {
  trainer: UserProfile
  studentCount: number
  inactive?: boolean
  onDeactivate?: () => void
  onActivate?: () => void
  onDelete: () => void
}

function TrainerRow({ trainer, studentCount, inactive, onDeactivate, onActivate, onDelete }: TrainerRowProps) {
  return (
    <div
      className="card"
      style={{
        padding: '14px 16px',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        opacity: inactive ? 0.6 : 1,
      }}
    >
      <div style={{ display: 'flex', alignItems: 'center', gap: 12, flex: 1, minWidth: 0 }}>
        <div style={{
          width: 36, height: 36, borderRadius: 8,
          background: inactive ? 'var(--bg-3)' : 'rgba(212,255,58,0.1)',
          display: 'flex', alignItems: 'center', justifyContent: 'center',
          fontFamily: "'Outfit', sans-serif", fontWeight: 800, fontSize: 16,
          color: inactive ? 'var(--text-dim)' : 'var(--accent)', flexShrink: 0,
        }}>
          {trainer.full_name.charAt(0).toUpperCase()}
        </div>
        <div style={{ minWidth: 0 }}>
          <div style={{ fontWeight: 600, fontSize: 14, color: inactive ? 'var(--text-dim)' : 'var(--text)' }}>
            {trainer.full_name}
          </div>
          <div style={{ fontSize: 12, color: 'var(--text-dim)', wordBreak: 'break-word' }}>
            {trainer.email} · {studentCount} aluno(s)
            {inactive && <span style={{ marginLeft: 8, color: 'var(--danger)', fontSize: 10, fontFamily: "'JetBrains Mono', monospace" }}>INATIVO</span>}
          </div>
        </div>
      </div>
      <div style={{ display: 'flex', gap: 6, flexShrink: 0 }}>
        {inactive ? (
          <button onClick={onActivate} className="icon-btn accent" title="Reativar" aria-label="Reativar trainer">
            <Icon name="power" size={16} />
          </button>
        ) : (
          <button onClick={onDeactivate} className="icon-btn" title="Desativar" aria-label="Desativar trainer">
            <Icon name="power" size={16} />
          </button>
        )}
        <button onClick={onDelete} className="icon-btn danger" title="Excluir" aria-label="Excluir trainer">
          <Icon name="trash" size={16} />
        </button>
      </div>
    </div>
  )
}
