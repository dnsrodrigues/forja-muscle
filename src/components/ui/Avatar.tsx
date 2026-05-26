interface AvatarProps {
  name: string
  src?: string | null
  size?: 'xs' | 'sm' | 'md' | 'lg' | 'xl'
  className?: string
  style?: React.CSSProperties
}

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

const sizeMap = {
  xs: { px: 28, font: 10 },
  sm: { px: 36, font: 13 },
  md: { px: 48, font: 16 },
  lg: { px: 64, font: 22 },
  xl: { px: 88, font: 30 },
}

export function Avatar({ name, src, size = 'md', className = '', style }: AvatarProps) {
  const { px, font } = sizeMap[size]

  const baseStyle: React.CSSProperties = {
    width: px,
    height: px,
    flexShrink: 0,
    ...style,
  }

  if (src) {
    return (
      <img
        src={src}
        alt={name}
        className={className}
        style={{ ...baseStyle, objectFit: 'cover' }}
      />
    )
  }

  return (
    <div
      className={`flex items-center justify-center select-none ${className}`}
      style={{
        ...baseStyle,
        background: 'var(--accent)',
        color: 'var(--bg)',
        fontFamily: "'Outfit', sans-serif",
        fontWeight: 800,
        fontSize: font,
        letterSpacing: '0.08em',
      }}
      aria-label={`Avatar de ${name}`}
    >
      {getInitials(name)}
    </div>
  )
}
