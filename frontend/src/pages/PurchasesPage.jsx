import { useState } from 'react'
import { PageHeader, DataTable, Badge, Modal, Field, Money } from '../components/Ui.jsx'
import { useAuth } from '../context/AuthContext.jsx'
import { useStore } from '../context/StoreContext.jsx'
import { useUi } from '../context/UiContext.jsx'
import { dateFmt, toDateInput, todayIso } from '../utils/format.js'

export function PurchasesPage({ toast }) {
  const { db, createPurchase, receivePurchase } = useStore()
  const { user } = useAuth()
  const { t } = useUi()
  const [form, setForm] = useState(null)
  const [view, setView] = useState(null)

  const openNew = () => {
    const product = db.products[0]
    setForm({
      date: toDateInput(todayIso()),
      supplierId: db.suppliers[0]?.id,
      warehouseId: db.warehouses[0]?.id,
      paid: 0,
      status: 'received',
      note: '',
      items: product ? [{ productId: product.id, qty: 1, cost: product.costPrice }] : [],
    })
  }

  const save = () => {
    try {
      createPurchase({ ...form, date: new Date(form.date).toISOString() }, user.id)
      setForm(null)
      toast(t('buy.saved'))
    } catch (err) {
      toast(err.message, 'bad')
    }
  }

  return (
    <div className="page">
      <PageHeader
        title={t('buy.title')}
        subtitle={t('buy.sub')}
        actions={<button className="btn copper" type="button" onClick={openNew}>{t('buy.new')}</button>}
      />
      <div className="card card-pad">
        <DataTable
          rows={db.purchases}
          columns={[
            { key: 'number', label: 'PO' },
            { key: 'date', label: t('common.date'), render: (p) => dateFmt(p.date) },
            { key: 'supplier', label: t('buy.supplier'), render: (p) => db.suppliers.find((s) => s.id === p.supplierId)?.name || '—' },
            { key: 'total', label: t('common.total'), render: (p) => <Money value={p.total} /> },
            { key: 'paid', label: t('common.paid'), render: (p) => <Money value={p.paid} /> },
            { key: 'status', label: t('common.status'), render: (p) => <Badge tone={p.status === 'received' ? 'ok' : 'warn'}>{t(`status.${p.status}`)}</Badge> },
            { key: 'actions', label: '', render: (p) => (
              <>
                <button className="btn ghost small" type="button" onClick={() => setView(p)}>{t('common.view')}</button>
                {p.status === 'draft' ? (
                  <button className="btn ghost small" type="button" onClick={() => {
                    try { receivePurchase(p.id); toast(t('buy.received')) } catch (err) { toast(err.message, 'bad') }
                  }}>{t('buy.receive')}</button>
                ) : null}
              </>
            ) },
          ]}
        />
      </div>
      {form ? (
        <Modal
          wide
          title={t('buy.new')}
          onClose={() => setForm(null)}
          footer={
            <>
              <button className="btn ghost" type="button" onClick={() => setForm(null)}>{t('common.cancel')}</button>
              <button className="btn copper" type="button" onClick={save}>{t('common.save')}</button>
            </>
          }
        >
          <div className="form-grid">
            <Field label={t('buy.supplier')}>
              <select value={form.supplierId} onChange={(e) => setForm({ ...form, supplierId: e.target.value })}>
                {db.suppliers.map((s) => <option key={s.id} value={s.id}>{s.name}</option>)}
              </select>
            </Field>
            <Field label={t('buy.room')}>
              <select value={form.warehouseId} onChange={(e) => setForm({ ...form, warehouseId: e.target.value })}>
                {db.warehouses.map((w) => <option key={w.id} value={w.id}>{w.name}</option>)}
              </select>
            </Field>
            <Field label={t('common.date')}><input type="date" value={form.date} onChange={(e) => setForm({ ...form, date: e.target.value })} /></Field>
            <Field label={t('common.status')}>
              <select value={form.status} onChange={(e) => setForm({ ...form, status: e.target.value })}>
                <option value="received">{t('buy.statusRecv')}</option>
                <option value="draft">{t('buy.statusDraft')}</option>
              </select>
            </Field>
            <Field label={t('pos.amountPaid')}><input type="number" value={form.paid} onChange={(e) => setForm({ ...form, paid: e.target.value })} /></Field>
            <Field label={t('common.note')}><input value={form.note} onChange={(e) => setForm({ ...form, note: e.target.value })} /></Field>
          </div>
          <div className="toolbar" style={{ marginTop: 12 }}>
            <button className="btn ghost small" type="button" onClick={() => {
              const product = db.products[0]
              setForm({ ...form, items: [...form.items, { productId: product.id, qty: 1, cost: product.costPrice }] })
            }}>{t('buy.addLine')}</button>
          </div>
          {form.items.map((line, idx) => (
            <div className="form-grid" key={idx} style={{ marginBottom: 8 }}>
              <Field label={t('common.product')}>
                <select value={line.productId} onChange={(e) => {
                  const product = db.products.find((p) => p.id === e.target.value)
                  const items = form.items.slice()
                  items[idx] = { ...line, productId: product.id, cost: product.costPrice }
                  setForm({ ...form, items })
                }}>
                  {db.products.map((p) => <option key={p.id} value={p.id}>{p.name}</option>)}
                </select>
              </Field>
              <Field label={t('common.qty')}><input type="number" value={line.qty} onChange={(e) => {
                const items = form.items.slice()
                items[idx] = { ...line, qty: e.target.value }
                setForm({ ...form, items })
              }} /></Field>
              <Field label={t('common.cost')}><input type="number" value={line.cost} onChange={(e) => {
                const items = form.items.slice()
                items[idx] = { ...line, cost: e.target.value }
                setForm({ ...form, items })
              }} /></Field>
              <div style={{ display: 'flex', alignItems: 'end' }}>
                <button className="btn ghost small" type="button" onClick={() => setForm({ ...form, items: form.items.filter((_, i) => i !== idx) })}>{t('common.remove')}</button>
              </div>
            </div>
          ))}
        </Modal>
      ) : null}
      {view ? (
        <Modal title={view.number} onClose={() => setView(null)}>
          <p className="muted">{dateFmt(view.date)} · {db.suppliers.find((s) => s.id === view.supplierId)?.name}</p>
          <DataTable
            rows={view.items.map((i, n) => ({ ...i, id: n }))}
            columns={[
              { key: 'name', label: t('common.item') },
              { key: 'qty', label: t('common.qty') },
              { key: 'cost', label: t('common.cost'), render: (i) => <Money value={i.cost} /> },
              { key: 'total', label: t('common.line'), render: (i) => <Money value={i.total} /> },
            ]}
          />
          <p style={{ marginTop: 12 }}>{t('pos.tax')} <Money value={view.tax} /> · {t('common.total')} <Money value={view.total} /> · {t('common.paid')} <Money value={view.paid} /></p>
        </Modal>
      ) : null}
    </div>
  )
}
