import { useEffect, useMemo, useState } from 'react'
import { supabase } from '../supabaseClient'
import ReportHeader from './ReportHeader'
import StatusBadge from './StatusBadge'

const NO_DEPT_ID = '__sem_departamento__'

export default function DepartmentsReport() {
  const [departments, setDepartments] = useState([])
  const [selectedDeptIds, setSelectedDeptIds] = useState([])
  const [members, setMembers] = useState([])
  const [deptsByMember, setDeptsByMember] = useState({})
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [copied, setCopied] = useState(false)

  useEffect(() => {
    loadAll()
  }, [])

  async function loadAll() {
    setLoading(true)
    setError('')

    // Qualquer pessoa pode fazer parte de um departamento — não só obreiros.
    // Por isso aqui não filtramos por status: uma criança marcada no
    // departamento "Infantil" aparece aqui normalmente, com o status dela.
    const [{ data: deptData, error: deptError }, { data: memberData, error: memberError }] = await Promise.all([
      supabase.from('departments').select('id, name').order('name'),
      supabase.from('members').select('id, full_name, phone, status').order('full_name'),
    ])

    if (deptError || memberError) {
      setError('Não foi possível carregar os departamentos.')
      setLoading(false)
      return
    }

    setDepartments(deptData || [])
    setMembers(memberData || [])

    const { data: linkData } = await supabase
      .from('member_departments')
      .select('member_id, department_id, departments(name)')

    const map = {}
    ;(linkData || []).forEach((row) => {
      if (!map[row.member_id]) map[row.member_id] = []
      map[row.member_id].push({ id: row.department_id, name: row.departments?.name })
    })
    setDeptsByMember(map)

    setLoading(false)
  }

  function toggleDepartment(deptId) {
    setSelectedDeptIds((prev) =>
      prev.includes(deptId) ? prev.filter((d) => d !== deptId) : [...prev, deptId]
    )
  }

  // Grupos a exibir: um por departamento (na ordem alfabética), cada um com as
  // pessoas daquele departamento. Uma mesma pessoa pode aparecer em vários grupos.
  const groups = useMemo(() => {
    const showAll = selectedDeptIds.length === 0
    const activeDepts = showAll ? departments : departments.filter((d) => selectedDeptIds.includes(d.id))

    const deptGroups = activeDepts
      .map((dept) => ({
        id: dept.id,
        name: dept.name,
        members: members.filter((m) => (deptsByMember[m.id] || []).some((d) => d.id === dept.id)),
      }))
      .filter((g) => g.members.length > 0)

    if (showAll) {
      const noDept = members.filter((m) => (deptsByMember[m.id] || []).length === 0)
      if (noDept.length > 0) {
        deptGroups.push({ id: NO_DEPT_ID, name: 'Sem departamento', members: noDept })
      }
    }

    return deptGroups
  }, [departments, members, deptsByMember, selectedDeptIds])

  // Total de pessoas distintas (sem contar duas vezes quem está em mais de um departamento)
  const distinctCount = useMemo(() => {
    const ids = new Set()
    groups.forEach((g) => g.members.forEach((m) => ids.add(m.id)))
    return ids.size
  }, [groups])

  const filterLabel =
    selectedDeptIds.length === 0
      ? 'Todos os departamentos'
      : departments
          .filter((d) => selectedDeptIds.includes(d.id))
          .map((d) => d.name)
          .join(', ')

  function handlePrint() {
    window.print()
  }

  async function handleCopyWhatsApp() {
    const lines = [`🗂️ *Departamentos — ${filterLabel}*`]
    groups.forEach((g) => {
      lines.push('', `*${g.name}*`)
      g.members.forEach((m) => lines.push(`• ${m.full_name}${m.phone ? ` — ${m.phone}` : ''}`))
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
          <ReportHeader title={`Departamentos — ${filterLabel}`} />

          <div className="no-print mb-4 pb-4 border-b border-slate-100">
            <div className="flex items-center justify-between mb-2">
              <label className="block text-sm font-medium text-slate-700">Departamentos</label>
              {selectedDeptIds.length > 0 && (
                <button
                  type="button"
                  onClick={() => setSelectedDeptIds([])}
                  className="text-xs font-medium text-brand-navy"
                >
                  Limpar seleção (todos)
                </button>
              )}
            </div>

            {departments.length === 0 ? (
              <p className="text-sm text-slate-500">Nenhum departamento cadastrado ainda.</p>
            ) : (
              <div className="grid grid-cols-2 gap-2">
                {departments.map((dept) => {
                  const checked = selectedDeptIds.includes(dept.id)
                  return (
                    <label
                      key={dept.id}
                      className={`flex items-center gap-2 rounded-xl border px-3 py-2 text-sm cursor-pointer transition ${
                        checked
                          ? 'bg-brand-navy/10 border-brand-navy text-brand-navy font-medium'
                          : 'bg-white border-slate-300 text-slate-600'
                      }`}
                    >
                      <input
                        type="checkbox"
                        checked={checked}
                        onChange={() => toggleDepartment(dept.id)}
                        className="accent-brand-navy"
                      />
                      {dept.name}
                    </label>
                  )
                })}
              </div>
            )}
            <p className="text-xs text-slate-400 mt-2">
              Nenhum departamento marcado = mostra todo mundo, de todos os departamentos. Cada
              pessoa aparece com o status dela (Visitante, Membro, Obreiro ou Inativo).
            </p>
          </div>

          <div className="flex items-center justify-between mb-3 no-print">
            <p className="text-sm text-slate-500">
              {distinctCount} pessoa(s) · {filterLabel}
            </p>
          </div>

          {groups.length === 0 ? (
            <p className="text-slate-500 text-center py-8">Nenhuma pessoa encontrada para essa seleção.</p>
          ) : (
            <div className="space-y-5">
              {groups.map((g) => (
                <div key={g.id}>
                  <h3 className="text-sm font-semibold text-brand-navy uppercase tracking-wide mb-1">
                    {g.name}
                    <span className="text-slate-400 font-normal"> · {g.members.length}</span>
                  </h3>
                  <ul className="divide-y divide-slate-100">
                    {g.members.map((m) => (
                      <li key={m.id} className="py-2.5 flex items-center gap-3">
                        <div className="w-9 h-9 rounded-full bg-brand-navy/10 text-brand-navy flex items-center justify-center text-sm font-semibold flex-shrink-0">
                          {m.full_name?.charAt(0)?.toUpperCase() || '?'}
                        </div>
                        <span className="flex-1 min-w-0">
                          <p className="font-medium text-slate-900 truncate">{m.full_name}</p>
                          <p className="text-sm text-slate-500 truncate">{m.phone || 'Sem telefone'}</p>
                        </span>
                        <span className="no-print"><StatusBadge status={m.status} /></span>
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
