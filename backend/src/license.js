import { createHmac } from 'node:crypto'
import { appConfig, saveUserSettings, userSettings } from './paths.js'
import { loadStoreFile, saveStoreFile } from './storeFile.js'

const PREFIX = 'GSMS'

function secret() {
  return String(appConfig().licenseSecret || 'gsms-shop-license').trim()
}

export function normalizeShopName(name) {
  return String(name || '').trim().replace(/\s+/g, ' ')
}

export function normalizeKey(key) {
  return String(key || '').toUpperCase().replace(/[^A-Z0-9]/g, '')
}

function digestFor(shopName) {
  const body = `gsms-shop-v1|${normalizeShopName(shopName).toLowerCase()}`
  return createHmac('sha256', secret()).update(body).digest('hex').slice(0, 16).toUpperCase()
}

export function formatKey(hex16) {
  const raw = String(hex16 || '').toUpperCase().replace(/[^A-Z0-9]/g, '').slice(0, 16)
  const chunks = raw.match(/.{1,4}/g) || []
  return [PREFIX, ...chunks].join('-')
}

export function createLicenseKey(shopName) {
  const name = normalizeShopName(shopName)
  if (!name) throw new Error('Write the shop name.')
  return formatKey(digestFor(name))
}

export function verifyLicenseKey(shopName, key) {
  const name = normalizeShopName(shopName)
  if (!name || !key) return null
  const got = normalizeKey(key).replace(new RegExp(`^${PREFIX}`), '')
  const want = digestFor(name)
  if (got !== want) return null
  return name
}

export function licenseStatus() {
  const settings = userSettings()
  const name = normalizeShopName(settings.licenseShop)
  if (!name || !settings.licenseKey) {
    return { licensed: false, shopName: '' }
  }
  const ok = verifyLicenseKey(name, settings.licenseKey)
  return { licensed: Boolean(ok), shopName: ok || '' }
}

export function activateLicense(shopName, key) {
  const name = verifyLicenseKey(shopName, key)
  if (!name) throw new Error('Shop name or license key is wrong.')
  saveUserSettings({
    licenseShop: name,
    licenseKey: formatKey(digestFor(name)),
    licensedAt: new Date().toISOString(),
  })
  try {
    const db = loadStoreFile()
    if (db?.company) {
      db.company.name = name
      saveStoreFile(db)
    }
  } catch {
    // store file can be created after first open
  }
  return { licensed: true, shopName: name }
}
