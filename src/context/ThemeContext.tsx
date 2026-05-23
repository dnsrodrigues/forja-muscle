import { createContext, useContext, useEffect, useState, type ReactNode } from 'react'

// ─── Tipos ───────────────────────────────────────────────────────────────────

export type Theme = 'forge' | 'arctic' | 'venom' | 'eclipse'

export const THEMES: { id: Theme; label: string; swatch: string; description: string }[] = [
  { id: 'forge',   label: 'Forge',   swatch: '#e07b45', description: 'Copper × Obsidian' },
  { id: 'arctic',  label: 'Arctic',  swatch: '#58a6ff', description: 'Cobalt × Ice'       },
  { id: 'venom',   label: 'Venom',   swatch: '#c8f04a', description: 'Lime × Dark'         },
  { id: 'eclipse', label: 'Eclipse', swatch: '#d4cfc8', description: 'Silver × Void'       },
]

interface ThemeContextValue {
  theme: Theme
  setTheme: (t: Theme) => void
}

// ─── Contexto ────────────────────────────────────────────────────────────────

const ThemeContext = createContext<ThemeContextValue>({
  theme: 'forge',
  setTheme: () => {},
})

// ─── Provider ────────────────────────────────────────────────────────────────

export function ThemeProvider({ children }: { children: ReactNode }) {
  const [theme, setThemeState] = useState<Theme>(() => {
    const stored = localStorage.getItem('musc-theme')
    return (stored as Theme) ?? 'forge'
  })

  useEffect(() => {
    // Aplica o data-theme no <html> — todas as CSS vars mudam com isso
    document.documentElement.dataset.theme = theme
    localStorage.setItem('musc-theme', theme)
  }, [theme])

  // Aplica na montagem inicial (sem esperar o estado mudar)
  useEffect(() => {
    document.documentElement.dataset.theme = theme
  }, []) // eslint-disable-line react-hooks/exhaustive-deps

  function setTheme(t: Theme) {
    setThemeState(t)
  }

  return (
    <ThemeContext.Provider value={{ theme, setTheme }}>
      {children}
    </ThemeContext.Provider>
  )
}

// ─── Hook ────────────────────────────────────────────────────────────────────

export function useTheme() {
  return useContext(ThemeContext)
}
