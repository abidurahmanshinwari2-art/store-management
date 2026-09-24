import { useMemo, useState } from 'react'
import { PageHeader, DataTable, Modal, Field, Badge } from '../components/Ui.jsx'
import { useAuth } from '../context/AuthContext.jsx'
import { useStore } from '../context/StoreContext.jsx'
import { useUi } from '../context/UiContext.jsx'
import { priceBase, qtyUnit, stockInputUnit, toStockQty } from '../lib/units.js'
import { dateFmt, qtyFmt } from '../utils/format.js'

export function InventoryPage({ toast }) {
  const { db, getStock, adjustInventory, transferStock } = useStore()
  const { user } = useAuth()
  const { t } = useUi()
  const [tab, setTab] = useState('stock')
  const [q, setQ] = useState('')
  const [adjust, setAdjust] = useState(null)
  const [transfer, setTransfer] = useState(null)

  const rows = useMemo(() => {
    const s = q.trim().toLowerCase()
    return db.products
      .filter((p) => !s || p.name.toLowerCase().includes(s) || p.sku.toLowerCase().includes(s))
      .map((p) => ({
        ...p,
        total: getStock(p.id),
        byWh: db.warehouses.map((w) => `${w.name}: ${qtyFmt(getStock(p.id, w.id))} ${qtyUnit(p.unit)}`).join(' · '),
        low: getStock(p.id) <= p.reorderLevel,
      }))
  }, [db, q, getStock])

  return (
    <div className="page">
      <PageHeader
        title={t('inv.title')}
        subtitle={t('inv.sub')}
      />
      <div className="tabs">
        <button type="button" className={tab === 'stock' ? 'active' : ''} onClick={() => setTab('stock')}>{t('inv.onHand')}</button>
        <button type="button" className={tab === 'moves' ? 'active' : ''} onClick={() => setTab('moves')}>{t('inv.moves')}</button>
      </div>
      {tab === 'stock' ? (
        <div className="card card-pad">
          <div className="toolbar">
            <input className="search" placeholder={t('inv.search')} value={q} onChange={(e) => setQ(e.target.value)} />
            <button className="btn ghost" type="button" onClick={() => setTransfer({ productId: db.products[0]?.id, fromId: db.warehouses[0]?.id, toId: db.warehouses[1]?.id, qty: 1 })}>
              {t('inv.transfer')}
            </button>
          </div>
          <DataTable
            rows={rows}
            columns={[
              { key: 'name', label: t('common.product') },
              { key: 'sku', label: t('products.sku') },
              { key: 'total', label: t('common.total'), render: (p) => <span className={p.low ? 'low' : ''}>{qtyFmt(p.total)} {qtyUnit(p.unit)}</span> },
              { key: 'byWh', label: t('inv.warehouses') },
              { key: 'status', label: '', render: (p) => p.low ? <Badge tone="warn">{t('inv.reorder')}</Badge> : <Badge tone="ok">{t('inv.ok')}</Badge> },
              { key: 'actions', label: '', render: (p) => (
                <button className="btn ghost small" type="button" onClick={() => setAdjust({ productId: p.id, warehouseId: db.warehouses[0]?.id, qty: 1, note: '' })}>
                  {t('inv.adjust')}
                </button>
              ) },
            ]}
          />
        </div>
      ) : (
        <div className="card card-pad">
          <DataTable
            rows={db.movements}
            columns={[
              { key: 'date', label: t('common.date'), render: (m) => dateFmt(m.date) },
              { key: 'product', label: t('common.product'), render: (m) => db.products.find((p) => p.id === m.productId)?.name || m.productId },
              { key: 'warehouse', label: t('buy.room'), render: (m) => db.warehouses.find((w) => w.id === m.warehouseId)?.name || '—' },
              { key: 'qty', label: t('common.qty'), render: (m) => qtyFmt(m.qty) },
              { key: 'type', label: t('inv.type') },
              { key: 'ref', label: t('inv.ref') },
            ]}
          />
        </div>
      )}
      {adjust ? (
        <Modal
          title={t('inv.adjustTitle')}
          onClose={() => setAdjust(null)}
          footer={
            <>
              <button className="btn ghost" type="button" onClick={() => setAdjust(null)}>{t('common.cancel')}</button>
              <button className="btn copper" type="button" onClick={() => {
                try {
                  const product = db.products.find((p) => p.id === adjust.productId)
                  adjustInventory({ ...adjust, qty: toStockQty(adjust.qty, product?.unit), userId: user.id })
                  setAdjust(null)
                  toast(t('inv.updated'))
                } catch (err) { toast(err.message, 'bad') }
              }}>{t('common.apply')}</button>
            </>
          }
        >
          <div className="form-grid">
            <Field label={t('common.product')}>
              <select value={adjust.productId} onChange={(e) => setAdjust({ ...adjust, productId: e.target.value })}>
                {db.products.map((p) => <option key={p.id} value={p.id}>{p.name}</option>)}
              </select>
            </Field>
            <Field label={t('buy.room')}>
              <select value={adjust.warehouseId} onChange={(e) => setAdjust({ ...adjust, warehouseId: e.target.value })}>
                {db.warehouses.map((w) => <option key={w.id} value={w.id}>{w.name}</option>)}
              </select>
            </Field>
            <Field label={`${t('inv.qtyChange')} (${stockInputUnit(db.products.find((p) => p.id === adjust.productId)?.unit)})`}>
              <input type="number" step="any" value={adjust.qty} onChange={(e) => setAdjust({ ...adjust, qty: e.target.value })} />
            </Field>
            {priceBase(db.products.find((p) => p.id === adjust.productId)?.unit) === 'kg' ? <p className="muted" style={{ gridColumn: '1 / -1' }}>{t('inv.qtyHintKg')}</p> : null}
            {priceBase(db.products.find((p) => p.id === adjust.productId)?.unit) === 'm' ? <p className="muted" style={{ gridColumn: '1 / -1' }}>{t('inv.qtyHintM')}</p> : null}
            <Field label={t('common.note')}><input value={adjust.note} onChange={(e) => setAdjust({ ...adjust, note: e.target.value })} /></Field>
          </div>
        </Modal>
      ) : null}
      {transfer ? (
        <Modal
          title={t('inv.moveTitle')}
          onClose={() => setTransfer(null)}
          footer={
            <>
              <button className="btn ghost" type="button" onClick={() => setTransfer(null)}>{t('common.cancel')}</button>
              <button className="btn copper" type="button" onClick={() => {
                try {
                  const product = db.products.find((p) => p.id === transfer.productId)
                  transferStock({ ...transfer, qty: toStockQty(transfer.qty, product?.unit), userId: user.id })
                  setTransfer(null)
                  toast(t('inv.moved'))
                } catch (err) { toast(err.message, 'bad') }
              }}>{t('inv.transfer')}</button>
            </>
          }
        >
          <div className="form-grid">
            <Field label={t('common.product')} full>
              <select value={transfer.productId} onChange={(e) => setTransfer({ ...transfer, productId: e.target.value })}>
                {db.products.map((p) => <option key={p.id} value={p.id}>{p.name}</option>)}
              </select>
            </Field>
            <Field label={t('inv.from')}>
              <select value={transfer.fromId} onChange={(e) => setTransfer({ ...transfer, fromId: e.target.value })}>
                {db.warehouses.map((w) => <option key={w.id} value={w.id}>{w.name}</option>)}
              </select>
            </Field>
            <Field label={t('inv.to')}>
              <select value={transfer.toId} onChange={(e) => setTransfer({ ...transfer, toId: e.target.value })}>
                {db.warehouses.map((w) => <option key={w.id} value={w.id}>{w.name}</option>)}
              </select>
            </Field>
            <Field label={`${t('common.qty')} (${stockInputUnit(db.products.find((p) => p.id === transfer.productId)?.unit)})`}>
              <input type="number" step="any" value={transfer.qty} onChange={(e) => setTransfer({ ...transfer, qty: e.target.value })} />
            </Field>
            {priceBase(db.products.find((p) => p.id === transfer.productId)?.unit) === 'kg' ? <p className="muted" style={{ gridColumn: '1 / -1' }}>{t('inv.qtyHintKg')}</p> : null}
            {priceBase(db.products.find((p) => p.id === transfer.productId)?.unit) === 'm' ? <p className="muted" style={{ gridColumn: '1 / -1' }}>{t('inv.qtyHintM')}</p> : null}
          </div>
        </Modal>
      ) : null}
    </div>
  )
}
