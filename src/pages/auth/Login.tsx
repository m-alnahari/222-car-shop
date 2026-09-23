import { useState } from 'react'
import type { FormEvent } from 'react'
import { Navigate, useNavigate } from 'react-router-dom'
import { useAuth } from '../../context/AuthContext'

function Login() {
  const { user, login, loading } = useAuth()
  const navigate = useNavigate()

  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [error, setError] = useState('')
  const [submitting, setSubmitting] = useState(false)

  if (loading) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-neutral-950 px-4 text-white">
        <p className="text-[10px] uppercase tracking-[0.3em] text-neutral-500 sm:text-xs">
          Loading...
        </p>
      </div>
    )
  }

  if (user) {
    return <Navigate to="/dashboard" replace />
  }

  async function handleSubmit(
    event: FormEvent<HTMLFormElement>
  ) {
    event.preventDefault()

    setError('')
    setSubmitting(true)

    const result = await login(email, password)

    if (result.error) {
      setError(result.error.message)
      setSubmitting(false)
      return
    }

    navigate('/dashboard')
  }

  return (
    <main className="flex min-h-screen items-center justify-center bg-neutral-950 px-4 py-8 text-white sm:px-6">
      <div className="w-full max-w-md">
        {/* Header */}
        <div className="mb-8 text-center sm:mb-10">
          <p className="text-3xl font-semibold tracking-[0.2em] sm:text-4xl">
            222
          </p>

          <h1 className="mt-5 text-xl font-medium sm:mt-6 sm:text-2xl">
            Welcome Back
          </h1>

          <p className="mt-2 text-xs text-neutral-500 sm:text-sm">
            Sign in to access the dashboard.
          </p>
        </div>

        {/* Login Form */}
        <form
          onSubmit={handleSubmit}
          className="rounded-2xl border border-white/10 bg-[#090909] p-5 sm:p-6"
        >
          {/* Email */}
          <div>
            <label className="text-[10px] uppercase tracking-[0.2em] text-neutral-500">
              Email
            </label>

            <input
              type="email"
              value={email}
              onChange={(event) =>
                setEmail(event.target.value)
              }
              placeholder="admin@example.com"
              required
              autoComplete="email"
              className="mt-2 w-full rounded-xl border border-white/10 bg-white/5 px-4 py-3 text-sm text-white outline-none transition placeholder:text-neutral-700 focus:border-white/30"
            />
          </div>

          {/* Password */}
          <div className="mt-5">
            <label className="text-[10px] uppercase tracking-[0.2em] text-neutral-500">
              Password
            </label>

            <input
              type="password"
              value={password}
              onChange={(event) =>
                setPassword(event.target.value)
              }
              placeholder="••••••••"
              required
              autoComplete="current-password"
              className="mt-2 w-full rounded-xl border border-white/10 bg-white/5 px-4 py-3 text-sm text-white outline-none transition placeholder:text-neutral-700 focus:border-white/30"
            />
          </div>

          {/* Error */}
          {error && (
            <div className="mt-5 rounded-xl border border-red-500/20 bg-red-500/5 px-4 py-3 text-sm leading-5 text-red-400">
              {error}
            </div>
          )}

          {/* Submit */}
          <button
            type="submit"
            disabled={submitting}
            className="mt-6 w-full rounded-xl border border-white/20 bg-white py-3.5 text-xs font-medium uppercase tracking-[0.2em] text-black transition hover:bg-neutral-200 disabled:cursor-not-allowed disabled:opacity-50"
          >
            {submitting
              ? 'Signing In...'
              : 'Sign In'}
          </button>
        </form>
      </div>
    </main>
  )
}

export default Login