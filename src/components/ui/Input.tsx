import { type InputHTMLAttributes, forwardRef, useState } from 'react'
import { Eye, EyeOff } from 'lucide-react'

interface InputProps extends InputHTMLAttributes<HTMLInputElement> {
  label?: string
  error?: string
  hint?: string
}

export const Input = forwardRef<HTMLInputElement, InputProps>(
  ({ label, error, hint, type, className = '', id, ...props }, ref) => {
    const [showPassword, setShowPassword] = useState(false)

    const isPassword = type === 'password'
    const inputType = isPassword && showPassword ? 'text' : type
    const inputId = id ?? label?.toLowerCase().replace(/\s+/g, '-')

    return (
      <div className="flex flex-col gap-1.5">
        {label && (
          <label
            htmlFor={inputId}
            style={{
              fontFamily: "'JetBrains Mono', monospace",
              fontSize: '10px',
              fontWeight: 400,
              letterSpacing: '0.15em',
              textTransform: 'uppercase',
              color: 'var(--fg-2)',
            }}
          >
            {label}
          </label>
        )}

        <div className="relative">
          <input
            ref={ref}
            id={inputId}
            type={inputType}
            className={`w-full h-11 outline-none transition-all duration-200 ${isPassword ? 'pr-12' : ''} ${className}`}
            style={{
              padding: '0 14px',
              background: 'rgba(240,237,230,0.03)',
              border: error ? '1px solid var(--danger)' : '1px solid var(--border-md)',
              borderRadius: '4px',
              color: 'var(--fg)',
              fontFamily: "'JetBrains Mono', monospace",
              fontSize: '13px',
              letterSpacing: '0.04em',
            }}
            onFocus={(e) => {
              e.currentTarget.style.borderColor = 'var(--accent)'
              e.currentTarget.style.boxShadow = '0 0 0 3px var(--accent-muted)'
              props.onFocus?.(e)
            }}
            onBlur={(e) => {
              e.currentTarget.style.borderColor = error ? 'var(--danger)' : 'var(--border-md)'
              e.currentTarget.style.boxShadow = 'none'
              props.onBlur?.(e)
            }}
            {...props}
          />

          {isPassword && (
            <button
              type="button"
              onClick={() => setShowPassword((prev) => !prev)}
              className="absolute right-3 top-1/2 -translate-y-1/2 transition-colors"
              style={{ color: 'var(--fg-3)' }}
              tabIndex={-1}
            >
              {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
            </button>
          )}
        </div>

        {error && (
          <p style={{
            fontFamily: "'JetBrains Mono', monospace",
            fontSize: '11px',
            color: 'var(--danger)',
            letterSpacing: '0.04em',
          }}>
            ⚠ {error}
          </p>
        )}

        {hint && !error && (
          <p style={{
            fontFamily: "'JetBrains Mono', monospace",
            fontSize: '11px',
            color: 'var(--fg-3)',
            fontStyle: 'italic',
          }}>
            // {hint}
          </p>
        )}
      </div>
    )
  }
)

Input.displayName = 'Input'
