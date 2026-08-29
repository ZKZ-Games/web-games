import { createCanvas, createInput, createLoop } from '@web-games/kit'

const TITLE = 'Smile Tac Toe'
const parent = document.querySelector('#app')
if (!(parent instanceof HTMLElement)) throw new Error('missing #app')

const view = createCanvas(parent, { background: '#fff4e0' })
const input = createInput(view.canvas)

type Mark = 0 | 1 | 2
type Mode = 'play' | 'over'

const LINES: readonly (readonly [number, number, number])[] = [
  [0, 1, 2],
  [3, 4, 5],
  [6, 7, 8],
  [0, 3, 6],
  [1, 4, 7],
  [2, 5, 8],
  [0, 4, 8],
  [2, 4, 6],
]

const YELLOW = {
  face: '#ffd54a',
  rim: '#f4b942',
  ink: '#5a3e12',
  blush: '#ff9a7a',
  label: 'Yellow',
}
const PINK = {
  face: '#ff7eb3',
  rim: '#f0629a',
  ink: '#5a1d3a',
  blush: '#ffb3c9',
  label: 'Pink',
}

const board: Mark[] = [0, 0, 0, 0, 0, 0, 0, 0, 0]
const pop = [0, 0, 0, 0, 0, 0, 0, 0, 0]
let turn: 1 | 2 = 1
let mode: Mode = 'play'
let winner: Mark = 0
let winLine: readonly [number, number, number] | null = null
let time = 0
let overAge = 0

function palette(mark: 1 | 2) {
  return mark === 1 ? YELLOW : PINK
}

function reset() {
  for (let i = 0; i < 9; i++) {
    board[i] = 0
    pop[i] = 0
  }
  turn = 1
  mode = 'play'
  winner = 0
  winLine = null
  overAge = 0
}

function winnerOf(cells: Mark[]): {
  mark: Mark
  line: readonly [number, number, number] | null
} {
  for (const line of LINES) {
    const a = cells[line[0]]
    if (a !== 0 && a === cells[line[1]] && a === cells[line[2]]) {
      return { mark: a, line }
    }
  }
  return { mark: 0, line: null }
}

function boardFull(cells: Mark[]) {
  return cells.every((c) => c !== 0)
}

function layout() {
  const { width, height } = view
  const short = Math.min(width, height)
  const titleH = Math.min(112, height * 0.18)
  const footH = Math.min(88, height * 0.14)
  const size = Math.min(width * 0.86, height - titleH - footH, short * 0.82, 520)
  return {
    width,
    height,
    size,
    cell: size / 3,
    ox: (width - size) / 2,
    oy: titleH + (height - titleH - footH - size) / 2,
    titleY: Math.max(36, titleH * 0.42),
    turnY: Math.max(68, titleH * 0.78),
    footY: height - Math.max(28, footH * 0.42),
  }
}

function cellAt(x: number, y: number) {
  const L = layout()
  if (x < L.ox || y < L.oy || x >= L.ox + L.size || y >= L.oy + L.size) return -1
  const col = Math.floor((x - L.ox) / L.cell)
  const row = Math.floor((y - L.oy) / L.cell)
  return row * 3 + col
}

function place(i: number) {
  if (mode !== 'play' || board[i] !== 0) return
  board[i] = turn
  pop[i] = 1
  const result = winnerOf(board)
  if (result.mark !== 0) {
    mode = 'over'
    winner = result.mark
    winLine = result.line
    overAge = 0
    return
  }
  if (boardFull(board)) {
    mode = 'over'
    winner = 0
    winLine = null
    overAge = 0
    return
  }
  turn = turn === 1 ? 2 : 1
}

