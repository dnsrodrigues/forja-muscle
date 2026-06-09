import { Link, useLocation, useNavigate } from 'react-router-dom'
import { useAuth } from '../../context/AuthContext'
import { Icon } from '../ui/Icon'
import { mobileNavDestinations, isNavActive } from '../../lib/navigation'
import type { NavDest } from '../../lib/navigation'
import { getMyWorkouts } from '../../services/workout.service'
import type { WeekDay } from '../../types'

/**
 * Tabbar fixa no rodapé. Aparece SOMENTE no mobile (≤768px) via CSS.
 *
 * O mobile é SEMPRE "meu treino": 5 colunas (2 tabs | FAB | 2 tabs).
 * As funções de gestão (Fichas, Alunos, etc.) ficam na lista dentro do Perfil.
 *
 * A aba Perfil usa o avatar do usuário como ícone, diferenciando-a
 * visualmente das demais.
 */
export function MobileTabbar() {
  const { profile } = useAuth()
  const { pathname } = useLocation()
  const navigate = useNavigate()

  const mobileDests = mobileNavDestinations()

  // Conteúdo do ícone do tab — Perfil mostra o avatar do usuário
  function tabInner(dest: NavDest, active: boolean) {
    if (dest.to === '/perfil') {
      return (
        <span
          style={{
            width: 24, height: 24, borderRadius: '50%', overflow: 'hidden',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            background: 'var(--bg-3)',
            border: active ? '2px solid var(--accent)' : '2px solid transparent',
            fontFamily: 'var(--f-display)', fontSize: 12, lineHeight: 1,
            color: active ? 'var(--accent)' : 'var(--text-dim)',
          }}
        >
          {profile?.avatar_url ? (
            <img
              src={profile.avatar_url}
              alt=""
              style={{ width: '100%', height: '100%', objectFit: 'cover' }}
            />
          ) : (
            (profile?.full_name ?? 'A').charAt(0).toUpperCase()
          )}
        </span>
      )
    }
    return <Icon name={dest.icon} size={22} />
  }

  // 5 colunas com FAB central.
  // mobileDests tem 4 items: [Hoje, Semana, Histórico, Perfil]
  // O FAB fica entre Semana (index 1) e Histórico (index 2)
  const left = mobileDests.slice(0, 2)
  const right = mobileDests.slice(2)

  async function handleFAB() {
    if (!profile?.id) return
    try {
      const workouts = await getMyWorkouts(profile.id)
      const dayIndex = new Date().getDay() // 0=dom,1=seg,...,6=sab
      const DAY_KEYS: WeekDay[] = ['sunday', 'monday', 'tuesday', 'wednesday', 'thursday', 'friday', 'saturday']
      const todayKey = DAY_KEYS[dayIndex]
      const todayWorkout = workouts.find((w) => w.week_days.includes(todayKey))
      if (todayWorkout) {
        navigate(`/workouts/${todayWorkout.id}/session`)
      } else {
        navigate('/semana')
      }
    } catch {
      navigate('/semana')
    }
  }

  return (
    <nav
      className="mob-tabbar mob-tabbar-fab"
      style={{ display: 'none' }}
      data-mobile-tabbar
    >
      {left.map((t) => {
        const active = isNavActive(t, pathname)
        return (
          <Link key={t.to} to={t.to} className={'mob-tab' + (active ? ' active' : '')}>
            {tabInner(t, active)}
            {t.label}
          </Link>
        )
      })}

      <button
        type="button"
        className="mob-tab-fab"
        onClick={() => void handleFAB()}
        aria-label="Iniciar treino de hoje"
      >
        <Icon name="play" size={24} />
      </button>

      {right.map((t) => {
        const active = isNavActive(t, pathname)
        return (
          <Link key={t.to} to={t.to} className={'mob-tab' + (active ? ' active' : '')}>
            {tabInner(t, active)}
            {t.label}
          </Link>
        )
      })}
    </nav>
  )
}
