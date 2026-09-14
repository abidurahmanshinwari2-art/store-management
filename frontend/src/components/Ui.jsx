import { useEffect } from 'react'
import { useStore } from '../context/StoreContext.jsx'
import { useUi } from '../context/UiContext.jsx'
import { amountNum } from '../utils/format.js'

export function Money({ value, symbol: override }) {
  const { symbol } = useStore()
  return (
    <span className="money">
      {amountNum(value)}
      <span className="money-sym">{override ?? symbol}</span>
    </span>
  )
}

export function PageHeader({ title, subtitle, actions }) {
  return (
    <div className="page-header">
      <div>
        <h2>{title}</h2>
        {subtitle ? <p>{subtitle}</p> : null}
      </div>
      {actions ? <div className="toolbar" style={{ margin: 0 }}>{actions}</div> : null}
    </div>
  )
}

export function StatCard({ label, value, hint, extra }) {
  return (
    <div className="stat-card">
      <span>{label}</span>
      <strong>{value}</strong>
      {hint && extra ? (
        <div className="stat-card-foot">
          <em>{hint}</em>
          <em>{extra}</em>
        </div>
      ) : hint ? (
        <em>{hint}</em>
      ) : extra ? (
        <em className="stat-card-extra">{extra}</em>
      ) : null}
    </div>
  )
}

export function Badge({ tone = 'neutral', children }) {
  return <span className={`badge ${tone}`}>{children}</span>
}

export function EmptyState({ text }) {
  return <div className="empty">{text}</div>
}

export function Field({ label, children, full }) {
  return (
    <label className={`field${full ? ' full' : ''}`}>
      <span>{label}</span>
      {children}
    </label>
  )
}

export function Modal({ title, children, onClose, footer, wide }) {
  useEffect(() => {
    const onKey = (e) => {
      if (e.key === 'Escape') onClose()
    }
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  }, [onClose])

  return (
    <div className="modal-back" onClick={onClose}>
      <div className={`modal${wide ? ' wide' : ''}`} onClick={(e) => e.stopPropagation()}>
        <header>
          <h3>{title}</h3>
          <button className="btn ghost small" onClick={onClose} type="button">
            Close
          </button>
        </header>
        <div className="body">{children}</div>
        {footer ? <footer>{footer}</footer> : null}
      </div>
    </div>
  )
}

export function DataTable({ columns, rows, empty }) {
  const { t } = useUi()
  const emptyText = empty || t('common.empty')
  if (!rows?.length) return <EmptyState text={emptyText} />
  return (
    <div className="table-wrap">
      <table className="data">
        <thead>
          <tr>
            {columns.map((col) => (
              <th key={col.key}>{col.label}</th>
            ))}
          </tr>
        </thead>
        <tbody>
          {rows.map((row) => (
            <tr key={row.id || row.key}>
              {columns.map((col) => (
                <td key={col.key}>{col.render ? col.render(row) : row[col.key]}</td>
              ))}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  )
}
