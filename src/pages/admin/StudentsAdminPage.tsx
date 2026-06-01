import { useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { useAuth } from '../../context/AuthContext'
import { getAllStudents, getTrainerStudents, deactivateStudent, activateProfile } from '../../services/trainer.service'
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

export function StudentsAdminPage() {
  const navigate = useNavigate()
  const { profile, isSuperAdmin } = useAuth()
  const [students, setStudents] = useState<UserProfile[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [modal, setModal] = useState<ModalState | null>(null)

  useEffect(() => { void load() }, [])

  async function load() {
    setLoading(true)
    setError(null)
    try {
      const data = isSuperAdmin
        ? await getAllStudents()
        : await getTrainerStudents(profile!.id)
      setStudents(data)
    } catch {
      setError('Erro ao carregar alunos')
    } finally {
      setLoading(false)
    }
  }

  function handleDeactivate(studentId: string) {
    setModal({
      title: 'Desativar aluno',
      message: 'O aluno perderá acesso ao sistema. Você poderá reativá-lo quando quiser.',
      confirmLabel: 'Desativar',
      danger: true,
      onConfirm: async () => {
        setModal(null)
        try {
          await deactivateStudent(studentId)
          setStudents((prev) => prev.map((s) => s.id === studentId ? { ...s, is_active: false } : s))
        } catch {
          setError('Erro ao desativar aluno')
        }
      },
    })
  }

  async function handleActivate(studentId: string) {
    try {
      await activateProfile(studentId)
      setStudents((prev) => prev.map((s) => s.id === studentId ? { ...s, is_active: true } : s))
    } catch {
      setError('Erro ao reativar aluno')
    }
  }

  function handleDelete(studentId: string) {
    setModal({
      title: 'Excluir aluno',
      message: 'Esta ação é permanente e não pode ser desfeita. O aluno será removido do sistema.',
      confirmLabel: 'Excluir',
      danger: true,
      onConfirm: async () => {
        setModal(null)
        try {
          const { error } = await supabase.functions.invoke('manage-users', {
            body: { action: 'delete', userId: studentId },
          })
          if (error) throw error
          setStudents((prev) => prev.filter((s) => s.id !== studentId))
        } catch {
          setError('Erro ao excluir aluno')
        }
      },
    })
  }

  const active = students.filter((s) => s.is_active)
  const inactive = students.filter((s) => !s.is_active)

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
        eyebrow={isSuperAdmin ? 'GESTÃO' : 'MEUS ALUNOS'}
        title="ALUNOS"
        actions={
          <button onClick={() => navigate('/admin/students/new')} className="btn primary">
            <Icon name="plus" size={14} /> Novo Aluno
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
            {students.length === 0 && (
              <div className="card" style={{ textAlign: 'center', padding: '32px 24px', borderStyle: 'dashed', color: 'var(--text-dim)' }}>
                Nenhum aluno cadastrado ainda.
              </div>
            )}

            {active.length > 0 && (
              <div className="col gap-2">
                {active.map((student) => (
                  <StudentRow
                    key={student.id}
                    student={student}
                    onOpen={() => navigate(`/admin/students/${student.id}`)}
                    onDeactivate={() => handleDeactivate(student.id)}
                    onDelete={() => handleDelete(student.id)}
                  />
                ))}
              </div>
            )}

            {inactive.length > 0 && (
              <div className="col gap-2" style={{ marginTop: active.length > 0 ? 24 : 0 }}>
                <div style={{ fontSize: 11, color: 'var(--text-dim)', fontFamily: "'JetBrains Mono', monospace", letterSpacing: '0.1em', textTransform: 'uppercase', marginBottom: 4 }}>
                  Inativos ({inactive.length})
                </div>
                {inactive.map((student) => (
                  <StudentRow
                    key={student.id}
                    student={student}
                    inactive
                    onOpen={() => navigate(`/admin/students/${student.id}`)}
                    onActivate={() => handleActivate(student.id)}
                    onDelete={() => handleDelete(student.id)}
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

interface StudentRowProps {
  student: UserProfile
  inactive?: boolean
  onOpen: () => void
  onDeactivate?: () => void
  onActivate?: () => void
  onDelete: () => void
}

function StudentRow({ student, inactive, onOpen, onDeactivate, onActivate, onDelete }: StudentRowProps) {
  return (
    <div
      className="card"
      style={{
        padding: '14px 16px',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        opacity: inactive ? 0.6 : 1,
        gap: 12,
      }}
    >
      <button
        onClick={onOpen}
        style={{
          display: 'flex', alignItems: 'center', gap: 12, flex: 1, minWidth: 0,
          background: 'transparent', border: 'none', cursor: 'pointer', textAlign: 'left', color: 'inherit', padding: 0,
        }}
      >
        <div style={{
          width: 36, height: 36, borderRadius: 8,
          background: inactive ? 'var(--bg-3)' : 'rgba(212,255,58,0.1)',
          display: 'flex', alignItems: 'center', justifyContent: 'center',
          fontFamily: "'Outfit', sans-serif", fontWeight: 800, fontSize: 16,
          color: inactive ? 'var(--text-dim)' : 'var(--accent)', flexShrink: 0,
        }}>
          {student.full_name.charAt(0).toUpperCase()}
        </div>
        <div style={{ minWidth: 0 }}>
          <div style={{ fontWeight: 600, fontSize: 14, color: inactive ? 'var(--text-dim)' : 'var(--text)' }}>
            {student.full_name}
          </div>
          <div style={{ fontSize: 12, color: 'var(--text-dim)' }}>
            {student.email}
            {inactive && <span style={{ marginLeft: 8, color: 'var(--danger)', fontSize: 10, fontFamily: "'JetBrains Mono', monospace" }}>INATIVO</span>}
          </div>
        </div>
      </button>
      <div style={{ display: 'flex', gap: 6, flexShrink: 0 }}>
        {inactive ? (
          <button onClick={onActivate} className="btn ghost" style={{ fontSize: 11, padding: '6px 12px', color: 'var(--accent)' }}>
            Reativar
          </button>
        ) : (
          <button onClick={onDeactivate} className="btn ghost" style={{ fontSize: 11, padding: '6px 12px' }}>
            Desativar
          </button>
        )}
        <button onClick={onDelete} className="btn ghost" style={{ fontSize: 11, padding: '6px 12px', color: 'var(--danger)', borderColor: 'var(--danger)' }}>
          Excluir
        </button>
      </div>
    </div>
  )
}
