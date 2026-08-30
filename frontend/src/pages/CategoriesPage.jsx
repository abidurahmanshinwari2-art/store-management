import { useState } from 'react'
import { PageHeader, DataTable, Modal, Field } from '../components/Ui.jsx'
import { useStore } from '../context/StoreContext.jsx'
import { useUi } from '../context/UiContext.jsx'

export function CategoriesPage({ toast }) {
  const { db, saveCategory, deleteCategory } = useStore()
  const { t } = useUi()
  const [form, setForm] = useState(null)

  return (
    <div className="page">
      <PageHeader
        title={t('cats.title')}
        subtitle={t('cats.sub')}
        actions={<button className="btn copper" type="button" onClick={() => setForm({ name: '' })}>{t('cats.new')}</button>}
      />
      <div className="card card-pad">
        <DataTable
          rows={db.categories.map((c) => ({
            ...c,
            count: db.products.filter((p) => p.categoryId === c.id).length,
          }))}
          columns={[
            { key: 'name', label: t('common.name') },
            { key: 'count', label: t('cats.count') },
            { key: 'actions', label: '', render: (c) => (
              <>
                <button className="btn ghost small" type="button" onClick={() => setForm(c)}>{t('common.edit')}</button>
                <button className="btn ghost small" type="button" onClick={() => {
                  try { deleteCategory(c.id); toast(t('products.deleted')) } catch (err) { toast(err.message, 'bad') }
                }}>{t('common.delete')}</button>
              </>
            ) },
          ]}
        />
      </div>
      {form ? (
        <Modal
          title={form.id ? t('cats.edit') : t('cats.new')}
          onClose={() => setForm(null)}
          footer={
            <>
              <button className="btn ghost" type="button" onClick={() => setForm(null)}>{t('common.cancel')}</button>
              <button className="btn copper" type="button" onClick={() => {
                try { saveCategory(form); setForm(null); toast(t('cats.saved')) } catch (err) { toast(err.message, 'bad') }
              }}>{t('common.save')}</button>
            </>
          }
        >
          <Field label={t('common.name')}><input value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} /></Field>
        </Modal>
      ) : null}
    </div>
  )
}
