import { useState } from 'react'
import { ChevronRight, Edit2, UserPlus, Trash2, AlertTriangle } from 'lucide-react'
import type { Workout } from '../types'
import { WEEK_DAY_SHORT } from '../types'

interface WorkoutCardProps {
  workout: Workout
  isToday?: boolean
  onClick: () => void
  onEdit?: () => void
  onAssign?: () => void
  onDelete?: () => void
  deleteLabel?: string   // texto do botão (default: "Excluir")
  usageCount?: number
}

export function WorkoutCard({
  workout,
  isToday = false,
  onClick,
  onEdit,
  onAssign,
  onDelete,
  deleteLabel = 'Excluir',
  usageCount,
}: WorkoutCardProps) {
  const [confirmDelete, setConfirmDelete] = useState(false)
  const exerciseCount = workout.exercises?.length ?? 0
  const daysLabel = workout.week_days
    .map((d) => WEEK_DAY_SHORT[d])
    .join(' · ')

  return (
    <div
      onClick={onClick}
      style={{
        background: 'var(--surface)',
        border: isToday
          ? '1px solid var(--accent)'
          : '1px solid var(--border)',
        borderLeft: isToday
          ? '3px solid var(--accent)'
          : '3px solid var(--border)',
        borderRadius: 4,
        padding: '14px 16px',
        cursor: 'pointer',
        transition: 'border-color 0.15s, background 0.15s',
        position: 'relative',
      }}
      onMouseEnter={(e) => {
        const el = e.currentTarget as HTMLDivElement
        el.style.borderColor = 'var(--accent)'
      }}
      onMouseLeave={(e) => {
        const el = e.currentTarget as HTMLDivElement
        if (!isToday) {
          el.style.borderColor = 'var(--border)'
          el.style.borderLeftColor = 'var(--border)'
        }
      }}
    >
      {/* Badge HOJE */}
      {isToday && (
        <div
          style={{
            position: 'absolute',
            top: 10,
            right: 12,
            background: 'var(--accent)',
            color: 'var(--bg)',
            fontFamily: "'JetBrains Mono', monospace",
            fontSize: 8,
            fontWeight: 400,
            letterSpacing: '0.15em',
            padding: '2px 6px',
            borderRadius: 2,
          }}
        >
          HOJE
        </div>
      )}

      {/* Nome */}
      <div
        style={{
          fontFamily: "'Outfit', sans-serif",
          fontWeight: 800,
          fontSize: 15,
          color: 'var(--fg)',
          marginBottom: 4,
          paddingRight: isToday ? 48 : 0,
          lineHeight: 1.2,
        }}
      >
        {workout.name}
      </div>

      {/* Metadados */}
      <div
        style={{
          fontFamily: "'JetBrains Mono', monospace",
          fontSize: 10,
          color: 'var(--fg-3)',
          display: 'flex',
          gap: 12,
          alignItems: 'center',
          flexWrap: 'wrap',
        }}
      >
        {daysLabel && <span>{daysLabel}</span>}
        {exerciseCount > 0 && (
          <span style={{ opacity: 0.6 }}>
            {exerciseCount} exercício{exerciseCount !== 1 ? 's' : ''}
          </span>
        )}
        {workout.is_template && usageCount !== undefined && (
          <span style={{ opacity: 0.5 }}>
            usado por {usageCount} aluno{usageCount !== 1 ? 's' : ''}
          </span>
        )}
      </div>

      {/* Ações admin (editar / atribuir / excluir) */}
      {(onEdit || onAssign || onDelete) && (
        <div
          style={{
            marginTop: 10,
            paddingTop: 10,
            borderTop: '1px solid var(--border)',
          }}
          onClick={(e) => e.stopPropagation()}
        >
          {/* Confirmação de exclusão */}
          {confirmDelete ? (
            <div style={{
              display: 'flex', alignItems: 'center', gap: 6,
              background: 'rgba(239,68,68,0.08)',
              border: '1px solid rgba(239,68,68,0.25)',
              borderRadius: 4, padding: '8px 10px',
            }}>
              <AlertTriangle size={12} style={{ color: 'var(--danger)', flexShrink: 0 }} />
              <span style={{
                fontFamily: "'JetBrains Mono', monospace", fontSize: 9,
                color: 'var(--danger)', flex: 1, letterSpacing: '0.06em',
              }}>
                {deleteLabel === 'Excluir' ? 'Excluir esta ficha?' : 'Desvincular esta ficha do aluno?'}
              </span>
              <button
                onClick={() => setConfirmDelete(false)}
                style={{
                  background: 'transparent', border: '1px solid var(--border-md)',
                  borderRadius: 3, padding: '3px 8px', color: 'var(--fg-3)',
                  fontFamily: "'JetBrains Mono', monospace", fontSize: 8,
                  letterSpacing: '0.08em', textTransform: 'uppercase', cursor: 'pointer',
                }}
              >
                Cancelar
              </button>
              <button
                onClick={() => { setConfirmDelete(false); onDelete?.() }}
                style={{
                  background: 'var(--danger)', border: 'none',
                  borderRadius: 3, padding: '3px 8px', color: '#fff',
                  fontFamily: "'JetBrains Mono', monospace", fontSize: 8,
                  letterSpacing: '0.08em', textTransform: 'uppercase', cursor: 'pointer',
                }}
              >
                Confirmar
              </button>
            </div>
          ) : (
            <div style={{ display: 'flex', gap: 6 }}>
              {onEdit && (
                <button
                  onClick={onEdit}
                  style={{
                    display: 'flex', alignItems: 'center', gap: 4,
                    background: 'transparent',
                    border: '1px solid var(--border-md)',
                    borderRadius: 4, padding: '4px 10px',
                    color: 'var(--fg-2)',
                    fontFamily: "'JetBrains Mono', monospace", fontSize: 9,
                    letterSpacing: '0.1em', cursor: 'pointer', textTransform: 'uppercase',
                  }}
                >
                  <Edit2 size={10} />
                  Editar
                </button>
              )}
              {onAssign && (
                <button
                  onClick={onAssign}
                  style={{
                    display: 'flex', alignItems: 'center', gap: 4,
                    background: 'transparent',
                    border: '1px solid rgba(108, 142, 247,0.3)',
                    borderRadius: 4, padding: '4px 10px',
                    color: 'var(--accent)',
                    fontFamily: "'JetBrains Mono', monospace", fontSize: 9,
                    letterSpacing: '0.1em', cursor: 'pointer', textTransform: 'uppercase',
                  }}
                >
                  <UserPlus size={10} />
                  Atribuir
                </button>
              )}
              {onDelete && (
                <button
                  onClick={() => setConfirmDelete(true)}
                  style={{
                    display: 'flex', alignItems: 'center', gap: 4,
                    background: 'transparent',
                    border: '1px solid rgba(239,68,68,0.3)',
                    borderRadius: 4, padding: '4px 10px',
                    color: 'var(--danger)',
                    fontFamily: "'JetBrains Mono', monospace", fontSize: 9,
                    letterSpacing: '0.1em', cursor: 'pointer', textTransform: 'uppercase',
                    marginLeft: 'auto',
                  }}
                >
                  <Trash2 size={10} />
                  {deleteLabel}
                </button>
              )}
            </div>
          )}
        </div>
      )}

      {/* Seta de navegação (sem ações admin) */}
      {!onEdit && !onAssign && (
        <ChevronRight
          size={14}
          style={{
            position: 'absolute',
            right: 14,
            top: '50%',
            transform: 'translateY(-50%)',
            color: 'var(--fg-3)',
            opacity: 0.4,
          }}
        />
      )}
    </div>
  )
}
