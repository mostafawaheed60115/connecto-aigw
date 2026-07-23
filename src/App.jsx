import { useCallback, useEffect, useMemo, useRef, useState } from 'react'
import { AlertCircle, Check, LogOut, RefreshCw, Server, X } from 'lucide-react'
import { api, endpoint, getAccessToken, getApiBase, setAccessToken } from './api'
import Login from './Login'
import { ConfirmModal, ResourceModal } from './modals'
import { Dashboard, HealthPage, Playground, ResourcePage, RoutesPage } from './pages'
import { navItems, resources } from './resources'
import { getId, Icon, normalizeList } from './ui'

const initialLists = {
  accounts: [],
  providers: [],
  keys: [],
  models: [],
  routes: [],
}

const pageTitles = {
  dashboard: 'Gateway operations',
  playground: 'Test API',
  routes: 'Effective routes',
  health: 'System health',
}

function resultData(result) {
  return result.status === 'fulfilled' ? result.value : []
}

function buildRelationMaps(lists) {
  return Object.fromEntries(
    ['accounts', 'providers', 'keys'].map((name) => [
      name,
      new Map((lists[name] || []).map((item) => [getId(item), item])),
    ]),
  )
}

function GatewayApp({ onLogout }) {
  const [page, setPage] = useState('dashboard')
  const [lists, setLists] = useState(initialLists)
  const [health, setHealth] = useState({ health: null, readiness: null })
  const [loading, setLoading] = useState(true)
  const [refreshing, setRefreshing] = useState(false)
  const [notice, setNotice] = useState(null)
  const [modal, setModal] = useState(null)
  const refreshSequence = useRef(0)

  const refresh = useCallback(async () => {
    const sequence = ++refreshSequence.current
    setRefreshing(true)
    const results = await Promise.allSettled([
      api(endpoint.accounts),
      api(endpoint.providers),
      api(endpoint.keys),
      api(endpoint.models),
      api(endpoint.routes),
      api(endpoint.health),
      api(endpoint.readiness),
    ])
    if (sequence !== refreshSequence.current) return

    const [accounts, providers, keys, models, routes, healthResult, readiness] = results
    setLists({
      accounts: normalizeList(resultData(accounts)),
      providers: normalizeList(resultData(providers)),
      keys: normalizeList(resultData(keys)),
      models: normalizeList(resultData(models)),
      routes: normalizeList(resultData(routes)),
    })
    setHealth({
      health: healthResult.status === 'fulfilled' ? healthResult.value : null,
      readiness: readiness.status === 'fulfilled' ? readiness.value : null,
    })

    const failures = results.filter((result) => result.status === 'rejected')
    if (failures.some((result) => result.reason?.status === 401)) {
      onLogout()
      return
    }
    if (failures.length) {
      setNotice({
        type: 'error',
        text: `${failures.length} gateway check${failures.length > 1 ? 's' : ''} failed. Review System health.`,
      })
    }
    setLoading(false)
    setRefreshing(false)
  }, [onLogout])

  useEffect(() => {
    refresh()
  }, [refresh])

  const relationMaps = useMemo(() => buildRelationMaps(lists), [lists])
  const title = pageTitles[page] || resources[page]?.label || 'AI Gateway'

  const navigate = useCallback((target) => {
    setPage(target)
    setModal(null)
  }, [])

  const perform = useCallback(async (work, success) => {
    try {
      await work()
      setNotice({ type: 'success', text: success })
      setModal(null)
      await refresh()
    } catch (error) {
      if (error.status === 401) {
        onLogout()
        return
      }
      setNotice({ type: 'error', text: error.message || 'The gateway could not complete that request.' })
    }
  }, [onLogout, refresh])

  const openResource = useCallback((resource, item = null) => {
    setModal({ type: 'resource', resource, item })
  }, [])

  return (
    <div className="app-shell">
      <aside className="sidebar">
        <div className="brand">
          <div className="brand-mark"><Server size={21} /></div>
          <span>AI Gateway</span>
        </div>
        <nav aria-label="Primary navigation">
          {navItems.map((item) => (
            <button
              key={item.id}
              className={`nav-item ${page === item.id ? 'active' : ''}`}
              onClick={() => navigate(item.id)}
              aria-current={page === item.id ? 'page' : undefined}
              aria-label={item.label}
              title={item.label}
            >
              <Icon name={item.icon} />
              <span>{item.label}</span>
            </button>
          ))}
        </nav>
        <div className="sidebar-footer">
          <div className="admin-avatar">AD</div>
          <div><strong>Admin</strong><small>gateway operator</small></div>
          <button className="logout-button" onClick={onLogout} title="Sign out" aria-label="Sign out">
            <LogOut size={16} />
          </button>
        </div>
      </aside>

      <main>
        <header className="topbar">
          <div>
            <h1>{title}</h1>
            <p>{page === 'dashboard' ? 'Monitor and manage your model gateway.' : getApiBase()}</p>
          </div>
          <div className="top-actions">
            <span className="environment">
              <i className={health.health ? '' : 'offline'} />
              {health.health ? 'Gateway online' : 'Checking gateway'}
            </span>
            <button className="icon-button" title="Refresh gateway data" onClick={refresh} disabled={refreshing}>
              <RefreshCw size={18} className={refreshing ? 'spin' : ''} />
            </button>
          </div>
        </header>

        {notice ? (
          <div className={`notice ${notice.type}`} role="status">
            <span>{notice.type === 'success' ? <Check size={18} /> : <AlertCircle size={18} />}</span>
            {notice.text}
            <button onClick={() => setNotice(null)} aria-label="Dismiss notification"><X size={16} /></button>
          </div>
        ) : null}

        <section className="content">
          {page === 'dashboard' ? <Dashboard lists={lists} health={health} loading={loading} onNavigate={navigate} /> : null}
          {resources[page] ? (
            <ResourcePage
              definition={resources[page]}
              items={lists[page] || []}
              loading={loading}
              relationMaps={relationMaps}
              onCreate={() => openResource(page)}
              onEdit={(item) => openResource(page, item)}
              onDisable={(item) => setModal({ type: 'disable', resource: page, item })}
            />
          ) : null}
          {page === 'routes' ? <RoutesPage routes={lists.routes || []} loading={loading} /> : null}
          {page === 'health' ? <HealthPage health={health} onRefresh={refresh} refreshing={refreshing} /> : null}
          {page === 'playground' ? <Playground onNotice={setNotice} /> : null}
        </section>
      </main>

      {modal?.type === 'resource' ? (
        <ResourceModal
          definition={resources[modal.resource]}
          item={modal.item}
          lists={lists}
          relationMaps={relationMaps}
          onClose={() => setModal(null)}
          onSubmit={(payload) => {
            const entityID = getId(modal.item)
            const path = entityID
              ? `${resources[modal.resource].endpoint}/${entityID}`
              : resources[modal.resource].endpoint
            const method = entityID ? 'PATCH' : 'POST'
            const body = entityID ? { enabled: payload.enabled } : payload
            const singular = resources[modal.resource].singular
            return perform(
              () => api(path, { method, body: JSON.stringify(body) }),
              `${singular[0].toUpperCase() + singular.slice(1)} ${entityID ? 'updated' : 'created'} successfully.`,
            )
          }}
        />
      ) : null}

      {modal?.type === 'disable' ? (
        <ConfirmModal
          resource={resources[modal.resource]}
          item={modal.item}
          onClose={() => setModal(null)}
          onConfirm={() => {
            const singular = resources[modal.resource].singular
            return perform(
              () => api(`${resources[modal.resource].endpoint}/${getId(modal.item)}`, { method: 'DELETE' }),
              `${singular[0].toUpperCase() + singular.slice(1)} disabled.`,
            )
          }}
        />
      ) : null}
    </div>
  )
}

export default function App() {
  const [authenticated, setAuthenticated] = useState(() => Boolean(getAccessToken()))

  const logout = useCallback(() => {
    setAccessToken('')
    setAuthenticated(false)
  }, [])

  if (!authenticated) {
    return <Login onAuthenticated={() => setAuthenticated(true)} />
  }
  return <GatewayApp onLogout={logout} />
}
