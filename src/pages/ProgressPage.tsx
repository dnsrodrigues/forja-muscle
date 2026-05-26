import { useState, useEffect } from 'react'
import { Link, useSearchParams } from 'react-router-dom'
import { motion } from 'motion/react'
import { ArrowLeft, RefreshCw } from 'lucide-react'
import { useAuth } from '../context/AuthContext'
import {
  getExercisesTrainedByUser,
  getLoadProgression,
  getWeeklyFrequency,
} from '../services/history.service'
import { LoadProgressChart } from '../components/charts/LoadProgressChart'
import { FrequencyChart } from '../components/charts/FrequencyChart'
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

  // Inicializa: carrega exercícios treinados + frequência
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

      // Pré-seleciona via URL param ou primeiro da lista
      const paramId = searchParams.get('exercise')
      const initial = (paramId && exs.find((e) => e.id === paramId))
        ? paramId
        : exs[0]?.id ?? ''
      setSelectedId(initial)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Erro ao carregar dados')
    } finally {
      setLoadingInit(false)
    }
  }

  useEffect(() => { init() }, [profile?.id])

  // Carrega dados do gráfico quando o exercício muda
  useEffect(() => {
    if (!selectedId || !profile?.id) return
    setLoadingChart(true)
    getLoadProgression(profile.id, selectedId)
      .then(setLoadData)
      .catch((err) => setError(err instanceof Error ? err.message : 'Erro'))
      .finally(() => setLoadingChart(false))
  }, [selectedId, profile?.id])

  const selectedExercise = exercises.find((e) => e.id === selectedId)

  // Calcula variação total de carga
  const loadDelta = loadData.length >= 2
    ? loadData[loadData.length - 1].maxLoad - loadData[0].maxLoad
    : null

  // Total de treinos nas últimas 8 semanas
  const totalRecentWorkouts = freqData.reduce((sum, w) => sum + w.count, 0)

  return (
    <div className="min-h-screen" style={{ background: 'var(--bg)' }}>

      {/* Grid decorativo */}
      <div className="fixed inset-0 pointer-events-none z-0"
        style={{ display: 'grid', gridTemplateColumns: 'repeat(12, 1fr)' }}>
        {Array.from({ length: 12 }).map((_, i) => (
          <span key={i} style={{ borderRight: '1px solid var(--border)' }} />
        ))}
      </div>

      {/* Header */}
      <header className="sticky top-0 z-20" style={{
        padding: '14px 16px',
        background: 'rgba(6, 7, 26,0.7)',
        borderBottom: '1px solid var(--border)',
        backdropFilter: 'blur(12px)',
      }}>
        <div className="max-w-xl mx-auto flex items-center gap-3">
          <Link to="/dashboard" style={{
            color: 'var(--fg-3)', opacity: 0.5, display: 'flex', alignItems: 'center',
          }}>
            <ArrowLeft size={16} />
          </Link>
          <div>
            <div style={{
              fontFamily: "'JetBrains Mono', monospace", fontSize: 9,
              color: 'var(--fg-3)', letterSpacing: '0.15em',
              textTransform: 'uppercase', marginBottom: 1,
            }}>
              // progresso
            </div>
            <div style={{
              fontFamily: "'Outfit', sans-serif", fontWeight: 800, fontSize: 16, color: 'var(--fg)',
            }}>
              Evolução
            </div>
          </div>
        </div>
      </header>

      {/* Conteúdo */}
      <main className="relative z-10">
        <div className="max-w-xl mx-auto" style={{ padding: '20px 16px 40px' }}>

          {/* Loading inicial */}
          {loadingInit && (
            <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
              <div className="skeleton" style={{ height: 200, borderRadius: 4 }} />
              <div className="skeleton" style={{ height: 160, borderRadius: 4 }} />
            </div>
          )}

          {/* Erro */}
          {!loadingInit && error && (
            <div style={{
              borderLeft: '2px solid var(--danger)',
              background: 'rgba(239,68,68,0.05)',
              borderRadius: '0 4px 4px 0',
              padding: '12px 16px',
            }}>
              <div style={{ fontFamily: "'JetBrains Mono', monospace", fontSize: 11, color: 'var(--danger)', marginBottom: 6 }}>
                ⚠ {error}
              </div>
              <button onClick={init} style={{
                display: 'flex', alignItems: 'center', gap: 5,
                background: 'transparent', border: '1px solid var(--border-md)',
                borderRadius: 4, padding: '5px 12px', color: 'var(--fg-2)',
                fontFamily: "'JetBrains Mono', monospace", fontSize: 10,
                letterSpacing: '0.1em', cursor: 'pointer', textTransform: 'uppercase',
              }}>
                <RefreshCw size={10} /> Tentar novamente
              </button>
            </div>
          )}

          {/* Sem dados */}
          {!loadingInit && !error && exercises.length === 0 && (
            <div style={{
              border: '1px dashed var(--border)', borderRadius: 4,
              padding: '40px 24px', textAlign: 'center',
            }}>
              <div style={{ fontSize: 36, marginBottom: 12 }}>📊</div>
              <div style={{
                fontFamily: "'Outfit', sans-serif", fontWeight: 800,
                fontSize: 15, color: 'var(--fg)', marginBottom: 8,
              }}>
                Nenhum treino registrado
              </div>
              <div style={{
                fontFamily: "'JetBrains Mono', monospace", fontSize: 10,
                color: 'var(--fg-3)', fontStyle: 'italic', marginBottom: 20,
              }}>
                // complete uma sessão para ver sua evolução
              </div>
              <Link to="/workouts" style={{
                display: 'inline-flex', alignItems: 'center', gap: 6,
                background: 'var(--accent)', border: 'none', borderRadius: 4,
                padding: '9px 18px', color: 'var(--bg)',
                fontFamily: "'Outfit', sans-serif", fontWeight: 800,
                fontSize: 10, letterSpacing: '0.15em', textTransform: 'uppercase',
                textDecoration: 'none',
              }}>
                Registrar primeiro treino →
              </Link>
            </div>
          )}

          {!loadingInit && !error && exercises.length > 0 && (
            <motion.div
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.3 }}
              style={{ display: 'flex', flexDirection: 'column', gap: 20 }}
            >

              {/* ── Bloco 1: Evolução de carga ── */}
              <section style={{
                background: 'var(--surface)',
                border: '1px solid var(--border)',
                borderRadius: 4,
                overflow: 'hidden',
              }}>
                <div style={{
                  padding: '14px 16px',
                  borderBottom: '1px solid var(--border)',
                  display: 'flex', alignItems: 'center', justifyContent: 'space-between',
                }}>
                  <div style={{
                    fontFamily: "'JetBrains Mono', monospace", fontSize: 9,
                    color: 'var(--fg-3)', letterSpacing: '0.15em', textTransform: 'uppercase',
                  }}>
                    // evolução de carga
                  </div>
                  {loadDelta !== null && (
                    <div style={{
                      fontFamily: "'JetBrains Mono', monospace", fontSize: 10,
                      color: loadDelta >= 0 ? 'var(--success)' : 'var(--danger)',
                      border: `1px solid ${loadDelta >= 0 ? 'rgba(74,222,128,0.3)' : 'rgba(239,68,68,0.3)'}`,
                      padding: '2px 8px',
                    }}>
                      {loadDelta >= 0 ? '+' : ''}{loadDelta}kg
                    </div>
                  )}
                </div>

                <div style={{ padding: '16px' }}>
                  {/* Seletor de exercício */}
                  <div style={{ marginBottom: 16 }}>
                    <div style={{
                      fontFamily: "'JetBrains Mono', monospace", fontSize: 8,
                      color: 'var(--fg-3)', letterSpacing: '0.12em',
                      textTransform: 'uppercase', marginBottom: 6,
                    }}>
                      exercício
                    </div>
                    <select
                      value={selectedId}
                      onChange={(e) => setSelectedId(e.target.value)}
                      style={{
                        width: '100%',
                        background: 'var(--surface-2)',
                        border: '1px solid var(--border-md)',
                        borderRadius: 4,
                        padding: '9px 12px',
                        fontFamily: "'JetBrains Mono', monospace",
                        fontSize: 11,
                        color: 'var(--fg)',
                        outline: 'none',
                        cursor: 'pointer',
                      }}
                    >
                      {exercises.map((ex) => (
                        <option key={ex.id} value={ex.id}>
                          {ex.name} — {MUSCLE_GROUP_LABELS[ex.muscle_group]}
                        </option>
                      ))}
                    </select>
                  </div>

                  {/* Gráfico */}
                  {loadingChart ? (
                    <div className="skeleton" style={{ height: 180, borderRadius: 4 }} />
                  ) : loadData.length === 0 ? (
                    <div style={{
                      height: 120, display: 'flex', alignItems: 'center', justifyContent: 'center',
                      fontFamily: "'JetBrains Mono', monospace", fontSize: 10,
                      color: 'var(--fg-3)', fontStyle: 'italic',
                    }}>
                      // sem dados de carga para este exercício
                    </div>
                  ) : (
                    <LoadProgressChart
                      data={loadData}
                      exerciseName={selectedExercise?.name ?? ''}
                    />
                  )}
                </div>
              </section>

              {/* ── Bloco 2: Frequência semanal ── */}
              <section style={{
                background: 'var(--surface)',
                border: '1px solid var(--border)',
                borderRadius: 4,
                overflow: 'hidden',
              }}>
                <div style={{
                  padding: '14px 16px',
                  borderBottom: '1px solid var(--border)',
                  display: 'flex', alignItems: 'center', justifyContent: 'space-between',
                }}>
                  <div style={{
                    fontFamily: "'JetBrains Mono', monospace", fontSize: 9,
                    color: 'var(--fg-3)', letterSpacing: '0.15em', textTransform: 'uppercase',
                  }}>
                    // frequência — últimas 8 semanas
                  </div>
                  <div style={{
                    fontFamily: "'JetBrains Mono', monospace", fontSize: 10,
                    color: 'var(--accent)',
                    border: '1px solid rgba(108, 142, 247,0.25)',
                    padding: '2px 8px',
                  }}>
                    {totalRecentWorkouts} treino{totalRecentWorkouts !== 1 ? 's' : ''}
                  </div>
                </div>

                <div style={{ padding: '16px' }}>
                  <FrequencyChart data={freqData} />
                </div>
              </section>

            </motion.div>
          )}

        </div>
      </main>
    </div>
  )
}
