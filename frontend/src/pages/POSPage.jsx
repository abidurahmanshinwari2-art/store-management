import { useEffect, useMemo, useRef, useState } from 'react'
import { BarcodeCamera } from '../components/BarcodeCamera.jsx'
import { Field, Modal, Money } from '../components/Ui.jsx'
import { useAuth } from '../context/AuthContext.jsx'
import { useStore } from '../context/StoreContext.jsx'
import { useUi } from '../context/UiContext.jsx'
import { docTotals } from '../lib/calc.js'
import { findProductByCode, looksLikeScanBurst } from '../utils/barcode.js'
import { qtyFmt, round2 } from '../utils/format.js'

export function POSPage({ toast }) {
  const { db, taxRate, getStock, createSale, holdSale, deleteHold } = useStore()
  const { user } = useAuth()
  const { t, tRich } = useUi()
  const scanRef = useRef(null)
  const [q, setQ] = useState('')
  const [camera, setCamera] = useState(false)
  const [warehouseId, setWarehouseId] = useState(db.warehouses[0]?.id)
  const [customerId, setCustomerId] = useState('walkin')
  const [cart, setCart] = useState([])
  const [method, setMethod] = useState('cash')
  const [paid, setPaid] = useState('')
  const [note, setNote] = useState('')
  const [receipt, setReceipt] = useState(null)
  const [holdId, setHoldId] = useState(null)
  const [billOff, setBillOff] = useState('')

  const filtered = useMemo(() => {
    const s = q.trim().toLowerCase()
    return db.products.filter((p) => {
      if (!s) return true
      return [p.name, p.sku, p.barcode].some((v) => String(v || '').toLowerCase().includes(s))
    })
  }, [db.products, q])

  const add = (product) => {
    if (!product) return
    setCart((prev) => {
      const stock = getStock(product.id, warehouseId)
      const existing = prev.find((l) => l.productId === product.id)
      const qty = (existing?.qty || 0) + 1
      if (qty > stock) {
        toast(t('pos.onlyNamed', { n: stock, name: product.name }), 'bad')
        return prev
      }
      if (existing) {
        return prev.map((l) => (l.productId === product.id ? { ...l, qty } : l))
      }
      return [...prev, {
        productId: product.id,
        name: product.name,
        qty: 1,
        listPrice: product.sellPrice,
        price: product.sellPrice,
        discount: 0,
        taxable: product.taxable,
      }]
    })
    setQ('')
    window.setTimeout(() => scanRef.current?.focus(), 0)
  }

  const addByCode = (raw) => {
    const code = String(raw || '').trim()
    if (!code) return false
    const product = findProductByCode(db.products, code)
    if (!product) {
      toast(t('pos.barcodeMiss', { n: code }), 'bad')
      return false
    }
    add(product)
    return true
  }

  const addRef = useRef(addByCode)
  addRef.current = addByCode

  useEffect(() => {
    let buffer = ''
    let started = 0
    const onKey = (e) => {
      if (e.key === 'Enter') {
        const elapsed = Date.now() - started
        if (looksLikeScanBurst(buffer, elapsed)) {
          e.preventDefault()
          e.stopPropagation()
          addRef.current(buffer)
        }
        buffer = ''
        started = 0
        return
      }
      if (e.key.length === 1 && !e.ctrlKey && !e.metaKey && !e.altKey) {
        if (!buffer) started = Date.now()
        buffer += e.key
        return
      }
      if (e.key !== 'Shift') {
        buffer = ''
        started = 0
      }
    }
    window.addEventListener('keydown', onKey, true)
    return () => window.removeEventListener('keydown', onKey, true)
  }, [])

  const setQty = (productId, qty) => {
    const n = Math.max(0, Number(qty) || 0)
    const stock = getStock(productId, warehouseId)
    if (n > stock) {
      toast(t('pos.onlyStock', { n: stock }), 'bad')
      return
    }
    if (n === 0) setCart((prev) => prev.filter((l) => l.productId !== productId))
    else setCart((prev) => prev.map((l) => (l.productId === productId ? { ...l, qty: n } : l)))
  }

  const setDeal = (productId, value) => {
    const n = Math.max(0, Number(value) || 0)
    setCart((prev) => prev.map((l) => (l.productId === productId ? { ...l, price: n } : l)))
  }

  const totals = docTotals(cart, taxRate, billOff)
  const paidNum = paid === '' ? totals.total : round2(paid)
  const change = round2(Math.max(0, paidNum - totals.total))

  const checkout = () => {
    try {
      const actualPaid = method === 'credit' ? 0 : paidNum > totals.total ? totals.total : paidNum
      if (round2(totals.total - actualPaid) > 0 && customerId === 'walkin') {
        toast(t('pos.needCustomer'), 'bad')
        return
      }
      const sale = createSale({
        items: cart,
        warehouseId,
        customerId,
        paid: actualPaid,
        paymentMethod: method,
        note,
        holdId,
        billDiscount: billOff,
      }, user.id)
      setReceipt(sale)
      setCart([])
      setPaid('')
      setNote('')
      setBillOff('')
      setHoldId(null)
      setMethod('cash')
      toast(t('pos.saved', { n: sale.number }))
      window.setTimeout(() => scanRef.current?.focus(), 0)
    } catch (err) {
      toast(err.message, 'bad')
    }
  }

  return (
    <div className="page" style={{ paddingTop: 16 }}>
      <div className="pos">
        <section className="pos-left">
          <div className="toolbar" style={{ padding: 12, margin: 0 }}>
            <input
              ref={scanRef}
              className="search"
              placeholder={t('pos.search')}
              value={q}
              onChange={(e) => setQ(e.target.value)}
              onKeyDown={(e) => {
                if (e.key !== 'Enter') return
                const code = q.trim()
                if (!code) return
                const exact = findProductByCode(db.products, code)
                if (exact) {
                  e.preventDefault()
                  add(exact)
                  return
                }
                if (filtered.length === 1) add(filtered[0])
              }}
              autoFocus
            />
            <button className="btn ghost" type="button" onClick={() => setCamera(true)}>{t('pos.camera')}</button>
            <select value={warehouseId} onChange={(e) => setWarehouseId(e.target.value)}>
              {db.warehouses.map((w) => <option key={w.id} value={w.id}>{w.name}</option>)}
            </select>
          </div>
          <p className="muted" style={{ padding: '0 12px 8px' }}>{t('pos.scanHint')}</p>
          <div className="product-grid">
            {filtered.map((p) => (
              <button key={p.id} className="product-tile" type="button" onClick={() => add(p)}>
                <b>{p.name}</b>
                <div><Money value={p.sellPrice} /></div>
                <div className="muted">{qtyFmt(getStock(p.id, warehouseId))} {p.unit}</div>
                {p.barcode ? <div className="muted">{p.barcode}</div> : null}
              </button>
            ))}
          </div>
        </section>
        <aside className="ticket">
          <header>
            <div>
              <b>{t('pos.bill')}</b>
              <div className="muted">{t('tax.badge', { name: db.company.taxName, rate: taxRate })}</div>
            </div>
            <select value={customerId} onChange={(e) => setCustomerId(e.target.value)}>
              {db.customers.map((c) => <option key={c.id} value={c.id}>{c.name}</option>)}
            </select>
          </header>
          <div className="ticket-lines">
            {cart.length === 0 ? <div className="empty">{t('pos.empty')}</div> : cart.map((line) => (
              <div className="ticket-line" key={line.productId}>
                <div>
                  <b>{line.name}</b>
                  <div className="qty-row">
                    <button type="button" onClick={() => setQty(line.productId, line.qty - 1)}>-</button>
                    <input
                      style={{ width: 54 }}
                      value={line.qty}
                      onChange={(e) => setQty(line.productId, e.target.value)}
                    />
                    <button type="button" onClick={() => setQty(line.productId, line.qty + 1)}>+</button>
                    <span className="muted">{t('pos.list')} <Money value={line.listPrice ?? line.price} /></span>
                  </div>
                  <div className="deal-row">
                    <label>
                      {t('pos.deal')}
                      <input
                        type="number"
                        min="0"
                        step="0.01"
                        value={line.price}
                        onChange={(e) => setDeal(line.productId, e.target.value)}
                      />
                    </label>
                  </div>
                </div>
                <b><Money value={line.qty * line.price - (line.discount || 0)} /></b>
              </div>
            ))}
          </div>
          <div className="ticket-sum">
            {totals.discount > 0 ? (
              <div className="sum-row"><span>{t('pos.listGoods')}</span><span><Money value={totals.listGoods} /></span></div>
            ) : null}
            {totals.discount > 0 ? (
              <div className="sum-row"><span>{t('pos.off')}</span><span>− <Money value={totals.discount} /></span></div>
            ) : null}
            <div className="sum-row"><span>{t('pos.subtotal')}</span><span><Money value={totals.subtotal} /></span></div>
            <div className="sum-row"><span>{t('pos.tax')}</span><span><Money value={totals.tax} /></span></div>
            <div className="sum-row total"><span>{t('pos.total')}</span><span><Money value={totals.total} /></span></div>
            <Field label={t('pos.billOff')} full>
              <input
                type="number"
                min="0"
                step="0.01"
                value={billOff}
                onChange={(e) => setBillOff(e.target.value)}
                placeholder="0"
              />
            </Field>
            <div className="form-grid" style={{ marginTop: 10 }}>
              <Field label={t('pos.payMethod')}>
                <select value={method} onChange={(e) => setMethod(e.target.value)}>
                  <option value="cash">{t('pos.cash')}</option>
                  <option value="card">{t('pos.card')}</option>
                  <option value="bank">{t('pos.bank')}</option>
                  <option value="credit">{t('pos.credit')}</option>
                </select>
              </Field>
              <Field label={t('pos.amountPaid')}>
                <input
                  value={method === 'credit' ? 0 : paid}
                  disabled={method === 'credit'}
                  onChange={(e) => setPaid(e.target.value)}
                  placeholder={String(totals.total)}
                />
              </Field>
            </div>
            {method !== 'credit' && paidNum > totals.total ? (
              <p className="muted">{tRich('pos.change', { n: <Money value={change} /> })}</p>
            ) : null}
            <Field label={t('common.note')} full>
              <input value={note} onChange={(e) => setNote(e.target.value)} />
            </Field>
            <div className="toolbar" style={{ marginTop: 10, marginBottom: 0 }}>
              <button className="btn copper" type="button" disabled={!cart.length} onClick={checkout}>{t('pos.charge')}</button>
              <button
                className="btn ghost"
                type="button"
                disabled={!cart.length}
                onClick={() => {
                  holdSale({ items: cart, warehouseId, customerId, note, billDiscount: Number(billOff) || 0 })
                  setBillOff('')
                  setCart([])
                  toast(t('pos.heldOk'))
                }}
              >
                {t('pos.hold')}
              </button>
            </div>
            {db.holds.length ? (
              <div style={{ marginTop: 10 }}>
                <div className="muted">{t('pos.held')}</div>
                {db.holds.map((h) => (
                  <button
                    key={h.id}
                    className="btn ghost small"
                    type="button"
                    style={{ marginTop: 6, marginRight: 6 }}
                    onClick={() => {
                      setCart(h.items)
                      setWarehouseId(h.warehouseId)
                      setCustomerId(h.customerId)
                      setNote(h.note || '')
                      setBillOff(h.billDiscount || '')
                      setHoldId(h.id)
                      deleteHold(h.id)
                    }}
                  >
                    {t('pos.resume', { n: h.items.length })}
                  </button>
                ))}
              </div>
            ) : null}
          </div>
        </aside>
      </div>
      {camera ? (
        <BarcodeCamera
          onCode={(code) => {
            setCamera(false)
            addByCode(code)
          }}
          onClose={() => setCamera(false)}
        />
      ) : null}
      {receipt ? (
        <Modal
          title={t('pos.receipt', { n: receipt.number })}
          onClose={() => setReceipt(null)}
          footer={
            <>
              <button className="btn ghost" type="button" onClick={() => setReceipt(null)}>{t('common.done')}</button>
              <button className="btn copper" type="button" onClick={() => window.print()}>{t('common.print')}</button>
            </>
          }
        >
          <div className="receipt print-only">
            <h2>{db.company.name}</h2>
            <p>{db.company.address}<br />{db.company.phone}</p>
            <p>{receipt.number}</p>
            <table>
              <tbody>
                {receipt.items.map((l) => (
                  <tr key={l.productId}>
                    <td>
                      {l.name} × {l.qty}
                      {l.listPrice != null && l.listPrice !== l.price ? (
                        <span> ({t('pos.deal')} <Money value={l.price} />)</span>
                      ) : null}
                    </td>
                    <td><Money value={l.total} /></td>
                  </tr>
                ))}
              </tbody>
            </table>
            {receipt.discount > 0 ? <p>{t('pos.off')}: <Money value={receipt.discount} /></p> : null}
            <p>{db.company.taxName}: <Money value={receipt.tax} /></p>
            <p><b>{t('pos.total')} <Money value={receipt.total} /></b></p>
            <p>{t('common.paid')} <Money value={receipt.paid} /></p>
            <p>{t('pos.thankYou')}</p>
          </div>
        </Modal>
      ) : null}
    </div>
  )
}
