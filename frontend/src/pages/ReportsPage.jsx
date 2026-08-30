import { useState } from 'react'
import { PageHeader, DataTable, StatCard, Money } from '../components/Ui.jsx'
import { useStore } from '../context/StoreContext.jsx'
import { useUi } from '../context/UiContext.jsx'
import { cogsOf } from '../lib/calc.js'
import { dateBoth, downloadCsv, money, round2 } from '../utils/format.js'
import { inMonth, meladiMonthName, monthKeyOf, monthOptionLabel, parseMonthKey } from '../utils/jalali.js'

function collectMonthKeys(db) {
  const keys = new Set()
  const now = new Date()
  for (let i = 0; i < 36; i += 1) {
    keys.add(monthKeyOf(new Date(now.getFullYear(), now.getMonth() - i, 1)))
  }
  ;[...db.sales, ...db.purchases, ...db.expenses, ...db.payments].forEach((row) => {
    if (row?.date) keys.add(monthKeyOf(row.date))
  })
  return [...keys].filter(Boolean).sort().reverse()
}

export function ReportsPage() {
  const { db, getStock, symbol } = useStore()
  const { t, tRich, lang } = useUi()
  const months = collectMonthKeys(db)
  const current = monthKeyOf(new Date())
  const [month, setMonth] = useState(current)

  const sales = db.sales.filter((s) => s.status === 'completed' && inMonth(s.date, month))
  const purchases = db.purchases.filter((p) => inMonth(p.date, month))
  const expenses = db.expenses.filter((e) => inMonth(e.date, month))
  const payments = db.payments.filter((p) => inMonth(p.date, month))

  const salesTotal = round2(sales.reduce((s, r) => s + r.total, 0))
  const salesPaid = round2(sales.reduce((s, r) => s + r.paid, 0))
  const tax = round2(sales.reduce((s, r) => s + r.tax, 0))
  const buysTotal = round2(purchases.reduce((s, r) => s + r.total, 0))
  const costsTotal = round2(expenses.reduce((s, e) => s + e.amount, 0))
  const cogs = round2(sales.reduce((s, r) => s + cogsOf(r.items, db.products), 0))
  const profit = round2(salesTotal - tax - cogs - costsTotal)
  const stockValue = round2(
    db.products.reduce((sum, p) => sum + getStock(p.id) * (Number(p.costPrice) || 0), 0),
  )

  const byProduct = {}
  sales.forEach((s) => {
    s.items.forEach((item) => {
      byProduct[item.productId] = byProduct[item.productId] || { id: item.productId, name: item.name, qty: 0, sales: 0 }
      byProduct[item.productId].qty += item.qty
      byProduct[item.productId].sales += item.total
    })
  })
  const top = Object.values(byProduct).sort((a, b) => b.sales - a.sales)

  const monthLabel = monthOptionLabel(month, lang)

  const monthRows = (key) => {
    const listSales = db.sales.filter((s) => inMonth(s.date, key))
    const listBuys = db.purchases.filter((p) => inMonth(p.date, key))
    const listCosts = db.expenses.filter((e) => inMonth(e.date, key))
    const listPay = db.payments.filter((p) => inMonth(p.date, key))
    return { listSales, listBuys, listCosts, listPay }
  }

  const downloadMonth = (key) => {
    const { year: y, month: m } = parseMonthKey(key)
    const label = `${meladiMonthName(m, 'en')}-${y}`
    const { listSales, listBuys, listCosts, listPay } = monthRows(key)
    downloadCsv(`report-${key}.csv`, [
      [t('rep.title'), label],
      [],
      [t('rep.monthSales'), round2(listSales.filter((s) => s.status === 'completed').reduce((s, r) => s + r.total, 0))],
      [t('rep.monthBuys'), round2(listBuys.reduce((s, r) => s + r.total, 0))],
      [t('rep.monthCosts'), round2(listCosts.reduce((s, e) => s + e.amount, 0))],
      [],
      [t('rep.bills')],
      [t('dash.invoice'), t('common.date'), t('sales.customer'), t('pos.subtotal'), t('pos.tax'), t('common.total'), t('common.paid'), t('common.status')],
      ...listSales.map((s) => [
        s.number,
        dateBoth(s.date),
        db.customers.find((c) => c.id === s.customerId)?.name,
        s.subtotal,
        s.tax,
        s.total,
        s.paid,
        s.status,
      ]),
      [],
      [t('rep.monthBuys')],
      ['PO', t('common.date'), t('buy.supplier'), t('common.total'), t('common.paid'), t('common.status')],
      ...listBuys.map((p) => [
        p.number,
        dateBoth(p.date),
        db.suppliers.find((s) => s.id === p.supplierId)?.name,
        p.total,
        p.paid,
        p.status,
      ]),
      [],
      [t('rep.monthCosts')],
      [t('common.date'), t('common.name'), t('common.amount'), t('common.method'), t('common.note')],
      ...listCosts.map((e) => [dateBoth(e.date), e.category, e.amount, e.method, e.note]),
      [],
      [t('rep.monthPay')],
      [t('common.date'), t('pay.direction'), t('pay.party'), t('common.amount'), t('common.method'), t('common.note')],
      ...listPay.map((p) => {
        const list = p.partyType === 'supplier' ? db.suppliers : db.customers
        return [dateBoth(p.date), p.type, list.find((x) => x.id === p.partyId)?.name, p.amount, p.method, p.note]
      }),
    ])
  }

  return (
    <div className="page">
      <PageHeader
        title={t('rep.title')}
        subtitle={tRich('rep.sub', {
          stock: <Money value={stockValue} />,
          cogs: <Money value={cogs} />,
        })}
      />

      <div className="card card-pad" style={{ marginBottom: 14 }}>
        <h3>{t('rep.pickMonth')}</h3>
        <div className="toolbar" style={{ marginTop: 12, marginBottom: 0 }}>
          <label className="field" style={{ margin: 0, minWidth: 320 }}>
            <span>{t('rep.pickMonth')}</span>
            <select value={month} onChange={(e) => setMonth(e.target.value)}>
              {months.map((key) => (
                <option key={key} value={key}>{monthOptionLabel(key, lang)}</option>
              ))}
            </select>
          </label>
          <button className="btn copper" type="button" onClick={() => downloadMonth(month)}>
            {t('rep.downloadMonth')}
          </button>
        </div>
        <p className="muted" style={{ marginTop: 10 }}>{monthLabel}</p>
      </div>

      <div className="stats">
        <StatCard label={t('rep.monthSales')} value={<Money value={salesTotal} />} hint={tRich('rep.paidHint', { n: <Money value={salesPaid} /> })} />
        <StatCard label={t('rep.monthBuys')} value={<Money value={buysTotal} />} />
        <StatCard label={t('rep.monthCosts')} value={<Money value={costsTotal} />} />
        <StatCard label={t('rep.monthProfit')} value={<Money value={profit} />} hint={t('pos.tax') + ' ' + money(tax, symbol)} />
      </div>

      <div className="grid-2" style={{ marginTop: 14 }}>
        <div className="card card-pad">
          <h3>{t('rep.bills')}</h3>
          <DataTable
            rows={sales}
            empty={t('rep.noMonth')}
            columns={[
              { key: 'number', label: t('dash.invoice') },
              { key: 'date', label: t('common.date'), render: (s) => dateBoth(s.date) },
              { key: 'customer', label: t('sales.customer'), render: (s) => db.customers.find((c) => c.id === s.customerId)?.name || '—' },
              { key: 'total', label: t('common.total'), render: (s) => <Money value={s.total} /> },
              { key: 'paid', label: t('common.paid'), render: (s) => <Money value={s.paid} /> },
            ]}
          />
        </div>
        <div className="card card-pad">
          <h3>{t('rep.best')}</h3>
          <DataTable
            rows={top}
            empty={t('rep.noMonth')}
            columns={[
              { key: 'name', label: t('common.product') },
              { key: 'qty', label: t('rep.qtySold') },
              { key: 'sales', label: t('rep.sales'), render: (r) => <Money value={r.sales} /> },
            ]}
          />
        </div>
      </div>

      <div className="grid-2" style={{ marginTop: 14 }}>
        <div className="card card-pad">
          <h3>{t('rep.monthCosts')}</h3>
          <DataTable
            rows={expenses}
            empty={t('rep.noMonth')}
            columns={[
              { key: 'date', label: t('common.date'), render: (e) => dateBoth(e.date) },
              { key: 'category', label: t('common.name') },
              { key: 'amount', label: t('common.amount'), render: (e) => <Money value={e.amount} /> },
            ]}
          />
        </div>
        <div className="card card-pad">
          <h3>{t('rep.monthPay')}</h3>
          <DataTable
            rows={payments}
            empty={t('rep.noMonth')}
            columns={[
              { key: 'date', label: t('common.date'), render: (p) => dateBoth(p.date) },
              { key: 'party', label: t('pay.party'), render: (p) => {
                const list = p.partyType === 'supplier' ? db.suppliers : db.customers
                return list.find((x) => x.id === p.partyId)?.name || '—'
              } },
              { key: 'amount', label: t('common.amount'), render: (p) => <Money value={p.amount} /> },
            ]}
          />
        </div>
      </div>
    </div>
  )
}
