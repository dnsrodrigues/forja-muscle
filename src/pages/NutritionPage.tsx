import { useState, useEffect } from 'react'
import { useSearchParams, Link } from 'react-router-dom'
import { motion } from 'motion/react'
import { useAuth } from '../context/AuthContext'
import {
  getNutritionLogs,
  deactivateNutritionLog,
  computeDailyTotals,
} from '../services/nutrition.service'
import { calculateDailyGoals } from '../lib/nutritionGoals'
import { MealCard } from '../components/MealCard'
import { MealBottomSheet } from '../components/MealBottomSheet'
import { Topbar } from '../components/layout/Topbar'
import { Icon } from '../components/ui/Icon'
import type { NutritionLog, DailyTotals, DailyGoals } from '../types'

function toLocalDateString(date: Date): string {
  const y = date.getFullYear()
  const m = String(date.getMonth() + 1).padStart(2, '0')
  const d = String(date.getDate()).padStart(2, '0')
  return `${y}-${m}-${d}`
}

function formatDisplayDate(dateStr: string): string {
  const today = toLocalDateString(new Date())
  const date = new Date(dateStr + 'T12:00:00')
  const day = date.getDate()
  const month = date.toLocaleDateString('pt-BR', { month: 'short' }).replace('.', '')
  if (dateStr === today) return `Hoje, ${day} ${month}`
  return `${day} ${month}`
}

function MacroBar({
  label, value, goal, color,
}: {
  label: string
  value: number
  goal?: number
  color: string
}) {
  const over = goal != null && goal > 0 && value > goal
  const pct = goal && goal > 0 ? Math.min((value / goal) * 100, 100) : 0
  const barColor = over ? 'var(--warn)' : color
  return (
    <div style={{ flex: 1, minWidth: 80 }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'baseline', marginBottom: 4 }}>
        <span style={{ fontFamily: 'var(--f-mono)', fontSize: 10, color: 'var(--text-faint)', letterSpacing: '0.08em', textTransform: 'uppercase' }}>
          {label}
        </span>
        <span style={{ fontFamily: 'var(--f-mono)', fontSize: 10, color: barColor }}>
          {Math.round(value)}{goal ? `/${goal}g` : 'g'}
        </span>
      </div>
      <div style={{ height: 4, background: 'var(--bg-3)', borderRadius: 99, overflow: 'hidden' }}>
        <div style={{ width: `${pct}%`, height: '100%', background: barColor, borderRadius: 99, transition: 'width 0.5s ease' }} />
      </div>
    </div>
  )
}

