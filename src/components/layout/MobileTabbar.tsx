import { Link, useLocation } from 'react-router-dom'
import { useAuth } from '../../context/AuthContext'
import { Icon, type IconName } from '../ui/Icon'

interface Tab {
  to: string
  label: string
  icon: IconName
  matches?: (path: string) => boolean
}

const ALUNO_TABS: Tab[] = [
  { to: '/dashboard', label: 'Hoje', icon: 'home' },
  { to: '/workouts', label: 'Treino', icon: 'flame', matches: (p) => p.startsWith('/workouts') },
  { to: '/historico', label: 'Histórico', icon: 'history', matches: (p) => p.startsWith('/historico') },
  { to: '/nutricao', label: 'Nutrição', icon: 'flash', matches: (p) => p.startsWith('/nutricao') },
  { to: '/perfil', label: 'Perfil', icon: 'user' },
]

const ADMIN_TABS: Tab[] = [
  { to: '/dashboard', label: 'Hoje', icon: 'home' },
  { to: '/admin/workouts', label: 'Fichas', icon: 'edit', matches: (p) => p.startsWith('/admin/workouts') },
  { to: '/perfil', label: 'Perfil', icon: 'user' },
]

/**
 * Tabbar fixa no rodapé. Aparece SOMENTE no mobile (≤768px) via CSS;
 * no desktop fica escondida pelo display:none herdado da regra .nav.
 */
export function MobileTabbar() {
  const { isAdmin } = useAuth()
  const { pathname } = useLocation()
  const tabs = isAdmin ? ADMIN_TABS : ALUNO_TABS

  const isActive = (t: Tab) => (t.matches ? t.matches(pathname) : pathname === t.to)

  return (
    <nav
      className="mob-tabbar"
      style={{
        // só aparece no mobile via media query
        display: 'none',
      }}
      data-mobile-tabbar
    >
      {tabs.map((t) => (
        <Link
          key={t.to}
          to={t.to}
          className={'mob-tab' + (isActive(t) ? ' active' : '')}
        >
          <Icon name={t.icon} size={22} />
          {t.label}
        </Link>
      ))}
    </nav>
  )
}
