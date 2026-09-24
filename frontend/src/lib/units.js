const GRAM = new Set(['g', 'gr', 'gram', 'grams'])
const CM = new Set(['cm', 'centimeter', 'centimetre', 'meter', 'metre', 'meters', 'metres'])
const PCS = new Set(['pcs', 'pc', 'piece', 'pieces'])

export const PRODUCT_UNITS = [
  { id: 'pcs', labelKey: 'unit.pcs', hintKey: 'unit.hintPcs' },
  { id: 'g', labelKey: 'unit.gram', hintKey: 'unit.hintGram' },
  { id: 'cm', labelKey: 'unit.meter', hintKey: 'unit.hintMeter' },
]

export function savedUnit(unit) {
  const raw = String(unit || 'pcs').trim()
  if (!raw) return 'pcs'
  const lower = raw.toLowerCase()
  if (GRAM.has(lower)) return 'g'
  if (CM.has(lower)) return 'cm'
  if (PCS.has(lower)) return 'pcs'
  return raw
}

export function unitFactor(unit) {
  const raw = String(unit || '').trim().toLowerCase()
  if (GRAM.has(raw)) return 1000
  if (CM.has(raw)) return 100
  return 1
}

export function qtyUnit(unit) {
  const raw = String(unit || '').trim().toLowerCase()
  if (GRAM.has(raw)) return 'g'
  if (CM.has(raw)) return 'cm'
  return String(unit || 'pcs').trim() || 'pcs'
}

export function priceBase(unit) {
  const factor = unitFactor(unit)
  if (factor === 1000) return 'kg'
  if (factor === 100) return 'm'
  return ''
}

export function stockInputUnit(unit) {
  return priceBase(unit) || qtyUnit(unit)
}

export function toStockQty(qty, unit) {
  return (Number(qty) || 0) * unitFactor(unit)
}

export function amountFromBase(qty, basePrice, unit) {
  const factor = unitFactor(unit)
  return (Number(qty) || 0) * (Number(basePrice) || 0) / factor
}

export function lineGoods(line) {
  return Math.max(0, amountFromBase(line?.qty, line?.price, line?.unit) - (Number(line?.discount) || 0))
}
