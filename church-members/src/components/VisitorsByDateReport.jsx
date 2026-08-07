import { useEffect, useState } from 'react'
import { supabase } from '../supabaseClient'
import StatusBadge from './StatusBadge'
import { formatDateBR, todayISO } from '../lib/dates'

export default function VisitorsByDateReport() {
  const [date, setDate] = useState(todayISO())
  const [visitors, setVisitors] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [copied, setCopied] = useState(false)

  useEffect(() => {
    loadVisitors(date)
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [date])

  async function loadVisitors(selectedDate) {
    setLoading(true)
    setError('')
    const { data, error } = await supabase
      .from('members')
      .select('id, full_name, phone, status, first_visit_date, photo_url')
      .eq('first_visit_date', selectedDate)
      .order('full_name', { ascending: true })

    if (error) {
      setError('Não foi possível carregar os visitantes dessa data.')
    } else {
      setVisitors(data)
    }
    setLoading(false)
  }

  function handlePrint() {
    window.print()
  }

  async function handleCopyWhatsApp() {
    const lines = [
      `📋 *Visitantes de ${formatDateBR(date)}*`,
      '',
      ...visitors.map((v) => `• ${v.full_name}${v.phone ? ` — ${v.phone}` : ''}`),
    ]
    const text = lines.join('\n')
    try {
      await navigator.clipboard.writeText(text)
      setCopied(true)
      setTimeout(() => setCopied(false), 2500)
    } catch {
      setError('Não foi possível copiar automaticamente. Selecione o texto manualmente.')
    }
  }

  return (
    <div className="space-y-4">
      <h1 className="text-xl font-semibold text-slate-900">Visitantes por data</h1>

      <div className="no-print bg-white rounded-2xl border border-slate-200 p-4">
        <label className="block text-sm font-medium text-slate-700 mb-1">Data da 1ª visita</label>
        <input
          type="date"
          value={date}
          onChange={(e) => setDate(e.target.value)}
          className="input"
        />
      </div>

      {loading && <p className="text-slate-500 text-center py-10">Carregando...</p>}
      {error && (
        <p className="text-sm text-red-600 bg-red-50 border border-red-200 rounded-lg px-3 py-2">{error}</p>
      )}

      {!loading && (
        <div id="print-area" className="bg-white rounded-2xl border border-slate-200 p-4">
          <div className="hidden print:block mb-4">
            <h2 className="text-lg font-semibold">Visitantes de {formatDateBR(date)}</h2>
          </div>

          <div className="flex items-center justify-between mb-3 no-print">
            <p className="text-sm text-slate-500">{visitors.length} pessoa(s) em {formatDateBR(date)}</p>
          </div>

          {visitors.length === 0 ? (
            <p className="text-slate-500 text-center py-8">Nenhum registro de 1ª visita nessa data.</p>
          ) : (
            <ul className="divide-y divide-slate-100">
              {visitors.map((v) => (
                <li key={v.id} className="py-3 flex items-center gap-3">
                  {v.photo_url ? (
                    <img
                      src={v.photo_url}
                      alt={v.full_name}
                      className="w-10 h-10 rounded-full object-cover flex-shrink-0 bg-slate-100"
                    />
                  ) : (
                    <div className="w-10 h-10 rounded-full bg-brand-navy/10 text-brand-navy flex items-center justify-center font-semibold flex-shrink-0">
                      {v.full_name?.charAt(0)?.toUpperCase() || '?'}
                    </div>
                  )}
                  <span className="flex-1 min-w-0">
                    <p className="font-medium text-slate-900 truncate">{v.full_name}</p>
                    <p className="text-sm text-slate-500 truncate">{v.phone || 'Sem telefone'}</p>
                  </span>
                  <span className="no-print"><StatusBadge status={v.status} /></span>
                </li>
              ))}
            </ul>
          )}
        </div>
      )}

      {!loading && visitors.length > 0 && (
        <div className="no-print flex gap-2 sticky bottom-20">
          <button
            onClick={handlePrint}
            className="flex-1 rounded-xl bg-brand-navy text-white font-medium py-2.5 active:bg-brand-navy-dark"
          >
            Imprimir / salvar PDF
          </button>
          <button
            onClick={handleCopyWhatsApp}
            className="flex-1 rounded-xl bg-brand-green text-white font-medium py-2.5 active:bg-brand-green-dark"
          >
            {copied ? 'Copiado! ✓' : 'Copiar p/ WhatsApp'}
          </button>
        </div>
      )}
    </div>
  )
}
