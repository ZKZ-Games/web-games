import { clamp, createCanvas, createInput, createLoop, dist, normalize } from "@web-games/kit"

const parent = document.querySelector("#app")
if (!(parent instanceof HTMLElement)) throw new Error("missing #app")

const view = createCanvas(parent, { background: "#0b0d12" })
const input = createInput(view.canvas)

type Pad = { angle: number; taken: boolean }
type Mode = "ready" | "fly" | "win"

const planetR = 74
const marbleR = 7
const padR = 15
const gravity = 4550000
const maxLaunch = 440
const landSpeed = 140
const padCatch = padR + marbleR + 8

const pads: Pad[] = []
const stars: { x: number; y: number; a: number }[] = []
const trail: { x: number; y: number }[] = []

let mx = 0
let my = 0
let vx = 0
let vy = 0
let charge = 0
let mode: Mode = "ready"
let home = 0
let score = 0
let rounds = 0
let message = ""
let msgT = 0

function resetPads() {
  pads.length = 0
  pads.push(
    { angle: Math.PI * 0.5, taken: true },
    { angle: -0.45, taken: false },
    { angle: Math.PI + 0.65, taken: false },
    { angle: -2.35, taken: false },
  )
  score = 0
  sit(0)
  mode = "ready"
  message = "hold to charge   release to launch"
  msgT = 4
}

function padPos(i: number) {
  const r = planetR + 20
  return {
    x: view.width / 2 + Math.cos(pads[i].angle) * r,
    y: view.height / 2 + Math.sin(pads[i].angle) * r,
  }
}

function sit(i: number) {
  const p = padPos(i)
  mx = p.x
  my = p.y
  vx = 0
  vy = 0
  home = i
  charge = 0
  trail.length = 0
}

function launch() {
  const power = charge
  charge = 0
  if (power < 0.08) return
  const n = normalize(input.pointer.x - mx, input.pointer.y - my)
  vx = n.x * power * maxLaunch
  vy = n.y * power * maxLaunch
  mode = "fly"
}

function fallIn() {
  const n = normalize(view.width / 2 - mx, view.height / 2 - my)
  return n.x * vx + n.y * vy
}

function tryLand() {
  const soft = Math.abs(fallIn())
  for (let i = 0; i < pads.length; i++) {
    const p = padPos(i)
    if (dist(mx, my, p.x, p.y) < padCatch && soft < landSpeed) {
      if (!pads[i].taken) {
        pads[i].taken = true
        score += 1
        message = "landed"
        msgT = 1
      }
      sit(i)
      mode = "ready"
      if (pads.every((p) => p.taken)) {
        mode = "win"
        rounds += 1
        message = "orbit complete"
        msgT = 8
      }
      return true
    }
  }
  return false
}

function crash() {
  message = "too fast"
  msgT = 1.2
  sit(home)
  mode = "ready"
}

function seedStars() {
  if (stars.length) return
  for (let i = 0; i < 70; i++) {
    stars.push({ x: Math.random(), y: Math.random(), a: 0.15 + Math.random() * 0.55 })
  }
}

resetPads()
seedStars()

const loop = createLoop((dt) => {
  const holding = input.pointer.down || input.keyDown("Space")
  if (mode === "ready") {
    if (holding) charge = clamp(charge + dt * 0.85, 0, 1)
    else if (charge > 0) launch()
  } else if (mode === "fly") {
    const cx = view.width / 2
    const cy = view.height / 2
    const n = normalize(cx - mx, cy - my)
    const r2 = Math.max((cx - mx) ** 2 + (cy - my) ** 2, 36)
    const acc = gravity / r2
    vx += n.x * acc * dt
    vy += n.y * acc * dt
    mx += vx * dt
    my += vy * dt
    trail.push({ x: mx, y: my })
    if (trail.length > 48) trail.shift()
    const leftHome = dist(mx, my, padPos(home).x, padPos(home).y) > padCatch + 10
    if (leftHome) tryLand()
    if (mode === "fly" && dist(mx, my, cx, cy) < planetR + marbleR) {
      if (!tryLand()) {
        const inward = fallIn()
        if (inward > landSpeed) crash()
        else {
          const s = normalize(cx - mx, cy - my)
          if (inward > 0) {
            vx -= s.x * inward
            vy -= s.y * inward
          }
          const out = normalize(mx - cx, my - cy)
          mx = cx + out.x * (planetR + marbleR)
          my = cy + out.y * (planetR + marbleR)
        }
      }
    }
    if (mode === "fly" && (mx < -50 || my < -50 || mx > view.width + 50 || my > view.height + 50)) {
      message = "lost to the dark"
      msgT = 1.4
      sit(home)
      mode = "ready"
    }
  } else if (mode === "win" && input.pointer.pressed) {
    resetPads()
  }
  msgT = Math.max(0, msgT - dt)
  draw()
  input.update()
})

