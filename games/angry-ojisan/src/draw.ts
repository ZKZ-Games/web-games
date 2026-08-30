import type { CanvasApp } from '@web-games/kit'
import {
  FACE_COUNT,
  living,
  LOSE_BEAT,
  traits,
  type Layout,
  type State,
  type Uncle,
} from './state'

function mixRgb(
  a: readonly [number, number, number],
  b: readonly [number, number, number],
  t: number,
) {
  const r = Math.round(a[0] + (b[0] - a[0]) * t)
  const g = Math.round(a[1] + (b[1] - a[1]) * t)
  const bl = Math.round(a[2] + (b[2] - a[2]) * t)
  return `rgb(${r},${g},${bl})`
}

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

function easeOutBack(t: number) {
  const c1 = 1.70158
  const c3 = c1 + 1
  return 1 + c3 * (t - 1) ** 3 + c1 * (t - 1) ** 2
}

function pathHead(ctx: CanvasRenderingContext2D, r: number, jaw: number) {
  const jw = r * (0.88 + jaw * 0.08)
  ctx.beginPath()
  ctx.moveTo(-jw, -r * 0.12)
  ctx.bezierCurveTo(-jw, -r * 0.72, -r * 0.42, -r * 0.94, 0, -r * 0.94)
  ctx.bezierCurveTo(r * 0.42, -r * 0.94, jw, -r * 0.72, jw, -r * 0.12)
  ctx.lineTo(jw, r * 0.52)
  ctx.quadraticCurveTo(jw, r * 1.08, 0, r * 1.1)
  ctx.quadraticCurveTo(-jw, r * 1.08, -jw, r * 0.52)
  ctx.closePath()
}

