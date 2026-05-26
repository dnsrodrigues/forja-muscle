import { useState, useEffect } from 'react'
import { Link } from 'react-router-dom'
import { motion } from 'motion/react'
import { ArrowLeft, Plus, RefreshCw } from 'lucide-react'
import { useAuth } from '../context/AuthContext'
import {
  getUserWeights,
  addUserWeight,
  getBodyMeasurements,
  addBodyMeasurement,
} from '../services/measurements.service'
import { WeightChart } from '../components/charts/WeightChart'
import { WeightEntryModal } from '../components/WeightEntryModal'
import { MeasurementEntryModal } from '../components/MeasurementEntryModal'
import type { UserWeight, BodyMeasurement } from '../types'

const MEASUREMENT_FIELDS: { key: keyof BodyMeasurement; label: string }[] = [
  { key: 'waist_cm',   label: 'Cintura' },
  { key: 'hip_cm',     label: 'Quadril' },
  { key: 'abdomen_cm', label: 'Abdômen' },
  { key: 'chest_cm',   label: 'Peitoral' },
  { key: 'arm_cm',     label: 'Braço' },
  { key: 'thigh_cm',   label: 'Coxa' },
  { key: 'calf_cm',    label: 'Panturrilha' },
]

function formatDate(iso: string): string {
  return new Date(iso).toLocaleDateString('pt-BR', {
    day: '2-digit', month: 'short', year: 'numeric',
  })
}

