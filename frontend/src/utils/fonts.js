export const FONTS = [
  { id: 'shop' },
  { id: 'clear' },
  { id: 'naskh' },
  { id: 'simple' },
]

export const FONT_SIZE_MIN = 10
export const FONT_SIZE_MAX = 16
export const FONT_SIZE_DEFAULT = 16

export function clampTextSize(value) {
  if (value === 'small') return 12
  if (value === 'normal' || value === 'large') return 16
  const n = Number(value)
  if (!Number.isFinite(n)) return FONT_SIZE_DEFAULT
  return Math.min(FONT_SIZE_MAX, Math.max(FONT_SIZE_MIN, Math.round(n)))
}
