import { useState } from 'react'
import { Icon } from './ui/Icon'
import { ConfirmModal } from './ui/ConfirmModal'
import type { NutritionLog, MealType } from '../types'
import { MEAL_TYPE_LABELS } from '../types'

interface MealCardProps {
  log: NutritionLog
  onDelete: () => void
  readOnly?: boolean
}

function formatTime(isoString: string): string {
  return new Date(isoString).toLocaleTimeString('pt-BR', {
    hour: '2-digit',
    minute: '2-digit',
  })
}

export function MealCard({ log, onDelete, readOnly = false }: MealCardProps) {
  const [showConfirm, setShowConfirm] = useState(false)

  const hasMacros = log.calories != null || log.protein_g != null

  return (
    <>
      <div
        className="card"
        style={{ padding: '14px 16px', borderLeft: '2px solid var(--accent)' }}
      >
        {/* Header: tipo + horário + botão excluir */}
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 8 }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
            <span className="chip" style={{ fontSize: 10, padding: '2px 8px' }}>
              {MEAL_TYPE_LABELS[log.meal_type as MealType] ?? log.meal_type}
            </span>
            <span style={{ fontFamily: 'var(--f-mono)', fontSize: 10, color: 'var(--text-faint)' }}>
              {formatTime(log.logged_at)}
            </span>
          </div>
          {!readOnly && (
            <button
              onClick={() => setShowConfirm(true)}
              style={{ background: 'transparent', border: 'none', cursor: 'pointer', color: 'var(--text-faint)', padding: 4, lineHeight: 0 }}
              onMouseEnter={(e) => { (e.currentTarget as HTMLButtonElement).style.color = 'var(--danger)' }}
              onMouseLeave={(e) => { (e.currentTarget as HTMLButtonElement).style.color = 'var(--text-faint)' }}
              title="Excluir refeição"
            >
              <Icon name="x" size={14} />
            </button>
          )}
        </div>

        {/* Descrição */}
        <p style={{ margin: 0, fontSize: 13, color: 'var(--text)', lineHeight: 1.5 }}>
          {log.description}
        </p>

        {/* Macros */}
        {hasMacros && (
          <div style={{ display: 'flex', gap: 16, marginTop: 8, flexWrap: 'wrap' }}>
            {log.calories != null && (
              <span style={{ fontFamily: 'var(--f-mono)', fontSize: 11, color: 'var(--accent)', fontWeight: 700 }}>
                {log.calories} kcal
              </span>
            )}
            {log.protein_g != null && (
              <span style={{ fontFamily: 'var(--f-mono)', fontSize: 11, color: 'var(--text-dim)' }}>
                P {Math.round(log.protein_g)}g
              </span>
            )}
            {log.carbs_g != null && (
              <span style={{ fontFamily: 'var(--f-mono)', fontSize: 11, color: 'var(--text-dim)' }}>
                C {Math.round(log.carbs_g)}g
              </span>
            )}
            {log.fat_g != null && (
              <span style={{ fontFamily: 'var(--f-mono)', fontSize: 11, color: 'var(--text-dim)' }}>
                G {Math.round(log.fat_g)}g
              </span>
            )}
          </div>
        )}

        {/* Feedback da IA */}
        {log.ai_feedback && (
          <p style={{
            margin: '8px 0 0',
            fontSize: 11,
            color: 'var(--text-faint)',
            fontStyle: 'italic',
            borderTop: '1px solid var(--hairline)',
            paddingTop: 6,
            lineHeight: 1.5,
          }}>
            ✦ {log.ai_feedback}
          </p>
        )}
      </div>

      {showConfirm && (
        <ConfirmModal
          title="Excluir refeição"
          message="Esta refeição será removida do diário. Você poderá adicionar novamente se quiser."
          confirmLabel="Excluir"
          danger
          onConfirm={() => { setShowConfirm(false); onDelete() }}
          onCancel={() => setShowConfirm(false)}
        />
      )}
    </>
  )
}
