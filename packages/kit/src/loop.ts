export type Tick = (dt: number) => void

export type Loop = {
  start: () => void
  stop: () => void
  readonly running: boolean
}

export function createLoop(tick: Tick, options?: { maxDt?: number }): Loop {
  const maxDt = options?.maxDt ?? 0.05
  let running = false
  let raf = 0
  let last = 0

  const frame = (now: number) => {
    if (!running) return
    const dt = Math.min(maxDt, (now - last) / 1000)
    last = now
    tick(dt)
    raf = requestAnimationFrame(frame)
  }

  return {
    start() {
      if (running) return
      running = true
      last = performance.now()
      raf = requestAnimationFrame(frame)
    },
    stop() {
      running = false
      cancelAnimationFrame(raf)
    },
    get running() {
      return running
    },
  }
}
