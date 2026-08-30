import { pad2, partsOf } from './jalali.js'

export function round2(n) {
  return Math.round((Number(n) + Number.EPSILON) * 100) / 100
}

export function amountNum(n) {
  const v = round2(n)
  const abs = Math.abs(v).toLocaleString(undefined, {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  })
  return v < 0 ? `-${abs}` : abs
}

export function money(n, symbol = '$') {
  return `${amountNum(n)} ${symbol}`
}

export function qtyFmt(n) {
  const v = Number(n) || 0
  return Number.isInteger(v) ? String(v) : v.toFixed(2)
}

export function dateFmt(d) {
  if (!d) return '—'
  return new Date(d).toLocaleDateString(undefined, {
    year: 'numeric',
    month: 'short',
    day: 'numeric',
  })
}

export function dateBoth(d) {
  const p = partsOf(d)
  if (!p) return '—'
  return `${p.j.jy}/${pad2(p.j.jm)}/${pad2(p.j.jd)} · ${p.g.y}/${pad2(p.g.m)}/${pad2(p.g.d)}`
}

export function datetimeFmt(d) {
  if (!d) return '—'
  return new Date(d).toLocaleString(undefined, {
    year: 'numeric',
    month: 'short',
    day: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  })
}

export function todayIso() {
  return new Date().toISOString()
}

export function toDateInput(d) {
  const dt = d ? new Date(d) : new Date()
  const pad = (n) => String(n).padStart(2, '0')
  return `${dt.getFullYear()}-${pad(dt.getMonth() + 1)}-${pad(dt.getDate())}`
}

export function csvEscape(v) {
  const s = String(v ?? '')
  if (/[",\n]/.test(s)) return `"${s.replace(/"/g, '""')}"`
  return s
}

export function downloadCsv(filename, rows) {
  const text = rows.map((r) => r.map(csvEscape).join(',')).join('\n')
  const blob = new Blob([text], { type: 'text/csv;charset=utf-8;' })
  const url = URL.createObjectURL(blob)
  const a = document.createElement('a')
  a.href = url
  a.download = filename
  a.click()
  URL.revokeObjectURL(url)
}

export function daysAgoIso(n) {
  return new Date(Date.now() - n * 86400000).toISOString()
}
