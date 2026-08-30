import { useState } from 'react'
import { PageHeader, DataTable, Badge, Modal, Field } from '../components/Ui.jsx'
import { useAuth } from '../context/AuthContext.jsx'
import { useStore } from '../context/StoreContext.jsx'
import { useUi } from '../context/UiContext.jsx'

export function UsersPage({ toast }) {
  const { db, saveUser, deleteUser } = useStore()
  const { user } = useAuth()
  const { t } = useUi()
  const [form, setForm] = useState(null)

  return (
    <div className="page">
      <PageHeader
        title={t('users.title')}
        subtitle={t('users.sub')}
        actions={<button className="btn copper" type="button" onClick={() => setForm({ name: '', email: '', password: '', role: 'cashier', active: true })}>{t('users.new')}</button>}
      />
      <div className="card card-pad">
        <DataTable
          rows={db.users}
          columns={[
            { key: 'name', label: t('common.name') },
            { key: 'email', label: t('common.email') },
            { key: 'role', label: t('users.role'), render: (u) => t(`role.${u.role}`) },
            { key: 'active', label: t('common.status'), render: (u) => <Badge tone={u.active !== false ? 'ok' : 'bad'}>{u.active !== false ? t('status.active') : t('status.off')}</Badge> },
            { key: 'actions', label: '', render: (u) => (
              <>
                <button className="btn ghost small" type="button" onClick={() => setForm(u)}>{t('common.edit')}</button>
                {u.id !== user.id ? (
                  <button className="btn ghost small" type="button" onClick={() => {
                    try { deleteUser(u.id); toast(t('products.deleted')) } catch (err) { toast(err.message, 'bad') }
                  }}>{t('common.delete')}</button>
                ) : null}
              </>
            ) },
          ]}
        />
      </div>
      {form ? (
        <Modal
          title={form.id ? t('users.edit') : t('users.new')}
          onClose={() => setForm(null)}
          footer={
            <>
              <button className="btn ghost" type="button" onClick={() => setForm(null)}>{t('common.cancel')}</button>
              <button className="btn copper" type="button" onClick={() => {
                try { saveUser(form); setForm(null); toast(t('cats.saved')) } catch (err) { toast(err.message, 'bad') }
              }}>{t('common.save')}</button>
            </>
          }
        >
          <div className="form-grid">
            <Field label={t('common.name')}><input value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} /></Field>
            <Field label={t('common.email')}><input value={form.email} onChange={(e) => setForm({ ...form, email: e.target.value })} /></Field>
            <Field label={t('users.password')}><input value={form.password} onChange={(e) => setForm({ ...form, password: e.target.value })} /></Field>
            <Field label={t('users.role')}>
              <select value={form.role} onChange={(e) => setForm({ ...form, role: e.target.value })}>
                <option value="owner">{t('role.owner')}</option>
                <option value="manager">{t('role.manager')}</option>
                <option value="cashier">{t('role.cashier')}</option>
                <option value="storekeeper">{t('role.storekeeper')}</option>
              </select>
            </Field>
            <label className="check">
              <input type="checkbox" checked={form.active !== false} onChange={(e) => setForm({ ...form, active: e.target.checked })} />
              {t('status.active')}
            </label>
          </div>
        </Modal>
      ) : null}
    </div>
  )
}
