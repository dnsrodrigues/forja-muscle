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
            className="text-sm font-medium"
            style={{ color: 'var(--muted)' }}
          >
            {label}
          </label>
        )}

        <div className="relative">
          <input
            ref={ref}
            id={inputId}
            type={inputType}
            className={`w-full h-11 px-4 rounded-xl text-sm outline-none transition-all duration-200 ${isPassword ? 'pr-12' : ''} ${className}`}
            style={{
              background: 'var(--glass)',
              color: 'var(--ink)',
              border: error
                ? '1px solid rgba(239,68,68,0.7)'
                : '1px solid var(--line)',
              boxShadow: 'none',
            }}
            onFocus={(e) => {
              e.currentTarget.style.borderColor = 'color-mix(in srgb, var(--accent) 70%, white)'
              e.currentTarget.style.boxShadow = '0 0 0 4px var(--accent-glow)'
              props.onFocus?.(e)
            }}
            onBlur={(e) => {
              e.currentTarget.style.borderColor = error ? 'rgba(239,68,68,0.7)' : 'var(--line)'
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
              style={{ color: 'var(--faint)' }}
              tabIndex={-1}
            >
              {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
            </button>
          )}
        </div>

        {error && (
          <p className="text-xs text-red-400 flex items-center gap-1">
            <span>⚠</span> {error}
          </p>
        )}

        {hint && !error && (
          <p className="text-xs" style={{ color: 'var(--faint)' }}>
            {hint}
          </p>
        )}
      </div>
    )
  }
)

Input.displayName = 'Input'
