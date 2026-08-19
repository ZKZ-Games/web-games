import { clamp } from '@web-games/kit'

export const SUB_GOAL = 1000

export type UpgradeId = 'concept' | 'ring' | 'viral' | 'mic'

export type UpgradeDef = {
  id: UpgradeId
  name: string
  hint: string
  cost: number
  power: number
  audience: number
}

export const UPGRADES: UpgradeDef[] = [
  {
    id: 'concept',
    name: 'Concept',
    hint: 'sharper ideas',
    cost: 5,
    power: 0.45,
    audience: 0.015,
  },
  {
    id: 'ring',
    name: 'Ring Light',
    hint: 'face light',
    cost: 15,
    power: 0.55,
    audience: 0.02,
  },
  {
    id: 'viral',
    name: 'Viral clip',
    hint: 'harder ticks',
    cost: 25,
    power: 0.95,
    audience: 0.07,
  },
  {
    id: 'mic',
    name: 'USB Mic',
    hint: 'clear voice',
    cost: 25,
    power: 0.65,
    audience: 0.03,
  },
]

const BASE_VIEWS = 1
const BASE_AUDIENCE = 0.012
const BASE_CASH = 0.21
const PRICE_GROWTH = 1.48

export type Act = 'talk' | 'record' | 'clip'

export type Floater = {
  x: number
  y: number
  vy: number
  life: number
  max: number
  text: string
  color: string
}

export type Bit = {
  x: number
  y: number
  vx: number
  vy: number
  life: number
  max: number
  kind: 'clip' | 'star'
}

export type State = {
  views: number
  cash: number
  subs: number
  audience: number
  owned: Record<UpgradeId, number>
  act: Act
  bounce: number
  rec: number
  talk: number
  tapPulse: number
  eraDone: boolean
  justFinished: boolean
  time: number
  graph: number[]
  graphT: number
  floaters: Floater[]
  bits: Bit[]
  ripples: { r: number; a: number }[]
}

const ACTS: Act[] = ['talk', 'record', 'clip']

export function createState(): State {
  return {
    views: 0,
    cash: 0,
    subs: 0,
    audience: 0,
    owned: { concept: 0, ring: 0, viral: 0, mic: 0 },
    act: 'talk',
    bounce: 0,
    rec: 0,
    talk: 0,
    tapPulse: 0,
    eraDone: false,
    justFinished: false,
    time: 0,
    graph: [0, 0, 0, 0, 0, 0, 0, 0],
    graphT: 0,
    floaters: [],
    bits: [],
    ripples: [],
  }
}

export function tapPower(s: State): number {
  let p = 1
  for (const u of UPGRADES) p += s.owned[u.id] * u.power
  return p
}

export function priceOf(def: UpgradeDef, owned: number): number {
  return Math.round(def.cost * PRICE_GROWTH ** owned * 100) / 100
}

export function fmtInt(n: number): string {
  return Math.floor(n).toLocaleString('en-US')
}

export function fmtCash(n: number): string {
  if (n < 100) return '$' + n.toFixed(2)
  return '$' + Math.floor(n).toLocaleString('en-US')
}

export function fmtRate(n: number): string {
  return '$' + n.toFixed(2) + '/sec'
}

function refreshSubs(s: State) {
  const raw = s.views * 0.42 + s.audience * 52
  const next = clamp(Math.floor(raw), 0, SUB_GOAL)
  if (next >= SUB_GOAL && s.subs < SUB_GOAL) {
    s.eraDone = true
    s.justFinished = true
  }
  s.subs = next
}

export function tap(s: State, originX: number, originY: number): number {
  const p = tapPower(s)
  const views = BASE_VIEWS * p
  s.views += views
  s.audience += BASE_AUDIENCE * p
  s.cash += BASE_CASH * p
  refreshSubs(s)

  s.act = ACTS[Math.floor(s.views / p) % ACTS.length]
  s.bounce = 1
  s.tapPulse = 1
  s.rec = s.act === 'record' ? 1.15 : 0.55
  s.talk = s.act === 'talk' ? 0.4 : 0.12
  s.ripples.push({ r: 8, a: 0.7 })
  if (s.ripples.length > 6) s.ripples.shift()

  const gained = Math.max(1, Math.round(views))
  s.floaters.push({
    x: originX + (Math.random() - 0.5) * 36,
    y: originY,
    vy: -46 - Math.random() * 18,
    life: 0.85,
    max: 0.85,
    text: '+' + gained,
    color: '#ffe27a',
  })

  if (s.act === 'clip') {
    s.bits.push({
      x: originX,
      y: originY,
      vx: 70 + Math.random() * 40,
      vy: -90 - Math.random() * 40,
      life: 0.7,
      max: 0.7,
      kind: 'clip',
    })
  }

  return gained
}

export function buy(s: State, id: UpgradeId): boolean {
  const def = UPGRADES.find((u) => u.id === id)
  if (!def) return false
  const price = priceOf(def, s.owned[id])
  if (s.cash < price) return false
  s.cash -= price
  s.owned[id] += 1
  s.audience += def.audience
  refreshSubs(s)
  return true
}

export function tick(s: State, dt: number) {
  s.time += dt
  s.cash += s.audience * dt
  refreshSubs(s)

  s.bounce = Math.max(0, s.bounce - dt * 7)
  s.rec = Math.max(0, s.rec - dt * 2.2)
  s.talk = Math.max(0, s.talk - dt * 3)
  s.tapPulse = Math.max(0, s.tapPulse - dt * 5)

  s.graphT += dt
  if (s.graphT > 0.22) {
    s.graphT = 0
    s.graph.push(s.audience)
    if (s.graph.length > 18) s.graph.shift()
  }

  for (const f of s.floaters) {
    f.life -= dt
    f.y += f.vy * dt
    f.vy += 18 * dt
  }
  s.floaters = s.floaters.filter((f) => f.life > 0)

  for (const b of s.bits) {
    b.life -= dt
    b.x += b.vx * dt
    b.y += b.vy * dt
    b.vy += 70 * dt
  }
  s.bits = s.bits.filter((b) => b.life > 0)

  for (const r of s.ripples) {
    r.r += dt * 90
    r.a -= dt * 1.4
  }
  s.ripples = s.ripples.filter((r) => r.a > 0)

  if (s.justFinished) {
    s.justFinished = false
    for (let i = 0; i < 18; i++) {
      const a = (i / 18) * Math.PI * 2
      s.bits.push({
        x: 0,
        y: 0,
        vx: Math.cos(a) * (80 + (i % 4) * 20),
        vy: Math.sin(a) * (80 + (i % 3) * 16) - 40,
        life: 1.3,
        max: 1.3,
        kind: 'star',
      })
    }
  }
}

export function canBuy(s: State, id: UpgradeId): boolean {
  const def = UPGRADES.find((u) => u.id === id)
  if (!def) return false
  return s.cash >= priceOf(def, s.owned[id])
}
