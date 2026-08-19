import type { CanvasApp } from '@web-games/kit'
import { clamp } from '@web-games/kit'
import {
  type ShopItemId,
  type ShopKind,
  type State,
  type UnlockId,
  type UpgradeId,
  SUB_GOAL,
  canBuy,
  fmtAud,
  fmtCash,
  fmtInt,
  fmtRate,
  priceOf,
  unlockAudPerSec,
  unlockDef,
  upgradeDef,
  visibleUnlocks,
  visibleUpgrades,
} from './state'

export type Rect = { x: number; y: number; w: number; h: number }

export type ShopRow = {
  kind: ShopKind
  id: ShopItemId
  mystery: boolean
  row: Rect
  buy: Rect
}

export type Layout = {
  hud: Rect
  room: Rect
  shop: Rect
  tap: { x: number; y: number; r: number }
  rows: ShopRow[]
  unlockHead: Rect
  upgradeHead: Rect | null
  shopList: Rect
  shopScrollMax: number
  narrow: boolean
}

type Fit = {
  x: (n: number) => number
  y: (n: number) => number
  u: (n: number) => number
}

const DW = 640
const DH = 400

export function layout(w: number, h: number, s: State): Layout {
  const narrow = w < 820 || h < 560
  const hudH = Math.max(58, Math.min(72, h * 0.1))
  const shopW = narrow ? w : Math.max(248, Math.min(312, w * 0.28))
  const shopH = narrow ? Math.max(200, Math.min(280, h * 0.36)) : h - hudH
  const room: Rect = {
    x: 0,
    y: hudH,
    w: narrow ? w : w - shopW,
    h: narrow ? h - hudH - shopH : h - hudH,
  }
  const shop: Rect = {
    x: narrow ? 0 : w - shopW,
    y: narrow ? h - shopH : hudH,
    w: shopW,
    h: shopH,
  }
  const tapR = clamp(Math.min(room.w, room.h) * 0.11, 42, 58)
  const tap = {
    x: room.x + room.w * 0.5,
    y: room.y + room.h - tapR - 28,
    r: tapR,
  }

  const unlocks = visibleUnlocks(s)
  const upgrades = visibleUpgrades(s)
  const pad = 12
  const titleH = 34
  const groupH = 22
  const showUpgrades = upgrades.length > 0
  const shopList: Rect = {
    x: shop.x,
    y: shop.y + titleH,
    w: shop.w,
    h: shop.h - titleH,
  }

  const n = unlocks.length + upgrades.length
  const extraHeads = showUpgrades ? 2 : 1
  const available = shopList.h - pad - extraHeads * groupH
  const rowPitch = clamp(available / Math.max(1, n), 40, 68)
  const contentH = extraHeads * groupH + n * rowPitch + pad
  const shopScrollMax = Math.max(0, contentH - shopList.h)
  s.shopScroll = clamp(s.shopScroll, 0, shopScrollMax)
  const y0 = shopList.y - s.shopScroll

  const unlockHead: Rect = {
    x: shop.x + pad,
    y: y0 + 4,
    w: shop.w - pad * 2,
    h: groupH,
  }

  let y = y0 + groupH
  const rows: ShopRow[] = []
  for (const item of unlocks) {
    rows.push(makeRow('unlock', item.def.id, item.mystery, shop, pad, y, rowPitch))
    y += rowPitch
  }

  let upgradeHead: Rect | null = null
  if (showUpgrades) {
    upgradeHead = {
      x: shop.x + pad,
      y: y + 2,
      w: shop.w - pad * 2,
      h: groupH,
    }
    y += groupH
    for (const def of upgrades) {
      rows.push(makeRow('upgrade', def.id, false, shop, pad, y, rowPitch))
      y += rowPitch
    }
  }

  return {
    hud: { x: 0, y: 0, w, h: hudH },
    room,
    shop,
    tap,
    rows,
    unlockHead,
    upgradeHead,
    shopList,
    shopScrollMax,
    narrow,
  }
}

function makeRow(
  kind: ShopKind,
  id: ShopItemId,
  mystery: boolean,
  shop: Rect,
  pad: number,
  y: number,
  rowPitch: number,
): ShopRow {
  const row = {
    x: shop.x + pad,
    y: y,
    w: shop.w - pad * 2,
    h: rowPitch - 8,
  }
  const buy = {
    x: row.x + row.w - 68,
    y: row.y + row.h * 0.5 - 13,
    w: 58,
    h: 26,
  }
  return { kind, id, mystery, row, buy }
}

function fitOf(room: Rect): Fit {
  const s = Math.min(room.w / DW, room.h / DH)
  const ox = room.x + (room.w - DW * s) / 2
  const oy = room.y + (room.h - DH * s) / 2
  return {
    x: (n) => ox + n * s,
    y: (n) => oy + n * s,
    u: (n) => n * s,
  }
}

function rr(
  ctx: CanvasRenderingContext2D,
  x: number,
  y: number,
  w: number,
  h: number,
  r: number,
) {
  ctx.beginPath()
  ctx.roundRect(x, y, w, h, r)
}

function fillRr(
  ctx: CanvasRenderingContext2D,
  x: number,
  y: number,
  w: number,
  h: number,
  r: number,
  color: string,
) {
  ctx.fillStyle = color
  rr(ctx, x, y, w, h, r)
  ctx.fill()
}

export function draw(view: CanvasApp, s: State, L: Layout) {
  const { ctx, width, height } = view
  view.clear('#120c14')
  drawRoom(ctx, s, L)
  drawHud(ctx, s, L, width)
  drawShop(ctx, s, L)
  drawTap(ctx, s, L)
  drawFloaters(ctx, s, L)
  if (s.eraDone) drawDone(ctx, L)
  ctx.fillStyle = 'rgba(8,4,10,0.18)'
  ctx.fillRect(0, height - 8, width, 8)
}

