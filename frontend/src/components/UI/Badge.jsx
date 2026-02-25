const PRIORITY_ICONS = { urgent: '🔴', high: '🟠', medium: '🟡', low: '⚪' }
const PRIORITY_LABELS = { urgent: 'Urgent', high: 'Haute', medium: 'Moyenne', low: 'Faible' }

const STATUS_LABELS = {
  todo:        'À faire',
  in_progress: 'En cours',
  review:      'En révision',
  done:        'Terminé',
  planning:    'Planification',
  active:      'Actif',
  on_hold:     'En pause',
  completed:   'Complété',
  archived:    'Archivé',
}

export function PriorityBadge({ priority, size = 'sm' }) {
  const sizeClass = size === 'xs' ? 'text-xs px-1.5 py-0.5' : 'text-xs px-2 py-0.5'
  return (
    <span className={`inline-flex items-center gap-1 rounded-full font-body font-medium badge-${priority} ${sizeClass}`}>
      <span>{PRIORITY_ICONS[priority]}</span>
      {PRIORITY_LABELS[priority] || priority}
    </span>
  )
}

export function StatusBadge({ status, size = 'sm' }) {
  const sizeClass = size === 'xs' ? 'text-xs px-1.5 py-0.5' : 'text-xs px-2 py-1'
  return (
    <span className={`inline-flex items-center rounded-full font-body font-medium badge-${status} ${sizeClass}`}>
      {STATUS_LABELS[status] || status}
    </span>
  )
}
