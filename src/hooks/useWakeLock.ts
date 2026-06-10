import { useEffect, useRef } from 'react'

/**
 * Mantém a tela acesa enquanto `enabled` for true (Screen Wake Lock API).
 *
 * - Degradação graciosa: se o navegador não suportar, não faz nada.
 * - Reaquire o lock quando a aba volta a ficar visível (o iOS libera o lock
 *   automaticamente ao sair/bloquear).
 */
export function useWakeLock(enabled: boolean): void {
  const sentinelRef = useRef<WakeLockSentinel | null>(null)

  useEffect(() => {
    if (!enabled) return
    if (!('wakeLock' in navigator)) return

    let released = false

    async function acquire() {
      try {
        sentinelRef.current = await navigator.wakeLock.request('screen')
      } catch {
        // Silencioso: aba não visível, sem permissão, etc.
      }
    }

    function onVisibility() {
      if (document.visibilityState === 'visible' && !released) void acquire()
    }

    void acquire()
    document.addEventListener('visibilitychange', onVisibility)

    return () => {
      released = true
      document.removeEventListener('visibilitychange', onVisibility)
      void sentinelRef.current?.release().catch(() => {})
      sentinelRef.current = null
    }
  }, [enabled])
}
