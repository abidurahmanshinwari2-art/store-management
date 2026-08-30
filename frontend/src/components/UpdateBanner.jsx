import { useEffect, useState } from 'react'
import { useUi } from '../context/UiContext.jsx'
import { fetchUpdate } from '../utils/api.js'

export function UpdateBanner() {
  const { t } = useUi()
  const [info, setInfo] = useState(null)

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
      {info.url ? (
        <a className="btn copper small" href={info.url} target="_blank" rel="noreferrer">{t('upd.get')}</a>
      ) : null}
    </div>
  )
}
