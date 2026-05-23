interface AvatarProps {
  name: string
  src?: string | null
  size?: 'sm' | 'md' | 'lg' | 'xl'
  className?: string
}

// Extrai as iniciais de um nome completo (até 2 letras)
function getInitials(name: string): string {
  return name
    .trim()
    .split(' ')
    .filter(Boolean)
    .map((n) => n[0])
    .slice(0, 2)
    .join('')
    .toUpperCase()
}

const sizeClasses = {
  sm:  'w-8  h-8  text-xs',
  md:  'w-10 h-10 text-sm',
  lg:  'w-16 h-16 text-xl',
  xl:  'w-24 h-24 text-3xl',
}

export function Avatar({ name, src, size = 'md', className = '' }: AvatarProps) {
  const base = `${sizeClasses[size]} rounded-2xl flex-shrink-0 ${className}`

  if (src) {
    return (
      <img
        src={src}
        alt={name}
        className={`${base} object-cover`}
      />
    )
  }

  return (
    <div
      className={`${base} bg-orange-500 flex items-center justify-center font-bold text-white select-none`}
      aria-label={`Avatar de ${name}`}
    >
      {getInitials(name)}
    </div>
  )
}
