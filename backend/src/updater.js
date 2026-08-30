import { execFile } from 'node:child_process'
import { promisify } from 'node:util'
import { APP_ROOT, appConfig, githubRepo } from './paths.js'

const execFileAsync = promisify(execFile)

function compareVersions(a, b) {
  const pa = String(a).replace(/^v/, '').split('.').map((n) => Number(n) || 0)
  const pb = String(b).replace(/^v/, '').split('.').map((n) => Number(n) || 0)
  const len = Math.max(pa.length, pb.length)
  for (let i = 0; i < len; i += 1) {
    if ((pa[i] || 0) > (pb[i] || 0)) return 1
    if ((pa[i] || 0) < (pb[i] || 0)) return -1
  }
  return 0
}

export async function checkUpdate() {
  const current = appConfig().version
  const repo = githubRepo()
  if (!repo) {
    return { current, latest: current, available: false, url: '', note: 'no-repo' }
  }
  const res = await fetch(`https://api.github.com/repos/${repo}/releases/latest`, {
    headers: { Accept: 'application/vnd.github+json', 'User-Agent': 'HasanShinwariStore' },
  })
  if (!res.ok) {
    return { current, latest: current, available: false, url: `https://github.com/${repo}/releases`, note: 'offline' }
  }
  const release = await res.json()
  const latest = String(release.tag_name || release.name || '').replace(/^v/, '')
  return {
    current,
    latest: latest || current,
    available: Boolean(latest) && compareVersions(latest, current) > 0,
    url: release.html_url || `https://github.com/${repo}/releases`,
    name: release.name || latest,
    note: 'ok',
  }
}

export async function applyGitUpdate() {
  try {
    const { stdout } = await execFileAsync('git', ['-C', APP_ROOT, 'pull', '--ff-only'])
    return { ok: true, message: String(stdout || 'Updated.').trim() }
  } catch (err) {
    return { ok: false, message: err.stderr || err.message || 'Update failed.' }
  }
}
