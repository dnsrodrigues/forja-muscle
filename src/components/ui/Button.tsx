import { type ButtonHTMLAttributes, forwardRef } from 'react'

interface ButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: 'primary' | 'secondary' | 'ghost' | 'danger'
  size?: 'sm' | 'md' | 'lg'
  loading?: boolean
}

export const Button = forwardRef<HTMLButtonElement, ButtonProps>(
  (
    {
      children,
      variant = 'primary',
      size = 'md',
      loading = false,
      disabled,
      className = '',
      style,
      ...props
    },
    ref
  ) => {
    const base =
      'inline-flex items-center justify-center gap-2 font-semibold rounded-xl transition-all duration-200 focus:outline-none focus:ring-2 focus:ring-offset-2 disabled:opacity-50 disabled:cursor-not-allowed'

    const sizes = {
      sm: 'text-sm px-3 py-1.5 h-8',
      md: 'text-sm px-4 py-2 h-10',
      lg: 'text-base px-6 py-3 h-12',
    }

    // Variantes com estilos inline para usar CSS vars (responsivos ao tema)
    const variantStyles: Record<string, React.CSSProperties> = {
      primary: {
        background: 'linear-gradient(135deg, var(--accent-two), var(--accent) 52%)',
        color: 'var(--bg)',
        boxShadow: '0 12px 32px var(--accent-glow), inset 0 1px 0 rgba(255,255,255,0.36)',
      },
      secondary: {
        background: 'var(--glass)',
        color: 'var(--ink)',
        border: '1px solid var(--line)',
      },
      ghost: {
        background: 'transparent',
        color: 'var(--muted)',
        border: '1px solid transparent',
      },
      danger: {
        background: 'rgb(220 38 38)',
        color: 'white',
        boxShadow: '0 8px 24px rgba(220,38,38,0.28)',
      },
    }

    // Classes estáticas de hover (não dependem do tema)
    const variantClasses = {
      primary:   'hover:brightness-110 hover:-translate-y-0.5 hover:shadow-lg active:translate-y-0 focus:ring-white/20',
      secondary: 'hover:brightness-110 active:brightness-95 focus:ring-white/20',
      ghost:     'hover:bg-white/5 hover:opacity-100 active:bg-white/5 focus:ring-white/10',
      danger:    'hover:brightness-110 active:brightness-90 focus:ring-red-500/50',
    }

    return (
      <button
        ref={ref}
        disabled={disabled || loading}
        className={`${base} ${variantClasses[variant]} ${sizes[size]} ${className}`}
        style={{ ...variantStyles[variant], ...style }}
        {...props}
      >
        {loading && (
          <svg
            className="animate-spin h-4 w-4"
            xmlns="http://www.w3.org/2000/svg"
            fill="none"
            viewBox="0 0 24 24"
          >
            <circle
              className="opacity-25"
              cx="12"
              cy="12"
              r="10"
              stroke="currentColor"
              strokeWidth="4"
            />
            <path
              className="opacity-75"
              fill="currentColor"
              d="M4 12a8 8 0 018-8v8H4z"
            />
          </svg>
        )}
        {children}
      </button>
    )
  }
)

Button.displayName = 'Button'
