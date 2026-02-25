import { useCallback, useEffect, useState } from 'react'
import { projectsApi } from '../services/api'
import { useAuth } from '../contexts/AuthContext'
import ProjectCard from '../components/Project/ProjectCard'
import ProjectForm from '../components/Project/ProjectForm'
import Modal from '../components/UI/Modal'
import Button from '../components/UI/Button'
import { ProjectCardSkeleton } from '../components/UI/Skeleton'

const FILTER_STATUSES   = ['', 'planning', 'active', 'on_hold', 'completed', 'archived']
const FILTER_PRIORITIES = ['', 'low', 'medium', 'high']

export default function DashboardPage() {
  const { user } = useAuth()
  const [projects, setProjects]   = useState([])
  const [loading, setLoading]     = useState(true)
  const [pagination, setPagination] = useState({ total: 0, page: 1, pages: 1 })
  const [filters, setFilters]     = useState({ status: '', priority: '', search: '', sort: 'createdAt', order: 'DESC' })
  const [showCreate, setShowCreate] = useState(false)
  const [creating, setCreating]   = useState(false)
  const [error, setError]         = useState('')

  const fetchProjects = useCallback(async (page = 1) => {
    setLoading(true)
    setError('')
    try {
      const params = { page, limit: 9, ...filters }
      Object.keys(params).forEach(k => !params[k] && delete params[k])
      const { data } = await projectsApi.list(params)
      setProjects(data.data)
      setPagination(data.pagination)
    } catch {
      setError('Impossible de charger les projets.')
    } finally {
      setLoading(false)
    }
  }, [filters])

  useEffect(() => { fetchProjects(1) }, [fetchProjects])

  const handleCreate = async (formData) => {
    setCreating(true)
    try {
      await projectsApi.create(formData)
      setShowCreate(false)
      fetchProjects(1)
    } catch (err) {
      console.error(err)
    } finally {
      setCreating(false)
    }
  }

  const setFilter = (key) => (e) => setFilters(p => ({ ...p, [key]: e.target.value }))

  const selectClass = 'px-3 py-2 rounded-xl border border-[var(--color-border)] bg-[var(--color-surface)] text-sm font-body text-[var(--color-text)] focus:outline-none focus:ring-2 focus:ring-indigo-500/40 focus:border-indigo-500 transition-all'

  // Stats
  const stats = [
    { label: 'Total projets', value: pagination.total, icon: '📁', color: 'from-indigo-500 to-violet-500' },
    { label: 'Actifs',        value: projects.filter(p => p.status === 'active').length, icon: '⚡', color: 'from-emerald-500 to-teal-500' },
    { label: 'Complétés',     value: projects.filter(p => p.status === 'completed').length, icon: '✅', color: 'from-blue-500 to-indigo-500' },
    { label: 'En pause',      value: projects.filter(p => p.status === 'on_hold').length, icon: '⏸', color: 'from-amber-500 to-orange-500' },
  ]

  return (
    <div className="max-w-7xl mx-auto space-y-8">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 animate-slide-up">
        <div>
          <h1 className="font-display font-bold text-2xl sm:text-3xl text-[var(--color-text)]">
            {getGreeting()}, <span className="text-gradient">{user?.firstName}</span> 👋
          </h1>
          <p className="text-[var(--color-muted)] text-sm mt-1 font-body">
            Voici un aperçu de vos projets.
          </p>
        </div>
        <Button onClick={() => setShowCreate(true)} className="self-start sm:self-auto">
          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
          </svg>
          Nouveau projet
        </Button>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 animate-slide-up stagger-1">
        {stats.map(({ label, value, icon, color }) => (
          <div key={label} className="surface rounded-2xl p-4">
            <div className={`w-10 h-10 rounded-xl bg-gradient-to-br ${color} flex items-center justify-center text-lg mb-3`}>
              {icon}
            </div>
            <div className="font-display font-bold text-2xl text-[var(--color-text)]">{value}</div>
            <div className="text-xs text-[var(--color-muted)] font-body mt-0.5">{label}</div>
          </div>
        ))}
      </div>

      {/* Filters */}
      <div className="flex flex-col sm:flex-row gap-3 animate-slide-up stagger-2">
        {/* Search */}
        <div className="relative flex-1">
          <svg className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-[var(--color-muted)]" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
          </svg>
          <input
            type="text"
            placeholder="Rechercher des projets..."
            value={filters.search}
            onChange={setFilter('search')}
            className="w-full pl-9 pr-4 py-2 rounded-xl border border-[var(--color-border)] bg-[var(--color-surface)] text-sm font-body text-[var(--color-text)] placeholder:text-[var(--color-muted)] focus:outline-none focus:ring-2 focus:ring-indigo-500/40 focus:border-indigo-500 transition-all"
          />
        </div>
        <select value={filters.status}   onChange={setFilter('status')}   className={selectClass}>
          <option value="">Tous les statuts</option>
          {FILTER_STATUSES.filter(Boolean).map(s => <option key={s} value={s}>{{ planning: 'Planification', active: 'Actif', on_hold: 'En pause', completed: 'Complété', archived: 'Archivé' }[s] || s}</option>)}
        </select>
        <select value={filters.priority} onChange={setFilter('priority')} className={selectClass}>
          <option value="">Toutes les priorités</option>
          {FILTER_PRIORITIES.filter(Boolean).map(p => <option key={p} value={p}>{{ low: 'Faible', medium: 'Moyenne', high: 'Haute' }[p] || p}</option>)}
        </select>
        <select value={filters.sort}     onChange={setFilter('sort')}     className={selectClass}>
          <option value="createdAt">Plus récents d'abord</option>
          <option value="name">Nom</option>
          <option value="dueDate">Date d'échéance</option>
          <option value="priority">Priorité</option>
        </select>
      </div>

      {/* Error */}
      {error && (
        <div className="p-4 rounded-xl bg-red-50 dark:bg-red-950/30 border border-red-200 dark:border-red-800 text-red-600 dark:text-red-400 text-sm font-body">
          {error}
        </div>
      )}

      {/* Projects grid */}
      {loading ? (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5">
          {Array.from({ length: 6 }).map((_, i) => <ProjectCardSkeleton key={i} />)}
        </div>
      ) : projects.length === 0 ? (
        <div className="text-center py-20 animate-fade-in">
          <div className="w-16 h-16 rounded-2xl bg-indigo-50 dark:bg-indigo-950/30 flex items-center justify-center mx-auto mb-4">
            <svg className="w-8 h-8 text-indigo-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" />
            </svg>
          </div>
          <h3 className="font-display font-semibold text-[var(--color-text)] mb-1">Aucun projet trouvé</h3>
          <p className="text-[var(--color-muted)] text-sm font-body mb-4">
            {filters.search || filters.status || filters.priority ? 'Essayez d\'ajuster vos filtres.' : 'Créez votre premier projet pour commencer.'}
          </p>
          <Button onClick={() => setShowCreate(true)}>Créer un projet</Button>
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5 animate-slide-up stagger-3">
          {projects.map(p => <ProjectCard key={p.id} project={p} />)}
        </div>
      )}

      {/* Pagination */}
      {pagination.pages > 1 && (
        <div className="flex items-center justify-center gap-2">
          {Array.from({ length: pagination.pages }).map((_, i) => (
            <button
              key={i}
              onClick={() => fetchProjects(i + 1)}
              className={`w-9 h-9 rounded-xl text-sm font-body font-medium transition-all ${
                pagination.page === i + 1
                  ? 'bg-indigo-600 text-white shadow-glow'
                  : 'surface text-[var(--color-muted)] hover:text-[var(--color-text)]'
              }`}
            >
              {i + 1}
            </button>
          ))}
        </div>
      )}

      {/* Create project modal */}
      <Modal isOpen={showCreate} onClose={() => setShowCreate(false)} title="Nouveau projet" size="md">
        <ProjectForm
          onSubmit={handleCreate}
          onCancel={() => setShowCreate(false)}
          loading={creating}
        />
      </Modal>
    </div>
  )
}

function getGreeting() {
  const h = new Date().getHours()
  if (h < 12) return 'Bonjour'
  if (h < 18) return 'Bon après-midi'
  return 'Bonsoir'
}
