import { useDeferredValue, useMemo, useState } from 'react'
import { LoaderCircle, RefreshCw, Search, Send, ShieldCheck } from 'lucide-react'
import { api, endpoint } from './api'
import { resources } from './resources'
import { EmptyRow, formatValue, getId, Icon, LoadingRow, Panel } from './ui'

const relationColumns = {
  AccountID: { relation: 'accounts', labelKey: 'Email' },
  ProviderID: { relation: 'providers', labelKey: 'Name' },
  APIKeyID: { relation: 'keys', labelKey: 'Label' },
}

const routeColumns = [
  { header: 'Model', field: 'Model' },
  { header: 'Provider', field: 'ProviderName', fallback: 'ProviderID' },
  { header: 'Account', field: 'AccountEmail', fallback: 'AccountID' },
  { header: 'Key', field: 'KeyLabel', fallback: 'KeyID' },
]

function columnValue(item, key, relationMaps) {
  const relation = relationColumns[key]
  if (!relation) return formatValue(item[key])
  const related = relationMaps[relation.relation]?.get(item[key])
  return related ? `${related[relation.labelKey]} (${item[key]})` : (item[key] ?? '—')
}

export function Dashboard({ lists, health, loading, onNavigate }) {
  const cards = [
    ['Active accounts', lists.accounts?.filter((item) => item.Enabled).length || 0, 'Users', 'accounts'],
    ['Providers', lists.providers?.filter((item) => item.Enabled).length || 0, 'Cloud', 'providers'],
    ['Available models', lists.models?.filter((item) => item.Enabled).length || 0, 'Box', 'models'],
    ['Effective routes', lists.routes?.length || 0, 'GitFork', 'routes'],
  ]

  return (
    <>
      <div className="metrics">
        {cards.map(([label, value, icon, target]) => (
          <button className="metric" key={label} onClick={() => onNavigate(target)}>
            <span className="metric-icon"><Icon name={icon} size={22} /></span>
            <span>
              <small>{label}</small>
              <strong>{loading ? '—' : value}</strong>
              <em>View {label.toLowerCase()}</em>
            </span>
          </button>
        ))}
      </div>
      <div className="dashboard-grid">
        <Panel
          title="Effective routes"
          action={<button className="text-button" onClick={() => onNavigate('routes')}>View all <Icon name="ChevronRight" size={16} /></button>}
        >
          <RouteTable routes={lists.routes || []} loading={loading} compact />
        </Panel>
        <Panel
          title="System health"
          action={<button className="text-button" onClick={() => onNavigate('health')}>Full status <Icon name="ChevronRight" size={16} /></button>}
        >
          <HealthSummary health={health} />
        </Panel>
      </div>
      <Panel title="Quick management">
        <div className="quick-actions">
          {Object.entries(resources).map(([id, resource]) => (
            <button key={id} onClick={() => onNavigate(id)}>
              <span className="quick-icon"><Icon name={resource.icon} /></span>
              <span><strong>{resource.label}</strong><small>{resource.description}</small></span>
              <Icon name="ArrowRight" size={18} />
            </button>
          ))}
        </div>
      </Panel>
    </>
  )
}

export function ResourcePage({ definition, items, loading, relationMaps, onCreate, onEdit, onDisable }) {
  const [query, setQuery] = useState('')
  const deferredQuery = useDeferredValue(query.trim().toLowerCase())
  const filteredItems = useMemo(() => {
    if (!deferredQuery) return items
    return items.filter((item) => Object.values(item).some((value) => String(value ?? '').toLowerCase().includes(deferredQuery)))
  }, [deferredQuery, items])

  return (
    <Panel
      title={definition.label}
      action={<button className="primary" onClick={onCreate}><Icon name="Plus" size={17} />Add {definition.singular}</button>}
    >
      <div className="resource-toolbar">
        <p className="panel-description">{definition.description}</p>
        <label className="search-field">
          <Search size={16} aria-hidden="true" />
          <span className="sr-only">Search {definition.label}</span>
          <input value={query} onChange={(event) => setQuery(event.target.value)} placeholder={`Search ${definition.label.toLowerCase()}`} />
        </label>
      </div>
      <div className="table-wrap">
        <table>
          <thead>
            <tr>
              {definition.columns.map(([label]) => <th key={label}>{label}</th>)}
              <th aria-label="Actions" />
            </tr>
          </thead>
          <tbody>
            {loading ? (
              <LoadingRow columns={definition.columns.length + 1} />
            ) : filteredItems.length ? (
              filteredItems.map((item) => (
                <tr key={getId(item)}>
                  {definition.columns.map(([label, key]) => <td key={label}>{columnValue(item, key, relationMaps)}</td>)}
                  <td className="row-actions">
                    <button onClick={() => onEdit(item)}>Edit</button>
                    {item.Enabled !== false ? <button className="danger-text" onClick={() => onDisable(item)}>Disable</button> : null}
                  </td>
                </tr>
              ))
            ) : (
              <EmptyRow
                columns={definition.columns.length + 1}
                text={deferredQuery ? `No ${definition.label.toLowerCase()} match your search.` : `No ${definition.label.toLowerCase()} configured.`}
              />
            )}
          </tbody>
        </table>
      </div>
    </Panel>
  )
}

