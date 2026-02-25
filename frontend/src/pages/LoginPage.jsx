import { useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { useAuth } from '../contexts/AuthContext'
import { useTheme } from '../contexts/ThemeContext'
import Button from '../components/UI/Button'

export default function LoginPage() {
  const { login } = useAuth()
  const { isDark, toggleTheme } = useTheme()
  const navigate = useNavigate()

  const [form, setForm]     = useState({ email: '', password: '' })
  const [errors, setErrors] = useState({})
  const [loading, setLoading] = useState(false)
  const [serverError, setServerError] = useState('')

  const set = (k) => (e) => setForm(p => ({ ...p, [k]: e.target.value }))

  const validate = () => {
    const errs = {}
    if (!form.email)    errs.email    = "L'email est requis."
    if (!form.password) errs.password = 'Le mot de passe est requis.'
    setErrors(errs)
    return Object.keys(errs).length === 0
  }

  const handleSubmit = async (e) => {
    e.preventDefault()
    if (!validate()) return
    setLoading(true)
    setServerError('')
    try {
      await login(form.email, form.password)
      navigate('/dashboard')
    } catch (err) {
      const msg = err.response?.data?.message || 'Email ou mot de passe invalide.'
      setServerError(msg)
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
    ${errors[field] ? 'border-red-400 focus:ring-red-400/40' : 'border-[var(--color-border)]'}
  `

  return (
    <div className="min-h-screen flex bg-[var(--color-bg)] bg-grid-light dark:bg-grid-dark bg-grid">
      {/* Left panel – branding */}
      <div className="hidden lg:flex flex-col justify-between w-1/2 bg-gradient-to-br from-indigo-600 via-indigo-700 to-violet-800 p-12 relative overflow-hidden">
        {/* Background glow */}
        <div className="absolute top-[-20%] right-[-20%] w-96 h-96 rounded-full bg-violet-500/20 blur-3xl" />
        <div className="absolute bottom-[-10%] left-[-10%] w-64 h-64 rounded-full bg-indigo-500/20 blur-3xl" />

        <div className="flex items-center gap-3 relative z-10">
          <div className="w-10 h-10 rounded-xl bg-white/20 flex items-center justify-center backdrop-blur">
            <svg className="w-6 h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" />
            </svg>
          </div>
          <span className="font-display font-bold text-2xl text-white">ProManager</span>
        </div>

        <div className="relative z-10 space-y-6">
          <div className="inline-block px-3 py-1 rounded-full bg-white/10 text-white/80 text-xs font-body uppercase tracking-widest">
            Gestion de projet
          </div>
          <h1 className="font-display font-bold text-4xl text-white leading-tight">
            Livrez plus vite,<br />collaborez mieux.
          </h1>
          <p className="text-white/70 font-body text-lg leading-relaxed">
            Organisez les tâches, suivez la progression et travaillez avec votre équipe — tout en un seul endroit.
          </p>
          <div className="flex gap-6">
            {[['Projets', '10+'], ['Tâches', '100+'], ['Équipes', '5+']].map(([label, val]) => (
              <div key={label}>
                <div className="font-display font-bold text-2xl text-white">{val}</div>
                <div className="text-white/50 text-sm font-body">{label}</div>
              </div>
            ))}
          </div>
        </div>

        <p className="text-white/40 text-xs font-body relative z-10">
          © {new Date().getFullYear()} ProManager. Tous droits réservés.
        </p>
      </div>

      {/* Right panel – form */}
      <div className="flex-1 flex flex-col items-center justify-center p-6 sm:p-12">
        {/* Theme toggle */}
        <button
          onClick={toggleTheme}
          className="absolute top-5 right-5 w-9 h-9 rounded-xl flex items-center justify-center bg-[var(--color-surface)] border border-[var(--color-border)] text-[var(--color-muted)] hover:text-[var(--color-text)] transition-colors shadow-sm"
        >
          {isDark ? (
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 3v1m0 16v1m9-9h-1M4 12H3m15.364 6.364l-.707-.707M6.343 6.343l-.707-.707m12.728 0l-.707.707M6.343 17.657l-.707.707M16 12a4 4 0 11-8 0 4 4 0 018 0z" />
            </svg>
          ) : (
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M20.354 15.354A9 9 0 018.646 3.646 9.003 9.003 0 0012 21a9.003 9.003 0 008.354-5.646z" />
            </svg>
          )}
        </button>

        <div className="w-full max-w-sm animate-slide-up">
          {/* Mobile logo */}
          <div className="flex items-center gap-2 mb-8 lg:hidden">
            <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-indigo-500 to-violet-600 flex items-center justify-center">
              <svg className="w-5 h-5 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" />
              </svg>
            </div>
            <span className="font-display font-bold text-xl text-gradient">ProManager</span>
          </div>

          <h2 className="font-display font-bold text-2xl text-[var(--color-text)] mb-1">Bon retour</h2>
          <p className="text-[var(--color-muted)] text-sm font-body mb-8">Connectez-vous à votre compte pour continuer</p>

          {serverError && (
            <div className="mb-4 p-3 rounded-xl bg-red-50 dark:bg-red-950/30 border border-red-200 dark:border-red-800 text-red-600 dark:text-red-400 text-sm font-body">
              {serverError}
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-4" noValidate>
            <div>
              <label className="block text-sm font-body font-medium text-[var(--color-text)] mb-1.5">Adresse e-mail</label>
              <input
                type="email"
                value={form.email}
                onChange={set('email')}
                placeholder="you@example.com"
                autoComplete="email"
                className={inputClass('email')}
              />
              {errors.email && <p className="mt-1 text-xs text-red-500">{errors.email}</p>}
            </div>

            <div>
              <label className="block text-sm font-body font-medium text-[var(--color-text)] mb-1.5">Mot de passe</label>
              <input
                type="password"
                value={form.password}
                onChange={set('password')}
                placeholder="••••••••"
                autoComplete="current-password"
                className={inputClass('password')}
              />
              {errors.password && <p className="mt-1 text-xs text-red-500">{errors.password}</p>}
            </div>

            <Button type="submit" loading={loading} className="w-full mt-2" size="lg">
              Se connecter
            </Button>
          </form>

          <p className="mt-6 text-center text-sm font-body text-[var(--color-muted)]">
            Vous n'avez pas de compte ?{' '}
            <Link to="/register" className="text-indigo-500 hover:text-indigo-400 font-medium transition-colors">
              Créer un compte
            </Link>
          </p>
        </div>
      </div>
    </div>
  )
}
