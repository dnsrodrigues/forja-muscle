import { useEffect, useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { motion } from 'motion/react'
import { useAuth } from '../context/AuthContext'
import { Topbar } from '../components/layout/Topbar'
import { Icon } from '../components/ui/Icon'
import { useIsMobile } from '../hooks/useIsMobile'
import { MobHead } from '../components/layout/MobHead'
import {
  getWorkoutHistory,
  getCurrentStreak,
  getPersonalRecordsThisMonth,
  getVolumeLastWeek,
  getAverageSessionDuration,
} from '../services/history.service'
import { getMyWorkouts } from '../services/workout.service'
import { getAdminDashboardStats } from '../services/admin.service'
import type { Workout, WeekDay, WorkoutLog, AdminDashboardStats } from '../types'
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
  const { profile, isManager, isSuperAdmin, trainerMode } = useAuth()
  const navigate = useNavigate()
  const isMobile = useIsMobile()
  // No mobile o app é sempre "meu treino" — o painel de gestão fica em /admin/alertas
  const showAdminView = isManager && trainerMode === 'gestao' && !isMobile

  const [workouts, setWorkouts] = useState<Workout[]>([])
  const [history, setHistory] = useState<WorkoutLog[]>([])
  const [streak, setStreak] = useState({ current: 0, longest: 0 })
  const [prsThisMonthCount, setPrsThisMonthCount] = useState(0)
  const [volumeData, setVolumeData] = useState({ thisWeek: 0, lastWeek: 0 })
  const [avgDuration, setAvgDuration] = useState<number | null>(null)
  const [loading, setLoading] = useState(true)
  const [adminStats, setAdminStats] = useState<AdminDashboardStats | null>(null)

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

  useEffect(() => {
    if (!profile?.id || !showAdminView) return
    setAdminStats(null)
    getAdminDashboardStats({ isSuperAdmin, trainerId: profile.id })
      .then(setAdminStats)
      .catch(() => setAdminStats(null))
  }, [profile?.id, showAdminView, isSuperAdmin])

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

  // ─── Render mobile (aluno) ────────────────────────────────────────────────
  if (isMobile && !showAdminView) {
    const WEEK_DAYS_ORDERED: WeekDay[] = [
      'monday', 'tuesday', 'wednesday', 'thursday', 'friday', 'saturday', 'sunday',
    ]
    const WEEK_SHORT: Record<WeekDay, string> = {
      monday: 'S', tuesday: 'T', wednesday: 'Q',
      thursday: 'Q', friday: 'S', saturday: 'S', sunday: 'D',
    }
    const weekStart = (() => {
      const d = new Date()
      const day = d.getDay()
      d.setDate(d.getDate() + (day === 0 ? -6 : 1 - day))
      d.setHours(0, 0, 0, 0)
      return d
    })()
    const DAY_INDEX_MAP: Record<number, WeekDay> = {
      0: 'sunday', 1: 'monday', 2: 'tuesday', 3: 'wednesday',
      4: 'thursday', 5: 'friday', 6: 'saturday',
    }
    const doneDays = new Set<WeekDay>(
      history
        .filter((h) => new Date(h.started_at) >= weekStart)
        .map((h) => DAY_INDEX_MAP[new Date(h.started_at).getDay()])
    )
    const avatarInitial = (profile?.full_name ?? 'A').charAt(0).toUpperCase()

    return (
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ duration: 0.2 }}
        style={{ display: 'flex', flexDirection: 'column', minHeight: '100%' }}
      >
        <MobHead
          over={formatTodayHeader()}
          title={`${getGreeting()}, ${firstName.toUpperCase()}`}
          right={
            <div
              style={{
                width: 44, height: 44, borderRadius: 12,
                background: 'var(--bg-2)', border: '2px solid var(--bg-3)',
                display: 'flex', alignItems: 'center', justifyContent: 'center',
                fontFamily: 'var(--f-display)', fontSize: 22, color: 'var(--accent)',
                cursor: 'pointer', flexShrink: 0, overflow: 'hidden',
              }}
              onClick={() => navigate('/perfil')}
            >
              {profile?.avatar_url ? (
                <img
                  src={profile.avatar_url}
                  alt={profile.full_name}
                  style={{ width: '100%', height: '100%', objectFit: 'cover' }}
                />
              ) : (
                avatarInitial
              )}
            </div>
          }
        />

        <div className="mob-scroll">
          {loading ? (
            <>
              <div className="skeleton" style={{ height: 210, borderRadius: 14, marginBottom: 10 }} />
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10, marginBottom: 10 }}>
                <div className="skeleton" style={{ height: 88, borderRadius: 14 }} />
                <div className="skeleton" style={{ height: 88, borderRadius: 14 }} />
              </div>
            </>
          ) : (
            <>
              {/* Hero card */}
              <div
                className={todayWorkout ? 'card card-accent' : 'card'}
                style={{
                  padding: 22, marginBottom: 12,
                  position: 'relative', overflow: 'hidden',
                  minHeight: todayWorkout ? 200 : 140,
                }}
              >
                {todayWorkout ? (
                  <>
                    <div
                      className="f-display"
                      style={{
                        position: 'absolute', right: -10, bottom: -20,
                        fontSize: 180, opacity: 0.07, color: '#000',
                        lineHeight: 1, pointerEvents: 'none', userSelect: 'none',
                      }}
                    >
                      {String(workouts.indexOf(todayWorkout) + 1).padStart(2, '0')}
                    </div>
                    <div style={{ position: 'relative' }}>
                      <div className="eyebrow" style={{ color: 'rgba(0,0,0,0.5)', marginBottom: 4 }}>
                        TREINO DE HOJE
                      </div>
                      <h2 className="f-display" style={{ fontSize: 64, lineHeight: 0.85, margin: 0 }}>
                        {todayWorkout.name.toUpperCase()}
                      </h2>
                      <div style={{ fontSize: 13, color: 'rgba(0,0,0,0.65)', marginTop: 6 }}>
                        {Array.from(new Set(
                          (todayWorkout.exercises ?? [])
                            .map((e) => e.exercise?.muscle_group)
                            .filter(Boolean)
                        ))
                          .map((g) => MUSCLE_GROUP_LABELS[g!])
                          .join(' · ') || 'Treino completo'}
                      </div>
                      <div className="f-mono" style={{ display: 'flex', gap: 16, marginTop: 10, fontSize: 12, color: 'rgba(0,0,0,0.7)' }}>
                        <span><b>{todayWorkout.exercises?.length ?? 0}</b> exerc.</span>
                        {avgDuration !== null && <span><b>{avgDuration}</b>min</span>}
                      </div>
                      <button
                        className="btn lg"
                        onClick={() => navigate(`/workouts/${todayWorkout.id}/session`)}
                        style={{
                          width: '100%', justifyContent: 'center', marginTop: 16,
                          background: '#080909', color: 'var(--accent)', borderColor: '#080909',
                        }}
                      >
                        <Icon name="play" size={13} /> COMEÇAR TREINO
                      </button>
                    </div>
                  </>
                ) : (
                  <>
                    <div className="eyebrow" style={{ marginBottom: 8 }}>SEM TREINO HOJE</div>
                    <h2 className="f-display" style={{ fontSize: 44, lineHeight: 0.95, margin: '0 0 10px' }}>
                      DIA DE DESCANSO
                    </h2>
                    <div style={{ fontSize: 13, color: 'var(--text-dim)' }}>
                      Recuperação ativa, mobilidade ou descanso total.
                    </div>
                  </>
                )}
              </div>

              {/* 2 KPIs */}
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10, marginBottom: 12 }}>
                <div className="mob-kpi">
                  <div className="stat-label">Streak</div>
                  <div className="mob-kpi-val">
                    {streak.current}<span className="mob-kpi-unit">d</span>
                  </div>
                </div>
                <div className="mob-kpi">
                  <div className="stat-label">Vol. semana</div>
                  <div className="mob-kpi-val" style={{ fontSize: 28 }}>
                    {formatVolume(volumeData.thisWeek)}
                  </div>
                </div>
              </div>

              {/* Mini-semana */}
              <div className="card" style={{ padding: '14px 16px', marginBottom: 12 }}>
                <div className="label-sm" style={{ marginBottom: 12 }}>ESTA SEMANA</div>
                <div style={{ display: 'flex', justifyContent: 'space-between', gap: 4 }}>
                  {WEEK_DAYS_ORDERED.map((day) => {
                    const isToday = day === todayKey
                    const hasWorkout = workouts.some((w) => w.week_days.includes(day))
                    const isDone = doneDays.has(day)
                    return (
                      <div
                        key={day}
                        style={{
                          flex: 1, padding: '8px 2px',
                          background: isToday ? 'var(--accent)' : isDone ? 'var(--bg-2)' : 'transparent',
                          color: isToday ? 'var(--accent-fg)' : isDone ? 'var(--text)' : 'var(--text-faint)',
                          borderRadius: 6, textAlign: 'center',
                          border: !hasWorkout && !isToday ? '1px dashed var(--hairline)' : 'none',
                        }}
                      >
                        <div style={{ fontSize: 9, letterSpacing: '0.06em', opacity: 0.8 }}>
                          {WEEK_SHORT[day]}
                        </div>
                        <div className="f-display" style={{ fontSize: 16, marginTop: 3, lineHeight: 1 }}>
                          {isDone ? '✓' : !hasWorkout ? '—' : '·'}
                        </div>
                      </div>
                    )
                  })}
                </div>
              </div>

              {/* Última sessão */}
              {lastSession && (
                <div className="card" style={{ padding: '14px 16px' }}>
                  <div className="label-sm" style={{ marginBottom: 12 }}>ÚLTIMA SESSÃO</div>
                  <div className="mob-lrow" style={{ paddingTop: 0, paddingBottom: 0, border: 'none' }}>
                    <div
                      style={{
                        width: 42, height: 42, borderRadius: '50%',
                        background: 'var(--bg-2)', border: '1px solid var(--hairline)',
                        display: 'flex', alignItems: 'center', justifyContent: 'center',
                        color: 'var(--accent)', flexShrink: 0,
                      }}
                    >
                      <Icon name="flame" size={20} />
                    </div>
                    <div style={{ flex: 1, minWidth: 0 }}>
                      <div style={{ fontSize: 14, fontWeight: 600, color: 'var(--text)' }}>
                        {(lastSession.workout as { name?: string } | undefined)?.name ?? 'Treino'}
                      </div>
                      <div style={{ fontSize: 12, color: 'var(--text-dim)', marginTop: 2 }}>
                        {new Date(lastSession.started_at).toLocaleDateString('pt-BR', {
                          day: '2-digit', month: 'short',
                        })}
                        {lastSession.duration_minutes ? ` · ${lastSession.duration_minutes}min` : ''}
                      </div>
                    </div>
                    {prsThisMonthCount > 0 && (
                      <div style={{ textAlign: 'right', flexShrink: 0 }}>
                        <div style={{ fontSize: 9, color: 'var(--text-faint)', textTransform: 'uppercase', letterSpacing: '0.1em' }}>
                          PRs/mês
                        </div>
                        <div className="f-display" style={{ fontSize: 28, color: 'var(--accent)', lineHeight: 1 }}>
                          {prsThisMonthCount}
                        </div>
                      </div>
                    )}
                  </div>
                </div>
              )}
            </>
          )}
        </div>
      </motion.div>
    )
  }

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
        {/* ════════ ADMIN: painel com números reais ════════ */}
        {showAdminView && (
          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.4 }}
          >
            {/* Cards de número */}
            <div className="forja-admin-stats" style={{ marginBottom: 20 }}>
              <div className="card">
                <div className="stat-label">ALUNOS</div>
                <div className="f-display" style={{ fontSize: 48, color: 'var(--accent)' }}>
                  {adminStats ? adminStats.totalStudents : '…'}
                </div>
                <div style={{ fontSize: 12, color: 'var(--text-dim)' }}>
                  {adminStats ? `${adminStats.activeStudents} ativos` : ' '}
                </div>
              </div>
              <div className="card">
                <div className="stat-label">TREINOS NA SEMANA</div>
                <div className="f-display" style={{ fontSize: 48, color: 'var(--text)' }}>
                  {adminStats ? adminStats.sessionsThisWeek : '…'}
                </div>
                <div style={{ fontSize: 12, color: 'var(--text-dim)' }}>últimos 7 dias</div>
              </div>
              <div
                className="card"
                style={{ borderLeft: adminStats && adminStats.needAttention.length > 0 ? '2px solid var(--warn)' : undefined }}
              >
                <div className="stat-label">PRECISAM DE ATENÇÃO</div>
                <div
                  className="f-display"
                  style={{ fontSize: 48, color: adminStats && adminStats.needAttention.length > 0 ? 'var(--warn)' : 'var(--text)' }}
                >
                  {adminStats ? adminStats.needAttention.length : '…'}
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
              {!adminStats ? (
                <div className="skeleton" style={{ height: 64, borderRadius: 14 }} />
              ) : adminStats.needAttention.length === 0 ? (
                <div style={{ padding: 20, textAlign: 'center', color: 'var(--text-dim)', fontSize: 13 }}>
                  🎉 Todos os alunos estão em dia!
                </div>
              ) : (
                <div className="col gap-2">
                  {adminStats.needAttention.map((s) => (
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
        .forja-admin-stats {
          display: grid;
          grid-template-columns: repeat(3, 1fr);
          gap: 14px;
        }
        @media (max-width: 768px) {
          .forja-admin-stats { grid-template-columns: 1fr; }
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