export function RoutesPage({ routes, loading }) {
  return (
    <Panel title="Effective routes">
      <p className="panel-description">
        The computed routing order currently available to the inference service.
        Routes are derived from enabled accounts, providers, keys, and models.
      </p>
      <RouteTable routes={routes} loading={loading} />
    </Panel>
  )
}

export function RouteTable({ routes, loading, compact = false }) {
  const visibleRoutes = compact ? routes.slice(0, 5) : routes
  return (
    <div className="table-wrap">
      <table>
        <thead><tr>{routeColumns.map((column) => <th key={column.header}>{column.header}</th>)}</tr></thead>
        <tbody>
          {loading ? (
            <LoadingRow columns={routeColumns.length} />
          ) : visibleRoutes.length ? (
            visibleRoutes.map((route, index) => (
              <tr key={`${route.ID || route.id || 'route'}-${index}`}>
                {routeColumns.map((column) => (
                  <td key={column.header}>{formatValue(route[column.field] || route[column.fallback] || '—')}</td>
                ))}
              </tr>
            ))
          ) : (
            <EmptyRow columns={routeColumns.length} text="No effective routes are currently eligible." />
          )}
        </tbody>
      </table>
    </div>
  )
}

export function HealthSummary({ health }) {
  const values = [['Gateway API', health.health], ['Readiness', health.readiness]]
  return (
    <div className="health-list">
      {values.map(([name, value]) => (
        <div className="health-row" key={name}>
          <span className="health-icon"><ShieldCheck size={19} /></span>
          <span>
            <strong>{name}</strong>
            <small>{value ? 'Gateway responded successfully' : 'Unable to reach endpoint'}</small>
          </span>
          <span className={`status ${value ? 'healthy' : 'disabled'}`}><i />{value ? 'Healthy' : 'Unavailable'}</span>
        </div>
      ))}
    </div>
  )
}

export function HealthPage({ health, onRefresh, refreshing }) {
  return (
    <div className="health-page">
      <Panel
        title="System health"
        action={<button className="primary secondary" onClick={onRefresh} disabled={refreshing}><RefreshCw size={16} className={refreshing ? 'spin' : ''} />Run checks</button>}
      >
        <HealthSummary health={health} />
        <div className="endpoint-list">
          <Endpoint name="Liveness" path="/healthz" value={health.health} />
          <Endpoint name="Readiness" path="/readyz" value={health.readiness} />
        </div>
      </Panel>
    </div>
  )
}

function Endpoint({ name, path, value }) {
  return (
    <div className="endpoint">
      <div><strong>{name}</strong><code>{path}</code></div>
      <pre>{value ? JSON.stringify(value, null, 2) : 'No response'}</pre>
    </div>
  )
}

export function Playground({ onNotice }) {
  const [message, setMessage] = useState('Hello')
  const [response, setResponse] = useState(null)
  const [loading, setLoading] = useState(false)

  const send = async (event) => {
    event.preventDefault()
    setLoading(true)
    try {
      const data = await api(endpoint.inference, {
        method: 'POST',
        body: JSON.stringify({ messages: [{ role: 'user', content: message }] }),
        timeout: 90_000,
      })
      setResponse(data)
      onNotice({ type: 'success', text: 'Inference response received.' })
    } catch (error) {
      onNotice({ type: 'error', text: error.message })
      setResponse({ error: error.message })
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="playground">
      <Panel title="Inference test">
        <p className="panel-description">
          Send a request to <code>POST /v1/inference</code>. The gateway selects the next eligible route automatically.
        </p>
        <form onSubmit={send}>
          <label>
            Message
            <textarea value={message} onChange={(event) => setMessage(event.target.value)} rows="6" required />
          </label>
          <button className="primary" disabled={loading || !message.trim()}>
            {loading ? <LoaderCircle size={17} className="spin" /> : <Send size={17} />}
            Send inference request
          </button>
        </form>
      </Panel>
      <Panel title="Response">
        <pre className="response">{response ? JSON.stringify(response, null, 2) : 'The response will appear here.'}</pre>
      </Panel>
    </div>
  )
}
