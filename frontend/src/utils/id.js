export function uid(prefix = '') {
  return `${prefix}${Date.now().toString(36)}${Math.random().toString(36).slice(2, 7)}`
}

export function nextNumber(list, field, prefix) {
  const nums = (list || [])
    .map((row) => parseInt(String(row[field] || '').replace(/\D/g, ''), 10))
    .filter((n) => !Number.isNaN(n))
  const n = (nums.length ? Math.max(...nums) : 0) + 1
  return `${prefix}-${String(n).padStart(4, '0')}`
}
