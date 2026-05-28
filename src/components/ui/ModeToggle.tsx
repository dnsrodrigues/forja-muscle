import { useAuth } from '../../context/AuthContext'

export function ModeToggle() {
  const { trainerMode, setTrainerMode } = useAuth()

  return (
    <div style={{
      display: 'flex',
      gap: 4,
      background: 'var(--surface)',
      borderRadius: 20,
      padding: 3,
      border: '1px solid var(--border)',
    }}>
      <button
        onClick={() => setTrainerMode('gestao')}
        style={{
          flex: 1,
          padding: '4px 10px',
          borderRadius: 16,
          border: 'none',
          cursor: 'pointer',
          fontSize: 11,
          fontFamily: "'JetBrains Mono', monospace",
          fontWeight: 600,
          background: trainerMode === 'gestao' ? 'var(--accent)' : 'transparent',
          color: trainerMode === 'gestao' ? '#fff' : 'var(--fg-2)',
          transition: 'all 0.15s',
          whiteSpace: 'nowrap',
        }}
      >
        Gestão
      </button>
      <button
        onClick={() => setTrainerMode('treino')}
        style={{
          flex: 1,
          padding: '4px 10px',
          borderRadius: 16,
          border: 'none',
          cursor: 'pointer',
          fontSize: 11,
          fontFamily: "'JetBrains Mono', monospace",
          fontWeight: 600,
          background: trainerMode === 'treino' ? 'var(--accent)' : 'transparent',
          color: trainerMode === 'treino' ? '#fff' : 'var(--fg-2)',
          transition: 'all 0.15s',
          whiteSpace: 'nowrap',
        }}
      >
        Meu Treino
      </button>
    </div>
  )
}
