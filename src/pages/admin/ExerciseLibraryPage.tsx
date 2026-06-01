import { useEffect, useState } from 'react'
import { motion } from 'motion/react'
import { getExercises } from '../../services/workout.service'
import { Topbar } from '../../components/layout/Topbar'
import { Icon } from '../../components/ui/Icon'
import { ExerciseFormModal } from '../../components/admin/ExerciseFormModal'
import { MUSCLE_GROUP_LABELS } from '../../types'
import type { Exercise, MuscleGroup } from '../../types'

const GROUPS = Object.entries(MUSCLE_GROUP_LABELS) as [MuscleGroup, string][]

export function ExerciseLibraryPage() {
  const [exercises, setExercises] = useState<Exercise[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [search, setSearch] = useState('')
  const [groupFilter, setGroupFilter] = useState<MuscleGroup | 'all'>('all')
  const [modalOpen, setModalOpen] = useState(false)
  const [editing, setEditing] = useState<Exercise | null>(null)

  async function load() {
    setLoading(true)
    setError(null)
    try {
      setExercises(await getExercises())
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Erro ao carregar exercícios')
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => { void load() }, [])

  const filtered = exercises.filter((ex) => {
    const matchGroup = groupFilter === 'all' || ex.muscle_group === groupFilter
    const matchSearch = !search.trim() || ex.name.toLowerCase().includes(search.toLowerCase())
    return matchGroup && matchSearch
  })

  // Agrupa por grupo muscular
  const grouped = GROUPS
    .map(([group, label]) => ({ group, label, items: filtered.filter((ex) => ex.muscle_group === group) }))
    .filter((g) => g.items.length > 0)

  function openNew() { setEditing(null); setModalOpen(true) }
  function openEdit(ex: Exercise) { setEditing(ex); setModalOpen(true) }

  return (
    <>
      <Topbar
        eyebrow="CATÁLOGO"
        title="EXERCÍCIOS"
        actions={
          <button onClick={openNew} className="btn primary">
            <Icon name="plus" size={14} /> Novo exercício
          </button>
        }
      />

      <div className="content">
        {/* Busca */}
        <input
          className="input"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          placeholder="Buscar exercício pelo nome..."
          style={{ marginBottom: 12 }}
        />

        {/* Filtro por grupo (chips) */}
        <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap', marginBottom: 20 }}>
          <button
            onClick={() => setGroupFilter('all')}
            className={'chip' + (groupFilter === 'all' ? ' solid' : '')}
            style={{ cursor: 'pointer' }}
          >
            Todos
          </button>
          {GROUPS.map(([value, label]) => (
            <button
              key={value}
              onClick={() => setGroupFilter(value)}
              className={'chip' + (groupFilter === value ? ' solid' : '')}
              style={{ cursor: 'pointer' }}
            >
              {label}
            </button>
          ))}
        </div>

        {loading && (
          <div className="col gap-2">
            {[1, 2, 3, 4].map((i) => (
              <div key={i} className="skeleton" style={{ height: 56, borderRadius: 8 }} />
            ))}
          </div>
        )}

        {!loading && error && (
          <div className="card" style={{ borderLeft: '2px solid var(--danger)', background: 'rgba(255,61,85,0.05)' }}>
            <div style={{ color: 'var(--danger)', marginBottom: 8 }}>⚠ {error}</div>
            <button onClick={load} className="btn ghost">Tentar novamente</button>
          </div>
        )}

        {!loading && !error && filtered.length === 0 && (
          <div className="card" style={{ textAlign: 'center', padding: '32px 24px', borderStyle: 'dashed', color: 'var(--text-dim)' }}>
            Nenhum exercício encontrado.
          </div>
        )}

        {!loading && !error && grouped.map(({ group, label, items }) => (
          <motion.div
            key={group}
            initial={{ opacity: 0, y: 8 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.25 }}
            style={{ marginBottom: 24 }}
          >
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 10 }}>
              <h2 className="card-title">{label.toUpperCase()}</h2>
              <span className="chip">{items.length}</span>
            </div>
            <div className="col gap-2">
              {items.map((ex) => (
                <div
                  key={ex.id}
                  className="card"
                  style={{ padding: '12px 16px', display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 12 }}
                >
                  <div style={{ minWidth: 0 }}>
                    <div style={{ fontWeight: 600, fontSize: 14, color: 'var(--text)' }}>{ex.name}</div>
                    {ex.description && (
                      <div style={{ fontSize: 12, color: 'var(--text-dim)', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                        {ex.description}
                      </div>
                    )}
                  </div>
                  <button onClick={() => openEdit(ex)} className="btn ghost" style={{ fontSize: 11, padding: '6px 12px', flexShrink: 0 }}>
                    <Icon name="edit" size={12} /> Editar
                  </button>
                </div>
              ))}
            </div>
          </motion.div>
        ))}
      </div>

      <ExerciseFormModal
        key={editing?.id ?? 'new'}
        exercise={editing}
        isOpen={modalOpen}
        onClose={() => setModalOpen(false)}
        onSaved={load}
      />
    </>
  )
}
