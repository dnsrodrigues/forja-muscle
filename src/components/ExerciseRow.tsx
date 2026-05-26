import type { WorkoutExercise } from '../types'
import { MUSCLE_GROUP_LABELS } from '../types'
import { Icon } from './ui/Icon'

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
      className="card"
      style={{
        padding: editable ? '14px 16px' : '12px 16px',
        borderLeft: '2px solid var(--accent)',
        display: 'flex',
        gap: 14,
        alignItems: editable ? 'flex-start' : 'center',
      }}
    >
      {/* Número */}
      <div
        className="pill-num"
        style={{
          background: 'var(--accent)',
          color: 'var(--accent-fg)',
          flexShrink: 0,
          paddingTop: editable ? 0 : 0,
        }}
      >
        {String(index + 1).padStart(2, '0')}
      </div>

      {/* Conteúdo */}
      <div style={{ flex: 1, minWidth: 0 }}>
        <div style={{ display: 'flex', alignItems: 'baseline', gap: 8, marginBottom: editable ? 10 : 4, flexWrap: 'wrap' }}>
          <span
            className="f-display"
            style={{
              fontSize: 18,
              color: 'var(--text)',
              lineHeight: 1,
            }}
          >
            {(item.exercise?.name ?? 'Exercício').toUpperCase()}
          </span>
          {muscleLabel && (
            <span className="chip muscle" style={{ fontSize: 9, padding: '2px 8px' }}>
              {muscleLabel}
            </span>
          )}
        </div>

        {/* Modo visualização */}
        {!editable && (
          <div
            style={{
              fontFamily: 'var(--f-mono)',
              fontSize: 11,
              color: 'var(--text-dim)',
              display: 'flex',
              gap: 14,
              flexWrap: 'wrap',
            }}
          >
            <span style={{ color: 'var(--text)' }}>
              {item.sets} × {item.reps}
            </span>
            {item.suggested_load && (
              <span style={{ color: 'var(--accent)' }}>{item.suggested_load} kg</span>
            )}
            {item.rest_seconds > 0 && <span>{item.rest_seconds}s descanso</span>}
            {item.notes && (
              <span style={{ opacity: 0.5, fontStyle: 'italic' }}>{item.notes}</span>
            )}
          </div>
        )}

        {/* Modo edição */}
        {editable && (
          <div style={{ display: 'flex', gap: 10, flexWrap: 'wrap', alignItems: 'center' }}>
            <FormField label="Séries">
              <input
                type="number"
                min={1}
                max={20}
                value={item.sets}
                onChange={(e) => onChange?.({ sets: Number(e.target.value) })}
                className="set-input"
                style={{ width: 56 }}
              />
            </FormField>

            <FormField label="Reps">
              <input
                type="text"
                value={item.reps}
                onChange={(e) => onChange?.({ reps: e.target.value })}
                placeholder="12"
                className="set-input"
                style={{ width: 64 }}
              />
            </FormField>

            <FormField label="Carga (kg)">
              <input
                type="number"
                min={0}
                step={0.5}
                value={item.suggested_load ?? ''}
                onChange={(e) =>
                  onChange?.({ suggested_load: e.target.value ? Number(e.target.value) : undefined })
                }
                placeholder="—"
                className="set-input"
                style={{ width: 70 }}
              />
            </FormField>

            <FormField label="Desc. (s)">
              <input
                type="number"
                min={0}
                step={15}
                value={item.rest_seconds}
                onChange={(e) => onChange?.({ rest_seconds: Number(e.target.value) })}
                className="set-input"
                style={{ width: 70 }}
              />
            </FormField>

            <FormField label="Obs." style={{ flex: 1, minWidth: 120 }}>
              <input
                type="text"
                value={item.notes ?? ''}
                onChange={(e) => onChange?.({ notes: e.target.value || undefined })}
                placeholder="Observação opcional"
                className="set-input"
                style={{ width: '100%', textAlign: 'left' }}
              />
            </FormField>
          </div>
        )}
      </div>

      {/* Remover */}
      {editable && onRemove && (
        <button
          onClick={onRemove}
          className="btn ghost"
          style={{
            padding: 6,
            color: 'var(--text-faint)',
            border: 'none',
            background: 'transparent',
          }}
          onMouseEnter={(e) => (e.currentTarget.style.color = 'var(--danger)')}
          onMouseLeave={(e) => (e.currentTarget.style.color = 'var(--text-faint)')}
          title="Remover"
        >
          <Icon name="x" size={14} />
        </button>
      )}
    </div>
  )
}

function FormField({
  label,
  children,
  style,
}: {
  label: string
  children: React.ReactNode
  style?: React.CSSProperties
}) {
  return (
    <label style={{ display: 'flex', flexDirection: 'column', gap: 4, ...style }}>
      <span
        style={{
          fontFamily: 'var(--f-mono)',
          fontSize: 8,
          color: 'var(--text-faint)',
          letterSpacing: '0.1em',
          textTransform: 'uppercase',
          fontWeight: 600,
        }}
      >
        {label}
      </span>
      {children}
    </label>
  )
}
