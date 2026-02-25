import { useState } from 'react'
import Button from '../UI/Button'

const STATUS_OPTIONS   = ['todo', 'in_progress', 'review', 'done']
const PRIORITY_OPTIONS = ['low', 'medium', 'high', 'urgent']

export default function TaskForm({ initialData = {}, members = [], onSubmit, onCancel, loading = false }) {
  const [form, setForm] = useState({
    title:          initialData.title          || '',
    description:    initialData.description    || '',
    status:         initialData.status         || 'todo',
    priority:       initialData.priority       || 'medium',
    dueDate:        initialData.dueDate        || '',
    estimatedHours: initialData.estimatedHours || '',
    assigneeId:     initialData.assignee?.id   || '',
  })
  const [errors, setErrors] = useState({})

  const set = (key) => (e) => {
    setForm(prev => ({ ...prev, [key]: e.target.value }))
    if (errors[key]) setErrors(prev => ({ ...prev, [key]: '' }))
  }

  const validate = () => {
    const errs = {}
    if (!form.title.trim())          errs.title    = 'Le titre de la tâche est requis.'
    if (form.title.trim().length < 2) errs.title   = 'Le titre doit contenir au moins 2 caractères.'
    if (form.estimatedHours && (isNaN(form.estimatedHours) || Number(form.estimatedHours) < 0)) {
      errs.estimatedHours = 'Les heures estimées doivent être un nombre positif.'
    }
    setErrors(errs)
    return Object.keys(errs).length === 0
  }

  const handleSubmit = (e) => {
    e.preventDefault()
    if (!validate()) return
    onSubmit({
      ...form,
      dueDate:        form.dueDate        || null,
      estimatedHours: form.estimatedHours ? parseFloat(form.estimatedHours) : null,
      assigneeId:     form.assigneeId     ? parseInt(form.assigneeId, 10) : null,
    })
  }

  const labelClass = 'block text-sm font-body font-medium text-[var(--color-text)] mb-1.5'
  const inputClass = 'w-full px-3.5 py-2.5 rounded-xl border border-[var(--color-border)] bg-[var(--color-bg)] text-[var(--color-text)] text-sm font-body placeholder:text-[var(--color-muted)] focus:outline-none focus:ring-2 focus:ring-indigo-500/40 focus:border-indigo-500 transition-all'

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      {/* Title */}
      <div>
        <label className={labelClass}>Titre <span className="text-red-500">*</span></label>
        <input value={form.title} onChange={set('title')} placeholder="ex. Concevoir la page d'accueil" className={inputClass} />
        {errors.title && <p className="mt-1 text-xs text-red-500">{errors.title}</p>}
      </div>

      {/* Description */}
      <div>
        <label className={labelClass}>Description</label>
        <textarea
          value={form.description} onChange={set('description')}
          placeholder="Détails sur cette tâche..."
          rows={3}
          className={`${inputClass} resize-none`}
        />
      </div>

      {/* Status + Priority */}
      <div className="grid grid-cols-2 gap-3">
        <div>
          <label className={labelClass}>Statut</label>
          <select value={form.status} onChange={set('status')} className={inputClass}>
            {STATUS_OPTIONS.map(s => (
              <option key={s} value={s}>{{ todo: 'À faire', in_progress: 'En cours', review: 'En révision', done: 'Terminé' }[s] || s}</option>
            ))}
          </select>
        </div>
        <div>
          <label className={labelClass}>Priorité</label>
          <select value={form.priority} onChange={set('priority')} className={inputClass}>
            {PRIORITY_OPTIONS.map(p => (
              <option key={p} value={p}>{{ low: 'Faible', medium: 'Moyenne', high: 'Haute', urgent: 'Urgent' }[p] || p}</option>
            ))}
          </select>
        </div>
      </div>

      {/* Assignee + Estimated hours */}
      <div className="grid grid-cols-2 gap-3">
        <div>
          <label className={labelClass}>Assigné à</label>
          <select value={form.assigneeId} onChange={set('assigneeId')} className={inputClass}>
            <option value="">Non assigné</option>
            {members.map(m => (
              <option key={m.id} value={m.id}>{m.fullName}</option>
            ))}
          </select>
        </div>
        <div>
          <label className={labelClass}>Heures est.</label>
          <input
            type="number" min="0" step="0.5"
            value={form.estimatedHours} onChange={set('estimatedHours')}
            placeholder="ex. 4"
            className={inputClass}
          />
          {errors.estimatedHours && <p className="mt-1 text-xs text-red-500">{errors.estimatedHours}</p>}
        </div>
      </div>

      {/* Due date */}
      <div>
        <label className={labelClass}>Date d'échéance</label>
        <input type="date" value={form.dueDate} onChange={set('dueDate')} className={inputClass} />
      </div>

      {/* Actions */}
      <div className="flex justify-end gap-3 pt-1">
        <Button type="button" variant="ghost" onClick={onCancel}>Annuler</Button>
        <Button type="submit" loading={loading}>
          {initialData.id ? 'Enregistrer' : 'Créer la tâche'}
        </Button>
      </div>
    </form>
  )
}
