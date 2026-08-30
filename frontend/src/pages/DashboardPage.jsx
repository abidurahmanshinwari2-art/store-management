import { Link } from 'react-router-dom'
import { PageHeader, StatCard, DataTable, Badge, Money } from '../components/Ui.jsx'
import { useStore } from '../context/StoreContext.jsx'
import { useUi } from '../context/UiContext.jsx'
import { dateFmt, round2 } from '../utils/format.js'
import { cogsOf } from '../lib/calc.js'

function startOfDay(d) {
  const x = new Date(d)
  x.setHours(0, 0, 0, 0)
  return x.getTime()
}

export function DashboardPage() {
  const { db, getStock } = useStore()
  const { t, tRich } = useUi()
  const today = startOfDay(Date.now())
  const completed = db.sales.filter((s) => s.status === 'completed')
  const todaySales = completed.filter((s) => startOfDay(s.date) === today)
  const todayTotal = round2(todaySales.reduce((s, row) => s + row.total, 0))
  const month = new Date().getMonth()
  const monthSales = completed.filter((s) => new Date(s.date).getMonth() === month)
  const monthTotal = round2(monthSales.reduce((s, row) => s + row.total, 0))
  const monthCogs = round2(monthSales.reduce((s, row) => s + cogsOf(row.items, db.products), 0))
  const low = db.products.filter((p) => getStock(p.id) <= p.reorderLevel)
  const receivables = round2(db.customers.reduce((s, c) => s + (c.balance || 0), 0))
  const payables = round2(db.suppliers.reduce((s, c) => s + (c.balance || 0), 0))

  const last7 = [...Array(7)].map((_, i) => {
    const day = new Date()
    day.setDate(day.getDate() - (6 - i))
    const key = startOfDay(day)
    const total = completed
      .filter((s) => startOfDay(s.date) === key)
      .reduce((sum, s) => sum + s.total, 0)
    return { label: day.toLocaleDateString(undefined, { weekday: 'short' }), total }
  })
  const max = Math.max(1, ...last7.map((d) => d.total))

  return (
    <div className="page">
      <PageHeader
        title={t('dash.title')}
        subtitle={t('dash.sub', { name: db.company.name, tax: db.company.taxName, rate: db.company.taxRate })}
        actions={<Link className="btn copper" to="/pos">{t('dash.openPos')}</Link>}
      />
      <div className="stats">
        <StatCard label={t('dash.todaySales')} value={<Money value={todayTotal} />} hint={t('dash.invoices', { n: todaySales.length })} />
        <StatCard label={t('dash.month')} value={<Money value={monthTotal} />} hint={tRich('dash.profit', { n: <Money value={monthTotal - monthCogs} /> })} />
        <StatCard label={t('dash.receivables')} value={<Money value={receivables} />} hint={t('dash.receivablesHint')} />
        <StatCard label={t('dash.lowStock')} value={low.length} hint={t('dash.lowHint')} />
      </div>
      <div className="grid-2">
        <div className="card card-pad">
          <h3>{t('dash.last7')}</h3>
          <div className="chart">
            {last7.map((d) => (
              <div key={d.label} className="bar" style={{ height: `${Math.max(8, (d.total / max) * 100)}%` }}>
                <span>{d.label}</span>
              </div>
            ))}
          </div>
          <p className="muted" style={{ marginTop: 28 }}>{tRich('dash.payables', { n: <Money value={payables} /> })}</p>
        </div>
        <div className="card card-pad">
          <h3>{t('dash.attention')}</h3>
          <DataTable
            empty={t('dash.healthy')}
            columns={[
              { key: 'name', label: t('common.product') },
              { key: 'stock', label: t('common.stock'), render: (p) => <span className="low">{getStock(p.id)}</span> },
              { key: 'reorderLevel', label: t('dash.reorder') },
            ]}
            rows={low.slice(0, 8)}
          />
        </div>
      </div>
      <div className="card card-pad" style={{ marginTop: 14 }}>
        <h3>{t('dash.recent')}</h3>
        <DataTable
          columns={[
            { key: 'number', label: t('dash.invoice') },
            { key: 'date', label: t('common.date'), render: (s) => dateFmt(s.date) },
            { key: 'total', label: t('common.total'), render: (s) => <Money value={s.total} /> },
            { key: 'status', label: t('common.status'), render: (s) => <Badge tone={s.status === 'completed' ? 'ok' : 'warn'}>{t(`status.${s.status}`)}</Badge> },
          ]}
          rows={db.sales.slice(0, 6)}
        />
      </div>
    </div>
  )
}
