import { useEffect, useState } from 'react'
import { useUi } from '../context/UiContext.jsx'
import { applyUpdate, fetchUpdate } from '../utils/api.js'
import { pushUpdateNote, subscribeUpdateNote } from '../utils/updateNote.js'

export function UpdateBanner() {
  const { t } = useUi()
  const [info, setInfo] = useState(null)
  const [busy, setBusy] = useState(false)
  const [note, setNote] = useState('')

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

  useEffect(() => subscribeUpdateNote((msg) => {
    setNote(msg)
    if (msg) setInfo((prev) => ({ ...(prev || {}), available: false }))
  }), [])

  useEffect(() => {
    if (!note) return undefined
    const id = window.setTimeout(() => {
      setNote('')
      pushUpdateNote('')
      setInfo((prev) => ({ ...(prev || {}), available: false }))
    }, 20000)
    return () => window.clearTimeout(id)
  }, [note])

  if (!note && !info?.available) return null

  return (
    <div className="update-banner">
      <span>{note || t('upd.available', { n: info?.latest })}</span>
      {!note ? (
      <button
        className="btn copper small"
        type="button"
        disabled={busy}
        onClick={async () => {
          setBusy(true)
          try {
            const done = await applyUpdate()
            const message = done.message || (done.ok ? t('upd.done') : t('upd.failed'))
            pushUpdateNote(message)
            setInfo((prev) => ({ ...(prev || {}), available: false }))
          } catch {
            pushUpdateNote(t('upd.failed'))
            setInfo((prev) => ({ ...(prev || {}), available: false }))
          } finally {
            setBusy(false)
          }
        }}
      >
        {busy ? t('upd.working') : t('upd.button')}
      </button>
      ) : null}
    </div>
  )
}
