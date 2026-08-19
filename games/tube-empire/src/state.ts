import { clamp } from '@web-games/kit'

export const SUB_GOAL = 1000

export type UnlockId = 'webcam' | 'ring' | 'mic' | 'thumbnail' | 'viral'

export type UpgradeId =
  | 'autofocus'
  | 'fasterTakes'
  | 'catchlight'
  | 'nightStream'
  | 'popFilter'
  | 'loudTakes'
  | 'redArrow'
  | 'trendingTag'

export type ShopKind = 'unlock' | 'upgrade'
export type ShopItemId = UnlockId | UpgradeId

export type UnlockDef = {
  id: UnlockId
  name: string
  cost: number
  audPerSec: number
}

export type UpgradeDef = {
  id: UpgradeId
  unlockId: UnlockId
  name: string
  hint: string
  cost: number
  kind: 'generator' | 'tapAudience' | 'tap'
  mult: number
}

export const UNLOCKS: UnlockDef[] = [
  { id: 'webcam', name: 'Cheap webcam', cost: 4, audPerSec: 0.08 },
  { id: 'ring', name: 'Ring light', cost: 18, audPerSec: 0.25 },
  { id: 'mic', name: 'USB mic', cost: 55, audPerSec: 0.7 },
  { id: 'thumbnail', name: 'Thumbnail kit', cost: 160, audPerSec: 2 },
  { id: 'viral', name: 'Viral moment', cost: 480, audPerSec: 6 },
]

export const UPGRADES: UpgradeDef[] = [
  {
    id: 'autofocus',
    unlockId: 'webcam',
    name: 'Autofocus',
    hint: 'webcam aud/s ×1.5',
    cost: 12,
    kind: 'generator',
    mult: 1.5,
  },
  {
    id: 'fasterTakes',
    unlockId: 'webcam',
    name: 'Faster takes',
    hint: 'tap audience +50%',
    cost: 20,
    kind: 'tapAudience',
    mult: 1.5,
  },
  {
    id: 'catchlight',
    unlockId: 'ring',
    name: 'Catchlight',
    hint: 'ring aud/s ×1.5',
    cost: 30,
    kind: 'generator',
    mult: 1.5,
  },
  {
    id: 'nightStream',
    unlockId: 'ring',
    name: 'Night stream',
    hint: 'tap +25%',
    cost: 45,
    kind: 'tap',
    mult: 1.25,
  },
  {
    id: 'popFilter',
    unlockId: 'mic',
    name: 'Pop filter',
    hint: 'mic aud/s ×1.5',
    cost: 80,
    kind: 'generator',
    mult: 1.5,
  },
  {
    id: 'loudTakes',
    unlockId: 'mic',
    name: 'Loud takes',
    hint: 'tap +50%',
    cost: 120,
    kind: 'tap',
    mult: 1.5,
  },
  {
    id: 'redArrow',
    unlockId: 'thumbnail',
    name: 'Red arrow',
    hint: 'thumbnail aud/s ×2',
    cost: 200,
    kind: 'generator',
    mult: 2,
  },
  {
    id: 'trendingTag',
    unlockId: 'viral',
    name: 'Trending tag',
    hint: 'viral aud/s ×2',
    cost: 600,
    kind: 'generator',
    mult: 2,
  },
]

const BASE_VIEWS = 1
const BASE_AUDIENCE = 0.012
const BASE_CASH = 0.21
const UNLOCK_GROWTH = 1.15

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
  owned: Record<UnlockId, number>
  bought: Record<UpgradeId, boolean>
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
  shopScroll: number
}

const ACTS: Act[] = ['talk', 'record', 'clip']

function emptyOwned(): Record<UnlockId, number> {
  return { webcam: 0, ring: 0, mic: 0, thumbnail: 0, viral: 0 }
}

function emptyBought(): Record<UpgradeId, boolean> {
  return {
    autofocus: false,
    fasterTakes: false,
    catchlight: false,
    nightStream: false,
    popFilter: false,
    loudTakes: false,
    redArrow: false,
    trendingTag: false,
  }
}

export function createState(): State {
  return {
    views: 0,
    cash: 0,
    subs: 0,
    audience: 0,
    owned: emptyOwned(),
    bought: emptyBought(),
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
    shopScroll: 0,
  }
}

export function unlockDef(id: UnlockId): UnlockDef | undefined {
  return UNLOCKS.find((u) => u.id === id)
}

export function upgradeDef(id: UpgradeId): UpgradeDef | undefined {
  return UPGRADES.find((u) => u.id === id)
}

