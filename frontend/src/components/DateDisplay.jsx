import { useEffect, useState } from 'react'
import { useUi } from '../context/UiContext.jsx'
import { pad2, partsOf } from '../utils/jalali.js'

export function DateDisplay() {
  const { t } = useUi()
  const [now, setNow] = useState(() => new Date())

  useEffect(() => {
    const id = window.setInterval(() => setNow(new Date()), 60_000)
    return () => window.clearInterval(id)
  }, [])

  const p = partsOf(now)
  if (!p) return null

  return (
    <div className="date-board" aria-label={t('date.today')}>
      <b>{p.j.jy}/{pad2(p.j.jm)}/{pad2(p.j.jd)}</b>
      <b>{p.g.y}/{pad2(p.g.m)}/{pad2(p.g.d)}</b>
    </div>
  )
}
