import { useState } from 'react'
import { BrowserRouter, Navigate, Route, Routes } from 'react-router-dom'
import { AuthProvider, useAuth } from './context/AuthContext.jsx'
import { StoreProvider, useStore } from './context/StoreContext.jsx'
import { UiProvider, useUi } from './context/UiContext.jsx'
import { AppLayout } from './layout/AppLayout.jsx'
import { AccountingPage } from './pages/AccountingPage.jsx'
import { CategoriesPage } from './pages/CategoriesPage.jsx'
import { CustomerLoansPage } from './pages/CustomerLoansPage.jsx'
import { CustomersPage, SuppliersPage } from './pages/PartiesPage.jsx'
import { DashboardPage } from './pages/DashboardPage.jsx'
import { ExpensesPage } from './pages/ExpensesPage.jsx'
import { InventoryPage } from './pages/InventoryPage.jsx'
import { LoginPage } from './pages/LoginPage.jsx'
import { PaymentsPage } from './pages/PaymentsPage.jsx'
import { POSPage } from './pages/POSPage.jsx'
import { ProductsPage } from './pages/ProductsPage.jsx'
import { PurchasesPage } from './pages/PurchasesPage.jsx'
import { ReportsPage } from './pages/ReportsPage.jsx'
import { SalesPage } from './pages/SalesPage.jsx'
import { SettingsPage } from './pages/SettingsPage.jsx'
import { UsersPage } from './pages/UsersPage.jsx'
import { uid } from './utils/id.js'

function Boot({ children }) {
  const { ready } = useStore()
  const { t } = useUi()
  if (!ready) return <div className="empty">{t('app.opening')}</div>
  return children
}

function AuthBridge({ children }) {
  const { db } = useStore()
  return <AuthProvider users={db.users}>{children}</AuthProvider>
}

function Guard({ children, perm }) {
  const { user, can } = useAuth()
  if (!user) return <Navigate to="/login" replace />
  if (perm && !can(perm)) return <Navigate to="/" replace />
  return children
}

function Shell() {
  const { collapsed, setCollapsed } = useUi()
  return (
    <Guard perm="dashboard">
      <AppLayout collapsed={collapsed} setCollapsed={setCollapsed} />
    </Guard>
  )
}

export default function App() {
  const [toasts, setToasts] = useState([])
  const toast = (message, type = 'ok') => {
    const id = uid('t-')
    setToasts((list) => [...list, { id, message, type }])
    setTimeout(() => setToasts((list) => list.filter((t) => t.id !== id)), 5000)
  }

  return (
    <UiProvider>
    <StoreProvider>
      <Boot>
      <AuthBridge>
        <BrowserRouter>
          <Routes>
            <Route path="/login" element={<LoginPage />} />
            <Route path="/" element={<Shell />}>
              <Route index element={<DashboardPage />} />
              <Route path="pos" element={<Guard perm="pos"><POSPage toast={toast} /></Guard>} />
              <Route path="sales" element={<Guard perm="sales"><SalesPage toast={toast} /></Guard>} />
              <Route path="products" element={<Guard perm="products"><ProductsPage toast={toast} /></Guard>} />
              <Route path="categories" element={<Guard perm="categories"><CategoriesPage toast={toast} /></Guard>} />
              <Route path="inventory" element={<Guard perm="inventory"><InventoryPage toast={toast} /></Guard>} />
              <Route path="purchases" element={<Guard perm="purchases"><PurchasesPage toast={toast} /></Guard>} />
              <Route path="suppliers" element={<Guard perm="suppliers"><SuppliersPage toast={toast} /></Guard>} />
              <Route path="customers" element={<Guard perm="customers"><CustomersPage toast={toast} /></Guard>} />
              <Route path="customer-loans" element={<Guard perm="customerLoans"><CustomerLoansPage toast={toast} /></Guard>} />
              <Route path="payments" element={<Guard perm="payments"><PaymentsPage toast={toast} /></Guard>} />
              <Route path="expenses" element={<Guard perm="expenses"><ExpensesPage toast={toast} /></Guard>} />
              <Route path="accounting" element={<Guard perm="accounting"><AccountingPage /></Guard>} />
              <Route path="reports" element={<Guard perm="reports"><ReportsPage /></Guard>} />
              <Route path="users" element={<Guard perm="users"><UsersPage toast={toast} /></Guard>} />
              <Route path="settings" element={<Guard perm="settings"><SettingsPage toast={toast} /></Guard>} />
            </Route>
            <Route path="*" element={<Navigate to="/" replace />} />
          </Routes>
        </BrowserRouter>
        <div className="toasts">
          {toasts.map((t) => (
            <div key={t.id} className={`toast ${t.type === 'bad' ? 'bad' : ''}`}>{t.message}</div>
          ))}
        </div>
      </AuthBridge>
      </Boot>
    </StoreProvider>
    </UiProvider>
  )
}
