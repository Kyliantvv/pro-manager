import { useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { useAuth } from '../contexts/AuthContext'
import { useTheme } from '../contexts/ThemeContext'
import Button from '../components/UI/Button'

export default function RegisterPage() {
  const { register } = useAuth()
  const { isDark, toggleTheme } = useTheme()
  const navigate = useNavigate()

  const [form, setForm]   = useState({ firstName: '', lastName: '', email: '', password: '' })
  const [errors, setErrors] = useState({})
  const [loading, setLoading] = useState(false)
  const [serverError, setServerError] = useState('')

  const set = (k) => (e) => setForm(p => ({ ...p, [k]: e.target.value }))

  const validate = () => {
    const errs = {}
    if (!form.firstName.trim())       errs.firstName = 'Le prénom est requis.'
    if (!form.lastName.trim())        errs.lastName  = 'Le nom de famille est requis.'
    if (!form.email)                  errs.email     = "L'email est requis."
    else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(form.email)) errs.email = 'Entrez un email valide.'
    if (!form.password)               errs.password  = 'Le mot de passe est requis.'
    else if (form.password.length < 8) errs.password = 'Le mot de passe doit contenir au moins 8 caractères.'
    setErrors(errs)
    return Object.keys(errs).length === 0
  }

  const handleSubmit = async (e) => {
    e.preventDefault()
    if (!validate()) return
    setLoading(true)
    setServerError('')
    try {
      await register(form)
      navigate('/dashboard')
    } catch (err) {
      const data = err.response?.data
      if (data?.errors) setErrors(data.errors)
      setServerError(data?.message || "Inscription échouée. Veuillez réessayer.")
    } finally {
      setLoading(false)
    }
  }

  const inputClass = (field) => `
    w-full px-4 py-3 rounded-xl border text-sm font-body
    bg-white dark:bg-navy-800
    text-[var(--color-text)] placeholder:text-[var(--color-muted)]
    focus:outline-none focus:ring-2 focus:ring-indigo-500/40 focus:border-indigo-500
    transition-all
    ${errors[field] ? 'border-red-400' : 'border-[var(--color-border)]'}
  `

  return (
    <div className="min-h-screen flex bg-[var(--color-bg)] bg-grid-light dark:bg-grid-dark bg-grid">
      {/* Left panel */}
      <div className="hidden lg:flex flex-col justify-between w-1/2 bg-gradient-to-br from-violet-600 via-indigo-700 to-indigo-800 p-12 relative overflow-hidden">
        <div className="absolute top-[-10%] left-[-10%] w-80 h-80 rounded-full bg-indigo-500/20 blur-3xl" />
        <div className="absolute bottom-[-20%] right-[-10%] w-96 h-96 rounded-full bg-violet-500/20 blur-3xl" />

        <div className="flex items-center gap-3 relative z-10">
          <div className="w-10 h-10 rounded-xl bg-white/20 flex items-center justify-center backdrop-blur">
            <svg className="w-6 h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" />
            </svg>
          </div>
          <span className="font-display font-bold text-2xl text-white">ProManager</span>
        </div>

        <div className="relative z-10 space-y-5">
          <h1 className="font-display font-bold text-4xl text-white leading-tight">
            Gérez vos projets<br />dès aujourd'hui.
          </h1>
          <p className="text-white/70 font-body text-lg">
            Rejoignez des milliers d'équipes utilisant ProManager pour livrer les projets à temps.
          </p>
          <div className="space-y-3">
            {['Tableau Kanban avec glisser-déposer', "Collaboration d'équipe & rôles", 'Suivi des priorités & délais'].map(f => (
              <div key={f} className="flex items-center gap-2">
                <div className="w-5 h-5 rounded-full bg-white/20 flex items-center justify-center flex-shrink-0">
                  <svg className="w-3 h-3 text-white" fill="currentColor" viewBox="0 0 20 20">
                    <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                  </svg>
                </div>
                <span className="text-white/80 font-body text-sm">{f}</span>
              </div>
            ))}
          </div>
        </div>
        <p className="text-white/40 text-xs font-body relative z-10">© {new Date().getFullYear()} ProManager</p>
      </div>

      {/* Right panel */}
      <div className="flex-1 flex flex-col items-center justify-center p-6 sm:p-12">
        <button
          onClick={toggleTheme}
          className="absolute top-5 right-5 w-9 h-9 rounded-xl flex items-center justify-center bg-[var(--color-surface)] border border-[var(--color-border)] text-[var(--color-muted)] hover:text-[var(--color-text)] transition-colors shadow-sm"
        >
          {isDark ? (
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 3v1m0 16v1m9-9h-1M4 12H3m15.364 6.364l-.707-.707M6.343 6.343l-.707-.707m12.728 0l-.707.707M6.343 17.657l-.707.707M16 12a4 4 0 11-8 0 4 4 0 018 0z" /></svg>
          ) : (
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M20.354 15.354A9 9 0 018.646 3.646 9.003 9.003 0 0012 21a9.003 9.003 0 008.354-5.646z" /></svg>
          )}
        </button>

        <div className="w-full max-w-sm animate-slide-up">
          <div className="flex items-center gap-2 mb-8 lg:hidden">
            <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-indigo-500 to-violet-600 flex items-center justify-center">
              <svg className="w-5 h-5 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" /></svg>
            </div>
            <span className="font-display font-bold text-xl text-gradient">ProManager</span>
          </div>

          <h2 className="font-display font-bold text-2xl text-[var(--color-text)] mb-1">Créer votre compte</h2>
          <p className="text-[var(--color-muted)] text-sm font-body mb-8">Gratuit pour toujours. Aucune carte bancaire requise.</p>

          {serverError && (
            <div className="mb-4 p-3 rounded-xl bg-red-50 dark:bg-red-950/30 border border-red-200 dark:border-red-800 text-red-600 dark:text-red-400 text-sm font-body">
              {serverError}
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-4" noValidate>
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="block text-sm font-body font-medium text-[var(--color-text)] mb-1.5">Prénom</label>
                <input type="text" value={form.firstName} onChange={set('firstName')} placeholder="Jean" className={inputClass('firstName')} autoComplete="given-name" />
                {errors.firstName && <p className="mt-1 text-xs text-red-500">{errors.firstName}</p>}
              </div>
              <div>
                <label className="block text-sm font-body font-medium text-[var(--color-text)] mb-1.5">Nom de famille</label>
                <input type="text" value={form.lastName} onChange={set('lastName')} placeholder="Dupont" className={inputClass('lastName')} autoComplete="family-name" />
                {errors.lastName && <p className="mt-1 text-xs text-red-500">{errors.lastName}</p>}
              </div>
            </div>

            <div>
              <label className="block text-sm font-body font-medium text-[var(--color-text)] mb-1.5">Adresse e-mail</label>
              <input type="email" value={form.email} onChange={set('email')} placeholder="you@example.com" className={inputClass('email')} autoComplete="email" />
              {errors.email && <p className="mt-1 text-xs text-red-500">{errors.email}</p>}
            </div>

            <div>
              <label className="block text-sm font-body font-medium text-[var(--color-text)] mb-1.5">Mot de passe</label>
              <input type="password" value={form.password} onChange={set('password')} placeholder="Min. 8 caractères" className={inputClass('password')} autoComplete="new-password" />
              {errors.password && <p className="mt-1 text-xs text-red-500">{errors.password}</p>}
            </div>

            <Button type="submit" loading={loading} className="w-full mt-2" size="lg">
              Créer le compte
            </Button>
          </form>

          <p className="mt-6 text-center text-sm font-body text-[var(--color-muted)]">
            Vous avez déjà un compte ?{' '}
            <Link to="/login" className="text-indigo-500 hover:text-indigo-400 font-medium transition-colors">
              Se connecter
            </Link>
          </p>
        </div>
      </div>
    </div>
  )
}
