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
  const [spouseOf, setSpouseOf] = useState({})
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [copied, setCopied] = useState(false)

  useEffect(() => {
    loadAll()
  }, [])

  async function loadAll() {
    setLoading(true)
    setError('')

    const [{ data, error }, { data: relData, error: relError }] = await Promise.all([
      supabase
        .from('members')
        .select('id, full_name, phone, status, birth_date, wedding_date, gender')
        .or('birth_date.not.is.null,wedding_date.not.is.null'),
      supabase
        .from('member_relationships')
        .select('member_id, related_member_id, relationship_types(name)'),
    ])

    if (error || relError) {
      setError('Não foi possível carregar os aniversariantes.')
      setLoading(false)
      return
    }

    setMembers(data || [])

    // Mapa bidirecional esposo(a) <-> esposo(a), usado para agrupar o casal
    // no relatório de aniversário de casamento.
    const map = {}
    ;(relData || [])
      .filter((row) => row.relationship_types?.name === 'Esposo(a)')
      .forEach((row) => {
        map[row.member_id] = row.related_member_id
        map[row.related_member_id] = row.member_id
      })
    setSpouseOf(map)

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

  const weddingAnniversaries = useMemo(() => {
    return members
      .filter((m) => {
        const parsed = parseISODate(m.wedding_date)
        return parsed && parsed.month === Number(month)
      })
      .sort((a, b) => parseISODate(a.wedding_date).day - parseISODate(b.wedding_date).day)
  }, [members, month])

  // Agrupa marido e esposa (ligados como "Esposo(a)" em Parentescos) num único
  // registro, com a esposa primeiro e a data aparecendo só uma vez. Quem não
  // tem cônjuge cadastrado (ou cujo cônjuge não está nessa lista) aparece sozinho.
  const weddingGroups = useMemo(() => {
    const byId = {}
    weddingAnniversaries.forEach((m) => { byId[m.id] = m })

    const seen = new Set()
    const groups = []

    weddingAnniversaries.forEach((m) => {
      if (seen.has(m.id)) return

      const spouseId = spouseOf[m.id]
      const spouse = spouseId ? byId[spouseId] : null

      if (spouse && !seen.has(spouse.id)) {
        seen.add(m.id)
        seen.add(spouse.id)

        let wife = m
        let husband = spouse
        if (m.gender === 'Masculino' && spouse.gender === 'Feminino') {
          wife = spouse
          husband = m
        }

        groups.push({ type: 'couple', key: wife.id, wife, husband })
      } else {
        seen.add(m.id)
        groups.push({ type: 'single', key: m.id, member: m })
      }
    })

    return groups
  }, [weddingAnniversaries, spouseOf])

  const monthLabel = MESES[month - 1]

  function handlePrint() {
    window.print()
  }

  async function handleCopyWhatsApp() {
    const lines = [
      `🎂 *Aniversariantes de ${monthLabel} de ${year}*`,
      '',
      ...(birthdays.length > 0
        ? birthdays.map((m) => `• ${formatDayMonth(m.birth_date)} — ${m.full_name}`)
        : ['Nenhum aniversariante neste mês.']),
      '',
      `💍 *Aniversariantes de Casamento de ${monthLabel} de ${year}*`,
      '',
      ...(weddingGroups.length > 0
        ? weddingGroups.map((g) =>
            g.type === 'couple'
              ? `• ${formatDayMonth(g.wife.wedding_date)} — ${g.wife.full_name} e ${g.husband.full_name}`
              : `• ${formatDayMonth(g.member.wedding_date)} — ${g.member.full_name}`
          )
        : ['Nenhum aniversário de casamento neste mês.']),
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

          <div className="mt-6 pt-4 border-t border-slate-100">
            <h2 className="text-sm font-semibold text-brand-navy uppercase tracking-wide mb-1">
              💍 Aniversariantes de Casamento
            </h2>
            <p className="text-sm text-slate-500 mb-3 no-print">
              {weddingGroups.length} registro(s) em {monthLabel}
            </p>

            {weddingGroups.length === 0 ? (
              <p className="text-slate-500 text-center py-8">
                Nenhum aniversário de casamento encontrado em {monthLabel}.
              </p>
            ) : (
              <ul className="divide-y divide-slate-100">
                {weddingGroups.map((g) =>
                  g.type === 'couple' ? (
                    <li key={g.key} className="py-3 flex flex-col gap-2">
                      <div className="flex items-center gap-3">
                        <span className="w-14 flex-shrink-0 font-semibold text-brand-navy">
                          {formatDayMonth(g.wife.wedding_date)}
                        </span>
                        <span className="flex-1 min-w-0">
                          <p className="font-medium text-slate-900 truncate">{g.wife.full_name}</p>
                          <p className="text-sm text-slate-500 truncate">{g.wife.phone || 'Sem telefone'}</p>
                        </span>
                        <span className="no-print"><StatusBadge status={g.wife.status} /></span>
                      </div>
                      <div className="flex items-center gap-3">
                        <span className="w-14 flex-shrink-0" aria-hidden="true"></span>
                        <span className="flex-1 min-w-0">
                          <p className="font-medium text-slate-900 truncate">{g.husband.full_name}</p>
                          <p className="text-sm text-slate-500 truncate">{g.husband.phone || 'Sem telefone'}</p>
                        </span>
                        <span className="no-print"><StatusBadge status={g.husband.status} /></span>
                      </div>
                    </li>
                  ) : (
                    <li key={g.key} className="py-3 flex items-center gap-3">
                      <span className="w-14 flex-shrink-0 font-semibold text-brand-navy">
                        {formatDayMonth(g.member.wedding_date)}
                      </span>
                      <span className="flex-1 min-w-0">
                        <p className="font-medium text-slate-900 truncate">{g.member.full_name}</p>
                        <p className="text-sm text-slate-500 truncate">{g.member.phone || 'Sem telefone'}</p>
                      </span>
                      <span className="no-print"><StatusBadge status={g.member.status} /></span>
                    </li>
                  )
                )}
              </ul>
            )}
          </div>
        </div>
      )}

      {!loading && (birthdays.length > 0 || weddingGroups.length > 0) && (
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
