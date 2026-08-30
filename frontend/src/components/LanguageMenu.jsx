import { useEffect, useRef, useState } from 'react'
import { LANGS } from '../i18n/translations.js'
import { useUi } from '../context/UiContext.jsx'
import { Icon } from './Icons.jsx'

export function LanguageMenu() {
  const { lang, setLang, t } = useUi()
  const [open, setOpen] = useState(false)
  const box = useRef(null)

  useEffect(() => {
    const hide = (e) => {
      if (box.current && !box.current.contains(e.target)) setOpen(false)
    }
    document.addEventListener('mousedown', hide)
    return () => document.removeEventListener('mousedown', hide)
  }, [])

  const current = LANGS.find((l) => l.id === lang) || LANGS[0]

  return (
    <div className="tool-pop" ref={box}>
      <button className="icon-btn" type="button" onClick={() => setOpen((v) => !v)} aria-label={t('lang.title')} title={t('lang.title')}>
        <Icon name="globe" />
      </button>
      {open ? (
        <div className="tool-panel lang-panel">
          <b>{t('lang.title')}</b>
          {LANGS.map((item) => (
            <button
              key={item.id}
              type="button"
              className={item.id === current.id ? 'active' : ''}
              onClick={() => {
                setLang(item.id)
                setOpen(false)
              }}
            >
              <span>{item.short}</span>
              {t(`lang.${item.id}`)}
            </button>
          ))}
        </div>
      ) : null}
    </div>
  )
}
