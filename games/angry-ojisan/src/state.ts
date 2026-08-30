import { lerp } from '@web-games/kit'

export const FACE_COUNT = 25
export const SAFE_BUBBLE_LIFE = 0.4
export const ANGRY_BUBBLE_LIFE = 1.8
export const LOSE_BEAT = 0.72
export const POP_SECS = 0.26

export type Phase = 'play' | 'over'

export type Box = { x: number; y: number; w: number; h: number }

export type Uncle = {
  id: number
  angry: boolean
  live: boolean
  x: number
  y: number
  r: number
  cell: number
  tx: number
  ty: number
  tr: number
  tcell: number
  fly: number
  vx: number
  vy: number
  spin: number
  angle: number
  pop: number
}

export type Floater = {
  x: number
  y: number
  vx: number
  vy: number
  r: number
  text: string
  life: number
  maxLife: number
  angry: boolean
  follow: number
}

export type State = {
  uncles: Uncle[]
  phase: Phase
  overAge: number
  time: number
  yell: number
  shake: number
  lastLine: string
  floaters: Floater[]
}

export type Layout = {
  width: number
  height: number
  box: Box
  titleY: number
  subY: number
  footY: number
}

const SAFE_LINES = [
  'Hmph.',
  'Watch it.',
  'Not the scalp.',
  "I'm fine.",
  'Back in my day.',
  'Buy property.',
  "That's my good side.",
  'Kids these days.',
  "Don't tell your aunt.",
  "I wasn't sleeping.",
  'Who raised you?',
  'My lawn. My rules.',
  'Ask your mother.',
  'I paid for that.',
  'Hands off the dome.',
  'Easy, tiger.',
  'I just sat down.',
  'Call me uncle.',
]

export const ANGRY_YELL = "OY!! THAT'S ME!!"

function pickLine(last: string) {
  if (SAFE_LINES.length === 1) return SAFE_LINES[0]
  let line = SAFE_LINES[Math.floor(Math.random() * SAFE_LINES.length)]
  if (line === last) {
    line = SAFE_LINES[(SAFE_LINES.indexOf(line) + 1) % SAFE_LINES.length]
  }
  return line
}

export function createState(): State {
  const s: State = {
    uncles: [],
    phase: 'play',
    overAge: 0,
    time: 0,
    yell: 0,
    shake: 0,
    lastLine: '',
    floaters: [],
  }
  deal(s)
  return s
}

export function deal(s: State) {
  const angry = Math.floor(Math.random() * FACE_COUNT)
  s.uncles = []
  for (let i = 0; i < FACE_COUNT; i++) {
    s.uncles.push({
      id: i,
      angry: i === angry,
      live: true,
      x: 0,
      y: 0,
      r: 20,
      cell: 40,
      tx: 0,
      ty: 0,
      tr: 20,
      tcell: 40,
      fly: 0,
      vx: 0,
      vy: 0,
      spin: 0,
      angle: 0,
      pop: 0,
    })
  }
  s.phase = 'play'
  s.overAge = 0
  s.yell = 0
  s.shake = 0
  s.floaters = []
}

export function living(s: State) {
  return s.uncles.filter((u) => u.live)
}

export type Traits = {
  skin: number
  hair: number
  stache: number
  brow: number
  scale: number
  tilt: number
  collar: number
  glasses: number
  jaw: number
}

export function traits(id: number): Traits {
  const unit = (n: number) => {
    const x = Math.sin(id * 17.13 + n * 43.77) * 1453.21
    return x - Math.floor(x)
  }
  return {
    skin: unit(1),
    hair: unit(2),
    stache: unit(3),
    brow: unit(4),
    scale: 0.93 + unit(5) * 0.1,
    tilt: (unit(6) - 0.5) * 0.12,
    collar: unit(7),
    glasses: unit(8),
    jaw: unit(9),
  }
}

export function layout(width: number, height: number): Layout {
  const top = Math.min(118, Math.max(86, height * 0.17))
  const foot = Math.min(70, Math.max(48, height * 0.1))
  const pad = Math.min(width, height) * 0.045
  const side = Math.min(width - pad * 2, height - top - foot)
  return {
    width,
    height,
    box: {
      x: (width - side) / 2,
      y: top + (height - top - foot - side) / 2,
      w: side,
      h: side,
    },
    titleY: Math.max(36, top * 0.42),
    subY: Math.max(58, top * 0.72),
    footY: height - Math.max(22, foot * 0.42),
  }
}

