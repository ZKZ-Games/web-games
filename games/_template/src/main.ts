import { createCanvas, createInput, createLoop } from "@web-games/kit"

const TITLE = "__GAME_TITLE__"
const parent = document.querySelector("#app")
if (!(parent instanceof HTMLElement)) throw new Error("missing #app")

const view = createCanvas(parent, { background: "#0b0d12" })
const input = createInput(view.canvas)
let time = 0

const loop = createLoop((dt) => {
  time += dt
  view.clear()
  const { ctx, width, height } = view
  ctx.fillStyle = "#e0fbfc"
  ctx.font = "700 42px ui-sans-serif, system-ui, sans-serif"
  ctx.textAlign = "center"
  ctx.fillText(TITLE, width / 2, height / 2 - 12)
  ctx.fillStyle = "#7d8597"
  ctx.font = "500 16px ui-sans-serif, system-ui, sans-serif"
  ctx.fillText("hold anywhere  ·  this is a blank game", width / 2, height / 2 + 24)
  if (input.pointer.down) {
    ctx.strokeStyle = "#ee6c4d"
    ctx.lineWidth = 2
    ctx.beginPath()
    ctx.arc(input.pointer.x, input.pointer.y, 18 + Math.sin(time * 8) * 3, 0, Math.PI * 2)
    ctx.stroke()
  }
  input.update()
})

loop.start()