function drawRoom(ctx: CanvasRenderingContext2D, s: State, L: Layout) {
  const { room } = L
  const f = fitOf(room)
  const t = s.time

  ctx.save()
  ctx.beginPath()
  ctx.rect(room.x, room.y, room.w, room.h)
  ctx.clip()

  ctx.fillStyle = '#1a1020'
  ctx.fillRect(room.x, room.y, room.w, room.h)

  const wallH = f.y(228)
  ctx.fillStyle = '#241628'
  ctx.fillRect(room.x, room.y, room.w, wallH - room.y)

  const floorGrad = ctx.createLinearGradient(0, wallH, 0, room.y + room.h)
  floorGrad.addColorStop(0, '#3a241c')
  floorGrad.addColorStop(1, '#231410')
  ctx.fillStyle = floorGrad
  ctx.fillRect(room.x, wallH, room.w, room.h)

  ctx.strokeStyle = 'rgba(70,40,32,0.45)'
  ctx.lineWidth = 1
  for (let i = 0; i < 8; i++) {
    const y = wallH + f.u(18 + i * 22)
    ctx.beginPath()
    ctx.moveTo(room.x, y)
    ctx.lineTo(room.x + room.w, y)
    ctx.stroke()
  }

  const pink = `rgba(255, 77, 141, ${0.45 + Math.sin(t * 2.1) * 0.12})`
  const blue = `rgba(61, 158, 255, ${0.4 + Math.sin(t * 1.7 + 1) * 0.12})`
  ctx.strokeStyle = pink
  ctx.lineWidth = f.u(5)
  ctx.beginPath()
  ctx.moveTo(f.x(8), f.y(8))
  ctx.lineTo(f.x(DW * 0.55), f.y(8))
  ctx.stroke()
  ctx.strokeStyle = blue
  ctx.beginPath()
  ctx.moveTo(f.x(DW * 0.5), f.y(8))
  ctx.lineTo(f.x(DW - 8), f.y(8))
  ctx.stroke()

  for (let i = 0; i < 14; i++) {
    const sx = f.x(40 + ((i * 73) % 560))
    const sy = f.y(28 + ((i * 37) % 90))
    ctx.fillStyle = `rgba(140, 255, 170, ${0.25 + ((i * 17) % 5) * 0.08})`
    star(ctx, sx, sy, f.u(3.2))
  }

  drawPoster(ctx, f.x(196), f.y(34), f.u(78), f.u(52), '#6d2438', 'KEEP', 'UPLOADING')
  drawPoster(
    ctx,
    f.x(286),
    f.y(42),
    f.u(70),
    f.u(46),
    '#2a4a6d',
    "DON'T QUIT",
    'LEVEL UP',
  )
  drawPoster(ctx, f.x(500), f.y(32), f.u(82), f.u(54), '#6a3a16', 'CONSISTENCY', 'IS KEY')
  drawPoster(ctx, f.x(548), f.y(96), f.u(60), f.u(44), '#3d2a68', 'MAKE', 'STUFF')

  drawBed(ctx, f)
  drawLamp(ctx, f, t)
  drawClutter(ctx, f)
  drawMonitor(ctx, f, s)
  drawDesk(ctx, f, s)
  drawGear(ctx, f, s, t)
  drawPerson(ctx, f, s, t)
  drawIdeas(ctx, f, s)

  ctx.fillStyle = 'rgba(255, 170, 70, 0.07)'
  ctx.beginPath()
  ctx.ellipse(f.x(168), f.y(250), f.u(90), f.u(50), 0, 0, Math.PI * 2)
  ctx.fill()
  if (s.owned.ring > 0) {
    ctx.fillStyle = 'rgba(255, 230, 180, 0.08)'
    ctx.beginPath()
    ctx.ellipse(f.x(455), f.y(210), f.u(70), f.u(80), 0, 0, Math.PI * 2)
    ctx.fill()
  }

  ctx.fillStyle = '#f5f0e6'
  ctx.font = `700 ${Math.max(22, f.u(28))}px ui-sans-serif, system-ui, sans-serif`
  ctx.textAlign = 'left'
  ctx.textBaseline = 'alphabetic'
  ctx.fillText('TubeEmpire', f.x(22), f.y(26) + f.u(10))
  const tw = ctx.measureText('Tube').width
  ctx.fillStyle = '#e23d3d'
  ctx.fillText('Empire', f.x(22) + tw, f.y(26) + f.u(10))
  ctx.fillStyle = '#f0c14b'
  ctx.font = `700 ${Math.max(11, f.u(13))}px ui-sans-serif, system-ui, sans-serif`
  ctx.fillText('Bedroom Era', f.x(24), f.y(48) + f.u(8))

  ctx.restore()
}

function star(ctx: CanvasRenderingContext2D, x: number, y: number, r: number) {
  ctx.beginPath()
  ctx.moveTo(x, y - r)
  ctx.lineTo(x + r * 0.28, y - r * 0.28)
  ctx.lineTo(x + r, y)
  ctx.lineTo(x + r * 0.28, y + r * 0.28)
  ctx.lineTo(x, y + r)
  ctx.lineTo(x - r * 0.28, y + r * 0.28)
  ctx.lineTo(x - r, y)
  ctx.lineTo(x - r * 0.28, y - r * 0.28)
  ctx.closePath()
  ctx.fill()
}

function drawPoster(
  ctx: CanvasRenderingContext2D,
  x: number,
  y: number,
  w: number,
  h: number,
  color: string,
  a: string,
  b: string,
) {
  fillRr(ctx, x, y, w, h, 4, color)
  ctx.strokeStyle = 'rgba(255,255,255,0.12)'
  ctx.lineWidth = 2
  rr(ctx, x, y, w, h, 4)
  ctx.stroke()
  ctx.fillStyle = 'rgba(255,255,255,0.88)'
  ctx.font = `800 ${Math.max(8, h * 0.2)}px ui-sans-serif, system-ui, sans-serif`
  ctx.textAlign = 'center'
  ctx.textBaseline = 'middle'
  ctx.fillText(a, x + w / 2, y + h * 0.38)
  ctx.fillText(b, x + w / 2, y + h * 0.64)
}

