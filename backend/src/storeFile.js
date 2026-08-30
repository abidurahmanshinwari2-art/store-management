import fs from 'node:fs'
import { STORE_BAK, STORE_FILE, ensureDirs, readJson, writeJson } from './paths.js'

export function loadStoreFile() {
  ensureDirs()
  return readJson(STORE_FILE, null)
}

export function saveStoreFile(db) {
  if (!db || typeof db !== 'object') {
    throw new Error('Store data is not valid.')
  }
  ensureDirs()
  if (fs.existsSync(STORE_FILE)) {
    try {
      fs.copyFileSync(STORE_FILE, STORE_BAK)
    } catch {
      // keep going even if backup fails
    }
  }
  writeJson(STORE_FILE, db)
  return db
}
