import { useEffect, useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { motion } from 'motion/react'
import { useAuth } from '../../context/AuthContext'
import { Topbar } from '../../components/layout/Topbar'
import { Icon } from '../../components/ui/Icon'
import { getAdminDashboardStats } from '../../services/admin.service'
import type { AdminDashboardStats } from '../../types'

/**
 * Painel de gestão (alertas). Mostra os mesmos números que apareciam no
 * "Hoje" quando logado em modo Gestão: total de alunos, treinos da semana e,
 * principalmente, quem precisa de atenção. No mobile é acessível pela lista
 * GESTÃO dentro do Perfil.
 */
export function AlertasPage() {
  const { profile, isSuperAdmin } = useAuth()
  const navigate = useNavigate()
  const [stats, setStats] = useState<AdminDashboardStats | null>(null)

  useEffect(() => {
    if (!profile?.id) return
    setStats(null)
    getAdminDashboardStats({ isSuperAdmin, trainerId: profile.id })
      .then(setStats)
      .catch(() => setStats(null))
  }, [profile?.id, isSuperAdmin])

  return (
    <>
      <Topbar
        eyebrow="PAINEL DE GESTÃO"
        title="ALERTAS"
        actions={
          <Link to="/dashboard" className="btn ghost">
            <Icon name="arrowL" size={14} /> Voltar
          </Link>
        }
      />

      <div className="content">
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.4 }}
        >
          {/* Cards de número */}
          <div className="forja-alertas-stats" style={{ marginBottom: 20 }}>
            <div className="card">
              <div className="stat-label">ALUNOS</div>
              <div className="f-display" style={{ fontSize: 48, color: 'var(--accent)' }}>
                {stats ? stats.totalStudents : '…'}
              </div>
              <div style={{ fontSize: 12, color: 'var(--text-dim)' }}>
                {stats ? `${stats.activeStudents} ativos` : ' '}
              </div>
            </div>
            <div className="card">
              <div className="stat-label">TREINOS NA SEMANA</div>
              <div className="f-display" style={{ fontSize: 48, color: 'var(--text)' }}>
                {stats ? stats.sessionsThisWeek : '…'}
              </div>
              <div style={{ fontSize: 12, color: 'var(--text-dim)' }}>últimos 7 dias</div>
            </div>
            <div
              className="card"
              style={{ borderLeft: stats && stats.needAttention.length > 0 ? '2px solid var(--warn)' : undefined }}
            >
              <div className="stat-label">PRECISAM DE ATENÇÃO</div>
              <div
                className="f-display"
                style={{ fontSize: 48, color: stats && stats.needAttention.length > 0 ? 'var(--warn)' : 'var(--text)' }}
              >
                {stats ? stats.needAttention.length : '…'}
              </div>
              <div style={{ fontSize: 12, color: 'var(--text-dim)' }}>sem ficha ou parados</div>
            </div>
          </div>

          {/* Lista: precisam de atenção */}
          <div className="card" style={{ marginBottom: 20 }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 14 }}>
              <h2 className="card-title">PRECISAM DE ATENÇÃO</h2>
              <Link to="/admin/students" className="btn ghost">
                Ver alunos <Icon name="arrow" size={14} />
              </Link>
            </div>
            {!stats ? (
              <div className="skeleton" style={{ height: 64, borderRadius: 14 }} />
            ) : stats.needAttention.length === 0 ? (
              <div style={{ padding: 20, textAlign: 'center', color: 'var(--text-dim)', fontSize: 13 }}>
                🎉 Todos os alunos estão em dia!
              </div>
            ) : (
              <div className="col gap-2">
                {stats.needAttention.map((s) => (
                  <button
                    key={s.id}
                    onClick={() => navigate(`/admin/students/${s.id}`)}
                    style={{
                      display: 'flex', alignItems: 'center', justifyContent: 'space-between',
                      gap: 12, padding: '12px 14px', textAlign: 'left',
                      background: 'var(--bg-2)', border: '1px solid var(--hairline)',
                      borderRadius: 'var(--r-2)', cursor: 'pointer', color: 'var(--text)',
                    }}
                  >
                    <span style={{ fontWeight: 600, fontSize: 14 }}>{s.full_name}</span>
                    <span
                      className="chip"
                      style={{ color: 'var(--warn)', borderColor: 'var(--warn)' }}
                    >
                      {s.reason === 'sem-ficha'
                        ? 'Sem ficha'
                        : s.daysSinceLastWorkout === null
                          ? 'Nunca treinou'
                          : `Parado há ${s.daysSinceLastWorkout} dias`}
                    </span>
                  </button>
                ))}
              </div>
            )}
          </div>
        </motion.div>
      </div>

      <style>{`
        .forja-alertas-stats {
          display: grid;
          grid-template-columns: repeat(3, 1fr);
          gap: 14px;
        }
        @media (max-width: 768px) {
          .forja-alertas-stats { grid-template-columns: 1fr; }
        }
      `}</style>
    </>
  )
}
