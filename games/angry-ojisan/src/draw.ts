import type { CanvasApp } from '@web-games/kit'
import {
  ANGRY_YELL,
  FACE_COUNT,
  living,
  type Layout,
  type State,
  type Uncle,
} from './state'

const WOOD = '#3a2212'
const WOOD_DEEP = '#24140b'
const CRATE = '#8a5528'
const CRATE_LIGHT = '#c4894a'
const CRATE_INK = '#4a2a12'
const CREAM = '#f6e6c8'
const INK = '#1c1008'

function roundRect(
  ctx: CanvasRenderingContext2D,
  x: number,
  y: number,
  w: number,
  h: number,
  rad: number,
) {
  const r = Math.min(rad, w / 2, h / 2)
  ctx.beginPath()
  ctx.moveTo(x + r, y)
  ctx.arcTo(x + w, y, x + w, y + h, r)
  ctx.arcTo(x + w, y + h, x, y + h, r)
  ctx.arcTo(x, y + h, x, y, r)
  ctx.arcTo(x, y, x + w, y, r)
  ctx.closePath()
}

export function drawTable(ctx: CanvasRenderingContext2D, w: number, h: number) {
  ctx.fillStyle = WOOD
  ctx.fillRect(0, 0, w, h)
  const plank = Math.max(36, h / 14)
  for (let i = 0; i * plank < h + plank; i++) {
    const y = i * plank
    ctx.fillStyle = i % 2 === 0 ? '#422616' : '#351e10'
    ctx.fillRect(0, y, w, plank - 1.5)
    ctx.strokeStyle = 'rgba(20, 8, 0, 0.28)'
    ctx.lineWidth = 1
    ctx.beginPath()
    ctx.moveTo(0, y + plank - 1)
    ctx.lineTo(w, y + plank - 1)
    ctx.stroke()
    ctx.strokeStyle = 'rgba(90, 50, 20, 0.18)'
    ctx.lineWidth = 1.1
    for (let k = 0; k < 5; k++) {
      const x0 = ((i * 97 + k * 173) % 200) - 20
      ctx.beginPath()
      ctx.moveTo(x0, y + 4)
      ctx.bezierCurveTo(
        x0 + w * 0.3,
        y + plank * 0.3,
        x0 + w * 0.6,
        y + plank * 0.7,
        x0 + w,
        y + plank - 6,
      )
      ctx.stroke()
    }
  }
  const vg = ctx.createRadialGradient(
    w * 0.5,
    h * 0.45,
    h * 0.1,
    w * 0.5,
    h * 0.5,
    h * 0.85,
  )
  vg.addColorStop(0, 'rgba(0,0,0,0)')
  vg.addColorStop(1, 'rgba(10,4,0,0.45)')
  ctx.fillStyle = vg
  ctx.fillRect(0, 0, w, h)
}

export function drawCrate(ctx: CanvasRenderingContext2D, L: Layout, hot = false) {
  const { box } = L
  ctx.save()
  ctx.shadowColor = 'rgba(0,0,0,0.45)'
  ctx.shadowBlur = 22
  ctx.shadowOffsetY = 10
  ctx.fillStyle = hot ? '#9a6030' : CRATE
  roundRect(ctx, box.x, box.y, box.w, box.h, Math.min(22, box.w * 0.05))
  ctx.fill()
  ctx.shadowBlur = 0
  ctx.shadowOffsetY = 0
  ctx.strokeStyle = CRATE_INK
  ctx.lineWidth = 5
  ctx.stroke()

  const inset = Math.min(box.w, box.h) * 0.035
  ctx.strokeStyle = CRATE_LIGHT
  ctx.lineWidth = 3
  roundRect(
    ctx,
    box.x + inset,
    box.y + inset,
    box.w - inset * 2,
    box.h - inset * 2,
    Math.min(16, box.w * 0.04),
  )
  ctx.stroke()

  ctx.strokeStyle = 'rgba(40, 18, 6, 0.28)'
  ctx.lineWidth = 2
  for (let i = 1; i < 4; i++) {
    const y = box.y + (box.h * i) / 4
    ctx.beginPath()
    ctx.moveTo(box.x + inset * 2, y)
    ctx.lineTo(box.x + box.w - inset * 2, y)
    ctx.stroke()
  }

  const nail = Math.max(3, box.w * 0.012)
  ctx.fillStyle = '#d8b56a'
  const nails = [
    [box.x + 14, box.y + 14],
    [box.x + box.w - 14, box.y + 14],
    [box.x + 14, box.y + box.h - 14],
    [box.x + box.w - 14, box.y + box.h - 14],
  ]
  for (const [nx, ny] of nails) {
    ctx.beginPath()
    ctx.arc(nx, ny, nail, 0, Math.PI * 2)
    ctx.fill()
  }
  ctx.restore()
}