export function drawOjisan(
  ctx: CanvasRenderingContext2D,
  u: Uncle,
  opts: { angry: boolean; hover: boolean; time: number; pop: number },
) {
  const look = traits(u.id)
  const r = u.r * look.scale
  const popT = opts.pop > 0 ? easeOutBack(Math.min(1, opts.pop)) : 0
  const bob = u.live && !opts.angry ? Math.sin(opts.time * 2.4 + u.id) * r * 0.03 : 0
  const madShake = opts.angry ? Math.sin(opts.time * 34) * r * (0.03 + popT * 0.08) : 0
  const wobble = opts.angry ? Math.sin(opts.time * 29) * 0.055 * popT : 0
  ctx.save()
  ctx.translate(u.x + madShake, u.y + bob - popT * r * 0.42)
  ctx.rotate(u.angle + look.tilt + wobble)
  ctx.scale(1 + popT * 1.72, 1 + popT * 1.72)
  if (u.fly > 0) ctx.globalAlpha = Math.max(0, Math.min(1, u.fly / 0.2))
  if (opts.hover && u.live) {
    ctx.shadowColor = '#ffe7a8'
    ctx.shadowBlur = r * 0.55
  } else if (popT > 0.04) {
    ctx.shadowColor = 'rgba(0,0,0,0.5)'
    ctx.shadowBlur = r * 0.85 * popT
    ctx.shadowOffsetY = r * 0.22 * popT
  }

  const skin = opts.angry
    ? '#e24b3a'
    : mixRgb([236, 196, 168], [196, 148, 112], look.skin)
  const skinDeep = opts.angry
    ? '#b83228'
    : mixRgb([204, 148, 112], [168, 112, 80], look.skin)
  const hair = opts.angry ? '#1a0c08' : mixRgb([42, 28, 20], [22, 14, 10], look.hair)
  const ink = opts.angry ? '#2a0808' : '#2a1810'
  const shirt = opts.angry ? '#7a1c1c' : mixRgb([61, 92, 122], [74, 98, 72], look.collar)

  ctx.fillStyle = shirt
  ctx.beginPath()
  ctx.ellipse(0, r * 1.2, r * 0.82, r * 0.32, 0, 0, Math.PI * 2)
  ctx.fill()
  ctx.fillStyle = opts.angry ? '#f0e6d4' : '#f3ead8'
  ctx.beginPath()
  ctx.moveTo(-r * 0.38, r * 0.95)
  ctx.lineTo(-r * 0.15, r * 1.28)
  ctx.lineTo(r * 0.15, r * 1.28)
  ctx.lineTo(r * 0.38, r * 0.95)
  ctx.closePath()
  ctx.fill()

  ctx.fillStyle = skinDeep
  ctx.beginPath()
  ctx.ellipse(-r * 0.9, r * 0.08, r * 0.15, r * 0.22, 0.1, 0, Math.PI * 2)
  ctx.ellipse(r * 0.9, r * 0.08, r * 0.15, r * 0.22, -0.1, 0, Math.PI * 2)
  ctx.fill()

  ctx.fillStyle = skin
  pathHead(ctx, r, look.jaw)
  ctx.fill()
  if (popT > 0.04) {
    ctx.shadowBlur = 0
    ctx.shadowOffsetY = 0
  }
  ctx.strokeStyle = skinDeep
  ctx.lineWidth = Math.max(1.5, r * 0.055)
  ctx.stroke()

  const peak = -r * (0.22 + look.hair * 0.22)
  ctx.save()
  pathHead(ctx, r, look.jaw)
  ctx.clip()
  ctx.fillStyle = hair
  ctx.beginPath()
  ctx.moveTo(-r * 1.1, r * 0.15)
  ctx.lineTo(-r * 1.1, peak)
  ctx.quadraticCurveTo(-r * 0.78, peak - r * 0.18, -r * 0.5, peak + r * 0.06)
  ctx.quadraticCurveTo(-r * 0.42, r * 0.08, -r * 0.5, r * 0.62)
  ctx.lineTo(-r * 1.1, r * 0.72)
  ctx.closePath()
  ctx.fill()
  ctx.beginPath()
  ctx.moveTo(r * 1.1, r * 0.15)
  ctx.lineTo(r * 1.1, peak)
  ctx.quadraticCurveTo(r * 0.78, peak - r * 0.18, r * 0.5, peak + r * 0.06)
  ctx.quadraticCurveTo(r * 0.42, r * 0.08, r * 0.5, r * 0.62)
  ctx.lineTo(r * 1.1, r * 0.72)
  ctx.closePath()
  ctx.fill()
  ctx.beginPath()
  ctx.ellipse(-r * 0.72, r * 0.95, r * 0.28, r * 0.18, 0, 0, Math.PI * 2)
  ctx.fill()
  ctx.beginPath()
  ctx.ellipse(r * 0.72, r * 0.95, r * 0.28, r * 0.18, 0, 0, Math.PI * 2)
  ctx.fill()
  ctx.fillStyle = 'rgba(255,255,255,0.22)'
  ctx.beginPath()
  ctx.ellipse(-r * 0.1, -r * 0.48, r * 0.2, r * 0.08, -0.28, 0, Math.PI * 2)
  ctx.fill()
  ctx.restore()

  ctx.fillStyle = hair
  ctx.beginPath()
  ctx.ellipse(-r * 0.78, r * 0.36, r * 0.15, r * 0.24, 0.28, 0, Math.PI * 2)
  ctx.fill()
  ctx.beginPath()
  ctx.ellipse(r * 0.78, r * 0.36, r * 0.15, r * 0.24, -0.28, 0, Math.PI * 2)
  ctx.fill()

  const browY = -r * (0.12 + look.brow * 0.04)
  ctx.strokeStyle = ink
  ctx.fillStyle = ink
  ctx.lineCap = 'round'
  ctx.lineJoin = 'round'
  ctx.lineWidth = Math.max(3.8, r * (0.145 + look.brow * 0.03))
  if (opts.angry) {
    ctx.beginPath()
    ctx.moveTo(-r * 0.38, browY - r * 0.04)
    ctx.lineTo(-r * 0.06, browY + r * 0.1)
    ctx.moveTo(r * 0.38, browY - r * 0.04)
    ctx.lineTo(r * 0.06, browY + r * 0.1)
    ctx.stroke()
  } else {
    ctx.beginPath()
    ctx.moveTo(-r * 0.36, browY)
    ctx.lineTo(-r * 0.07, browY + r * 0.07)
    ctx.moveTo(r * 0.36, browY)
    ctx.lineTo(r * 0.07, browY + r * 0.07)
    ctx.stroke()
  }

  ctx.fillStyle = ink
  if (opts.angry) {
    ctx.beginPath()
    ctx.ellipse(-r * 0.18, r * 0.06, r * 0.1, r * 0.12, 0, 0, Math.PI * 2)
    ctx.ellipse(r * 0.18, r * 0.06, r * 0.1, r * 0.12, 0, 0, Math.PI * 2)
    ctx.fill()
    ctx.fillStyle = '#fff6ea'
    ctx.beginPath()
    ctx.ellipse(-r * 0.15, r * 0.01, r * 0.038, r * 0.042, 0, 0, Math.PI * 2)
    ctx.ellipse(r * 0.21, r * 0.01, r * 0.038, r * 0.042, 0, 0, Math.PI * 2)
    ctx.fill()
  } else {
    ctx.beginPath()
    ctx.arc(-r * 0.18, r * 0.06, Math.max(2.2, r * 0.07), 0, Math.PI * 2)
    ctx.arc(r * 0.18, r * 0.06, Math.max(2.2, r * 0.07), 0, Math.PI * 2)
    ctx.fill()
    ctx.fillStyle = '#fff8ee'
    ctx.beginPath()
    ctx.arc(-r * 0.155, r * 0.038, Math.max(1, r * 0.022), 0, Math.PI * 2)
    ctx.arc(r * 0.205, r * 0.038, Math.max(1, r * 0.022), 0, Math.PI * 2)
    ctx.fill()
  }

  ctx.fillStyle = skinDeep
  ctx.beginPath()
  ctx.moveTo(0, r * 0.1)
  ctx.lineTo(-r * 0.065, r * 0.24)
  ctx.lineTo(r * 0.065, r * 0.24)
  ctx.closePath()
  ctx.fill()

  const stacheW = r * (0.36 + look.stache * 0.08)
  const stacheH = r * (0.13 + look.stache * 0.04)
  ctx.fillStyle = hair
  ctx.beginPath()
  ctx.ellipse(-r * 0.42, r * 0.34, stacheW, stacheH, -0.38, 0, Math.PI * 2)
  ctx.fill()
  ctx.beginPath()
  ctx.ellipse(r * 0.42, r * 0.34, stacheW, stacheH, 0.38, 0, Math.PI * 2)
  ctx.fill()
  ctx.beginPath()
  ctx.ellipse(0, r * 0.31, r * 0.18, r * 0.075, 0, 0, Math.PI * 2)
  ctx.fill()

  ctx.strokeStyle = ink
  ctx.lineWidth = Math.max(2.6, r * 0.095)
  ctx.lineCap = 'round'
  if (opts.angry) {
    ctx.fillStyle = '#2a0808'
    ctx.beginPath()
    ctx.ellipse(0, r * 0.54, r * 0.24, r * 0.18, 0, 0, Math.PI * 2)
    ctx.fill()
    ctx.fillStyle = '#f2d2c4'
    ctx.beginPath()
    ctx.ellipse(0, r * 0.59, r * 0.15, r * 0.08, 0, 0, Math.PI * 2)
    ctx.fill()
  } else {
    ctx.beginPath()
    ctx.moveTo(-r * 0.16, r * 0.56)
    ctx.quadraticCurveTo(0, r * 0.44, r * 0.16, r * 0.56)
    ctx.stroke()
  }

  if (look.glasses > 0.55) {
    ctx.strokeStyle = ink
    ctx.lineWidth = Math.max(2, r * 0.06)
    ctx.beginPath()
    ctx.ellipse(-r * 0.18, r * 0.06, r * 0.155, r * 0.125, 0, 0, Math.PI * 2)
    ctx.stroke()
    ctx.beginPath()
    ctx.ellipse(r * 0.18, r * 0.06, r * 0.155, r * 0.125, 0, 0, Math.PI * 2)
    ctx.stroke()
    ctx.beginPath()
    ctx.moveTo(-r * 0.025, r * 0.05)
    ctx.lineTo(r * 0.025, r * 0.05)
    ctx.stroke()
    ctx.beginPath()
    ctx.moveTo(-r * 0.335, r * 0.06)
    ctx.lineTo(-r * 0.72, r * 0.12)
    ctx.moveTo(r * 0.335, r * 0.06)
    ctx.lineTo(r * 0.72, r * 0.12)
    ctx.stroke()
  }

  ctx.restore()
}

