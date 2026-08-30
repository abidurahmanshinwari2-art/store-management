import { useState } from 'react'
import { PageHeader, DataTable, Modal, Field, Money } from '../components/Ui.jsx'
import { useStore } from '../context/StoreContext.jsx'
import { useUi } from '../context/UiContext.jsx'

const empty = { name: '', phone: '', email: '', address: '', creditLimit: 0 }

export function CustomersPage({ toast }) {
  const { db, saveCustomer, deleteCustomer } = useStore()
  const { t } = useUi()
  const [form, setForm] = useState(null)
  return (
    <PartyPage
      t={t}
      title={t('party.customers')}
      subtitle={t('party.customersSub')}
      rows={db.customers}
      form={form}
      setForm={setForm}
      empty={empty}
      extraField
      onSave={() => {
        try { saveCustomer(form); setForm(null); toast(t('cats.saved')) } catch (err) { toast(err.message, 'bad') }
      }}
      onDelete={(id) => {
        try { deleteCustomer(id); toast(t('products.deleted')) } catch (err) { toast(err.message, 'bad') }
      }}
    />
  )
}

export function SuppliersPage({ toast }) {
  const { db, saveSupplier, deleteSupplier } = useStore()
  const { t } = useUi()
  const [form, setForm] = useState(null)
  return (
    <PartyPage
      t={t}
      title={t('party.suppliers')}
      subtitle={t('party.suppliersSub')}
      rows={db.suppliers}
      form={form}
      setForm={setForm}
      empty={empty}
      onSave={() => {
        try { saveSupplier(form); setForm(null); toast(t('cats.saved')) } catch (err) { toast(err.message, 'bad') }
      }}
      onDelete={(id) => {
        try { deleteSupplier(id); toast(t('products.deleted')) } catch (err) { toast(err.message, 'bad') }
      }}
    />
  )
}

function PartyPage({ t, title, subtitle, rows, form, setForm, empty, extraField, onSave, onDelete }) {
  return (
    <div className="page">
      <PageHeader
        title={title}
        subtitle={subtitle}
        actions={<button className="btn copper" type="button" onClick={() => setForm({ ...empty })}>{t('party.new')}</button>}
      />
      <div className="card card-pad">
        <DataTable
          rows={rows}
          columns={[
            { key: 'name', label: t('common.name') },
            { key: 'phone', label: t('common.phone') },
            { key: 'email', label: t('common.email') },
            { key: 'balance', label: t('party.balance'), render: (r) => <Money value={r.balance || 0} /> },
            { key: 'actions', label: '', render: (r) => (
              <>
                <button className="btn ghost small" type="button" onClick={() => setForm(r)}>{t('common.edit')}</button>
                {!r.isWalkIn ? (
                  <button className="btn ghost small" type="button" onClick={() => onDelete(r.id)}>{t('common.delete')}</button>
                ) : null}
              </>
            ) },
          ]}
        />
      </div>
      {form ? (
        <Modal
          title={form.id ? t('party.editOne') : t('party.newOne')}
          onClose={() => setForm(null)}
          footer={
            <>
              <button className="btn ghost" type="button" onClick={() => setForm(null)}>{t('common.cancel')}</button>
              <button className="btn copper" type="button" onClick={onSave}>{t('common.save')}</button>
            </>
          }
        >
          <div className="form-grid">
            <Field label={t('common.name')} full><input value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} /></Field>
            <Field label={t('common.phone')}><input value={form.phone} onChange={(e) => setForm({ ...form, phone: e.target.value })} /></Field>
            <Field label={t('common.email')}><input value={form.email} onChange={(e) => setForm({ ...form, email: e.target.value })} /></Field>
            <Field label={t('common.address')} full><input value={form.address} onChange={(e) => setForm({ ...form, address: e.target.value })} /></Field>
            {extraField ? (
              <Field label={t('party.credit')}><input type="number" value={form.creditLimit || 0} onChange={(e) => setForm({ ...form, creditLimit: e.target.value })} /></Field>
            ) : null}
          </div>
        </Modal>
      ) : null}
    </div>
  )
}
