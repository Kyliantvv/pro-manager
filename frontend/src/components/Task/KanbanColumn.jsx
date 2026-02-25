import { useState } from 'react'
import TaskCard from './TaskCard'

const COLUMN_CONFIG = {
  todo:        { label: 'À faire',      color: 'bg-slate-400',   ring: 'ring-slate-400/30',   dot: 'bg-slate-400' },
  in_progress: { label: 'En cours',     color: 'bg-blue-500',   ring: 'ring-blue-500/30',    dot: 'bg-blue-500' },
  review:      { label: 'En révision',  color: 'bg-purple-500', ring: 'ring-purple-500/30',  dot: 'bg-purple-500' },
  done:        { label: 'Terminé',      color: 'bg-emerald-500', ring: 'ring-emerald-500/30', dot: 'bg-emerald-500' },
}

export default function KanbanColumn({ status, tasks, onTaskEdit, onTaskDelete, onDrop, onAddTask }) {
  const [isDragOver, setIsDragOver] = useState(false)
  const config = COLUMN_CONFIG[status] || { label: status, color: 'bg-gray-400', ring: '', dot: 'bg-gray-400' }

  const handleDragOver = (e) => {
    e.preventDefault()
    e.dataTransfer.dropEffect = 'move'
    setIsDragOver(true)
  }

  const handleDragLeave = (e) => {
    if (!e.currentTarget.contains(e.relatedTarget)) {
      setIsDragOver(false)
    }
  }

  const handleDrop = (e) => {
    e.preventDefault()
    setIsDragOver(false)
    const taskId = parseInt(e.dataTransfer.getData('taskId'), 10)
    if (taskId) onDrop?.(taskId, status)
  }

  return (
    <div className="flex flex-col min-w-[260px] flex-1 max-w-xs">
      {/* Column header */}
      <div className="flex items-center justify-between mb-3 px-1">
        <div className="flex items-center gap-2">
          <div className={`w-2.5 h-2.5 rounded-full ${config.dot}`} />
          <h3 className="font-display font-semibold text-sm text-[var(--color-text)]">
            {config.label}
          </h3>
          <span className="w-5 h-5 rounded-full bg-[var(--color-border)] flex items-center justify-center text-xs font-body text-[var(--color-muted)]">
            {tasks.length}
          </span>
        </div>
        <button
          onClick={() => onAddTask?.(status)}
          className="w-6 h-6 rounded-full flex items-center justify-center text-[var(--color-muted)] hover:text-indigo-500 hover:bg-indigo-50 dark:hover:bg-indigo-950/30 transition-colors"
          title={`Ajouter une tâche à ${config.label}`}
        >
          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
          </svg>
        </button>
      </div>

      {/* Drop zone */}
      <div
        onDragOver={handleDragOver}
        onDragLeave={handleDragLeave}
        onDrop={handleDrop}
        className={`
          flex-1 min-h-[200px] rounded-2xl p-2 space-y-2
          transition-all duration-200
          ${isDragOver
            ? `ring-2 ${config.ring} bg-indigo-500/5`
            : 'bg-[var(--color-border)]/20 dark:bg-navy-900/30'
          }
        `}
      >
        {tasks.length === 0 ? (
          <div className="flex flex-col items-center justify-center h-24 text-center">
            <p className="text-xs text-[var(--color-muted)]">Déposer des tâches ici</p>
          </div>
        ) : (
          tasks.map(task => (
            <TaskCard
              key={task.id}
              task={task}
              onEdit={onTaskEdit}
              onDelete={onTaskDelete}
            />
          ))
        )}
      </div>
    </div>
  )
}
