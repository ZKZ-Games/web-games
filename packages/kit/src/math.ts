export function clamp(n: number, min: number, max: number): number {
  return Math.min(max, Math.max(min, n))
}

export function lerp(a: number, b: number, t: number): number {
  return a + (b - a) * t
}

export function rand(min: number, max: number): number {
  return min + Math.random() * (max - min)
}

export function dist(x1: number, y1: number, x2: number, y2: number): number {
  const dx = x2 - x1
  const dy = y2 - y1
  return Math.hypot(dx, dy)
}

export function length(x: number, y: number): number {
  return Math.hypot(x, y)
}

export function normalize(x: number, y: number): { x: number; y: number } {
  const len = Math.hypot(x, y) || 1
  return { x: x / len, y: y / len }
}
