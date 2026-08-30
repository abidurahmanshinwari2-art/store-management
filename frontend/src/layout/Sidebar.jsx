import { NavLink } from 'react-router-dom'
import { useAuth } from '../context/AuthContext.jsx'
import { useStore } from '../context/StoreContext.jsx'
import { useUi } from '../context/UiContext.jsx'
import { Icon } from '../components/Icons.jsx'

const LINKS = [
  { section: 'nav.sell', items: [
    { to: '/', label: 'nav.dashboard', icon: 'home', perm: 'dashboard' },
    { to: '/pos', label: 'nav.pos', icon: 'cart', perm: 'pos' },
    { to: '/sales', label: 'nav.sales', icon: 'file', perm: 'sales' },
  ]},
  { section: 'nav.stock', items: [
    { to: '/products', label: 'nav.products', icon: 'box', perm: 'products' },
    { to: '/categories', label: 'nav.categories', icon: 'tag', perm: 'categories' },
    { to: '/inventory', label: 'nav.inventory', icon: 'box', perm: 'inventory' },
    { to: '/purchases', label: 'nav.purchases', icon: 'truck', perm: 'purchases' },
    { to: '/suppliers', label: 'nav.suppliers', icon: 'truck', perm: 'suppliers' },
  ]},
  { section: 'nav.people', items: [
    { to: '/customers', label: 'nav.customers', icon: 'users', perm: 'customers' },
    { to: '/customer-loans', label: 'nav.customerLoans', icon: 'loan', perm: 'customerLoans' },
    { to: '/payments', label: 'nav.payments', icon: 'coins', perm: 'payments' },
    { to: '/expenses', label: 'nav.expenses', icon: 'coins', perm: 'expenses' },
    { to: '/accounting', label: 'nav.accounting', icon: 'bank', perm: 'accounting' },
    { to: '/reports', label: 'nav.reports', icon: 'chart', perm: 'reports' },
  ]},
  { section: 'nav.system', items: [
    { to: '/users', label: 'nav.users', icon: 'user', perm: 'users' },
    { to: '/settings', label: 'nav.settings', icon: 'settings', perm: 'settings' },
  ]},
]

export function Sidebar({ collapsed }) {
  const { can, user } = useAuth()
  const { db } = useStore()
  const { t } = useUi()
  return (
    <aside className="sidebar">
      <div className="brand">
        <div className="brand-mark">
          <Icon name="home" />
        </div>
        <div>
          <h1>{db.company.name}</h1>
          <small>{t('app.subtitle')}</small>
        </div>
      </div>
      <nav>
        {LINKS.map((group) => {
          const items = group.items.filter((item) => can(item.perm))
          if (!items.length) return null
          return (
            <div key={group.section}>
              <div className="nav-section">{t(group.section)}</div>
              {items.map((item) => (
                <NavLink
                  key={item.to}
                  to={item.to}
                  end={item.to === '/'}
                  className={({ isActive }) => `nav-link${isActive ? ' active' : ''}`}
                >
                  <Icon name={item.icon} />
                  <span>{t(item.label)}</span>
                </NavLink>
              ))}
            </div>
          )
        })}
      </nav>
      <div className="sidebar-foot">
        <div className="user-chip">
          <div className="avatar">{user?.name?.[0] || '?'}</div>
          <div>
            <b>{user?.name}</b>
            <div className="muted" style={{ color: 'var(--sidebar-muted)', fontSize: 12 }}>
              {t(`role.${user?.role}`) || user?.role}
            </div>
          </div>
        </div>
      </div>
    </aside>
  )
}
