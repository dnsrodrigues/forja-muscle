import { useState, useEffect } from 'react'
import { Link, useSearchParams } from 'react-router-dom'
import { motion } from 'motion/react'
import { useAuth } from '../context/AuthContext'
import {
  getExercisesTrainedByUser,
  getLoadProgression,
  getWeeklyFrequency,
} from '../services/history.service'
import { LoadProgressChart } from '../components/charts/LoadProgressChart'
import { FrequencyChart } from '../components/charts/FrequencyChart'
import { Topbar } from '../components/layout/Topbar'
import { Icon } from '../components/ui/Icon'
import type { Exercise, LoadPoint, WeekFrequency } from '../types'
import { MUSCLE_GROUP_LABELS } from '../types'

export function ProgressPage() {
  const { profile } = useAuth()
  const [searchParams] = useSearchParams()

  const [exercises, setExercises] = useState<Exercise[]>([])
  const [selectedId, setSelectedId] = useState<string>('')
  const [loadData, setLoadData] = useState<LoadPoint[]>([])
  const [freqData, setFreqData] = useState<WeekFrequency[]>([])
  const [loadingInit, setLoadingInit] = useState(true)
  const [loadingChart, setLoadingChart] = useState(false)
  const [error, setError] = useState<string | null>(null)

  async function init() {
    if (!profile?.id) return
    setLoadingInit(true)
    setError(null)
    try {
      const [exs, freq] = await Promise.all([
        getExercisesTrainedByUser(profile.id),
        getWeeklyFrequency(profile.id),
      ])
      setExercises(exs)
      setFreqData(freq)

      const paramId = searchParams.get('exercise')
      const initial = paramId && exs.find((e) => e.id === paramId) ? paramId : exs[0]?.id ?? ''
      setSelectedId(initial)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Erro ao carregar dados')
    } finally {
      setLoadingInit(false)
    }
  }

  useEffect(() => { void init() }, [profile?.id])

  useEffect(() => {
    if (!selectedId || !profile?.id) return
    setLoadingChart(true)
    getLoadProgression(profile.id, selectedId)
      .then(setLoadData)
      .catch((err) => setError(err instanceof Error ? err.message : 'Erro'))
      .finally(() => setLoadingChart(false))
  }, [selectedId, profile?.id])

  const selectedExercise = exercises.find((e) => e.id === selectedId)
  const loadDelta = loadData.length >= 2 ? loadData[loadData.length - 1].maxLoad - loadData[0].maxLoad : null
  const totalRecentWorkouts = freqData.reduce((sum, w) => sum + w.count, 0)
  const maxLoad = loadData.reduce((max, d) => (d.maxLoad > max ? d.maxLoad : max), 0)

  return (
    <>
      <Topbar
        eyebrow="ÚLTIMOS 90 DIAS"
        title="PROGRESSO"
        actions={
          <Link to="/dashboard" className="btn ghost">
            <Icon name="arrowL" size={14} /> Voltar
          </Link>
        }
      />

      <div className="content">
        {loadingInit && (
          <>
            <div className="skeleton" style={{ height: 120, borderRadius: 14 }} />
            <div className="skeleton" style={{ height: 260, borderRadius: 14 }} />
            <div className="skeleton" style={{ height: 200, borderRadius: 14 }} />
          </>
        )}

        {!loadingInit && error && (
          <div
            className="card"
            style={{ borderLeft: '2px solid var(--danger)', background: 'rgba(255,61,85,0.05)' }}
          >
            <div style={{ color: 'var(--danger)', marginBottom: 8 }}>⚠ {error}</div>
            <button onClick={init} className="btn ghost">Tentar novamente</button>
          </div>
        )}

        {!loadingInit && !error && exercises.length === 0 && (
          <div
            className="card"
            style={{ borderStyle: 'dashed', textAlign: 'center', padding: '40px 24px' }}
          >
            <div style={{ fontSize: 36, marginBottom: 8 }}>📊</div>
            <h2 className="f-display" style={{ fontSize: 28, color: 'var(--text)', marginBottom: 6 }}>
              NADA PARA MEDIR AINDA
            </h2>
            <div style={{ color: 'var(--text-dim)', fontSize: 13, marginBottom: 20 }}>
              Complete uma sessão para ver sua evolução.
            </div>
            <Link to="/workouts" className="btn primary">
              <Icon name="play" size={12} /> Registrar primeiro treino
            </Link>
          </div>
        )}

        {!loadingInit && !error && exercises.length > 0 && (
          <motion.div
            initial={{ opacity: 0, y: 8 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.3 }}
            style={{ display: 'flex', flexDirection: 'column', gap: 20 }}
          >
            {/* Top stats */}
            <div className="forja-progress-stats">
              <div className="card">
                <div className="stat-label">Treinos · 8 sem</div>
                <div className="f-display" style={{ fontSize: 56, color: 'var(--text)' }}>
                  {String(totalRecentWorkouts).padStart(2, '0')}
                </div>
              </div>
              <div className="card">
                <div className="stat-label">Exercícios feitos</div>
                <div className="f-display" style={{ fontSize: 56, color: 'var(--accent)' }}>
                  {exercises.length}
                </div>
              </div>
              <div className="card">
                <div className="stat-label">Maior carga</div>
                <div className="f-display" style={{ fontSize: 56, color: 'var(--text)' }}>
                  {maxLoad}<span className="stat-unit" style={{ fontSize: 14 }}>kg</span>
                </div>
              </div>
              <div className="card">
                <div className="stat-label">Variação</div>
                <div
                  className="f-display"
                  style={{
                    fontSize: 56,
                    color: loadDelta === null ? 'var(--text)' : loadDelta >= 0 ? 'var(--success)' : 'var(--danger)',
                  }}
                >
                  {loadDelta === null ? '—' : `${loadDelta >= 0 ? '+' : ''}${loadDelta}`}
                  <span className="stat-unit" style={{ fontSize: 14 }}>kg</span>
                </div>
              </div>
            </div>

            {/* Big chart — Evolução de carga */}
            <div className="card">
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', flexWrap: 'wrap', gap: 16 }}>
                <div>
                  <h2 className="card-title">
                    {(selectedExercise?.name ?? 'EXERCÍCIO').toUpperCase()}
                  </h2>
                  <div style={{ display: 'flex', gap: 8, marginTop: 8, alignItems: 'baseline', flexWrap: 'wrap' }}>
                    <div className="f-display" style={{ fontSize: 64, color: 'var(--accent)' }}>
                      {maxLoad}
                      <span className="stat-unit" style={{ fontSize: 14, color: 'var(--text-dim)' }}>kg</span>
                    </div>
                    {loadDelta !== null && (
                      <div
                        style={{
                          color: loadDelta >= 0 ? 'var(--success)' : 'var(--danger)',
                          fontSize: 13,
                          marginLeft: 12,
                        }}
                      >
                        {loadDelta >= 0 ? '↗' : '↘'} {loadDelta >= 0 ? '+' : ''}{loadDelta}kg no período
                      </div>
                    )}
                  </div>
                </div>
                <div style={{ display: 'flex', flexDirection: 'column', gap: 8, minWidth: 240 }}>
                  <div className="label-sm">Exercício</div>
                  <select
                    className="input"
                    value={selectedId}
                    onChange={(e) => setSelectedId(e.target.value)}
                  >
                    {exercises.map((ex) => (
                      <option key={ex.id} value={ex.id}>
                        {ex.name} — {MUSCLE_GROUP_LABELS[ex.muscle_group]}
                      </option>
                    ))}
                  </select>
                </div>
              </div>

              <div style={{ marginTop: 24 }}>
                {loadingChart ? (
                  <div className="skeleton" style={{ height: 180 }} />
                ) : loadData.length === 0 ? (
                  <div
                    style={{
                      height: 180,
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      color: 'var(--text-faint)',
                      fontStyle: 'italic',
                      fontSize: 13,
                    }}
                  >
                    Sem dados de carga para este exercício.
                  </div>
                ) : (
                  <LoadProgressChart data={loadData} exerciseName={selectedExercise?.name ?? ''} />
                )}
              </div>
            </div>

            {/* Frequência semanal */}
            <div className="card">
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: 12 }}>
                <h2 className="card-title">FREQUÊNCIA · ÚLTIMAS 8 SEMANAS</h2>
                <span className="chip solid">{totalRecentWorkouts} treinos</span>
              </div>
              <div style={{ marginTop: 18 }}>
                <FrequencyChart data={freqData} />
              </div>
            </div>
          </motion.div>
        )}
      </div>

      <style>{`
        .forja-progress-stats {
          display: grid;
          grid-template-columns: repeat(4, 1fr);
          gap: 14px;
        }
        @media (max-width: 768px) {
          .forja-progress-stats { grid-template-columns: repeat(2, 1fr); }
        }
      `}</style>
    </>
  )
}
