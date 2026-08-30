import { useState } from 'react'
import { Navigate } from 'react-router-dom'
import { useAuth } from '../context/AuthContext.jsx'
import { useStore } from '../context/StoreContext.jsx'
import { useUi } from '../context/UiContext.jsx'
import { Field } from '../components/Ui.jsx'
import { TopTools } from '../components/TopTools.jsx'

const DEMOS = [
  { email: 'owner@store.com', password: 'owner123', label: 'auth.demoOwner' },
  { email: 'manager@store.com', password: 'manager123', label: 'auth.demoManager' },
  { email: 'cashier@store.com', password: 'cashier123', label: 'auth.demoCashier' },
  { email: 'stock@store.com', password: 'stock123', label: 'auth.demoStock' },
]

export function LoginPage() {
  const { user, login } = useAuth()
  const { db } = useStore()
  const { t } = useUi()
  const storeName = db.company.name
  const [email, setEmail] = useState('owner@store.com')
  const [password, setPassword] = useState('owner123')
  const [error, setError] = useState('')

  if (user) return <Navigate to="/" replace />

  const submit = (e) => {
    e.preventDefault()
    const result = login(email, password)
    if (!result.ok) setError(t(result.error))
  }

  return (
    <div className="login-page">
      <TopTools />
      <section className="login-art">
        <div>
          <p className="muted" style={{ color: 'var(--sidebar-muted)', letterSpacing: '0.16em', textTransform: 'uppercase', fontSize: 12 }}>
            {t('auth.welcome')}
          </p>
          <h2>{storeName}</h2>
        </div>
        <p style={{ maxWidth: 440, color: 'var(--sidebar-text)' }}>
          {t('login.tagline')}
        </p>
      </section>
      <section className="login-card">
        <form className="login-box stack" onSubmit={submit}>
          <div>
            <h3>{t('auth.signIn')}</h3>
            <p className="muted">{t('auth.signInTo', { name: storeName })}</p>
          </div>
          <div className="demo-list">
            <p className="muted" style={{ marginBottom: 6 }}>{t('auth.demo')}</p>
            {DEMOS.map((demo) => (
              <button
                key={demo.email}
                type="button"
                onClick={() => {
                  setEmail(demo.email)
                  setPassword(demo.password)
                  setError('')
                }}
              >
                {t(demo.label)} — {demo.email}
              </button>
            ))}
          </div>
          <Field label={t('auth.email')}>
            <input value={email} onChange={(e) => setEmail(e.target.value)} type="email" required />
          </Field>
          <Field label={t('auth.password')}>
            <input value={password} onChange={(e) => setPassword(e.target.value)} type="password" required />
          </Field>
          {error ? <p style={{ color: 'var(--rose)' }}>{error}</p> : null}
          <button className="btn copper" type="submit">{t('auth.enter')}</button>
        </form>
      </section>
    </div>
  )
}
