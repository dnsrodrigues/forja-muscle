import { useState } from 'react'
import { Check } from 'lucide-react'

interface ExerciseSetRowProps {
  setNumber: number
  suggestedReps: string       // ex: "8-12" ou "12" — vem da ficha
  suggestedLoad: number | null
  isCompleted: boolean
  onComplete: (reps: number, loadKg: number | null) => void
}

export function ExerciseSetRow({
  setNumber,
  suggestedReps,
  suggestedLoad,
  isCompleted,
  onComplete,
}: ExerciseSetRowProps) {
  // Pré-preenche com valores sugeridos da ficha
  const defaultReps = suggestedReps.includes('-')
    ? suggestedReps.split('-')[1]   // pega o máximo do range "8-12" → "12"
    : suggestedReps

  const [reps, setReps] = useState(defaultReps)
  const [load, setLoad] = useState(suggestedLoad != null ? String(suggestedLoad) : '')

  function handleComplete() {
    const repsNum = parseInt(reps, 10)
    const loadNum = load !== '' ? parseFloat(load) : null
    if (!isNaN(repsNum) && repsNum > 0) {
      onComplete(repsNum, loadNum)
    }
  }

  return (
    <div
      style={{
        display: 'flex',
        alignItems: 'center',
        gap: 8,
        padding: '6px 0',
        transition: 'opacity 0.2s',
        opacity: isCompleted ? 0.75 : 1,
      }}
    >
      {/* Número da série */}
      <div style={{
        fontFamily: "'DM Mono', monospace",
        fontSize: 9,
        color: isCompleted ? 'var(--accent)' : 'var(--fg-3)',
        letterSpacing: '0.1em',
        textTransform: 'uppercase',
        width: 48,
        flexShrink: 0,
      }}>
        série {setNumber}
      </div>

      {/* Input reps */}
      <div style={{ flex: 1 }}>
        <div style={{
          fontFamily: "'DM Mono', monospace",
          fontSize: 8,
          color: 'var(--fg-3)',
          letterSpacing: '0.1em',
          textTransform: 'uppercase',
          marginBottom: 2,
        }}>
          reps
        </div>
        <input
          type="number"
          inputMode="numeric"
          value={reps}
          onChange={(e) => setReps(e.target.value)}
          min={1}
          max={999}
          style={{
            width: '100%',
            background: isCompleted ? 'var(--accent-muted)' : 'var(--surface-2)',
            border: `1px solid ${isCompleted ? 'var(--accent-glow)' : 'var(--border-md)'}`,
            borderRadius: 4,
            padding: '7px 10px',
            fontFamily: "'DM Mono', monospace",
            fontSize: 14,
            fontWeight: 700,
            color: isCompleted ? 'var(--accent)' : 'var(--fg)',
            textAlign: 'center',
            outline: 'none',
            transition: 'border-color 0.15s',
          }}
          onFocus={(e) => {
            if (!isCompleted) e.target.style.borderColor = 'var(--border-strong)'
          }}
          onBlur={(e) => {
            e.target.style.borderColor = isCompleted ? 'var(--accent-glow)' : 'var(--border-md)'
          }}
        />
      </div>

      {/* Input carga */}
      <div style={{ flex: 1 }}>
        <div style={{
          fontFamily: "'DM Mono', monospace",
          fontSize: 8,
          color: 'var(--fg-3)',
          letterSpacing: '0.1em',
          textTransform: 'uppercase',
          marginBottom: 2,
        }}>
          kg
        </div>
        <input
          type="number"
          inputMode="decimal"
          value={load}
          onChange={(e) => setLoad(e.target.value)}
          min={0}
          step={0.5}
          placeholder="—"
          style={{
            width: '100%',
            background: isCompleted ? 'var(--accent-muted)' : 'var(--surface-2)',
            border: `1px solid ${isCompleted ? 'var(--accent-glow)' : 'var(--border-md)'}`,
            borderRadius: 4,
            padding: '7px 10px',
            fontFamily: "'DM Mono', monospace",
            fontSize: 14,
            fontWeight: 700,
            color: isCompleted ? 'var(--accent)' : 'var(--fg)',
            textAlign: 'center',
            outline: 'none',
            transition: 'border-color 0.15s',
          }}
          onFocus={(e) => {
            if (!isCompleted) e.target.style.borderColor = 'var(--border-strong)'
          }}
          onBlur={(e) => {
            e.target.style.borderColor = isCompleted ? 'var(--accent-glow)' : 'var(--border-md)'
          }}
        />
      </div>

      {/* Botão / ícone de conclusão */}
      {isCompleted ? (
        <div style={{
          width: 36,
          height: 36,
          borderRadius: 4,
          background: 'var(--accent-muted)',
          border: '1px solid var(--accent-glow)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          flexShrink: 0,
        }}>
          <Check size={14} color="var(--accent)" strokeWidth={3} />
        </div>
      ) : (
        <button
          onClick={handleComplete}
          style={{
            width: 36,
            height: 36,
            borderRadius: 4,
            background: 'var(--accent)',
            border: 'none',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            cursor: 'pointer',
            flexShrink: 0,
            transition: 'opacity 0.15s, transform 0.1s',
          }}
          onMouseEnter={(e) => (e.currentTarget.style.opacity = '0.85')}
          onMouseLeave={(e) => (e.currentTarget.style.opacity = '1')}
          onMouseDown={(e) => (e.currentTarget.style.transform = 'scale(0.94)')}
          onMouseUp={(e) => (e.currentTarget.style.transform = 'scale(1)')}
          title="Marcar série como feita"
        >
          <Check size={16} color="#05050a" strokeWidth={3} />
        </button>
      )}
    </div>
  )
}
