import { useState, useEffect, useRef } from 'react'
import { Icon } from './ui/Icon'
import type { Exercise, MuscleGroup } from '../types'
import { MUSCLE_GROUP_LABELS } from '../types'
import { getExercises, createExercise } from '../services/workout.service'
import { useAuth } from '../context/AuthContext'

interface ExerciseSelectorProps {
  isOpen: boolean
  onClose: () => void
  onSelect: (exercise: Exercise) => void
  excludeIds?: string[]
}

const ALL_MUSCLE_GROUPS = Object.entries(MUSCLE_GROUP_LABELS) as [MuscleGroup, string][]

type ViewMode = 'search' | 'create'

export function ExerciseSelector({
  isOpen,
  onClose,
  onSelect,
  excludeIds = [],
}: ExerciseSelectorProps) {
  const { profile } = useAuth()

  // ── Estado de busca ──
  const [exercises, setExercises] = useState<Exercise[]>([])
  const [filtered, setFiltered] = useState<Exercise[]>([])
  const [search, setSearch] = useState('')
  const [muscleFilter, setMuscleFilter] = useState<MuscleGroup | null>(null)
  const [loading, setLoading] = useState(false)
  const searchRef = useRef<HTMLInputElement>(null)

  // ── Estado de criação ──
  const [view, setView] = useState<ViewMode>('search')
  const [newName, setNewName] = useState('')
  const [newMuscle, setNewMuscle] = useState<MuscleGroup | ''>('')
  const [newDesc, setNewDesc] = useState('')
  const [creating, setCreating] = useState(false)
  const [createError, setCreateError] = useState<string | null>(null)
  const [createFormErrors, setCreateFormErrors] = useState<{ name?: string; muscle?: string }>({})

  // ── Carrega exercícios ao abrir ──
  useEffect(() => {
    if (!isOpen) return
    setView('search')
    setSearch('')
    setMuscleFilter(null)
    setLoading(true)
    getExercises()
      .then((data) => {
        setExercises(data)
        setFiltered(data.filter((e) => !excludeIds.includes(e.id)))
      })
      .finally(() => setLoading(false))

    setTimeout(() => searchRef.current?.focus(), 100)
  }, [isOpen])

  // ── Filtra em tempo real ──
  useEffect(() => {
    let result = exercises.filter((e) => !excludeIds.includes(e.id))
    if (muscleFilter) result = result.filter((e) => e.muscle_group === muscleFilter)
    if (search.trim()) {
      const q = search.toLowerCase()
      result = result.filter((e) => e.name.toLowerCase().includes(q))
    }
    setFiltered(result)
  }, [search, muscleFilter, exercises, excludeIds])

  // ── Fecha com Escape ──
  useEffect(() => {
    if (!isOpen) return
    const handler = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        if (view === 'create') setView('search')
        else onClose()
      }
    }
    window.addEventListener('keydown', handler)
    return () => window.removeEventListener('keydown', handler)
  }, [isOpen, onClose, view])

  // ── Abre modo criação pré-preenchido com o termo buscado ──
  function openCreate() {
    setNewName(search.trim())
    setNewMuscle('')
    setNewDesc('')
    setCreateError(null)
    setCreateFormErrors({})
    setView('create')
    // foca no campo de grupo muscular logo depois
    setTimeout(() => {
      document.getElementById('new-exercise-muscle')?.focus()
    }, 80)
  }

  // ── Cria exercício ──
  async function handleCreate() {
    const errs: typeof createFormErrors = {}
    if (!newName.trim()) errs.name = 'Nome obrigatório'
    if (!newMuscle) errs.muscle = 'Escolha o grupo muscular'
    setCreateFormErrors(errs)
    if (Object.keys(errs).length > 0) return

    setCreating(true)
    setCreateError(null)
    try {
      const created = await createExercise({
        name: newName,
        muscle_group: newMuscle,
        description: newDesc || undefined,
        createdBy: profile!.id,
      })
      // Adiciona à lista local e seleciona
      setExercises((prev) => [...prev, created])
      onSelect(created)
      onClose()
    } catch (err) {
      setCreateError(err instanceof Error ? err.message : 'Erro ao criar exercício')
    } finally {
      setCreating(false)
    }
  }

  if (!isOpen) return null

  const noResults = !loading && filtered.length === 0 && search.trim().length > 0

  return (
    <>
      {/* Overlay */}
      <div
        onClick={onClose}
        style={{
          position: 'fixed', inset: 0,
          background: 'rgba(6, 7, 26,0.8)',
          zIndex: 40, backdropFilter: 'blur(4px)',
        }}
      />

      {/* Modal */}
      <div
        style={{
          position: 'fixed',
          top: '50%', left: '50%',
          transform: 'translate(-50%, -50%)',
          zIndex: 50,
          width: 'min(480px, calc(100vw - 32px))',
          maxHeight: 'calc(100vh - 80px)',
          background: 'var(--bg-1)',
          border: '1px solid var(--border)',
          borderTop: '2px solid var(--accent)',
          borderRadius: 4,
          display: 'flex', flexDirection: 'column',
          overflow: 'hidden',
        }}
      >
        {/* ═══════════════════════════════════════════
            MODO: BUSCA
        ═══════════════════════════════════════════ */}
        {view === 'search' && (
          <>
            {/* Header */}
            <div style={{
              padding: '14px 16px',
              borderBottom: '1px solid var(--border)',
              display: 'flex', alignItems: 'center', justifyContent: 'space-between',
            }}>
              <div>
                <div style={{ fontFamily: "var(--f-display)", fontWeight: 800, fontSize: 14, color: 'var(--text)' }}>
                  Adicionar Exercício
                </div>
                <div style={{ fontFamily: "'JetBrains Mono', monospace", fontSize: 9, color: 'var(--text-faint)', marginTop: 2, fontStyle: 'italic' }}>
                  // {exercises.length} no catálogo · admin pode criar novos
                </div>
              </div>
              <button onClick={onClose} style={{ background: 'transparent', border: 'none', color: 'var(--text-faint)', cursor: 'pointer', padding: 4, opacity: 0.5 }}>
                <Icon name="x" size={16} />
              </button>
            </div>

            {/* Busca */}
            <div style={{ padding: '10px 16px 0', borderBottom: '1px solid var(--border)' }}>
              <div style={{
                display: 'flex', alignItems: 'center', gap: 8,
                background: 'rgba(255,255,255,0.03)',
                border: '1px solid var(--border)',
                borderRadius: 4, padding: '7px 10px', marginBottom: 10,
              }}>
                <Icon name="search" size={13} style={{ color: 'var(--text-faint)', opacity: 0.5, flexShrink: 0 }} />
                <input
                  ref={searchRef}
                  type="text"
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                  placeholder="Buscar exercício..."
                  style={{
                    background: 'transparent', border: 'none', outline: 'none',
                    color: 'var(--text)', fontFamily: "'JetBrains Mono', monospace", fontSize: 12, flex: 1,
                  }}
                />
                {search && (
                  <button onClick={() => setSearch('')} style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'var(--text-faint)', opacity: 0.5 }}>
                    <Icon name="x" size={12} />
                  </button>
                )}
              </div>

              {/* Chips de grupo muscular */}
              <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap', paddingBottom: 10 }}>
                <button
                  onClick={() => setMuscleFilter(null)}
                  style={{
                    background: muscleFilter === null ? 'var(--accent)' : 'transparent',
                    border: `1px solid ${muscleFilter === null ? 'var(--accent)' : 'var(--border)'}`,
                    borderRadius: 2, padding: '3px 8px',
                    color: muscleFilter === null ? 'var(--bg-0)' : 'var(--text-faint)',
                    fontFamily: "'JetBrains Mono', monospace", fontSize: 9, letterSpacing: '0.1em',
                    textTransform: 'uppercase', cursor: 'pointer', whiteSpace: 'nowrap',
                  }}
                >
                  Todos
                </button>
                {ALL_MUSCLE_GROUPS.map(([key, label]) => (
                  <button
                    key={key}
                    onClick={() => setMuscleFilter(muscleFilter === key ? null : key)}
                    style={{
                      background: muscleFilter === key ? 'var(--accent)' : 'transparent',
                      border: `1px solid ${muscleFilter === key ? 'var(--accent)' : 'var(--border)'}`,
                      borderRadius: 2, padding: '3px 8px',
                      color: muscleFilter === key ? 'var(--bg-0)' : 'var(--text-faint)',
                      fontFamily: "'JetBrains Mono', monospace", fontSize: 9, letterSpacing: '0.1em',
                      textTransform: 'uppercase', cursor: 'pointer', whiteSpace: 'nowrap',
                    }}
                  >
                    {label}
                  </button>
                ))}
              </div>
            </div>

            {/* Lista */}
            <div style={{ overflowY: 'auto', flex: 1, padding: '8px' }}>
              {loading && (
                <div style={{ padding: '24px', textAlign: 'center', fontFamily: "'JetBrains Mono', monospace", fontSize: 11, color: 'var(--text-faint)', fontStyle: 'italic' }}>
                  // carregando...
                </div>
              )}

              {/* Nenhum resultado — oferece criar */}
              {noResults && (
                <div style={{ padding: '16px 8px' }}>
                  <div style={{ fontFamily: "'JetBrains Mono', monospace", fontSize: 10, color: 'var(--text-faint)', fontStyle: 'italic', marginBottom: 12, textAlign: 'center' }}>
                    // "{search}" não encontrado na biblioteca
                  </div>
                  <button
                    onClick={openCreate}
                    style={{
                      width: '100%',
                      display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 7,
                      background: 'rgba(108, 142, 247,0.06)',
                      border: '1px solid rgba(108, 142, 247,0.35)',
                      borderRadius: 4, padding: '11px',
                      color: 'var(--accent)',
                      fontFamily: "var(--f-display)", fontWeight: 800,
                      fontSize: 11, letterSpacing: '0.08em', cursor: 'pointer',
                      transition: 'background 0.15s',
                    }}
                    onMouseEnter={(e) => ((e.currentTarget as HTMLButtonElement).style.background = 'rgba(108, 142, 247,0.1)')}
                    onMouseLeave={(e) => ((e.currentTarget as HTMLButtonElement).style.background = 'rgba(108, 142, 247,0.06)')}
                  >
                    <Icon name="plus" size={14} />
                    Criar "{search.trim()}" na biblioteca
                  </button>
                </div>
              )}

              {/* Lista de resultados */}
              {!loading && filtered.map((exercise) => (
                <button
                  key={exercise.id}
                  onClick={() => { onSelect(exercise); onClose() }}
                  style={{
                    width: '100%', background: 'transparent', border: 'none',
                    borderRadius: 3, padding: '9px 10px',
                    display: 'flex', alignItems: 'center', justifyContent: 'space-between',
                    cursor: 'pointer', textAlign: 'left', transition: 'background 0.1s',
                  }}
                  onMouseEnter={(e) => ((e.currentTarget as HTMLButtonElement).style.background = 'rgba(108, 142, 247,0.06)')}
                  onMouseLeave={(e) => ((e.currentTarget as HTMLButtonElement).style.background = 'transparent')}
                >
                  <span style={{ fontFamily: "var(--f-display)", fontWeight: 700, fontSize: 13, color: 'var(--text)' }}>
                    {exercise.name}
                  </span>
                  <span style={{ fontFamily: "'JetBrains Mono', monospace", fontSize: 9, color: 'var(--text-faint)', opacity: 0.5, textTransform: 'uppercase', letterSpacing: '0.1em' }}>
                    {MUSCLE_GROUP_LABELS[exercise.muscle_group as MuscleGroup] ?? exercise.muscle_group}
                  </span>
                </button>
              ))}

              {/* Sem termo de busca e sem filtro: mostra botão de criar no rodapé */}
              {!loading && !noResults && (
                <div style={{ padding: '10px 8px 4px', borderTop: '1px solid var(--border)', marginTop: 4 }}>
                  <button
                    onClick={openCreate}
                    style={{
                      width: '100%',
                      display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 6,
                      background: 'transparent',
                      border: '1px dashed var(--border)',
                      borderRadius: 4, padding: '8px',
                      color: 'var(--text-faint)',
                      fontFamily: "'JetBrains Mono', monospace",
                      fontSize: 9, letterSpacing: '0.1em', textTransform: 'uppercase',
                      cursor: 'pointer', transition: 'all 0.15s',
                    }}
                    onMouseEnter={(e) => {
                      const el = e.currentTarget as HTMLButtonElement
                      el.style.borderColor = 'var(--accent)'
                      el.style.color = 'var(--accent)'
                    }}
                    onMouseLeave={(e) => {
                      const el = e.currentTarget as HTMLButtonElement
                      el.style.borderColor = 'var(--border)'
                      el.style.color = 'var(--text-faint)'
                    }}
                  >
                    <Icon name="plus" size={11} />
                    Criar exercício novo
                  </button>
                </div>
              )}
            </div>
          </>
        )}

        {/* ═══════════════════════════════════════════
            MODO: CRIAR EXERCÍCIO
        ═══════════════════════════════════════════ */}
        {view === 'create' && (
          <>
            {/* Header */}
            <div style={{
              padding: '14px 16px',
              borderBottom: '1px solid var(--border)',
              display: 'flex', alignItems: 'center', gap: 10,
            }}>
              <button
                onClick={() => setView('search')}
                style={{ background: 'transparent', border: 'none', color: 'var(--text-faint)', cursor: 'pointer', padding: 2, opacity: 0.6, display: 'flex', alignItems: 'center' }}
              >
                <Icon name="arrowL" size={16} />
              </button>
              <div style={{ flex: 1 }}>
                <div style={{ fontFamily: "var(--f-display)", fontWeight: 800, fontSize: 14, color: 'var(--text)' }}>
                  Novo Exercício
                </div>
                <div style={{ fontFamily: "'JetBrains Mono', monospace", fontSize: 9, color: 'var(--text-faint)', marginTop: 2, fontStyle: 'italic' }}>
                  // será adicionado à biblioteca permanentemente
                </div>
              </div>
              <button onClick={onClose} style={{ background: 'transparent', border: 'none', color: 'var(--text-faint)', cursor: 'pointer', padding: 4, opacity: 0.5 }}>
                <Icon name="x" size={16} />
              </button>
            </div>

            {/* Formulário */}
            <div style={{ padding: '16px', overflowY: 'auto', flex: 1, display: 'flex', flexDirection: 'column', gap: 14 }}>

              {/* Nome */}
              <div>
                <label style={{ fontFamily: "'JetBrains Mono', monospace", fontSize: 9, color: 'var(--text-faint)', letterSpacing: '0.15em', textTransform: 'uppercase', display: 'block', marginBottom: 6 }}>
                  Nome *
                </label>
                <input
                  type="text"
                  value={newName}
                  onChange={(e) => { setNewName(e.target.value); setCreateFormErrors((p) => ({ ...p, name: undefined })) }}
                  placeholder="Ex: Remada Cavalinho"
                  style={{
                    width: '100%',
                    background: 'rgba(255,255,255,0.03)',
                    border: `1px solid ${createFormErrors.name ? 'var(--danger)' : 'var(--border)'}`,
                    borderRadius: 4, padding: '9px 12px',
                    color: 'var(--text)',
                    fontFamily: "var(--f-display)", fontWeight: 700, fontSize: 14,
                    outline: 'none',
                  }}
                  onFocus={(e) => (e.target.style.borderColor = 'var(--accent)')}
                  onBlur={(e) => (e.target.style.borderColor = createFormErrors.name ? 'var(--danger)' : 'var(--border)')}
                />
                {createFormErrors.name && (
                  <div style={{ fontFamily: "'JetBrains Mono', monospace", fontSize: 9, color: 'var(--danger)', marginTop: 4 }}>
                    // {createFormErrors.name}
                  </div>
                )}
              </div>

              {/* Grupo muscular */}
              <div>
                <label style={{ fontFamily: "'JetBrains Mono', monospace", fontSize: 9, color: 'var(--text-faint)', letterSpacing: '0.15em', textTransform: 'uppercase', display: 'block', marginBottom: 6 }}>
                  Grupo Muscular *
                </label>
                <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap' }}>
                  {ALL_MUSCLE_GROUPS.map(([key, label]) => (
                    <button
                      key={key}
                      id={key === 'chest' ? 'new-exercise-muscle' : undefined}
                      onClick={() => { setNewMuscle(key); setCreateFormErrors((p) => ({ ...p, muscle: undefined })) }}
                      style={{
                        background: newMuscle === key ? 'var(--accent)' : 'transparent',
                        border: `1px solid ${createFormErrors.muscle && !newMuscle ? 'var(--danger)' : newMuscle === key ? 'var(--accent)' : 'var(--border)'}`,
                        borderRadius: 3, padding: '5px 10px',
                        color: newMuscle === key ? 'var(--bg-0)' : 'var(--text-faint)',
                        fontFamily: "'JetBrains Mono', monospace", fontSize: 9,
                        letterSpacing: '0.08em', textTransform: 'uppercase',
                        cursor: 'pointer', transition: 'all 0.15s',
                      }}
                    >
                      {label}
                    </button>
                  ))}
                </div>
                {createFormErrors.muscle && (
                  <div style={{ fontFamily: "'JetBrains Mono', monospace", fontSize: 9, color: 'var(--danger)', marginTop: 4 }}>
                    // {createFormErrors.muscle}
                  </div>
                )}
              </div>

              {/* Descrição (opcional) */}
              <div>
                <label style={{ fontFamily: "'JetBrains Mono', monospace", fontSize: 9, color: 'var(--text-faint)', letterSpacing: '0.15em', textTransform: 'uppercase', display: 'block', marginBottom: 6 }}>
                  Descrição <span style={{ opacity: 0.4 }}>(opcional)</span>
                </label>
                <textarea
                  value={newDesc}
                  onChange={(e) => setNewDesc(e.target.value)}
                  placeholder="Instruções de execução..."
                  rows={2}
                  style={{
                    width: '100%',
                    background: 'rgba(255,255,255,0.03)',
                    border: '1px solid var(--border)',
                    borderRadius: 4, padding: '9px 12px',
                    color: 'var(--text)',
                    fontFamily: "'JetBrains Mono', monospace", fontSize: 11,
                    outline: 'none', resize: 'vertical',
                  }}
                  onFocus={(e) => (e.target.style.borderColor = 'var(--accent)')}
                  onBlur={(e) => (e.target.style.borderColor = 'var(--border)')}
                />
              </div>

              {/* Erro */}
              {createError && (
                <div style={{
                  borderLeft: '2px solid var(--danger)',
                  background: 'rgba(239,68,68,0.05)',
                  padding: '8px 12px',
                  fontFamily: "'JetBrains Mono', monospace", fontSize: 10, color: 'var(--danger)',
                }}>
                  ⚠ {createError}
                </div>
              )}
            </div>

            {/* Footer */}
            <div style={{ padding: '12px 16px', borderTop: '1px solid var(--border)', display: 'flex', gap: 8, justifyContent: 'flex-end' }}>
              <button
                onClick={() => setView('search')}
                style={{
                  background: 'transparent', border: '1px solid var(--border)',
                  borderRadius: 4, padding: '8px 16px',
                  color: 'var(--text-dim)',
                  fontFamily: "'JetBrains Mono', monospace", fontSize: 9,
                  letterSpacing: '0.1em', textTransform: 'uppercase', cursor: 'pointer',
                }}
              >
                Voltar
              </button>
              <button
                onClick={handleCreate}
                disabled={creating}
                style={{
                  display: 'flex', alignItems: 'center', gap: 6,
                  background: creating ? 'rgba(108, 142, 247,0.5)' : 'var(--accent)',
                  border: 'none', borderRadius: 4, padding: '8px 18px',
                  color: 'var(--bg-0)',
                  fontFamily: "var(--f-display)", fontWeight: 800,
                  fontSize: 10, letterSpacing: '0.15em', textTransform: 'uppercase',
                  cursor: creating ? 'not-allowed' : 'pointer',
                }}
              >
                {creating ? (
                  <>
                    <span style={{
                      display: 'inline-block',
                      width: 11, height: 11,
                      borderRadius: '50%',
                      border: '2px solid currentColor',
                      borderTopColor: 'transparent',
                      animation: 'forjaSpin 0.7s linear infinite',
                    }} />
                    Criando...
                  </>
                ) : (
                  <><Icon name="plus" size={11} /> Criar e Adicionar</>
                )}
              </button>
            </div>
          </>
        )}
      </div>

    </>
  )
}
