import cors from 'cors'
import express from 'express'
import fs from 'node:fs'
import path from 'node:path'
import { applyGitUpdate, checkUpdate } from './updater.js'
import {
  DATA_DIR,
  FRONTEND_DIST,
  appConfig,
  githubRepo,
  saveUserSettings,
  userSettings,
} from './paths.js'
import { loadStoreFile, saveStoreFile } from './storeFile.js'

const config = appConfig()
const app = express()

app.use(cors())
app.use(express.json({ limit: '20mb' }))

app.get('/api/health', (_req, res) => {
  res.json({
    ok: true,
    version: config.version,
    offline: true,
    dataPath: DATA_DIR,
    githubRepo: githubRepo(),
  })
})

app.get('/api/store', (_req, res) => {
  res.json(loadStoreFile())
})

app.put('/api/store', (req, res) => {
  try {
    res.json(saveStoreFile(req.body))
  } catch (err) {
    res.status(400).json({ error: err.message })
  }
})

app.get('/api/settings', (_req, res) => {
  res.json({ ...userSettings(), version: config.version, dataPath: DATA_DIR, githubRepo: githubRepo() })
})

app.put('/api/settings', (req, res) => {
  const github = String(req.body?.githubRepo || '').trim()
  res.json({ ...saveUserSettings({ githubRepo: github }), version: config.version, dataPath: DATA_DIR })
})

app.get('/api/update', async (_req, res) => {
  try {
    res.json(await checkUpdate())
  } catch {
    res.json({
      current: config.version,
      latest: config.version,
      available: false,
      url: '',
      note: 'offline',
    })
  }
})

app.post('/api/update/apply', async (_req, res) => {
  const info = await checkUpdate().catch(() => null)
  const git = await applyGitUpdate()
  if (git.ok) {
    res.json({ ok: true, message: git.message, update: info })
    return
  }
  res.json({
    ok: false,
    message: git.message,
    url: info?.url || '',
  })
})

if (fs.existsSync(FRONTEND_DIST)) {
  app.use(express.static(FRONTEND_DIST))
  app.get(/.*/, (req, res, next) => {
    if (req.path.startsWith('/api')) return next()
    res.sendFile(path.join(FRONTEND_DIST, 'index.html'))
  })
}

const port = Number(process.env.PORT) || config.port || 3847
app.listen(port, '127.0.0.1', () => {
  console.log(`Store is open on http://localhost:${port}`)
  console.log(`Shop data is saved in ${DATA_DIR}`)
})
