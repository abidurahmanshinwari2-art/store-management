import { createContext, useContext, useEffect, useMemo, useState } from 'react'
import { loadAuth, saveAuth } from '../utils/storage.js'

const AuthContext = createContext(null)

export function AuthProvider({ children, users }) {
  const [user, setUser] = useState(() => loadAuth())

  useEffect(() => {
    if (!user || !users?.length) return
    const found = users.find((u) => u.id === user.id || u.email === user.email)
    if (!found || found.active === false) {
      setUser(null)
      saveAuth(null)
      return
    }
    if (found.name !== user.name || found.role !== user.role || found.email !== user.email) {
      const session = { id: found.id, name: found.name, email: found.email, role: found.role }
      setUser(session)
      saveAuth(session)
    }
  }, [users, user])

  const login = (email, password) => {
    const found = (users || []).find(
      (u) => u.email.toLowerCase() === String(email).trim().toLowerCase() && u.password === password && u.active !== false,
    )
    if (!found) return { ok: false, error: 'auth.wrong' }
    const session = { id: found.id, name: found.name, email: found.email, role: found.role }
    setUser(session)
    saveAuth(session)
    return { ok: true }
  }

  const logout = () => {
    setUser(null)
    saveAuth(null)
  }

  const value = useMemo(
    () => ({
      user,
      login,
      logout,
      can: (action) => canRole(user?.role, action),
    }),
    [user, users],
  )

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>
}

export function useAuth() {
  const ctx = useContext(AuthContext)
  if (!ctx) throw new Error('useAuth must be used inside AuthProvider')
  return ctx
}

const PERMS = {
  owner: '*',
  manager: [
    'dashboard', 'pos', 'sales', 'products', 'categories', 'inventory', 'purchases',
    'suppliers', 'customers', 'customerLoans', 'payments', 'expenses', 'accounting', 'reports', 'settings',
  ],
  cashier: ['dashboard', 'pos', 'sales', 'customers', 'customerLoans', 'payments'],
  storekeeper: ['dashboard', 'products', 'categories', 'inventory', 'purchases', 'suppliers'],
}

export function canRole(role, action) {
  if (!role) return false
  if (action === 'users') return role === 'owner'
  const allowed = PERMS[role]
  if (allowed === '*') return true
  return Array.isArray(allowed) && allowed.includes(action)
}
