import { PageHeader, StatCard, DataTable, Money } from '../components/Ui.jsx'
import { useStore } from '../context/StoreContext.jsx'
import { useUi } from '../context/UiContext.jsx'
import { round2 } from '../utils/format.js'
import { cogsOf, saleCompromise } from '../lib/calc.js'

export function AccountingPage() {
  const { db } = useStore()
  const { t, tRich } = useUi()
  const sales = db.sales.filter((s) => s.status === 'completed')
  const revenue = round2(sales.reduce((s, r) => s + r.subtotal, 0))
  const discounts = round2(sales.reduce((s, r) => s + saleCompromise(r), 0))
  const taxCollected = round2(sales.reduce((s, r) => s + r.tax, 0))
  const cogs = round2(sales.reduce((s, r) => s + cogsOf(r.items, db.products), 0))
  const expenses = round2(db.expenses.reduce((s, e) => e.amount + s, 0))
  const gross = round2(revenue - cogs)
  const net = round2(gross - expenses)
  const ar = round2(db.customers.reduce((s, c) => s + (c.balance || 0), 0))
  const ap = round2(db.suppliers.reduce((s, c) => s + (c.balance || 0), 0))
  const cashIn = round2(
    sales.reduce((s, r) => s + r.paid, 0) + db.payments.filter((p) => p.type === 'in').reduce((s, p) => s + p.amount, 0),
  )
  const cashOut = round2(
    db.purchases.reduce((s, p) => s + p.paid, 0) +
    db.payments.filter((p) => p.type === 'out').reduce((s, p) => s + p.amount, 0) +
    expenses,
  )

  return (
    <div className="page">
      <PageHeader
        title={t('acc.title')}
        subtitle={t('acc.sub')}
      />
      <div className="stats">
        <StatCard label={t('acc.salesEx')} value={<Money value={revenue} />} />
        <StatCard label={t('pos.off')} value={<Money value={discounts} />} hint={t('pos.offHint')} />
        <StatCard label={t('acc.tax', { name: db.company.taxName })} value={<Money value={taxCollected} />} />
        <StatCard label={t('acc.gross')} value={<Money value={gross} />} hint={t('acc.grossHint')} />
        <StatCard label={t('acc.net')} value={<Money value={net} />} />
      </div>
      <div className="split-3">
        <div className="card card-pad">
          <h3>{t('acc.cash')}</h3>
          <p>{tRich('acc.in', { n: <Money value={cashIn} /> })}</p>
          <p>{tRich('acc.out', { n: <Money value={cashOut} /> })}</p>
          <p><b>{tRich('acc.netCash', { n: <Money value={cashIn - cashOut} /> })}</b></p>
        </div>
        <div className="card card-pad">
          <h3>{t('acc.ar')}</h3>
          <DataTable
            rows={db.customers.filter((c) => c.balance > 0)}
            empty={t('acc.noAr')}
            columns={[
              { key: 'name', label: t('sales.customer') },
              { key: 'balance', label: t('acc.due'), render: (c) => <Money value={c.balance} /> },
            ]}
          />
          <p className="muted" style={{ marginTop: 8 }}>{t('common.total')} <Money value={ar} /></p>
        </div>
        <div className="card card-pad">
          <h3>{t('acc.ap')}</h3>
          <DataTable
            rows={db.suppliers.filter((s) => s.balance > 0)}
            empty={t('acc.noAp')}
            columns={[
              { key: 'name', label: t('buy.supplier') },
              { key: 'balance', label: t('acc.due'), render: (s) => <Money value={s.balance} /> },
            ]}
          />
          <p className="muted" style={{ marginTop: 8 }}>{t('common.total')} <Money value={ap} /></p>
        </div>
      </div>
      <div className="card card-pad" style={{ marginTop: 14 }}>
        <h3>{t('acc.pl')}</h3>
        <table className="data">
          <tbody>
            <tr><td>{t('acc.salesEx')}</td><td><Money value={revenue} /></td></tr>
            <tr><td>{t('pos.off')}</td><td><Money value={discounts} /></td></tr>
            <tr><td>{t('acc.cogs')}</td><td><Money value={cogs} /></td></tr>
            <tr><td>{t('acc.gross')}</td><td><Money value={gross} /></td></tr>
            <tr><td>{t('acc.opex')}</td><td><Money value={expenses} /></td></tr>
            <tr><td><b>{t('acc.net')}</b></td><td><b><Money value={net} /></b></td></tr>
          </tbody>
        </table>
      </div>
    </div>
  )
}
