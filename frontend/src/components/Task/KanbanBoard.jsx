import { useState } from 'react'
import KanbanColumn from './KanbanColumn'
import { KanbanSkeleton } from '../UI/Skeleton'

const STATUSES = ['todo', 'in_progress', 'review', 'done']

export default function KanbanBoard({ columns, loading, onStatusChange, onTaskEdit, onTaskDelete, onAddTask }) {
  if (loading) return <KanbanSkeleton />

  return (
    <div className="flex gap-4 overflow-x-auto pb-4 min-h-[calc(100vh-260px)]">
      {STATUSES.map(status => (
        <KanbanColumn
          key={status}
          status={status}
          tasks={columns[status] || []}
          onDrop={onStatusChange}
          onTaskEdit={onTaskEdit}
          onTaskDelete={onTaskDelete}
          onAddTask={onAddTask}
        />
      ))}
    </div>
  )
}