export function drawOjisan(
  ctx: CanvasRenderingContext2D,
  u: Uncle,
  opts: { angry: boolean; hover: boolean; time: number },
) {
  const r = u.r
  const tilt = Math.sin(u.id * 12.7) * 0.07
  const bob = u.live && !opts.angry ? Math.sin(opts.time * 2.4 + u.id) * r * 0.04 : 0
  const madShake = opts.angry ? Math.sin(opts.time * 28) * r * 0.04 : 0
  ctx.save()
  ctx.translate(u.x + madShake, u.y + bob)
  ctx.rotate(u.angle + tilt)
  if (u.fly > 0) ctx.globalAlpha = Math.max(0, Math.min(1, u.fly / 0.25))
  if (opts.hover && u.live) {
    ctx.shadowColor = '#ffe7a8'
    ctx.shadowBlur = r * 0.55
  }

  const skin = opts.angry ? '#e24b3a' : '#e8b896'
  const skinDeep = opts.angry ? '#b83228' : '#d4956e'
  const hair = opts.angry ? '#1a0c08' : '#2b1a12'
  const ink = opts.angry ? '#2a0808' : '#2a1810'

  ctx.fillStyle = opts.angry ? '#7a1c1c' : '#3d5c7a'
  ctx.beginPath()
  ctx.ellipse(0, r * 0.95, r * 0.72, r * 0.28, 0, 0, Math.PI * 2)
  ctx.fill()
  ctx.fillStyle = opts.angry ? '#f0e6d4' : '#f3ead8'
  ctx.beginPath()
  ctx.moveTo(-r * 0.42, r * 0.72)
  ctx.lineTo(-r * 0.18, r * 1.05)
  ctx.lineTo(r * 0.18, r * 1.05)
  ctx.lineTo(r * 0.42, r * 0.72)
  ctx.closePath()
  ctx.fill()

  ctx.fillStyle = skinDeep
  ctx.beginPath()
  ctx.ellipse(-r * 0.78, r * 0.08, r * 0.18, r * 0.26, 0.1, 0, Math.PI * 2)
  ctx.ellipse(r * 0.78, r * 0.08, r * 0.18, r * 0.26, -0.1, 0, Math.PI * 2)
  ctx.fill()

  ctx.fillStyle = skin
  ctx.beginPath()
  ctx.arc(0, 0, r, 0, Math.PI * 2)
  ctx.fill()
  ctx.strokeStyle = skinDeep
  ctx.lineWidth = Math.max(1.5, r * 0.06)
  ctx.stroke()

  ctx.fillStyle = hair
  ctx.beginPath()
  ctx.ellipse(-r * 0.64, r * 0.1, r * 0.3, r * 0.58, 0.18, 0, Math.PI * 2)
  ctx.fill()
  ctx.beginPath()
  ctx.ellipse(r * 0.64, r * 0.1, r * 0.3, r * 0.58, -0.18, 0, Math.PI * 2)
  ctx.fill()
  ctx.beginPath()
  ctx.ellipse(0, r * 0.58, r * 0.74, r * 0.3, 0, 0, Math.PI * 2)
  ctx.fill()

  ctx.save()
  ctx.beginPath()
  ctx.arc(0, 0, r, 0, Math.PI * 2)
  ctx.clip()
  ctx.fillStyle = 'rgba(255,255,255,0.28)'
  ctx.beginPath()
  ctx.ellipse(-r * 0.16, -r * 0.38, r * 0.22, r * 0.1, -0.4, 0, Math.PI * 2)
  ctx.fill()
  ctx.restore()

  ctx.strokeStyle = ink
  ctx.lineCap = 'round'
  ctx.lineWidth = Math.max(2, r * 0.1)
  if (opts.angry) {
    ctx.beginPath()
    ctx.moveTo(-r * 0.46, -r * 0.22)
    ctx.lineTo(-r * 0.08, -r * 0.02)
    ctx.moveTo(r * 0.46, -r * 0.22)
    ctx.lineTo(r * 0.08, -r * 0.02)
    ctx.stroke()
  } else {
    ctx.beginPath()
    ctx.moveTo(-r * 0.42, -r * 0.1)
    ctx.lineTo(-r * 0.08, -r * 0.02)
    ctx.moveTo(r * 0.42, -r * 0.1)
    ctx.lineTo(r * 0.08, -r * 0.02)
    ctx.stroke()
  }

  ctx.fillStyle = ink
  if (opts.angry) {
    ctx.beginPath()
    ctx.ellipse(-r * 0.26, r * 0.02, r * 0.12, r * 0.14, 0, 0, Math.PI * 2)
    ctx.ellipse(r * 0.26, r * 0.02, r * 0.12, r * 0.14, 0, 0, Math.PI * 2)
    ctx.fill()
    ctx.fillStyle = '#fff6ea'
    ctx.beginPath()
    ctx.ellipse(-r * 0.23, -r * 0.02, r * 0.045, r * 0.05, 0, 0, Math.PI * 2)
    ctx.ellipse(r * 0.29, -r * 0.02, r * 0.045, r * 0.05, 0, 0, Math.PI * 2)
    ctx.fill()
  } else {
    ctx.beginPath()
    ctx.arc(-r * 0.26, r * 0.02, r * 0.075, 0, Math.PI * 2)
    ctx.arc(r * 0.26, r * 0.02, r * 0.075, 0, Math.PI * 2)
    ctx.fill()
  }

  ctx.fillStyle = skinDeep
  ctx.beginPath()
  ctx.moveTo(0, -r * 0.02)
  ctx.lineTo(-r * 0.08, r * 0.2)
  ctx.lineTo(r * 0.08, r * 0.2)
  ctx.closePath()
  ctx.fill()

  ctx.fillStyle = hair
  ctx.beginPath()
  ctx.ellipse(-r * 0.24, r * 0.28, r * 0.3, r * 0.13, -0.28, 0, Math.PI * 2)
  ctx.fill()
  ctx.beginPath()
  ctx.ellipse(r * 0.24, r * 0.28, r * 0.3, r * 0.13, 0.28, 0, Math.PI * 2)
  ctx.fill()

  ctx.strokeStyle = ink
  ctx.lineWidth = Math.max(2, r * 0.09)
  ctx.lineCap = 'round'
  if (opts.angry) {
    ctx.fillStyle = '#2a0808'
    ctx.beginPath()
    ctx.ellipse(0, r * 0.52, r * 0.28, r * 0.22, 0, 0, Math.PI * 2)
    ctx.fill()
    ctx.fillStyle = '#f2d2c4'
    ctx.beginPath()
    ctx.ellipse(0, r * 0.58, r * 0.18, r * 0.1, 0, 0, Math.PI * 2)
    ctx.fill()
  } else {
    ctx.beginPath()
    ctx.arc(0, r * 0.48, r * 0.22, 0.15 * Math.PI, 0.85 * Math.PI)
    ctx.stroke()
  }

  ctx.restore()
}

