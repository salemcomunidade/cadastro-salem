import { useEffect, useMemo, useState } from 'react'
import { supabase } from '../supabaseClient'
import StatusBadge from './StatusBadge'
import { MESES, formatDayMonth, parseISODate } from '../lib/dates'
import ReportHeader from './ReportHeader'

const now = new Date()
const CURRENT_MONTH = now.getMonth() + 1
const CURRENT_YEAR = now.getFullYear()

export default function BirthdayReport() {
  const [month, setMonth] = useState(CURRENT_MONTH)
  const [year, setYear] = useState(CURRENT_YEAR)
  const [members, setMembers] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [copied, setCopied] = useState(false)

  useEffect(() => {
    loadAll()
  }, [])

  async function loadAll() {
    setLoading(true)
    setError('')
    const { data, error } = await supabase
      .from('members')
      .select('id, full_name, phone, status, birth_date')
      .not('birth_date', 'is', null)

    if (error) {
      setError('Não foi possível carregar os aniversariantes.')
    } else {
      setMembers(data)
    }
    setLoading(false)
  }

  const birthdays = useMemo(() => {
    return members
      .filter((m) => {
        const parsed = parseISODate(m.birth_date)
        return parsed && parsed.month === Number(month)
      })
      .sort((a, b) => parseISODate(a.birth_date).day - parseISODate(b.birth_date).day)
  }, [members, month])

  const monthLabel = MESES[month - 1]

  function handlePrint() {
    window.print()
  }

  async function handleCopyWhatsApp() {
    const lines = [
      `🎂 *Aniversariantes de ${monthLabel} de ${year}*`,
      '',
      ...birthdays.map((m) => `• ${formatDayMonth(m.birth_date)} — ${m.full_name}`),
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
      {loading && <p className="text-slate-500 text-center py-10">Carregando...</p>}
      {error && (
        <p className="text-sm text-red-600 bg-red-50 border border-red-200 rounded-lg px-3 py-2">{error}</p>
      )}

      {!loading && (
        <div id="print-area" className="card p-4">
          <ReportHeader title={`Aniversariantes de ${monthLabel} de ${year}`} />

          <div className="no-print flex flex-wrap gap-3 items-end mb-4 pb-4 border-b border-slate-100">
            <div className="flex-1 min-w-[140px]">
              <label className="block text-sm font-medium text-slate-700 mb-1">Mês</label>
              <select value={month} onChange={(e) => setMonth(Number(e.target.value))} className="input">
                {MESES.map((m, idx) => (
                  <option key={m} value={idx + 1}>{m}</option>
                ))}
              </select>
            </div>
            <div className="w-28">
              <label className="block text-sm font-medium text-slate-700 mb-1">Ano</label>
              <input
                type="number"
                value={year}
                onChange={(e) => setYear(Number(e.target.value))}
                className="input"
              />
            </div>
          </div>

          <div className="flex items-center justify-between mb-3 no-print">
            <p className="text-sm text-slate-500">{birthdays.length} aniversariante(s) em {monthLabel}</p>
          </div>

          {birthdays.length === 0 ? (
            <p className="text-slate-500 text-center py-8">Nenhum aniversariante encontrado em {monthLabel}.</p>
          ) : (
            <ul className="divide-y divide-slate-100">
              {birthdays.map((m) => (
                <li key={m.id} className="py-3 flex items-center gap-3">
                  <span className="w-14 flex-shrink-0 font-semibold text-brand-navy">{formatDayMonth(m.birth_date)}</span>
                  <span className="flex-1 min-w-0">
                    <p className="font-medium text-slate-900 truncate">{m.full_name}</p>
                    <p className="text-sm text-slate-500 truncate">
                      {m.phone || 'Sem telefone'}
                    </p>
                  </span>
                  <span className="no-print"><StatusBadge status={m.status} /></span>
                </li>
              ))}
            </ul>
          )}
        </div>
      )}

      {!loading && birthdays.length > 0 && (
        <div className="no-print flex gap-2 sticky bottom-20">
          <button onClick={handlePrint} className="btn-primary flex-1 py-2.5">
            Imprimir / salvar PDF
          </button>
          <button onClick={handleCopyWhatsApp} className="btn-secondary flex-1 py-2.5">
            {copied ? 'Copiado! ✓' : 'Copiar p/ WhatsApp'}
          </button>
        </div>
      )}
    </div>
  )
}