function drawBubble(
  ctx: CanvasRenderingContext2D,
  x: number,
  y: number,
  text: string,
  angry: boolean,
  life: number,
  maxLife: number,
) {
  ctx.save()
  const fade = angry ? 1 : Math.max(0, Math.min(1, life / Math.min(0.14, maxLife)))
  ctx.globalAlpha = fade
  ctx.font = angry
    ? '800 22px ui-sans-serif, system-ui, sans-serif'
    : '800 17px ui-sans-serif, system-ui, sans-serif'
  ctx.textAlign = 'center'
  ctx.textBaseline = 'middle'
  const padX = angry ? 16 : 12
  const w = Math.max(angry ? 120 : 72, ctx.measureText(text).width + padX * 2)
  const h = angry ? 40 : 32
  ctx.fillStyle = angry ? '#fff1e8' : '#fffaf0'
  ctx.strokeStyle = angry ? '#8a2018' : CRATE_INK
  ctx.lineWidth = angry ? 3.5 : 3
  roundRect(ctx, x - w / 2, y - h / 2, w, h, 10)
  ctx.fill()
  ctx.stroke()
  ctx.beginPath()
  ctx.moveTo(x - 6, y + h / 2 - 1)
  ctx.lineTo(x, y + h / 2 + 8)
  ctx.lineTo(x + 8, y + h / 2 - 1)
  ctx.closePath()
  ctx.fill()
  ctx.stroke()
  ctx.fillStyle = angry ? '#8a1810' : INK
  ctx.fillText(text, x, y + 1)
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
  } else if (s.overAge > LOSE_BEAT) {
    ctx.fillText('tap the box to play again', L.width / 2, L.footY)
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
  const popping = (u: Uncle) => u.angry && s.phase === 'over'
  const flyers = s.uncles.filter((u) => u.fly > 0)
  const seated = s.uncles.filter((u) => u.live && !popping(u))
  const popped = s.uncles.filter((u) => u.live && popping(u))
  for (const u of seated) {
    drawOjisan(ctx, u, {
      angry: false,
      hover: hoverId === u.id && s.phase === 'play',
      time: s.time,
      pop: 0,
    })
  }
  for (const u of flyers) {
    drawOjisan(ctx, u, { angry: false, hover: false, time: s.time, pop: 0 })
  }
  for (const u of popped) {
    drawOjisan(ctx, u, { angry: true, hover: false, time: s.time, pop: u.pop })
  }
  drawHud(ctx, s, L)
  for (const f of s.floaters) {
    if (f.angry && f.follow >= 0) {
      const u = s.uncles[f.follow]
      const popT = easeOutBack(Math.min(1, u.pop))
      const grow = 1 + popT * 1.72
      const cx = u.x
      const cy = u.y - popT * u.r * 0.42
      const headTop = cy - u.r * grow * 0.95
      let bx = cx
      let by = headTop - 28
      if (by < 52) {
        bx = cx + u.r * grow * 0.85
        by = cy - u.r * grow * 0.15
      }
      drawBubble(ctx, bx, by, f.text, true, f.life, f.maxLife)
    } else {
      drawBubble(ctx, f.x, f.y, f.text, false, f.life, f.maxLife)
    }
  }
  ctx.restore()
}