function drawBubble(
  ctx: CanvasRenderingContext2D,
  x: number,
  y: number,
  text: string,
  r: number,
  angry: boolean,
) {
  ctx.save()
  ctx.font = `700 ${Math.max(12, Math.min(18, r * 0.42))}px ui-sans-serif, system-ui, sans-serif`
  ctx.textAlign = 'center'
  ctx.textBaseline = 'middle'
  const padX = 10
  const w = Math.max(64, ctx.measureText(text).width + padX * 2)
  const h = Math.max(26, r * 0.55)
  const bx = x
  const by = y - r - h * 0.7
  ctx.fillStyle = angry ? '#fff1e8' : '#fffaf0'
  ctx.strokeStyle = angry ? '#8a2018' : CRATE_INK
  ctx.lineWidth = 2
  roundRect(ctx, bx - w / 2, by - h / 2, w, h, 10)
  ctx.fill()
  ctx.stroke()
  ctx.beginPath()
  ctx.moveTo(bx - 6, by + h / 2 - 1)
  ctx.lineTo(bx, by + h / 2 + 8)
  ctx.lineTo(bx + 8, by + h / 2 - 1)
  ctx.closePath()
  ctx.fill()
  ctx.stroke()
  ctx.fillStyle = angry ? '#8a1810' : INK
  ctx.fillText(text, bx, by + 1)
  ctx.restore()
}

