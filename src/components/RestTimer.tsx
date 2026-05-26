import { motion, AnimatePresence } from 'motion/react'
import { Pause, Play, SkipForward } from 'lucide-react'

interface RestTimerProps {
  seconds: number
  isRunning: boolean
  onPause: () => void
  onResume: () => void
  onSkip: () => void
}

function formatTime(s: number): string {
  const m = Math.floor(s / 60)
  const sec = s % 60
  return `${String(m).padStart(2, '0')}:${String(sec).padStart(2, '0')}`
}

export function RestTimer({ seconds, isRunning, onPause, onResume, onSkip }: RestTimerProps) {
  const isDone = seconds === 0
  const isVisible = isRunning || seconds > 0

  return (
    <AnimatePresence>
      {isVisible && (
        <motion.div
          initial={{ y: -48, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          exit={{ y: -48, opacity: 0 }}
          transition={{ type: 'spring', stiffness: 400, damping: 30 }}
          style={{
            background: isDone
              ? 'rgba(108, 142, 247,0.15)'
              : 'rgba(108, 142, 247,0.07)',
            borderBottom: `1px solid ${isDone ? 'rgba(108, 142, 247,0.4)' : 'rgba(108, 142, 247,0.18)'}`,
            padding: '8px 16px',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            gap: 12,
          }}
        >
          {/* Label + countdown */}
          <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
            <div>
              <div style={{
                fontFamily: "'JetBrains Mono', monospace",
                fontSize: 8,
                color: 'var(--accent)',
                letterSpacing: '0.15em',
                textTransform: 'uppercase',
                lineHeight: 1,
                marginBottom: 2,
              }}>
                {isDone ? '// pronto!' : '// descansando'}
              </div>
              <motion.div
                key={seconds}
                initial={{ scale: isDone ? 1.1 : 1 }}
                animate={{ scale: 1 }}
                transition={{ duration: 0.1 }}
                style={{
                  fontFamily: "'Outfit', sans-serif",
                  fontWeight: 800,
                  fontSize: 24,
                  color: 'var(--accent)',
                  lineHeight: 1,
                  letterSpacing: '-0.02em',
                }}
              >
                {isDone ? 'Próxima série!' : formatTime(seconds)}
              </motion.div>
            </div>
          </div>

          {/* Controles */}
          {!isDone && (
            <div style={{ display: 'flex', gap: 6 }}>
              {/* Pausar / Retomar */}
              <button
                onClick={isRunning ? onPause : onResume}
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: 5,
                  background: 'rgba(240,237,230,0.06)',
                  border: '1px solid var(--border-md)',
                  borderRadius: 4,
                  padding: '5px 10px',
                  color: 'var(--fg-2)',
                  fontFamily: "'JetBrains Mono', monospace",
                  fontSize: 9,
                  letterSpacing: '0.08em',
                  textTransform: 'uppercase',
                  cursor: 'pointer',
                }}
              >
                {isRunning
                  ? <><Pause size={10} /> Pausar</>
                  : <><Play size={10} /> Retomar</>
                }
              </button>

              {/* Pular */}
              <button
                onClick={onSkip}
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: 5,
                  background: 'rgba(240,237,230,0.06)',
                  border: '1px solid var(--border-md)',
                  borderRadius: 4,
                  padding: '5px 10px',
                  color: 'var(--fg-2)',
                  fontFamily: "'JetBrains Mono', monospace",
                  fontSize: 9,
                  letterSpacing: '0.08em',
                  textTransform: 'uppercase',
                  cursor: 'pointer',
                }}
              >
                <SkipForward size={10} /> Pular
              </button>
            </div>
          )}

          {/* Quando termina: apenas botão de fechar */}
          {isDone && (
            <button
              onClick={onSkip}
              style={{
                background: 'var(--accent)',
                border: 'none',
                borderRadius: 4,
                padding: '6px 14px',
                color: '#05050a',
                fontFamily: "'Outfit', sans-serif",
                fontWeight: 800,
                fontSize: 10,
                letterSpacing: '0.06em',
                textTransform: 'uppercase',
                cursor: 'pointer',
              }}
            >
              Continuar →
            </button>
          )}
        </motion.div>
      )}
    </AnimatePresence>
  )
}
