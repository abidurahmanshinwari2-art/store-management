import { useEffect, useRef, useState } from 'react'
import { useUi } from '../context/UiContext.jsx'
import { round2 } from '../utils/format.js'
import { Icon } from './Icons.jsx'

const KEYS = ['7', '8', '9', '/', '4', '5', '6', '*', '1', '2', '3', '-', '0', '.', '=', '+']

function safeCalc(expr) {
  if (!/^[\d.+\-*/ ]+$/.test(expr) || !expr.trim()) return ''
  try {
    const result = Function(`"use strict"; return (${expr})`)()
    if (!Number.isFinite(result)) return ''
    return String(round2(result))
  } catch {
    return ''
  }
}

export function Calculator() {
  const { t, rates, setRates } = useUi()
  const [open, setOpen] = useState(false)
  const [tab, setTab] = useState('simple')
  const [expr, setExpr] = useState('')
  const [amount, setAmount] = useState('1')
  const [from, setFrom] = useState('USD')
  const [to, setTo] = useState('AFN')
  const box = useRef(null)
  const codes = Object.keys(rates)

  useEffect(() => {
    const hide = (e) => {
      if (box.current && !box.current.contains(e.target)) setOpen(false)
    }
    document.addEventListener('mousedown', hide)
    return () => document.removeEventListener('mousedown', hide)
  }, [])

  const press = (key) => {
    if (key === 'C') {
      setExpr('')
      return
    }
    if (key === '=') {
      const result = safeCalc(expr)
      if (result !== '') setExpr(result)
      return
    }
    setExpr((prev) => prev + key)
  }

  const fromRate = Number(rates[from]) || 1
  const toRate = Number(rates[to]) || 1
  const converted = round2((Number(amount) || 0) / fromRate * toRate)

  return (
    <div className="tool-pop" ref={box}>
      <button className="icon-btn" type="button" onClick={() => setOpen((v) => !v)} aria-label={t('calc.title')} title={t('calc.title')}>
        <Icon name="calc" />
      </button>
      {open ? (
        <div className="tool-panel calc-panel">
          <b>{t('calc.title')}</b>
          <div className="tabs" style={{ marginTop: 8 }}>
            <button type="button" className={tab === 'simple' ? 'active' : ''} onClick={() => setTab('simple')}>{t('calc.simple')}</button>
            <button type="button" className={tab === 'fx' ? 'active' : ''} onClick={() => setTab('fx')}>{t('calc.fx')}</button>
          </div>
          {tab === 'simple' ? (
            <div className="calc-box">
              <input className="calc-screen" value={expr} onChange={(e) => setExpr(e.target.value)} />
              <div className="calc-keys">
                <button type="button" onClick={() => press('C')}>{t('calc.clear')}</button>
                {KEYS.map((key) => (
                  <button key={key} type="button" onClick={() => press(key)}>{key}</button>
                ))}
              </div>
            </div>
          ) : (
            <div className="stack">
              <label className="field">
                <span>{t('calc.amount')}</span>
                <input type="number" value={amount} onChange={(e) => setAmount(e.target.value)} />
              </label>
              <div className="form-grid">
                <label className="field">
                  <span>{t('calc.from')}</span>
                  <select value={from} onChange={(e) => setFrom(e.target.value)}>
                    {codes.map((c) => <option key={c} value={c}>{c}</option>)}
                  </select>
                </label>
                <label className="field">
                  <span>{t('calc.to')}</span>
                  <select value={to} onChange={(e) => setTo(e.target.value)}>
                    {codes.map((c) => <option key={c} value={c}>{c}</option>)}
                  </select>
                </label>
              </div>
              <p className="calc-result"><b>{t('calc.result')}:</b> <span className="money">{converted}<span className="money-sym">{to}</span></span></p>
              <p className="muted">{t('calc.rates')}</p>
              <div className="rate-grid">
                {codes.map((c) => (
                  <label key={c} className="field">
                    <span>{c}</span>
                    <input
                      type="number"
                      value={rates[c]}
                      onChange={(e) => setRates({ ...rates, [c]: Number(e.target.value) || 0 })}
                    />
                  </label>
                ))}
              </div>
            </div>
          )}
        </div>
      ) : null}
    </div>
  )
}
