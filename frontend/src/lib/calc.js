import { round2 } from '../utils/format.js'

export function lineTotals({ qty, price, discount = 0, taxable }, taxRate) {
  const qtyN = Number(qty) || 0
  const priceN = Number(price) || 0
  const disc = Number(discount) || 0
  const subtotal = round2(Math.max(0, qtyN * priceN - disc))
  const tax = taxable ? round2(subtotal * (Number(taxRate) || 0) / 100) : 0
  return { subtotal, tax, total: round2(subtotal + tax) }
}

export function docTotals(items, taxRate) {
  const lines = (items || []).map((item) => ({
    ...item,
    ...lineTotals(item, taxRate),
  }))
  const subtotal = round2(lines.reduce((sum, line) => sum + line.subtotal, 0))
  const tax = round2(lines.reduce((sum, line) => sum + line.tax, 0))
  return { lines, subtotal, tax, total: round2(subtotal + tax) }
}

export function cogsOf(items, products) {
  return round2(
    (items || []).reduce((sum, line) => {
      const product = products.find((p) => p.id === line.productId)
      const cost = product ? Number(product.costPrice) || 0 : 0
      return sum + cost * (Number(line.qty) || 0)
    }, 0),
  )
}
