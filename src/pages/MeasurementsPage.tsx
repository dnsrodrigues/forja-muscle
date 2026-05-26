import { useState, useEffect } from 'react'
import { Link } from 'react-router-dom'
import { motion } from 'motion/react'
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
import { Topbar } from '../components/layout/Topbar'
import { Icon } from '../components/ui/Icon'
import type { UserWeight, BodyMeasurement } from '../types'

const MEASUREMENT_FIELDS: { key: keyof BodyMeasurement; label: string }[] = [
  { key: 'waist_cm', label: 'Cintura' },
  { key: 'hip_cm', label: 'Quadril' },
  { key: 'abdomen_cm', label: 'Abdômen' },
  { key: 'chest_cm', label: 'Peitoral' },
  { key: 'arm_cm', label: 'Braço' },
  { key: 'thigh_cm', label: 'Coxa' },
  { key: 'calf_cm', label: 'Panturrilha' },
]

function formatDate(iso: string): string {
  return new Date(iso).toLocaleDateString('pt-BR', {
    day: '2-digit',
    month: 'short',
    year: 'numeric',
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

  useEffect(() => { void load() }, [profile?.id])

  const lastWeight = weights[0]
  const firstWeight = weights[weights.length - 1]
  const weightDelta = lastWeight && firstWeight && lastWeight.id !== firstWeight.id
    ? Number(lastWeight.weight_kg) - Number(firstWeight.weight_kg)
    : null

  const lastMeasurement = measurements[0]

  return (
    <>
      <Topbar
        eyebrow="ACOMPANHAMENTO CORPORAL"
        title="PESO & MEDIDAS"
        actions={
          <Link to="/dashboard" className="btn ghost">
            <Icon name="arrowL" size={14} /> Voltar
          </Link>
        }
      />

      <div className="content">
        {loading && (
          <>
            <div className="skeleton" style={{ height: 280, borderRadius: 14 }} />
            <div className="skeleton" style={{ height: 200, borderRadius: 14 }} />
          </>
        )}

        {!loading && error && (
          <div
            className="card"
            style={{ borderLeft: '2px solid var(--danger)', background: 'rgba(255,61,85,0.05)' }}
          >
            <div style={{ color: 'var(--danger)', marginBottom: 8 }}>⚠ {error}</div>
            <button onClick={load} className="btn ghost">Tentar novamente</button>
          </div>
        )}

        {!loading && !error && (
          <motion.div
            initial={{ opacity: 0, y: 8 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.3 }}
            style={{ display: 'flex', flexDirection: 'column', gap: 20 }}
          >
            {/* PESO */}
            <div className="card" style={{ padding: 0 }}>
              <div
                style={{
                  display: 'flex',
                  justifyContent: 'space-between',
                  alignItems: 'center',
                  padding: '20px 24px',
                  borderBottom: '1px solid var(--hairline)',
                  flexWrap: 'wrap',
                  gap: 12,
                }}
              >
                <div>
                  <div className="stat-label">Peso corporal</div>
                  {lastWeight ? (
                    <div style={{ display: 'flex', alignItems: 'baseline', gap: 14, marginTop: 6 }}>
                      <div className="f-display" style={{ fontSize: 56, color: 'var(--text)' }}>
                        {Number(lastWeight.weight_kg).toFixed(1)}
                        <span className="stat-unit" style={{ fontSize: 14 }}>kg</span>
                      </div>
                      {weightDelta !== null && weightDelta !== 0 && (
                        <span
                          style={{
                            fontSize: 14,
                            color: weightDelta <= 0 ? 'var(--success)' : 'var(--danger)',
                            fontFamily: 'var(--f-mono)',
                          }}
                        >
                          {weightDelta > 0 ? '↗ +' : '↘ '}{weightDelta.toFixed(1)}kg
                        </span>
                      )}
                    </div>
                  ) : (
                    <div className="f-display" style={{ fontSize: 48, color: 'var(--text-faint)' }}>
                      —
                    </div>
                  )}
                </div>
                <button onClick={() => setShowWeightModal(true)} className="btn primary">
                  <Icon name="plus" size={12} /> Registrar peso
                </button>
              </div>

              <div style={{ padding: '20px 24px' }}>
                {weights.length === 0 ? (
                  <div
                    style={{
                      height: 80,
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      color: 'var(--text-faint)',
                      fontStyle: 'italic',
                      fontSize: 13,
                    }}
                  >
                    Nenhum peso registrado.
                  </div>
                ) : (
                  <>
                    <WeightChart data={weights.slice(0, 20)} />
                    <div style={{ marginTop: 20 }}>
                      <div className="label-sm" style={{ marginBottom: 10 }}>
                        Últimos registros
                      </div>
                      <div className="col">
                        {weights.slice(0, 10).map((w, idx) => {
                          const prev = weights[idx + 1]
                          const delta = prev ? Number(w.weight_kg) - Number(prev.weight_kg) : null
                          return (
                            <div
                              key={w.id}
                              style={{
                                display: 'flex',
                                justifyContent: 'space-between',
                                alignItems: 'center',
                                padding: '10px 0',
                                borderBottom: idx < 9 ? '1px solid var(--hairline)' : 'none',
                              }}
                            >
                              <div className="f-mono" style={{ fontSize: 12, color: 'var(--text-dim)' }}>
                                {formatDate(w.measured_at)}
                              </div>
                              <div style={{ display: 'flex', alignItems: 'center', gap: 14 }}>
                                {delta !== null && delta !== 0 && (
                                  <span
                                    style={{
                                      fontFamily: 'var(--f-mono)',
                                      fontSize: 11,
                                      color: delta <= 0 ? 'var(--success)' : 'var(--danger)',
                                    }}
                                  >
                                    {delta > 0 ? '+' : ''}{delta.toFixed(1)}
                                  </span>
                                )}
                                <span
                                  className="f-mono"
                                  style={{
                                    fontSize: 14,
                                    color: 'var(--text)',
                                    fontWeight: idx === 0 ? 600 : 400,
                                  }}
                                >
                                  {Number(w.weight_kg).toFixed(1)} kg
                                </span>
                              </div>
                            </div>
                          )
                        })}
                      </div>
                    </div>
                  </>
                )}
              </div>
            </div>

            {/* MEDIDAS CORPORAIS */}
            <div className="card" style={{ padding: 0 }}>
              <div
                style={{
                  display: 'flex',
                  justifyContent: 'space-between',
                  alignItems: 'center',
                  padding: '20px 24px',
                  borderBottom: '1px solid var(--hairline)',
                  flexWrap: 'wrap',
                  gap: 12,
                }}
              >
                <h2 className="card-title">MEDIDAS CORPORAIS</h2>
                <button onClick={() => setShowMeasurementModal(true)} className="btn primary">
                  <Icon name="plus" size={12} /> Nova medição
                </button>
              </div>

              <div style={{ padding: '20px 24px' }}>
                {measurements.length === 0 ? (
                  <div
                    style={{
                      height: 80,
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      color: 'var(--text-faint)',
                      fontStyle: 'italic',
                      fontSize: 13,
                    }}
                  >
                    Nenhuma medição registrada.
                  </div>
                ) : (
                  <>
                    {lastMeasurement && (
                      <>
                        <div className="label-sm" style={{ marginBottom: 12 }}>
                          Último registro — {formatDate(lastMeasurement.measured_at)}
                        </div>
                        <div className="forja-measurements-grid">
                          {MEASUREMENT_FIELDS.filter((f) => lastMeasurement[f.key] != null).map((f) => (
                            <div
                              key={f.key}
                              style={{
                                background: 'var(--bg-2)',
                                border: '1px solid var(--hairline)',
                                borderRadius: 'var(--r-2)',
                                padding: 14,
                              }}
                            >
                              <div className="stat-label" style={{ fontSize: 10 }}>{f.label}</div>
                              <div className="f-display" style={{ fontSize: 32, color: 'var(--text)' }}>
                                {Number(lastMeasurement[f.key]).toFixed(1)}
                                <span className="stat-unit" style={{ fontSize: 12 }}>cm</span>
                              </div>
                            </div>
                          ))}
                        </div>
                      </>
                    )}

                    {measurements.length > 1 && (
                      <div style={{ marginTop: 24, paddingTop: 16, borderTop: '1px solid var(--hairline)' }}>
                        <div className="label-sm" style={{ marginBottom: 10 }}>Histórico</div>
                        <div className="col gap-2">
                          {measurements.slice(1, 6).map((m) => (
                            <div
                              key={m.id}
                              style={{
                                display: 'flex',
                                justifyContent: 'space-between',
                                alignItems: 'center',
                                padding: '8px 0',
                                borderBottom: '1px solid var(--hairline)',
                              }}
                            >
                              <span className="f-mono" style={{ fontSize: 11, color: 'var(--text-dim)' }}>
                                {formatDate(m.measured_at)}
                              </span>
                              <div style={{ display: 'flex', gap: 12, flexWrap: 'wrap', justifyContent: 'flex-end' }}>
                                {MEASUREMENT_FIELDS.filter((f) => m[f.key] != null)
                                  .slice(0, 4)
                                  .map((f) => (
                                    <span
                                      key={f.key}
                                      className="f-mono"
                                      style={{ fontSize: 11, color: 'var(--text-faint)' }}
                                    >
                                      {f.label.substring(0, 3)}: {Number(m[f.key]).toFixed(0)}
                                    </span>
                                  ))}
                              </div>
                            </div>
                          ))}
                        </div>
                      </div>
                    )}
                  </>
                )}
              </div>
            </div>
          </motion.div>
        )}
      </div>

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

      <style>{`
        .forja-measurements-grid {
          display: grid;
          grid-template-columns: repeat(auto-fit, minmax(140px, 1fr));
          gap: 10px;
        }
      `}</style>
    </>
  )
}
