import { useState } from 'react'
import { useAuth } from '../contexts/AuthContext'
import { usersApi } from '../services/api'
import Button from '../components/UI/Button'

export default function ProfilePage() {
  const { user, updateUser } = useAuth()
  const [form, setForm]       = useState({
    firstName:       user?.firstName       || '',
    lastName:        user?.lastName        || '',
    bio:             user?.bio             || '',
    currentPassword: '',
    newPassword:     '',
  })
  const [errors, setErrors]   = useState({})
  const [loading, setLoading] = useState(false)
  const [success, setSuccess] = useState('')
  const [serverError, setServerError] = useState('')

  const set = (k) => (e) => {
    setForm(p => ({ ...p, [k]: e.target.value }))
    if (errors[k]) setErrors(p => ({ ...p, [k]: '' }))
    setSuccess('')
    setServerError('')
  }

  const validate = () => {
    const errs = {}
    if (!form.firstName.trim()) errs.firstName = 'Le prénom est requis.'
    if (!form.lastName.trim())  errs.lastName  = 'Le nom de famille est requis.'
    if (form.newPassword && !form.currentPassword) errs.currentPassword = 'Saisissez votre mot de passe actuel pour le modifier.'
    if (form.newPassword && form.newPassword.length < 8) errs.newPassword = 'Le nouveau mot de passe doit contenir au moins 8 caractères.'
    setErrors(errs)
    return Object.keys(errs).length === 0
  }

  const handleSubmit = async (e) => {
    e.preventDefault()
    if (!validate()) return
    setLoading(true)
    setServerError('')
    setSuccess('')
    try {
      const payload = {
        firstName: form.firstName,
        lastName:  form.lastName,
        bio:       form.bio,
        ...(form.newPassword ? { currentPassword: form.currentPassword, newPassword: form.newPassword } : {}),
      }
      const { data } = await usersApi.update(payload)
      updateUser(data.user)
      setSuccess('Profil mis à jour avec succès !')
      setForm(p => ({ ...p, currentPassword: '', newPassword: '' }))
    } catch (err) {
      const d = err.response?.data
      if (d?.errors) setErrors(d.errors)
      setServerError(d?.message || 'Mise à jour échouée. Veuillez réessayer.')
    } finally {
      setLoading(false)
    }
  }

  const inputClass = (field) => `
    w-full px-3.5 py-2.5 rounded-xl border text-sm font-body
    bg-[var(--color-bg)] text-[var(--color-text)]
    placeholder:text-[var(--color-muted)]
    focus:outline-none focus:ring-2 focus:ring-indigo-500/40 focus:border-indigo-500
    transition-all
    ${errors[field] ? 'border-red-400' : 'border-[var(--color-border)]'}
  `

  return (
    <div className="max-w-2xl mx-auto space-y-8 animate-slide-up">
      <div>
        <h1 className="font-display font-bold text-2xl text-[var(--color-text)]">Paramètres du profil</h1>
        <p className="text-[var(--color-muted)] text-sm font-body mt-1">Gérez vos informations de compte.</p>
      </div>

      {/* Avatar + info */}
      <div className="surface rounded-2xl p-6 flex items-center gap-5">
        <div className="w-16 h-16 rounded-2xl bg-gradient-to-br from-indigo-400 to-violet-500 flex items-center justify-center text-white font-display font-bold text-2xl shadow-glow flex-shrink-0">
          {user?.initials}
        </div>
        <div>
          <h2 className="font-display font-semibold text-lg text-[var(--color-text)]">{user?.fullName}</h2>
          <p className="text-sm text-[var(--color-muted)] font-body">{user?.email}</p>
          <div className="flex gap-3 mt-2 text-xs font-body text-[var(--color-muted)]">
            <span>{user?.projectsOwned ?? 0} projets créés</span>
            <span>·</span>
            <span>{user?.projectsMember ?? 0} projets rejoints</span>
          </div>
        </div>
      </div>

      {/* Form */}
      <div className="surface rounded-2xl p-6">
        {success && (
          <div className="mb-5 p-3 rounded-xl bg-emerald-50 dark:bg-emerald-950/30 border border-emerald-200 dark:border-emerald-800 text-emerald-600 dark:text-emerald-400 text-sm font-body">
            {success}
          </div>
        )}
        {serverError && (
          <div className="mb-5 p-3 rounded-xl bg-red-50 dark:bg-red-950/30 border border-red-200 dark:border-red-800 text-red-600 dark:text-red-400 text-sm font-body">
            {serverError}
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-5" noValidate>
          <h3 className="font-display font-semibold text-[var(--color-text)]">Informations personnelles</h3>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-body font-medium text-[var(--color-text)] mb-1.5">Prénom</label>
              <input value={form.firstName} onChange={set('firstName')} className={inputClass('firstName')} />
              {errors.firstName && <p className="mt-1 text-xs text-red-500">{errors.firstName}</p>}
            </div>
            <div>
              <label className="block text-sm font-body font-medium text-[var(--color-text)] mb-1.5">Nom de famille</label>
              <input value={form.lastName} onChange={set('lastName')} className={inputClass('lastName')} />
              {errors.lastName && <p className="mt-1 text-xs text-red-500">{errors.lastName}</p>}
            </div>
          </div>

          <div>
            <label className="block text-sm font-body font-medium text-[var(--color-text)] mb-1.5">Bio</label>
            <textarea
              value={form.bio} onChange={set('bio')}
              placeholder="Parlez-nous un peu de vous..."
              rows={3}
              className={`${inputClass('bio')} resize-none`}
            />
          </div>

          <div className="pt-4 border-t border-[var(--color-border)]">
            <h3 className="font-display font-semibold text-[var(--color-text)] mb-4">Changer le mot de passe</h3>
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-body font-medium text-[var(--color-text)] mb-1.5">Mot de passe actuel</label>
                <input type="password" value={form.currentPassword} onChange={set('currentPassword')} placeholder="••••••••" className={inputClass('currentPassword')} />
                {errors.currentPassword && <p className="mt-1 text-xs text-red-500">{errors.currentPassword}</p>}
              </div>
              <div>
                <label className="block text-sm font-body font-medium text-[var(--color-text)] mb-1.5">Nouveau mot de passe</label>
                <input type="password" value={form.newPassword} onChange={set('newPassword')} placeholder="Min. 8 caractères" className={inputClass('newPassword')} />
                {errors.newPassword && <p className="mt-1 text-xs text-red-500">{errors.newPassword}</p>}
              </div>
            </div>
          </div>

          <div className="flex justify-end pt-1">
            <Button type="submit" loading={loading}>Enregistrer</Button>
          </div>
        </form>
      </div>

      {/* Member since */}
      <p className="text-xs text-center text-[var(--color-muted)] font-body">
        Membre depuis {user?.createdAt ? new Date(user.createdAt).toLocaleDateString('fr-FR', { month: 'long', year: 'numeric' }) : '–'}
      </p>
    </div>
  )
}
