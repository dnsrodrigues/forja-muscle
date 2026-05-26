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
      'inline-flex items-center justify-center gap-2 transition-all duration-150 focus:outline-none disabled:opacity-30 disabled:cursor-not-allowed uppercase tracking-widest whitespace-nowrap'

    const sizeClass = {
      sm: 'text-[11px] px-3.5 h-8',
      md: 'text-[12px] px-5 h-10',
      lg: 'text-[13px] px-7 h-[50px]',
    }

    const variantStyles: Record<string, React.CSSProperties> = {
      primary: {
        background: 'var(--accent)',
        color: 'var(--bg)',
        fontFamily: "'Outfit', sans-serif",
        fontWeight: 700,
        borderRadius: '4px',
      },
      secondary: {
        background: 'transparent',
        color: 'var(--fg)',
        border: '1px solid var(--border-md)',
        fontFamily: "'Outfit', sans-serif",
        fontWeight: 700,
        borderRadius: '4px',
      },
      ghost: {
        background: 'transparent',
        color: 'var(--fg-2)',
        fontFamily: "'Outfit', sans-serif",
        fontWeight: 700,
        borderRadius: '4px',
      },
      danger: {
        background: 'var(--danger)',
        color: 'var(--bg)',
        fontFamily: "'Outfit', sans-serif",
        fontWeight: 700,
        borderRadius: '4px',
      },
    }

    const variantClasses = {
      primary:   'hover:brightness-110 hover:-translate-y-px active:scale-[0.97]',
      secondary: 'hover:border-[rgba(240,237,230,0.22)] hover:bg-[rgba(240,237,230,0.04)]',
      ghost:     'hover:text-[var(--fg)]',
      danger:    'hover:-translate-y-px',
    }

    return (
      <button
        ref={ref}
        disabled={disabled || loading}
        className={`${base} ${variantClasses[variant]} ${sizeClass[size]} ${className}`}
        style={{ ...variantStyles[variant], ...style }}
        {...props}
      >
        {loading && (
          <span
            className="w-[13px] h-[13px] border-2 rounded-full animate-spin"
            style={{
              borderColor: 'rgba(6, 7, 26,0.3)',
              borderTopColor: 'var(--bg)',
            }}
          />
        )}
        {children}
      </button>
    )
  }
)

Button.displayName = 'Button'
