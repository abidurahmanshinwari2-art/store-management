import fs from 'node:fs'
import os from 'node:os'
import path from 'node:path'
import { USER_DIR, saveUserSettings, userSettings } from './paths.js'
import { loadStoreFile, saveStoreFile } from './storeFile.js'

const KIND = 'gsms-backup'

function stamp() {
  const d = new Date()
  const p = (n) => String(n).padStart(2, '0')
  return `${d.getFullYear()}-${p(d.getMonth() + 1)}-${p(d.getDate())}-${p(d.getHours())}${p(d.getMinutes())}`
}

function fileName(shop) {
  const safe = String(shop || 'store').replace(/[^a-zA-Z0-9]+/g, '-').replace(/^-|-$/g, '') || 'store'
  return `${safe}-backup-${stamp()}.json`
}

function desktopDir() {
  const home = os.homedir()
  for (const folder of [
    path.join(home, 'Desktop'),
    path.join(home, 'OneDrive', 'Desktop'),
  ]) {
    if (fs.existsSync(folder)) return folder
  }
  return null
}

export function makeBackup() {
  const store = loadStoreFile()
  if (!store) throw new Error('No shop data to save.')
  const settings = userSettings()
  return {
    kind: KIND,
    version: 1,
    createdAt: new Date().toISOString(),
    shopName: settings.licenseShop || store.company?.name || '',
    store,
    settings: {
      githubRepo: settings.githubRepo || '',
      licenseShop: settings.licenseShop || '',
      licenseKey: settings.licenseKey || '',
      licensedAt: settings.licensedAt || '',
      installedId: settings.installedId || '',
    },
  }
}

export function backupFileName() {
  return fileName(userSettings().licenseShop || loadStoreFile()?.company?.name)
}

export function saveBackupToComputer() {
  const pack = makeBackup()
  const name = backupFileName()
  const folder = path.join(USER_DIR, 'backups')
  fs.mkdirSync(folder, { recursive: true })
  const savedIn = path.join(folder, name)
  fs.writeFileSync(savedIn, JSON.stringify(pack, null, 2))

  let desktop = ''
  const desk = desktopDir()
  if (desk) {
    try {
      desktop = path.join(desk, name)
      fs.copyFileSync(savedIn, desktop)
    } catch {
      desktop = ''
    }
  }

  return {
    ok: true,
    fileName: name,
    savedIn,
    desktop,
    pack,
    message: desktop
      ? 'Backup is on this PC (Desktop and the shop backups folder). Copy that file to USB or another computer.'
      : `Backup is on this PC in ${folder}. Copy that file to USB or another computer.`,
  }
}

export function restoreBackup(pack) {
  if (!pack || pack.kind !== KIND || !pack.store || typeof pack.store !== 'object') {
    throw new Error('This file is not a store backup.')
  }
  const store = pack.store
  if (!store.company || !Array.isArray(store.products) || !Array.isArray(store.sales) || !Array.isArray(store.customers)) {
    throw new Error('This backup file is not complete.')
  }
  saveStoreFile(store)
  const next = pack.settings && typeof pack.settings === 'object' ? pack.settings : {}
  const now = userSettings()
  saveUserSettings({
    githubRepo: next.githubRepo || now.githubRepo || '',
    licenseShop: next.licenseShop || now.licenseShop || '',
    licenseKey: next.licenseKey || now.licenseKey || '',
    licensedAt: next.licensedAt || now.licensedAt || '',
    installedId: next.installedId || now.installedId || '',
  })
  return { ok: true, message: 'Backup is loaded. Shop data on this PC is now this file.' }
}
