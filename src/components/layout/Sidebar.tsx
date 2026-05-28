import { Link, useLocation } from 'react-router-dom'
import { useAuth } from '../../context/AuthContext'
import { Icon, type IconName } from '../ui/Icon'
import { ThemeSwitcher } from '../ui/ThemeSwitcher'
import { ModeToggle } from '../ui/ModeToggle'

interface NavLink {
  to: string
  label: string
  icon: IconName
  matches?: (path: string) => boolean
}

function alunoLinks(): NavLink[] {
  return [
    { to: '/dashboard', label: 'Hoje', icon: 'home' },
    { to: '/workouts', label: 'Treino', icon: 'flame', matches: (p) => p.startsWith('/workouts') },
    { to: '/historico', label: 'Histórico', icon: 'history', matches: (p) => p.startsWith('/historico') },
    { to: '/progresso', label: 'Progresso', icon: 'chart' },
    { to: '/medidas', label: 'Medidas', icon: 'scale' },
  ]
}

function gestaoLinks(isSuperAdmin: boolean): NavLink[] {
  const links: NavLink[] = [
    { to: '/dashboard', label: 'Hoje', icon: 'home' },
    { to: '/admin/workouts', label: 'Fichas', icon: 'edit', matches: (p) => p.startsWith('/admin/workouts') },
  ]
  if (isSuperAdmin) {
    links.push({
      to: '/admin/trainers',
      label: 'Trainers',
      icon: 'user',
      matches: (p) => p.startsWith('/admin/trainers'),
    })
  }
  return links
}

export function Sidebar() {
  const { profile, isManager, isSuperAdmin, trainerMode, signOut } = useAuth()
  const { pathname } = useLocation()

  const inTrainingMode = isManager && trainerMode === 'treino'
  const links = (!isManager || inTrainingMode) ? alunoLinks() : gestaoLinks(isSuperAdmin)

  const isActive = (link: NavLink) =>
    link.matches ? link.matches(pathname) : pathname === link.to

  const initial = (profile?.full_name ?? 'A').charAt(0).toUpperCase()
  const firstName = profile?.full_name?.split(' ')[0] ?? 'Atleta'

  const roleLabel = profile?.role === 'super_admin'
    ? 'Super Admin'
    : profile?.role === 'trainer'
    ? 'Personal Trainer'
    : 'Aluno'

  return (
    <aside className="nav">
      <Link to="/dashboard" className="nav-brand" style={{ textDecoration: 'none' }}>
        FORJA<span className="nav-brand-dot">.</span>
      </Link>

      {isManager && (
        <div style={{ padding: '8px 12px 4px' }}>
          <ModeToggle />
        </div>
      )}

      <div className="nav-section">
        {inTrainingMode ? 'Meu Treino' : isManager ? 'Gestão' : 'Treino'}
      </div>

      {links.map((link) => (
        <Link
          key={link.to}
          to={link.to}
          className={'nav-item' + (isActive(link) ? ' active' : '')}
        >
          <span className="nav-ico"><Icon name={link.icon} size={18} /></span>
          {link.label}
        </Link>
      ))}

      <div className="nav-section">Conta</div>
      <Link
        to="/perfil"
        className={'nav-item' + (pathname === '/perfil' ? ' active' : '')}
      >
        <span className="nav-ico"><Icon name="user" size={18} /></span>
        Perfil
      </Link>
      <button
        type="button"
        onClick={() => void signOut()}
        className="nav-item"
        style={{ background: 'transparent', border: 'none', textAlign: 'left', width: '100%', cursor: 'pointer' }}
      >
        <span className="nav-ico"><Icon name="logout" size={18} /></span>
        Sair
      </button>

      <ThemeSwitcher />

      <div className="nav-user">
        <div className="nav-avatar">{initial}</div>
        <div style={{ display: 'flex', flexDirection: 'column', fontSize: 12, minWidth: 0 }}>
          <span style={{ fontWeight: 600, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
            {firstName}
          </span>
          <span style={{ color: 'var(--text-faint)' }}>{roleLabel}</span>
        </div>
      </div>
    </aside>
  )
}
