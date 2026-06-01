import { useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { motion, AnimatePresence } from 'motion/react'
import { useModalA11y } from '../../hooks/useModalA11y'
import { useAuth } from '../../context/AuthContext'
import { getTemplates, assignTemplateToStudent } from '../../services/workout.service'
import { Icon } from '../ui/Icon'
import type { Workout } from '../../types'

interface Props {
  studentId: string
  studentName: string
  isOpen: boolean
  onClose: () => void
  onAssigned: () => void
}

export function AssignToStudentModal({ studentId, studentName, isOpen, onClose, onAssigned }: Props) {
  const navigate = useNavigate()
  const { profile } = useAuth()
  const [templates, setTemplates] = useState<Workout[]>([])
  const [loading, setLoading] = useState(false)
  const [assigning, setAssigning] = useState<string | null>(null)
  const [assigned, setAssigned] = useState<Set<string>>(new Set())
  const [error, setError] = useState<string | null>(null)
  const { initialFocusRef } = useModalA11y(isOpen, onClose)

  useEffect(() => {
    if (!isOpen) return
    setLoading(true)
    getTemplates()
      .then(setTemplates)
      .catch((e) => setError(e instanceof Error ? e.message : 'Erro ao carregar templates'))
      .finally(() => setLoading(false))
  }, [isOpen])

  async function handleAssign(template: Workout) {
    if (!profile) return
    setAssigning(template.id)
    setError(null)
    try {
      await assignTemplateToStudent(template.id, studentId, profile.id)
      setAssigned((prev) => new Set([...prev, template.id]))
      onAssigned()
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Erro ao atribuir ficha')
    } finally {
      setAssigning(null)
    }
  }

  return (
    <AnimatePresence>
      {isOpen && (
        <>
          <motion.div
            initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
            style={{ position: 'fixed', inset: 0, background: 'rgba(6,7,26,0.85)', backdropFilter: 'blur(8px)', zIndex: 50 }}
            onClick={onClose}
          />
          <motion.div
            initial={{ opacity: 0, y: 40, scale: 0.96 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 40, scale: 0.96 }}
            transition={{ type: 'spring', stiffness: 350, damping: 28 }}
            role="dialog" aria-modal="true" aria-labelledby="modal-assign2-title"
            style={{
              position: 'fixed', bottom: 0, left: 0, right: 0, zIndex: 51,
              background: 'var(--bg-1)', borderTop: '1px solid var(--border)',
              borderRadius: '16px 16px 0 0', padding: '24px 20px 40px',
              maxWidth: 560, margin: '0 auto', maxHeight: '88vh', overflowY: 'auto',
            }}
          >
            <div style={{ width: 36, height: 3, borderRadius: 2, background: 'var(--border-strong)', margin: '0 auto 20px' }} />
            <div className="eyebrow" style={{ color: 'var(--accent)', marginBottom: 6 }}>// atribuir ficha</div>
            <div id="modal-assign2-title" className="f-display" style={{ fontSize: 20, color: 'var(--text)', marginBottom: 4 }}>
              Atribuir ficha a {studentName}
            </div>

            <button
              ref={(el) => { initialFocusRef.current = el }}
              onClick={() => navigate(`/admin/workouts/new?userId=${studentId}`)}
              className="btn"
              style={{ width: '100%', marginTop: 16, marginBottom: 16, justifyContent: 'center' }}
            >
              <Icon name="plus" size={14} /> Criar ficha do zero
            </button>

            <div className="label-sm" style={{ marginBottom: 10 }}>Ou use um template da biblioteca</div>

            {error && <div style={{ color: 'var(--danger)', fontSize: 12, marginBottom: 10, fontFamily: 'var(--f-mono)' }}>⚠ {error}</div>}

            {loading ? (
              <div className="skeleton" style={{ height: 56, borderRadius: 8 }} />
            ) : templates.length === 0 ? (
              <div style={{ color: 'var(--text-dim)', fontSize: 13, fontStyle: 'italic', padding: '12px 0' }}>
                Nenhum template na biblioteca ainda.
              </div>
            ) : (
              <div className="col gap-2">
                {templates.map((t) => {
                  const isAssigned = assigned.has(t.id)
                  return (
                    <div
                      key={t.id}
                      style={{
                        display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 12,
                        padding: '12px 14px', background: 'var(--bg-2)',
                        border: '1px solid var(--hairline)', borderRadius: 'var(--r-2)',
                      }}
                    >
                      <span style={{ fontWeight: 600, fontSize: 14, color: 'var(--text)' }}>{t.name}</span>
                      <button
                        onClick={() => !isAssigned && handleAssign(t)}
                        disabled={isAssigned || assigning === t.id}
                        className={'btn ' + (isAssigned ? 'ghost' : 'primary')}
                        style={{ fontSize: 11, padding: '6px 12px', flexShrink: 0 }}
                      >
                        {assigning === t.id ? '...' : isAssigned ? <><Icon name="check" size={12} /> Atribuída</> : 'Atribuir'}
                      </button>
                    </div>
                  )
                })}
              </div>
            )}
          </motion.div>
        </>
      )}
    </AnimatePresence>
  )
}