export function NutritionPage() {
  const { profile } = useAuth()
  const [searchParams] = useSearchParams()
  const targetUserId = searchParams.get('userId') ?? profile?.id ?? ''
  const isViewingOther = !!searchParams.get('userId') && searchParams.get('userId') !== profile?.id

  const [selectedDate, setSelectedDate] = useState(() => toLocalDateString(new Date()))
  const [logs, setLogs] = useState<NutritionLog[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [sheetOpen, setSheetOpen] = useState(false)

  const today = toLocalDateString(new Date())
  const isToday = selectedDate === today
  const goals: DailyGoals | null = profile ? calculateDailyGoals(profile) : null
  const totals: DailyTotals = computeDailyTotals(logs)

  // Anel de calorias via conic-gradient
  const calPct = goals ? Math.min((totals.calories / goals.calories) * 100, 100) : 0
  const calOver = goals != null && totals.calories > goals.calories
  const ringColor = calOver ? 'var(--warn)' : 'var(--accent)'
  const calConicGradient = `conic-gradient(${ringColor} ${calPct * 3.6}deg, var(--bg-3) 0deg)`
  const calRemaining = goals ? goals.calories - Math.round(totals.calories) : 0

  useEffect(() => {
    if (!targetUserId) return
    void loadLogs()
  }, [selectedDate, targetUserId])

  async function loadLogs() {
    setLoading(true)
    setError(null)
    try {
      const data = await getNutritionLogs(targetUserId, selectedDate)
      setLogs(data)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Erro ao carregar diário')
    } finally {
      setLoading(false)
    }
  }

  function goToPrevDay() {
    const d = new Date(selectedDate + 'T12:00:00')
    d.setDate(d.getDate() - 1)
    setSelectedDate(toLocalDateString(d))
  }

  function goToNextDay() {
    if (isToday) return
    const d = new Date(selectedDate + 'T12:00:00')
    d.setDate(d.getDate() + 1)
    setSelectedDate(toLocalDateString(d))
  }

  async function handleDelete(logId: string) {
    try {
      await deactivateNutritionLog(logId)
      setLogs((prev) => prev.filter((l) => l.id !== logId))
    } catch {
      setError('Erro ao excluir refeição')
    }
  }

  function handleSaved(log: NutritionLog) {
    setLogs((prev) =>
      [...prev, log].sort((a, b) => a.logged_at.localeCompare(b.logged_at))
    )
  }

  return (
    <>
      <Topbar
        eyebrow="SAÚDE"
        title="NUTRIÇÃO"
        actions={
          isViewingOther ? (
            <Link
              to={`/admin/students/${searchParams.get('userId')}`}
              className="btn ghost"
            >
              <Icon name="arrowL" size={14} /> Voltar ao perfil
            </Link>
          ) : (
            <button
              onClick={() => setSheetOpen(true)}
              className="btn primary forja-nutri-add-top"
            >
              <Icon name="plus" size={14} /> Registrar refeição
            </button>
          )
        }
      />

      <div className="content">
        {/* Navegador de dia */}
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '4px 0', marginBottom: 4 }}>
          <button onClick={goToPrevDay} className="btn ghost" style={{ padding: '6px 10px' }}>
            <Icon name="arrowL" size={16} />
          </button>
          <span className="f-display" style={{ fontSize: 20, color: 'var(--text)' }}>
            {formatDisplayDate(selectedDate).toUpperCase()}
          </span>
          <button
            onClick={goToNextDay}
            disabled={isToday}
            className="btn ghost"
            style={{ padding: '6px 10px', opacity: isToday ? 0.3 : 1 }}
          >
            <Icon name="arrow" size={16} />
          </button>
        </div>

        {/* Card resumo */}
        <div className="card">
          <div style={{ display: 'flex', gap: 20, alignItems: 'center', flexWrap: 'wrap' }}>
            {/* Anel de calorias */}
            <div style={{ position: 'relative', flexShrink: 0 }}>
              <div style={{
                width: 88, height: 88, borderRadius: '50%',
                background: calConicGradient,
                display: 'flex', alignItems: 'center', justifyContent: 'center',
              }}>
                <div style={{
                  width: 68, height: 68, borderRadius: '50%',
                  background: 'var(--bg-1)',
                  display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center',
                }}>
                  <span className="f-display" style={{ fontSize: 26, color: ringColor, lineHeight: 1 }}>
                    {Math.round(totals.calories)}
                  </span>
                  <span style={{ fontFamily: 'var(--f-mono)', fontSize: 10, color: 'var(--text-faint)', letterSpacing: '0.03em' }}>
                    {goals ? `de ${goals.calories}` : 'kcal'}
                  </span>
                </div>
              </div>
            </div>

            {/* Barras de macros */}
            <div style={{ flex: 1, display: 'flex', flexDirection: 'column', gap: 8, minWidth: 160 }}>
              <MacroBar label="Prot" value={totals.protein_g} goal={goals?.protein_g} color="var(--accent)" />
              <MacroBar label="Carb" value={totals.carbs_g} goal={goals?.carbs_g} color="var(--info)" />
              <MacroBar label="Gord" value={totals.fat_g} goal={goals?.fat_g} color="var(--warn)" />
            </div>
          </div>

          {/* Aviso perfil incompleto */}
          {!goals && (
            <div style={{ marginTop: 12, display: 'flex', alignItems: 'center', gap: 6 }}>
              <span style={{ fontFamily: 'var(--f-mono)', fontSize: 10, color: 'var(--text-faint)' }}>
                Complete o perfil para ver suas metas →
              </span>
              <Link to="/perfil" style={{ fontFamily: 'var(--f-mono)', fontSize: 10, color: 'var(--accent)', textDecoration: 'none' }}>
                Perfil
              </Link>
            </div>
          )}
          {goals && (
            <div style={{ marginTop: 12, display: 'flex', alignItems: 'center', gap: 8 }}>
              <span style={{
                fontFamily: 'var(--f-mono)', fontSize: 11, fontWeight: 700,
                color: calOver ? 'var(--warn)' : 'var(--accent)',
              }}>
                {calOver
                  ? `Passou ${Math.abs(calRemaining)} kcal da meta`
                  : `Faltam ${calRemaining} kcal`}
              </span>
            </div>
          )}
          {goals && (
            <div style={{ marginTop: 8, fontFamily: 'var(--f-mono)', fontSize: 10, color: 'var(--text-faint)', fontStyle: 'italic' }}>
              * Estimativa. Consulte um nutricionista para um plano personalizado.
            </div>
          )}
        </div>

        {/* Loading */}
        {loading && (
          <div className="col gap-2">
            {[1, 2].map((i) => (
              <div key={i} className="skeleton" style={{ height: 80, borderRadius: 8 }} />
            ))}
          </div>
        )}

        {/* Erro */}
        {!loading && error && (
          <div className="card" style={{ borderLeft: '2px solid var(--danger)' }}>
            <span style={{ color: 'var(--danger)' }}>{error}</span>
          </div>
        )}

        {/* Lista de refeições */}
        {!loading && !error && (
          <>
            {logs.length === 0 ? (
              <div className="card" style={{
                textAlign: 'center', padding: '32px 24px',
                borderStyle: 'dashed', color: 'var(--text-faint)',
              }}>
                Nenhuma refeição registrada{isToday ? ' hoje' : ' neste dia'}.
              </div>
            ) : (
              <motion.div
                className="col gap-2"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
              >
                {logs.map((log) => (
                  <MealCard
                    key={log.id}
                    log={log}
                    onDelete={() => { void handleDelete(log.id) }}
                    readOnly={isViewingOther}
                  />
                ))}
              </motion.div>
            )}
          </>
        )}
      </div>

      {/* FAB — celular: registrar refeição no dia selecionado (hoje ou passado) */}
      {!isViewingOther && (
        <div className="forja-nutri-fab" style={{ position: 'fixed', bottom: 80, right: 20, zIndex: 10 }}>
          <button
            onClick={() => setSheetOpen(true)}
            className="btn primary"
            style={{ borderRadius: 99, padding: '12px 20px', boxShadow: '0 4px 20px rgba(0,0,0,0.4)' }}
          >
            <Icon name="plus" size={16} /> Registrar
          </button>
        </div>
      )}

      <MealBottomSheet
        isOpen={sheetOpen}
        onClose={() => setSheetOpen(false)}
        onSaved={handleSaved}
        userId={targetUserId}
        dateStr={selectedDate}
      />

      <style>{`
        /* Botão de registrar fica na barra de cima no desktop e flutuante no celular */
        .forja-nutri-fab { display: none; }
        @media (max-width: 768px) {
          .forja-nutri-add-top { display: none !important; }
          .forja-nutri-fab { display: block; }
        }
      `}</style>
    </>
  )
}
