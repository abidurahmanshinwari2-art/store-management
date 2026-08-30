import { createContext, Fragment, useContext, useEffect, useMemo, useState } from 'react'
import { DEFAULT_RATES, translate, translateRich } from '../i18n/translations.js'
import { loadUi, saveUi } from '../utils/storage.js'

const UiContext = createContext(null)

function applyDoc(lang, theme) {
  document.documentElement.lang = lang === 'dr' ? 'fa' : lang
  document.documentElement.dir = 'ltr'
  document.documentElement.dataset.theme = theme
}

export function UiProvider({ children }) {
  const saved = loadUi()
  const [collapsed, setCollapsedState] = useState(() => Boolean(saved.collapsed))
  const [lang, setLangState] = useState(() => {
    const next = saved.lang || 'en'
    applyDoc(next, saved.theme || 'pine')
    return next
  })
  const [theme, setThemeState] = useState(() => saved.theme || 'pine')
  const [rates, setRatesState] = useState(() => ({ ...DEFAULT_RATES, ...(saved.rates || {}) }))

  useEffect(() => {
    applyDoc(lang, theme)
  }, [lang, theme])

  const persist = (patch) => {
    const next = { collapsed, lang, theme, rates, ...patch }
    saveUi(next)
  }

  const setCollapsed = (fn) => {
    setCollapsedState((prev) => {
      const next = typeof fn === 'function' ? fn(prev) : fn
      persist({ collapsed: next })
      return next
    })
  }

  const setLang = (id) => {
    setLangState(id)
    persist({ lang: id })
  }

  const setTheme = (id) => {
    setThemeState(id)
    persist({ theme: id })
  }

  const setRates = (next) => {
    setRatesState(next)
    persist({ rates: next })
  }

  const t = (key, vars) => translate(lang, key, vars)
  const tRich = (key, vars) => translateRich(lang, key, vars).map((part, i) => (
    <Fragment key={i}>{part}</Fragment>
  ))

  const value = useMemo(
    () => ({ collapsed, setCollapsed, lang, setLang, theme, setTheme, rates, setRates, t, tRich }),
    [collapsed, lang, theme, rates],
  )

  return <UiContext.Provider value={value}>{children}</UiContext.Provider>
}

export function useUi() {
  const ctx = useContext(UiContext)
  if (!ctx) throw new Error('useUi must be used inside UiProvider')
  return ctx
}
