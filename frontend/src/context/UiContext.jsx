import { createContext, Fragment, useContext, useEffect, useMemo, useState } from 'react'
import { DEFAULT_RATES, translate, translateRich } from '../i18n/translations.js'
import { clampTextSize, FONT_SIZE_DEFAULT } from '../utils/fonts.js'
import { loadUi, saveUi } from '../utils/storage.js'

const UiContext = createContext(null)

function applyDoc(lang, theme, font, textSize) {
  const px = clampTextSize(textSize)
  document.documentElement.lang = lang === 'dr' ? 'fa' : lang
  document.documentElement.dir = 'ltr'
  document.documentElement.dataset.theme = theme
  document.documentElement.dataset.font = font || 'shop'
  document.documentElement.style.setProperty('--text-size', `${px}px`)
}

export function UiProvider({ children }) {
  const saved = loadUi()
  const [collapsed, setCollapsedState] = useState(() => Boolean(saved.collapsed))
  const [lang, setLangState] = useState(() => {
    const next = saved.lang || 'en'
    applyDoc(next, saved.theme || 'pine', saved.font || 'shop', saved.textSize)
    return next
  })
  const [theme, setThemeState] = useState(() => saved.theme || 'pine')
  const [font, setFontState] = useState(() => saved.font || 'shop')
  const [textSize, setTextSizeState] = useState(() => clampTextSize(saved.textSize ?? FONT_SIZE_DEFAULT))
  const [rates, setRatesState] = useState(() => ({ ...DEFAULT_RATES, ...(saved.rates || {}) }))

  useEffect(() => {
    applyDoc(lang, theme, font, textSize)
  }, [lang, theme, font, textSize])

  const persist = (patch) => {
    const next = { collapsed, lang, theme, font, textSize, rates, ...patch }
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

  const setFont = (id) => {
    setFontState(id)
    persist({ font: id })
  }

  const setTextSize = (value) => {
    const next = clampTextSize(value)
    setTextSizeState(next)
    persist({ textSize: next })
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
    () => ({
      collapsed,
      setCollapsed,
      lang,
      setLang,
      theme,
      setTheme,
      font,
      setFont,
      textSize,
      setTextSize,
      rates,
      setRates,
      t,
      tRich,
    }),
    [collapsed, lang, theme, font, textSize, rates],
  )

  return <UiContext.Provider value={value}>{children}</UiContext.Provider>
}

export function useUi() {
  const ctx = useContext(UiContext)
  if (!ctx) throw new Error('useUi must be used inside UiProvider')
  return ctx
}
