import { Link, useLocation } from 'react-router-dom'
import { useAuth } from '../../context/AuthContext'
import { Icon } from '../ui/Icon'
import { ThemeSwitcher } from '../ui/ThemeSwitcher'
import { ModeToggle } from '../ui/ModeToggle'
import { navDestinations, isNavActive } from '../../lib/navigation'

export function Sidebar() {
  const { profile, isManager, isSuperAdmin, trainerMode, signOut } = useAuth()
  const { pathname } = useLocation()

  const inTrainingMode = isManager && trainerMode === 'treino'
  const dests = navDestinations({ isManager, isSuperAdmin, inTrainingMode })

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

      {dests.map((dest) => (
        <Link
          key={dest.to}
          to={dest.to}
          className={'nav-item' + (isNavActive(dest, pathname) ? ' active' : '')}
        >
          <span className="nav-ico"><Icon name={dest.icon} size={18} /></span>
          {dest.label}
        </Link>
      ))}

      <div className="nav-section">Conta</div>
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
