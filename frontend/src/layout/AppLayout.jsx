import { Outlet, useLocation } from 'react-router-dom'
import { useAuth } from '../context/AuthContext.jsx'
import { useStore } from '../context/StoreContext.jsx'
import { useUi } from '../context/UiContext.jsx'
import { Icon } from '../components/Icons.jsx'
import { TopTools } from '../components/TopTools.jsx'
import { UpdateBanner } from '../components/UpdateBanner.jsx'
import { Sidebar } from './Sidebar.jsx'

const TITLE_KEYS = {
  '/': 'nav.dashboard',
  '/pos': 'nav.pos',
  '/sales': 'nav.sales',
  '/products': 'nav.products',
  '/categories': 'nav.categories',
  '/inventory': 'nav.inventory',
  '/purchases': 'nav.purchases',
  '/suppliers': 'nav.suppliers',
  '/customers': 'nav.customers',
  '/customer-loans': 'nav.customerLoans',
  '/payments': 'nav.payments',
  '/expenses': 'nav.expenses',
  '/accounting': 'nav.accounting',
  '/reports': 'nav.reports',
  '/users': 'nav.users',
  '/settings': 'nav.settings',
}

export function AppLayout({ collapsed, setCollapsed }) {
  const { db } = useStore()
  const { logout } = useAuth()
  const { t } = useUi()
  const location = useLocation()
  const title = t(TITLE_KEYS[location.pathname] || 'nav.dashboard')

  return (
    <div className={`app-shell${collapsed ? ' collapsed' : ''}`}>
      <Sidebar collapsed={collapsed} />
      <div className="main">
        <UpdateBanner />
        <header className="topbar">
          <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
            <button className="icon-btn" type="button" onClick={() => setCollapsed((v) => !v)} aria-label="Toggle menu">
              <Icon name="menu" />
            </button>
            <div>
              <b>{title}</b>
              <div className="muted" style={{ fontSize: 13 }}>{db.company.name}</div>
            </div>
          </div>
          <div className="topbar-actions">
            <TopTools />
            <span className="badge warn">
              {t('tax.badge', { name: db.company.taxName, rate: Number(db.company.taxRate) || 0 })}
            </span>
            <button className="btn ghost" type="button" onClick={logout}>
              {t('auth.signOut')}
            </button>
          </div>
        </header>
        <Outlet />
      </div>
    </div>
  )
}
