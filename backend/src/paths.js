import fs from 'node:fs'
import os from 'node:os'
import path from 'node:path'
import { fileURLToPath } from 'node:url'

const here = path.dirname(fileURLToPath(import.meta.url))

export const APP_ROOT = path.resolve(here, '..', '..')
export const BACKEND_ROOT = path.resolve(here, '..')
export const FRONTEND_DIST = path.join(APP_ROOT, 'frontend', 'dist')

export const USER_DIR = path.join(os.homedir(), 'HasanShinwariStore')
export const DATA_DIR = path.join(USER_DIR, 'data')
export const STORE_FILE = path.join(DATA_DIR, 'store.json')
export const STORE_BAK = path.join(DATA_DIR, 'store.bak')
export const SETTINGS_FILE = path.join(USER_DIR, 'settings.json')

export const APP_CONFIG_FILE = path.join(BACKEND_ROOT, 'config.json')

export function ensureDirs() {
  fs.mkdirSync(DATA_DIR, { recursive: true })
}

export function readJson(file, fallback = null) {
  try {
    return JSON.parse(fs.readFileSync(file, 'utf8'))
  } catch {
    return fallback
  }
}

export function writeJson(file, data) {
  const tmp = `${file}.tmp`
  fs.mkdirSync(path.dirname(file), { recursive: true })
  fs.writeFileSync(tmp, JSON.stringify(data, null, 2))
  fs.renameSync(tmp, file)
}

export function appConfig() {
  return {
    version: '1.0.0',
    port: 3847,
    githubRepo: '',
    ...readJson(APP_CONFIG_FILE, {}),
  }
}

export function userSettings() {
  return {
    githubRepo: '',
    ...readJson(SETTINGS_FILE, {}),
  }
}

export function saveUserSettings(patch) {
  const next = { ...userSettings(), ...patch }
  writeJson(SETTINGS_FILE, next)
  return next
}

export function githubRepo() {
  return String(userSettings().githubRepo || appConfig().githubRepo || '').trim()
}