export function MeasurementsPage() {
  const { profile } = useAuth()

  const [weights, setWeights] = useState<UserWeight[]>([])
  const [measurements, setMeasurements] = useState<BodyMeasurement[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [showWeightModal, setShowWeightModal] = useState(false)
  const [showMeasurementModal, setShowMeasurementModal] = useState(false)

  async function load() {
    if (!profile?.id) return
    setLoading(true)
    setError(null)
    try {
      const [w, m] = await Promise.all([
        getUserWeights(profile.id),
        getBodyMeasurements(profile.id),
      ])
      setWeights(w)
      setMeasurements(m)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Erro ao carregar dados')
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => { load() }, [profile?.id])

  const lastWeight = weights[0]
  const firstWeight = weights[weights.length - 1]
  const weightDelta = (lastWeight && firstWeight && lastWeight.id !== firstWeight.id)
    ? Number(lastWeight.weight_kg) - Number(firstWeight.weight_kg)
    : null

  const lastMeasurement = measurements[0]

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
              // medidas
            </div>
            <div style={{
              fontFamily: "'Outfit', sans-serif", fontWeight: 800, fontSize: 16, color: 'var(--fg)',
            }}>
              Peso & Medidas
            </div>
          </div>
        </div>
      </header>

      {/* Conteúdo */}
      <main className="relative z-10">
        <div className="max-w-xl mx-auto" style={{ padding: '20px 16px 40px' }}>

          {loading && (
            <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
              <div className="skeleton" style={{ height: 200, borderRadius: 4 }} />
              <div className="skeleton" style={{ height: 160, borderRadius: 4 }} />
            </div>
          )}

          {!loading && error && (
            <div style={{
              borderLeft: '2px solid var(--danger)',
              background: 'rgba(239,68,68,0.05)',
              borderRadius: '0 4px 4px 0',
              padding: '12px 16px',
            }}>
              <div style={{ fontFamily: "'JetBrains Mono', monospace", fontSize: 11, color: 'var(--danger)', marginBottom: 6 }}>
                ⚠ {error}
              </div>
              <button onClick={load} style={{
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

          {!loading && !error && (
            <motion.div
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.3 }}
              style={{ display: 'flex', flexDirection: 'column', gap: 20 }}
            >

              {/* ── Seção Peso ── */}
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
                  <div>
                    <div style={{
                      fontFamily: "'JetBrains Mono', monospace", fontSize: 9,
                      color: 'var(--fg-3)', letterSpacing: '0.15em',
                      textTransform: 'uppercase', marginBottom: 2,
                    }}>
                      // peso corporal
                    </div>
                    {lastWeight && (
                      <div style={{ display: 'flex', alignItems: 'baseline', gap: 8 }}>
                        <span style={{
                          fontFamily: "'Outfit', sans-serif", fontWeight: 800,
                          fontSize: 22, color: 'var(--fg)', letterSpacing: '-0.02em',
                        }}>
                          {Number(lastWeight.weight_kg).toFixed(1)} kg
                        </span>
                        {weightDelta !== null && (
                          <span style={{
                            fontFamily: "'JetBrains Mono', monospace", fontSize: 10,
                            color: weightDelta <= 0 ? 'var(--success)' : 'var(--danger)',
                          }}>
                            {weightDelta > 0 ? '+' : ''}{weightDelta.toFixed(1)}kg
                          </span>
                        )}
                      </div>
                    )}
                  </div>
                  <button
                    onClick={() => setShowWeightModal(true)}
                    style={{
                      display: 'flex', alignItems: 'center', gap: 5,
                      background: 'var(--accent)', border: 'none', borderRadius: 4,
                      padding: '7px 12px', color: 'var(--bg)',
                      fontFamily: "'Outfit', sans-serif", fontWeight: 800,
                      fontSize: 9, letterSpacing: '0.12em', textTransform: 'uppercase',
                      cursor: 'pointer',
                    }}
                  >
                    <Plus size={11} /> Registrar
                  </button>
                </div>

                <div style={{ padding: '16px' }}>
                  {weights.length === 0 ? (
                    <div style={{
                      height: 80, display: 'flex', alignItems: 'center', justifyContent: 'center',
                      fontFamily: "'JetBrains Mono', monospace", fontSize: 10,
                      color: 'var(--fg-3)', fontStyle: 'italic',
                    }}>
                      // nenhum peso registrado
                    </div>
                  ) : (
                    <>
                      <WeightChart data={weights.slice(0, 20)} />
                      <div style={{ marginTop: 16, display: 'flex', flexDirection: 'column', gap: 0 }}>
                        {weights.slice(0, 10).map((w, idx) => {
                          const prev = weights[idx + 1]
                          const delta = prev ? Number(w.weight_kg) - Number(prev.weight_kg) : null
                          return (
                            <div key={w.id} style={{
                              display: 'flex', justifyContent: 'space-between', alignItems: 'center',
                              padding: '8px 0',
                              borderBottom: idx < 9 ? '1px solid var(--border)' : 'none',
                            }}>
                              <div style={{
                                fontFamily: "'JetBrains Mono', monospace", fontSize: 10,
                                color: 'var(--fg-3)',
                              }}>
                                {formatDate(w.measured_at)}
                              </div>
                              <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                                {delta !== null && delta !== 0 && (
                                  <span style={{
                                    fontFamily: "'JetBrains Mono', monospace", fontSize: 9,
                                    color: delta <= 0 ? 'var(--success)' : 'var(--danger)',
                                  }}>
                                    {delta > 0 ? '+' : ''}{delta.toFixed(1)}
                                  </span>
                                )}
                                <span style={{
                                  fontFamily: "'JetBrains Mono', monospace", fontSize: 11,
                                  color: 'var(--fg)', fontWeight: idx === 0 ? 700 : 400,
                                }}>
                                  {Number(w.weight_kg).toFixed(1)} kg
                                </span>
                              </div>
                            </div>
                          )
                        })}
                      </div>
                    </>
                  )}
                </div>
              </section>

              {/* ── Seção Medidas Corporais ── */}
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
                    // medidas corporais
                  </div>
                  <button
                    onClick={() => setShowMeasurementModal(true)}
                    style={{
                      display: 'flex', alignItems: 'center', gap: 5,
                      background: 'var(--accent)', border: 'none', borderRadius: 4,
                      padding: '7px 12px', color: 'var(--bg)',
                      fontFamily: "'Outfit', sans-serif", fontWeight: 800,
                      fontSize: 9, letterSpacing: '0.12em', textTransform: 'uppercase',
                      cursor: 'pointer',
                    }}
                  >
                    <Plus size={11} /> Nova medição
                  </button>
                </div>

                <div style={{ padding: '16px' }}>
                  {measurements.length === 0 ? (
                    <div style={{
                      height: 80, display: 'flex', alignItems: 'center', justifyContent: 'center',
                      fontFamily: "'JetBrains Mono', monospace", fontSize: 10,
                      color: 'var(--fg-3)', fontStyle: 'italic',
                    }}>
                      // nenhuma medição registrada
                    </div>
                  ) : (
                    <>
                      {/* Último registro — grid */}
                      {lastMeasurement && (
                        <div style={{ marginBottom: 16 }}>
                          <div style={{
                            fontFamily: "'JetBrains Mono', monospace", fontSize: 8,
                            color: 'var(--fg-3)', letterSpacing: '0.12em',
                            textTransform: 'uppercase', marginBottom: 10,
                          }}>
                            último registro — {formatDate(lastMeasurement.measured_at)}
                          </div>
                          <div style={{
                            display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)',
                            gap: 6,
                          }}>
                            {MEASUREMENT_FIELDS.filter((f) => lastMeasurement[f.key] != null).map((f) => (
                              <div key={f.key} style={{
                                background: 'var(--surface-2)',
                                border: '1px solid var(--border)',
                                borderRadius: 4,
                                padding: '8px 10px',
                                display: 'flex', justifyContent: 'space-between', alignItems: 'center',
                              }}>
                                <span style={{
                                  fontFamily: "'JetBrains Mono', monospace", fontSize: 8,
                                  color: 'var(--fg-3)', letterSpacing: '0.08em', textTransform: 'uppercase',
                                }}>
                                  {f.label}
                                </span>
                                <span style={{
                                  fontFamily: "'JetBrains Mono', monospace", fontSize: 12,
                                  color: 'var(--fg)',
                                }}>
                                  {Number(lastMeasurement[f.key]).toFixed(1)} cm
                                </span>
                              </div>
                            ))}
                          </div>
                        </div>
                      )}

                      {/* Histórico compacto */}
                      {measurements.length > 1 && (
                        <>
                          <div style={{
                            fontFamily: "'JetBrains Mono', monospace", fontSize: 8,
                            color: 'var(--fg-3)', letterSpacing: '0.12em',
                            textTransform: 'uppercase', marginBottom: 8,
                            paddingTop: 12, borderTop: '1px solid var(--border)',
                          }}>
                            histórico
                          </div>
                          <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
                            {measurements.slice(1, 4).map((m) => (
                              <div key={m.id} style={{
                                display: 'flex', justifyContent: 'space-between',
                                alignItems: 'center',
                                padding: '6px 0',
                                borderBottom: '1px solid var(--border)',
                              }}>
                                <span style={{
                                  fontFamily: "'JetBrains Mono', monospace", fontSize: 9,
                                  color: 'var(--fg-3)',
                                }}>
                                  {formatDate(m.measured_at)}
                                </span>
                                <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap', justifyContent: 'flex-end' }}>
                                  {MEASUREMENT_FIELDS.filter((f) => m[f.key] != null).slice(0, 4).map((f) => (
                                    <span key={f.key} style={{
                                      fontFamily: "'JetBrains Mono', monospace", fontSize: 8,
                                      color: 'var(--fg-3)',
                                    }}>
                                      {f.label.substring(0, 3)}: {Number(m[f.key]).toFixed(0)}
                                    </span>
                                  ))}
                                </div>
                              </div>
                            ))}
                          </div>
                        </>
                      )}
                    </>
                  )}
                </div>
              </section>

            </motion.div>
          )}

        </div>
      </main>

      {/* Modais */}
      <WeightEntryModal
        isOpen={showWeightModal}
        lastWeight={lastWeight ? Number(lastWeight.weight_kg) : undefined}
        onClose={() => setShowWeightModal(false)}
        onSaved={(w) => setWeights((prev) => [w, ...prev])}
        onSave={(kg, at) => addUserWeight(profile!.id, kg, at)}
      />
      <MeasurementEntryModal
        isOpen={showMeasurementModal}
        onClose={() => setShowMeasurementModal(false)}
        onSaved={(m) => setMeasurements((prev) => [m, ...prev])}
        onSave={(data) => addBodyMeasurement(profile!.id, data)}
      />
    </div>
  )
}
