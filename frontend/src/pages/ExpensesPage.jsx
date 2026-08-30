import { useState } from 'react'
import { PageHeader, DataTable, Modal, Field, Money } from '../components/Ui.jsx'
import { useAuth } from '../context/AuthContext.jsx'
import { useStore } from '../context/StoreContext.jsx'
import { useUi } from '../context/UiContext.jsx'
import { dateFmt, toDateInput, todayIso } from '../utils/format.js'

export function ExpensesPage({ toast }) {
  const { db, saveExpense, deleteExpense } = useStore()
  const { user } = useAuth()
  const { t, tRich } = useUi()
  const [form, setForm] = useState(null)
  const total = db.expenses.reduce((s, e) => s + e.amount, 0)

  return (
    <div className="page">
      <PageHeader
        title={t('exp.title')}
        subtitle={tRich('exp.sub', { n: <Money value={total} /> })}
        actions={<button className="btn copper" type="button" onClick={() => setForm({ date: toDateInput(todayIso()), category: 'Rent', amount: 0, method: 'cash', note: '' })}>{t('exp.new')}</button>}
      />
      <div className="card card-pad">
        <DataTable
          rows={db.expenses}
          columns={[
            { key: 'date', label: t('common.date'), render: (e) => dateFmt(e.date) },
            { key: 'category', label: t('exp.category') },
            { key: 'amount', label: t('common.amount'), render: (e) => <Money value={e.amount} /> },
            { key: 'method', label: t('common.method') },
            { key: 'note', label: t('common.note') },
            { key: 'actions', label: '', render: (e) => (
              <>
                <button className="btn ghost small" type="button" onClick={() => setForm({ ...e, date: toDateInput(e.date) })}>{t('common.edit')}</button>
                <button className="btn ghost small" type="button" onClick={() => { deleteExpense(e.id); toast(t('products.deleted')) }}>{t('common.delete')}</button>
              </>
            ) },
          ]}
        />
      </div>
      {form ? (
        <Modal
          title={form.id ? t('exp.edit') : t('exp.new')}
          onClose={() => setForm(null)}
          footer={
            <>
              <button className="btn ghost" type="button" onClick={() => setForm(null)}>{t('common.cancel')}</button>
              <button className="btn copper" type="button" onClick={() => {
                try {
                  saveExpense({ ...form, date: new Date(form.date).toISOString() }, user.id)
                  setForm(null)
                  toast(t('cats.saved'))
                } catch (err) { toast(err.message, 'bad') }
              }}>{t('common.save')}</button>
            </>
          }
        >
          <div className="form-grid">
            <Field label={t('exp.category')}><input value={form.category} onChange={(e) => setForm({ ...form, category: e.target.value })} /></Field>
            <Field label={t('common.amount')}><input type="number" value={form.amount} onChange={(e) => setForm({ ...form, amount: e.target.value })} /></Field>
            <Field label={t('common.date')}><input type="date" value={form.date} onChange={(e) => setForm({ ...form, date: e.target.value })} /></Field>
            <Field label={t('common.method')}>
              <select value={form.method} onChange={(e) => setForm({ ...form, method: e.target.value })}>
                <option value="cash">{t('pos.cash')}</option>
                <option value="bank">{t('pos.bank')}</option>
                <option value="card">{t('pos.card')}</option>
              </select>
            </Field>
            <Field label={t('common.note')} full><input value={form.note} onChange={(e) => setForm({ ...form, note: e.target.value })} /></Field>
          </div>
        </Modal>
      ) : null}
    </div>
  )
}