function drawBed(ctx: CanvasRenderingContext2D, f: Fit) {
  fillRr(ctx, f.x(18), f.y(188), f.u(168), f.u(86), 8, '#2a3348')
  fillRr(ctx, f.x(26), f.y(176), f.u(152), f.u(48), 10, '#3d6a9a')
  fillRr(ctx, f.x(40), f.y(168), f.u(64), f.u(28), 8, '#d8dde8')
  ctx.fillStyle = '#2e4d72'
  ctx.beginPath()
  ctx.moveTo(f.x(90), f.y(176))
  ctx.quadraticCurveTo(f.x(140), f.y(200), f.x(170), f.y(186))
  ctx.lineTo(f.x(170), f.y(220))
  ctx.lineTo(f.x(90), f.y(214))
  ctx.fill()
}

function drawLamp(ctx: CanvasRenderingContext2D, f: Fit, t: number) {
  fillRr(ctx, f.x(148), f.y(198), f.u(36), f.u(10), 3, '#4a3228')
  ctx.fillStyle = '#2a1c16'
  ctx.fillRect(f.x(163), f.y(150), f.u(6), f.u(50))
  const glow = 0.55 + Math.sin(t * 3) * 0.05
  const g = ctx.createRadialGradient(
    f.x(166),
    f.y(148),
    f.u(4),
    f.x(166),
    f.y(160),
    f.u(46),
  )
  g.addColorStop(0, `rgba(255, 190, 80, ${glow})`)
  g.addColorStop(1, 'rgba(255, 160, 40, 0)')
  ctx.fillStyle = g
  ctx.beginPath()
  ctx.arc(f.x(166), f.y(148), f.u(46), 0, Math.PI * 2)
  ctx.fill()
  fillRr(ctx, f.x(154), f.y(136), f.u(24), f.u(16), 4, '#f0c14b')
  ctx.fillStyle = '#1a1010'
  ctx.font = `700 ${f.u(6)}px ui-sans-serif, system-ui`
  ctx.textAlign = 'center'
  ctx.textBaseline = 'middle'
  ctx.fillText('12:34', f.x(166), f.y(144))
}

function drawClutter(ctx: CanvasRenderingContext2D, f: Fit) {
  fillRr(ctx, f.x(44), f.y(268), f.u(40), f.u(28), 4, '#6a5340')
  ctx.fillStyle = '#c4b8a0'
  ctx.fillRect(f.x(48), f.y(262), f.u(32), f.u(10))
  ctx.fillStyle = '#8a3a2a'
  ctx.fillRect(f.x(52), f.y(258), f.u(24), f.u(6))

  fillRr(ctx, f.x(96), f.y(278), f.u(46), f.u(22), 3, '#c9a24a')
  ctx.fillStyle = '#8a6a20'
  ctx.fillRect(f.x(100), f.y(282), f.u(38), f.u(4))
  ctx.fillStyle = '#fff4d0'
  ctx.font = `700 ${f.u(6)}px ui-sans-serif`
  ctx.textAlign = 'center'
  ctx.fillText('PIZZA', f.x(119), f.y(292))

  ctx.fillStyle = '#c23b3b'
  ctx.beginPath()
  ctx.ellipse(f.x(160), f.y(292), f.u(6), f.u(9), 0.2, 0, Math.PI * 2)
  ctx.fill()
  ctx.fillStyle = '#d8b020'
  ctx.beginPath()
  ctx.ellipse(f.x(176), f.y(294), f.u(6), f.u(8), -0.3, 0, Math.PI * 2)
  ctx.fill()

  fillRr(ctx, f.x(200), f.y(300), f.u(28), f.u(18), 4, '#c9a66a')
}

function drawMonitor(ctx: CanvasRenderingContext2D, f: Fit, s: State) {
  fillRr(ctx, f.x(200), f.y(128), f.u(78), f.u(52), 4, '#1a1e24')
  fillRr(ctx, f.x(206), f.y(134), f.u(66), f.u(40), 3, '#0c1210')
  ctx.fillStyle = '#2a1c16'
  ctx.fillRect(f.x(232), f.y(180), f.u(14), f.u(16))
  ctx.fillStyle = '#3a2a20'
  ctx.fillRect(f.x(220), f.y(194), f.u(38), f.u(6))
  ctx.strokeStyle = '#3ee07a'
  ctx.lineWidth = 1.5
  ctx.beginPath()
  const max = Math.max(0.04, ...s.graph)
  s.graph.forEach((v, i) => {
    const x = f.x(210 + (i / Math.max(1, s.graph.length - 1)) * 58)
    const y = f.y(168 - (v / max) * 28)
    if (i === 0) ctx.moveTo(x, y)
    else ctx.lineTo(x, y)
  })
  ctx.stroke()
  ctx.fillStyle = '#6ee7a0'
  ctx.font = `700 ${f.u(6)}px ui-sans-serif`
  ctx.textAlign = 'left'
  ctx.fillText('AUDIENCE', f.x(210), f.y(142))
}

