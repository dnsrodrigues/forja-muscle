import { useState } from 'react'
import { Link, useLocation } from 'react-router-dom'
import { useAuth } from '../../context/AuthContext'
import { Icon } from '../ui/Icon'
import { MobileMoreSheet } from './MobileMoreSheet'
import { navDestinations, isNavActive } from '../../lib/navigation'

/**
 * Tabbar fixa no rodapé. Aparece SOMENTE no mobile (≤768px) via CSS.
 * Mostra os destinos principais + botão "Mais" (abre a gaveta).
 */
export function MobileTabbar() {
  const { isManager, isSuperAdmin, trainerMode } = useAuth()
  const { pathname } = useLocation()
  const [moreOpen, setMoreOpen] = useState(false)

  const inTrainingMode = isManager && trainerMode === 'treino'
  const dests = navDestinations({ isManager, isSuperAdmin, inTrainingMode })
  const primary = dests.filter((d) => d.primary)
  const secondary = dests.filter((d) => !d.primary)

  // "Mais" fica aceso quando a rota atual é um destino secundário
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
