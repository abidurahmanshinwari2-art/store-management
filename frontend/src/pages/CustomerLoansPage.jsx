import { useState } from 'react'
import { PageHeader, DataTable, StatCard, Modal, Field, Money, Badge } from '../components/Ui.jsx'
import { useAuth } from '../context/AuthContext.jsx'
import { useStore } from '../context/StoreContext.jsx'
import { useUi } from '../context/UiContext.jsx'
import { dateBoth, round2, toDateInput, todayIso } from '../utils/format.js'

export function CustomerLoansPage({ toast }) {
  const { db, attachBillByNumber, recordPayment } = useStore()
  const { user } = useAuth()
  const { t } = useUi()
  const [openId, setOpenId] = useState(null)
  const [bill, setBill] = useState(null)
  const [pay, setPay] = useState(null)

  const customers = db.customers.filter((c) => !c.isWalkIn)
  const withLoan = customers.filter((c) => (c.balance || 0) > 0)
  const allLoan = round2(customers.reduce((s, c) => s + (c.balance || 0), 0))
  const open = customers.find((c) => c.id === openId) || withLoan[0] || customers[0] || null

  const invoices = open
    ? db.sales.filter((s) => s.customerId === open.id && s.status !== 'void')
    : []
  const pays = open
    ? db.payments.filter((p) => p.partyType === 'customer' && p.partyId === open.id)
    : []

  const found = bill?.number
    ? db.sales.find((s) => String(s.number).trim().toLowerCase() === String(bill.number).trim().toLowerCase())
    : null
  const foundDue = found ? round2(found.total - found.paid) : 0

  const startBill = (customerId) => {
    setBill({ customerId, number: '', mode: 'due', amount: '' })
  }

  const startPay = (customerId) => {
    const customer = db.customers.find((c) => c.id === customerId)
    setPay({
      customerId,
      amount: customer?.balance || 0,
      method: 'cash',
      date: toDateInput(todayIso()),
      note: '',
    })
  }

  const saveBill = () => {
    try {
      const loanAmount = bill.mode === 'fixed' ? bill.amount : undefined
      const result = attachBillByNumber(bill.number, bill.customerId, loanAmount)
      setOpenId(bill.customerId)
      setBill(null)
      toast(result.already ? t('loan.alreadyOnLoan') : t('loan.attached'))
    } catch (err) {
      const map = {
        'Write a bill number.': t('loan.needNumber'),
        'Bill not found.': t('loan.notFound'),
        'This bill cannot go on loan.': t('loan.badBill'),
        'This bill is already paid.': t('loan.needFixed'),
        'Credit sales need a named customer.': t('pos.needCustomer'),
        'Write a money amount.': t('loan.needAmount'),
        'That is more than the bill total.': t('loan.overBill'),
        'This bill is partly paid. You cannot add the whole bill.': t('loan.noWhole'),
      }
      toast(map[err.message] || err.message, 'bad')
    }
  }

  const savePay = () => {
    try {
      const customer = db.customers.find((c) => c.id === pay.customerId)
      const amount = round2(pay.amount)
      if (amount <= 0) throw new Error(t('loan.needAmount'))
      const due = round2(customer?.balance || 0)
      if (amount > due + 0.001) throw new Error(t('loan.tooMuch'))
      recordPayment({
        type: 'in',
        partyType: 'customer',
        partyId: pay.customerId,
        amount,
        method: pay.method,
        date: new Date(pay.date).toISOString(),
        note: pay.note,
      }, user.id)
      setOpenId(pay.customerId)
      setPay(null)
      toast(t('loan.savedPay'))
    } catch (err) {
      toast(err.message, 'bad')
    }
  }

  return (
    <div className="page">
      <PageHeader
        title={t('loan.title')}
        subtitle={t('loan.sub')}
        actions={<button className="btn copper" type="button" onClick={() => startBill(open?.id || customers[0]?.id)}>{t('loan.addBill')}</button>}
      />
      <div className="stats">
        <StatCard label={t('loan.total')} value={<Money value={allLoan} />} hint={t('loan.openCount', { n: withLoan.length })} />
        <StatCard label={t('loan.open')} value={withLoan.length} hint={t('loan.allCustomers') + ': ' + customers.length} />
      </div>

      <div className="grid-2" style={{ marginTop: 14 }}>
        <div className="card card-pad">
          <h3>{t('loan.title')}</h3>
          <DataTable
            rows={customers}
            empty={t('loan.none')}
            columns={[
              { key: 'name', label: t('common.name'), render: (c) => (
                <button className="linkish" type="button" onClick={() => setOpenId(c.id)}>{c.name}</button>
              ) },
              { key: 'phone', label: t('common.phone') },
              { key: 'balance', label: t('loan.remain'), render: (c) => (
                (c.balance || 0) > 0 ? <Money value={c.balance} /> : <span className="muted">0</span>
              ) },
              { key: 'actions', label: '', render: (c) => (
                <>
                  <button className="btn ghost small" type="button" onClick={() => setOpenId(c.id)}>{t('common.view')}</button>
                  <button className="btn ghost small" type="button" onClick={() => startBill(c.id)}>{t('loan.addBill')}</button>
                  {(c.balance || 0) > 0 ? (
                    <button className="btn copper small" type="button" onClick={() => startPay(c.id)}>{t('loan.paySome')}</button>
                  ) : null}
                </>
              ) },
            ]}
          />
        </div>

        <div className="card card-pad">
          {open ? (
            <>
              <h3>{open.name}</h3>
              <p className="muted">{open.phone} · {open.address}</p>
              <p style={{ margin: '10px 0 14px' }}>
                {t('loan.remain')} <b><Money value={open.balance || 0} /></b>
                {(open.balance || 0) > 0 ? (
                  <button className="btn copper small" type="button" style={{ marginLeft: 10 }} onClick={() => startPay(open.id)}>{t('loan.paySome')}</button>
                ) : null}
              </p>
              <h4>{t('loan.invoices')}</h4>
              <DataTable
                rows={invoices}
                empty={t('loan.none')}
                columns={[
                  { key: 'number', label: t('dash.invoice') },
                  { key: 'date', label: t('common.date'), render: (s) => dateBoth(s.date) },
                  { key: 'total', label: t('common.total'), render: (s) => <Money value={s.total} /> },
                  { key: 'paid', label: t('common.paid'), render: (s) => <Money value={s.paid} /> },
                  { key: 'due', label: t('loan.due'), render: (s) => <Money value={round2(s.total - s.paid)} /> },
                  { key: 'status', label: t('common.status'), render: (s) => <Badge tone={s.status === 'completed' ? 'ok' : 'warn'}>{t(`status.${s.status}`)}</Badge> },
                ]}
              />
              <h4 style={{ marginTop: 16 }}>{t('loan.pays')}</h4>
              <DataTable
                rows={pays}
                empty={t('loan.none')}
                columns={[
                  { key: 'date', label: t('common.date'), render: (p) => dateBoth(p.date) },
                  { key: 'amount', label: t('common.amount'), render: (p) => <Money value={p.amount} /> },
                  { key: 'method', label: t('common.method') },
                  { key: 'note', label: t('common.note') },
                ]}
              />
            </>
          ) : (
            <p className="muted">{t('loan.pickCustomer')}</p>
          )}
        </div>
      </div>

      {bill ? (
        <Modal
          title={t('loan.addBill')}
          onClose={() => setBill(null)}
          footer={
            <>
              <button className="btn ghost" type="button" onClick={() => setBill(null)}>{t('common.cancel')}</button>
              <button className="btn copper" type="button" onClick={saveBill}>{t('common.save')}</button>
            </>
          }
        >
          <div className="form-grid">
            <Field label={t('sales.customer')}>
              <select value={bill.customerId} onChange={(e) => setBill({ ...bill, customerId: e.target.value })}>
                {customers.map((c) => <option key={c.id} value={c.id}>{c.name} · {t('loan.remain')} {round2(c.balance || 0)}</option>)}
              </select>
            </Field>
            <Field label={t('loan.billNumber')}>
              <input
                value={bill.number}
                placeholder="INV-0001"
                onChange={(e) => setBill({ ...bill, number: e.target.value })}
              />
            </Field>
            <Field label={t('loan.howMuch')}>
              <select value={bill.mode} onChange={(e) => setBill({ ...bill, mode: e.target.value, amount: e.target.value === 'due' ? '' : bill.amount })}>
                <option value="due">{t('loan.useDue')}</option>
                <option value="fixed">{t('loan.useFixed')}</option>
              </select>
            </Field>
            {bill.mode === 'fixed' ? (
              <Field label={t('loan.loanAmount')}>
                <input
                  type="number"
                  min="0"
                  step="0.01"
                  value={bill.amount}
                  onChange={(e) => setBill({ ...bill, amount: e.target.value })}
                />
              </Field>
            ) : null}
          </div>
          {found ? (
            <p style={{ marginTop: 12 }}>
              {found.number} · {t('common.total')} <Money value={found.total} /> · {t('common.paid')} <Money value={found.paid} /> · {t('loan.due')} <Money value={foundDue} />
              {found.paid > 0 ? (
                <span className="muted"> · {t('loan.partPaid')}</span>
              ) : bill.mode === 'due' && found.customerId === bill.customerId ? (
                <span className="muted"> · {t('loan.alreadyOnLoan')}</span>
              ) : bill.mode === 'due' ? (
                <span className="muted"> · {t('loan.willAdd')}</span>
              ) : null}
            </p>
          ) : bill.number.trim() ? (
            <p className="muted" style={{ marginTop: 12 }}>{t('loan.notFound')}</p>
          ) : (
            <p className="muted" style={{ marginTop: 12 }}>{t('loan.numberHint')}</p>
          )}
          {bill.mode === 'fixed' ? (
            <p className="muted" style={{ marginTop: 8 }}>{t('loan.fixedHint')}</p>
          ) : found && foundDue <= 0 ? (
            <p className="muted" style={{ marginTop: 8 }}>{t('loan.needFixed')}</p>
          ) : null}
        </Modal>
      ) : null}

      {pay ? (
        <Modal
          title={t('loan.paySome')}
          onClose={() => setPay(null)}
          footer={
            <>
              <button className="btn ghost" type="button" onClick={() => setPay(null)}>{t('common.cancel')}</button>
              <button className="btn copper" type="button" onClick={savePay}>{t('common.save')}</button>
            </>
          }
        >
          <p className="muted" style={{ marginBottom: 10 }}>
            {db.customers.find((c) => c.id === pay.customerId)?.name} · {t('loan.remain')} <Money value={db.customers.find((c) => c.id === pay.customerId)?.balance || 0} />
          </p>
          <div className="form-grid">
            <Field label={t('common.amount')}><input type="number" value={pay.amount} onChange={(e) => setPay({ ...pay, amount: e.target.value })} /></Field>
            <Field label={t('common.method')}>
              <select value={pay.method} onChange={(e) => setPay({ ...pay, method: e.target.value })}>
                <option value="cash">{t('pos.cash')}</option>
                <option value="card">{t('pos.card')}</option>
                <option value="bank">{t('pos.bank')}</option>
              </select>
            </Field>
            <Field label={t('common.date')}><input type="date" value={pay.date} onChange={(e) => setPay({ ...pay, date: e.target.value })} /></Field>
            <Field label={t('common.note')}><input value={pay.note} onChange={(e) => setPay({ ...pay, note: e.target.value })} /></Field>
          </div>
        </Modal>
      ) : null}
    </div>
  )
}
