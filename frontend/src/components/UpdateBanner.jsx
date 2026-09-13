import { useEffect, useState } from 'react'
import { useUi } from '../context/UiContext.jsx'
import { applyUpdate, fetchUpdate } from '../utils/api.js'

export function UpdateBanner() {
  const { t } = useUi()
  const [info, setInfo] = useState(null)
  const [busy, setBusy] = useState(false)

  useEffect(() => {
    let live = true
    const load = () => {
      fetchUpdate()
        .then((row) => { if (live) setInfo(row) })
        .catch(() => {})
    }
    load()
    const id = window.setInterval(load, 6 * 60 * 60 * 1000)
    return () => {
      live = false
      window.clearInterval(id)
    }
  }, [])

  if (!info?.available) return null

  return (
    <div className="update-banner">
      <span>{t('upd.available', { n: info.latest })}</span>
      <button
        className="btn copper small"
        type="button"
        disabled={busy}
        onClick={async () => {
          setBusy(true)
          try {
            const done = await applyUpdate()
            setInfo(done.ok ? { ...info, available: false } : info)
            if (done.ok) window.setTimeout(() => window.location.reload(), 1600)
          } catch {
            // stay visible
          } finally {
            setBusy(false)
          }
        }}
      >
        {busy ? t('upd.working') : t('upd.button')}
      </button>
    </div>
  )
}
