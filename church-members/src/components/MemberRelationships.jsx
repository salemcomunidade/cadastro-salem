import { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import { supabase } from '../supabaseClient'

export default function MemberRelationships({ memberId }) {
  const [types, setTypes] = useState([])
  const [relationships, setRelationships] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')

  const [typeId, setTypeId] = useState('')
  const [search, setSearch] = useState('')
  const [results, setResults] = useState([])
  const [selectedOther, setSelectedOther] = useState(null)
  const [saving, setSaving] = useState(false)

  useEffect(() => {
    loadTypes()
    loadRelationships()
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [memberId])

  useEffect(() => {
    if (!search.trim() || (selectedOther && selectedOther.full_name === search)) {
      setResults([])
      return
    }
    const timer = setTimeout(() => searchMembers(search.trim()), 250)
    return () => clearTimeout(timer)
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [search])

  async function loadTypes() {
    const { data, error } = await supabase
      .from('relationship_types')
      .select('id, name, inverse_name')
      .order('name')
    if (!error && data) setTypes(data)
  }

  async function searchMembers(term) {
    const { data } = await supabase
      .from('members')
      .select('id, full_name')
      .ilike('full_name', `%${term}%`)
      .neq('id', memberId)
      .order('full_name')
      .limit(8)
    setResults(data || [])
  }

  async function loadRelationships() {
    setLoading(true)
    setError('')

    const [{ data: forward, error: forwardError }, { data: inverse, error: inverseError }] = await Promise.all([
      supabase
        .from('member_relationships')
        .select('id, relationship_types(name, inverse_name), related:members!member_relationships_related_member_id_fkey(id, full_name)')
        .eq('member_id', memberId),
      supabase
        .from('member_relationships')
        .select('id, relationship_types(name, inverse_name), source:members!member_relationships_member_id_fkey(id, full_name)')
        .eq('related_member_id', memberId),
    ])

    if (forwardError || inverseError) {
      setError('Não foi possível carregar os parentescos.')
      setLoading(false)
      return
    }

    const forwardItems = (forward || []).map((row) => ({
      id: row.id,
      label: row.relationship_types?.name,
      otherId: row.related?.id,
      otherName: row.related?.full_name,
    }))
    const inverseItems = (inverse || []).map((row) => ({
      id: row.id,
      label: row.relationship_types?.inverse_name,
      otherId: row.source?.id,
      otherName: row.source?.full_name,
    }))

    const all = [...forwardItems, ...inverseItems].sort((a, b) =>
      (a.otherName || '').localeCompare(b.otherName || '')
    )
    setRelationships(all)
    setLoading(false)
  }

  function pickOther(member) {
    setSelectedOther(member)
    setSearch(member.full_name)
    setResults([])
  }

  async function handleAdd() {
    setError('')
    if (!typeId) {
      setError('Escolha o tipo de parentesco.')
      return
    }
    if (!selectedOther) {
      setError('Escolha a pessoa relacionada, na lista que aparece ao digitar o nome.')
      return
    }

    setSaving(true)
    const { error } = await supabase.from('member_relationships').insert({
      member_id: memberId,
      related_member_id: selectedOther.id,
      relationship_type_id: typeId,
    })

    if (error) {
      setError(
        error.code === '23505'
          ? 'Esse parentesco já foi cadastrado.'
          : 'Não foi possível salvar. Tente novamente.'
      )
    } else {
      setTypeId('')
      setSearch('')
      setSelectedOther(null)
      await loadRelationships()
    }
    setSaving(false)
  }

  async function handleRemove(relId) {
    if (!window.confirm('Remover esse parentesco?')) return
    await supabase.from('member_relationships').delete().eq('id', relId)
    setRelationships((prev) => prev.filter((r) => r.id !== relId))
  }

  return (
    <div className="card p-5 space-y-4">
      <h2 className="text-base font-semibold text-slate-900">Parentescos</h2>

      {loading ? (
        <p className="text-sm text-slate-500">Carregando...</p>
      ) : relationships.length === 0 ? (
        <p className="text-sm text-slate-500">Nenhum parentesco cadastrado ainda.</p>
      ) : (
        <ul className="divide-y divide-slate-100">
          {relationships.map((r) => (
            <li key={r.id} className="py-2.5 flex items-center gap-3">
              <span className="flex-1 min-w-0 text-sm">
                <span className="font-medium text-slate-900">{r.label}</span>
                <span className="text-slate-500"> de </span>
                {r.otherId ? (
                  <Link to={`/membros/${r.otherId}`} className="text-brand-navy font-medium">
                    {r.otherName}
                  </Link>
                ) : (
                  <span className="text-slate-400">(cadastro removido)</span>
                )}
              </span>
              <button
                type="button"
                onClick={() => handleRemove(r.id)}
                className="text-red-500 text-sm font-medium px-2 py-1 active:scale-95 transition"
                aria-label="Remover parentesco"
              >
                Remover
              </button>
            </li>
          ))}
        </ul>
      )}

      <div className="pt-3 border-t border-slate-100 space-y-3">
        <p className="text-sm font-medium text-slate-700">Adicionar parentesco</p>

        <div>
          <label className="block text-xs font-medium text-slate-500 mb-1">Este membro é...</label>
          <select value={typeId} onChange={(e) => setTypeId(e.target.value)} className="input">
            <option value="">Selecione o tipo</option>
            {types.map((t) => (
              <option key={t.id} value={t.id}>{t.name}</option>
            ))}
          </select>
        </div>

        <div className="relative">
          <label className="block text-xs font-medium text-slate-500 mb-1">...de qual pessoa?</label>
          <input
            type="text"
            value={search}
            onChange={(e) => {
              setSearch(e.target.value)
              setSelectedOther(null)
            }}
            placeholder="Digite o nome do membro"
            className="input"
          />
          {results.length > 0 && (
            <ul className="absolute z-10 left-0 right-0 mt-1 bg-white border border-slate-200 rounded-xl shadow-lg overflow-hidden">
              {results.map((m) => (
                <li key={m.id}>
                  <button
                    type="button"
                    onClick={() => pickOther(m)}
                    className="w-full text-left px-3 py-2 text-sm hover:bg-slate-50 active:bg-slate-100"
                  >
                    {m.full_name}
                  </button>
                </li>
              ))}
            </ul>
          )}
        </div>

        <p className="text-xs text-slate-400">
          O parentesco inverso aparece automaticamente no cadastro da outra pessoa (ex: se você escolher
          &quot;Pai&quot;, o cadastro dela mostrará &quot;Filho(a)&quot; de volta).
        </p>

        {error && (
          <p className="text-sm text-red-600 bg-red-50 border border-red-200 rounded-lg px-3 py-2">{error}</p>
        )}

        <button
          type="button"
          onClick={handleAdd}
          disabled={saving}
          className="btn-secondary w-full py-2.5"
        >
          {saving ? 'Adicionando...' : 'Adicionar parentesco'}
        </button>
      </div>
    </div>
  )
}
