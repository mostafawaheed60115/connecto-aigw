import { useMemo, useState } from 'react'
import { getId, Modal } from './ui'

function relationLabel(relation, item, relationMaps) {
  if (relation === 'accounts') return item.Email
  if (relation === 'providers') {
    const account = relationMaps.accounts?.get(item.AccountID)
    return `${item.Name} · ${account?.Email || 'Unknown account'}`
  }
  if (relation === 'keys') {
    const provider = relationMaps.providers?.get(item.ProviderID)
    const account = relationMaps.accounts?.get(provider?.AccountID)
    return `${provider?.Name || 'Provider'} · ${item.Label || 'API key'} · ${account?.Email || 'Unknown account'}`
  }
  return getId(item)
}

function ResourceField({ field, value, onChange, lists, relationMaps }) {
  const relatedItems = useMemo(() => {
    if (!field.relation) return []
    return [...(lists[field.relation] || [])].sort((left, right) => (
      relationLabel(field.relation, left, relationMaps).localeCompare(relationLabel(field.relation, right, relationMaps))
    ))
  }, [field.relation, lists, relationMaps])

  if (field.relation) {
    return (
      <label>
        {field.label}
        <select
          value={value}
          required={field.required}
          onChange={(event) => onChange(event.target.value)}
          disabled={!relatedItems.length}
        >
          <option value="">{relatedItems.length ? `Choose ${field.label.toLowerCase()}` : `No ${field.relation} available`}</option>
          {relatedItems.map((relatedItem) => (
            <option key={getId(relatedItem)} value={getId(relatedItem)}>
              {relationLabel(field.relation, relatedItem, relationMaps)}
            </option>
          ))}
        </select>
        <span className="field-help">Select from your existing {field.relation}.</span>
      </label>
    )
  }

  return (
    <label>
      {field.label}
      <input
        type={field.type || 'text'}
        value={value}
        placeholder={field.placeholder}
        required={field.required}
        autoComplete={field.type === 'password' ? 'new-password' : undefined}
        onChange={(event) => onChange(event.target.value)}
      />
    </label>
  )
}

export function ResourceModal({ definition, item, lists, relationMaps, onClose, onSubmit }) {
  const [submitting, setSubmitting] = useState(false)
  const [values, setValues] = useState(() => Object.fromEntries(
    definition.fields.map((field) => [
      field.name,
      item
        ? (field.name === 'enabled' ? item.Enabled : '')
        : (field.initial ?? (field.type === 'checkbox' ? false : '')),
    ]),
  ))
  const editing = Boolean(item)
  const updateNotice = 'Availability can be changed after creation. To change another field, create a replacement and disable the original.'

  const submit = async (event) => {
    event.preventDefault()
    if (submitting) return
    setSubmitting(true)
    try {
      await onSubmit(values)
    } finally {
      setSubmitting(false)
    }
  }

  return (
    <Modal title={`${editing ? 'Edit' : 'Add'} ${definition.singular}`} onClose={onClose}>
      <form onSubmit={submit}>
        <p className="modal-description">{editing ? updateNotice : definition.description}</p>
        {editing ? (
          <label className="check-field">
            <input
              type="checkbox"
              checked={values.enabled}
              onChange={(event) => setValues({ enabled: event.target.checked })}
            />
            Enabled
          </label>
        ) : (
          definition.fields.map((field) => (
            field.type === 'checkbox' ? (
              <label className="check-field" key={field.name}>
                <input
                  type="checkbox"
                  checked={values[field.name]}
                  onChange={(event) => setValues((current) => ({ ...current, [field.name]: event.target.checked }))}
                />
                {field.label}
              </label>
            ) : (
              <ResourceField
                key={field.name}
                field={field}
                value={values[field.name]}
                lists={lists}
                relationMaps={relationMaps}
                onChange={(value) => setValues((current) => ({ ...current, [field.name]: value }))}
              />
            )
          ))
        )}
        <div className="modal-actions">
          <button type="button" className="secondary-button" onClick={onClose} disabled={submitting}>Cancel</button>
          <button className="primary" type="submit" disabled={submitting}>
            {submitting ? 'Saving…' : (editing ? 'Save availability' : `Create ${definition.singular}`)}
          </button>
        </div>
      </form>
    </Modal>
  )
}

export function ConfirmModal({ resource, item, onClose, onConfirm }) {
  const [submitting, setSubmitting] = useState(false)
  const name = item.Email || item.Name || item.Label || item.LogicalName
  const label = name ? `${name} (${getId(item)})` : String(getId(item))

  const confirm = async () => {
    if (submitting) return
    setSubmitting(true)
    try {
      await onConfirm()
    } finally {
      setSubmitting(false)
    }
  }

  return (
    <Modal title={`Disable ${resource.singular}`} onClose={onClose}>
      <p className="modal-description">
        Disable <strong>{label}</strong>? It will no longer participate in effective routes.
        You can re-enable it later through Edit.
      </p>
      <div className="modal-actions">
        <button className="secondary-button" onClick={onClose} disabled={submitting}>Cancel</button>
        <button className="primary danger" onClick={confirm} disabled={submitting}>
          {submitting ? 'Disabling…' : `Disable ${resource.singular}`}
        </button>
      </div>
    </Modal>
  )
}
