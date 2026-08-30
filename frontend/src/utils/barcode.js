export function findProductByCode(products, raw) {
  const code = String(raw || '').trim().toLowerCase()
  if (!code) return null
  const byBarcode = products.find((p) => String(p.barcode || '').trim().toLowerCase() === code)
  if (byBarcode) return byBarcode
  return products.find((p) => String(p.sku || '').trim().toLowerCase() === code) || null
}

export function looksLikeScanBurst(buffer, elapsedMs) {
  const code = String(buffer || '').trim()
  return code.length >= 6 && elapsedMs > 0 && elapsedMs < 450
}
