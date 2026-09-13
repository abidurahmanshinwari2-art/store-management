import { execFile } from 'node:child_process'
import fs from 'node:fs'
import os from 'node:os'
import path from 'node:path'
import { promisify } from 'node:util'
import { APP_ROOT, appConfig, githubRepo, saveUserSettings, userSettings } from './paths.js'

const execFileAsync = promisify(execFile)
const SKIP = new Set(['node_modules', '.git', 'dist'])

function ghHeaders() {
  return { Accept: 'application/vnd.github+json', 'User-Agent': 'HasanShinwariStore' }
}

async function latestGithub() {
  const repo = githubRepo()
  if (!repo) return null
  const releaseRes = await fetch(`https://api.github.com/repos/${repo}/releases/latest`, { headers: ghHeaders() })
  if (releaseRes.ok) {
    const release = await releaseRes.json()
    const tag = String(release.tag_name || '').replace(/^v/, '')
    const zip = release.zipball_url || `https://github.com/${repo}/archive/refs/tags/${release.tag_name}.zip`
    return {
      kind: 'release',
      id: tag || release.target_commitish,
      name: tag || release.name,
      zip,
      url: release.html_url,
    }
  }
  const commitRes = await fetch(`https://api.github.com/repos/${repo}/commits/main`, { headers: ghHeaders() })
  if (!commitRes.ok) return null
  const commit = await commitRes.json()
  const sha = commit.sha
  return {
    kind: 'commit',
    id: sha,
    name: String(sha).slice(0, 7),
    zip: `https://github.com/${repo}/archive/${sha}.zip`,
    url: `https://github.com/${repo}`,
  }
}

function copyTree(from, to) {
  fs.mkdirSync(to, { recursive: true })
  for (const name of fs.readdirSync(from)) {
    if (SKIP.has(name)) continue
    const src = path.join(from, name)
    const dest = path.join(to, name)
    if (fs.statSync(src).isDirectory()) copyTree(src, dest)
    else fs.copyFileSync(src, dest)
  }
}

export async function checkUpdate() {
  const current = userSettings().installedId || appConfig().version
  const remote = await latestGithub()
  if (!remote) {
    return {
      current,
      latest: current,
      available: false,
      url: '',
      note: githubRepo() ? 'offline' : 'no-repo',
    }
  }
  const installed = userSettings().installedId
  return {
    current: installed ? current : remote.name,
    latest: remote.name,
    available: !installed || installed !== remote.id,
    url: remote.url,
    note: 'ok',
  }
}

function rebuildScreens() {
  const dist = path.join(APP_ROOT, 'frontend', 'dist')
  try {
    fs.rmSync(dist, { recursive: true, force: true })
  } catch {
    // old screens folder can stay until build writes a new one
  }
}

export async function applyUpdate() {
  const repo = githubRepo()
  if (!repo) return { ok: false, message: 'No GitHub repo is set.' }
  const remote = await latestGithub()
  if (!remote) return { ok: false, message: 'No internet, or GitHub is closed.' }

  const work = path.join(os.tmpdir(), `store-update-${Date.now()}`)
  const zipPath = path.join(work, 'update.zip')
  fs.mkdirSync(work, { recursive: true })

  const zipRes = await fetch(remote.zip, { headers: { 'User-Agent': 'HasanShinwariStore' } })
  if (!zipRes.ok) return { ok: false, message: 'Could not download the update.' }
  fs.writeFileSync(zipPath, Buffer.from(await zipRes.arrayBuffer()))

  const unpacked = path.join(work, 'unpacked')
  fs.mkdirSync(unpacked, { recursive: true })
  await execFileAsync('tar', ['-xf', zipPath, '-C', unpacked])
  const inner = fs.readdirSync(unpacked).map((name) => path.join(unpacked, name)).find((p) => fs.statSync(p).isDirectory())
  if (!inner) return { ok: false, message: 'The download was empty.' }

  copyTree(inner, APP_ROOT)
  saveUserSettings({ installedId: remote.id })
  rebuildScreens()

  const npm = process.platform === 'win32' ? 'npm.cmd' : 'npm'
  try {
    await execFileAsync(npm, ['--prefix', path.join(APP_ROOT, 'backend'), 'install'], { windowsHide: true })
    await execFileAsync(npm, ['--prefix', path.join(APP_ROOT, 'frontend'), 'install'], { windowsHide: true })
    await execFileAsync(npm, ['--prefix', path.join(APP_ROOT, 'frontend'), 'run', 'build'], { windowsHide: true })
    fs.writeFileSync(path.join(APP_ROOT, 'frontend', 'dist', '.ui-build'), String(remote.id))
  } catch (err) {
    return {
      ok: true,
      restart: true,
      message: 'Files are downloaded. Close the store and run start-store.bat again.',
      detail: String(err.message || ''),
    }
  }

  try {
    fs.rmSync(work, { recursive: true, force: true })
  } catch {
    // temp folder can stay
  }

  return {
    ok: true,
    restart: true,
    message: 'Update is installed. Close the store and run start-store.bat again. Shop data on this PC is safe.',
  }
}
