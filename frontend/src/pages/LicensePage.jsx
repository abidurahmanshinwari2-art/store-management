import { useState } from 'react'
import { Field } from '../components/Ui.jsx'
import { TopTools } from '../components/TopTools.jsx'
import { useUi } from '../context/UiContext.jsx'
import { activateLicense } from '../utils/api.js'

export function LicensePage({ onDone }) {
  const { t } = useUi()
  const [shopName, setShopName] = useState('')
  const [key, setKey] = useState('')
  const [error, setError] = useState('')
  const [busy, setBusy] = useState(false)

  const submit = async (e) => {
    e.preventDefault()
    setBusy(true)
    setError('')
    try {
      const row = await activateLicense(shopName, key)
      onDone(row)
    } catch (err) {
      setError(err.message || t('lic.wrong'))
    } finally {
      setBusy(false)
    }
  }

  return (
    <div className="login-page">
      <TopTools />
      <section className="login-art">
        <div>
          <p className="muted" style={{ color: 'var(--sidebar-muted)', letterSpacing: '0.16em', textTransform: 'uppercase', fontSize: 12 }}>
            {t('lic.welcome')}
          </p>
          <h2>{t('lic.title')}</h2>
        </div>
        <p style={{ maxWidth: 440, color: 'var(--sidebar-text)' }}>
          {t('lic.tagline')}
        </p>
      </section>
      <section className="login-card">
        <form className="login-box stack" onSubmit={submit}>
          <div>
            <h3>{t('lic.unlock')}</h3>
            <p className="muted">{t('lic.hint')}</p>
          </div>
          <Field label={t('lic.shop')}>
            <input value={shopName} onChange={(e) => setShopName(e.target.value)} required />
          </Field>
          <Field label={t('lic.key')}>
            <input
              value={key}
              onChange={(e) => setKey(e.target.value)}
              placeholder="GSMS-XXXX-XXXX-XXXX-XXXX"
              required
            />
          </Field>
          {error ? <p style={{ color: 'var(--rose)' }}>{error}</p> : null}
          <button className="btn copper" type="submit" disabled={busy}>
            {busy ? t('lic.checking') : t('lic.enter')}
          </button>
        </form>
      </section>
    </div>
  )
}
