import { useState } from 'react'
import { useAuth } from '../context/AuthContext'

export default function LoginPage() {
  const { signIn } = useAuth()
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)

  async function handleSubmit(e) {
    e.preventDefault()
    setError('')
    setLoading(true)
    const { error } = await signIn(email.trim(), password)
    setLoading(false)
    if (error) {
      setError('E-mail ou senha inválidos. Verifique e tente novamente.')
    }
  }

  return (
    <div className="min-h-svh relative flex items-center justify-center bg-[#f6f7fb] px-4 overflow-hidden">
      <div
        className="pointer-events-none absolute -top-24 -right-24 w-72 h-72 rounded-full bg-brand-green/10 blur-3xl"
        aria-hidden="true"
      />
      <div
        className="pointer-events-none absolute -bottom-28 -left-20 w-72 h-72 rounded-full bg-brand-navy/10 blur-3xl"
        aria-hidden="true"
      />

      <div className="relative w-full max-w-sm">
        <div className="flex flex-col items-center mb-8">
          <img src="/logo-salem.png" alt="Comunidade Evangélica Salém" className="h-24 object-contain drop-shadow-sm" />
          <p className="text-slate-500 text-sm mt-3">Entre com seu usuário para continuar</p>
        </div>

        <form onSubmit={handleSubmit} className="card p-6 space-y-4">
          <div>
            <label className="block text-sm font-medium text-slate-700 mb-1">E-mail</label>
            <input
              type="email"
              required
              autoComplete="username"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className="input"
              placeholder="seuemail@exemplo.com"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-slate-700 mb-1">Senha</label>
            <input
              type="password"
              required
              autoComplete="current-password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className="input"
              placeholder="••••••••"
            />
          </div>

          {error && (
            <p className="text-sm text-red-600 bg-red-50 border border-red-200 rounded-lg px-3 py-2">{error}</p>
          )}

          <button type="submit" disabled={loading} className="btn-primary w-full py-2.5">
            {loading ? 'Entrando...' : 'Entrar'}
          </button>
        </form>

        <p className="text-xs text-center text-slate-400 mt-6">
          Não tem uma conta? Peça ao responsável pelo sistema para criar seu acesso.
        </p>
      </div>
    </div>
  )
}
