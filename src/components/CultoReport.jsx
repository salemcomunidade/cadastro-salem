import { useEffect, useMemo, useState } from 'react'
import { supabase } from '../supabaseClient'
import ReportHeader from './ReportHeader'
import ServiceTypeBadge from './ServiceTypeBadge'
import { formatDateBR, firstDayOfMonthISO, todayISO } from '../lib/dates'

const TYPE_OPTIONS = ['Presencial', 'On-Line']

export default function CultoReport() {
  const [cultos, setCultos] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [copied, setCopied] = useState(false)

  const [startDate, setStartDate] = useState(firstDayOfMonthISO())
  const [endDate, setEndDate] = useState(todayISO())
  const [selectedTypes, setSelectedTypes] = useState([])

  useEffect(() => {
    loadAll()
  }, [])

  async function loadAll() {
    setLoading(true)
    setError('')
    const { data, error } = await supabase
      .from('cultos')
      .select('*')
      .order('service_date', { ascending: false })

    if (error) {
      setError('Não foi possível carregar os cultos.')
    } else {
      setCultos(data || [])
    }
    setLoading(false)
  }

  function toggleType(type) {
    setSelectedTypes((prev) =>
      prev.includes(type) ? prev.filter((t) => t !== type) : [...prev, type]
    )
  }

  const filtered = useMemo(() => {
    return cultos.filter((c) => {
      const matchesType = selectedTypes.length === 0 || selectedTypes.includes(c.service_type)
      const matchesStart = !startDate || c.service_date >= startDate
      const matchesEnd = !endDate || c.service_date <= endDate
      return matchesType && matchesStart && matchesEnd
    })
  }, [cultos, selectedTypes, startDate, endDate])

  const stats = useMemo(() => {
    const totalServices = filtered.length
    const withCount = filtered.filter((c) => c.attendance_count != null)
    const totalAttendance = withCount.reduce((sum, c) => sum + c.attendance_count, 0)
    const average = withCount.length > 0 ? Math.round(totalAttendance / withCount.length) : 0
    return { totalServices, totalAttendance, average }
  }, [filtered])

  const typeLabel = selectedTypes.length === 0 ? 'Todos os tipos' : selectedTypes.join(', ')
  const periodLabel = `${formatDateBR(startDate)} a ${formatDateBR(endDate)}`

  function handlePrint() {
    window.print()
  }

  async function handleCopyWhatsApp() {
    const lines = [
      `⛪ *Cultos — ${periodLabel}*`,
      `${typeLabel}`,
      '',
      `Total de cultos: ${stats.totalServices}`,
      `Total de presença: ${stats.totalAttendance}`,
      `Média por culto: ${stats.average}`,
      '',
      ...filtered.map(
        (c) =>
          `• ${formatDateBR(c.service_date)} — ${c.service_type}${c.pastor_name ? ` — ${c.pastor_name}` : ''}${
            c.attendance_count != null ? ` — ${c.attendance_count} pessoa(s)` : ''
          }`
      ),
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
          <ReportHeader title="Relatório de Cultos" subtitle={periodLabel} />

          <div className="no-print mb-4 pb-4 border-b border-slate-100 space-y-3">
            <div className="flex flex-wrap gap-3 items-end">
              <div className="flex-1 min-w-[130px]">
                <label className="block text-sm font-medium text-slate-700 mb-1">De</label>
                <input
                  type="date"
                  value={startDate}
                  onChange={(e) => setStartDate(e.target.value)}
                  className="input"
                />
              </div>
              <div className="flex-1 min-w-[130px]">
                <label className="block text-sm font-medium text-slate-700 mb-1">Até</label>
                <input
                  type="date"
                  value={endDate}
                  onChange={(e) => setEndDate(e.target.value)}
                  className="input"
                />
              </div>
            </div>

            <div>
              <div className="flex items-center justify-between mb-2">
                <label className="block text-sm font-medium text-slate-700">Tipo de culto</label>
                {selectedTypes.length > 0 && (
                  <button
                    type="button"
                    onClick={() => setSelectedTypes([])}
                    className="text-xs font-medium text-brand-navy"
                  >
                    Limpar seleção (todos)
                  </button>
                )}
              </div>
              <div className="grid grid-cols-2 gap-2">
                {TYPE_OPTIONS.map((t) => {
                  const checked = selectedTypes.includes(t)
                  return (
                    <label
                      key={t}
                      className={`flex items-center gap-2 rounded-xl border px-3 py-2 text-sm cursor-pointer transition ${
                        checked
                          ? 'bg-brand-navy/10 border-brand-navy text-brand-navy font-medium'
                          : 'bg-white border-slate-300 text-slate-600'
                      }`}
                    >
                      <input
                        type="checkbox"
                        checked={checked}
                        onChange={() => toggleType(t)}
                        className="accent-brand-navy"
                      />
                      {t}
                    </label>
                  )
                })}
              </div>
            </div>
          </div>

          <div className="grid grid-cols-3 gap-2 mb-4">
            <StatTile label="Cultos" value={stats.totalServices} />
            <StatTile label="Presença total" value={stats.totalAttendance} />
            <StatTile label="Média" value={stats.average} />
          </div>

          {filtered.length === 0 ? (
            <p className="text-slate-500 text-center py-8">Nenhum culto encontrado para esse filtro.</p>
          ) : (
            <ul className="divide-y divide-slate-100">
              {filtered.map((c) => (
                <li key={c.id} className="py-3 flex items-start gap-3">
                  <span className="w-24 flex-shrink-0 font-semibold text-brand-navy text-sm pt-0.5">
                    {formatDateBR(c.service_date)}
                  </span>
                  <span className="flex-1 min-w-0">
                    <span className="flex items-center gap-2">
                      <ServiceTypeBadge type={c.service_type} />
                      {c.attendance_count != null && (
                        <span className="text-sm text-slate-500">{c.attendance_count} pessoa(s)</span>
                      )}
                    </span>
                    <p className="text-sm text-slate-700 mt-0.5">
                      {c.pastor_name || 'Sem pastor informado'}
                    </p>
                    {c.notes && <p className="text-xs text-slate-400 mt-0.5">{c.notes}</p>}
                  </span>
                </li>
              ))}
            </ul>
          )}
        </div>
      )}

      {!loading && (
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

function StatTile({ label, value }) {
  return (
    <div className="rounded-xl bg-slate-50 border border-slate-100 px-2 py-3 text-center">
      <p className="text-lg font-semibold text-brand-navy leading-none">{value}</p>
      <p className="text-[11px] text-slate-500 mt-1">{label}</p>
    </div>
  )
}
