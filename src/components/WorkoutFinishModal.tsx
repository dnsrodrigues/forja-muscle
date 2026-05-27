import { useState } from 'react'
import { motion, AnimatePresence } from 'motion/react'
import { Icon } from './ui/Icon'
import type { WorkoutDifficulty } from '../types'

interface WorkoutFinishModalProps {
  isOpen: boolean
  durationMinutes: number
  totalExercises: number
  totalSets: number
  onConfirm: (data: { difficulty: WorkoutDifficulty; notes: string }) => void
  onClose: () => void
  isLoading: boolean
}

const DIFFICULTIES: { key: WorkoutDifficulty; emoji: string; label: string }[] = [
  { key: 'easy',     emoji: '😊', label: 'Fácil' },
  { key: 'medium',   emoji: '💪', label: 'Médio' },
  { key: 'hard',     emoji: '🔥', label: 'Difícil' },
  { key: 'terrible', emoji: '💀', label: 'Destruidor' },
]

export function WorkoutFinishModal({
  isOpen,
  durationMinutes,
  totalExercises,
  totalSets,
  onConfirm,
  onClose,
  isLoading,
}: WorkoutFinishModalProps) {
  const [difficulty, setDifficulty] = useState<WorkoutDifficulty | null>(null)
  const [notes, setNotes] = useState('')

  function handleConfirm() {
    if (!difficulty) return
    onConfirm({ difficulty, notes })
  }

  return (
    <AnimatePresence>
      {isOpen && (
        <>
          {/* Overlay */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            style={{
              position: 'fixed',
              inset: 0,
              background: 'rgba(6, 7, 26,0.85)',
              backdropFilter: 'blur(8px)',
              zIndex: 50,
            }}
            onClick={onClose}
          />

          {/* Modal */}
          <motion.div
            initial={{ opacity: 0, y: 40, scale: 0.96 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 40, scale: 0.96 }}
            transition={{ type: 'spring', stiffness: 350, damping: 28 }}
            style={{
              position: 'fixed',
              bottom: 0,
              left: 0,
              right: 0,
              zIndex: 51,
              background: 'var(--bg-1)',
              borderTop: '1px solid var(--border)',
              borderRadius: '16px 16px 0 0',
              padding: '24px 20px 40px',
              maxWidth: 560,
              margin: '0 auto',
            }}
          >
            {/* Handle */}
            <div style={{
              width: 36,
              height: 3,
              borderRadius: 2,
              background: 'var(--border-strong)',
              margin: '0 auto 20px',
            }} />

            {/* Título */}
            <div style={{
              fontFamily: "'JetBrains Mono', monospace",
              fontSize: 9,
              color: 'var(--accent)',
              letterSpacing: '0.15em',
              textTransform: 'uppercase',
              marginBottom: 4,
            }}>
              // treino concluído
            </div>
            <div style={{
              fontFamily: "var(--f-display)",
              fontWeight: 800,
              fontSize: 24,
              color: 'var(--text)',
              letterSpacing: '-0.02em',
              marginBottom: 20,
            }}>
              Que sessão! 💪
            </div>

            {/* Stats */}
            <div style={{
              display: 'grid',
              gridTemplateColumns: 'repeat(3, 1fr)',
              gap: 8,
              marginBottom: 24,
            }}>
              {[
                { icon: <Icon name="timer" size={14} />, value: `${Math.round(durationMinutes)}`, label: 'minutos' },
                { icon: <Icon name="dumbbell" size={14} />, value: String(totalExercises), label: 'exercícios' },
                { icon: <Icon name="hash" size={14} />, value: String(totalSets), label: 'séries' },
              ].map(({ icon, value, label }) => (
                <div key={label} style={{
                  background: 'var(--bg-2)',
                  border: '1px solid var(--border)',
                  borderRadius: 8,
                  padding: '12px 8px',
                  textAlign: 'center',
                }}>
                  <div style={{ color: 'var(--text-faint)', marginBottom: 4, display: 'flex', justifyContent: 'center' }}>
                    {icon}
                  </div>
                  <div style={{
                    fontFamily: "var(--f-display)",
                    fontWeight: 800,
                    fontSize: 20,
                    color: 'var(--accent)',
                    lineHeight: 1,
                    marginBottom: 2,
                  }}>
                    {value}
                  </div>
                  <div style={{
                    fontFamily: "'JetBrains Mono', monospace",
                    fontSize: 8,
                    color: 'var(--text-faint)',
                    letterSpacing: '0.1em',
                    textTransform: 'uppercase',
                  }}>
                    {label}
                  </div>
                </div>
              ))}
            </div>

            {/* Dificuldade */}
            <div style={{
              fontFamily: "'JetBrains Mono', monospace",
              fontSize: 9,
              color: 'var(--text-faint)',
              letterSpacing: '0.15em',
              textTransform: 'uppercase',
              marginBottom: 8,
            }}>
              // como foi o treino?
            </div>
            <div style={{
              display: 'grid',
              gridTemplateColumns: 'repeat(4, 1fr)',
              gap: 6,
              marginBottom: 20,
            }}>
              {DIFFICULTIES.map(({ key, emoji, label }) => (
                <button
                  key={key}
                  onClick={() => setDifficulty(key)}
                  style={{
                    background: difficulty === key ? 'rgba(212,255,58,0.13)' : 'var(--bg-2)',
                    border: `1px solid ${difficulty === key ? 'var(--accent)' : 'var(--border)'}`,
                    borderRadius: 8,
                    padding: '10px 4px',
                    cursor: 'pointer',
                    textAlign: 'center',
                    transition: 'all 0.15s',
                    transform: difficulty === key ? 'scale(1.04)' : 'scale(1)',
                  }}
                >
                  <div style={{ fontSize: 20, lineHeight: 1, marginBottom: 4 }}>{emoji}</div>
                  <div style={{
                    fontFamily: "'JetBrains Mono', monospace",
                    fontSize: 8,
                    color: difficulty === key ? 'var(--accent)' : 'var(--text-faint)',
                    letterSpacing: '0.06em',
                    textTransform: 'uppercase',
                  }}>
                    {label}
                  </div>
                </button>
              ))}
            </div>

            {/* Observações */}
            <div style={{
              fontFamily: "'JetBrains Mono', monospace",
              fontSize: 9,
              color: 'var(--text-faint)',
              letterSpacing: '0.15em',
              textTransform: 'uppercase',
              marginBottom: 8,
            }}>
              // observações (opcional)
            </div>
            <textarea
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              placeholder="// como foi? aumentei a carga, senti dor em..."
              rows={2}
              style={{
                width: '100%',
                background: 'var(--bg-2)',
                border: '1px solid var(--border)',
                borderRadius: 6,
                padding: '10px 12px',
                fontFamily: "'JetBrains Mono', monospace",
                fontSize: 11,
                color: 'var(--text)',
                resize: 'none',
                outline: 'none',
                marginBottom: 16,
                lineHeight: 1.6,
              }}
              onFocus={(e) => (e.target.style.borderColor = 'var(--border-strong)')}
              onBlur={(e) => (e.target.style.borderColor = 'var(--border)')}
            />

            {/* Botão confirmar */}
            <button
              onClick={handleConfirm}
              disabled={!difficulty || isLoading}
              style={{
                width: '100%',
                background: difficulty ? 'var(--accent)' : 'var(--surface-3)',
                border: 'none',
                borderRadius: 8,
                padding: '14px',
                fontFamily: "var(--f-display)",
                fontWeight: 800,
                fontSize: 13,
                color: difficulty ? '#05050a' : 'var(--text-faint)',
                letterSpacing: '0.04em',
                textTransform: 'uppercase',
                cursor: difficulty && !isLoading ? 'pointer' : 'not-allowed',
                transition: 'all 0.15s',
                opacity: isLoading ? 0.7 : 1,
              }}
            >
              {isLoading ? '// salvando...' : 'Salvar Treino →'}
            </button>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  )
}
