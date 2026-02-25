import { useCallback, useEffect, useState } from 'react'
import { useNavigate, useParams } from 'react-router-dom'
import { projectsApi, tasksApi, usersApi } from '../services/api'
import { useAuth } from '../contexts/AuthContext'
import KanbanBoard from '../components/Task/KanbanBoard'
import TaskForm from '../components/Task/TaskForm'
import ProjectForm from '../components/Project/ProjectForm'
import Modal from '../components/UI/Modal'
import Button from '../components/UI/Button'
import { PriorityBadge, StatusBadge } from '../components/UI/Badge'
import { Skeleton } from '../components/UI/Skeleton'

export default function ProjectPage() {
  const { id } = useParams()
  const { user } = useAuth()
  const navigate = useNavigate()

  const [project, setProject]     = useState(null)
  const [columns, setColumns]     = useState({})
  const [loading, setLoading]     = useState(true)
  const [tasksLoading, setTasksLoading] = useState(true)

  // Modals
  const [taskModal, setTaskModal]     = useState({ open: false, task: null, defaultStatus: 'todo' })
  const [editModal, setEditModal]     = useState(false)
  const [memberModal, setMemberModal] = useState(false)
  const [deleteConfirm, setDeleteConfirm] = useState(false)

  const [saving, setSaving]       = useState(false)
  const [error, setError]         = useState('')
  const [memberEmail, setMemberEmail] = useState('')
  const [memberError, setMemberError] = useState('')
  const [memberLoading, setMemberLoading] = useState(false)

  const isOwner = project?.owner?.id === user?.id
  const allMembers = project ? [project.owner, ...project.members] : []

  // Fetch project
  const fetchProject = useCallback(async () => {
    try {
      const { data } = await projectsApi.get(id)
      setProject(data)
    } catch (err) {
      if (err.response?.status === 404 || err.response?.status === 403) navigate('/dashboard')
    } finally {
      setLoading(false)
    }
  }, [id, navigate])

  // Fetch kanban
  const fetchKanban = useCallback(async () => {
    setTasksLoading(true)
    try {
      const { data } = await tasksApi.kanban(id)
      setColumns(data)
    } catch {
      setError('Impossible de charger les tâches.')
    } finally {
      setTasksLoading(false)
    }
  }, [id])

  useEffect(() => {
    fetchProject()
    fetchKanban()
  }, [fetchProject, fetchKanban])

  // Drag-and-drop: move task to new status
  const handleStatusChange = async (taskId, newStatus) => {
    // Optimistic update
    setColumns(prev => {
      const newCols = { ...prev }
      let movedTask = null
      for (const status of Object.keys(newCols)) {
        const idx = newCols[status].findIndex(t => t.id === taskId)
        if (idx !== -1) {
          movedTask = { ...newCols[status][idx] }
          newCols[status] = newCols[status].filter(t => t.id !== taskId)
          break
        }
      }
      if (movedTask) {
        movedTask.status = newStatus
        newCols[newStatus] = [...(newCols[newStatus] || []), movedTask]
      }
      return newCols
    })
    try {
      await tasksApi.updateStatus(taskId, newStatus)
    } catch {
      fetchKanban() // revert on failure
    }
  }

  // Create / update task
  const handleTaskSave = async (formData) => {
    setSaving(true)
    try {
      if (taskModal.task) {
        await tasksApi.update(taskModal.task.id, formData)
      } else {
        await tasksApi.create(id, { ...formData, status: taskModal.defaultStatus })
      }
      setTaskModal({ open: false, task: null, defaultStatus: 'todo' })
      fetchKanban()
    } catch (err) {
      console.error(err)
    } finally {
      setSaving(false)
    }
  }

  // Delete task
  const handleTaskDelete = async (task) => {
    if (!window.confirm(`Supprimer la tâche "${task.title}" ?`)) return
    try {
      await tasksApi.remove(task.id)
      fetchKanban()
    } catch (err) {
      console.error(err)
    }
  }

  // Update project
  const handleProjectUpdate = async (formData) => {
    setSaving(true)
    try {
      const { data } = await projectsApi.update(id, formData)
      setProject(data)
      setEditModal(false)
    } catch (err) {
      console.error(err)
    } finally {
      setSaving(false)
    }
  }

  // Delete project
  const handleProjectDelete = async () => {
    setSaving(true)
    try {
      await projectsApi.remove(id)
      navigate('/dashboard')
    } catch (err) {
      console.error(err)
      setSaving(false)
    }
  }

  // Add member
  const handleAddMember = async () => {
    if (!memberEmail.trim()) { setMemberError('Saisissez un email.'); return }
    setMemberLoading(true)
    setMemberError('')
    try {
      const { data } = await projectsApi.addMember(id, memberEmail.trim())
      setProject(data.project)
      setMemberEmail('')
    } catch (err) {
      setMemberError(err.response?.data?.message || "Impossible d'ajouter le membre.")
    } finally {
      setMemberLoading(false)
    }
  }

  // Remove member
  const handleRemoveMember = async (memberId) => {
    try {
      await projectsApi.removeMember(id, memberId)
      fetchProject()
    } catch (err) {
      console.error(err)
    }
  }

  if (loading) {
    return (
      <div className="max-w-7xl mx-auto space-y-6">
        <div className="flex items-center gap-4">
          <Skeleton className="w-12 h-12 rounded-2xl" />
          <div className="flex-1 space-y-2">
            <Skeleton className="h-6 w-64" />
            <Skeleton className="h-4 w-40" />
          </div>
        </div>
        <Skeleton className="h-16 w-full rounded-2xl" />
      </div>
    )
  }

  if (!project) return null

  const totalTasks = project.taskStats.total
  const doneTasks  = project.taskStats.done

  return (
    <div className="max-w-7xl mx-auto space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-4 animate-slide-up">
        <div className="flex items-start gap-4">
          {/* Back */}
          <button
            onClick={() => navigate('/dashboard')}
            className="mt-1 w-8 h-8 rounded-lg flex items-center justify-center text-[var(--color-muted)] hover:text-[var(--color-text)] hover:bg-[var(--color-border)]/50 transition-colors flex-shrink-0"
          >
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
            </svg>
          </button>

          <div
            className="w-12 h-12 rounded-2xl flex items-center justify-center text-white font-display font-bold text-xl flex-shrink-0 shadow-glow"
            style={{ backgroundColor: project.color }}
          >
            {project.name.charAt(0).toUpperCase()}
          </div>

          <div>
            <div className="flex items-center gap-2 flex-wrap">
              <h1 className="font-display font-bold text-2xl text-[var(--color-text)]">{project.name}</h1>
              <StatusBadge status={project.status} />
              <PriorityBadge priority={project.priority} />
            </div>
            {project.description && (
              <p className="text-sm text-[var(--color-muted)] font-body mt-0.5 max-w-lg">{project.description}</p>
            )}
            <div className="flex items-center gap-4 mt-2 flex-wrap">
              {project.dueDate && (
                <span className="text-xs text-[var(--color-muted)] font-body flex items-center gap-1">
                  <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" /></svg>
                  Échéance {new Date(project.dueDate).toLocaleDateString('fr-FR', { month: 'long', day: 'numeric', year: 'numeric' })}
                </span>
              )}
              <span className="text-xs text-[var(--color-muted)] font-body">
                {totalTasks} tâche{totalTasks !== 1 ? 's' : ''} · {project.completion}% terminé
              </span>
            </div>
          </div>
        </div>

        {/* Actions */}
        <div className="flex items-center gap-2 flex-shrink-0">
          {/* Members avatars */}
          <div className="flex -space-x-2 mr-2 cursor-pointer" onClick={() => isOwner && setMemberModal(true)} title={isOwner ? 'Gérer les membres' : 'Membres'}>
            {allMembers.slice(0, 4).map(m => (
              <div key={m.id} className="w-8 h-8 rounded-full ring-2 ring-[var(--color-surface)] bg-gradient-to-br from-indigo-400 to-violet-500 flex items-center justify-center text-white font-bold text-xs" title={m.fullName}>
                {m.initials}
              </div>
            ))}
            {allMembers.length > 4 && (
              <div className="w-8 h-8 rounded-full ring-2 ring-[var(--color-surface)] bg-[var(--color-border)] flex items-center justify-center text-xs font-body text-[var(--color-muted)]">
                +{allMembers.length - 4}
              </div>
            )}
          </div>
          <Button onClick={() => setTaskModal({ open: true, task: null, defaultStatus: 'todo' })} size="sm">
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" /></svg>
            Ajouter une tâche
          </Button>
          {isOwner && (
            <>
              <Button variant="secondary" size="sm" onClick={() => setEditModal(true)}>
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" /></svg>
                Modifier
              </Button>
              <Button variant="ghost" size="sm" className="text-red-500 hover:bg-red-50 dark:hover:bg-red-950/20" onClick={() => setDeleteConfirm(true)}>
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" /></svg>
              </Button>
            </>
          )}
        </div>
      </div>

      {/* Progress bar */}
      <div className="surface rounded-2xl p-4 animate-slide-up stagger-1">
        <div className="flex items-center justify-between mb-2">
          <div className="flex gap-4 text-sm font-body">
            {[
              { label: 'À faire',      count: project.taskStats.todo,        color: 'text-slate-500' },
              { label: 'En cours',     count: project.taskStats.in_progress, color: 'text-blue-500' },
              { label: 'En révision',  count: project.taskStats.review,       color: 'text-purple-500' },
              { label: 'Terminé',      count: project.taskStats.done,         color: 'text-emerald-500' },
            ].map(({ label, count, color }) => (
              <span key={label} className={`${color} font-medium`}>{count} <span className="text-[var(--color-muted)] font-normal">{label}</span></span>
            ))}
          </div>
          <span className="text-sm font-display font-semibold text-[var(--color-text)]">{project.completion}%</span>
        </div>
        <div className="h-2 rounded-full bg-[var(--color-border)] overflow-hidden">
          <div
            className="h-full rounded-full bg-gradient-to-r from-indigo-500 to-violet-500 transition-all duration-700"
            style={{ width: `${project.completion}%` }}
          />
        </div>
      </div>

      {/* Kanban board */}
      {error && <div className="p-3 rounded-xl bg-red-50 dark:bg-red-950/30 text-red-500 text-sm font-body">{error}</div>}
      <div className="animate-slide-up stagger-2">
        <KanbanBoard
          columns={columns}
          loading={tasksLoading}
          onStatusChange={handleStatusChange}
          onTaskEdit={(task) => setTaskModal({ open: true, task, defaultStatus: task.status })}
          onTaskDelete={handleTaskDelete}
          onAddTask={(status) => setTaskModal({ open: true, task: null, defaultStatus: status })}
        />
      </div>

      {/* Task modal */}
      <Modal
        isOpen={taskModal.open}
        onClose={() => setTaskModal({ open: false, task: null, defaultStatus: 'todo' })}
        title={taskModal.task ? 'Modifier la tâche' : 'Nouvelle tâche'}
      >
        <TaskForm
          initialData={taskModal.task || { status: taskModal.defaultStatus }}
          members={allMembers}
          onSubmit={handleTaskSave}
          onCancel={() => setTaskModal({ open: false, task: null, defaultStatus: 'todo' })}
          loading={saving}
        />
      </Modal>

      {/* Edit project modal */}
      <Modal isOpen={editModal} onClose={() => setEditModal(false)} title="Modifier le projet">
        <ProjectForm
          initialData={project}
          onSubmit={handleProjectUpdate}
          onCancel={() => setEditModal(false)}
          loading={saving}
        />
      </Modal>

      {/* Members modal */}
      <Modal isOpen={memberModal} onClose={() => setMemberModal(false)} title="Gérer les membres" size="sm">
        <div className="space-y-4">
          {isOwner && (
            <div className="flex gap-2">
              <input
                type="email"
                placeholder="membre@exemple.com"
                value={memberEmail}
                onChange={e => { setMemberEmail(e.target.value); setMemberError('') }}
                className="flex-1 px-3 py-2 rounded-xl border border-[var(--color-border)] bg-[var(--color-bg)] text-sm font-body focus:outline-none focus:ring-2 focus:ring-indigo-500/40 focus:border-indigo-500"
                onKeyDown={e => e.key === 'Enter' && handleAddMember()}
              />
              <Button size="sm" loading={memberLoading} onClick={handleAddMember}>Ajouter</Button>
            </div>
          )}
          {memberError && <p className="text-xs text-red-500 font-body">{memberError}</p>}
          <ul className="space-y-2 max-h-64 overflow-y-auto">
            {allMembers.map(m => (
              <li key={m.id} className="flex items-center justify-between p-2 rounded-xl hover:bg-[var(--color-border)]/30 transition-colors">
                <div className="flex items-center gap-2">
                  <div className="w-8 h-8 rounded-full bg-gradient-to-br from-indigo-400 to-violet-500 flex items-center justify-center text-white font-bold text-xs">
                    {m.initials}
                  </div>
                  <div>
                    <p className="text-sm font-body font-medium text-[var(--color-text)]">{m.fullName}</p>
                    <p className="text-xs text-[var(--color-muted)]">
                      {m.id === project.owner.id ? 'Propriétaire' : 'Membre'}
                    </p>
                  </div>
                </div>
                {isOwner && m.id !== project.owner.id && (
                  <button
                    onClick={() => handleRemoveMember(m.id)}
                    className="text-xs text-red-500 hover:text-red-400 font-body px-2 py-1 rounded transition-colors"
                  >
                    Retirer
                  </button>
                )}
              </li>
            ))}
          </ul>
        </div>
      </Modal>

      {/* Delete confirm */}
      <Modal isOpen={deleteConfirm} onClose={() => setDeleteConfirm(false)} title="Supprimer le projet" size="sm">
        <div className="space-y-4">
          <p className="text-sm font-body text-[var(--color-muted)]">
            Êtes-vous sûr de vouloir supprimer <strong className="text-[var(--color-text)]">{project.name}</strong> ?
            Cette action supprimera définitivement toutes les tâches et ne peut pas être annulée.
          </p>
          <div className="flex justify-end gap-3">
            <Button variant="ghost" onClick={() => setDeleteConfirm(false)}>Annuler</Button>
            <Button variant="danger" loading={saving} onClick={handleProjectDelete}>Supprimer le projet</Button>
          </div>
        </div>
      </Modal>
    </div>
  )
}
