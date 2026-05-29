import { useState, useEffect } from 'react'
import { motion, AnimatePresence } from 'motion/react'
import { Icon } from './ui/Icon'
import { analyzeMeal } from '../services/ai.service'
import { addNutritionLog } from '../services/nutrition.service'
import type { NutritionLog, MealType } from '../types'
import { MEAL_TYPE_LABELS } from '../types'

interface MealBottomSheetProps {
  isOpen: boolean
  onClose: () => void
  onSaved: (log: NutritionLog) => void
  userId: string
}

const MEAL_TYPES = Object.keys(MEAL_TYPE_LABELS) as MealType[]

export function MealBottomSheet({ isOpen, onClose, onSaved, userId }: MealBottomSheetProps) {
  const [mealType, setMealType] = useState<MealType>('breakfast')
  const [description, setDescription] = useState('')
  const [calories, setCalories] = useState('')
  const [proteinG, setProteinG] = useState('')
  const [carbsG, setCarbsG] = useState('')
  const [fatG, setFatG] = useState('')
  const [feedback, setFeedback] = useState('')
  const [analyzing, setAnalyzing] = useState(false)
  const [saving, setSaving] = useState(false)
  const [analyzed, setAnalyzed] = useState(false)
  const [analyzeError, setAnalyzeError] = useState<string | null>(null)

  // Reset ao fechar
  useEffect(() => {
    if (!isOpen) {
      const t = setTimeout(() => {
        setDescription('')
        setCalories('')
        setProteinG('')
        setCarbsG('')
        setFatG('')
        setFeedback('')
        setAnalyzed(false)
        setAnalyzeError(null)
        setMealType('breakfast')
      }, 300)
      return () => clearTimeout(t)
    }
  }, [isOpen])

  // Fechar com Escape
  useEffect(() => {
    if (!isOpen) return
    function onKey(e: KeyboardEvent) {
      if (e.key === 'Escape') onClose()
    }
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  }, [isOpen, onClose])

  async function handleAnalyze() {
    if (!description.trim()) return
    setAnalyzing(true)
    setAnalyzeError(null)
    try {
      const result = await analyzeMeal(mealType, description.trim())
      setCalories(String(result.calories))
      setProteinG(String(result.protein_g))
      setCarbsG(String(result.carbs_g))
      setFatG(String(result.fat_g))
      setFeedback(result.feedback)
      setAnalyzed(true)
    } catch (err) {
      setAnalyzeError(err instanceof Error ? err.message : 'Erro ao analisar')
    } finally {
      setAnalyzing(false)
    }
  }

  async function handleSave() {
    if (!analyzed) return
    setSaving(true)
    try {
      const log = await addNutritionLog({
        user_id: userId,
        meal_type: mealType,
        description: description.trim(),
        calories: calories ? Number(calories) : undefined,
        protein_g: proteinG ? Number(proteinG) : undefined,
        carbs_g: carbsG ? Number(carbsG) : undefined,
        fat_g: fatG ? Number(fatG) : undefined,
        ai_feedback: feedback || undefined,
        logged_at: new Date().toISOString(),
      })
      onSaved(log)
      onClose()
    } catch (err) {
      setAnalyzeError(err instanceof Error ? err.message : 'Erro ao salvar')
    } finally {
      setSaving(false)
    }
  }

  return (
    <AnimatePresence>
      {isOpen && (
        <>
          {/* Overlay */}
          <motion.div
            key="bs-overlay"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={onClose}
            style={{
              position: 'fixed', inset: 0, zIndex: 60,
              background: 'rgba(0,0,0,0.7)', backdropFilter: 'blur(4px)',
            }}
          />

          {/* Sheet */}
          <motion.div
            key="bs-sheet"
            role="dialog"
            aria-modal="true"
            aria-labelledby="bs-title"
            initial={{ y: '100%' }}
            animate={{ y: 0 }}
            exit={{ y: '100%' }}
            transition={{ type: 'spring', damping: 30, stiffness: 300 }}
            style={{
              position: 'fixed', bottom: 0, left: 0, right: 0, zIndex: 61,
              background: 'var(--bg-1)',
              borderTop: '2px solid var(--accent)',
              borderRadius: '16px 16px 0 0',
              maxHeight: '92vh',
              overflowY: 'auto',
              padding: '20px 20px 40px',
            }}
          >
            {/* Alça visual */}
            <div style={{ width: 40, height: 4, background: 'var(--border)', borderRadius: 99, margin: '0 auto 16px' }} />

            {/* Header */}
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16 }}>
              <div id="bs-title" style={{ fontFamily: 'var(--f-display)', fontWeight: 800, fontSize: 18, color: 'var(--text)' }}>
                NOVA REFEIÇÃO
              </div>
              <button
                onClick={onClose}
                style={{ background: 'transparent', border: 'none', cursor: 'pointer', color: 'var(--text-faint)', padding: 4, lineHeight: 0 }}
              >
                <Icon name="x" size={18} />
              </button>
            </div>

            {/* Tipo da refeição */}
            <div className="label-sm" style={{ marginBottom: 8 }}>Tipo</div>
            <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap', marginBottom: 16 }}>
              {MEAL_TYPES.map((type) => (
                <button
                  key={type}
                  onClick={() => setMealType(type)}
                  style={{
                    background: mealType === type ? 'var(--accent)' : 'transparent',
                    border: `1px solid ${mealType === type ? 'var(--accent)' : 'var(--border)'}`,
                    color: mealType === type ? 'var(--accent-fg)' : 'var(--text-dim)',
                    borderRadius: 4, padding: '6px 12px',
                    fontFamily: 'var(--f-mono)', fontSize: 10,
                    letterSpacing: '0.05em', cursor: 'pointer',
                    transition: 'all 0.15s',
                  }}
                >
                  {MEAL_TYPE_LABELS[type]}
                </button>
              ))}
            </div>

            {/* Descrição */}
            <div className="label-sm" style={{ marginBottom: 6 }}>O que você comeu?</div>
            <textarea
              value={description}
              onChange={(e) => { setDescription(e.target.value); setAnalyzed(false) }}
              placeholder="Ex: 2 ovos mexidos, 1 fatia de pão integral, café preto sem açúcar..."
              rows={3}
              style={{
                width: '100%', boxSizing: 'border-box',
                background: 'rgba(255,255,255,0.03)',
                border: '1px solid var(--border)',
                borderRadius: 6, padding: '10px 12px',
                color: 'var(--text)',
                fontFamily: 'var(--f-mono)', fontSize: 12,
                resize: 'vertical', outline: 'none',
                marginBottom: 12,
              }}
              onFocus={(e) => { e.target.style.borderColor = 'var(--accent)' }}
              onBlur={(e) => { e.target.style.borderColor = 'var(--border)' }}
            />

            {/* Botão analisar */}
            <button
              onClick={() => { void handleAnalyze() }}
              disabled={analyzing || !description.trim()}
              className="btn primary"
              style={{ width: '100%', justifyContent: 'center', marginBottom: 12 }}
            >
              {analyzing ? (
                <>
                  <span style={{
                    display: 'inline-block', width: 14, height: 14, borderRadius: '50%',
                    border: '2px solid currentColor', borderTopColor: 'transparent',
                    animation: 'forjaSpin 0.7s linear infinite',
                  }} />
                  Analisando...
                </>
              ) : (
                <><Icon name="flash" size={14} /> ANALISAR COM IA</>
              )}
            </button>

            {/* Erro */}
            {analyzeError && (
              <div style={{
                padding: '8px 12px', marginBottom: 12,
                background: 'rgba(255,61,85,0.06)',
                borderLeft: '2px solid var(--danger)',
                borderRadius: '0 4px 4px 0',
                fontFamily: 'var(--f-mono)', fontSize: 10, color: 'var(--danger)',
              }}>
                ⚠ {analyzeError}
              </div>
            )}

            {/* Resultado editável */}
            <AnimatePresence>
              {analyzed && (
                <motion.div
                  key="result"
                  initial={{ opacity: 0, y: 8 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0 }}
                >
                  {/* Feedback da IA */}
                  {feedback && (
                    <div style={{
                      background: 'rgba(212,255,58,0.04)',
                      border: '1px solid rgba(212,255,58,0.2)',
                      borderRadius: 6, padding: '10px 12px', marginBottom: 12,
                    }}>
                      <div className="label-sm" style={{ color: 'var(--accent)', marginBottom: 4 }}>✦ Análise Gemini</div>
                      <p style={{ margin: 0, fontSize: 12, color: 'var(--text-dim)', fontStyle: 'italic', lineHeight: 1.5 }}>
                        {feedback}
                      </p>
                    </div>
                  )}

                  {/* Macros editáveis */}
                  <div className="label-sm" style={{ marginBottom: 8 }}>Macros estimados — ajuste se necessário</div>
                  <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 8, marginBottom: 16 }}>
                    {([
                      { label: 'Calorias (kcal)', value: calories, set: setCalories },
                      { label: 'Proteína (g)', value: proteinG, set: setProteinG },
                      { label: 'Carboidrato (g)', value: carbsG, set: setCarbsG },
                      { label: 'Gordura (g)', value: fatG, set: setFatG },
                    ] as const).map(({ label, value, set }) => (
                      <div key={label}>
                        <div className="label-sm" style={{ marginBottom: 4 }}>{label}</div>
                        <input
                          type="number"
                          min={0}
                          value={value}
                          onChange={(e) => set(e.target.value)}
                          className="set-input"
                          style={{ width: '100%', textAlign: 'left' }}
                        />
                      </div>
                    ))}
                  </div>

                  {/* Salvar */}
                  <button
                    onClick={() => { void handleSave() }}
                    disabled={saving}
                    className="btn primary"
                    style={{ width: '100%', justifyContent: 'center' }}
                  >
                    {saving
                      ? 'Salvando...'
                      : <><Icon name="check" size={14} stroke={2.5} /> SALVAR REFEIÇÃO</>
                    }
                  </button>
                </motion.div>
              )}
            </AnimatePresence>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  )
}