function drawSmile(
  ctx: CanvasRenderingContext2D,
  x: number,
  y: number,
  r: number,
  mark: 1 | 2,
  bounce = 0,
  lit = false,
) {
  const p = palette(mark)
  const scale = 1 + bounce * 0.22 + (lit ? 0.08 + Math.sin(time * 7) * 0.04 : 0)
  ctx.save()
  ctx.translate(x, y)
  ctx.scale(scale, scale)
  if (lit) {
    ctx.shadowColor = p.face
    ctx.shadowBlur = r * 1.1
  }
  ctx.fillStyle = lit ? (mark === 1 ? '#fff3b0' : '#ffd0e4') : p.face
  ctx.beginPath()
  ctx.arc(0, 0, r, 0, Math.PI * 2)
  ctx.fill()
  ctx.shadowBlur = 0
  ctx.strokeStyle = p.rim
  ctx.lineWidth = Math.max(2, r * 0.08)
  ctx.stroke()
  ctx.fillStyle = p.ink
  if (mark === 1) {
    ctx.beginPath()
    ctx.arc(-r * 0.28, -r * 0.12, r * 0.1, 0, Math.PI * 2)
    ctx.arc(r * 0.28, -r * 0.12, r * 0.1, 0, Math.PI * 2)
    ctx.fill()
  } else {
    ctx.lineCap = 'round'
    ctx.strokeStyle = p.ink
    ctx.lineWidth = Math.max(2, r * 0.1)
    ctx.beginPath()
    ctx.arc(-r * 0.28, -r * 0.1, r * 0.12, 1.15 * Math.PI, 1.85 * Math.PI)
    ctx.stroke()
    ctx.beginPath()
    ctx.arc(r * 0.28, -r * 0.12, r * 0.1, 0, Math.PI * 2)
    ctx.fill()
  }
  ctx.strokeStyle = p.ink
  ctx.lineWidth = Math.max(2, r * 0.1)
  ctx.lineCap = 'round'
  ctx.beginPath()
  if (mark === 1) ctx.arc(0, r * 0.06, r * 0.42, 0.18 * Math.PI, 0.82 * Math.PI)
  else ctx.arc(0, r * 0.02, r * 0.48, 0.12 * Math.PI, 0.88 * Math.PI)
  ctx.stroke()
  ctx.restore()
}

function drawBoard(L: ReturnType<typeof layout>) {
  const { ctx } = view
  ctx.save()
  ctx.fillStyle = '#fffaf3'
  ctx.strokeStyle = '#f4c27a'
  ctx.lineWidth = 3
  const r = Math.min(28, L.cell * 0.18)
  roundRect(ctx, L.ox - 10, L.oy - 10, L.size + 20, L.size + 20, r + 8)
  ctx.fill()
  ctx.stroke()

  const hover = mode === 'play' ? cellAt(input.pointer.x, input.pointer.y) : -1
  for (let i = 0; i < 9; i++) {
    const col = i % 3
    const row = Math.floor(i / 3)
    const x = L.ox + col * L.cell
    const y = L.oy + row * L.cell
    const pad = L.cell * 0.08
    ctx.fillStyle =
      hover === i && board[i] === 0 ? (turn === 1 ? '#fff3c4' : '#ffe0ee') : '#fffdf8'
    ctx.strokeStyle = '#f0c48a'
    ctx.lineWidth = 2
    roundRect(ctx, x + pad, y + pad, L.cell - pad * 2, L.cell - pad * 2, pad * 1.4)
    ctx.fill()
    ctx.stroke()
    const mark = board[i]
    if (mark !== 0) {
      const lit = !!winLine && winLine.includes(i)
      drawSmile(ctx, x + L.cell / 2, y + L.cell / 2, L.cell * 0.28, mark, pop[i], lit)
    }
  }
  ctx.restore()
}

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

function drawHud(L: ReturnType<typeof layout>) {
  const { ctx } = view
  ctx.textAlign = 'center'
  ctx.textBaseline = 'middle'
  ctx.fillStyle = '#3d2b1f'
  ctx.font = `800 ${Math.round(Math.min(40, L.width * 0.07))}px ui-rounded, ui-sans-serif, system-ui, sans-serif`
  ctx.fillText(TITLE, L.width / 2, L.titleY)

  if (mode === 'play') {
    const p = palette(turn)
    drawSmile(ctx, L.width / 2 - 88, L.turnY, 15, turn, 0)
    ctx.fillStyle = p.ink
    ctx.font = `700 ${Math.round(Math.min(22, L.width * 0.045))}px ui-sans-serif, system-ui, sans-serif`
    ctx.fillText(`${p.label}'s turn  ·  tap a cell`, L.width / 2 + 18, L.turnY)
    ctx.fillStyle = '#8a6a4a'
    ctx.font = '600 15px ui-sans-serif, system-ui, sans-serif'
    ctx.fillText('take turns tapping smiles  ·  three in a row', L.width / 2, L.footY)
  } else {
    ctx.fillStyle = '#8a6a4a'
    ctx.font = '600 16px ui-sans-serif, system-ui, sans-serif'
    const ready = overAge > 0.45
    const line =
      winner === 0
        ? ready
          ? 'draw  ·  tap the board'
          : 'draw'
        : ready
          ? 'tap the board'
          : ''
    if (line) ctx.fillText(line, L.width / 2, L.footY)
  }
}

const loop = createLoop((dt) => {
  time += dt
  if (mode === 'over') overAge += dt
  for (let i = 0; i < 9; i++) pop[i] = Math.max(0, pop[i] - dt * 4.5)

  if (input.pointer.pressed) {
    const i = cellAt(input.pointer.x, input.pointer.y)
    if (mode === 'over') {
      if (overAge > 0.45 && i >= 0) reset()
    } else if (i >= 0) place(i)
  }

  view.clear()
  const L = layout()
  drawBoard(L)
  drawHud(L)
  input.update()
})

loop.start()
