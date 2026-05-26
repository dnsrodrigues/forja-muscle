import { useState } from 'react'
import { motion, AnimatePresence } from 'motion/react'
import type { BodyMeasurement } from '../types'

interface Props {
  isOpen: boolean
  onClose: () => void
  onSaved: (measurement: BodyMeasurement) => void
  onSave: (data: Partial<BodyMeasurement>) => Promise<BodyMeasurement>
}

const FIELDS: { key: keyof BodyMeasurement; label: string; placeholder: string }[] = [
  { key: 'waist_cm',   label: 'Cintura',     placeholder: '75' },
  { key: 'hip_cm',     label: 'Quadril',     placeholder: '95' },
  { key: 'abdomen_cm', label: 'Abdômen',     placeholder: '85' },
  { key: 'chest_cm',   label: 'Peitoral',    placeholder: '95' },
  { key: 'arm_cm',     label: 'Braço',       placeholder: '35' },
  { key: 'thigh_cm',   label: 'Coxa',        placeholder: '58' },
  { key: 'calf_cm',    label: 'Panturrilha', placeholder: '37' },
]

type FieldValues = Partial<Record<keyof BodyMeasurement, string>>

export function MeasurementEntryModal({ isOpen, onClose, onSaved, onSave }: Props) {
  const today = new Date().toISOString().substring(0, 10)
  const [fields, setFields] = useState<FieldValues>({})
  const [date, setDate] = useState(today)
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const filledCount = FIELDS.filter((f) => {
    const v = fields[f.key]
    return v && v.trim() !== '' && !isNaN(parseFloat(v))
  }).length

  const canSave = filledCount > 0

  function setField(key: keyof BodyMeasurement, value: string) {
    setFields((prev) => ({ ...prev, [key]: value }))
  }

  async function handleSave() {
    if (!canSave) return
    setSaving(true)
    setError(null)
    try {
      const data: Partial<BodyMeasurement> = {
        measured_at: new Date(date + 'T12:00:00').toISOString(),
      }
      for (const f of FIELDS) {
        const v = fields[f.key]
        if (v && v.trim() !== '') {
          const num = parseFloat(v.replace(',', '.'))
          if (!isNaN(num)) (data as Record<string, unknown>)[f.key] = num
        }
      }
      const saved = await onSave(data)
      onSaved(saved)
      setFields({})
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
            initial={{ opacity: 0, y: 60 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: 60 }}
            transition={{ type: 'spring', stiffness: 350, damping: 30 }}
            style={{
              position: 'fixed', bottom: 0, left: 0, right: 0, zIndex: 51,
              background: 'var(--surface)',
              borderTop: '1px solid var(--border-md)',
              borderRadius: '16px 16px 0 0',
              padding: '24px 20px 40px',
              maxWidth: 560,
              margin: '0 auto',
              maxHeight: '85vh',
              overflowY: 'auto',
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
              // nova medição
            </div>
            <div style={{
              fontFamily: "'Outfit', sans-serif", fontWeight: 800,
              fontSize: 20, color: 'var(--fg)', letterSpacing: '-0.02em', marginBottom: 6,
            }}>
              Medidas Corporais
            </div>
            <div style={{
              fontFamily: "'JetBrains Mono', monospace", fontSize: 10,
              color: 'var(--fg-3)', fontStyle: 'italic', marginBottom: 20,
            }}>
              // preencha apenas os campos que mediu
            </div>

            {/* Grid de campos */}
            <div style={{
              display: 'grid',
              gridTemplateColumns: '1fr 1fr',
              gap: 10,
              marginBottom: 16,
            }}>
              {FIELDS.map((f) => (
                <div key={f.key}>
                  <div style={{
                    fontFamily: "'JetBrains Mono', monospace", fontSize: 8,
                    color: 'var(--fg-3)', letterSpacing: '0.12em',
                    textTransform: 'uppercase', marginBottom: 4,
                  }}>
                    {f.label} (cm)
                  </div>
                  <input
                    type="number"
                    inputMode="decimal"
                    step="0.1"
                    min="1"
                    max="300"
                    value={fields[f.key] ?? ''}
                    onChange={(e) => setField(f.key, e.target.value)}
                    placeholder={f.placeholder}
                    style={{
                      width: '100%',
                      background: 'var(--surface-2)',
                      border: '1px solid var(--border-md)',
                      borderRadius: 6,
                      padding: '10px 12px',
                      fontFamily: "'JetBrains Mono', monospace",
                      fontSize: 13,
                      color: 'var(--fg)',
                      outline: 'none',
                      boxSizing: 'border-box',
                    }}
                    onFocus={(e) => (e.target.style.borderColor = 'var(--accent)')}
                    onBlur={(e) => (e.target.style.borderColor = 'var(--border-md)')}
                  />
                </div>
              ))}
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
              {saving ? '// salvando...' : `Salvar ${filledCount} medida${filledCount !== 1 ? 's' : ''} →`}
            </button>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  )
}
