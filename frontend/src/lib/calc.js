import { amountFromBase, lineGoods } from './units.js'
import { round2 } from '../utils/format.js'

export { lineGoods }

export function lineTotals({ qty, price, discount = 0, taxable, unit }, taxRate) {
  const disc = Number(discount) || 0
  const subtotal = round2(Math.max(0, amountFromBase(qty, price, unit) - disc))
  const tax = taxable ? round2(subtotal * (Number(taxRate) || 0) / 100) : 0
  return { subtotal, tax, total: round2(subtotal + tax) }
}

export function listUnit(line) {
  return Number(line?.listPrice ?? line?.price) || 0
}

export function saleCompromise(sale) {
  if (sale && sale.discount != null && sale.discount !== '') {
    return round2(Number(sale.discount) || 0)
  }
  return round2((sale?.items || []).reduce((sum, line) => {
    const qty = Number(line.qty) || 0
    const gap = Math.max(0, listUnit(line) - (Number(line.price) || 0))
    return sum + amountFromBase(qty, gap, line.unit) + (Number(line.discount) || 0)
  }, 0) + (Number(sale?.billDiscount) || 0))
}

export function docTotals(items, taxRate, billDiscount = 0) {
  const lines = (items || []).map((item) => ({
    ...item,
    listPrice: listUnit(item),
    ...lineTotals(item, taxRate),
  }))
  const listGoods = round2(lines.reduce((sum, line) => sum + amountFromBase(line.qty, listUnit(line), line.unit), 0))
  const goods = round2(lines.reduce((sum, line) => sum + line.subtotal, 0))
  const offBill = round2(Math.min(Math.max(0, Number(billDiscount) || 0), goods))
  const factor = goods > 0 ? (goods - offBill) / goods : 1
  const tax = round2(lines.reduce((sum, line) => sum + line.tax, 0) * factor)
  const subtotal = round2(goods - offBill)
  return {
    lines,
    listGoods,
    goods,
    billDiscount: offBill,
    discount: round2(listGoods - subtotal),
    subtotal,
    tax,
    total: round2(subtotal + tax),
  }
}

export function cogsOf(items, products) {
  return round2(
    (items || []).reduce((sum, line) => {
      const product = products.find((p) => p.id === line.productId)
      const cost = product ? Number(product.costPrice) || 0 : 0
      return sum + amountFromBase(line.qty, cost, line.unit || product?.unit)
    }, 0),
  )
}
