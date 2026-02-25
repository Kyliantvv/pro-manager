import { Link } from 'react-router-dom'
import { PriorityBadge, StatusBadge } from '../UI/Badge'

export default function ProjectCard({ project }) {
  const { id, name, description, status, priority, color, dueDate, completion, owner, members, taskStats } = project

  const allMembers = [owner, ...members].slice(0, 4)
  const extraMembers = members.length > 3 ? members.length - 3 : 0

  const isOverdue = dueDate && new Date(dueDate) < new Date() && status !== 'completed' && status !== 'archived'

  return (
    <Link
      to={`/projects/${id}`}
      className="group block surface rounded-2xl p-5 hover:shadow-card-light dark:hover:shadow-card-dark hover:-translate-y-0.5 transition-all duration-200 overflow-hidden relative"
    >
      {/* Color accent bar */}
      <div
        className="absolute top-0 left-0 right-0 h-1 rounded-t-2xl"
        style={{ backgroundColor: color }}
      />

      {/* Header */}
      <div className="flex items-start justify-between gap-3 mt-1 mb-3">
        <div
          className="w-10 h-10 rounded-xl flex items-center justify-center text-white font-display font-bold text-lg flex-shrink-0 shadow-sm"
          style={{ backgroundColor: color }}
        >
          {name.charAt(0).toUpperCase()}
        </div>
        <div className="flex flex-col gap-1 items-end">
          <StatusBadge status={status} size="xs" />
          <PriorityBadge priority={priority} size="xs" />
        </div>
      </div>

      {/* Name & description */}
      <h3 className="font-display font-semibold text-[var(--color-text)] group-hover:text-indigo-500 transition-colors line-clamp-1 mb-1">
        {name}
      </h3>
      <p className="text-xs text-[var(--color-muted)] line-clamp-2 mb-4 leading-relaxed">
        {description || 'Aucune description fournie.'}
      </p>

      {/* Progress bar */}
      <div className="mb-3">
        <div className="flex items-center justify-between mb-1.5">
          <span className="text-xs text-[var(--color-muted)]">Progression</span>
          <span className="text-xs font-medium text-[var(--color-text)]">{completion}%</span>
        </div>
        <div className="h-1.5 rounded-full bg-[var(--color-border)] overflow-hidden">
          <div
            className="h-full rounded-full bg-gradient-to-r from-indigo-500 to-violet-500 transition-all duration-500"
            style={{ width: `${completion}%` }}
          />
        </div>
      </div>

      {/* Task counts */}
      <div className="flex gap-3 mb-4">
        {[
          { label: 'À faire',     count: taskStats.todo,        color: 'bg-slate-400' },
          { label: 'En cours',    count: taskStats.in_progress, color: 'bg-blue-500' },
          { label: 'Révision',    count: taskStats.review,       color: 'bg-purple-500' },
          { label: 'Terminé',     count: taskStats.done,         color: 'bg-emerald-500' },
        ].map(({ label, count, color: dotColor }) => (
          <div key={label} className="flex items-center gap-1">
            <div className={`w-2 h-2 rounded-full ${dotColor}`} />
            <span className="text-xs text-[var(--color-muted)]">{count}</span>
          </div>
        ))}
      </div>

      {/* Footer: avatars + due date */}
      <div className="flex items-center justify-between">
        <div className="flex -space-x-2">
          {allMembers.map((m, i) => (
            <div
              key={m.id}
              className="w-7 h-7 rounded-full ring-2 ring-[var(--color-surface)] bg-gradient-to-br from-indigo-400 to-violet-500 flex items-center justify-center text-white font-display font-bold text-xs"
              title={m.fullName}
            >
              {m.initials}
            </div>
          ))}
          {extraMembers > 0 && (
            <div className="w-7 h-7 rounded-full ring-2 ring-[var(--color-surface)] bg-[var(--color-border)] flex items-center justify-center text-xs font-body text-[var(--color-muted)]">
              +{extraMembers}
            </div>
          )}
        </div>
        {dueDate && (
          <span className={`text-xs font-body ${isOverdue ? 'text-red-500 font-medium' : 'text-[var(--color-muted)]'}`}>
            {isOverdue ? '⚠ ' : ''}{new Date(dueDate).toLocaleDateString('fr-FR', { month: 'short', day: 'numeric' })}
          </span>
        )}
      </div>
    </Link>
  )
}
