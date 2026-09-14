import cors from 'cors'
import express from 'express'
import fs from 'node:fs'
import path from 'node:path'
import { activateLicense, licenseStatus } from './license.js'
import { applyUpdate, checkUpdate } from './updater.js'
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
    licensed: licenseStatus().licensed,
  })
})

app.get('/api/license', (_req, res) => {
  res.json(licenseStatus())
})

app.post('/api/license', (req, res) => {
  try {
    res.json(activateLicense(req.body?.shopName, req.body?.key))
  } catch (err) {
    res.status(400).json({ error: 'license', message: err.message || 'Shop name or license key is wrong.' })
  }
})

app.use((req, res, next) => {
  if (!req.path.startsWith('/api')) return next()
  const open = req.path === '/api/health' || req.path === '/api/license' || req.path === '/api/update' || req.path === '/api/update/apply'
  if (open) return next()
  if (!licenseStatus().licensed) {
    return res.status(403).json({ error: 'license', message: 'Enter a shop license key first.' })
  }
  next()
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
  const { licenseKey, ...safe } = userSettings()
  res.json({
    ...safe,
    version: config.version,
    dataPath: DATA_DIR,
    githubRepo: githubRepo(),
    ...licenseStatus(),
  })
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

app.post('/api/update/apply', async (req, res) => {
  req.setTimeout(10 * 60 * 1000)
  res.setTimeout(10 * 60 * 1000)
  try {
    res.json(await applyUpdate())
  } catch (err) {
    res.status(500).json({ ok: false, message: err.message || 'Update failed.' })
  }
})

if (fs.existsSync(FRONTEND_DIST)) {
  app.use((req, res, next) => {
    if (req.path === '/' || req.path.endsWith('.html')) {
      res.setHeader('Cache-Control', 'no-store')
    }
    next()
  })
  app.use(express.static(FRONTEND_DIST))
  app.get(/.*/, (req, res, next) => {
    if (req.path.startsWith('/api')) return next()
    res.setHeader('Cache-Control', 'no-store')
    const indexFile = path.join(FRONTEND_DIST, 'index.html')
    if (!fs.existsSync(indexFile)) {
      res.status(503).type('html').send(
        '<p>Store screens are not ready. Close this window, then open <b>General Store Management system</b> again.</p>',
      )
      return
    }
    res.sendFile(indexFile)
  })
} else {
  app.get(/.*/, (req, res, next) => {
    if (req.path.startsWith('/api')) return next()
    res.status(503).type('html').send(
      '<p>Store screens are not ready. Close this window, then open <b>General Store Management system</b> again.</p>',
    )
  })
}

const port = Number(process.env.PORT) || config.port || 3847
app.listen(port, '127.0.0.1', () => {
  console.log(`Store is open on http://localhost:${port}`)
  console.log(`Shop data is saved in ${DATA_DIR}`)
})