export function isUnlockId(id: ShopItemId): id is UnlockId {
  return UNLOCKS.some((u) => u.id === id)
}

export function unlockRevealed(s: State, id: UnlockId): boolean {
  const i = UNLOCKS.findIndex((u) => u.id === id)
  if (i <= 0) return true
  return s.owned[UNLOCKS[i - 1].id] >= 1
}

export function visibleUnlocks(s: State): { def: UnlockDef; mystery: boolean }[] {
  const rows: { def: UnlockDef; mystery: boolean }[] = []
  for (const def of UNLOCKS) {
    if (unlockRevealed(s, def.id)) {
      rows.push({ def, mystery: false })
    } else {
      rows.push({ def, mystery: true })
      break
    }
  }
  return rows
}

export function visibleUpgrades(s: State): UpgradeDef[] {
  return UPGRADES.filter((u) => s.owned[u.unlockId] >= 1 && !s.bought[u.id])
}

export function unlockMul(s: State, id: UnlockId): number {
  let mul = 1
  for (const u of UPGRADES) {
    if (u.unlockId === id && u.kind === 'generator' && s.bought[u.id]) mul *= u.mult
  }
  return mul
}

export function unlockAudPerSec(s: State, id: UnlockId): number {
  const def = unlockDef(id)
  if (!def) return 0
  return def.audPerSec * unlockMul(s, id)
}

export function audiencePerSec(s: State): number {
  let rate = 0
  for (const def of UNLOCKS) {
    rate += s.owned[def.id] * unlockAudPerSec(s, def.id)
  }
  return rate
}

function tapMults(s: State): { views: number; audience: number; cash: number } {
  let views = 1
  let audience = 1
  let cash = 1
  for (const u of UPGRADES) {
    if (!s.bought[u.id]) continue
    if (u.kind === 'tapAudience') audience *= u.mult
    if (u.kind === 'tap') {
      views *= u.mult
      audience *= u.mult
      cash *= u.mult
    }
  }
  return { views, audience, cash }
}

export function priceOf(def: UnlockDef, owned: number): number {
  return Math.round(def.cost * UNLOCK_GROWTH ** owned * 100) / 100
}

export function fmtInt(n: number): string {
  return Math.floor(n).toLocaleString('en-US')
}

export function fmtCash(n: number): string {
  if (n < 100) {
    const cents = Math.round(n * 100)
    if (cents % 100 === 0) return '$' + cents / 100
    return '$' + (cents / 100).toFixed(2)
  }
  return '$' + Math.floor(n).toLocaleString('en-US')
}

export function fmtRate(n: number): string {
  return '$' + n.toFixed(2) + '/sec'
}

export function fmtAud(n: number): string {
  const rounded = Math.round(n * 1000) / 1000
  if (Number.isInteger(rounded)) return rounded + ' aud/s'
  const text = rounded.toFixed(3).replace(/0+$/, '').replace(/\.$/, '')
  return text + ' aud/s'
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
  const m = tapMults(s)
  const views = BASE_VIEWS * m.views
  s.views += views
  s.audience += BASE_AUDIENCE * m.audience
  s.cash += BASE_CASH * m.cash
  refreshSubs(s)

  s.act = ACTS[Math.floor(s.views) % ACTS.length]
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

export function buy(s: State, kind: ShopKind, id: ShopItemId): boolean {
  if (kind === 'unlock') {
    if (!isUnlockId(id)) return false
    const def = unlockDef(id)
    if (!def || !unlockRevealed(s, id)) return false
    const price = priceOf(def, s.owned[id])
    if (s.cash < price) return false
    s.cash -= price
    s.owned[id] += 1
    refreshSubs(s)
    return true
  }

  const def = upgradeDef(id as UpgradeId)
  if (!def) return false
  if (s.bought[def.id] || s.owned[def.unlockId] < 1) return false
  if (s.cash < def.cost) return false
  s.cash -= def.cost
  s.bought[def.id] = true
  refreshSubs(s)
  return true
}

export function canBuy(s: State, kind: ShopKind, id: ShopItemId): boolean {
  if (kind === 'unlock') {
    if (!isUnlockId(id)) return false
    const def = unlockDef(id)
    if (!def || !unlockRevealed(s, id)) return false
    return s.cash >= priceOf(def, s.owned[id])
  }
  const def = upgradeDef(id as UpgradeId)
  if (!def) return false
  if (s.bought[def.id] || s.owned[def.unlockId] < 1) return false
  return s.cash >= def.cost
}

export function tick(s: State, dt: number) {
  s.time += dt
  s.audience += audiencePerSec(s) * dt
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
