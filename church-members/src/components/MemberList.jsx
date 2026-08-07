import { useEffect, useMemo, useState } from 'react'
import { Link } from 'react-router-dom'
import { supabase } from '../supabaseClient'
import MemberCard from './MemberCard'

const FILTERS = ['Todos', 'Visitante', 'Membro', 'Obreiro']

export default function MemberList() {
  const [members, setMembers] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [search, setSearch] = useState('')
  const [filter, setFilter] = useState('Todos')

  useEffect(() => {
    loadMembers()
  }, [])

  async function loadMembers() {
    setLoading(true)
    setError('')
    const { data, error } = await supabase
      .from('members')
      .select('*')
      .order('full_name', { ascending: true })

    if (error) {
      setError('Não foi possível carregar os cadastros. Verifique sua conexão.')
    } else {
      setMembers(data)
    }
    setLoading(false)
  }

  const filtered = useMemo(() => {
    return members.filter((m) => {
      const matchesFilter = filter === 'Todos' || m.status === filter
      const matchesSearch =
        !search.trim() ||
        m.full_name?.toLowerCase().includes(search.trim().toLowerCase()) ||
        m.phone?.toLowerCase().includes(search.trim().toLowerCase())
      return matchesFilter && matchesSearch
    })
  }, [members, search, filter])

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h1 className="text-xl font-semibold text-slate-900">Cadastros</h1>
        <span className="text-sm text-slate-500">{filtered.length} de {members.length}</span>
      </div>

      <input
        type="search"
        placeholder="Buscar por nome ou telefone..."
        value={search}
        onChange={(e) => setSearch(e.target.value)}
        className="input"
      />

      <div className="flex gap-2 overflow-x-auto pb-1 -mx-1 px-1">
        {FILTERS.map((f) => (
          <button
            key={f}
            onClick={() => setFilter(f)}
            className={`whitespace-nowrap px-3 py-1.5 rounded-full text-sm font-medium border transition ${
              filter === f
                ? 'bg-brand-navy text-white border-brand-navy'
                : 'bg-white text-slate-600 border-slate-300'
            }`}
          >
            {f}
          </button>
        ))}
      </div>

      {loading && <p className="text-slate-500 text-center py-10">Carregando...</p>}

      {error && (
        <p className="text-sm text-red-600 bg-red-50 border border-red-200 rounded-lg px-3 py-2">{error}</p>
      )}

      {!loading && !error && filtered.length === 0 && (
        <p className="text-slate-500 text-center py-10">Nenhum cadastro encontrado.</p>
      )}

      <div className="space-y-2">
        {filtered.map((m) => (
          <MemberCard key={m.id} member={m} />
        ))}
      </div>

      <Link
        to="/membros/novo"
        className="fixed bottom-20 right-4 w-14 h-14 rounded-full bg-brand-green text-white text-3xl leading-none flex items-center justify-center shadow-lg shadow-brand-green/40 active:bg-brand-green-dark"
        aria-label="Adicionar novo cadastro"
      >
        +
      </Link>
    </div>
  )
}
