import { useEffect, useState, useMemo } from 'react'
import { motion } from 'motion/react'
import { useAuth } from '../context/AuthContext'
import { MobHead } from '../components/layout/MobHead'
import { Icon } from '../components/ui/Icon'
import { getExercises } from '../services/workout.service'
import { getAllExercisePRs } from '../services/history.service'
import type { ExercisePR } from '../services/history.service'
import { MUSCLE_GROUP_LABELS } from '../types'
import type { Exercise, MuscleGroup } from '../types'

// ─── Filtros de grupo muscular ─────────────────────────────────────────────────

type FilterKey = MuscleGroup | 'all'

const FILTERS: { key: FilterKey; label: string }[] = [
  { key: 'all',       label: 'Todos'   },
  { key: 'chest',     label: 'Peito'   },
  { key: 'back',      label: 'Costas'  },
  { key: 'legs',      label: 'Pernas'  },
  { key: 'shoulders', label: 'Ombros'  },
  { key: 'biceps',    label: 'Bíceps'  },
  { key: 'triceps',   label: 'Tríceps' },
  { key: 'abs',       label: 'Abdômen' },
  { key: 'glutes',    label: 'Glúteos' },
]

// ─── Componente ───────────────────────────────────────────────────────────────

export function ExerciciosPage() {
  const { profile } = useAuth()

  const [exercises, setExercises] = useState<Exercise[]>([])
  const [prs, setPrs] = useState<Record<string, ExercisePR>>({})
  const [loading, setLoading] = useState(true)
  const [search, setSearch] = useState('')
  const [filter, setFilter] = useState<FilterKey>('all')

  useEffect(() => {
    if (!profile?.id) return
    setLoading(true)
    Promise.all([
      getExercises(),
      getAllExercisePRs(profile.id),
    ])
      .then(([exs, prMap]) => {
        setExercises(exs)
        setPrs(prMap)
      })
      .catch(console.error)
      .finally(() => setLoading(false))
  }, [profile?.id])

  const filtered = useMemo(() => {
    return exercises.filter((ex) => {
      const matchGroup = filter === 'all' || ex.muscle_group === filter
      const q = search.toLowerCase()
      const matchSearch = q === '' || ex.name.toLowerCase().includes(q)
      return matchGroup && matchSearch
    })
  }, [exercises, filter, search])

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      transition={{ duration: 0.2 }}
      style={{ display: 'flex', flexDirection: 'column', minHeight: '100%' }}
    >
      <MobHead
        over={loading ? '...' : `${exercises.length} exercícios`}
        title="EXERCÍCIOS"
      />

      {/* Busca + filtros */}
      <div style={{ padding: '0 16px 10px', flexShrink: 0 }}>
        <div style={{ position: 'relative' }}>
          <input
            className="input"
            placeholder="Buscar exercício..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            style={{ paddingLeft: 40 }}
          />
          <span
            style={{
              position: 'absolute',
              left: 14,
              top: '50%',
              transform: 'translateY(-50%)',
              color: 'var(--text-faint)',
              display: 'flex',
              pointerEvents: 'none',
            }}
          >
            <Icon name="search" size={16} />
          </span>
        </div>

        <div
          style={{
            display: 'flex',
            gap: 6,
            overflowX: 'auto',
            marginTop: 10,
            paddingBottom: 4,
            scrollbarWidth: 'none',
          }}
        >
          {FILTERS.map((f) => (
            <span
              key={f.key}
              className={filter === f.key ? 'chip solid' : 'chip'}
              style={{ whiteSpace: 'nowrap', cursor: 'pointer', flexShrink: 0 }}
              onClick={() => setFilter(f.key)}
            >
              {f.label}
            </span>
          ))}
        </div>
      </div>

      {/* Lista */}
      <div className="mob-scroll" style={{ paddingTop: 4 }}>
        {loading ? (
          <div className="col gap-2">
            {[1, 2, 3, 4, 5].map((i) => (
              <div
                key={i}
                className="skeleton"
                style={{ height: 72, borderRadius: 12, flexShrink: 0 }}
              />
            ))}
          </div>
        ) : filtered.length === 0 ? (
          <div
            style={{
              padding: 40,
              textAlign: 'center',
              color: 'var(--text-dim)',
              fontSize: 13,
            }}
          >
            Nenhum exercício encontrado
          </div>
        ) : (
          <div className="col">
            {filtered.map((ex) => {
              const pr = prs[ex.id]
              return (
                <div key={ex.id} className="mob-lrow">
                  {/* Thumbnail */}
                  <div
                    className={ex.image_url ? '' : 'ph-img'}
                    style={{
                      width: 56,
                      height: 56,
                      flexShrink: 0,
                      borderRadius: 10,
                      overflow: 'hidden',
                    }}
                  >
                    {ex.image_url && (
                      <img
                        src={ex.image_url}
                        alt={ex.name}
                        style={{ width: '100%', height: '100%', objectFit: 'cover' }}
                      />
                    )}
                  </div>

                  {/* Nome + grupo */}
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <div
                      style={{
                        fontSize: 14,
                        fontWeight: 600,
                        color: 'var(--text)',
                        whiteSpace: 'nowrap',
                        overflow: 'hidden',
                        textOverflow: 'ellipsis',
                      }}
                    >
                      {ex.name}
                    </div>
                    <div style={{ marginTop: 5 }}>
                      <span className="chip" style={{ fontSize: 9, padding: '2px 8px' }}>
                        {MUSCLE_GROUP_LABELS[ex.muscle_group]}
                      </span>
                    </div>
                  </div>

                  {/* PR */}
                  <div style={{ textAlign: 'right', flexShrink: 0 }}>
                    <div
                      style={{
                        fontSize: 9,
                        color: 'var(--text-faint)',
                        letterSpacing: '0.1em',
                        textTransform: 'uppercase',
                      }}
                    >
                      PR
                    </div>
                    <div
                      className="f-mono"
                      style={{
                        fontSize: 13,
                        fontWeight: 600,
                        color: pr ? 'var(--accent)' : 'var(--text-faint)',
                      }}
                    >
                      {pr ? `${pr.loadKg}kg×${pr.reps}` : '—'}
                    </div>
                  </div>
                </div>
              )
            })}
          </div>
        )}
      </div>
    </motion.div>
  )
}
