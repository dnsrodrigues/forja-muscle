import { useState } from 'react'
import type { Workout } from '../types'
import { WEEK_DAY_SHORT } from '../types'
import { Icon } from './ui/Icon'

interface WorkoutCardProps {
  workout: Workout
  isToday?: boolean
  onClick: () => void
  onEdit?: () => void
  onAssign?: () => void
  onDelete?: () => void
  deleteLabel?: string
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
  const daysLabel = workout.week_days.map((d) => WEEK_DAY_SHORT[d]).join(' · ')

  return (
    <div
      onClick={onClick}
      className="card"
      style={{
        padding: '16px 18px',
        cursor: 'pointer',
        position: 'relative',
        borderColor: isToday ? 'var(--accent)' : 'var(--hairline)',
        borderLeft: isToday ? '3px solid var(--accent)' : '1px solid var(--hairline)',
        transition: 'border-color 0.15s',
      }}
    >
      {isToday && (
        <span
          className="chip solid"
          style={{
            position: 'absolute',
            top: 12,
            right: 14,
            padding: '2px 8px',
            fontSize: 9,
          }}
        >
          HOJE
        </span>
      )}

      <div
        className="f-display"
        style={{
          fontSize: 26,
          color: 'var(--text)',
          lineHeight: 1,
          marginBottom: 6,
          paddingRight: isToday ? 60 : 0,
        }}
      >
        {workout.name.toUpperCase()}
      </div>

      <div
        style={{
          display: 'flex',
          gap: 12,
          alignItems: 'center',
          flexWrap: 'wrap',
          fontSize: 11,
          color: 'var(--text-dim)',
          fontFamily: 'var(--f-mono)',
        }}
      >
        {daysLabel && <span>{daysLabel}</span>}
        {exerciseCount > 0 && (
          <span style={{ opacity: 0.7 }}>
            {exerciseCount} exercício{exerciseCount !== 1 ? 's' : ''}
          </span>
        )}
        {workout.is_template && usageCount !== undefined && (
          <span style={{ opacity: 0.6 }}>
            usado por {usageCount} aluno{usageCount !== 1 ? 's' : ''}
          </span>
        )}
      </div>

      {(onEdit || onAssign || onDelete) && (
        <div
          onClick={(e) => e.stopPropagation()}
          style={{
            marginTop: 14,
            paddingTop: 14,
            borderTop: '1px solid var(--hairline)',
          }}
        >
          {confirmDelete ? (
            <div
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: 8,
                background: 'rgba(255,61,85,0.08)',
                border: '1px solid rgba(255,61,85,0.25)',
                borderRadius: 'var(--r-2)',
                padding: '10px 12px',
                flexWrap: 'wrap',
              }}
            >
              <span style={{ fontSize: 12, color: 'var(--danger)', flex: 1, minWidth: 180 }}>
                {deleteLabel === 'Excluir' ? 'Excluir esta ficha?' : 'Desvincular esta ficha?'}
              </span>
              <button
                onClick={() => setConfirmDelete(false)}
                className="btn ghost"
                style={{ padding: '4px 10px', fontSize: 10 }}
              >
                Cancelar
              </button>
              <button
                onClick={() => {
                  setConfirmDelete(false)
                  onDelete?.()
                }}
                className="btn"
                style={{
                  background: 'var(--danger)',
                  borderColor: 'var(--danger)',
                  color: '#fff',
                  padding: '4px 10px',
                  fontSize: 10,
                }}
              >
                Confirmar
              </button>
            </div>
          ) : (
            <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
              {onEdit && (
                <button onClick={onEdit} className="btn ghost" style={{ padding: '6px 12px', fontSize: 11 }}>
                  <Icon name="edit" size={12} /> Editar
                </button>
              )}
              {onAssign && (
                <button
                  onClick={onAssign}
                  className="btn"
                  style={{
                    padding: '6px 12px',
                    fontSize: 11,
                    color: 'var(--accent)',
                    borderColor: 'var(--accent)',
                    background: 'transparent',
                  }}
                >
                  <Icon name="user" size={12} /> Atribuir
                </button>
              )}
              {onDelete && (
                <button
                  onClick={() => setConfirmDelete(true)}
                  className="btn danger"
                  style={{ padding: '6px 12px', fontSize: 11, marginLeft: 'auto' }}
                >
                  {deleteLabel}
                </button>
              )}
            </div>
          )}
        </div>
      )}

      {!onEdit && !onAssign && (
        <Icon
          name="arrow"
          size={16}
          style={{
            position: 'absolute',
            right: 14,
            top: '50%',
            transform: 'translateY(-50%)',
            color: 'var(--text-faint)',
          }}
        />
      )}
    </div>
  )
}