export function drawHud(ctx: CanvasRenderingContext2D, s: State, L: Layout) {
  ctx.save()
  ctx.textAlign = 'center'
  ctx.textBaseline = 'middle'
  ctx.fillStyle = CREAM
  ctx.strokeStyle = WOOD_DEEP
  ctx.lineWidth = 6
  ctx.lineJoin = 'round'
  ctx.font = `900 ${Math.min(44, L.width * 0.08)}px ui-rounded, Trebuchet MS, ui-sans-serif, system-ui, sans-serif`
  ctx.strokeText('ANGRY OJISAN', L.width / 2, L.titleY)
  ctx.fillText('ANGRY OJISAN', L.width / 2, L.titleY)

  ctx.lineWidth = 0
  ctx.font = '600 15px ui-sans-serif, system-ui, sans-serif'
  ctx.fillStyle = '#e7c99a'
  const left = living(s).length
  const sub =
    s.phase === 'over'
      ? 'roulette over  ·  that player loses'
      : left === FACE_COUNT
        ? 'party roulette  ·  one uncle is secretly angry'
        : left + ' packed  ·  pass the phone'
  ctx.fillText(sub, L.width / 2, L.subY)

  ctx.fillStyle = '#f0d7ad'
  ctx.font = '600 16px ui-sans-serif, system-ui, sans-serif'
  if (s.phase === 'play') {
    ctx.fillText("don't tap the angry one", L.width / 2, L.footY)
  } else if (s.overAge > 0.5) {
    ctx.fillText('tap the box to play again', L.width / 2, L.footY)
  } else {
    ctx.fillText(ANGRY_YELL, L.width / 2, L.footY)
  }
  ctx.restore()
}

export function drawGame(view: CanvasApp, s: State, L: Layout, hoverId: number) {
  const { ctx } = view
  const sx = s.shake > 0 ? Math.sin(s.time * 54) * s.shake * 7 : 0
  const sy = s.shake > 0 ? Math.cos(s.time * 47) * s.shake * 5 : 0
  ctx.save()
  ctx.translate(sx, sy)
  drawTable(ctx, L.width, L.height)
  drawCrate(ctx, L, s.phase === 'over')
  const flyers = s.uncles.filter((u) => u.fly > 0)
  const seated = s.uncles.filter((u) => u.live)
  for (const u of seated) {
    drawOjisan(ctx, u, {
      angry: u.angry && s.phase === 'over',
      hover: hoverId === u.id && s.phase === 'play',
      time: s.time,
    })
  }
  for (const u of flyers) {
    drawOjisan(ctx, u, { angry: false, hover: false, time: s.time })
  }
  for (const f of s.floaters) {
    drawBubble(ctx, f.x, f.y, f.text, f.r, f.angry)
  }
  drawHud(ctx, s, L)
  ctx.restore()
}
