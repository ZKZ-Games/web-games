export type Input = {
  keyDown: (code: string) => boolean
  keyPressed: (code: string) => boolean
  pointer: { x: number; y: number; down: boolean; pressed: boolean; released: boolean }
  update: () => void
  destroy: () => void
}

export function createInput(target: HTMLElement): Input {
  const keysDown = new Set<string>()
  const keysPressed = new Set<string>()
  const pointer = { x: 0, y: 0, down: false, pressed: false, released: false }

  const onKeyDown = (e: KeyboardEvent) => {
    if (!keysDown.has(e.code)) keysPressed.add(e.code)
    keysDown.add(e.code)
    if (e.code === "Space") e.preventDefault()
  }
  const onKeyUp = (e: KeyboardEvent) => {
    keysDown.delete(e.code)
  }
  const loc = (e: PointerEvent) => {
    const r = target.getBoundingClientRect()
    pointer.x = e.clientX - r.left
    pointer.y = e.clientY - r.top
  }
  const onDown = (e: PointerEvent) => {
    loc(e)
    pointer.down = true
    pointer.pressed = true
    target.setPointerCapture(e.pointerId)
  }
  const onMove = (e: PointerEvent) => {
    loc(e)
  }
  const onUp = (e: PointerEvent) => {
    loc(e)
    pointer.down = false
    pointer.released = true
  }

  window.addEventListener("keydown", onKeyDown)
  window.addEventListener("keyup", onKeyUp)
  target.addEventListener("pointerdown", onDown)
  target.addEventListener("pointermove", onMove)
  target.addEventListener("pointerup", onUp)
  target.addEventListener("pointercancel", onUp)

  return {
    keyDown: (code) => keysDown.has(code),
    keyPressed: (code) => keysPressed.has(code),
    pointer,
    update() {
      keysPressed.clear()
      pointer.pressed = false
      pointer.released = false
    },
    destroy() {
      window.removeEventListener("keydown", onKeyDown)
      window.removeEventListener("keyup", onKeyUp)
      target.removeEventListener("pointerdown", onDown)
      target.removeEventListener("pointermove", onMove)
      target.removeEventListener("pointerup", onUp)
      target.removeEventListener("pointercancel", onUp)
    },
  }
}