function drawDesk(ctx: CanvasRenderingContext2D, f: Fit, s: State) {
  crate(ctx, f.x(248), f.y(262), f.u(54), f.u(46))
  crate(ctx, f.x(338), f.y(266), f.u(50), f.u(42))
  fillRr(ctx, f.x(236), f.y(248), f.u(168), f.u(16), 4, '#6b4630')
  ctx.fillStyle = '#8a5a3a'
  ctx.fillRect(f.x(240), f.y(250), f.u(160), f.u(4))

  fillRr(ctx, f.x(292), f.y(228), f.u(58), f.u(8), 2, '#2a2e34')
  fillRr(ctx, f.x(298), f.y(200), f.u(46), f.u(30), 3, '#1c2228')
  const screen = s.rec > 0.3 ? '#5a2030' : '#8ad4ff'
  fillRr(ctx, f.x(302), f.y(204), f.u(38), f.u(22), 2, screen)
  ctx.fillStyle = '#e8f6ff'
  ctx.font = `800 ${f.u(6)}px ui-sans-serif`
  ctx.textAlign = 'center'
  ctx.fillText('CREATE', f.x(321), f.y(216))

  ctx.fillStyle = '#d8d0c4'
  ctx.fillRect(f.x(268), f.y(236), f.u(8), f.u(16))
  ctx.fillStyle = '#222'
  ctx.beginPath()
  ctx.arc(f.x(272), f.y(232), f.u(7), 0, Math.PI * 2)
  ctx.fill()
  const camOn = s.owned.webcam > 0
  ctx.fillStyle = camOn
    ? `rgba(80,180,255,${0.45 + s.rec * 0.4})`
    : s.rec > 0
      ? `rgba(255,40,40,${0.45 + s.rec * 0.55})`
      : '#5a2020'
  ctx.beginPath()
  ctx.arc(f.x(272), f.y(232), f.u(3.2), 0, Math.PI * 2)
  ctx.fill()
  if (s.rec > 0.15) {
    ctx.fillStyle = '#ff6b6b'
    ctx.font = `800 ${f.u(6)}px ui-sans-serif`
    ctx.textAlign = 'center'
    ctx.fillText('REC', f.x(272), f.y(220))
  }

  ctx.fillStyle = '#2a6db0'
  ctx.beginPath()
  ctx.ellipse(f.x(370), f.y(246), f.u(8), f.u(6), 0, 0, Math.PI * 2)
  ctx.fill()
  ctx.fillStyle = '#f4efe6'
  ctx.font = `800 ${f.u(4.5)}px ui-sans-serif`
  ctx.fillText('#1', f.x(370), f.y(247))
}

function crate(
  ctx: CanvasRenderingContext2D,
  x: number,
  y: number,
  w: number,
  h: number,
) {
  fillRr(ctx, x, y, w, h, 3, '#3d6b3a')
  ctx.fillStyle = '#2f542d'
  const gap = Math.max(3, w * 0.08)
  const holeW = Math.max(5, w * 0.18)
  const holeH = Math.max(6, h * 0.22)
  for (let row = 0; row < 2; row++) {
    for (let col = 0; col < 3; col++) {
      ctx.fillRect(
        x + gap + col * (holeW + gap),
        y + gap + row * (holeH + gap),
        holeW,
        holeH,
      )
    }
  }
  ctx.strokeStyle = '#2a4a28'
  ctx.lineWidth = 2
  ctx.strokeRect(x + 3, y + 3, w - 6, h - 6)
}

function drawGear(ctx: CanvasRenderingContext2D, f: Fit, s: State, t: number) {
  const ringOn = s.owned.ring > 0
  ctx.fillStyle = '#2a2a2e'
  ctx.fillRect(f.x(452), f.y(200), f.u(6), f.u(88))
  ctx.fillStyle = '#1a1a1e'
  ctx.fillRect(f.x(438), f.y(284), f.u(34), f.u(8))
  const pulse = ringOn ? 0.55 + Math.sin(t * 4) * 0.15 : 0.12
  ctx.strokeStyle = ringOn ? `rgba(255, 220, 140, ${pulse})` : 'rgba(180,180,190,0.35)'
  ctx.lineWidth = f.u(ringOn ? 7 : 5)
  ctx.beginPath()
  ctx.arc(f.x(455), f.y(188), f.u(22), 0, Math.PI * 2)
  ctx.stroke()
  ctx.strokeStyle = ringOn ? `rgba(255,255,255,${pulse})` : 'rgba(255,255,255,0.15)'
  ctx.lineWidth = f.u(2)
  ctx.beginPath()
  ctx.arc(f.x(455), f.y(188), f.u(14), 0, Math.PI * 2)
  ctx.stroke()
  if (ringOn) {
    const g = ctx.createRadialGradient(
      f.x(455),
      f.y(188),
      f.u(8),
      f.x(455),
      f.y(188),
      f.u(40),
    )
    g.addColorStop(0, 'rgba(255,240,180,0.28)')
    g.addColorStop(1, 'rgba(255,200,80,0)')
    ctx.fillStyle = g
    ctx.beginPath()
    ctx.arc(f.x(455), f.y(188), f.u(40), 0, Math.PI * 2)
    ctx.fill()
  }

  const micOn = s.owned.mic > 0
  ctx.fillStyle = micOn ? '#1a1a1e' : '#2a2a30'
  ctx.beginPath()
  ctx.ellipse(f.x(412), f.y(214), f.u(8), f.u(14), 0, 0, Math.PI * 2)
  ctx.fill()
  ctx.fillStyle = '#444'
  ctx.fillRect(f.x(409), f.y(226), f.u(6), f.u(22))
  ctx.fillStyle = '#222'
  ctx.fillRect(f.x(400), f.y(246), f.u(24), f.u(5))
  if (micOn) {
    ctx.fillStyle = `rgba(120, 200, 255, ${0.35 + Math.sin(t * 6) * 0.15})`
    ctx.fillRect(f.x(410), f.y(208), f.u(4), f.u(8))
  }
}