function draw() {
  const { ctx, width, height } = view
  const cx = width / 2
  const cy = height / 2
  view.clear()
  for (const s of stars) {
    ctx.fillStyle = `rgba(224, 251, 252, ${s.a})`
    ctx.fillRect(s.x * width, s.y * height, 1.5, 1.5)
  }
  const g = ctx.createRadialGradient(cx - 16, cy - 18, 8, cx, cy, planetR)
  g.addColorStop(0, "#98c1d9")
  g.addColorStop(0.45, "#3d5a80")
  g.addColorStop(1, "#243044")
  ctx.fillStyle = g
  ctx.beginPath()
  ctx.arc(cx, cy, planetR, 0, Math.PI * 2)
  ctx.fill()
  ctx.strokeStyle = "#5c7a9a"
  ctx.lineWidth = 2
  ctx.stroke()
  for (let i = 0; i < pads.length; i++) {
    const p = padPos(i)
    ctx.fillStyle = pads[i].taken ? "#6ee7b7" : "#e0fbfc"
    ctx.beginPath()
    ctx.arc(p.x, p.y, padR, 0, Math.PI * 2)
    ctx.fill()
    ctx.fillStyle = "#0b0d12"
    ctx.beginPath()
    ctx.arc(p.x, p.y, padR - 5, 0, Math.PI * 2)
    ctx.fill()
  }
  ctx.strokeStyle = "rgba(238, 108, 77, 0.45)"
  ctx.lineWidth = 2
  ctx.beginPath()
  for (let i = 0; i < trail.length; i++) {
    if (i === 0) ctx.moveTo(trail[i].x, trail[i].y)
    else ctx.lineTo(trail[i].x, trail[i].y)
  }
  ctx.stroke()
  ctx.fillStyle = "#ee6c4d"
  ctx.beginPath()
  ctx.arc(mx, my, marbleR, 0, Math.PI * 2)
  ctx.fill()
  ctx.fillStyle = "#f4a261"
  ctx.beginPath()
  ctx.arc(mx - 2, my - 2, 2.2, 0, Math.PI * 2)
  ctx.fill()
  if (mode === "ready" && charge > 0) {
    ctx.strokeStyle = "#ee6c4d"
    ctx.lineWidth = 3
    ctx.beginPath()
    ctx.arc(mx, my, marbleR + 10, -Math.PI / 2, -Math.PI / 2 + charge * Math.PI * 2)
    ctx.stroke()
    const n = normalize(input.pointer.x - mx, input.pointer.y - my)
    ctx.strokeStyle = "rgba(224, 251, 252, 0.35)"
    ctx.lineWidth = 1.5
    ctx.beginPath()
    ctx.moveTo(mx, my)
    ctx.lineTo(mx + n.x * (40 + charge * 70), my + n.y * (40 + charge * 70))
    ctx.stroke()
  }
  ctx.fillStyle = "#e0fbfc"
  ctx.font = "700 28px ui-sans-serif, system-ui, sans-serif"
  ctx.textAlign = "left"
  ctx.fillText("ORBIT", 28, 44)
  ctx.fillStyle = "#7d8597"
  ctx.font = "500 13px ui-sans-serif, system-ui, sans-serif"
  ctx.fillText("pads " + score + "/" + pads.length + "    rounds " + rounds, 28, 66)
  if (msgT > 0 || mode === "win") {
    ctx.fillStyle = "#e0fbfc"
    ctx.font = "500 16px ui-sans-serif, system-ui, sans-serif"
    ctx.textAlign = "center"
    ctx.fillText(mode === "win" ? "orbit complete  ·  click for another" : message, width / 2, height - 36)
  }
}

loop.start()
