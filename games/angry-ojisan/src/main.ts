import { createCanvas, createInput, createLoop } from '@web-games/kit'
import { drawGame } from './draw'
import {
  assignPack,
  createState,
  hitUncle,
  inBox,
  layout,
  resetRound,
  tapUncle,
  tick,
} from './state'

const parent = document.querySelector('#app')
if (!(parent instanceof HTMLElement)) throw new Error('missing #app')

const view = createCanvas(parent, { background: '#3a2212' })
const input = createInput(view.canvas)
const state = createState()
assignPack(state, layout(view.width, view.height).box, true)

const loop = createLoop((dt) => {
  const L = layout(view.width, view.height)
  tick(state, dt, L.box)

  const hover = hitUncle(state, input.pointer.x, input.pointer.y)
  if (input.pointer.pressed) {
    if (state.phase === 'over') {
      if (state.overAge > 0.5 && inBox(L.box, input.pointer.x, input.pointer.y)) {
        resetRound(state, L.box)
      }
    } else if (hover) {
      tapUncle(state, hover)
    }
  }

  view.clear()
  drawGame(view, state, L, hover && state.phase === 'play' ? hover.id : -1)
  input.update()
})

loop.start()
