import type { ObjectDirective } from 'vue'
import './smartOtdrOverlay.scss'

const cleanups = new WeakMap<HTMLElement, () => void>()

/** Keep device overlays inside their actual App frame, including desktop previews. */
export const vSmartOtdrOverlay: ObjectDirective<HTMLElement, boolean | undefined> = {
  mounted: bind,
  updated(el, binding) {
    if (binding.value === binding.oldValue) return
    cleanups.get(el)?.()
    bind(el, binding)
  },
  beforeUnmount(el) { cleanups.get(el)?.() }
}

function bind(el: HTMLElement, binding: { value?: boolean }) {
  if (binding.value === false) return
  const frame = el.closest<HTMLElement>('.app-container')
  if (!frame) return
  let tick = 0
  const update = () => {
    const rect = frame.getBoundingClientRect()
    const viewport = window.visualViewport
    const left = Math.max(rect.left, viewport?.offsetLeft || 0)
    const top = Math.max(rect.top, viewport?.offsetTop || 0)
    const right = Math.min(rect.right, (viewport?.offsetLeft || 0) + (viewport?.width || innerWidth))
    const bottom = Math.min(rect.bottom, (viewport?.offsetTop || 0) + (viewport?.height || innerHeight))
    for (const [key, value] of Object.entries({ left, top, width: Math.max(0, right-left), height: Math.max(0, bottom-top) })) {
      el.style.setProperty(`--smart-overlay-${key}`, `${value}px`)
    }
    el.style.setProperty('--smart-overlay-radius', getComputedStyle(frame).borderRadius)
    el.classList.add('smart-otdr-overlay-bound')
  }
  const schedule = () => { cancelAnimationFrame(tick); tick = requestAnimationFrame(update) }
  const observer = new ResizeObserver(schedule)
  observer.observe(frame)
  window.addEventListener('resize', schedule)
  window.addEventListener('scroll', schedule, true)
  window.visualViewport?.addEventListener('resize', schedule)
  window.visualViewport?.addEventListener('scroll', schedule)
  update()
  cleanups.set(el, () => {
    observer.disconnect(); cancelAnimationFrame(tick)
    window.removeEventListener('resize', schedule)
    window.removeEventListener('scroll', schedule, true)
    window.visualViewport?.removeEventListener('resize', schedule)
    window.visualViewport?.removeEventListener('scroll', schedule)
    el.classList.remove('smart-otdr-overlay-bound')
    for (const key of ['left', 'top', 'width', 'height', 'radius']) el.style.removeProperty(`--smart-overlay-${key}`)
    cleanups.delete(el)
  })
}
