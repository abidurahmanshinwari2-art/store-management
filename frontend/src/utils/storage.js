import { DEFAULT_RATES } from '../i18n/translations.js'

const STORE_KEY = 'gsms_store_v1'
const AUTH_KEY = 'gsms_auth_v1'
const UI_KEY = 'gsms_ui_v1'

export function loadStore() {
  try {
    const raw = localStorage.getItem(STORE_KEY)
    if (!raw) return null
    const saved = JSON.parse(raw)
    if (saved?.company?.name === 'Corner Store') {
      saved.company.name = 'Hasan Shinwari Genral Store'
    }
    return saved
  } catch {
    return null
  }
}

export function saveStore(db) {
  localStorage.setItem(STORE_KEY, JSON.stringify(db))
}

export function clearStore() {
  localStorage.removeItem(STORE_KEY)
}

export function loadAuth() {
  try {
    const raw = localStorage.getItem(AUTH_KEY)
    return raw ? JSON.parse(raw) : null
  } catch {
    return null
  }
}

export function saveAuth(user) {
  if (!user) localStorage.removeItem(AUTH_KEY)
  else localStorage.setItem(AUTH_KEY, JSON.stringify(user))
}

export function loadUi() {
  const base = { collapsed: false, lang: 'en', theme: 'pine', font: 'shop', textSize: 16, rates: { ...DEFAULT_RATES } }
  try {
    const raw = localStorage.getItem(UI_KEY)
    if (!raw) return base
    const saved = JSON.parse(raw)
    return {
      ...base,
      ...saved,
      rates: { ...DEFAULT_RATES, ...(saved.rates || {}) },
    }
  } catch {
    return base
  }
}

export function saveUi(ui) {
  const prev = loadUi()
  localStorage.setItem(UI_KEY, JSON.stringify({ ...prev, ...ui }))
}