function drawPerson(ctx: CanvasRenderingContext2D, f: Fit, s: State, t: number) {
  const hop = s.bounce * f.u(10)
  const idle = Math.sin(t * 3) * f.u(1.2)
  const x = f.x(318)
  const y = f.y(232) - hop + idle
  const talking = s.talk > 0
  const skin = '#e8b896'

  ctx.fillStyle = 'rgba(10,6,8,0.35)'
  ctx.beginPath()
  ctx.ellipse(x, f.y(252), f.u(20), f.u(5), 0, 0, Math.PI * 2)
  ctx.fill()

  fillRr(ctx, x - f.u(15), y - f.u(8), f.u(12), f.u(18), 4, '#1e3f68')
  fillRr(ctx, x + f.u(4), y - f.u(8), f.u(12), f.u(18), 4, '#1e3f68')

  fillRr(ctx, x - f.u(18), y - f.u(32), f.u(36), f.u(28), 9, '#2b5a8a')
  fillRr(ctx, x - f.u(8), y - f.u(12), f.u(16), f.u(10), 4, '#244e78')

  fillRr(ctx, x - f.u(24), y - f.u(26), f.u(12), f.u(14), 5, '#244e78')
  ctx.fillStyle = skin
  ctx.beginPath()
  ctx.arc(x - f.u(24), y - f.u(14), f.u(4), 0, Math.PI * 2)
  ctx.fill()

  if (talking) {
    ctx.save()
    ctx.translate(x + f.u(16), y - f.u(28))
    ctx.rotate(-0.75)
    fillRr(ctx, 0, 0, f.u(11), f.u(18), 5, '#244e78')
    ctx.fillStyle = skin
    ctx.beginPath()
    ctx.arc(f.u(11), f.u(1), f.u(4), 0, Math.PI * 2)
    ctx.fill()
    ctx.restore()
  } else {
    fillRr(ctx, x + f.u(12), y - f.u(24), f.u(16), f.u(10), 5, '#244e78')
    ctx.fillStyle = skin
    ctx.beginPath()
    ctx.arc(x + f.u(28), y - f.u(20), f.u(4), 0, Math.PI * 2)
    ctx.fill()
  }

  const hx = x
  const hy = y - f.u(44)
  const hr = f.u(15)
  ctx.fillStyle = skin
  ctx.beginPath()
  ctx.arc(hx, hy, hr, 0, Math.PI * 2)
  ctx.fill()

  ctx.fillStyle = '#1b1410'
  ctx.beginPath()
  ctx.arc(hx, hy - f.u(4), hr, Math.PI * 1.05, Math.PI * 1.95)
  ctx.fill()
  ctx.beginPath()
  ctx.ellipse(hx, hy - f.u(10), hr * 0.95, f.u(8), 0, 0, Math.PI * 2)
  ctx.fill()
  ctx.beginPath()
  ctx.ellipse(hx - f.u(10), hy - f.u(2), f.u(4), f.u(8), 0.2, 0, Math.PI * 2)
  ctx.fill()
  ctx.beginPath()
  ctx.ellipse(hx + f.u(10), hy - f.u(2), f.u(4), f.u(8), -0.2, 0, Math.PI * 2)
  ctx.fill()

  ctx.fillStyle = '#2b5a8a'
  ctx.beginPath()
  ctx.arc(hx - f.u(11), hy + f.u(8), f.u(5), 0, Math.PI * 2)
  ctx.fill()
  ctx.beginPath()
  ctx.arc(hx + f.u(11), hy + f.u(8), f.u(5), 0, Math.PI * 2)
  ctx.fill()

  ctx.fillStyle = '#2a1a14'
  ctx.beginPath()
  ctx.arc(hx - f.u(5), hy + f.u(1), f.u(1.8), 0, Math.PI * 2)
  ctx.fill()
  ctx.beginPath()
  ctx.arc(hx + f.u(5), hy + f.u(1), f.u(1.8), 0, Math.PI * 2)
  ctx.fill()
  ctx.fillStyle = 'rgba(255,255,255,0.7)'
  ctx.beginPath()
  ctx.arc(hx - f.u(4.4), hy + f.u(0.3), f.u(0.7), 0, Math.PI * 2)
  ctx.fill()
  ctx.beginPath()
  ctx.arc(hx + f.u(5.6), hy + f.u(0.3), f.u(0.7), 0, Math.PI * 2)
  ctx.fill()

  ctx.fillStyle = talking ? '#c45a4a' : '#c48a72'
  ctx.beginPath()
  ctx.ellipse(
    hx,
    hy + f.u(8),
    f.u(talking ? 3.4 : 2.2),
    f.u(talking ? 2.6 : 1.2),
    0,
    0,
    Math.PI * 2,
  )
  ctx.fill()
}

function drawIdeas(ctx: CanvasRenderingContext2D, f: Fit, s: State) {
  const n = 1 + Math.min(3, s.owned.thumbnail)
  for (let i = 0; i < n; i++) {
    fillRr(
      ctx,
      f.x(26 + i * 6),
      f.y(100 + i * 4),
      f.u(54),
      f.u(48),
      3,
      i % 2 ? '#f6e27a' : '#f3d34a',
    )
  }
  ctx.fillStyle = '#3a2a10'
  ctx.font = `800 ${f.u(7)}px ui-sans-serif`
  ctx.textAlign = 'left'
  ctx.fillText(s.owned.thumbnail > 0 ? 'THUMBS' : 'IDEAS', f.x(34), f.y(116))
  ctx.font = `700 ${f.u(5.5)}px ui-sans-serif`
  ctx.fillText('Gameplay', f.x(34), f.y(128))
  ctx.fillText('Skits', f.x(34), f.y(136))
  ctx.fillText('Reactions', f.x(34), f.y(144))
  if (s.owned.viral > 0) {
    ctx.fillStyle = '#ff7a18'
    ctx.font = `800 ${f.u(10)}px ui-sans-serif`
    ctx.fillText('🔥', f.x(64), f.y(112))
  }
}

