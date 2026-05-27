import { useState, useCallback } from 'react'
import Cropper from 'react-easy-crop'
import type { Point, Area } from 'react-easy-crop'
import { motion } from 'motion/react'
import { getCroppedImg } from '../../utils/cropImage'

interface AvatarCropModalProps {
  imageSrc: string
  onConfirm: (blob: Blob) => void
  onClose: () => void
  isLoading?: boolean
}

export function AvatarCropModal({ imageSrc, onConfirm, onClose, isLoading }: AvatarCropModalProps) {
  const [crop, setCrop] = useState<Point>({ x: 0, y: 0 })
  const [zoom, setZoom] = useState(1)
  const [croppedAreaPixels, setCroppedAreaPixels] = useState<Area | null>(null)

  const onCropComplete = useCallback((_area: Area, areaPixels: Area) => {
    setCroppedAreaPixels(areaPixels)
  }, [])

  async function handleConfirm() {
    if (!croppedAreaPixels) return
    const blob = await getCroppedImg(imageSrc, croppedAreaPixels)
    if (blob) onConfirm(blob)
  }

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      style={{
        position: 'fixed',
        inset: 0,
        zIndex: 1000,
        background: 'rgba(6,7,26,0.97)',
        display: 'flex',
        flexDirection: 'column',
      }}
      role="dialog"
      aria-modal="true"
      aria-label="Recortar foto de perfil"
    >
      {/* ── Cabeçalho ── */}
      <div
        style={{
          padding: '14px 20px',
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          borderBottom: '1px solid var(--border)',
          flexShrink: 0,
        }}
      >
        <button
          className="btn ghost"
          onClick={onClose}
          disabled={isLoading}
          aria-label="Cancelar recorte"
        >
          <CancelIcon /> Cancelar
        </button>

        <span
          style={{
            fontFamily: 'var(--f-mono)',
            fontSize: 9,
            letterSpacing: '0.15em',
            color: 'var(--fg-3)',
            textTransform: 'uppercase',
          }}
        >
          FOTO DE PERFIL
        </span>

        <button
          className="btn primary"
          onClick={() => void handleConfirm()}
          disabled={isLoading || !croppedAreaPixels}
          aria-label="Confirmar recorte"
        >
          {isLoading ? 'Salvando…' : 'Confirmar'} <CheckIcon />
        </button>
      </div>

      {/* ── Área de recorte ── */}
      <div style={{ flex: 1, position: 'relative' }}>
        <Cropper
          image={imageSrc}
          crop={crop}
          zoom={zoom}
          aspect={1}
          cropShape="round"
          showGrid={false}
          onCropChange={setCrop}
          onZoomChange={setZoom}
          onCropComplete={onCropComplete}
          style={{
            containerStyle: { background: 'transparent' },
            cropAreaStyle: {
              border: '2.5px solid var(--accent)',
              boxShadow: '0 0 0 9999px rgba(6,7,26,0.72)',
            },
          }}
        />

        {/* Glow decorativo ao redor do círculo */}
        <div
          aria-hidden="true"
          style={{
            position: 'absolute',
            top: '50%',
            left: '50%',
            transform: 'translate(-50%,-50%)',
            width: 320,
            height: 320,
            borderRadius: '50%',
            boxShadow: '0 0 60px 8px rgba(108,142,247,0.18)',
            pointerEvents: 'none',
          }}
        />
      </div>

      {/* ── Controles ── */}
      <div
        style={{
          padding: '18px 24px 28px',
          background: 'var(--surface)',
          borderTop: '1px solid var(--border)',
          flexShrink: 0,
        }}
      >
        {/* Slider de zoom */}
        <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
          <ZoomOutIcon />
          <input
            type="range"
            min={1}
            max={3}
            step={0.01}
            value={zoom}
            onChange={(e) => setZoom(Number(e.target.value))}
            className="avatar-zoom-slider"
            aria-label="Zoom da foto"
            style={{ flex: 1 }}
          />
          <ZoomInIcon />
          <span
            style={{
              fontFamily: 'var(--f-mono)',
              fontSize: 11,
              color: 'var(--accent)',
              minWidth: 36,
              textAlign: 'right',
            }}
          >
            {zoom.toFixed(1)}×
          </span>
        </div>

        {/* Dica */}
        <div
          style={{
            marginTop: 12,
            fontFamily: 'var(--f-mono)',
            fontSize: 9,
            color: 'var(--fg-3)',
            letterSpacing: '0.12em',
            textAlign: 'center',
            textTransform: 'uppercase',
          }}
        >
          ARRASTE PARA REPOSICIONAR · SLIDER PARA ZOOM
        </div>
      </div>
    </motion.div>
  )
}

// ── Ícones SVG inline ──────────────────────────────────────────────────────────

function CheckIcon() {
  return (
    <svg width={14} height={14} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2.5} strokeLinecap="round" strokeLinejoin="round">
      <polyline points="20 6 9 17 4 12" />
    </svg>
  )
}

function CancelIcon() {
  return (
    <svg width={14} height={14} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round">
      <line x1="18" y1="6" x2="6" y2="18" /><line x1="6" y1="6" x2="18" y2="18" />
    </svg>
  )
}

function ZoomOutIcon() {
  return (
    <svg width={16} height={16} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round" style={{ color: 'var(--fg-3)', flexShrink: 0 }}>
      <circle cx="11" cy="11" r="8" /><line x1="21" y1="21" x2="16.65" y2="16.65" /><line x1="8" y1="11" x2="14" y2="11" />
    </svg>
  )
}

function ZoomInIcon() {
  return (
    <svg width={16} height={16} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round" style={{ color: 'var(--fg-3)', flexShrink: 0 }}>
      <circle cx="11" cy="11" r="8" /><line x1="21" y1="21" x2="16.65" y2="16.65" /><line x1="11" y1="8" x2="11" y2="14" /><line x1="8" y1="11" x2="14" y2="11" />
    </svg>
  )
}
