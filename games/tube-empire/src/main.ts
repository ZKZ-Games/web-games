import { createCanvas, createInput, createLoop } from '@web-games/kit'
import { draw, hitRect, hitTap, laptopPoint, layout } from './draw'
import { buy, createState, tap, tick } from './state'

const parent = document.querySelector('#app')
if (!(parent instanceof HTMLElement)) throw new Error('missing #app')

const view = createCanvas(parent, { background: '#120c14' })
const input = createInput(view.canvas)
const state = createState()

function doTap() {
  const L = layout(view.width, view.height)
  const at = laptopPoint(L)
  tap(state, at.x, at.y)
}

const loop = createLoop((dt) => {
  const L = layout(view.width, view.height)
  if (input.keyPressed('Space')) doTap()
  if (input.pointer.pressed) {
    const { x, y } = input.pointer
    const row = L.rows.find((r) => hitRect(r.buy, x, y))
    if (row) buy(state, row.id)
    else if (hitTap(L, x, y) || hitRect(L.room, x, y)) doTap()
  }
  tick(state, dt)
  draw(view, state, L)
  input.update()
})

loop.start()
