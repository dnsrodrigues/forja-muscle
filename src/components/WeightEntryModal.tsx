import { useState } from 'react'
import { motion, AnimatePresence } from 'motion/react'
import type { UserWeight } from '../types'

interface Props {
  isOpen: boolean
  lastWeight?: number
  onClose: () => void
  onSaved: (weight: UserWeight) => void
  onSave: (weightKg: number, measuredAt: string) => Promise<UserWeight>
}

export function WeightEntryModal({ isOpen, lastWeight, onClose, onSaved, onSave }: Props) {
  const today = new Date().toISOString().substring(0, 10)
  const [weightStr, setWeightStr] = useState(lastWeight ? String(lastWeight) : '')
  const [date, setDate] = useState(today)
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const weightNum = parseFloat(weightStr.replace(',', '.'))
  const canSave = !isNaN(weightNum) && weightNum > 0 && weightNum < 400

  async function handleSave() {
    if (!canSave) return
    setSaving(true)
    setError(null)
    try {
      const saved = await onSave(weightNum, new Date(date + 'T12:00:00').toISOString())
      onSaved(saved)
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
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            style={{
              position: 'fixed', inset: 0,
              background: 'rgba(6, 7, 26,0.85)',
              backdropFilter: 'blur(8px)',
              zIndex: 50,
            }}
            onClick={onClose}
          />
          <motion.div
            initial={{ opacity: 0, y: 40, scale: 0.96 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 40, scale: 0.96 }}
            transition={{ type: 'spring', stiffness: 350, damping: 28 }}
            style={{
              position: 'fixed', bottom: 0, left: 0, right: 0, zIndex: 51,
              background: 'var(--surface)',
              borderTop: '1px solid var(--border-md)',
              borderRadius: '16px 16px 0 0',
              padding: '24px 20px 40px',
              maxWidth: 560,
              margin: '0 auto',
            }}
          >
            {/* Handle */}
            <div style={{
              width: 36, height: 3, borderRadius: 2,
              background: 'var(--border-strong)',
              margin: '0 auto 20px',
            }} />

            <div style={{
              fontFamily: "'JetBrains Mono', monospace",
              fontSize: 9, color: 'var(--accent)',
              letterSpacing: '0.15em', textTransform: 'uppercase', marginBottom: 4,
            }}>
              // registrar peso
            </div>
            <div style={{
              fontFamily: "'Outfit', sans-serif", fontWeight: 800,
              fontSize: 22, color: 'var(--fg)', letterSpacing: '-0.02em', marginBottom: 24,
            }}>
              Quanto você pesa hoje?
            </div>

            {/* Peso */}
            <div style={{ marginBottom: 16 }}>
              <div style={{
                fontFamily: "'JetBrains Mono', monospace", fontSize: 9,
                color: 'var(--fg-3)', letterSpacing: '0.15em',
                textTransform: 'uppercase', marginBottom: 6,
              }}>
                // peso (kg)
              </div>
              <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                <input
                  type="number"
                  inputMode="decimal"
                  step="0.1"
                  min="1"
                  max="400"
                  value={weightStr}
                  onChange={(e) => setWeightStr(e.target.value)}
                  placeholder="82.5"
                  autoFocus
                  style={{
                    flex: 1,
                    background: 'var(--surface-2)',
                    border: '1px solid var(--border-md)',
                    borderRadius: 6,
                    padding: '12px 14px',
                    fontFamily: "'Outfit', sans-serif",
                    fontWeight: 800,
                    fontSize: 22,
                    color: 'var(--fg)',
                    outline: 'none',
                    textAlign: 'center',
                  }}
                  onFocus={(e) => (e.target.style.borderColor = 'var(--accent)')}
                  onBlur={(e) => (e.target.style.borderColor = 'var(--border-md)')}
                />
                <div style={{
                  fontFamily: "'Outfit', sans-serif", fontWeight: 800,
                  fontSize: 18, color: 'var(--fg-3)',
                }}>
                  kg
                </div>
              </div>
            </div>

            {/* Data */}
            <div style={{ marginBottom: 24 }}>
              <div style={{
                fontFamily: "'JetBrains Mono', monospace", fontSize: 9,
                color: 'var(--fg-3)', letterSpacing: '0.15em',
                textTransform: 'uppercase', marginBottom: 6,
              }}>
                // data da medição
              </div>
              <input
                type="date"
                value={date}
                max={today}
                onChange={(e) => setDate(e.target.value)}
                style={{
                  width: '100%',
                  background: 'var(--surface-2)',
                  border: '1px solid var(--border-md)',
                  borderRadius: 6,
                  padding: '10px 14px',
                  fontFamily: "'JetBrains Mono', monospace",
                  fontSize: 12,
                  color: 'var(--fg)',
                  outline: 'none',
                  colorScheme: 'dark',
                }}
                onFocus={(e) => (e.target.style.borderColor = 'var(--accent)')}
                onBlur={(e) => (e.target.style.borderColor = 'var(--border-md)')}
              />
            </div>

            {error && (
              <div style={{
                fontFamily: "'JetBrains Mono', monospace", fontSize: 10,
                color: 'var(--danger)', marginBottom: 12,
              }}>
                ⚠ {error}
              </div>
            )}

            <button
              onClick={handleSave}
              disabled={!canSave || saving}
              style={{
                width: '100%',
                background: canSave ? 'var(--accent)' : 'var(--surface-3)',
                border: 'none', borderRadius: 8, padding: '14px',
                fontFamily: "'Outfit', sans-serif", fontWeight: 800,
                fontSize: 13, letterSpacing: '0.04em', textTransform: 'uppercase',
                color: canSave ? '#05050a' : 'var(--fg-3)',
                cursor: canSave && !saving ? 'pointer' : 'not-allowed',
                transition: 'all 0.15s',
                opacity: saving ? 0.7 : 1,
              }}
            >
              {saving ? '// salvando...' : 'Salvar →'}
            </button>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  )
}
