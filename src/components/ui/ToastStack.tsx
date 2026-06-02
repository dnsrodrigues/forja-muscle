import { AnimatePresence, motion } from 'motion/react'
import { useToast, type Toast, type ToastType } from '../../context/ToastContext'

const ACCENT: Record<ToastType, string> = {
  success: 'var(--accent)',
  error:   'var(--danger)',
  warning: 'var(--warn)',
  info:    'var(--info)',
}

const ICON: Record<ToastType, string> = {
  success: '✓',
  error:   '✕',
  warning: '⚠',
  info:    'ℹ',
}

function ToastItem({ toast, onDismiss }: { toast: Toast; onDismiss: () => void }) {
  const accent = ACCENT[toast.type]

  return (
    <motion.div
      layout
      initial={{ opacity: 0, y: 24, scale: 0.95 }}
      animate={{ opacity: 1, y: 0, scale: 1 }}
      exit={{ opacity: 0, y: 12, scale: 0.95 }}
      transition={{ type: 'spring', stiffness: 400, damping: 30 }}
      onClick={onDismiss}
      style={{
        display: 'flex',
        alignItems: 'center',
        gap: 12,
        padding: '12px 16px',
        background: 'var(--bg-2)',
        border: '1px solid var(--border)',
        borderLeft: `3px solid ${accent}`,
        borderRadius: 'var(--r-2)',
        cursor: 'pointer',
        minWidth: 260,
        maxWidth: 'calc(100vw - 32px)',
        boxShadow: '0 8px 32px rgba(0,0,0,0.4)',
      }}
    >
      <span
        style={{
          width: 22,
          height: 22,
          borderRadius: '50%',
          background: accent,
          color: toast.type === 'success' ? 'var(--accent-fg)' : '#fff',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          fontSize: 11,
          fontWeight: 700,
          flexShrink: 0,
          fontFamily: 'var(--f-body)',
        }}
      >
        {ICON[toast.type]}
      </span>
      <span style={{ fontSize: 13, color: 'var(--text)', fontFamily: 'var(--f-body)', lineHeight: 1.4 }}>
        {toast.message}
      </span>
    </motion.div>
  )
}

export function ToastStack() {
  const { toasts, dismiss } = useToast()

  return (
    <div
      style={{
        position: 'fixed',
        bottom: 80,
        left: '50%',
        transform: 'translateX(-50%)',
        zIndex: 9999,
        display: 'flex',
        flexDirection: 'column',
        gap: 8,
        alignItems: 'center',
        pointerEvents: 'none',
      }}
    >
      <AnimatePresence mode="popLayout">
        {toasts.map((t) => (
          <div key={t.id} style={{ pointerEvents: 'auto' }}>
            <ToastItem toast={t} onDismiss={() => dismiss(t.id)} />
          </div>
        ))}
      </AnimatePresence>
    </div>
  )
}
