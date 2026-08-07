import { useEffect, useMemo, useState } from 'react'
import { Link } from 'react-router-dom'
import { supabase } from '../supabaseClient'
import ReportHeader from './ReportHeader'

export default function RelationshipsReport() {
  const [types, setTypes] = useState([])
  const [selectedTypeIds, setSelectedTypeIds] = useState([])
  const [rows, setRows] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [copied, setCopied] = useState(false)

  useEffect(() => {
    loadAll()
  }, [])

  async function loadAll() {
    setLoading(true)
    setError('')

    const [{ data: typeData, error: typeError }, { data: relData, error: relError }] = await Promise.all([
      supabase.from('relationship_types').select('id, name, inverse_name').order('name'),
      supabase
        .from('member_relationships')
        .select(
          `id,
           relationship_type_id,
           relationship_types(name, inverse_name),
           source:members!member_relationships_member_id_fkey(id, full_name),
           related:members!member_relationships_related_member_id_fkey(id, full_name)`
        ),
    ])

    if (typeError || relError) {
      setError('Não foi possível carregar os parentescos.')
      setLoading(false)
      return
    }

    setTypes(typeData || [])
    setRows(relData || [])
    setLoading(false)
  }

  function toggleType(typeId) {
    setSelectedTypeIds((prev) =>
      prev.includes(typeId) ? prev.filter((t) => t !== typeId) : [...prev, typeId]
    )
  }

  // Cada linha do banco (de um tipo selecionado) gera dois "itens" — um para cada
  // lado do parentesco — depois agrupados por membro, em ordem alfabética.
  const groups = useMemo(() => {
    const showAll = selectedTypeIds.length === 0
    const filteredRows = showAll
      ? rows
      : rows.filter((row) => selectedTypeIds.includes(row.relationship_type_id))

    const byMember = {}

    function addItem(memberId, memberName, label, otherId, otherName) {
      if (!memberId || !memberName) return
      if (!byMember[memberId]) byMember[memberId] = { id: memberId, name: memberName, items: [] }
      byMember[memberId].items.push({ label, otherId, otherName })
    }

    filteredRows.forEach((row) => {
      const type = row.relationship_types
      addItem(row.source?.id, row.source?.full_name, type?.name, row.related?.id, row.related?.full_name)
      addItem(row.related?.id, row.related?.full_name, type?.inverse_name, row.source?.id, row.source?.full_name)
    })

    const list = Object.values(byMember).map((g) => ({
      ...g,
      items: g.items.sort((a, b) => (a.otherName || '').localeCompare(b.otherName || '')),
    }))
    list.sort((a, b) => a.name.localeCompare(b.name))
    return list
  }, [rows, selectedTypeIds])

  const filterLabel =
    selectedTypeIds.length === 0
      ? 'Todos os tipos'
      : types
          .filter((t) => selectedTypeIds.includes(t.id))
          .map((t) => t.name)
          .join(', ')

  function handlePrint() {
    window.print()
  }

  async function handleCopyWhatsApp() {
    const lines = [`👪 *Parentescos — ${filterLabel}*`]
    groups.forEach((g) => {
      lines.push('', `*${g.name}*`)
      g.items.forEach((i) => lines.push(`• ${i.label} de ${i.otherName}`))
    })
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
          <ReportHeader title={`Parentescos — ${filterLabel}`} />

          <div className="no-print mb-4 pb-4 border-b border-slate-100">
            <div className="flex items-center justify-between mb-2">
              <label className="block text-sm font-medium text-slate-700">Tipos de parentesco</label>
              {selectedTypeIds.length > 0 && (
                <button
                  type="button"
                  onClick={() => setSelectedTypeIds([])}
                  className="text-xs font-medium text-brand-navy"
                >
                  Limpar seleção (todos)
                </button>
              )}
            </div>

            {types.length === 0 ? (
              <p className="text-sm text-slate-500">Nenhum tipo de parentesco cadastrado ainda.</p>
            ) : (
              <div className="grid grid-cols-2 gap-2">
                {types.map((t) => {
                  const checked = selectedTypeIds.includes(t.id)
                  return (
                    <label
                      key={t.id}
                      className={`flex items-center gap-2 rounded-xl border px-3 py-2 text-sm cursor-pointer transition ${
                        checked
                          ? 'bg-brand-navy/10 border-brand-navy text-brand-navy font-medium'
                          : 'bg-white border-slate-300 text-slate-600'
                      }`}
                    >
                      <input
                        type="checkbox"
                        checked={checked}
                        onChange={() => toggleType(t.id)}
                        className="accent-brand-navy"
                      />
                      {t.name}
                    </label>
                  )
                })}
              </div>
            )}
            <p className="text-xs text-slate-400 mt-2">
              Você pode escolher um, vários ou nenhum tipo (nenhum marcado = mostra todos os parentescos).
            </p>
          </div>

          <div className="flex items-center justify-between mb-3 no-print">
            <p className="text-sm text-slate-500">
              {groups.length} membro(s) · {filterLabel}
            </p>
          </div>

          {groups.length === 0 ? (
            <p className="text-slate-500 text-center py-8">Nenhum parentesco encontrado para essa seleção.</p>
          ) : (
            <div className="space-y-5">
              {groups.map((g) => (
                <div key={g.id}>
                  <h3 className="text-sm font-semibold text-brand-navy uppercase tracking-wide mb-1">
                    <Link to={`/membros/${g.id}`} className="no-print hover:underline">
                      {g.name}
                    </Link>
                    <span className="print-only">{g.name}</span>
                  </h3>
                  <ul className="divide-y divide-slate-100">
                    {g.items.map((item, idx) => (
                      <li key={idx} className="py-2.5 flex items-center gap-3">
                        <div className="w-9 h-9 rounded-full bg-brand-navy/10 text-brand-navy flex items-center justify-center text-sm font-semibold flex-shrink-0">
                          {item.otherName?.charAt(0)?.toUpperCase() || '?'}
                        </div>
                        <span className="flex-1 min-w-0 text-sm">
                          <span className="font-medium text-slate-900">{item.label}</span>
                          <span className="text-slate-500"> de </span>
                          {item.otherId ? (
                            <Link to={`/membros/${item.otherId}`} className="no-print text-brand-navy font-medium">
                              {item.otherName}
                            </Link>
                          ) : null}
                          <span className="print-only text-slate-900 font-medium">{item.otherName}</span>
                        </span>
                      </li>
                    ))}
                  </ul>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {!loading && groups.length > 0 && (
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
