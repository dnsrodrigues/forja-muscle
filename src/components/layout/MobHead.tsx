import type { ReactNode } from 'react'

interface MobHeadProps {
  /** Texto pequeno acima do título, ex: "Qui · 8 jun" */
  over?: string
  /** Título principal em Bebas, ex: "BOM DIA, DENIS" */
  title: string
  /** Elemento opcional à direita (avatar, botão +, etc.) */
  right?: ReactNode
}

/**
 * Header padrão das páginas mobile.
 * Substituição do <Topbar> quando isMobile === true.
 */
export function MobHead({ over, title, right }: MobHeadProps) {
  return (
    <div className="mob-head">
      <div className="mob-head-left">
        {over && <div className="mob-head-over">{over}</div>}
        <h1 className="mob-head-title">{title}</h1>
      </div>
      {right && (
        <div style={{ flexShrink: 0, display: 'flex', alignItems: 'center' }}>
          {right}
        </div>
      )}
    </div>
  )
}