export function packSlots(box: Box) {
  const cols = 5
  const inset = Math.min(box.w, box.h) * 0.05
  const inner = {
    x: box.x + inset,
    y: box.y + inset,
    w: box.w - inset * 2,
    h: box.h - inset * 2,
  }
  const gap = Math.min(inner.w, inner.h) * 0.012
  const cell = Math.min((inner.w - gap * 4) / cols, (inner.h - gap * 4) / cols)
  const grid = cols * cell + (cols - 1) * gap
  const ox = inner.x + (inner.w - grid) / 2
  const oy = inner.y + (inner.h - grid) / 2
  const slots: { x: number; y: number; r: number; cell: number }[] = []
  for (let i = 0; i < FACE_COUNT; i++) {
    const col = i % cols
    const row = Math.floor(i / cols)
    slots.push({
      x: ox + col * (cell + gap) + cell / 2,
      y: oy + row * (cell + gap) + cell / 2,
      r: cell * 0.46,
      cell,
    })
  }
  return slots
}

export function assignPack(s: State, box: Box, snap = false) {
  const slots = packSlots(box)
  for (const u of s.uncles) {
    const p = slots[u.id]
    u.tx = p.x
    u.ty = p.y
    u.tr = p.r
    u.tcell = p.cell
    if (snap) {
      u.x = p.x
      u.y = p.y
      u.r = p.r
      u.cell = p.cell
    }
  }
}

export function hitUncle(s: State, x: number, y: number) {
  let best: Uncle | null = null
  let bestD = Infinity
  for (const u of living(s)) {
    const reach = u.cell * 0.5
    const d = Math.hypot(x - u.x, y - u.y)
    if (d <= reach && d < bestD) {
      best = u
      bestD = d
    }
  }
  return best
}

export function inBox(box: Box, x: number, y: number) {
  return x >= box.x && y >= box.y && x <= box.x + box.w && y <= box.y + box.h
}

export function tapUncle(s: State, u: Uncle) {
  if (s.phase !== 'play' || !u.live) return
  if (u.angry) {
    s.phase = 'over'
    s.overAge = 0
    s.yell = 1
    s.shake = 1
    u.pop = 0
    s.floaters.push({
      x: u.x,
      y: u.y,
      vx: 0,
      vy: 0,
      r: u.r,
      text: ANGRY_YELL,
      life: ANGRY_BUBBLE_LIFE,
      maxLife: ANGRY_BUBBLE_LIFE,
      angry: true,
      follow: u.id,
    })
    return
  }
  u.live = false
  u.fly = 0.55
  u.vx = (Math.random() - 0.5) * 520
  u.vy = -520 - Math.random() * 120
  u.spin = (Math.random() - 0.5) * 12
  const line = pickLine(s.lastLine)
  s.lastLine = line
  s.floaters.push({
    x: u.x,
    y: u.y - u.r * 1.55,
    vx: u.vx,
    vy: u.vy - 40,
    r: u.r,
    text: line,
    life: SAFE_BUBBLE_LIFE,
    maxLife: SAFE_BUBBLE_LIFE,
    angry: false,
    follow: -1,
  })
}

export function resetRound(s: State, box: Box) {
  deal(s)
  assignPack(s, box, true)
}

export function tick(s: State, dt: number, box: Box) {
  s.time += dt
  if (s.phase === 'over') s.overAge += dt
  s.yell = Math.max(0, s.yell - dt * 1.6)
  s.shake = Math.max(0, s.shake - dt * 3.2)
  assignPack(s, box, false)
  const ease = 1 - Math.pow(0.0008, dt)
  for (const u of s.uncles) {
    if (u.fly > 0) {
      u.fly -= dt
      u.x += u.vx * dt
      u.y += u.vy * dt
      u.vy += 980 * dt
      u.angle += u.spin * dt
    } else if (u.live) {
      u.x = lerp(u.x, u.tx, ease)
      u.y = lerp(u.y, u.ty, ease)
      u.r = lerp(u.r, u.tr, ease)
      u.cell = lerp(u.cell, u.tcell, ease)
      u.angle *= Math.max(0, 1 - dt * 8)
    }
    if (u.angry && s.phase === 'over') {
      u.pop = Math.min(1, u.pop + dt / POP_SECS)
    }
  }
  for (const f of s.floaters) {
    f.life -= dt
    if (f.follow >= 0) {
      const u = s.uncles[f.follow]
      if (u) {
        const grow = 1 + u.pop * 1.72
        f.x = u.x
        f.y = u.y - u.r * grow * 0.55
        f.r = u.r * grow
      }
    } else {
      f.x += f.vx * dt
      f.y += f.vy * dt
      f.vy += 980 * dt
    }
  }
  s.floaters = s.floaters.filter((f) => f.life > 0)
}
