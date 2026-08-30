import { useState } from 'react'
import { PageHeader, DataTable, Badge, Modal, Money } from '../components/Ui.jsx'
import { useAuth } from '../context/AuthContext.jsx'
import { useStore } from '../context/StoreContext.jsx'
import { useUi } from '../context/UiContext.jsx'
import { dateFmt } from '../utils/format.js'

export function SalesPage({ toast }) {
  const { db, returnSale } = useStore()
  const { user } = useAuth()
  const { t } = useUi()
  const [view, setView] = useState(null)

  return (
    <div className="page">
      <PageHeader title={t('sales.title')} subtitle={t('sales.sub')} />
      <div className="card card-pad">
        <DataTable
          rows={db.sales}
          columns={[
            { key: 'number', label: t('dash.invoice') },
            { key: 'date', label: t('common.date'), render: (s) => dateFmt(s.date) },
            { key: 'customer', label: t('sales.customer'), render: (s) => db.customers.find((c) => c.id === s.customerId)?.name || '—' },
            { key: 'total', label: t('common.total'), render: (s) => <Money value={s.total} /> },
            { key: 'paid', label: t('common.paid'), render: (s) => <Money value={s.paid} /> },
            { key: 'method', label: t('common.method'), render: (s) => s.paymentMethod },
            { key: 'status', label: t('common.status'), render: (s) => <Badge tone={s.status === 'completed' ? 'ok' : 'warn'}>{t(`status.${s.status}`)}</Badge> },
            { key: 'actions', label: '', render: (s) => (
              <button className="btn ghost small" type="button" onClick={() => setView(s)}>{t('common.view')}</button>
            ) },
          ]}
        />
      </div>
      {view ? (
        <Modal
          title={view.number}
          onClose={() => setView(null)}
          footer={
            <>
              {view.status === 'completed' ? (
                <button className="btn danger" type="button" onClick={() => {
                  try {
                    returnSale(view.id, user.id)
                    setView(null)
                    toast(t('sales.returned'))
                  } catch (err) { toast(err.message, 'bad') }
                }}>{t('sales.return')}</button>
              ) : <span />}
              <button className="btn ghost" type="button" onClick={() => setView(null)}>{t('common.close')}</button>
            </>
          }
        >
          <p className="muted">{dateFmt(view.date)} · {db.customers.find((c) => c.id === view.customerId)?.name}</p>
          <DataTable
            rows={view.items.map((i, n) => ({ ...i, id: n }))}
            columns={[
              { key: 'name', label: t('common.item') },
              { key: 'qty', label: t('common.qty') },
              { key: 'price', label: t('common.price'), render: (i) => <Money value={i.price} /> },
              { key: 'total', label: t('common.line'), render: (i) => <Money value={i.total} /> },
            ]}
          />
          <p style={{ marginTop: 12 }}>
            {t('pos.subtotal')} <Money value={view.subtotal} /> · {t('pos.tax')} <Money value={view.tax} /> · {t('common.total')} <Money value={view.total} />
          </p>
        </Modal>
      ) : null}
    </div>
  )
}
