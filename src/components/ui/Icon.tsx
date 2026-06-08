import type { ReactNode, SVGProps } from 'react'

export type IconName =
  | 'home'
  | 'flame'
  | 'calendar'
  | 'dumbbell'
  | 'chart'
  | 'edit'
  | 'user'
  | 'timer'
  | 'search'
  | 'plus'
  | 'arrow'
  | 'arrowL'
  | 'check'
  | 'play'
  | 'pause'
  | 'more'
  | 'bell'
  | 'flash'
  | 'history'
  | 'trophy'
  | 'logout'
  | 'settings'
  | 'scale'
  | 'trending'
  | 'x'
  | 'hash'
  | 'eye'
  | 'eyeOff'
  | 'chevron'
  | 'trash'

const PATHS: Record<IconName, ReactNode> = {
  home: <path d="M3 11l9-8 9 8M5 9.5V21h14V9.5" />,
  flame: (
    <>
      <path d="M12 3s4 4 4 8a4 4 0 0 1-8 0c0-1.5 1-3 2-4-1 3 .5 4 2 4 0-2-2-3-2-5 0-2 2-3 2-3z" />
      <path d="M8 14a4 4 0 0 0 8 0" />
    </>
  ),
  calendar: (
    <>
      <rect x="3" y="5" width="18" height="16" rx="2" />
      <path d="M3 10h18M8 3v4M16 3v4" />
    </>
  ),
  dumbbell: (
    <>
      <path d="M3 9v6M21 9v6M6 7v10M18 7v10M9 12h6" />
      <path d="M9 9v6M15 9v6" />
    </>
  ),
  chart: (
    <>
      <path d="M3 21h18" />
      <path d="M6 17V11M11 17V7M16 17V13M21 17V9" />
    </>
  ),
  edit: (
    <>
      <path d="M14 4l6 6L8 22H2v-6z" />
      <path d="M14 4l6 6" />
    </>
  ),
  user: (
    <>
      <circle cx="12" cy="8" r="4" />
      <path d="M4 21c1.5-4 4.5-6 8-6s6.5 2 8 6" />
    </>
  ),
  timer: (
    <>
      <circle cx="12" cy="13" r="8" />
      <path d="M12 9v4l3 2M9 2h6" />
    </>
  ),
  search: (
    <>
      <circle cx="11" cy="11" r="7" />
      <path d="M21 21l-4.5-4.5" />
    </>
  ),
  plus: <path d="M12 5v14M5 12h14" />,
  arrow: <path d="M5 12h14M13 6l6 6-6 6" />,
  arrowL: <path d="M19 12H5M11 18l-6-6 6-6" />,
  check: <path d="M5 12l5 5L20 7" />,
  play: <path d="M6 4l14 8L6 20z" fill="currentColor" />,
  pause: <path d="M7 5h4v14H7zM13 5h4v14h-4z" fill="currentColor" />,
  more: <path d="M5 12h.01M12 12h.01M19 12h.01" strokeWidth="3" />,
  bell: (
    <>
      <path d="M6 9a6 6 0 0 1 12 0c0 6 2 8 2 8H4s2-2 2-8" />
      <path d="M10 21a2 2 0 0 0 4 0" />
    </>
  ),
  flash: <path d="M13 2L4 13h7l-1 9 9-11h-7z" />,
  history: (
    <>
      <path d="M3 12a9 9 0 1 0 3-6.7L3 8" />
      <path d="M3 3v5h5" />
      <path d="M12 7v5l4 2" />
    </>
  ),
  trophy: (
    <>
      <path d="M8 4h8v5a4 4 0 0 1-8 0z" />
      <path d="M4 5h4v3a2 2 0 0 1-4 0zM16 5h4v3a2 2 0 0 1-4 0z" />
      <path d="M9 14h6v2a3 3 0 0 1-3 3 3 3 0 0 1-3-3zM7 21h10" />
    </>
  ),
  logout: (
    <>
      <path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4" />
      <path d="M16 17l5-5-5-5M21 12H9" />
    </>
  ),
  settings: (
    <>
      <circle cx="12" cy="12" r="3" />
      <path d="M19.4 15a1.7 1.7 0 0 0 .34 1.87l.06.06a2 2 0 1 1-2.83 2.83l-.06-.06a1.7 1.7 0 0 0-1.87-.34 1.7 1.7 0 0 0-1 1.55V21a2 2 0 0 1-4 0v-.09a1.7 1.7 0 0 0-1-1.55 1.7 1.7 0 0 0-1.87.34l-.06.06a2 2 0 1 1-2.83-2.83l.06-.06a1.7 1.7 0 0 0 .34-1.87 1.7 1.7 0 0 0-1.55-1H3a2 2 0 0 1 0-4h.09a1.7 1.7 0 0 0 1.55-1 1.7 1.7 0 0 0-.34-1.87l-.06-.06a2 2 0 1 1 2.83-2.83l.06.06a1.7 1.7 0 0 0 1.87.34h0a1.7 1.7 0 0 0 1-1.55V3a2 2 0 0 1 4 0v.09a1.7 1.7 0 0 0 1 1.55h0a1.7 1.7 0 0 0 1.87-.34l.06-.06a2 2 0 1 1 2.83 2.83l-.06.06a1.7 1.7 0 0 0-.34 1.87v0a1.7 1.7 0 0 0 1.55 1H21a2 2 0 0 1 0 4h-.09a1.7 1.7 0 0 0-1.55 1z" />
    </>
  ),
  scale: (
    <>
      <path d="M3 7l9-4 9 4M3 7v3l9 4 9-4V7M12 10v11M5 14v7h14v-7" />
    </>
  ),
  trending: (
    <>
      <path d="M3 17l6-6 4 4 8-8" />
      <path d="M14 7h7v7" />
    </>
  ),
  x: <path d="M18 6L6 18M6 6l12 12" />,
  hash: <path d="M9 4l-2 16M17 4l-2 16M4 9h16M3 15h16" />,
  eye: (
    <>
      <path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z" />
      <circle cx="12" cy="12" r="3" />
    </>
  ),
  eyeOff: (
    <>
      <path d="M17.94 17.94A10.07 10.07 0 0 1 12 20c-7 0-11-8-11-8a18.45 18.45 0 0 1 5.06-5.94M9.9 4.24A9.12 9.12 0 0 1 12 4c7 0 11 8 11 8a18.5 18.5 0 0 1-2.16 3.19m-6.72-1.07a3 3 0 1 1-4.24-4.24" />
      <path d="M1 1l22 22" />
    </>
  ),
  chevron: <path d="M6 9l6 6 6-6" />,
  trash: (
    <>
      <path d="M3 6h18" />
      <path d="M8 6V4a1 1 0 0 1 1-1h6a1 1 0 0 1 1 1v2" />
      <path d="M19 6l-1 14a2 2 0 0 1-2 2H8a2 2 0 0 1-2-2L5 6" />
      <path d="M10 11v6M14 11v6" />
    </>
  ),
}

interface IconProps extends Omit<SVGProps<SVGSVGElement>, 'name' | 'stroke'> {
  name: IconName
  size?: number
  stroke?: number
}

export function Icon({ name, size = 18, stroke = 1.8, ...rest }: IconProps) {
  return (
    <svg
      viewBox="0 0 24 24"
      width={size}
      height={size}
      fill="none"
      stroke="currentColor"
      strokeWidth={stroke}
      strokeLinecap="round"
      strokeLinejoin="round"
      {...rest}
    >
      {PATHS[name] ?? null}
    </svg>
  )
}
