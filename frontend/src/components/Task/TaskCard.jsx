import { useState } from 'react'
import { PriorityBadge } from '../UI/Badge'

export default function TaskCard({ task, onEdit, onDelete, onDragStart }) {
  const [isDragging, setIsDragging] = useState(false)

  const handleDragStart = (e) => {
    setIsDragging(true)
    e.dataTransfer.effectAllowed = 'move'
    e.dataTransfer.setData('taskId', String(task.id))
    onDragStart?.(task)
  }

  const handleDragEnd = () => setIsDragging(false)

  const isOverdue = task.isOverdue || (task.dueDate && new Date(task.dueDate) < new Date() && task.status !== 'done')

  return (
    <div
      draggable
      onDragStart={handleDragStart}
      onDragEnd={handleDragEnd}
      className={`
        group surface rounded-xl p-4 cursor-grab active:cursor-grabbing
        hover:shadow-card-light dark:hover:shadow-card-dark
        hover:-translate-y-0.5 transition-all duration-200
        ${isDragging ? 'opacity-50 rotate-1 scale-95' : ''}
      `}
    >
      {/* Header row */}
      <div className="flex items-start gap-2 mb-2">
        <h4 className="flex-1 text-sm font-body font-medium text-[var(--color-text)] line-clamp-2 leading-snug">
          {task.title}
        </h4>
        {/* Actions (visible on hover) */}
        <div className="flex-shrink-0 flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
          <button
            onClick={(e) => { e.stopPropagation(); onEdit?.(task) }}
            className="w-6 h-6 rounded flex items-center justify-center text-[var(--color-muted)] hover:text-indigo-500 hover:bg-indigo-50 dark:hover:bg-indigo-950/30 transition-colors"
          >
            <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
            </svg>
          </button>
          <button
            onClick={(e) => { e.stopPropagation(); onDelete?.(task) }}
            className="w-6 h-6 rounded flex items-center justify-center text-[var(--color-muted)] hover:text-red-500 hover:bg-red-50 dark:hover:bg-red-950/30 transition-colors"
          >
            <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
            </svg>
          </button>
        </div>
      </div>

      {/* Description */}
      {task.description && (
        <p className="text-xs text-[var(--color-muted)] line-clamp-2 mb-3 leading-relaxed">
          {task.description}
        </p>
      )}

      {/* Badges */}
      <div className="flex items-center gap-1.5 flex-wrap mb-3">
        <PriorityBadge priority={task.priority} size="xs" />
        {task.estimatedHours && (
          <span className="text-xs px-1.5 py-0.5 rounded-full bg-slate-100 text-slate-600 dark:bg-slate-700 dark:text-slate-300 font-body">
            {task.estimatedHours}h
          </span>
        )}
      </div>

      {/* Footer: assignee + due date */}
      <div className="flex items-center justify-between">
        {task.assignee ? (
          <div className="flex items-center gap-1.5">
            <div className="w-5 h-5 rounded-full bg-gradient-to-br from-indigo-400 to-violet-500 flex items-center justify-center text-white font-bold text-xs">
              {task.assignee.initials}
            </div>
            <span className="text-xs text-[var(--color-muted)]">{task.assignee.fullName.split(' ')[0]}</span>
          </div>
        ) : (
          <div className="w-5 h-5 rounded-full border-2 border-dashed border-[var(--color-border)]" />
        )}

        {task.dueDate && (
          <span className={`text-xs font-body ${isOverdue ? 'text-red-500 font-medium' : 'text-[var(--color-muted)]'}`}>
            {isOverdue && '⚠ '}
            {new Date(task.dueDate).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}
          </span>
        )}
      </div>
    </div>
  )
}
