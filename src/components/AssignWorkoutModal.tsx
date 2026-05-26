import { useState, useEffect } from 'react'
import { X, Search, Check } from 'lucide-react'
import { supabase } from '../lib/supabase'
import { assignTemplateToStudent } from '../services/workout.service'
import { useAuth } from '../context/AuthContext'
import { Avatar } from './ui/Avatar'
import type { Workout, UserProfile } from '../types'

interface AssignWorkoutModalProps {
  workout: Workout
  onClose: () => void
  onAssigned: () => void
}

export function AssignWorkoutModal({
  workout,
  onClose,
  onAssigned,
}: AssignWorkoutModalProps) {
  const { profile: adminProfile } = useAuth()
  const [students, setStudents] = useState<UserProfile[]>([])
  const [filtered, setFiltered] = useState<UserProfile[]>([])
  const [search, setSearch] = useState('')
  const [loading, setLoading] = useState(false)
  const [assigning, setAssigning] = useState<string | null>(null)
  const [assigned, setAssigned] = useState<Set<string>>(new Set())
  const [error, setError] = useState<string | null>(null)

  // Carrega alunos ativos
  useEffect(() => {
    setLoading(true)
    supabase
      .from('profiles')
      .select('*')
      .eq('role', 'user')
      .eq('is_active', true)
      .order('full_name', { ascending: true })
      .then(({ data, error }) => {
        if (!error && data) {
          setStudents(data as UserProfile[])
          setFiltered(data as UserProfile[])
        }
        setLoading(false)
      })
  }, [])

  // Filtra por nome
  useEffect(() => {
    if (!search.trim()) {
      setFiltered(students)
    } else {
      const q = search.toLowerCase()
      setFiltered(students.filter((s) => s.full_name.toLowerCase().includes(q)))
    }
  }, [search, students])

  async function handleAssign(student: UserProfile) {
    if (!adminProfile) return
    setAssigning(student.id)
    setError(null)
    try {
      await assignTemplateToStudent(workout.id, student.id, adminProfile.id)
      setAssigned((prev) => new Set([...prev, student.id]))
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Erro ao atribuir ficha')
    } finally {
      setAssigning(null)
    }
  }

  // Fecha com Escape
  useEffect(() => {
    const handler = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose()
    }
    window.addEventListener('keydown', handler)
    return () => window.removeEventListener('keydown', handler)
  }, [onClose])

  const hasAssignedAny = assigned.size > 0

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
      <div style={{
        position: 'fixed',
        top: '50%', left: '50%',
        transform: 'translate(-50%, -50%)',
        zIndex: 50,
        width: 'min(440px, calc(100vw - 32px))',
        maxHeight: 'calc(100vh - 80px)',
        background: 'var(--surface)',
        border: '1px solid var(--border-md)',
        borderTop: '2px solid var(--accent)',
        borderRadius: 4,
        display: 'flex', flexDirection: 'column',
        overflow: 'hidden',
      }}>

        {/* Header */}
        <div style={{
          padding: '14px 16px',
          borderBottom: '1px solid var(--border)',
          display: 'flex', alignItems: 'center', justifyContent: 'space-between',
        }}>
          <div>
            <div style={{ fontFamily: "'Outfit', sans-serif", fontWeight: 800, fontSize: 14, color: 'var(--fg)' }}>
              Atribuir Ficha
            </div>
            <div style={{ fontFamily: "'JetBrains Mono', monospace", fontSize: 9, color: 'var(--fg-3)', marginTop: 2, fontStyle: 'italic' }}>
              // {workout.name}
            </div>
          </div>
          <button
            onClick={onClose}
            style={{ background: 'transparent', border: 'none', color: 'var(--fg-3)', cursor: 'pointer', padding: 4, opacity: 0.5 }}
          >
            <X size={16} />
          </button>
        </div>

        {/* Busca */}
        <div style={{ padding: '10px 16px', borderBottom: '1px solid var(--border)' }}>
          <div style={{
            display: 'flex', alignItems: 'center', gap: 8,
            background: 'rgba(255,255,255,0.03)',
            border: '1px solid var(--border-md)',
            borderRadius: 4, padding: '7px 10px',
          }}>
            <Search size={13} style={{ color: 'var(--fg-3)', opacity: 0.5, flexShrink: 0 }} />
            <input
              type="text"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Buscar aluno..."
              style={{
                background: 'transparent', border: 'none', outline: 'none',
                color: 'var(--fg)', fontFamily: "'JetBrains Mono', monospace", fontSize: 12, flex: 1,
              }}
            />
          </div>
        </div>

        {/* Erro */}
        {error && (
          <div style={{
            margin: '8px 16px 0',
            borderLeft: '2px solid var(--danger)',
            background: 'rgba(239,68,68,0.05)',
            padding: '8px 12px',
            fontFamily: "'JetBrains Mono', monospace",
            fontSize: 10, color: 'var(--danger)',
          }}>
            ⚠ {error}
          </div>
        )}

        {/* Lista */}
        <div style={{ overflowY: 'auto', flex: 1, padding: '8px' }}>
          {loading && (
            <div style={{ padding: '24px', textAlign: 'center', fontFamily: "'JetBrains Mono', monospace", fontSize: 11, color: 'var(--fg-3)', fontStyle: 'italic' }}>
              // carregando alunos...
            </div>
          )}

          {!loading && filtered.length === 0 && (
            <div style={{ padding: '24px', textAlign: 'center', fontFamily: "'JetBrains Mono', monospace", fontSize: 11, color: 'var(--fg-3)', fontStyle: 'italic' }}>
              // nenhum aluno encontrado
            </div>
          )}

          {!loading && filtered.map((student) => {
            const isAssigned = assigned.has(student.id)
            const isAssigning = assigning === student.id

            return (
              <div
                key={student.id}
                style={{
                  display: 'flex', alignItems: 'center',
                  padding: '9px 10px', borderRadius: 3,
                  gap: 10,
                  background: isAssigned ? 'rgba(108, 142, 247,0.06)' : 'transparent',
                  border: isAssigned ? '1px solid rgba(108, 142, 247,0.2)' : '1px solid transparent',
                  marginBottom: 2,
                  transition: 'background 0.1s',
                }}
              >
                <Avatar name={student.full_name} size="xs" />
                <div style={{ flex: 1, minWidth: 0 }}>
                  <div style={{ fontFamily: "'Outfit', sans-serif", fontWeight: 700, fontSize: 13, color: 'var(--fg)', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                    {student.full_name}
                  </div>
                  {student.goal && (
                    <div style={{ fontFamily: "'JetBrains Mono', monospace", fontSize: 9, color: 'var(--fg-3)', opacity: 0.5 }}>
                      {student.goal}
                    </div>
                  )}
                </div>
                <button
                  onClick={() => !isAssigned && handleAssign(student)}
                  disabled={isAssigning || isAssigned}
                  style={{
                    display: 'flex', alignItems: 'center', gap: 4,
                    background: isAssigned ? 'transparent' : 'var(--accent)',
                    border: isAssigned ? '1px solid rgba(108, 142, 247,0.3)' : 'none',
                    borderRadius: 3,
                    padding: '5px 10px',
                    color: isAssigned ? 'var(--accent)' : 'var(--bg)',
                    fontFamily: "'JetBrains Mono', monospace",
                    fontSize: 9, letterSpacing: '0.1em',
                    textTransform: 'uppercase',
                    cursor: isAssigned ? 'default' : 'pointer',
                    opacity: isAssigning ? 0.5 : 1,
                  }}
                >
                  {isAssigning ? (
                    <span>...</span>
                  ) : isAssigned ? (
                    <><Check size={10} /> Atribuída</>
                  ) : (
                    'Atribuir'
                  )}
                </button>
              </div>
            )
          })}
        </div>

        {/* Footer */}
        <div style={{ padding: '10px 16px', borderTop: '1px solid var(--border)', display: 'flex', justifyContent: 'flex-end', gap: 8 }}>
          <button
            onClick={() => { if (hasAssignedAny) onAssigned(); else onClose() }}
            style={{
              background: hasAssignedAny ? 'var(--accent)' : 'transparent',
              border: hasAssignedAny ? 'none' : '1px solid var(--border-md)',
              borderRadius: 4,
              padding: '7px 16px',
              color: hasAssignedAny ? 'var(--bg)' : 'var(--fg-2)',
              fontFamily: "'Outfit', sans-serif",
              fontWeight: 800,
              fontSize: 10,
              letterSpacing: '0.15em',
              textTransform: 'uppercase',
              cursor: 'pointer',
            }}
          >
            {hasAssignedAny ? `Concluído (${assigned.size})` : 'Fechar'}
          </button>
        </div>
      </div>
    </>
  )
}
