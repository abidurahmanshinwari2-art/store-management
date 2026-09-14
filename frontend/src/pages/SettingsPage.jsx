import { useEffect, useState } from 'react'
import { PageHeader, Field, DataTable, Modal, Money } from '../components/Ui.jsx'
import { useStore } from '../context/StoreContext.jsx'
import { useUi } from '../context/UiContext.jsx'
import { applyUpdate, fetchServerSettings, fetchUpdate } from '../utils/api.js'
import { FONTS, FONT_SIZE_MAX, FONT_SIZE_MIN } from '../utils/fonts.js'

const THEMES = [
  { id: 'pine', colors: ['#12352c', '#c9a227', '#f3f0e6'] },
  { id: 'ink', colors: ['#d6e4f5', '#e09f1f', '#ffffff'] },
  { id: 'ruby', colors: ['#f8d9d6', '#e06b4f', '#ffffff'] },
  { id: 'teal', colors: ['#d2efe9', '#2a9d8f', '#ffffff'] },
  { id: 'stone', colors: ['#efe4d4', '#d4783a', '#fffdf9'] },
]

export function SettingsPage({ toast }) {
  const { db, updateCompany, saveWarehouse } = useStore()
  const { t, theme, setTheme, font, setFont, textSize, setTextSize } = useUi()
  const [company, setCompany] = useState(db.company)
  const [wh, setWh] = useState(null)
  const [sys, setSys] = useState({ version: '', dataPath: '', githubRepo: '' })
  const [upd, setUpd] = useState(null)
  const [busy, setBusy] = useState(false)

  useEffect(() => {
    fetchServerSettings()
      .then(setSys)
      .catch(() => {})
    fetchUpdate()
      .then(setUpd)
      .catch(() => {})
  }, [])

  const save = () => {
    const rate = Number(company.taxRate)
    if (Number.isNaN(rate) || rate < 0) {
      toast(t('set.taxRate'), 'bad')
      return
    }
    updateCompany({ ...company, taxRate: rate })
    toast(t('set.saved'))
  }

  return (
    <div className="page">
      <PageHeader
        title={t('set.title')}
        subtitle={t('set.sub')}
        actions={<button className="btn copper" type="button" onClick={save}>{t('set.save')}</button>}
      />

      <div className="card card-pad" style={{ marginBottom: 14 }}>
        <h3>{t('set.look')}</h3>
        <p className="muted" style={{ margin: '6px 0 14px' }}>{t('set.lookHint')}</p>
        <div className="theme-grid">
          {THEMES.map((item) => (
            <button
              key={item.id}
              type="button"
              className={`theme-card${theme === item.id ? ' active' : ''}`}
              onClick={() => setTheme(item.id)}
            >
              <div className="theme-swatches">
                {item.colors.map((color) => (
                  <i key={color} style={{ background: color }} />
                ))}
              </div>
              <b>{t(`theme.${item.id}`)}</b>
              <span>{t(`theme.${item.id}Hint`)}</span>
            </button>
          ))}
        </div>
      </div>

      <div className="card card-pad" style={{ marginBottom: 14 }}>
        <h3>{t('set.font')}</h3>
        <p className="muted" style={{ margin: '6px 0 14px' }}>{t('set.fontHint')}</p>
        <div className="theme-grid">
          {FONTS.map((item) => (
            <button
              key={item.id}
              type="button"
              className={`theme-card${font === item.id ? ' active' : ''}`}
              onClick={() => setFont(item.id)}
            >
              <b>{t(`font.${item.id}`)}</b>
              <span>{t(`font.${item.id}Hint`)}</span>
            </button>
          ))}
        </div>
        <div className="size-row" style={{ marginTop: 14 }}>
          <button
            className="btn ghost"
            type="button"
            disabled={textSize <= FONT_SIZE_MIN}
            onClick={() => setTextSize(textSize - 1)}
          >
            −
          </button>
          <input
            type="range"
            min={FONT_SIZE_MIN}
            max={FONT_SIZE_MAX}
            step="1"
            value={textSize}
            onChange={(e) => setTextSize(e.target.value)}
            aria-label={t('set.fontSize')}
          />
          <button
            className="btn ghost"
            type="button"
            disabled={textSize >= FONT_SIZE_MAX}
            onClick={() => setTextSize(textSize + 1)}
          >
            +
          </button>
          <span className="size-value">{t('set.fontPx', { n: textSize })}</span>
        </div>
      </div>

      <div className="grid-2">
        <div className="card card-pad">
          <h3>{t('set.profile')}</h3>
          <div className="form-grid">
            <Field label={t('set.storeName')} full><input value={company.name} onChange={(e) => setCompany({ ...company, name: e.target.value })} /></Field>
            <Field label={t('set.tagline')} full><input value={company.tagline} onChange={(e) => setCompany({ ...company, tagline: e.target.value })} /></Field>
            <Field label={t('common.address')} full><input value={company.address} onChange={(e) => setCompany({ ...company, address: e.target.value })} /></Field>
            <Field label={t('common.phone')}><input value={company.phone} onChange={(e) => setCompany({ ...company, phone: e.target.value })} /></Field>
            <Field label={t('common.email')}><input value={company.email} onChange={(e) => setCompany({ ...company, email: e.target.value })} /></Field>
          </div>
        </div>
        <div className="card card-pad">
          <h3>{t('set.money')}</h3>
          <div className="form-grid">
            <Field label={t('set.curSym')}><input value={company.currencySymbol} onChange={(e) => setCompany({ ...company, currencySymbol: e.target.value })} /></Field>
            <Field label={t('set.curCode')}><input value={company.currencyCode} onChange={(e) => setCompany({ ...company, currencyCode: e.target.value })} /></Field>
            <Field label={t('set.taxName')}><input value={company.taxName} onChange={(e) => setCompany({ ...company, taxName: e.target.value })} /></Field>
            <Field label={t('set.taxRate')}><input type="number" min="0" step="0.01" value={company.taxRate} onChange={(e) => setCompany({ ...company, taxRate: e.target.value })} /></Field>
            <Field label={t('set.invPre')}><input value={company.invoicePrefix} onChange={(e) => setCompany({ ...company, invoicePrefix: e.target.value })} /></Field>
            <Field label={t('set.poPre')}><input value={company.purchasePrefix} onChange={(e) => setCompany({ ...company, purchasePrefix: e.target.value })} /></Field>
          </div>
          <p className="muted" style={{ marginTop: 10 }}>
            <Money value={1234.5} symbol={company.currencySymbol || '$'} /> · {t('set.taxHint')}
          </p>
        </div>
      </div>
      <div className="card card-pad" style={{ marginTop: 14 }}>
        <h3>{t('set.rooms')}</h3>
        <div className="toolbar">
          <button className="btn ghost" type="button" onClick={() => setWh({ name: '', address: '' })}>{t('set.addRoom')}</button>
        </div>
        <DataTable
          rows={db.warehouses}
          columns={[
            { key: 'name', label: t('common.name') },
            { key: 'address', label: t('common.address') },
            { key: 'actions', label: '', render: (w) => <button className="btn ghost small" type="button" onClick={() => setWh(w)}>{t('common.edit')}</button> },
          ]}
        />
      </div>
      <div className="card card-pad" style={{ marginTop: 14 }}>
        <h3>{t('set.system')}</h3>
        <p className="muted">{t('set.systemHint')}</p>
        <div className="form-grid" style={{ marginTop: 12 }}>
          <Field label={t('set.version')}><input value={upd?.latest ? `${sys.version || ''} / ${upd.latest}` : (sys.version || '')} readOnly /></Field>
          <Field label={t('lic.shop')}><input value={sys.shopName || ''} readOnly /></Field>
          <Field label={t('set.dataPlace')} full><input value={sys.dataPath || ''} readOnly /></Field>
        </div>
        <p className="muted" style={{ marginTop: 10 }}>
          {busy ? t('upd.working') : upd?.available ? t('upd.available', { n: upd.latest }) : t('upd.hint')}
        </p>
        <div className="toolbar" style={{ marginTop: 12, marginBottom: 0 }}>
          <button className="btn copper" type="button" disabled={busy} onClick={async () => {
            setBusy(true)
            try {
              const row = await fetchUpdate()
              setUpd(row)
              if (row.note === 'offline' || row.note === 'no-repo') {
                toast(t('upd.offline'), 'bad')
                return
              }
              toast(t('upd.working'))
              const done = await applyUpdate()
              toast(done.ok ? (done.message || t('upd.done')) : (done.message || t('upd.failed')), done.ok ? 'ok' : 'bad')
            } catch {
              toast(t('upd.offline'), 'bad')
            } finally {
              setBusy(false)
            }
          }}>{busy ? t('upd.working') : t('upd.button')}</button>
        </div>
      </div>
      {wh ? (
        <Modal
          title={wh.id ? t('set.editRoom') : t('set.newRoom')}
          onClose={() => setWh(null)}
          footer={
            <>
              <button className="btn ghost" type="button" onClick={() => setWh(null)}>{t('common.cancel')}</button>
              <button className="btn copper" type="button" onClick={() => {
                try { saveWarehouse(wh); setWh(null); toast(t('set.roomSaved')) } catch (err) { toast(err.message, 'bad') }
              }}>{t('common.save')}</button>
            </>
          }
        >
          <div className="form-grid">
            <Field label={t('common.name')}><input value={wh.name} onChange={(e) => setWh({ ...wh, name: e.target.value })} /></Field>
            <Field label={t('common.address')}><input value={wh.address} onChange={(e) => setWh({ ...wh, address: e.target.value })} /></Field>
          </div>
        </Modal>
      ) : null}
    </div>
  )
}
