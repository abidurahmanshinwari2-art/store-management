import { useMemo, useState } from 'react'
import { BarcodeCamera } from '../components/BarcodeCamera.jsx'
import { PageHeader, DataTable, Badge, Modal, Field, Money } from '../components/Ui.jsx'
import { useStore } from '../context/StoreContext.jsx'
import { useUi } from '../context/UiContext.jsx'
import { qtyFmt } from '../utils/format.js'

const emptyProduct = {
  name: '',
  sku: '',
  barcode: '',
  categoryId: '',
  unit: 'pcs',
  costPrice: 0,
  sellPrice: 0,
  reorderLevel: 0,
  taxable: true,
}

export function ProductsPage({ toast }) {
  const { db, getStock, saveProduct, deleteProduct } = useStore()
  const { t } = useUi()
  const [q, setQ] = useState('')
  const [form, setForm] = useState(null)
  const [scanForm, setScanForm] = useState(false)

  const rows = useMemo(() => {
    const s = q.trim().toLowerCase()
    return db.products.filter((p) => !s || [p.name, p.sku, p.barcode].join(' ').toLowerCase().includes(s))
  }, [db.products, q])

  const save = () => {
    try {
      saveProduct({ ...form, categoryId: form.categoryId || db.categories[0]?.id })
      setForm(null)
      toast(t('products.saved'))
    } catch (err) {
      toast(err.message, 'bad')
    }
  }

  return (
    <div className="page">
      <PageHeader
        title={t('products.title')}
        subtitle={t('products.sub')}
        actions={<button className="btn copper" type="button" onClick={() => setForm({ ...emptyProduct, categoryId: db.categories[0]?.id })}>{t('products.new')}</button>}
      />
      <div className="card card-pad">
        <div className="toolbar">
          <input className="search" placeholder={t('products.search')} value={q} onChange={(e) => setQ(e.target.value)} />
        </div>
        <DataTable
          rows={rows}
          columns={[
            { key: 'name', label: t('common.product') },
            { key: 'sku', label: t('products.sku') },
            { key: 'barcode', label: t('products.barcode'), render: (p) => p.barcode || '—' },
            { key: 'category', label: t('products.group'), render: (p) => db.categories.find((c) => c.id === p.categoryId)?.name || '—' },
            { key: 'sellPrice', label: t('products.sell'), render: (p) => <Money value={p.sellPrice} /> },
            { key: 'costPrice', label: t('products.cost'), render: (p) => <Money value={p.costPrice} /> },
            { key: 'stock', label: t('common.stock'), render: (p) => qtyFmt(getStock(p.id)) },
            { key: 'taxable', label: t('products.tax'), render: (p) => <Badge tone={p.taxable ? 'ok' : 'neutral'}>{p.taxable ? t('common.yes') : t('common.no')}</Badge> },
            { key: 'actions', label: '', render: (p) => (
              <>
                <button className="btn ghost small" type="button" onClick={() => setForm(p)}>{t('common.edit')}</button>
                <button className="btn ghost small" type="button" onClick={() => {
                  try { deleteProduct(p.id); toast(t('products.deleted')) } catch (err) { toast(err.message, 'bad') }
                }}>{t('common.delete')}</button>
              </>
            ) },
          ]}
        />
      </div>
      {form ? (
        <Modal
          title={form.id ? t('products.edit') : t('products.new')}
          onClose={() => setForm(null)}
          footer={
            <>
              <button className="btn ghost" type="button" onClick={() => setForm(null)}>{t('common.cancel')}</button>
              <button className="btn copper" type="button" onClick={save}>{t('common.save')}</button>
            </>
          }
        >
          <div className="form-grid">
            <Field label={t('common.name')} full><input value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} /></Field>
            <Field label={t('products.sku')}><input value={form.sku} onChange={(e) => setForm({ ...form, sku: e.target.value })} /></Field>
            <Field label={t('products.barcode')} full>
              <div className="scan-row">
                <input
                  value={form.barcode}
                  onChange={(e) => setForm({ ...form, barcode: e.target.value })}
                  placeholder={t('products.barcodeHint')}
                />
                <button className="btn ghost" type="button" onClick={() => setScanForm(true)}>{t('pos.camera')}</button>
              </div>
            </Field>
            <Field label={t('products.group')}>
              <select value={form.categoryId} onChange={(e) => setForm({ ...form, categoryId: e.target.value })}>
                {db.categories.map((c) => <option key={c.id} value={c.id}>{c.name}</option>)}
              </select>
            </Field>
            <Field label={t('products.unit')}><input value={form.unit} onChange={(e) => setForm({ ...form, unit: e.target.value })} /></Field>
            <Field label={t('products.cost')}><input type="number" value={form.costPrice} onChange={(e) => setForm({ ...form, costPrice: e.target.value })} /></Field>
            <Field label={t('products.sell')}><input type="number" value={form.sellPrice} onChange={(e) => setForm({ ...form, sellPrice: e.target.value })} /></Field>
            <Field label={t('products.reorder')}><input type="number" value={form.reorderLevel} onChange={(e) => setForm({ ...form, reorderLevel: e.target.value })} /></Field>
            <label className="check field">
              <input type="checkbox" checked={form.taxable} onChange={(e) => setForm({ ...form, taxable: e.target.checked })} />
              {t('products.taxable')}
            </label>
          </div>
        </Modal>
      ) : null}
      {form && scanForm ? (
        <BarcodeCamera
          onCode={(code) => {
            setForm((prev) => (prev ? { ...prev, barcode: code } : prev))
            setScanForm(false)
          }}
          onClose={() => setScanForm(false)}
        />
      ) : null}
    </div>
  )
}
