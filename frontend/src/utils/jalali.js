function div(a, b) {
  return ~~(a / b)
}

export function gregorianToJalali(gy, gm, gd) {
  const g_d_m = [0, 31, 59, 90, 120, 151, 181, 212, 243, 273, 304, 334]
  const gy2 = gm > 2 ? gy + 1 : gy
  let days = 355666 + (365 * gy) + div(gy2 + 3, 4) - div(gy2 + 99, 100)
    + div(gy2 + 399, 400) + gd + g_d_m[gm - 1]
  let jy = -1595 + (33 * div(days, 12053))
  days %= 12053
  jy += 4 * div(days, 1461)
  days %= 1461
  if (days > 365) {
    jy += div(days - 1, 365)
    days = (days - 1) % 365
  }
  const jm = days < 186 ? 1 + div(days, 31) : 7 + div(days - 186, 30)
  const jd = 1 + (days < 186 ? days % 31 : (days - 186) % 30)
  return { jy, jm, jd }
}

export function partsOf(d = new Date()) {
  const dt = d instanceof Date ? d : new Date(d)
  if (Number.isNaN(dt.getTime())) return null
  const y = dt.getFullYear()
  const m = dt.getMonth() + 1
  const day = dt.getDate()
  return { g: { y, m, d: day }, j: gregorianToJalali(y, m, day) }
}

export const SHAMSI_MONTHS = {
  en: ['Hamal', 'Saur', 'Jawza', 'Saratan', 'Asad', 'Sunbula', 'Mizan', 'Aqrab', 'Qaws', 'Jadi', 'Dalwa', 'Hut'],
  ps: ['وری', 'غویی', 'غبرګولی', 'چنګاښ', 'زمری', 'وږی', 'تله', 'لړم', 'لیندۍ', 'مرغومی', 'سلواغه', 'کب'],
  dr: ['حمل', 'ثور', 'جوزا', 'سرطان', 'اسد', 'سنبله', 'میزان', 'عقرب', 'قوس', 'جدی', 'دلو', 'حوت'],
}

export const MELADI_MONTHS = {
  en: ['January', 'February', 'March', 'April', 'May', 'June', 'July', 'August', 'September', 'October', 'November', 'December'],
  ps: ['جنوري', 'فبروري', 'مارچ', 'اپریل', 'می', 'جون', 'جولای', 'اګست', 'سپتمبر', 'اکتوبر', 'نومبر', 'ډسمبر'],
  dr: ['جنوری', 'فبروری', 'مارچ', 'اپریل', 'می', 'جون', 'جولای', 'اگست', 'سپتمبر', 'اکتوبر', 'نومبر', 'دسمبر'],
}

export function shamsiMonthName(month, lang = 'en') {
  return (SHAMSI_MONTHS[lang] || SHAMSI_MONTHS.en)[month - 1] || ''
}

export function meladiMonthName(month, lang = 'en') {
  return (MELADI_MONTHS[lang] || MELADI_MONTHS.en)[month - 1] || ''
}

export function pad2(n) {
  return String(n).padStart(2, '0')
}

export function monthKeyOf(d) {
  const dt = d instanceof Date ? d : new Date(d)
  if (Number.isNaN(dt.getTime())) return ''
  return `${dt.getFullYear()}-${pad2(dt.getMonth() + 1)}`
}

export function parseMonthKey(key) {
  const [y, m] = String(key).split('-').map(Number)
  return { year: y, month: m }
}

export function inMonth(d, key) {
  return monthKeyOf(d) === key
}

export function shamsiSpanForMonth(key, lang = 'en') {
  const { year, month } = parseMonthKey(key)
  if (!year || !month) return ''
  const start = partsOf(new Date(year, month - 1, 1))
  const end = partsOf(new Date(year, month, 0))
  if (!start || !end) return ''
  if (start.j.jy === end.j.jy && start.j.jm === end.j.jm) {
    return `${shamsiMonthName(start.j.jm, lang)} ${start.j.jy}`
  }
  if (start.j.jy === end.j.jy) {
    return `${shamsiMonthName(start.j.jm, lang)} – ${shamsiMonthName(end.j.jm, lang)} ${end.j.jy}`
  }
  return `${shamsiMonthName(start.j.jm, lang)} ${start.j.jy} – ${shamsiMonthName(end.j.jm, lang)} ${end.j.jy}`
}

export function monthOptionLabel(key, lang = 'en') {
  const { year, month } = parseMonthKey(key)
  if (!year || !month) return ''
  const g = `${meladiMonthName(month, lang)} ${year}`
  const j = shamsiSpanForMonth(key, lang)
  return j ? `${g} · ${j}` : g
}
