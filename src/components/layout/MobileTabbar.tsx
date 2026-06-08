import { useState } from 'react'
import { Link, useLocation, useNavigate } from 'react-router-dom'
import { useAuth } from '../../context/AuthContext'
import { Icon } from '../ui/Icon'
import { MobileMoreSheet } from './MobileMoreSheet'
import { mobileNavDestinations, navDestinations, isNavActive } from '../../lib/navigation'
import { getMyWorkouts } from '../../services/workout.service'
import type { WeekDay } from '../../types'

/**
 * Tabbar fixa no rodapé. Aparece SOMENTE no mobile (≤768px) via CSS.
 *
 * - Aluno / trainer em modo treino: 5 colunas (2 tabs | FAB | 2 tabs)
 * - Admin em modo gestão: layout antigo (tabs primárias + botão Mais)
 */
export function MobileTabbar() {
  const { profile, isManager, isSuperAdmin, trainerMode } = useAuth()
  const { pathname } = useLocation()
  const navigate = useNavigate()
  const [moreOpen, setMoreOpen] = useState(false)

  const inTrainingMode = isManager && trainerMode === 'treino'
  const isAdminMode = isManager && trainerMode !== 'treino'

  const ctx = { isManager, isSuperAdmin, inTrainingMode }
  const mobileDests = mobileNavDestinations(ctx)
  const adminDests = navDestinations(ctx)

  // ── Admin mode: layout original (tabs primárias + "Mais") ──────────────────
  if (isAdminMode) {
    const primary = adminDests.filter((d) => d.primary)
    const secondary = adminDests.filter((d) => !d.primary)
    const moreActive = secondary.some((d) => isNavActive(d, pathname))

    return (
      <>
        <nav className="mob-tabbar" style={{ display: 'none' }} data-mobile-tabbar>
          {primary.map((t) => (
            <Link
              key={t.to}
              to={t.to}
              className={'mob-tab' + (isNavActive(t, pathname) ? ' active' : '')}
            >
              <Icon name={t.icon} size={22} />
              {t.label}
            </Link>
          ))}
          <button
            type="button"
            onClick={() => setMoreOpen(true)}
            className={'mob-tab' + (moreActive ? ' active' : '')}
          >
            <Icon name="more" size={22} />
            Mais
          </button>
        </nav>
        <MobileMoreSheet isOpen={moreOpen} onClose={() => setMoreOpen(false)} />
      </>
    )
  }

  // ── Aluno mode: 5 colunas com FAB central ─────────────────────────────────
  // mobileDests tem 4 items: [Hoje, Semana, Exercícios, Perfil]
  // O FAB fica entre Semana (index 1) e Exercícios (index 2)
  const left = mobileDests.slice(0, 2)   // Hoje, Semana
  const right = mobileDests.slice(2)     // Exercícios, Perfil

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
      {left.map((t) => (
        <Link
          key={t.to}
          to={t.to}
          className={'mob-tab' + (isNavActive(t, pathname) ? ' active' : '')}
        >
          <Icon name={t.icon} size={22} />
          {t.label}
        </Link>
      ))}

      <button
        type="button"
        className="mob-tab-fab"
        onClick={() => void handleFAB()}
        aria-label="Iniciar treino de hoje"
      >
        <Icon name="play" size={24} />
      </button>

      {right.map((t) => (
        <Link
          key={t.to}
          to={t.to}
          className={'mob-tab' + (isNavActive(t, pathname) ? ' active' : '')}
        >
          <Icon name={t.icon} size={22} />
          {t.label}
        </Link>
      ))}
    </nav>
  )
}
