import { X } from 'lucide-react'
import type { WorkoutExercise } from '../types'
import { MUSCLE_GROUP_LABELS } from '../types'

interface ExerciseRowProps {
  item: WorkoutExercise & { exercise?: { name: string; muscle_group: string } }
  index: number
  editable?: boolean
  onRemove?: () => void
  onChange?: (updates: Partial<WorkoutExercise>) => void
}

export function ExerciseRow({
  item,
  index,
  editable = false,
  onRemove,
  onChange,
}: ExerciseRowProps) {
  const muscleLabel = item.exercise?.muscle_group
    ? MUSCLE_GROUP_LABELS[item.exercise.muscle_group as keyof typeof MUSCLE_GROUP_LABELS] ?? item.exercise.muscle_group
    : ''

  return (
    <div
      style={{
        background: 'var(--surface)',
        border: '1px solid var(--border)',
        borderLeft: '2px solid var(--accent)',
        borderRadius: 4,
        padding: editable ? '10px 12px' : '8px 12px',
        display: 'flex',
        gap: 10,
        alignItems: editable ? 'flex-start' : 'center',
      }}
    >
      {/* Número */}
      <div
        style={{
          fontFamily: "'JetBrains Mono', monospace",
          fontSize: 10,
          color: 'var(--accent)',
          opacity: 0.6,
          minWidth: 16,
          paddingTop: editable ? 2 : 0,
        }}
      >
        {String(index + 1).padStart(2, '0')}
      </div>

      {/* Conteúdo principal */}
      <div style={{ flex: 1, minWidth: 0 }}>
        {/* Nome + grupo muscular */}
        <div style={{ display: 'flex', alignItems: 'baseline', gap: 8, marginBottom: editable ? 8 : 0 }}>
          <span
            style={{
              fontFamily: "'Outfit', sans-serif",
              fontWeight: 700,
              fontSize: 13,
              color: 'var(--fg)',
              lineHeight: 1.2,
            }}
          >
            {item.exercise?.name ?? 'Exercício'}
          </span>
          {muscleLabel && (
            <span
              style={{
                fontFamily: "'JetBrains Mono', monospace",
                fontSize: 9,
                color: 'var(--fg-3)',
                opacity: 0.5,
                textTransform: 'uppercase',
                letterSpacing: '0.1em',
              }}
            >
              {muscleLabel}
            </span>
          )}
        </div>

        {/* Modo visualização: séries × reps · carga · descanso */}
        {!editable && (
          <div
            style={{
              fontFamily: "'JetBrains Mono', monospace",
              fontSize: 10,
              color: 'var(--fg-3)',
              display: 'flex',
              gap: 12,
              flexWrap: 'wrap',
              marginTop: 2,
            }}
          >
            <span style={{ color: 'var(--fg-2)' }}>
              {item.sets} × {item.reps}
            </span>
            {item.suggested_load && (
              <span>{item.suggested_load} kg</span>
            )}
            {item.rest_seconds && (
              <span style={{ opacity: 0.5 }}>{item.rest_seconds}s descanso</span>
            )}
            {item.notes && (
              <span style={{ opacity: 0.4, fontStyle: 'italic' }}>{item.notes}</span>
            )}
          </div>
        )}

        {/* Modo edição: inputs */}
        {editable && (
          <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap', alignItems: 'center' }}>
            {/* Séries */}
            <label style={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
              <span style={{ fontFamily: "'JetBrains Mono', monospace", fontSize: 8, color: 'var(--fg-3)', letterSpacing: '0.1em', textTransform: 'uppercase' }}>Séries</span>
              <input
                type="number"
                min={1}
                max={20}
                value={item.sets}
                onChange={(e) => onChange?.({ sets: Number(e.target.value) })}
                style={{
                  width: 48,
                  background: 'rgba(255,255,255,0.04)',
                  border: '1px solid var(--border-md)',
                  borderRadius: 4,
                  padding: '4px 6px',
                  color: 'var(--fg)',
                  fontFamily: "'JetBrains Mono', monospace",
                  fontSize: 12,
                  textAlign: 'center',
                }}
              />
            </label>

            {/* Repetições */}
            <label style={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
              <span style={{ fontFamily: "'JetBrains Mono', monospace", fontSize: 8, color: 'var(--fg-3)', letterSpacing: '0.1em', textTransform: 'uppercase' }}>Reps</span>
              <input
                type="text"
                value={item.reps}
                onChange={(e) => onChange?.({ reps: e.target.value })}
                placeholder="12"
                style={{
                  width: 52,
                  background: 'rgba(255,255,255,0.04)',
                  border: '1px solid var(--border-md)',
                  borderRadius: 4,
                  padding: '4px 6px',
                  color: 'var(--fg)',
                  fontFamily: "'JetBrains Mono', monospace",
                  fontSize: 12,
                  textAlign: 'center',
                }}
              />
            </label>

            {/* Carga */}
            <label style={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
              <span style={{ fontFamily: "'JetBrains Mono', monospace", fontSize: 8, color: 'var(--fg-3)', letterSpacing: '0.1em', textTransform: 'uppercase' }}>Carga (kg)</span>
              <input
                type="number"
                min={0}
                step={0.5}
                value={item.suggested_load ?? ''}
                onChange={(e) =>
                  onChange?.({ suggested_load: e.target.value ? Number(e.target.value) : undefined })
                }
                placeholder="—"
                style={{
                  width: 60,
                  background: 'rgba(255,255,255,0.04)',
                  border: '1px solid var(--border-md)',
                  borderRadius: 4,
                  padding: '4px 6px',
                  color: 'var(--fg)',
                  fontFamily: "'JetBrains Mono', monospace",
                  fontSize: 12,
                  textAlign: 'center',
                }}
              />
            </label>

            {/* Descanso */}
            <label style={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
              <span style={{ fontFamily: "'JetBrains Mono', monospace", fontSize: 8, color: 'var(--fg-3)', letterSpacing: '0.1em', textTransform: 'uppercase' }}>Descanso (s)</span>
              <input
                type="number"
                min={0}
                step={15}
                value={item.rest_seconds}
                onChange={(e) => onChange?.({ rest_seconds: Number(e.target.value) })}
                style={{
                  width: 64,
                  background: 'rgba(255,255,255,0.04)',
                  border: '1px solid var(--border-md)',
                  borderRadius: 4,
                  padding: '4px 6px',
                  color: 'var(--fg)',
                  fontFamily: "'JetBrains Mono', monospace",
                  fontSize: 12,
                  textAlign: 'center',
                }}
              />
            </label>

            {/* Observação */}
            <label style={{ display: 'flex', flexDirection: 'column', gap: 2, flex: 1, minWidth: 120 }}>
              <span style={{ fontFamily: "'JetBrains Mono', monospace", fontSize: 8, color: 'var(--fg-3)', letterSpacing: '0.1em', textTransform: 'uppercase' }}>Obs.</span>
              <input
                type="text"
                value={item.notes ?? ''}
                onChange={(e) => onChange?.({ notes: e.target.value || undefined })}
                placeholder="Observação opcional"
                style={{
                  background: 'rgba(255,255,255,0.04)',
                  border: '1px solid var(--border-md)',
                  borderRadius: 4,
                  padding: '4px 8px',
                  color: 'var(--fg)',
                  fontFamily: "'JetBrains Mono', monospace",
                  fontSize: 11,
                  width: '100%',
                }}
              />
            </label>
          </div>
        )}
      </div>

      {/* Botão remover */}
      {editable && onRemove && (
        <button
          onClick={onRemove}
          style={{
            background: 'transparent',
            border: 'none',
            color: 'var(--fg-3)',
            cursor: 'pointer',
            padding: '2px 4px',
            display: 'flex',
            alignItems: 'center',
            opacity: 0.4,
            transition: 'opacity 0.15s, color 0.15s',
          }}
          onMouseEnter={(e) => {
            const el = e.currentTarget as HTMLButtonElement
            el.style.opacity = '1'
            el.style.color = 'var(--danger)'
          }}
          onMouseLeave={(e) => {
            const el = e.currentTarget as HTMLButtonElement
            el.style.opacity = '0.4'
            el.style.color = 'var(--fg-3)'
          }}
        >
          <X size={14} />
        </button>
      )}
    </div>
  )
}
