import { useEffect } from 'react'
import {
  Activity,
  AlertCircle,
  ArrowRight,
  Box,
  Check,
  ChevronRight,
  Cloud,
  GitFork,
  HeartPulse,
  KeyRound,
  LayoutDashboard,
  LoaderCircle,
  LogOut,
  MessageSquare,
  Plus,
  RefreshCw,
  Search,
  Send,
  Server,
  ShieldCheck,
  Users,
  X,
} from 'lucide-react'

export const icons = {
  Activity,
  AlertCircle,
  ArrowRight,
  Box,
  Check,
  ChevronRight,
  Cloud,
  GitFork,
  HeartPulse,
  KeyRound,
  LayoutDashboard,
  LoaderCircle,
  LogOut,
  MessageSquare,
  Plus,
  RefreshCw,
  Search,
  Send,
  Server,
  ShieldCheck,
  Users,
  X,
}

export function Icon({ name, size = 18, ...props }) {
  const Component = icons[name] || Activity
  return <Component size={size} strokeWidth={1.9} aria-hidden="true" {...props} />
}

export function formatValue(value) {
  if (typeof value === 'boolean') {
    return (
      <span className={`status ${value ? 'healthy' : 'disabled'}`}>
        <i />
        {value ? 'Enabled' : 'Disabled'}
      </span>
    )
  }
  if (value === null || value === undefined || value === '') return '—'
  if (typeof value === 'string' && value.includes('T') && !Number.isNaN(Date.parse(value))) {
    return new Date(value).toLocaleString()
  }
  return String(value)
}

export function getId(item) {
  return item?.ID || item?.id
}

export function normalizeList(data) {
  if (Array.isArray(data)) return data
  if (Array.isArray(data?.items)) return data.items
  if (Array.isArray(data?.routes)) return data.routes
  return []
}

export function Panel({ title, action, children }) {
  return (
    <section className="panel">
      <div className="panel-heading">
        <h2>{title}</h2>
        {action}
      </div>
      {children}
    </section>
  )
}

export function LoadingRow({ columns }) {
  return (
    <tr>
      <td colSpan={columns}>
        <div className="loading">
          <LoaderCircle className="spin" size={18} />
          Loading gateway data…
        </div>
      </td>
    </tr>
  )
}

export function EmptyRow({ columns, text }) {
  return (
    <tr>
      <td colSpan={columns}>
        <div className="empty">{text}</div>
      </td>
    </tr>
  )
}

export function Modal({ title, children, onClose }) {
  useEffect(() => {
    const closeOnEscape = (event) => {
      if (event.key === 'Escape') onClose()
    }
    window.addEventListener('keydown', closeOnEscape)
    return () => window.removeEventListener('keydown', closeOnEscape)
  }, [onClose])

  return (
    <div className="modal-backdrop" role="presentation" onMouseDown={onClose}>
      <section
        className="modal"
        role="dialog"
        aria-modal="true"
        aria-label={title}
        onMouseDown={(event) => event.stopPropagation()}
      >
        <div className="modal-heading">
          <h2>{title}</h2>
          <button className="icon-button" onClick={onClose} aria-label="Close dialog">
            <X size={18} />
          </button>
        </div>
        {children}
      </section>
    </div>
  )
}
