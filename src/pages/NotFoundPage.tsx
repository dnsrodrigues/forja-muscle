import { useNavigate } from 'react-router-dom'
import { motion } from 'motion/react'
import { Button } from '../components/ui/Button'

export function NotFoundPage() {
  const navigate = useNavigate()

  return (
    <div className="min-h-screen flex items-center justify-center p-4">
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.6, ease: [0.22, 1, 0.36, 1] }}
        className="text-center max-w-sm"
      >
        {/* Número 404 grande com fonte display */}
        <div
          className="font-display font-bold leading-none mb-3"
          style={{
            fontSize: 'clamp(6rem, 20vw, 10rem)',
            background: 'linear-gradient(135deg, var(--ink), var(--accent-two) 40%, var(--accent))',
            WebkitBackgroundClip: 'text',
            backgroundClip: 'text',
            color: 'transparent',
            letterSpacing: '-0.05em',
          }}
        >
          404
        </div>

        <p
          className="text-xs font-semibold tracking-[0.22em] uppercase mb-4"
          style={{ color: 'var(--accent)' }}
        >
          Página não encontrada
        </p>

        <p
          className="text-sm font-light leading-relaxed mb-8"
          style={{ color: 'var(--muted)' }}
        >
          Parece que você levantou peso demais e saiu da rota. Essa página não existe.
        </p>

        <Button onClick={() => navigate('/dashboard')}>
          Voltar para o início
        </Button>
      </motion.div>
    </div>
  )
}
