import { onBeforeUnmount, onMounted, readonly, ref } from 'vue'

type LockableScreenOrientation = ScreenOrientation & {
  lock?: (orientation: 'landscape') => Promise<void>
  unlock?: () => void
}

type LegacyOrientationWindow = Window & {
  orientation?: number
}

const detectLandscape = () => {
  if (typeof window === 'undefined') return false

  const viewportPairs = [
    [window.visualViewport?.width, window.visualViewport?.height],
    [window.innerWidth, window.innerHeight],
    [document.documentElement.clientWidth, document.documentElement.clientHeight]
  ]

  if (viewportPairs.some(([width, height]) => Number(width) > Number(height))) return true

  const currentOrientation = screen.orientation
  if (currentOrientation?.type?.startsWith('landscape')) return true

  const angle = currentOrientation?.angle ?? (window as LegacyOrientationWindow).orientation
  return Math.abs(Number(angle)) === 90
}

export const useLandscapeScreen = () => {
  const orientation = screen.orientation as LockableScreenOrientation | undefined
  const isLandscape = ref(detectLandscape())
  const refreshTimers = new Set<number>()

  const refreshLandscape = () => {
    isLandscape.value = detectLandscape()
  }

  const refreshAfterViewportChange = () => {
    refreshLandscape()
    for (const delay of [100, 350]) {
      const timer = window.setTimeout(() => {
        refreshTimers.delete(timer)
        refreshLandscape()
      }, delay)
      refreshTimers.add(timer)
    }
  }

  onMounted(() => {
    refreshAfterViewportChange()
    window.addEventListener('resize', refreshAfterViewportChange, { passive: true })
    window.addEventListener('orientationchange', refreshAfterViewportChange, { passive: true })
    window.visualViewport?.addEventListener('resize', refreshAfterViewportChange, { passive: true })
    orientation?.addEventListener?.('change', refreshAfterViewportChange)

    if (!orientation?.lock || isLandscape.value) return
    void orientation.lock('landscape').catch(() => undefined).finally(refreshAfterViewportChange)
  })

  onBeforeUnmount(() => {
    window.removeEventListener('resize', refreshAfterViewportChange)
    window.removeEventListener('orientationchange', refreshAfterViewportChange)
    window.visualViewport?.removeEventListener('resize', refreshAfterViewportChange)
    orientation?.removeEventListener?.('change', refreshAfterViewportChange)
    refreshTimers.forEach((timer) => window.clearTimeout(timer))
    refreshTimers.clear()
    orientation?.unlock?.()
  })

  return {
    isLandscape: readonly(isLandscape)
  }
}
