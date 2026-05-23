import { useNavigate } from 'react-router-dom'
import { Button } from '../components/ui/Button'

export function NotFoundPage() {
  const navigate = useNavigate()

  return (
    <div className="min-h-screen bg-[#0f0f0f] flex items-center justify-center p-4">
      <div className="text-center max-w-sm">
        <div className="text-8xl mb-4">🏋️</div>
        <h1 className="text-4xl font-bold text-white mb-2">404</h1>
        <p className="text-gray-400 mb-6">
          Essa página não existe. Parece que você levantou peso demais e saiu da rota!
        </p>
        <Button onClick={() => navigate('/dashboard')}>
          Voltar para o início
        </Button>
      </div>
    </div>
  )
}
