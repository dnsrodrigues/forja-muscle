import { useState, useEffect } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { motion } from 'motion/react'
import { useAuth } from '../context/AuthContext'
import { getWorkoutHistory } from '../services/history.service'
import { deleteWorkoutSession } from '../services/workout-log.service'
import { Topbar } from '../components/layout/Topbar'
import { Icon } from '../components/ui/Icon'
import { ConfirmModal } from '../components/ui/ConfirmModal'
import { useToast } from '../context/ToastContext'
import type { WorkoutLog } from '../types'

const DIFFICULTY_LABEL: Record<string, string> = {
  easy: '😊 Fácil',
  medium: '💪 Médio',
  hard: '🔥 Difícil',
  terrible: '💀 Destruidor',
}

function formatDate(iso: string): string {
  const d = new Date(iso)
  return d.toLocaleDateString('pt-BR', {
    weekday: 'short',
    day: '2-digit',
    month: 'short',
    year: 'numeric',
  })
}

export function HistoryPage() {
  const { profile } = useAuth()
  const navigate = useNavigate()
  const { showToast } = useToast()
  const [sessions, setSessions] = useState<WorkoutLog[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [confirmId, setConfirmId] = useState<string | null>(null)
  const [deletingId, setDeletingId] = useState<string | null>(null)

  async function load() {
    if (!profile?.id) return
    setLoading(true)
    setError(null)
    try {
      const data = await getWorkoutHistory(profile.id)
      setSessions(data)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Erro ao carregar histórico')
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => { void load() }, [profile?.id])

  async function handleDelete(id: string) {
    setDeletingId(id)
    try {
      await deleteWorkoutSession(id)
      setSessions((prev) => prev.filter((s) => s.id !== id))
      showToast('Treino apagado.', 'success')
    } catch (err) {
      showToast(err instanceof Error ? err.message : 'Erro ao apagar treino', 'error')
    } finally {
      setDeletingId(null)
      setConfirmId(null)
    }
  }

  const confirmSession = confirmId ? sessions.find((s) => s.id === confirmId) : null

  // Stats agregados
  const total = sessions.length
  const totalMinutes = sessions.reduce((sum, s) => sum + (s.duration_minutes ?? 0), 0)
  const last30Days = sessions.filter((s) => {
    const d = new Date(s.started_at)
    return Date.now() - d.getTime() < 30 * 24 * 3600 * 1000
  })

  return (
    <>
      <Topbar
        eyebrow="TUDO QUE FOI FORJADO"
        title="HISTÓRICO"
        actions={
          <Link to="/dashboard" className="btn ghost">
            <Icon name="arrowL" size={14} /> Voltar
          </Link>
        }
      />

      <div className="content">
        {/* Stats */}
        <div className="forja-history-stats">
          <div className="card">
            <div className="stat-label">Total</div>
            <div className="f-display" style={{ fontSize: 48, color: 'var(--text)' }}>
              {loading ? '…' : String(total).padStart(2, '0')}
            </div>
          </div>
          <div className="card">
            <div className="stat-label">Tempo total</div>
            <div className="f-display" style={{ fontSize: 48, color: 'var(--accent)' }}>
              {loading ? '…' : Math.round(totalMinutes / 60)}
              <span className="stat-unit" style={{ fontSize: 14 }}>h</span>
            </div>
          </div>
          <div className="card">
            <div className="stat-label">Últimos 30d</div>
            <div className="f-display" style={{ fontSize: 48, color: 'var(--success)' }}>
              {loading ? '…' : last30Days.length}
            </div>
          </div>
          <div className="card">
            <div className="stat-label">Última sessão</div>
            <div
              className="f-display"
              style={{ fontSize: 22, color: 'var(--text)', lineHeight: 1.1 }}
            >
              {loading
                ? '…'
                : sessions[0]
                  ? new Date(sessions[0].started_at).toLocaleDateString('pt-BR', { day: '2-digit', month: 'short' })
                  : '—'}
            </div>
          </div>
        </div>

        {/* Loading */}
        {loading && (
          <div className="col gap-3">
            {[1, 2, 3, 4].map((i) => (
              <div key={i} className="skeleton" style={{ height: 80, borderRadius: 14 }} />
            ))}
          </div>
        )}

        {/* Erro */}
        {!loading && error && (
          <div
            className="card"
            style={{ borderLeft: '2px solid var(--danger)', background: 'rgba(255,61,85,0.05)' }}
          >
            <div style={{ color: 'var(--danger)', marginBottom: 8 }}>⚠ {error}</div>
            <button onClick={load} className="btn ghost">Tentar novamente</button>
          </div>
        )}

        {/* Vazio */}
        {!loading && !error && sessions.length === 0 && (
          <div
            className="card"
            style={{ borderStyle: 'dashed', textAlign: 'center', padding: '40px 24px' }}
          >
            <div style={{ fontSize: 36, marginBottom: 8 }}>🏋️</div>
            <h2 className="f-display" style={{ fontSize: 28, color: 'var(--text)', marginBottom: 6 }}>
              NADA NA FORJA AINDA
            </h2>
            <div style={{ color: 'var(--text-dim)', fontSize: 13, marginBottom: 20 }}>
              Complete uma sessão para ver seu histórico.
            </div>
            <button className="btn primary" onClick={() => navigate('/workouts')}>
              <Icon name="play" size={12} /> Começar agora
            </button>
          </div>
        )}

        {/* Lista de sessões */}
        {!loading && !error && sessions.length > 0 && (
          <div className="col gap-2">
            <div className="label-sm">
              {sessions.length} sessão{sessions.length !== 1 ? 'ões' : ''} registrada{sessions.length !== 1 ? 's' : ''}
            </div>
            {sessions.map((session, idx) => {
              const workout = (session as WorkoutLog & { workout?: { name: string } }).workout
              const diff = session.difficulty ? DIFFICULTY_LABEL[session.difficulty] : null
              const open = () => navigate(`/historico/${session.id}`)
              return (
                <motion.div
                  key={session.id}
                  initial={{ opacity: 0, y: 8 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.25, delay: idx * 0.03 }}
                >
                  <div
                    className="card forja-history-row"
                    role="button"
                    tabIndex={0}
                    onClick={open}
                    onKeyDown={(e) => { if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); open() } }}
                    style={{ cursor: 'pointer' }}
                  >
                    <div className="forja-history-grid">
                      <div>
                        <div className="label-sm" style={{ color: 'var(--text-dim)' }}>
                          {formatDate(session.started_at)}
                        </div>
                        <div
                          className="f-display"
                          style={{ fontSize: 28, color: 'var(--text)', lineHeight: 1, marginTop: 6 }}
                        >
                          {(workout?.name ?? 'TREINO').toUpperCase()}
                        </div>
                      </div>
                      <div className="forja-history-stats-row">
                        {session.duration_minutes && (
                          <div>
                            <div className="stat-label">Tempo</div>
                            <div className="f-display" style={{ fontSize: 24, color: 'var(--accent)' }}>
                              {session.duration_minutes}<span className="stat-unit" style={{ fontSize: 12 }}>min</span>
                            </div>
                          </div>
                        )}
                        {diff && (
                          <div>
                            <div className="stat-label">Dificuldade</div>
                            <div style={{ fontSize: 14, marginTop: 2 }}>{diff}</div>
                          </div>
                        )}
                      </div>
                      <div style={{ display: 'flex', alignItems: 'center', gap: 4 }}>
                        <button
                          type="button"
                          onClick={(e) => { e.stopPropagation(); setConfirmId(session.id) }}
                          aria-label="Apagar treino"
                          className="forja-del-btn"
                          disabled={deletingId === session.id}
                        >
                          <Icon name="trash" size={16} />
                        </button>
                        <Icon name="arrow" size={18} />
                      </div>
                    </div>
                  </div>
                </motion.div>
              )
            })}
          </div>
        )}
      </div>

      {confirmId && (
        <ConfirmModal
          title="Apagar treino?"
          message={`Isto vai apagar permanentemente a sessão${confirmSession ? ' de ' + formatDate(confirmSession.started_at) : ''} e todas as séries registradas. Não dá pra desfazer.`}
          confirmLabel="Apagar"
          danger
          onConfirm={() => void handleDelete(confirmId)}
          onCancel={() => setConfirmId(null)}
        />
      )}

      <style>{`
        .forja-history-stats {
          display: grid;
          grid-template-columns: repeat(4, 1fr);
          gap: 14px;
        }
        .forja-history-row { transition: border-color 0.15s; }
        .forja-history-row:hover { border-color: var(--accent) !important; }
        .forja-del-btn {
          background: transparent;
          border: none;
          color: var(--text-faint);
          cursor: pointer;
          padding: 6px;
          border-radius: 8px;
          display: flex;
          align-items: center;
          transition: background 0.15s, color 0.15s;
        }
        .forja-del-btn:hover { background: rgba(255,61,85,0.12); color: var(--danger); }
        .forja-del-btn:disabled { opacity: 0.5; cursor: default; }
        .forja-history-grid {
          display: grid;
          grid-template-columns: 1fr auto auto;
          gap: 24px;
          align-items: center;
        }
        .forja-history-stats-row {
          display: flex;
          gap: 24px;
          align-items: center;
        }
        @media (max-width: 768px) {
          .forja-history-stats { grid-template-columns: repeat(2, 1fr); }
          .forja-history-grid { grid-template-columns: 1fr; gap: 12px; }
          .forja-history-stats-row { justify-content: flex-start; }
        }
      `}</style>
    </>
  )
}
