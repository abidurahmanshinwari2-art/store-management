import { useMemo, useState } from 'react'
import { PageHeader, DataTable, Badge, Modal, Field, Money } from '../components/Ui.jsx'
import { useAuth } from '../context/AuthContext.jsx'
import { useStore } from '../context/StoreContext.jsx'
import { useUi } from '../context/UiContext.jsx'
import { docTotals, lineGoods, saleCompromise } from '../lib/calc.js'
import { priceBase, qtyUnit } from '../lib/units.js'
import { dateFmt } from '../utils/format.js'

function saleStatus(sale, t) {
  if (sale.status === 'returned') return { tone: 'warn', label: t('status.returned') }
  if (sale.returns?.length) return { tone: 'warn', label: t('status.partial') }
  return { tone: 'ok', label: t('status.completed') }
}

export function SalesPage({ toast }) {
  const { db, taxRate, updateSale, returnSale, returnSaleItems } = useStore()
  const { user } = useAuth()
  const { t } = useUi()
  const [view, setView] = useState(null)
  const [edit, setEdit] = useState(null)
  const [ret, setRet] = useState(null)
  const [addQ, setAddQ] = useState('')

  const live = view ? db.sales.find((s) => s.id === view.id) || view : null

  const editTotals = useMemo(
    () => (edit ? docTotals(edit.items, taxRate, edit.billDiscount) : null),
    [edit, taxRate],
  )

  const addMatches = useMemo(() => {
    const s = addQ.trim().toLowerCase()
    if (!s || !edit) return []
    return db.products.filter((p) => (
      [p.name, p.sku, p.barcode].some((v) => String(v || '').toLowerCase().includes(s))
      && !edit.items.some((line) => line.productId === p.id)
    )).slice(0, 8)
  }, [addQ, db.products, edit])

  const openEdit = (sale) => {
    setEdit({
      id: sale.id,
      items: (sale.items || []).map((line) => ({ ...line })),
      billDiscount: sale.billDiscount || 0,
      note: sale.note || '',
    })
    setAddQ('')
  }

  const openReturn = (sale) => {
    setRet({
      id: sale.id,
      lines: (sale.items || []).map((line) => ({ ...line, returnQty: '' })),
    })
  }

  const setEditLine = (productId, patch) => {
    setEdit((prev) => ({
      ...prev,
      items: prev.items.map((line) => (line.productId === productId ? { ...line, ...patch } : line)),
    }))
  }

  const addProduct = (product) => {
    setEdit((prev) => ({
      ...prev,
      items: [...prev.items, {
        productId: product.id,
        name: product.name,
        qty: 1,
        unit: product.unit || 'pcs',
        listPrice: product.sellPrice,
        price: product.sellPrice,
        discount: 0,
        taxable: product.taxable,
      }],
    }))
    setAddQ('')
  }

  const saveEdit = () => {
    try {
      const sale = updateSale(edit.id, {
        items: edit.items,
        billDiscount: edit.billDiscount,
        note: edit.note,
      }, user.id)
      setEdit(null)
      setView(sale)
      toast(t('sales.edited'))
    } catch (err) {
      toast(err.message, 'bad')
    }
  }

  const saveReturn = () => {
    try {
      const rows = ret.lines
        .map((line) => ({ productId: line.productId, qty: Number(line.returnQty) || 0 }))
        .filter((row) => row.qty > 0)
      if (!rows.length) {
        toast(t('sales.needReturnQty'), 'bad')
        return
      }
      const sale = returnSaleItems(ret.id, rows, user.id)
      setRet(null)
      setView(sale)
      toast(t('sales.returnSomeOk'))
    } catch (err) {
      toast(err.message, 'bad')
    }
  }

  return (
    <div className="page">
      <PageHeader title={t('sales.title')} subtitle={t('sales.sub')} />
      <div className="card card-pad">
        <DataTable
          rows={db.sales}
          columns={[
            { key: 'number', label: t('dash.invoice') },
            { key: 'date', label: t('common.date'), render: (s) => dateFmt(s.date) },
            { key: 'customer', label: t('sales.customer'), render: (s) => db.customers.find((c) => c.id === s.customerId)?.name || '—' },
            { key: 'discount', label: t('pos.off'), render: (s) => <Money value={saleCompromise(s)} /> },
            { key: 'total', label: t('common.total'), render: (s) => <Money value={s.total} /> },
            { key: 'paid', label: t('common.paid'), render: (s) => <Money value={s.paid} /> },
            { key: 'method', label: t('common.method'), render: (s) => s.paymentMethod },
            { key: 'status', label: t('common.status'), render: (s) => {
              const st = saleStatus(s, t)
              return <Badge tone={st.tone}>{st.label}</Badge>
            } },
            { key: 'actions', label: '', render: (s) => (
              <button className="btn ghost small" type="button" onClick={() => setView(s)}>{t('common.view')}</button>
            ) },
          ]}
        />
      </div>
      {live ? (
        <Modal
          title={live.number}
          onClose={() => setView(null)}
          footer={
            <>
              {live.status === 'completed' ? (
                <>
                  <button className="btn ghost" type="button" onClick={() => openEdit(live)}>{t('sales.edit')}</button>
                  <button className="btn ghost" type="button" onClick={() => openReturn(live)}>{t('sales.returnSome')}</button>
                  <button className="btn danger" type="button" onClick={() => {
                    try {
                      returnSale(live.id, user.id)
                      setView(null)
                      toast(t('sales.returned'))
                    } catch (err) { toast(err.message, 'bad') }
                  }}>{t('sales.returnAll')}</button>
                </>
              ) : <span />}
              <button className="btn ghost" type="button" onClick={() => setView(null)}>{t('common.close')}</button>
            </>
          }
        >
          <p className="muted">{dateFmt(live.date)} · {db.customers.find((c) => c.id === live.customerId)?.name}</p>
          {(live.items || []).map((line) => (
            <div className="bill-item bill-item-card" key={line.productId}>
              <b className="bill-item-name">{line.name}</b>
              <div className="bill-item-cols">
                <div className="bill-col">
                  <span>{t('pos.qtyIn', { u: qtyUnit(line.unit) })}</span>
                  <strong>{line.qty} {qtyUnit(line.unit)}</strong>
                </div>
                <div className="bill-col">
                  <span>{t('pos.list')}</span>
                  <strong><Money value={line.listPrice ?? line.price} /></strong>
                </div>
                <div className="bill-col">
                  <span>{t('pos.deal')}</span>
                  <strong><Money value={line.price} /></strong>
                </div>
                <div className="bill-col">
                  <span>{t('common.line')}</span>
                  <strong><Money value={line.total} /></strong>
                </div>
              </div>
            </div>
          ))}
          <p style={{ marginTop: 12 }}>
            {saleCompromise(live) > 0 ? <>{t('pos.off')} <Money value={saleCompromise(live)} /> · </> : null}
            {t('pos.subtotal')} <Money value={live.subtotal} /> · {t('pos.tax')} <Money value={live.tax} /> · {t('common.total')} <Money value={live.total} />
          </p>
          {live.returns?.length ? (
            <p className="muted" style={{ marginTop: 8 }}>
              {t('sales.returnLog')}: {live.returns.map((row) => row.items.map((i) => `${i.name} × ${i.qty}`).join(', ')).join(' · ')}
            </p>
          ) : null}
        </Modal>
      ) : null}
      {edit ? (
        <Modal
          wide
          title={t('sales.edit')}
          onClose={() => setEdit(null)}
          footer={
            <>
              <button className="btn ghost" type="button" onClick={() => setEdit(null)}>{t('common.cancel')}</button>
              <button className="btn copper" type="button" onClick={saveEdit}>{t('common.save')}</button>
            </>
          }
        >
          <p className="muted">{t('sales.editSub')}</p>
          {edit.items.map((line) => (
            <div className="bill-item bill-item-card" key={line.productId}>
              <div className="bill-item-head">
                <b className="bill-item-name">{line.name}</b>
                <button className="btn ghost small" type="button" onClick={() => {
                  setEdit((prev) => ({ ...prev, items: prev.items.filter((i) => i.productId !== line.productId) }))
                }}>{t('common.remove')}</button>
              </div>
              <div className="bill-item-cols">
                <label className="bill-col">
                  <span>{t('pos.qtyIn', { u: qtyUnit(line.unit) })}</span>
                  <input
                    className="deal-input"
                    type="number"
                    min="0"
                    value={line.qty}
                    onChange={(e) => setEditLine(line.productId, { qty: e.target.value })}
                  />
                </label>
                <div className="bill-col">
                  <span>{t('pos.list')}</span>
                  <strong><Money value={line.listPrice ?? line.price} /></strong>
                </div>
                <label className="bill-col bill-col-deal">
                  <span>{t('pos.deal')}</span>
                  <input
                    className="deal-input"
                    type="number"
                    min="0"
                    step="0.01"
                    value={line.price}
                    onChange={(e) => setEditLine(line.productId, { price: e.target.value })}
                  />
                </label>
                <div className="bill-col">
                  <span>{t('common.line')}</span>
                    <strong><Money value={lineGoods(line)} /></strong>
                </div>
              </div>
            </div>
          ))}
          <Field label={t('sales.searchAdd')} full>
            <input
              value={addQ}
              onChange={(e) => setAddQ(e.target.value)}
              placeholder={t('pos.search')}
            />
          </Field>
          {addQ.trim() ? (
            <div className="pick-list">
              {addMatches.length ? addMatches.map((p) => (
                <button key={p.id} className="btn ghost" type="button" onClick={() => addProduct(p)}>
                  {p.name} · <Money value={p.sellPrice} />
                </button>
              )) : <span className="muted">{t('sales.noAdd')}</span>}
            </div>
          ) : null}
          <div className="form-grid" style={{ marginTop: 12 }}>
            <Field label={t('pos.billOff')}>
              <input
                type="number"
                min="0"
                step="0.01"
                value={edit.billDiscount}
                onChange={(e) => setEdit((prev) => ({ ...prev, billDiscount: e.target.value }))}
              />
            </Field>
            <Field label={t('common.note')}>
              <input value={edit.note} onChange={(e) => setEdit((prev) => ({ ...prev, note: e.target.value }))} />
            </Field>
          </div>
          {editTotals ? (
            <p style={{ marginTop: 12 }}>
              {t('pos.subtotal')} <Money value={editTotals.subtotal} /> · {t('pos.tax')} <Money value={editTotals.tax} /> · {t('common.total')} <Money value={editTotals.total} />
            </p>
          ) : null}
        </Modal>
      ) : null}
      {ret ? (
        <Modal
          wide
          title={t('sales.returnSome')}
          onClose={() => setRet(null)}
          footer={
            <>
              <button className="btn ghost" type="button" onClick={() => setRet(null)}>{t('common.cancel')}</button>
              <button className="btn copper" type="button" onClick={saveReturn}>{t('sales.returnSome')}</button>
            </>
          }
        >
          <p className="muted">{t('sales.returnHint')}</p>
          <table className="bill-table">
            <thead>
              <tr>
                <th>{t('common.item')}</th>
                <th>{t('common.qty')}</th>
                <th>{t('sales.returnQty')}</th>
                <th>{t('pos.deal')}</th>
              </tr>
            </thead>
            <tbody>
              {ret.lines.map((line) => (
                <tr key={line.productId}>
                  <td><b>{line.name}</b></td>
                  <td>{line.qty}</td>
                  <td>
                    <input
                      className="deal-input"
                      type="number"
                      min="0"
                      max={line.qty}
                      value={line.returnQty}
                      onChange={(e) => {
                        const n = Math.min(line.qty, Math.max(0, Number(e.target.value) || 0))
                        setRet((prev) => ({
                          ...prev,
                          lines: prev.lines.map((row) => (
                            row.productId === line.productId ? { ...row, returnQty: e.target.value === '' ? '' : n } : row
                          )),
                        }))
                      }}
                    />
                  </td>
                  <td><Money value={line.price} /></td>
                </tr>
              ))}
            </tbody>
          </table>
        </Modal>
      ) : null}
    </div>
  )
}
