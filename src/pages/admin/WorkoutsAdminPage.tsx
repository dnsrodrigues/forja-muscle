import { useState, useEffect } from 'react'
import { useNavigate, Link } from 'react-router-dom'
import { motion } from 'motion/react'
import { ArrowLeft, Plus, RefreshCw } from 'lucide-react'
import { getTemplates, getWorkoutUsageCount, deactivateWorkout } from '../../services/workout.service'
import { WorkoutCard } from '../../components/WorkoutCard'
import { AssignWorkoutModal } from '../../components/AssignWorkoutModal'
import type { Workout } from '../../types'

export function WorkoutsAdminPage() {
  const navigate = useNavigate()
  const [workouts, setWorkouts] = useState<Workout[]>([])
  const [usageCounts, setUsageCounts] = useState<Record<string, number>>({})
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [assignTarget, setAssignTarget] = useState<Workout | null>(null)

  async function load() {
    setLoading(true)
    setError(null)
    try {
      const data = await getTemplates()
      setWorkouts(data)

      // Carrega contagem de uso em paralelo
      const counts = await Promise.all(
        data.map(async (w) => ({ id: w.id, count: await getWorkoutUsageCount(w.id) }))
      )
      const countMap: Record<string, number> = {}
      counts.forEach(({ id, count }) => { countMap[id] = count })
      setUsageCounts(countMap)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Erro ao carregar fichas')
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => { load() }, [])

  // Disponível para uso futuro via botão dedicado na página
  async function handleDeactivate(workoutId: string) {
    if (!confirm('Desativar esta ficha? Alunos que a têm atribuída continuarão vendo-a.')) return
    try {
      await deactivateWorkout(workoutId)
      setWorkouts((prev) => prev.filter((w) => w.id !== workoutId))
    } catch {
      alert('Erro ao desativar ficha.')
    }
  }
  void handleDeactivate // suprime warning — será usado na Fase 9

  return (
    <div className="min-h-screen" style={{ background: 'var(--bg)' }}>

      {/* Grid lines decorativo */}
      <div className="fixed inset-0 pointer-events-none z-0"
        style={{ display: 'grid', gridTemplateColumns: 'repeat(12, 1fr)' }}>
        {Array.from({ length: 12 }).map((_, i) => (
          <span key={i} style={{ borderRight: '1px solid var(--border)' }} />
        ))}
      </div>

      {/* Header */}
      <header
        className="sticky top-0 z-20"
        style={{
          padding: '14px 16px',
          background: 'rgba(5,5,10,0.7)',
          borderBottom: '1px solid var(--border)',
          backdropFilter: 'blur(12px)',
        }}
      >
        <div className="max-w-xl mx-auto flex items-center justify-between gap-3">
          <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
            <Link
              to="/dashboard"
              style={{ color: 'var(--fg-3)', opacity: 0.5, display: 'flex', alignItems: 'center' }}
            >
              <ArrowLeft size={16} />
            </Link>
            <div>
              <div style={{
                fontFamily: "'DM Mono', monospace",
                fontSize: 9,
                color: 'var(--fg-3)',
                letterSpacing: '0.15em',
                textTransform: 'uppercase',
                marginBottom: 1,
              }}>
                // admin
              </div>
              <div style={{
                fontFamily: "'Syne', sans-serif",
                fontWeight: 800,
                fontSize: 16,
                color: 'var(--fg)',
              }}>
                Biblioteca de Fichas
              </div>
            </div>
          </div>

          {/* Botão nova ficha */}
          <button
            onClick={() => navigate('/admin/workouts/new')}
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: 5,
              background: 'var(--accent)',
              border: 'none',
              borderRadius: 4,
              padding: '8px 14px',
              color: 'var(--bg)',
              fontFamily: "'Syne', sans-serif",
              fontWeight: 800,
              fontSize: 10,
              letterSpacing: '0.15em',
              textTransform: 'uppercase',
              cursor: 'pointer',
            }}
          >
            <Plus size={12} />
            Nova Ficha
          </button>
        </div>
      </header>

      {/* Conteúdo */}
      <main className="relative z-10">
        <div className="max-w-xl mx-auto" style={{ padding: '20px 16px 40px' }}>

          {/* Loading */}
          {loading && (
            <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
              {[1, 2, 3].map((i) => (
                <div key={i} className="skeleton" style={{ height: 96, borderRadius: 4 }} />
              ))}
            </div>
          )}

          {/* Erro */}
          {!loading && error && (
            <div style={{
              borderLeft: '2px solid var(--danger)',
              background: 'rgba(239,68,68,0.05)',
              borderRadius: '0 4px 4px 0',
              padding: '12px 16px',
              marginBottom: 16,
            }}>
              <div style={{ fontFamily: "'DM Mono', monospace", fontSize: 11, color: 'var(--danger)', marginBottom: 6 }}>
                ⚠ {error}
              </div>
              <button
                onClick={load}
                style={{
                  display: 'flex', alignItems: 'center', gap: 5,
                  background: 'transparent', border: '1px solid var(--border-md)',
                  borderRadius: 4, padding: '5px 12px', color: 'var(--fg-2)',
                  fontFamily: "'DM Mono', monospace", fontSize: 10,
                  letterSpacing: '0.1em', cursor: 'pointer', textTransform: 'uppercase',
                }}
              >
                <RefreshCw size={10} /> Tentar novamente
              </button>
            </div>
          )}

          {/* Sem fichas */}
          {!loading && !error && workouts.length === 0 && (
            <div style={{
              border: '1px dashed var(--border)',
              borderRadius: 4,
              padding: '32px 24px',
              textAlign: 'center',
            }}>
              <div style={{ fontSize: 28, marginBottom: 10 }}>📋</div>
              <div style={{ fontFamily: "'Syne', sans-serif", fontWeight: 800, fontSize: 14, color: 'var(--fg)', marginBottom: 8 }}>
                Nenhuma ficha criada ainda
              </div>
              <button
                onClick={() => navigate('/admin/workouts/new')}
                style={{
                  display: 'inline-flex', alignItems: 'center', gap: 6,
                  background: 'var(--accent)', border: 'none', borderRadius: 4,
                  padding: '9px 18px', color: 'var(--bg)',
                  fontFamily: "'Syne', sans-serif", fontWeight: 800,
                  fontSize: 10, letterSpacing: '0.15em', textTransform: 'uppercase', cursor: 'pointer',
                }}
              >
                <Plus size={12} /> Criar primeira ficha
              </button>
            </div>
          )}

          {/* Lista de fichas */}
          {!loading && !error && workouts.length > 0 && (
            <motion.div
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.3 }}
            >
              <div style={{
                fontFamily: "'DM Mono', monospace",
                fontSize: 9,
                color: 'var(--fg-3)',
                letterSpacing: '0.15em',
                textTransform: 'uppercase',
                marginBottom: 10,
              }}>
                // {workouts.length} ficha{workouts.length !== 1 ? 's' : ''} na biblioteca
              </div>
              <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
                {workouts.map((workout) => (
                  <WorkoutCard
                    key={workout.id}
                    workout={workout}
                    usageCount={usageCounts[workout.id] ?? 0}
                    onClick={() => navigate(`/admin/workouts/${workout.id}/edit`)}
                    onEdit={() => navigate(`/admin/workouts/${workout.id}/edit`)}
                    onAssign={() => setAssignTarget(workout)}
                  />
                ))}
              </div>
            </motion.div>
          )}

        </div>
      </main>

      {/* Modal de atribuição */}
      {assignTarget && (
        <AssignWorkoutModal
          workout={assignTarget}
          onClose={() => setAssignTarget(null)}
          onAssigned={() => {
            setAssignTarget(null)
            load()
          }}
        />
      )}
    </div>
  )
}
