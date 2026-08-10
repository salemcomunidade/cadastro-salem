import { useEffect, useMemo, useState } from 'react'
import { Link } from 'react-router-dom'
import { supabase } from '../supabaseClient'
import ReportHeader from './ReportHeader'
import ServiceTypeBadge from './ServiceTypeBadge'
import { formatDateBR } from '../lib/dates'

const FILTERS = ['Todos', 'Presencial', 'On-Line']

export default function CultosList() {
  const [cultos, setCultos] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [filter, setFilter] = useState('Todos')

  useEffect(() => {
    loadCultos()
  }, [])

  async function loadCultos() {
    setLoading(true)
    setError('')
    const { data, error } = await supabase
      .from('cultos')
      .select('*')
      .order('service_date', { ascending: false })

    if (error) {
      setError('Não foi possível carregar os cultos. Verifique sua conexão.')
    } else {
      setCultos(data)
    }
    setLoading(false)
  }

  const filtered = useMemo(() => {
    if (filter === 'Todos') return cultos
    return cultos.filter((c) => c.service_type === filter)
  }, [cultos, filter])

  return (
    <div className="space-y-4">
      <ReportHeader title="Cultos" />

      <Link
        to="/cultos/relatorio"
        className="block text-center text-sm font-medium text-brand-navy bg-brand-navy/5 border border-brand-navy/20 rounded-xl py-2.5 active:scale-[0.98] transition"
      >
        📊 Ver relatório de cultos
      </Link>

      <div className="flex items-center justify-end -mt-2">
        <span className="text-xs font-medium text-slate-400">{filtered.length} de {cultos.length}</span>
      </div>

      <div className="flex gap-2 overflow-x-auto pb-1 -mx-1 px-1">
        {FILTERS.map((f) => (
          <button
            key={f}
            onClick={() => setFilter(f)}
            className={`whitespace-nowrap px-3.5 py-1.5 rounded-full text-sm font-medium border transition active:scale-95 ${
              filter === f
                ? 'bg-gradient-to-b from-brand-navy-light to-brand-navy text-white border-brand-navy shadow-sm shadow-brand-navy/20'
                : 'bg-white text-slate-600 border-slate-200'
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
        <p className="text-slate-500 text-center py-10">Nenhum culto encontrado.</p>
      )}

      <div className="space-y-2">
        {filtered.map((c) => (
          <Link
            key={c.id}
            to={`/cultos/${c.id}`}
            className="card flex items-center gap-3 p-3.5 transition hover:shadow-md hover:-translate-y-0.5 active:translate-y-0 active:bg-slate-50"
          >
            <div className="w-12 h-12 rounded-full bg-gradient-to-br from-brand-navy-light to-brand-navy text-white flex items-center justify-center text-lg flex-shrink-0 shadow-sm">
              ⛪
            </div>
            <div className="min-w-0 flex-1">
              <p className="font-medium text-slate-900 truncate">{formatDateBR(c.service_date)}</p>
              <p className="text-sm text-slate-500 truncate">
                {c.pastor_name || 'Sem pastor informado'}
                {c.attendance_count != null ? ` · ${c.attendance_count} pessoa(s)` : ''}
              </p>
            </div>
            <ServiceTypeBadge type={c.service_type} />
          </Link>
        ))}
      </div>

      <Link
        to="/cultos/novo"
        className="fixed bottom-24 right-4 w-14 h-14 rounded-full bg-gradient-to-b from-brand-green-light to-brand-green text-white text-3xl leading-none flex items-center justify-center shadow-lg shadow-brand-green/40 transition active:scale-95"
        aria-label="Adicionar novo culto"
      >
        +
      </Link>
    </div>
  )
}
