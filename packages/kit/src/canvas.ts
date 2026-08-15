export type CanvasApp = {
  canvas: HTMLCanvasElement
  ctx: CanvasRenderingContext2D
  width: number
  height: number
  dpr: number
  clear: (color?: string) => void
  resize: () => void
  destroy: () => void
}

export function createCanvas(parent: HTMLElement, options?: { background?: string }): CanvasApp {
  const canvas = document.createElement("canvas")
  canvas.style.display = "block"
  canvas.style.width = "100%"
  canvas.style.height = "100%"
  canvas.style.touchAction = "none"
  parent.appendChild(canvas)

  const ctx = canvas.getContext("2d")
  if (!ctx) throw new Error("2d context unavailable")

  const app: CanvasApp = {
    canvas,
    ctx,
    width: 0,
    height: 0,
    dpr: 1,
    clear(color) {
      ctx.setTransform(app.dpr, 0, 0, app.dpr, 0, 0)
      ctx.fillStyle = color ?? options?.background ?? "#000"
      ctx.fillRect(0, 0, app.width, app.height)
    },
    resize() {
      const dpr = Math.min(window.devicePixelRatio || 1, 2)
      const w = parent.clientWidth || window.innerWidth
      const h = parent.clientHeight || window.innerHeight
      app.dpr = dpr
      app.width = w
      app.height = h
      canvas.width = Math.floor(w * dpr)
      canvas.height = Math.floor(h * dpr)
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0)
    },
    destroy() {
      canvas.remove()
    },
  }

  app.resize()
  window.addEventListener("resize", app.resize)
  const origDestroy = app.destroy
  app.destroy = () => {
    window.removeEventListener("resize", app.resize)
    origDestroy()
  }
  return app
}
