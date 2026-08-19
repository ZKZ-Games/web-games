import { createCanvas, createInput, createLoop } from '@web-games/kit'
import { draw, hitRect, hitTap, laptopPoint, layout } from './draw'
import { buy, createState, tap, tick } from './state'

const parent = document.querySelector('#app')
if (!(parent instanceof HTMLElement)) throw new Error('missing #app')

const view = createCanvas(parent, { background: '#120c14' })
const input = createInput(view.canvas)
const state = createState()

function doTap() {
  const L = layout(view.width, view.height, state)
  const at = laptopPoint(L)
  tap(state, at.x, at.y)
}

view.canvas.addEventListener(
  'wheel',
  (e) => {
    const rect = view.canvas.getBoundingClientRect()
    const x = e.clientX - rect.left
    const y = e.clientY - rect.top
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
    const { x, y } = input.pointer
    const row = L.rows.find(
      (r) =>
        !r.mystery &&
        hitRect(r.buy, x, y) &&
        hitRect(L.shopList, r.buy.x + r.buy.w / 2, r.buy.y + r.buy.h / 2),
    )
    if (row) buy(state, row.kind, row.id)
    else if (hitTap(L, x, y) || hitRect(L.room, x, y)) doTap()
  }
  tick(state, dt)
  draw(view, state, L)
  input.update()
})

loop.start()
