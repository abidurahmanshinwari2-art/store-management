import { useMemo, useState } from 'react'
import { PageHeader, DataTable, StatCard, Money } from '../components/Ui.jsx'
import { useStore } from '../context/StoreContext.jsx'
import { useUi } from '../context/UiContext.jsx'
import { cogsOf, saleCompromise } from '../lib/calc.js'
import { amountFromBase } from '../lib/units.js'
import { dateBoth, downloadCsv, money, round2, toDateInput } from '../utils/format.js'
import {
  inDateRange,
  monthKeyOf,
  monthOptionLabel,
  reportRange,
} from '../utils/jalali.js'

function collectMonthKeysSafe(db) {
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

function partyName(db, row) {
  const list = row.partyType === 'supplier' ? db.suppliers : db.customers
  return list.find((x) => x.id === row.partyId)?.name || '—'
}

function ReportPrint({ company, title, rangeLabel, stats, sales, buys, expenses, payments, top, db, t }) {
  return (
    <div className="receipt report-print print-only print-sheet">
      <h2>{company.name}</h2>
      <p>{company.address}<br />{company.phone}</p>
      <p><b>{title}</b></p>
      <p>{rangeLabel}</p>
      <table>
        <tbody>
          <tr><td>{t('rep.salesHere')}</td><td><Money value={stats.salesTotal} /></td></tr>
          <tr><td>{t('pos.off')}</td><td><Money value={stats.discounts} /></td></tr>
          <tr><td>{t('rep.buysHere')}</td><td><Money value={stats.buysTotal} /></td></tr>
          <tr><td>{t('rep.expHere')}</td><td><Money value={stats.costsTotal} /></td></tr>
          <tr><td>{t('pos.tax')}</td><td><Money value={stats.tax} /></td></tr>
          <tr><td>{t('rep.profitHere')}</td><td><Money value={stats.profit} /></td></tr>
        </tbody>
      </table>
      <p><b>{t('rep.bills')}</b></p>
      <table>
        <thead>
          <tr>
            <th>{t('dash.invoice')}</th>
            <th>{t('common.date')}</th>
            <th>{t('sales.customer')}</th>
            <th>{t('common.total')}</th>
            <th>{t('common.paid')}</th>
          </tr>
        </thead>
        <tbody>
          {sales.length ? sales.map((s) => (
            <tr key={s.id}>
              <td>{s.number}</td>
              <td>{dateBoth(s.date)}</td>
              <td>{db.customers.find((c) => c.id === s.customerId)?.name || '—'}</td>
              <td><Money value={s.total} /></td>
              <td><Money value={s.paid} /></td>
            </tr>
          )) : <tr><td colSpan={5}>{t('rep.noPeriod')}</td></tr>}
        </tbody>
      </table>
      <p><b>{t('rep.best')}</b></p>
      <table>
        <thead>
          <tr>
            <th>{t('common.product')}</th>
            <th>{t('rep.qtySold')}</th>
            <th>{t('rep.sales')}</th>
          </tr>
        </thead>
        <tbody>
          {top.length ? top.map((r) => (
            <tr key={r.id}>
              <td>{r.name}</td>
              <td>{r.qty}</td>
              <td><Money value={r.sales} /></td>
            </tr>
          )) : <tr><td colSpan={3}>{t('rep.noPeriod')}</td></tr>}
        </tbody>
      </table>
      <p><b>{t('rep.monthBuys')}</b></p>
      <table>
        <thead>
          <tr>
            <th>PO</th>
            <th>{t('common.date')}</th>
            <th>{t('buy.supplier')}</th>
            <th>{t('common.total')}</th>
          </tr>
        </thead>
        <tbody>
          {buys.length ? buys.map((p) => (
            <tr key={p.id}>
              <td>{p.number}</td>
              <td>{dateBoth(p.date)}</td>
              <td>{db.suppliers.find((s) => s.id === p.supplierId)?.name || '—'}</td>
              <td><Money value={p.total} /></td>
            </tr>
          )) : <tr><td colSpan={4}>{t('rep.noPeriod')}</td></tr>}
        </tbody>
      </table>
      <p><b>{t('rep.expHere')}</b></p>
      <table>
        <thead>
          <tr>
            <th>{t('common.date')}</th>
            <th>{t('common.name')}</th>
            <th>{t('common.amount')}</th>
          </tr>
        </thead>
        <tbody>
          {expenses.length ? expenses.map((e) => (
            <tr key={e.id}>
              <td>{dateBoth(e.date)}</td>
              <td>{e.category}</td>
              <td><Money value={e.amount} /></td>
            </tr>
          )) : <tr><td colSpan={3}>{t('rep.noPeriod')}</td></tr>}
        </tbody>
      </table>
      <p><b>{t('rep.monthPay')}</b></p>
      <table>
        <thead>
          <tr>
            <th>{t('common.date')}</th>
            <th>{t('pay.party')}</th>
            <th>{t('common.amount')}</th>
          </tr>
        </thead>
        <tbody>
          {payments.length ? payments.map((p) => (
            <tr key={p.id}>
              <td>{dateBoth(p.date)}</td>
              <td>{partyName(db, p)}</td>
              <td><Money value={p.amount} /></td>
            </tr>
          )) : <tr><td colSpan={3}>{t('rep.noPeriod')}</td></tr>}
        </tbody>
      </table>
    </div>
  )
}

export function ReportsPage() {
  const { db, getStock, symbol } = useStore()
  const { t, tRich, lang } = useUi()
  const months = collectMonthKeysSafe(db)
  const currentMonth = monthKeyOf(new Date())
  const currentYear = String(new Date().getFullYear())
  const today = toDateInput(new Date())
  const [period, setPeriod] = useState('month')
  const [day, setDay] = useState(today)
  const [month, setMonth] = useState(currentMonth)
  const [year, setYear] = useState(currentYear)

  const years = useMemo(() => {
    const set = new Set([Number(currentYear)])
    ;[...db.sales, ...db.purchases, ...db.expenses, ...db.payments].forEach((row) => {
      const dt = new Date(row?.date)
      if (!Number.isNaN(dt.getTime())) set.add(dt.getFullYear())
    })
    return [...set].sort((a, b) => b - a)
  }, [db, currentYear])

  const value = period === 'year' ? year : period === 'month' ? month : day
  const { start, end, fileKey } = reportRange(period, value)
  const inPeriod = (d) => inDateRange(d, start, end)

  const sales = db.sales.filter((s) => s.status === 'completed' && inPeriod(s.date))
  const purchases = db.purchases.filter((p) => inPeriod(p.date))
  const expenses = db.expenses.filter((e) => inPeriod(e.date))
  const payments = db.payments.filter((p) => inPeriod(p.date))

  const salesTotal = round2(sales.reduce((s, r) => s + r.total, 0))
  const salesPaid = round2(sales.reduce((s, r) => s + r.paid, 0))
  const tax = round2(sales.reduce((s, r) => s + r.tax, 0))
  const discounts = round2(sales.reduce((s, r) => s + saleCompromise(r), 0))
  const buysTotal = round2(purchases.reduce((s, r) => s + r.total, 0))
  const costsTotal = round2(expenses.reduce((s, e) => s + e.amount, 0))
  const cogs = round2(sales.reduce((s, r) => s + cogsOf(r.items, db.products), 0))
  const profit = round2(salesTotal - tax - cogs - costsTotal)
  const stockValue = round2(
    db.products.reduce((sum, p) => sum + amountFromBase(getStock(p.id), p.costPrice, p.unit), 0),
  )
  const stats = { salesTotal, discounts, buysTotal, costsTotal, tax, profit }

  const byProduct = {}
  sales.forEach((s) => {
    s.items.forEach((item) => {
      byProduct[item.productId] = byProduct[item.productId] || { id: item.productId, name: item.name, qty: 0, sales: 0 }
      byProduct[item.productId].qty += item.qty
      byProduct[item.productId].sales += item.total
    })
  })
  const top = Object.values(byProduct).sort((a, b) => b.sales - a.sales)

  const periodTitle = t(`rep.${period === 'day' ? 'daily' : period === 'week' ? 'weekly' : period === 'year' ? 'yearly' : 'monthly'}`)
  const rangeLabel = `${dateBoth(start)} – ${dateBoth(end)}`

  const downloadPeriod = () => {
    downloadCsv(`report-${fileKey}.csv`, [
      [t('rep.title'), periodTitle, rangeLabel],
      [],
      [t('rep.salesHere'), salesTotal],
      [t('pos.off'), discounts],
      [t('rep.buysHere'), buysTotal],
      [t('rep.expHere'), costsTotal],
      [t('rep.profitHere'), profit],
      [],
      [t('rep.bills')],
      [t('dash.invoice'), t('common.date'), t('sales.customer'), t('pos.off'), t('pos.subtotal'), t('pos.tax'), t('common.total'), t('common.paid'), t('common.status')],
      ...sales.map((s) => [
        s.number,
        dateBoth(s.date),
        db.customers.find((c) => c.id === s.customerId)?.name,
        saleCompromise(s),
        s.subtotal,
        s.tax,
        s.total,
        s.paid,
        s.status,
      ]),
      [],
      [t('rep.monthBuys')],
      ['PO', t('common.date'), t('buy.supplier'), t('common.total'), t('common.paid'), t('common.status')],
      ...purchases.map((p) => [
        p.number,
        dateBoth(p.date),
        db.suppliers.find((s) => s.id === p.supplierId)?.name,
        p.total,
        p.paid,
        p.status,
      ]),
      [],
      [t('rep.expHere')],
      [t('common.date'), t('common.name'), t('common.amount'), t('common.method'), t('common.note')],
      ...expenses.map((e) => [dateBoth(e.date), e.category, e.amount, e.method, e.note]),
      [],
      [t('rep.monthPay')],
      [t('common.date'), t('pay.direction'), t('pay.party'), t('common.amount'), t('common.method'), t('common.note')],
      ...payments.map((p) => [dateBoth(p.date), p.type, partyName(db, p), p.amount, p.method, p.note]),
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
        <h3>{t('rep.pickPeriod')}</h3>
        <div className="toolbar" style={{ marginTop: 12, marginBottom: 0 }}>
          <label className="field" style={{ margin: 0, minWidth: 160 }}>
            <span>{t('rep.period')}</span>
            <select value={period} onChange={(e) => setPeriod(e.target.value)}>
              <option value="day">{t('rep.daily')}</option>
              <option value="week">{t('rep.weekly')}</option>
              <option value="month">{t('rep.monthly')}</option>
              <option value="year">{t('rep.yearly')}</option>
            </select>
          </label>
          {period === 'day' || period === 'week' ? (
            <label className="field" style={{ margin: 0, minWidth: 200 }}>
              <span>{period === 'week' ? t('rep.pickWeek') : t('rep.pickDay')}</span>
              <input type="date" value={day} onChange={(e) => setDay(e.target.value)} />
            </label>
          ) : null}
          {period === 'month' ? (
            <label className="field" style={{ margin: 0, minWidth: 320 }}>
              <span>{t('rep.pickMonth')}</span>
              <select value={month} onChange={(e) => setMonth(e.target.value)}>
                {months.map((key) => (
                  <option key={key} value={key}>{monthOptionLabel(key, lang)}</option>
                ))}
              </select>
            </label>
          ) : null}
          {period === 'year' ? (
            <label className="field" style={{ margin: 0, minWidth: 160 }}>
              <span>{t('rep.pickYear')}</span>
              <select value={year} onChange={(e) => setYear(e.target.value)}>
                {years.map((y) => (
                  <option key={y} value={String(y)}>{y}</option>
                ))}
              </select>
            </label>
          ) : null}
          <button className="btn copper" type="button" onClick={() => window.print()}>{t('rep.print')}</button>
          <button className="btn ghost" type="button" onClick={downloadPeriod}>{t('rep.downloadPeriod')}</button>
        </div>
        <p className="muted" style={{ marginTop: 10 }}>{periodTitle} · {rangeLabel}</p>
      </div>

      <div className="stats">
        <StatCard label={t('rep.salesHere')} value={<Money value={salesTotal} />} hint={tRich('rep.paidHint', { n: <Money value={salesPaid} /> })} />
        <StatCard label={t('pos.off')} value={<Money value={discounts} />} hint={t('pos.offHint')} />
        <StatCard label={t('rep.buysHere')} value={<Money value={buysTotal} />} />
        <StatCard label={t('rep.expHere')} value={<Money value={costsTotal} />} />
        <StatCard label={t('rep.profitHere')} value={<Money value={profit} />} hint={t('pos.tax') + ' ' + money(tax, symbol)} />
      </div>

      <div className="grid-2" style={{ marginTop: 14 }}>
        <div className="card card-pad">
          <h3>{t('rep.bills')}</h3>
          <DataTable
            rows={sales}
            empty={t('rep.noPeriod')}
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
            empty={t('rep.noPeriod')}
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
          <h3>{t('rep.expHere')}</h3>
          <DataTable
            rows={expenses}
            empty={t('rep.noPeriod')}
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
            empty={t('rep.noPeriod')}
            columns={[
              { key: 'date', label: t('common.date'), render: (p) => dateBoth(p.date) },
              { key: 'party', label: t('pay.party'), render: (p) => partyName(db, p) },
              { key: 'amount', label: t('common.amount'), render: (p) => <Money value={p.amount} /> },
            ]}
          />
        </div>
      </div>

      <ReportPrint
        company={db.company}
        title={`${t('rep.title')} · ${periodTitle}`}
        rangeLabel={rangeLabel}
        stats={stats}
        sales={sales}
        buys={purchases}
        expenses={expenses}
        payments={payments}
        top={top}
        db={db}
        t={t}
      />
    </div>
  )
}
