import { useState } from 'react'
import { PageHeader, DataTable, Badge, Modal, Field, Money } from '../components/Ui.jsx'
import { useAuth } from '../context/AuthContext.jsx'
import { useStore } from '../context/StoreContext.jsx'
import { useUi } from '../context/UiContext.jsx'
import { dateFmt, money, toDateInput, todayIso } from '../utils/format.js'

export function PaymentsPage({ toast }) {
  const { db, symbol, recordPayment } = useStore()
  const { user } = useAuth()
  const { t } = useUi()
  const [form, setForm] = useState(null)
  const parties = form?.partyType === 'supplier' ? db.suppliers : db.customers.filter((c) => !c.isWalkIn)

  return (
    <div className="page">
      <PageHeader
        title={t('pay.title')}
        subtitle={t('pay.sub')}
        actions={<button className="btn copper" type="button" onClick={() => setForm({ type: 'in', partyType: 'customer', partyId: db.customers.find((c) => !c.isWalkIn)?.id, amount: 0, method: 'cash', date: toDateInput(todayIso()), note: '' })}>{t('pay.new')}</button>}
      />
      <div className="card card-pad">
        <DataTable
          rows={db.payments}
          columns={[
            { key: 'date', label: t('common.date'), render: (p) => dateFmt(p.date) },
            { key: 'type', label: t('pay.direction'), render: (p) => <Badge tone={p.type === 'in' ? 'ok' : 'warn'}>{p.type === 'in' ? t('pay.in') : t('pay.out')}</Badge> },
            { key: 'party', label: t('pay.party'), render: (p) => {
              const list = p.partyType === 'supplier' ? db.suppliers : db.customers
              return list.find((x) => x.id === p.partyId)?.name || '—'
            } },
            { key: 'amount', label: t('common.amount'), render: (p) => <Money value={p.amount} /> },
            { key: 'method', label: t('common.method') },
            { key: 'note', label: t('common.note') },
          ]}
        />
      </div>
      {form ? (
        <Modal
          title={t('pay.new')}
          onClose={() => setForm(null)}
          footer={
            <>
              <button className="btn ghost" type="button" onClick={() => setForm(null)}>{t('common.cancel')}</button>
              <button className="btn copper" type="button" onClick={() => {
                try {
                  recordPayment({ ...form, date: new Date(form.date).toISOString() }, user.id)
                  setForm(null)
                  toast(t('pay.saved'))
                } catch (err) { toast(err.message, 'bad') }
              }}>{t('common.save')}</button>
            </>
          }
        >
          <div className="form-grid">
            <Field label={t('pay.direction')}>
              <select value={form.type} onChange={(e) => {
                const type = e.target.value
                const partyType = type === 'in' ? 'customer' : 'supplier'
                setForm({
                  ...form,
                  type,
                  partyType,
                  partyId: partyType === 'supplier' ? db.suppliers[0]?.id : db.customers.find((c) => !c.isWalkIn)?.id,
                })
              }}>
                <option value="in">{t('pay.inOpt')}</option>
                <option value="out">{t('pay.outOpt')}</option>
              </select>
            </Field>
            <Field label={t('pay.party')}>
              <select value={form.partyId} onChange={(e) => setForm({ ...form, partyId: e.target.value })}>
                {parties.map((p) => <option key={p.id} value={p.id}>{p.name} · {t('common.bal')} {money(p.balance || 0, symbol)}</option>)}
              </select>
            </Field>
            <Field label={t('common.amount')}><input type="number" value={form.amount} onChange={(e) => setForm({ ...form, amount: e.target.value })} /></Field>
            <Field label={t('common.method')}>
              <select value={form.method} onChange={(e) => setForm({ ...form, method: e.target.value })}>
                <option value="cash">{t('pos.cash')}</option>
                <option value="card">{t('pos.card')}</option>
                <option value="bank">{t('pos.bank')}</option>
              </select>
            </Field>
            <Field label={t('common.date')}><input type="date" value={form.date} onChange={(e) => setForm({ ...form, date: e.target.value })} /></Field>
            <Field label={t('common.note')}><input value={form.note} onChange={(e) => setForm({ ...form, note: e.target.value })} /></Field>
          </div>
        </Modal>
      ) : null}
    </div>
  )
}