function drawHud(ctx: CanvasRenderingContext2D, s: State, L: Layout, width: number) {
  const { hud } = L
  ctx.fillStyle = '#efe6d2'
  ctx.fillRect(0, 0, width, hud.h)
  ctx.fillStyle = 'rgba(80,50,30,0.12)'
  ctx.fillRect(0, hud.h - 2, width, 2)

  const stats = [
    { label: 'Views', value: fmtInt(s.views), color: '#2a2a32' },
    { label: 'Cash', value: fmtCash(s.cash), color: '#1f7a3a' },
    { label: 'Subs', value: `${fmtInt(s.subs)} / ${fmtInt(SUB_GOAL)}`, color: '#2a2a32' },
    { label: 'Audience', value: fmtRate(s.audience), color: '#1f7a3a' },
  ]
  const gap = 12
  const boxW = Math.min(200, (width - 28 - gap * 3) / 4)
  stats.forEach((st, i) => {
    const x = 14 + i * (boxW + gap)
    const y = 8
    fillRr(ctx, x, y, boxW, hud.h - 16, 8, 'rgba(255,255,255,0.45)')
    ctx.fillStyle = '#7a6a58'
    ctx.font = '700 11px ui-sans-serif, system-ui, sans-serif'
    ctx.textAlign = 'left'
    ctx.textBaseline = 'top'
    ctx.fillText(st.label, x + 10, y + 6)
    ctx.fillStyle = st.color
    ctx.font = '800 18px ui-sans-serif, system-ui, sans-serif'
    ctx.fillText(st.value, x + 10, y + 20)
    if (st.label === 'Subs') {
      const bx = x + 10
      const by = y + hud.h - 30
      const bw = boxW - 20
      fillRr(ctx, bx, by, bw, 6, 3, '#d5c8b0')
      fillRr(ctx, bx, by, bw * (s.subs / SUB_GOAL), 6, 3, '#e23d3d')
    }
  })
}

function drawShop(ctx: CanvasRenderingContext2D, s: State, L: Layout) {
  const { shop } = L
  ctx.fillStyle = '#1b2a4a'
  ctx.fillRect(shop.x, shop.y, shop.w, shop.h)
  ctx.fillStyle = 'rgba(255,255,255,0.06)'
  ctx.fillRect(shop.x, shop.y, 2, shop.h)

  ctx.fillStyle = '#e8eefc'
  ctx.font = '800 15px ui-sans-serif, system-ui, sans-serif'
  ctx.textAlign = 'left'
  ctx.textBaseline = 'alphabetic'
  ctx.fillText('SHOP', shop.x + 16, shop.y + 24)
  ctx.fillStyle = '#f0c14b'
  ctx.font = '700 11px ui-sans-serif, system-ui, sans-serif'
  ctx.fillText('Bedroom Era', shop.x + 108, shop.y + 24)

  ctx.save()
  ctx.beginPath()
  ctx.rect(L.shopList.x, L.shopList.y, L.shopList.w, L.shopList.h)
  ctx.clip()

  ctx.fillStyle = '#8aa0c8'
  ctx.font = '800 10px ui-sans-serif, system-ui, sans-serif'
  ctx.textAlign = 'left'
  ctx.textBaseline = 'middle'
  ctx.fillText('UNLOCKS', L.unlockHead.x + 2, L.unlockHead.y + L.unlockHead.h / 2)

  if (L.upgradeHead) {
    ctx.fillText('UPGRADES', L.upgradeHead.x + 2, L.upgradeHead.y + L.upgradeHead.h / 2)
  }

  for (const row of L.rows) {
    drawShopRow(ctx, s, row)
  }

  ctx.restore()

  if (L.shopScrollMax > 0) {
    const trackH = L.shopList.h - 16
    const thumbH = Math.max(18, trackH * (L.shopList.h / (L.shopList.h + L.shopScrollMax)))
    const t = L.shopScrollMax > 0 ? s.shopScroll / L.shopScrollMax : 0
    fillRr(
      ctx,
      shop.x + shop.w - 7,
      L.shopList.y + 8 + t * (trackH - thumbH),
      4,
      thumbH,
      2,
      'rgba(255,255,255,0.28)',
    )
  }
}

function drawShopRow(ctx: CanvasRenderingContext2D, s: State, row: ShopRow) {
  const { x, y, w, h } = row.row
  const ok = !row.mystery && canBuy(s, row.kind, row.id)
  fillRr(ctx, x, y, w, h, 10, row.mystery ? '#151c2e' : ok ? '#243868' : '#18243c')
  if (ok) {
    ctx.strokeStyle = 'rgba(240,193,75,0.55)'
    ctx.lineWidth = 1.5
    rr(ctx, x, y, w, h, 10)
    ctx.stroke()
  }

  const nameY = y + Math.max(16, h * 0.42)
  const hintY = y + Math.max(30, h * 0.72)
  ctx.textAlign = 'left'
  ctx.textBaseline = 'alphabetic'

  if (row.mystery) {
    drawMysteryIcon(ctx, x + 18, y + h / 2)
    ctx.fillStyle = '#6e7c96'
    ctx.font = '800 14px ui-sans-serif, system-ui, sans-serif'
    ctx.fillText('???', x + 40, nameY)
    ctx.fillStyle = '#4d5a72'
    ctx.font = '600 11px ui-sans-serif, system-ui, sans-serif'
    ctx.fillText('???', x + 40, hintY)
    return
  }

  if (row.kind === 'unlock') {
    const def = unlockDef(row.id as UnlockId)!
    const owned = s.owned[def.id]
    const price = priceOf(def, owned)
    const each = unlockAudPerSec(s, def.id)
    drawUnlockIcon(ctx, x + 18, y + h / 2, def.id, s)
    ctx.fillStyle = '#f4efe6'
    ctx.font = '800 13px ui-sans-serif, system-ui, sans-serif'
    const count = owned > 0 ? `  ×${owned}` : ''
    ctx.fillText(def.name + count, x + 40, nameY)
    ctx.fillStyle = '#9aa8c8'
    ctx.font = '600 11px ui-sans-serif, system-ui, sans-serif'
    ctx.fillText(fmtCash(price) + ' · ' + fmtAud(each), x + 40, hintY)
  } else {
    const def = upgradeDef(row.id as UpgradeId)!
    drawUpgradeIcon(ctx, x + 18, y + h / 2, def.id)
    ctx.fillStyle = '#f4efe6'
    ctx.font = '800 13px ui-sans-serif, system-ui, sans-serif'
    ctx.fillText(def.name, x + 40, nameY)
    ctx.fillStyle = '#9aa8c8'
    ctx.font = '600 11px ui-sans-serif, system-ui, sans-serif'
    ctx.fillText(fmtCash(def.cost) + ' · ' + def.hint, x + 40, hintY)
  }

  const b = row.buy
  fillRr(ctx, b.x, b.y, b.w, b.h, 7, ok ? '#2f9e58' : '#3a4458')
  ctx.fillStyle = ok ? '#f4fff4' : '#8a93a4'
  ctx.font = '800 12px ui-sans-serif, system-ui, sans-serif'
  ctx.textAlign = 'center'
  ctx.textBaseline = 'middle'
  ctx.fillText('BUY', b.x + b.w / 2, b.y + b.h / 2)
}

