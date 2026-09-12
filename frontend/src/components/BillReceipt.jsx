import { Money } from './Ui.jsx'

export function BillReceipt({ company, sale, t, forPrint }) {
  if (!sale) return null
  return (
    <div className={`receipt print-only${forPrint ? ' print-sheet' : ''}`}>
      <h2>{company.name}</h2>
      <p>
        {company.address}
        <br />
        {company.phone}
      </p>
      <p>{sale.number}</p>
      <table>
        <tbody>
          {(sale.items || []).map((l) => (
            <tr key={l.productId}>
              <td>
                {l.name} × {l.qty}
                {l.listPrice != null && l.listPrice !== l.price ? (
                  <span> ({t('pos.deal')} <Money value={l.price} />)</span>
                ) : null}
              </td>
              <td><Money value={l.total ?? (l.qty * l.price - (l.discount || 0))} /></td>
            </tr>
          ))}
        </tbody>
      </table>
      {sale.discount > 0 ? <p>{t('pos.off')}: <Money value={sale.discount} /></p> : null}
      <p>{company.taxName}: <Money value={sale.tax} /></p>
      <p><b>{t('pos.total')} <Money value={sale.total} /></b></p>
      {sale.paid != null ? <p>{t('common.paid')} <Money value={sale.paid} /></p> : null}
      <p>{t('pos.thankYou')}</p>
    </div>
  )
}
