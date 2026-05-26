import { useTheme } from '../../context/ThemeContext'
import { motion, AnimatePresence } from 'motion/react'

interface ThemeSwitcherProps {
  className?: string
}

export function ThemeSwitcher({ className = '' }: ThemeSwitcherProps) {
  const { mode, toggleMode } = useTheme()
  const isDark = mode === 'dark'

  return (
    <button
      type="button"
      onClick={toggleMode}
      title={isDark ? 'Mudar para modo claro' : 'Mudar para modo escuro'}
      aria-label={isDark ? 'Ativar modo claro' : 'Ativar modo escuro'}
      className={`relative flex items-center gap-2 cursor-pointer transition-all duration-150 ${className}`}
      style={{
        height: 28,
        padding: '0 10px',
        background: 'var(--surface)',
        border: '1px solid var(--border-md)',
        borderRadius: '4px',
        fontFamily: "'JetBrains Mono', monospace",
        fontSize: 10,
        letterSpacing: '0.12em',
        textTransform: 'uppercase',
        color: 'var(--fg-2)',
        outline: 'none',
        minWidth: 76,
        justifyContent: 'center',
      }}
      onMouseEnter={(e) => {
        e.currentTarget.style.borderColor = 'var(--border-strong)'
        e.currentTarget.style.color = 'var(--fg)'
      }}
      onMouseLeave={(e) => {
        e.currentTarget.style.borderColor = 'var(--border-md)'
        e.currentTarget.style.color = 'var(--fg-2)'
      }}
    >
      <AnimatePresence mode="wait" initial={false}>
        <motion.span
          key={mode}
          initial={{ opacity: 0, y: -6 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: 6 }}
          transition={{ duration: 0.15, ease: 'easeInOut' }}
          style={{ display: 'flex', alignItems: 'center', gap: 6 }}
        >
          {/* Ícone */}
          <span style={{
            fontSize: 11,
            color: 'var(--accent)',
            lineHeight: 1,
          }}>
            {isDark ? '◑' : '○'}
          </span>

          {/* Label */}
          <span>{isDark ? 'Escuro' : 'Claro'}</span>
        </motion.span>
      </AnimatePresence>
    </button>
  )
}
