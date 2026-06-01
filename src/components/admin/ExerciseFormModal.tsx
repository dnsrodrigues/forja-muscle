import { useState } from 'react'
import { motion, AnimatePresence } from 'motion/react'
import { useModalA11y } from '../../hooks/useModalA11y'
import { useAuth } from '../../context/AuthContext'
import { createExercise, updateExercise } from '../../services/workout.service'
import { MUSCLE_GROUP_LABELS } from '../../types'
import type { Exercise, MuscleGroup } from '../../types'

interface Props {
  /** quando presente, o modal está em modo edição */
  exercise?: Exercise | null
  isOpen: boolean
  onClose: () => void
  onSaved: () => void
}

const GROUPS = Object.entries(MUSCLE_GROUP_LABELS) as [MuscleGroup, string][]

export function ExerciseFormModal({ exercise, isOpen, onClose, onSaved }: Props) {
  const { profile } = useAuth()
  const isEditing = !!exercise
  const [name, setName] = useState(exercise?.name ?? '')
  const [group, setGroup] = useState<MuscleGroup>(exercise?.muscle_group ?? 'chest')
  const [description, setDescription] = useState(exercise?.description ?? '')
  const [videoUrl, setVideoUrl] = useState(exercise?.video_url ?? '')
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const { initialFocusRef } = useModalA11y(isOpen, onClose)

  const canSave = name.trim().length > 1

  async function handleSave() {
    if (!canSave || !profile) return
    setSaving(true)
    setError(null)
    try {
      if (isEditing && exercise) {
        await updateExercise(exercise.id, { name, muscle_group: group, description, video_url: videoUrl })
      } else {
        await createExercise({ name, muscle_group: group, description, video_url: videoUrl, createdBy: profile.id })
      }
      onSaved()
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
            role="dialog" aria-modal="true" aria-labelledby="modal-exercise-title"
            style={{
              position: 'fixed', bottom: 0, left: 0, right: 0, zIndex: 51,
              background: 'var(--bg-1)', borderTop: '1px solid var(--border)',
              borderRadius: '16px 16px 0 0', padding: '24px 20px 40px',
              maxWidth: 560, margin: '0 auto', maxHeight: '88vh', overflowY: 'auto',
            }}
          >
            <div style={{ width: 36, height: 3, borderRadius: 2, background: 'var(--border-strong)', margin: '0 auto 20px' }} />
            <div className="eyebrow" style={{ color: 'var(--accent)', marginBottom: 6 }}>
              // {isEditing ? 'editar exercício' : 'novo exercício'}
            </div>
            <div id="modal-exercise-title" className="f-display" style={{ fontSize: 22, color: 'var(--text)', marginBottom: 20 }}>
              {isEditing ? 'Editar exercício' : 'Criar exercício'}
            </div>

            <div className="col gap-3">
              <div>
                <div className="label-sm" style={{ marginBottom: 6 }}>Nome</div>
                <input
                  ref={(el) => { initialFocusRef.current = el }}
                  className="input" value={name}
                  onChange={(e) => setName(e.target.value)} placeholder="Ex: Supino reto"
                />
              </div>
              <div>
                <div className="label-sm" style={{ marginBottom: 6 }}>Grupo muscular</div>
                <select className="input" value={group} onChange={(e) => setGroup(e.target.value as MuscleGroup)}>
                  {GROUPS.map(([value, label]) => (
                    <option key={value} value={value}>{label}</option>
                  ))}
                </select>
              </div>
              <div>
                <div className="label-sm" style={{ marginBottom: 6 }}>Descrição (opcional)</div>
                <textarea
                  className="input" value={description}
                  onChange={(e) => setDescription(e.target.value)} rows={3}
                  placeholder="Como executar, dicas de postura..."
                />
              </div>
              <div>
                <div className="label-sm" style={{ marginBottom: 6 }}>Link de vídeo (opcional)</div>
                <input
                  className="input" value={videoUrl}
                  onChange={(e) => setVideoUrl(e.target.value)} placeholder="https://..."
                />
              </div>
            </div>

            {error && (
              <div style={{ color: 'var(--danger)', fontSize: 12, marginTop: 12, fontFamily: 'var(--f-mono)' }}>⚠ {error}</div>
            )}

            <div className="row gap-2" style={{ marginTop: 20 }}>
              <button onClick={onClose} className="btn ghost" style={{ flex: 1 }}>Cancelar</button>
              <button onClick={handleSave} disabled={!canSave || saving} className="btn primary" style={{ flex: 2 }}>
                {saving ? 'Salvando...' : isEditing ? 'Salvar alterações' : 'Criar exercício'}
              </button>
            </div>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  )
}
