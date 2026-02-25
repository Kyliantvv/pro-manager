import { useState } from 'react'
import Button from '../UI/Button'

const COLORS = [
  '#6366f1', '#8b5cf6', '#ec4899', '#f43f5e',
  '#f97316', '#eab308', '#22c55e', '#14b8a6',
  '#06b6d4', '#3b82f6',
]

const STATUS_OPTIONS  = ['planning', 'active', 'on_hold', 'completed', 'archived']
const PRIORITY_OPTIONS = ['low', 'medium', 'high']

export default function ProjectForm({ initialData = {}, onSubmit, onCancel, loading = false }) {
  const [form, setForm] = useState({
    name:        initialData.name        || '',
    description: initialData.description || '',
    status:      initialData.status      || 'planning',
    priority:    initialData.priority    || 'medium',
    color:       initialData.color       || '#6366f1',
    dueDate:     initialData.dueDate     || '',
  })
  const [errors, setErrors] = useState({})

  const set = (key) => (e) => {
    setForm(prev => ({ ...prev, [key]: e.target.value }))
    if (errors[key]) setErrors(prev => ({ ...prev, [key]: '' }))
  }

  const validate = () => {
    const errs = {}
    if (!form.name.trim())          errs.name     = 'Le nom du projet est requis.'
    if (form.name.trim().length < 2) errs.name    = 'Le nom doit contenir au moins 2 caractères.'
    if (!STATUS_OPTIONS.includes(form.status))    errs.status   = 'Statut invalide.'
    if (!PRIORITY_OPTIONS.includes(form.priority)) errs.priority = 'Priorité invalide.'
    setErrors(errs)
    return Object.keys(errs).length === 0
  }

  const handleSubmit = (e) => {
    e.preventDefault()
    if (!validate()) return
    onSubmit({ ...form, dueDate: form.dueDate || null })
  }

  const labelClass = 'block text-sm font-body font-medium text-[var(--color-text)] mb-1.5'
  const inputClass = 'w-full px-3.5 py-2.5 rounded-xl border border-[var(--color-border)] bg-[var(--color-bg)] text-[var(--color-text)] text-sm font-body placeholder:text-[var(--color-muted)] focus:outline-none focus:ring-2 focus:ring-indigo-500/40 focus:border-indigo-500 transition-all'

  return (
    <form onSubmit={handleSubmit} className="space-y-5">
      {/* Name */}
      <div>
        <label className={labelClass}>Nom du projet <span className="text-red-500">*</span></label>
        <input value={form.name} onChange={set('name')} placeholder="ex. Refonte du site web" className={inputClass} />
        {errors.name && <p className="mt-1 text-xs text-red-500">{errors.name}</p>}
      </div>

      {/* Description */}
      <div>
        <label className={labelClass}>Description</label>
        <textarea
          value={form.description} onChange={set('description')}
          placeholder="Brève description du projet..."
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
              <option key={s} value={s}>{{ planning: 'En planification', active: 'Actif', on_hold: 'En pause', completed: 'Complété', archived: 'Archivé' }[s] || s}</option>
            ))}
          </select>
        </div>
        <div>
          <label className={labelClass}>Priorité</label>
          <select value={form.priority} onChange={set('priority')} className={inputClass}>
            {PRIORITY_OPTIONS.map(p => (
              <option key={p} value={p}>{{ low: 'Faible', medium: 'Moyenne', high: 'Haute' }[p] || p}</option>
            ))}
          </select>
        </div>
      </div>

      {/* Due date */}
      <div>
        <label className={labelClass}>Date d'échéance</label>
        <input type="date" value={form.dueDate} onChange={set('dueDate')} className={inputClass} />
      </div>

      {/* Color picker */}
      <div>
        <label className={labelClass}>Couleur</label>
        <div className="flex items-center gap-2 flex-wrap">
          {COLORS.map(c => (
            <button
              key={c}
              type="button"
              onClick={() => setForm(prev => ({ ...prev, color: c }))}
              className={`w-8 h-8 rounded-lg transition-all ${form.color === c ? 'ring-2 ring-offset-2 ring-indigo-500 scale-110' : 'hover:scale-110'}`}
              style={{ backgroundColor: c }}
            />
          ))}
        </div>
      </div>

      {/* Actions */}
      <div className="flex justify-end gap-3 pt-1">
        <Button type="button" variant="ghost" onClick={onCancel}>Annuler</Button>
        <Button type="submit" loading={loading}>
          {initialData.id ? 'Enregistrer' : 'Créer le projet'}
        </Button>
      </div>
    </form>
  )
}
