import { useEffect } from 'react'
import { Link, useLocation } from 'react-router-dom'
import { motion, AnimatePresence } from 'motion/react'
import { useAuth } from '../../context/AuthContext'
import { Icon } from '../ui/Icon'
import { ThemeSwitcher } from '../ui/ThemeSwitcher'
import { ModeToggle } from '../ui/ModeToggle'
import { navDestinations, isNavActive } from '../../lib/navigation'

interface MobileMoreSheetProps {
  isOpen: boolean
  onClose: () => void
}

export function MobileMoreSheet({ isOpen, onClose }: MobileMoreSheetProps) {
  const { isManager, isSuperAdmin, trainerMode, signOut } = useAuth()
  const { pathname } = useLocation()

  const inTrainingMode = isManager && trainerMode === 'treino'
  const secondary = navDestinations({ isManager, isSuperAdmin, inTrainingMode })
    .filter((d) => !d.primary)

  // Fechar com Escape
  useEffect(() => {
    if (!isOpen) return
    function onKey(e: KeyboardEvent) {
      if (e.key === 'Escape') onClose()
    }
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  }, [isOpen, onClose])

  return (
    <AnimatePresence>
      {isOpen && (
        <>
          {/* Overlay */}
          <motion.div
            key="more-overlay"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={onClose}
            style={{
              position: 'fixed', inset: 0, zIndex: 60,
              background: 'rgba(0,0,0,0.7)', backdropFilter: 'blur(4px)',
            }}
          />

          {/* Gaveta */}
          <motion.div
            key="more-sheet"
            role="dialog"
            aria-modal="true"
            aria-label="Mais opções"
            initial={{ y: '100%' }}
            animate={{ y: 0 }}
            exit={{ y: '100%' }}
            transition={{ type: 'spring', damping: 30, stiffness: 300 }}
            style={{
              position: 'fixed', bottom: 0, left: 0, right: 0, zIndex: 61,
              background: 'var(--bg-1)',
              borderTop: '2px solid var(--accent)',
              borderRadius: '16px 16px 0 0',
              maxHeight: '85vh', overflowY: 'auto',
              padding: '20px 16px calc(28px + env(safe-area-inset-bottom))',
            }}
          >
            {/* Alça visual */}
            <div style={{ width: 40, height: 4, background: 'var(--border)', borderRadius: 99, margin: '0 auto 16px' }} />

            {/* Header */}
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16 }}>
              <div className="f-display" style={{ fontSize: 24, color: 'var(--text)' }}>MAIS</div>
              <button
                onClick={onClose}
                style={{ background: 'transparent', border: 'none', cursor: 'pointer', color: 'var(--text-faint)', padding: 4, lineHeight: 0 }}
                aria-label="Fechar"
              >
                <Icon name="x" size={18} />
              </button>
            </div>

            {/* Alternador de modo (só manager) */}
            {isManager && (
              <div style={{ marginBottom: 16 }}>
                <ModeToggle />
              </div>
            )}

            {/* Destinos secundários */}
            <div style={{ display: 'flex', flexDirection: 'column', gap: 4 }}>
              {secondary.map((dest) => {
                const active = isNavActive(dest, pathname)
                return (
                  <Link
                    key={dest.to}
                    to={dest.to}
                    onClick={onClose}
                    style={{
                      display: 'flex', alignItems: 'center', gap: 12,
                      padding: '12px 14px', borderRadius: 'var(--r-2)',
                      textDecoration: 'none',
                      background: active ? 'var(--accent)' : 'var(--bg-2)',
                      color: active ? 'var(--accent-fg)' : 'var(--text)',
                      fontWeight: active ? 700 : 500, fontSize: 15,
                    }}
                  >
                    <Icon name={dest.icon} size={20} />
                    {dest.label}
                  </Link>
                )
              })}
            </div>

            <hr style={{ margin: '16px 0', border: 'none', borderTop: '1px solid var(--hairline)' }} />

            {/* Tema */}
            <ThemeSwitcher />

            {/* Sair */}
            <button
              type="button"
              onClick={() => { onClose(); void signOut() }}
              className="btn danger"
              style={{ width: '100%', justifyContent: 'center', marginTop: 12 }}
            >
              <Icon name="logout" size={16} /> Sair
            </button>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  )
}
