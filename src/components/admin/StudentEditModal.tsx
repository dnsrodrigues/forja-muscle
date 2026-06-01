import { useState } from 'react'
import { motion, AnimatePresence } from 'motion/react'
import { useModalA11y } from '../../hooks/useModalA11y'
import { updateProfile } from '../../services/profile.service'
import type { UserProfile } from '../../types'

interface Props {
  student: UserProfile
  isOpen: boolean
  onClose: () => void
  onSaved: (updated: UserProfile) => void
}

export function StudentEditModal({ student, isOpen, onClose, onSaved }: Props) {
  const [fullName, setFullName] = useState(student.full_name)
  const [goal, setGoal] = useState(student.goal ?? '')
  const [height, setHeight] = useState(student.height ? String(student.height) : '')
  const [targetWeight, setTargetWeight] = useState(student.target_weight ? String(student.target_weight) : '')
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const { initialFocusRef } = useModalA11y(isOpen, onClose)

  const canSave = fullName.trim().length > 1

  async function handleSave() {
    if (!canSave) return
    setSaving(true)
    setError(null)
    try {
      const heightNum = parseFloat(height.replace(',', '.'))
      const targetNum = parseFloat(targetWeight.replace(',', '.'))
      const updated = await updateProfile(student.id, {
        full_name: fullName.trim(),
        goal: goal.trim() || undefined,
        height: isNaN(heightNum) ? undefined : heightNum,
        target_weight: isNaN(targetNum) ? undefined : targetNum,
      })
      onSaved(updated)
      onClose()
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Erro ao salvar')
    } finally {
      setSaving(false)
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
            role="dialog" aria-modal="true" aria-labelledby="modal-student-edit-title"
            style={{
              position: 'fixed', bottom: 0, left: 0, right: 0, zIndex: 51,
              background: 'var(--bg-1)', borderTop: '1px solid var(--border)',
              borderRadius: '16px 16px 0 0', padding: '24px 20px 40px',
              maxWidth: 560, margin: '0 auto', maxHeight: '88vh', overflowY: 'auto',
            }}
          >
            <div style={{ width: 36, height: 3, borderRadius: 2, background: 'var(--border-strong)', margin: '0 auto 20px' }} />
            <div className="eyebrow" style={{ color: 'var(--accent)', marginBottom: 6 }}>// editar aluno</div>
            <div id="modal-student-edit-title" className="f-display" style={{ fontSize: 22, color: 'var(--text)', marginBottom: 20 }}>
              Editar dados
            </div>

            <div className="col gap-3">
              <div>
                <div className="label-sm" style={{ marginBottom: 6 }}>Nome completo</div>
                <input ref={(el) => { initialFocusRef.current = el }} className="input" value={fullName} onChange={(e) => setFullName(e.target.value)} />
              </div>
              <div>
                <div className="label-sm" style={{ marginBottom: 6 }}>Objetivo</div>
                <textarea className="input" value={goal} onChange={(e) => setGoal(e.target.value)} rows={2} placeholder="Ex: Ganhar massa muscular" />
              </div>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
                <div>
                  <div className="label-sm" style={{ marginBottom: 6 }}>Altura (cm)</div>
                  <input className="input" type="number" value={height} onChange={(e) => setHeight(e.target.value)} placeholder="175" />
                </div>
                <div>
                  <div className="label-sm" style={{ marginBottom: 6 }}>Peso alvo (kg)</div>
                  <input className="input" type="number" value={targetWeight} onChange={(e) => setTargetWeight(e.target.value)} placeholder="80" />
                </div>
              </div>
            </div>

            {error && <div style={{ color: 'var(--danger)', fontSize: 12, marginTop: 12, fontFamily: 'var(--f-mono)' }}>⚠ {error}</div>}

            <div className="row gap-2" style={{ marginTop: 20 }}>
              <button onClick={onClose} className="btn ghost" style={{ flex: 1 }}>Cancelar</button>
              <button onClick={handleSave} disabled={!canSave || saving} className="btn primary" style={{ flex: 2 }}>
                {saving ? 'Salvando...' : 'Salvar alterações'}
              </button>
            </div>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  )
}
