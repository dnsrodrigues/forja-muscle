import { useState } from 'react'
import type { WorkoutExercise } from '../types'
import { MUSCLE_GROUP_LABELS } from '../types'
import { Icon } from './ui/Icon'

interface ExerciseRowProps {
  item: WorkoutExercise & {
    exercise?: {
      name: string
      muscle_group: string
      description?: string
      video_url?: string
    }
  }
  index: number
  editable?: boolean
  onRemove?: () => void
  onChange?: (updates: Partial<WorkoutExercise>) => void
  onExerciseLibraryUpdate?: (updates: { description?: string; video_url?: string }) => Promise<void>
}

export function ExerciseRow({
  item,
  index,
  editable = false,
  onRemove,
  onChange,
  onExerciseLibraryUpdate,
}: ExerciseRowProps) {
  const [showLibEdit, setShowLibEdit] = useState(false)
  const [desc, setDesc] = useState(item.exercise?.description ?? '')
  const [videoUrl, setVideoUrl] = useState(item.exercise?.video_url ?? '')
  const [libSaving, setLibSaving] = useState(false)
  const [libSaved, setLibSaved] = useState(false)
  const [libError, setLibError] = useState<string | null>(null)

  async function handleLibSave() {
    if (!onExerciseLibraryUpdate) return
    setLibSaving(true)
    setLibError(null)
    try {
      await onExerciseLibraryUpdate({ description: desc, video_url: videoUrl })
      setLibSaved(true)
      setTimeout(() => setLibSaved(false), 2500)
    } catch {
      setLibError('Erro ao salvar')
    } finally {
      setLibSaving(false)
    }
  }
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

        {/* Seção de instruções da biblioteca (desc + vídeo) — só no modo edição */}
        {editable && onExerciseLibraryUpdate && (
          <div style={{ marginTop: 12, borderTop: '1px solid var(--hairline)', paddingTop: 10 }}>
            <button
              type="button"
              onClick={() => setShowLibEdit((o) => !o)}
              style={{
                display: 'inline-flex',
                alignItems: 'center',
                gap: 5,
                background: 'transparent',
                border: 'none',
                cursor: 'pointer',
                padding: 0,
                color: showLibEdit ? 'var(--accent)' : 'var(--text-faint)',
                fontFamily: "'JetBrains Mono', monospace",
                fontSize: 9,
                letterSpacing: '0.15em',
                textTransform: 'uppercase',
                transition: 'color 0.15s',
              }}
            >
              <Icon
                name="chevron"
                size={12}
                style={{ transform: showLibEdit ? 'rotate(180deg)' : 'none', transition: 'transform 0.15s' } as React.CSSProperties}
              />
              Instruções do exercício
              {(item.exercise?.description || item.exercise?.video_url) && (
                <span style={{ width: 5, height: 5, borderRadius: '50%', background: 'var(--accent)', marginLeft: 2 }} />
              )}
            </button>

            {showLibEdit && (
              <div style={{ marginTop: 12, display: 'flex', flexDirection: 'column', gap: 10 }}>
                <FormField label="Descrição / Instruções" style={{ width: '100%' }}>
                  <textarea
                    value={desc}
                    onChange={(e) => setDesc(e.target.value)}
                    placeholder="Instruções de execução do exercício..."
                    rows={2}
                    style={{
                      width: '100%',
                      background: 'rgba(255,255,255,0.03)',
                      border: '1px solid var(--border)',
                      borderRadius: 4,
                      padding: '7px 10px',
                      color: 'var(--text)',
                      fontFamily: "'JetBrains Mono', monospace",
                      fontSize: 11,
                      outline: 'none',
                      resize: 'vertical',
                      fontWeight: 400,
                    }}
                    onFocus={(e) => (e.target.style.borderColor = 'var(--accent)')}
                    onBlur={(e) => (e.target.style.borderColor = 'var(--border)')}
                  />
                </FormField>

                <FormField label="Link de Vídeo" style={{ width: '100%' }}>
                  <input
                    type="url"
                    value={videoUrl}
                    onChange={(e) => setVideoUrl(e.target.value)}
                    placeholder="https://youtube.com/watch?v=..."
                    className="set-input"
                    style={{ width: '100%', textAlign: 'left', fontFamily: "'JetBrains Mono', monospace", fontSize: 11 }}
                    onFocus={(e) => (e.target.style.borderColor = 'var(--accent)')}
                    onBlur={(e) => (e.target.style.borderColor = 'var(--border)')}
                  />
                </FormField>

                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'flex-end', gap: 10 }}>
                  {libError && (
                    <span style={{ fontFamily: "'JetBrains Mono', monospace", fontSize: 9, color: 'var(--danger)' }}>
                      ⚠ {libError}
                    </span>
                  )}
                  {libSaved && (
                    <span style={{ fontFamily: "'JetBrains Mono', monospace", fontSize: 9, color: 'var(--success)', display: 'flex', alignItems: 'center', gap: 4 }}>
                      <Icon name="check" size={10} stroke={2.5} /> Salvo
                    </span>
                  )}
                  <button
                    type="button"
                    onClick={handleLibSave}
                    disabled={libSaving}
                    className="btn ghost"
                    style={{ fontSize: 9, padding: '5px 12px', letterSpacing: '0.1em' }}
                  >
                    {libSaving ? 'Salvando...' : 'Salvar instruções'}
                  </button>
                </div>
              </div>
            )}
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
