import { useTheme, THEMES, type Theme } from '../../context/ThemeContext'

interface ThemeSwitcherProps {
  className?: string
}

export function ThemeSwitcher({ className = '' }: ThemeSwitcherProps) {
  const { theme, setTheme } = useTheme()

  return (
    <div
      className={`flex items-center gap-1.5 ${className}`}
      role="group"
      aria-label="Selecionar tema de cor"
    >
      {THEMES.map((t) => (
        <button
          key={t.id}
          type="button"
          title={`${t.label} — ${t.description}`}
          onClick={() => setTheme(t.id as Theme)}
          className={`
            relative w-5 h-5 rounded-full transition-all duration-300 cursor-pointer
            ${theme === t.id
              ? 'scale-125 ring-2 ring-offset-1 ring-white/40 ring-offset-transparent'
              : 'opacity-45 hover:opacity-75 hover:scale-110'
            }
          `}
          style={{ background: t.swatch }}
          aria-pressed={theme === t.id}
          aria-label={`Tema ${t.label}`}
        />
      ))}
    </div>
  )
}