function drawMysteryIcon(ctx: CanvasRenderingContext2D, x: number, y: number) {
  ctx.fillStyle = '#2a3348'
  ctx.beginPath()
  ctx.arc(x, y, 9, 0, Math.PI * 2)
  ctx.fill()
  ctx.fillStyle = '#6e7c96'
  ctx.font = '800 11px ui-sans-serif'
  ctx.textAlign = 'center'
  ctx.textBaseline = 'middle'
  ctx.fillText('?', x, y + 0.5)
}

function drawUnlockIcon(
  ctx: CanvasRenderingContext2D,
  x: number,
  y: number,
  id: UnlockId,
  s: State,
) {
  if (id === 'webcam') {
    fillRr(ctx, x - 8, y - 6, 16, 11, 2, s.owned.webcam ? '#4aa3e8' : '#8aa0b8')
    ctx.fillStyle = '#12202e'
    ctx.beginPath()
    ctx.arc(x, y, 3.2, 0, Math.PI * 2)
    ctx.fill()
    ctx.fillStyle = s.owned.webcam ? '#4aa3e8' : '#8aa0b8'
    ctx.fillRect(x + 6, y - 2, 5, 4)
  } else if (id === 'ring') {
    ctx.strokeStyle = s.owned.ring ? '#ffe27a' : '#c8c0a8'
    ctx.lineWidth = 3
    ctx.beginPath()
    ctx.arc(x, y, 8, 0, Math.PI * 2)
    ctx.stroke()
  } else if (id === 'mic') {
    ctx.fillStyle = '#1a1a1e'
    ctx.beginPath()
    ctx.ellipse(x, y - 2, 5, 7, 0, 0, Math.PI * 2)
    ctx.fill()
    ctx.fillStyle = '#555'
    ctx.fillRect(x - 1.5, y + 4, 3, 6)
  } else if (id === 'thumbnail') {
    fillRr(ctx, x - 9, y - 7, 18, 14, 2, '#2a2e38')
    ctx.fillStyle = '#e23d3d'
    ctx.beginPath()
    ctx.moveTo(x - 3, y - 4)
    ctx.lineTo(x - 3, y + 4)
    ctx.lineTo(x + 5, y)
    ctx.closePath()
    ctx.fill()
  } else {
    ctx.fillStyle = '#ff7a18'
    ctx.font = '800 16px ui-sans-serif'
    ctx.textAlign = 'center'
    ctx.textBaseline = 'middle'
    ctx.fillText('🔥', x, y + 1)
  }
}

function drawUpgradeIcon(ctx: CanvasRenderingContext2D, x: number, y: number, id: UpgradeId) {
  ctx.textAlign = 'center'
  ctx.textBaseline = 'middle'
  if (id === 'autofocus') {
    ctx.strokeStyle = '#8ad4ff'
    ctx.lineWidth = 2
    ctx.beginPath()
    ctx.arc(x, y, 6, 0, Math.PI * 2)
    ctx.stroke()
    ctx.beginPath()
    ctx.arc(x, y, 2, 0, Math.PI * 2)
    ctx.stroke()
  } else if (id === 'fasterTakes') {
    ctx.fillStyle = '#f0c14b'
    ctx.beginPath()
    ctx.moveTo(x - 3, y - 8)
    ctx.lineTo(x + 5, y - 1)
    ctx.lineTo(x + 0.5, y - 1)
    ctx.lineTo(x + 4, y + 8)
    ctx.lineTo(x - 5, y + 1)
    ctx.lineTo(x - 0.5, y + 1)
    ctx.closePath()
    ctx.fill()
  } else if (id === 'catchlight') {
    ctx.strokeStyle = '#ffe27a'
    ctx.lineWidth = 2
    ctx.beginPath()
    ctx.arc(x, y, 7, 0, Math.PI * 2)
    ctx.stroke()
    ctx.fillStyle = '#fff4c8'
    ctx.beginPath()
    ctx.arc(x + 3, y - 3, 2, 0, Math.PI * 2)
    ctx.fill()
  } else if (id === 'nightStream') {
    ctx.fillStyle = '#7aa0e8'
    ctx.beginPath()
    ctx.arc(x, y, 7, 0, Math.PI * 2)
    ctx.fill()
    ctx.fillStyle = '#1b2a4a'
    ctx.beginPath()
    ctx.arc(x + 3, y - 1, 5.5, 0, Math.PI * 2)
    ctx.fill()
  } else if (id === 'popFilter') {
    ctx.strokeStyle = '#c8d0dc'
    ctx.lineWidth = 2
    ctx.beginPath()
    ctx.arc(x, y, 7, 0, Math.PI * 2)
    ctx.stroke()
    ctx.fillStyle = '#1a1a1e'
    ctx.beginPath()
    ctx.ellipse(x, y, 3, 4.5, 0, 0, Math.PI * 2)
    ctx.fill()
  } else if (id === 'loudTakes') {
    ctx.fillStyle = '#e8eefc'
    ctx.beginPath()
    ctx.moveTo(x - 6, y - 3)
    ctx.lineTo(x - 2, y - 3)
    ctx.lineTo(x + 3, y - 7)
    ctx.lineTo(x + 3, y + 7)
    ctx.lineTo(x - 2, y + 3)
    ctx.lineTo(x - 6, y + 3)
    ctx.closePath()
    ctx.fill()
  } else if (id === 'redArrow') {
    ctx.fillStyle = '#e23d3d'
    ctx.beginPath()
    ctx.moveTo(x - 2, y + 7)
    ctx.lineTo(x - 2, y - 2)
    ctx.lineTo(x - 7, y - 2)
    ctx.lineTo(x + 2, y - 9)
    ctx.lineTo(x + 8, y - 2)
    ctx.lineTo(x + 3, y - 2)
    ctx.lineTo(x + 3, y + 7)
    ctx.closePath()
    ctx.fill()
  } else {
    ctx.fillStyle = '#ff7a18'
    ctx.font = '800 11px ui-sans-serif'
    ctx.fillText('#', x, y + 1)
  }
}

