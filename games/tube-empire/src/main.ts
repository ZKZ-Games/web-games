import { createCanvas, createInput, createLoop } from '@web-games/kit'
import { draw, hitRect, laptopPoint, layout, pickPress } from './draw'
import { buy, createState, tap, tick } from './state'

const parent = document.querySelector('#app')
if (!(parent instanceof HTMLElement)) throw new Error('missing #app')

const view = createCanvas(parent, { background: '#120c14' })
const input = createInput(view.canvas)
const state = createState()

function toView(localX: number, localY: number): { x: number; y: number } {
  const rect = view.canvas.getBoundingClientRect()
  const rw = rect.width || view.width || 1
  const rh = rect.height || view.height || 1
  return {
    x: (localX / rw) * view.width,
    y: (localY / rh) * view.height,
  }
}

function doTap() {
  const L = layout(view.width, view.height, state)
  const at = laptopPoint(L)
  tap(state, at.x, at.y)
}

view.canvas.addEventListener(
  'wheel',
  (e) => {
    const rect = view.canvas.getBoundingClientRect()
    const { x, y } = toView(e.clientX - rect.left, e.clientY - rect.top)
    const L = layout(view.width, view.height, state)
    if (!hitRect(L.shop, x, y)) return
    e.preventDefault()
    state.shopScroll += e.deltaY
  },
  { passive: false },
)

const loop = createLoop((dt) => {
  const L = layout(view.width, view.height, state)
  if (input.keyPressed('Space')) doTap()
  if (input.pointer.pressed) {
    const at = toView(input.pointer.x, input.pointer.y)
    const press = pickPress(L, at.x, at.y)
    if (press.action === 'buy') buy(state, press.row.kind, press.row.id)
    else if (press.action === 'tap') doTap()
  }
  tick(state, dt)
  draw(view, state, L)
  input.update()
})

loop.start()
