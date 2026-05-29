import { useEffect, useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { motion } from 'motion/react'
import { useAuth } from '../context/AuthContext'
import { Topbar } from '../components/layout/Topbar'
import { Icon } from '../components/ui/Icon'
import {
  getWorkoutHistory,
  getCurrentStreak,
  getPersonalRecordsThisMonth,
  getVolumeLastWeek,
  getAverageSessionDuration,
} from '../services/history.service'
import { getMyWorkouts } from '../services/workout.service'
import type { Workout, WeekDay, WorkoutLog } from '../types'
import { WEEK_DAY_SHORT, MUSCLE_GROUP_LABELS } from '../types'

// ─── Helpers ─────────────────────────────────────────────────────────────────

const DAY_MAP: Record<number, WeekDay> = {
  0: 'sunday',
  1: 'monday',
  2: 'tuesday',
  3: 'wednesday',
  4: 'thursday',
  5: 'friday',
  6: 'saturday',
}

const WEEK_ORDER: WeekDay[] = ['monday', 'tuesday', 'wednesday', 'thursday', 'friday', 'saturday', 'sunday']

function getGreeting(): string {
  const h = new Date().getHours()
  if (h < 12) return 'BOM DIA'
  if (h < 18) return 'BOA TARDE'
  return 'BOA NOITE'
}

function formatTodayHeader(): string {
  const d = new Date()
  const parts = d.toLocaleDateString('pt-BR', { weekday: 'long', day: '2-digit', month: 'short', year: 'numeric' })
  return parts.toUpperCase().replace(/\./g, '')
}

// ─── Página ──────────────────────────────────────────────────────────────────

export function DashboardPage() {
  const { profile, isManager, trainerMode } = useAuth()
  const showAdminView = isManager && trainerMode === 'gestao'
  const navigate = useNavigate()

  const [workouts, setWorkouts] = useState<Workout[]>([])
  const [history, setHistory] = useState<WorkoutLog[]>([])
  const [streak, setStreak] = useState({ current: 0, longest: 0 })
  const [prsThisMonthCount, setPrsThisMonthCount] = useState(0)
  const [volumeData, setVolumeData] = useState({ thisWeek: 0, lastWeek: 0 })
  const [avgDuration, setAvgDuration] = useState<number | null>(null)
  const [loading, setLoading] = useState(true)

  const firstName = (profile?.full_name ?? 'Atleta').split(' ')[0]
  const todayKey = DAY_MAP[new Date().getDay()]

  useEffect(() => {
    if (!profile?.id) return
    setLoading(true)
    Promise.all([
      showAdminView ? Promise.resolve([] as Workout[]) : getMyWorkouts(profile.id),
      showAdminView ? Promise.resolve([] as WorkoutLog[]) : getWorkoutHistory(profile.id),
      showAdminView ? Promise.resolve({ current: 0, longest: 0 }) : getCurrentStreak(profile.id),
      showAdminView ? Promise.resolve(0) : getPersonalRecordsThisMonth(profile.id),
      showAdminView ? Promise.resolve({ thisWeek: 0, lastWeek: 0 }) : getVolumeLastWeek(profile.id),
      showAdminView ? Promise.resolve(null as number | null) : getAverageSessionDuration(profile.id),
    ])
      .then(([w, h, str, prs, vol, avgDur]) => {
        setWorkouts(w)
        setHistory(h)
        setStreak(str)
        setPrsThisMonthCount(prs)
        setVolumeData(vol)
        setAvgDuration(avgDur)
      })
      .finally(() => setLoading(false))
  }, [profile?.id, showAdminView])

  const todayWorkout = workouts.find((w) => w.week_days.includes(todayKey))

  // Stats
  const lastSession = history[0]

  // Volume — formata kg/t e calcula delta vs semana anterior
  function formatVolume(kg: number) {
    if (kg >= 1000) return `${(kg / 1000).toFixed(1)}t`
    return `${kg}kg`
  }
  const volumeDelta = volumeData.lastWeek > 0
    ? Math.round(((volumeData.thisWeek - volumeData.lastWeek) / volumeData.lastWeek) * 100)
    : null

  return (
    <>
      <Topbar
        eyebrow={formatTodayHeader()}
        title={`${getGreeting()}, ${firstName.toUpperCase()}`}
        actions={
          <>
            {!showAdminView && todayWorkout && (
              <button
                className="btn primary"
                onClick={() => navigate(`/workouts/${todayWorkout.id}/session`)}
              >
                <Icon name="play" size={12} /> Iniciar treino
              </button>
            )}
            {showAdminView && (
              <button className="btn primary" onClick={() => navigate('/admin/workouts/new')}>
                <Icon name="plus" size={12} /> Nova ficha
              </button>
            )}
          </>
        }
      />

      <div className="content">
        {/* ════════ ADMIN: visão simplificada ════════ */}
        {showAdminView && (
          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.4 }}
            className="card card-accent"
            style={{ padding: 32, minHeight: 200 }}
          >
            <div className="eyebrow" style={{ color: 'rgba(0,0,0,0.55)' }}>PAINEL DO PERSONAL</div>
            <h1 className="f-display" style={{ fontSize: 72, lineHeight: 0.9, margin: '8px 0' }}>
              GERENCIE SUAS FICHAS
            </h1>
            <div style={{ fontSize: 15, color: 'rgba(0,0,0,0.7)', marginBottom: 24 }}>
              Crie templates, atribua a alunos e acompanhe o progresso.
            </div>
            <Link to="/admin/workouts" className="btn lg" style={{ background: '#0a0a0a', color: 'var(--accent)', borderColor: '#0a0a0a' }}>
              Ver fichas <Icon name="arrow" size={14} />
            </Link>
          </motion.div>
        )}

        {/* ════════ ALUNO: hero + stats ════════ */}
        {!showAdminView && (
          <>
            <div className="forja-dash-grid">
              {/* Hero — treino de hoje */}
              <motion.div
                initial={{ opacity: 0, y: 12 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.5, ease: [0.22, 1, 0.36, 1] }}
                className={todayWorkout ? 'card card-accent' : 'card'}
                style={{ padding: 32, position: 'relative', overflow: 'hidden', minHeight: 280 }}
              >
                {todayWorkout ? (
                  <>
                    {/* Big number watermark */}
                    <div className="forja-dash-watermark">
                      {workouts.indexOf(todayWorkout) + 1 < 10
                        ? `0${workouts.indexOf(todayWorkout) + 1}`
                        : workouts.indexOf(todayWorkout) + 1}
                    </div>
                    <div style={{ position: 'relative' }}>
                      <div className="eyebrow" style={{ color: 'rgba(0,0,0,0.55)' }}>
                        TREINO DE HOJE
                      </div>
                      <h1 className="f-display" style={{ fontSize: 88, lineHeight: 0.9, margin: '8px 0 4px' }}>
                        {todayWorkout.name.toUpperCase()}
                      </h1>
                      <div style={{ fontSize: 16, color: 'rgba(0,0,0,0.7)' }}>
                        {(() => {
                          const groups = Array.from(new Set(
                            (todayWorkout.exercises ?? [])
                              .map((e) => e.exercise?.muscle_group)
                              .filter(Boolean)
                          ))
                          return groups.map((g) => MUSCLE_GROUP_LABELS[g!]).join(' · ') || 'Treino completo'
                        })()}
                      </div>
                      <div style={{ display: 'flex', gap: 24, marginTop: 28, alignItems: 'baseline', flexWrap: 'wrap' }}>
                        <div>
                          <div style={{ fontSize: 10, color: 'rgba(0,0,0,0.55)', letterSpacing: '0.15em' }}>EXERCÍCIOS</div>
                          <div className="f-display" style={{ fontSize: 36 }}>
                            {String(todayWorkout.exercises?.length ?? 0).padStart(2, '0')}
                          </div>
                        </div>
                        <div style={{ width: 1, height: 40, background: 'rgba(0,0,0,0.2)' }} />
                        <div>
                          <div style={{ fontSize: 10, color: 'rgba(0,0,0,0.55)', letterSpacing: '0.15em' }}>SÉRIES TOTAIS</div>
                          <div className="f-display" style={{ fontSize: 36 }}>
                            {(todayWorkout.exercises ?? []).reduce((sum, e) => sum + (e.sets ?? 0), 0)}
                          </div>
                        </div>
                        {avgDuration !== null && (
                          <>
                            <div style={{ width: 1, height: 40, background: 'rgba(0,0,0,0.2)' }} />
                            <div>
                              <div style={{ fontSize: 10, color: 'rgba(0,0,0,0.55)', letterSpacing: '0.15em' }}>TEMPO MÉDIO</div>
                              <div className="f-display" style={{ fontSize: 36 }}>
                                ~{avgDuration}<span style={{ fontSize: 16, fontFamily: 'var(--f-body)', fontWeight: 400, marginLeft: 2 }}>min</span>
                              </div>
                            </div>
                          </>
                        )}
                      </div>
                      <div style={{ display: 'flex', gap: 10, marginTop: 28, flexWrap: 'wrap' }}>
                        <button
                          className="btn lg"
                          onClick={() => navigate(`/workouts/${todayWorkout.id}/session`)}
                          style={{ background: '#0a0a0a', color: 'var(--accent)', borderColor: '#0a0a0a' }}
                        >
                          <Icon name="play" size={14} /> Começar agora
                        </button>
                        <button
                          className="btn lg"
                          onClick={() => navigate(`/workouts/${todayWorkout.id}`)}
                          style={{ background: 'transparent', color: '#0a0a0a', borderColor: 'rgba(0,0,0,0.3)' }}
                        >
                          Ver detalhes
                        </button>
                      </div>
                    </div>
                  </>
                ) : (
                  <>
                    <div className="eyebrow">SEM TREINO HOJE</div>
                    <h1 className="f-display" style={{ fontSize: 64, lineHeight: 0.95, margin: '8px 0 16px', color: 'var(--text)' }}>
                      DIA DE DESCANSO
                    </h1>
                    <div style={{ fontSize: 14, color: 'var(--text-dim)', marginBottom: 24 }}>
                      Aproveite para recuperar — mobilidade leve, hidratação e sono.
                    </div>
                    {workouts.length > 0 && (
                      <Link to="/workouts" className="btn">
                        Ver todas as fichas <Icon name="arrow" size={14} />
                      </Link>
                    )}
                  </>
                )}
              </motion.div>

              {/* Stats column */}
              <div className="col gap-3">
                <motion.div
                  initial={{ opacity: 0, y: 12 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.5, delay: 0.08 }}
                  className="card"
                  style={{ minHeight: 120 }}
                >
                  <div className="stat-label">STREAK</div>
                  <div
                    className="stat-num"
                    style={{
                      fontSize: 52,
                      color: streak.current >= 7
                        ? 'var(--accent)'
                        : streak.current === 0
                          ? 'var(--text-dim)'
                          : 'var(--text)',
                    }}
                  >
                    {loading ? '…' : streak.current}
                    <span className="stat-unit">dias</span>
                  </div>
                  <div style={{ fontSize: 11, color: 'var(--text-dim)', marginTop: 4 }}>
                    máx: {loading ? '…' : streak.longest} dias
                  </div>
                </motion.div>

                <motion.div
                  initial={{ opacity: 0, y: 12 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.5, delay: 0.12 }}
                  style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}
                >
                  <div className="card">
                    <div className="stat-label">VOLUME SEM</div>
                    <div className="stat-num" style={{ fontSize: 38 }}>
                      {loading ? '…' : formatVolume(volumeData.thisWeek)}
                    </div>
                    {!loading && volumeDelta !== null ? (
                      <div style={{
                        fontSize: 11,
                        marginTop: 4,
                        fontWeight: 600,
                        color: volumeDelta > 0 ? 'var(--success)' : volumeDelta < 0 ? 'var(--danger)' : 'var(--text-dim)',
                      }}>
                        {volumeDelta > 0 ? '↑' : '↓'} {Math.abs(volumeDelta)}% vs sem. ant.
                      </div>
                    ) : (
                      <div style={{ fontSize: 11, color: 'var(--text-dim)', marginTop: 4 }}>
                        esta semana
                      </div>
                    )}
                  </div>
                  <Link to="/progresso" className="card" style={{ textDecoration: 'none' }}>
                    <div className="stat-label">PRs NO MÊS</div>
                    <div
                      className="stat-num"
                      style={{
                        fontSize: 44,
                        color: prsThisMonthCount > 0 ? 'var(--accent)' : 'var(--text)',
                      }}
                    >
                      {loading ? '…' : String(prsThisMonthCount).padStart(2, '0')}
                    </div>
                    <div style={{ color: 'var(--text-dim)', fontSize: 12, marginTop: 4 }}>
                      este mês
                    </div>
                  </Link>
                </motion.div>
              </div>
            </div>

            {/* ════════ Semana strip ════════ */}
            <motion.div
              initial={{ opacity: 0, y: 12 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.5, delay: 0.16 }}
              className="card"
              style={{ padding: 0 }}
            >
              <div
                style={{
                  display: 'flex',
                  justifyContent: 'space-between',
                  alignItems: 'center',
                  padding: '20px 24px',
                  borderBottom: '1px solid var(--hairline)',
                }}
              >
                <h2 className="card-title">SEMANA · MINHA ROTINA</h2>
                <Link to="/workouts" className="btn ghost">
                  Ver tudo <Icon name="arrow" size={14} />
                </Link>
              </div>
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(7, 1fr)' }}>
                {WEEK_ORDER.map((day, i) => {
                  const w = workouts.find((wk) => wk.week_days.includes(day))
                  const isToday = day === todayKey
                  const isRest = !w
                  return (
                    <div
                      key={day}
                      style={{
                        padding: '18px 16px',
                        borderRight: i < 6 ? '1px solid var(--hairline)' : 'none',
                        background: isToday ? 'var(--bg-2)' : 'transparent',
                        borderTop: isToday ? '3px solid var(--accent)' : '3px solid transparent',
                        opacity: isRest ? 0.55 : 1,
                        minHeight: 130,
                        display: 'flex',
                        flexDirection: 'column',
                        gap: 4,
                        cursor: w ? 'pointer' : 'default',
                      }}
                      onClick={() => w && navigate(`/workouts/${w.id}`)}
                    >
                      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                        <span
                          className="label-sm"
                          style={{ color: isToday ? 'var(--accent)' : 'var(--text-dim)' }}
                        >
                          {WEEK_DAY_SHORT[day]}
                        </span>
                        {isToday && (
                          <span className="chip solid" style={{ padding: '2px 6px', fontSize: 9 }}>
                            HOJE
                          </span>
                        )}
                      </div>
                      <div
                        className="f-display"
                        style={{ fontSize: 22, lineHeight: 1, color: 'var(--text)' }}
                      >
                        {w ? w.name.toUpperCase() : 'DESCANSO'}
                      </div>
                      <div style={{ fontSize: 11, color: 'var(--text-dim)' }}>
                        {w ? `${w.exercises?.length ?? 0} exercícios` : 'Folga'}
                      </div>
                    </div>
                  )
                })}
              </div>
            </motion.div>

            {/* ════════ Bottom row: última sessão + atalhos ════════ */}
            <div style={{ display: 'grid', gridTemplateColumns: '1.3fr 1fr', gap: 20 }} className="forja-dash-bottom">
              {/* Última sessão */}
              <div className="card">
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                  <h2 className="card-title">ÚLTIMA SESSÃO</h2>
                  <Link to="/historico" className="btn ghost">
                    Ver tudo <Icon name="arrow" size={14} />
                  </Link>
                </div>
                {lastSession ? (
                  <Link
                    to={`/historico/${lastSession.id}`}
                    style={{
                      display: 'block',
                      textDecoration: 'none',
                      marginTop: 18,
                      padding: 16,
                      background: 'var(--bg-2)',
                      borderRadius: 'var(--r-2)',
                      border: '1px solid var(--hairline)',
                      transition: 'border-color 0.15s',
                    }}
                    onMouseEnter={(e) => (e.currentTarget.style.borderColor = 'var(--accent)')}
                    onMouseLeave={(e) => (e.currentTarget.style.borderColor = 'var(--hairline)')}
                  >
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                      <div>
                        <div
                          className="f-display"
                          style={{ fontSize: 28, lineHeight: 1, color: 'var(--text)' }}
                        >
                          {(lastSession as WorkoutLog & { workout?: { name: string } }).workout?.name?.toUpperCase() ?? 'TREINO'}
                        </div>
                        <div style={{ fontSize: 12, color: 'var(--text-dim)', marginTop: 6 }}>
                          {new Date(lastSession.started_at).toLocaleDateString('pt-BR', {
                            weekday: 'long',
                            day: '2-digit',
                            month: 'short',
                          })}
                        </div>
                      </div>
                      <div style={{ textAlign: 'right' }}>
                        <div className="f-display" style={{ fontSize: 32, color: 'var(--accent)' }}>
                          {lastSession.duration_minutes ?? '—'}
                          <span className="stat-unit">min</span>
                        </div>
                      </div>
                    </div>
                  </Link>
                ) : (
                  <div
                    style={{
                      marginTop: 18,
                      padding: '24px 16px',
                      textAlign: 'center',
                      color: 'var(--text-dim)',
                      fontSize: 13,
                      border: '1px dashed var(--border)',
                      borderRadius: 'var(--r-2)',
                    }}
                  >
                    Nenhuma sessão registrada ainda — comece pelo treino de hoje.
                  </div>
                )}
              </div>

              {/* Atalhos */}
              <div className="card">
                <h2 className="card-title">ATALHOS</h2>
                <div className="col gap-3" style={{ marginTop: 18 }}>
                  {[
                    { to: '/historico', icon: 'history' as const, label: 'Histórico' },
                    { to: '/progresso', icon: 'chart' as const, label: 'Progresso' },
                    { to: '/medidas', icon: 'scale' as const, label: 'Peso & Medidas' },
                    { to: '/perfil', icon: 'user' as const, label: 'Perfil' },
                  ].map((item) => (
                    <Link
                      key={item.to}
                      to={item.to}
                      style={{
                        display: 'flex',
                        alignItems: 'center',
                        gap: 12,
                        padding: '10px 12px',
                        borderRadius: 'var(--r-2)',
                        background: 'var(--bg-2)',
                        textDecoration: 'none',
                        color: 'var(--text)',
                        fontSize: 13,
                        fontWeight: 500,
                        transition: 'background 0.15s',
                      }}
                      onMouseEnter={(e) => (e.currentTarget.style.background = 'var(--bg-3)')}
                      onMouseLeave={(e) => (e.currentTarget.style.background = 'var(--bg-2)')}
                    >
                      <div style={{ color: 'var(--accent)' }}>
                        <Icon name={item.icon} size={16} />
                      </div>
                      <span style={{ flex: 1 }}>{item.label}</span>
                      <Icon name="arrow" size={14} />
                    </Link>
                  ))}
                </div>
              </div>
            </div>
          </>
        )}
      </div>

      {/* CSS específico do Dashboard */}
      <style>{`
        .forja-dash-grid {
          display: grid;
          grid-template-columns: 1.5fr 1fr;
          gap: 20px;
        }
        .forja-dash-watermark {
          position: absolute;
          right: -40px;
          top: -40px;
          opacity: 0.06;
          font-family: var(--f-display);
          font-size: 380px;
          line-height: 0.8;
          color: #000;
          pointer-events: none;
        }
        @media (max-width: 900px) {
          .forja-dash-grid { grid-template-columns: 1fr; }
          .forja-dash-bottom { grid-template-columns: 1fr !important; }
          .forja-dash-watermark { font-size: 220px; }
        }
      `}</style>
    </>
  )
}