function drawTap(ctx: CanvasRenderingContext2D, s: State, L: Layout) {
  const { x, y, r } = L.tap
  const squash = 1 - s.tapPulse * 0.08
  const rr0 = r * squash

  ctx.fillStyle = 'rgba(0,0,0,0.35)'
  ctx.beginPath()
  ctx.ellipse(x, y + rr0 * 0.22, rr0 * 0.92, rr0 * 0.22, 0, 0, Math.PI * 2)
  ctx.fill()

  for (const rip of s.ripples) {
    ctx.strokeStyle = `rgba(255,255,255,${rip.a})`
    ctx.lineWidth = 2
    ctx.beginPath()
    ctx.arc(x, y, rr0 + rip.r, 0, Math.PI * 2)
    ctx.stroke()
  }

  const g = ctx.createLinearGradient(x, y - rr0, x, y + rr0)
  g.addColorStop(0, '#ff5a5a')
  g.addColorStop(0.45, '#e23d3d')
  g.addColorStop(1, '#a81f2a')
  ctx.fillStyle = g
  ctx.beginPath()
  ctx.arc(x, y, rr0, 0, Math.PI * 2)
  ctx.fill()
  ctx.strokeStyle = 'rgba(255,255,255,0.28)'
  ctx.lineWidth = 3
  ctx.beginPath()
  ctx.arc(x, y, rr0 - 3, Math.PI * 1.1, Math.PI * 1.85)
  ctx.stroke()

  ctx.fillStyle = '#fff'
  ctx.beginPath()
  ctx.moveTo(x - 7, y - 18)
  ctx.lineTo(x - 7, y - 4)
  ctx.lineTo(x + 6, y - 11)
  ctx.closePath()
  ctx.fill()

  ctx.fillStyle = '#fff'
  ctx.font = `800 ${Math.round(rr0 * 0.38)}px ui-sans-serif, system-ui, sans-serif`
  ctx.textAlign = 'center'
  ctx.textBaseline = 'middle'
  ctx.fillText('TAP', x, y + 10)

  fillRr(ctx, x - 92, y + rr0 + 8, 184, 22, 11, 'rgba(12,8,14,0.72)')
  ctx.fillStyle = '#d8d0c4'
  ctx.font = '600 12px ui-sans-serif, system-ui, sans-serif'
  ctx.fillText('mash to make content', x, y + rr0 + 19)
}

function drawFloaters(ctx: CanvasRenderingContext2D, s: State, L: Layout) {
  const f = fitOf(L.room)
  const originX = f.x(318)
  const originY = f.y(200)
  ctx.textAlign = 'center'
  ctx.textBaseline = 'middle'
  for (const fl of s.floaters) {
    const a = clamp(fl.life / fl.max, 0, 1)
    ctx.globalAlpha = a
    ctx.fillStyle = fl.color
    ctx.font = '800 20px ui-sans-serif, system-ui, sans-serif'
    ctx.fillText(fl.text, fl.x, fl.y)
  }
  for (const b of s.bits) {
    const a = clamp(b.life / b.max, 0, 1)
    ctx.globalAlpha = a
    if (b.kind === 'clip') {
      ctx.fillStyle = '#f4efe6'
      ctx.fillRect(b.x, b.y, 16, 11)
      ctx.fillStyle = '#e23d3d'
      ctx.fillRect(b.x + 2, b.y + 2, 12, 7)
    } else {
      ctx.fillStyle = '#f0c14b'
      star(ctx, originX + b.x, originY + b.y, 5)
    }
  }
  ctx.globalAlpha = 1
}

function drawDone(ctx: CanvasRenderingContext2D, L: Layout) {
  const x = L.room.x + L.room.w / 2
  const y = L.room.y + 28
  fillRr(ctx, x - 150, y, 300, 44, 12, 'rgba(20,12,8,0.78)')
  ctx.strokeStyle = '#f0c14b'
  ctx.lineWidth = 1.5
  rr(ctx, x - 150, y, 300, 44, 12)
  ctx.stroke()
  ctx.fillStyle = '#f0c14b'
  ctx.font = '800 16px ui-sans-serif, system-ui, sans-serif'
  ctx.textAlign = 'center'
  ctx.textBaseline = 'middle'
  ctx.fillText('Bedroom Era done', x, y + 16)
  ctx.fillStyle = '#d8d0c4'
  ctx.font = '600 11px ui-sans-serif, system-ui, sans-serif'
  ctx.fillText('1,000 subs  ·  keep tapping', x, y + 32)
}

export function hitRect(r: Rect, x: number, y: number): boolean {
  return x >= r.x && y >= r.y && x <= r.x + r.w && y <= r.y + r.h
}

export function hitTap(L: Layout, x: number, y: number): boolean {
  const dx = x - L.tap.x
  const dy = y - L.tap.y
  return dx * dx + dy * dy <= (L.tap.r + 8) ** 2
}

export function laptopPoint(L: Layout): { x: number; y: number } {
  const f = fitOf(L.room)
  return { x: f.x(318), y: f.y(200) }
}
