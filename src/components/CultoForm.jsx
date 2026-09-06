import { useEffect, useState } from 'react'
import { useNavigate, useParams } from 'react-router-dom'
import { supabase } from '../supabaseClient'
import { todayISO } from '../lib/dates'

const SERVICE_TYPE_OPTIONS = ['Presencial', 'On-Line']

const EMPTY_FORM = {
  service_date: todayISO(),
  service_type: 'Presencial',
  pastor_name: '',
  attendance_count: '',
  notes: '',
}

export default function CultoForm() {
  const { id } = useParams()
  const navigate = useNavigate()
  const isNew = !id || id === 'novo'

  const [form, setForm] = useState(EMPTY_FORM)
  const [loading, setLoading] = useState(!isNew)
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState('')

  useEffect(() => {
    if (!isNew) loadCulto()
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [id])

  async function loadCulto() {
    setLoading(true)
    const { data, error } = await supabase.from('cultos').select('*').eq('id', id).single()
    if (error) {
      setError('Não foi possível carregar este culto.')
      setLoading(false)
      return
    }

    setForm({
      service_date: data.service_date || todayISO(),
      service_type: data.service_type || 'Presencial',
      pastor_name: data.pastor_name || '',
      attendance_count: data.attendance_count != null ? String(data.attendance_count) : '',
      notes: data.notes || '',
    })
    setLoading(false)
  }

  function handleChange(field, value) {
    setForm((prev) => ({ ...prev, [field]: value }))
  }

  async function handleSubmit(e) {
    e.preventDefault()
    setError('')

    if (!form.service_date) {
      setError('A data do culto é obrigatória.')
      return
    }

    setSaving(true)
    try {
      const payload = {
        service_date: form.service_date,
        service_type: form.service_type,
        pastor_name: form.pastor_name.trim() || null,
        attendance_count: form.attendance_count !== '' ? parseInt(form.attendance_count, 10) : null,
        notes: form.notes.trim() || null,
      }

      if (isNew) {
        const { error } = await supabase.from('cultos').insert(payload)
        if (error) throw error
      } else {
        const { error } = await supabase.from('cultos').update(payload).eq('id', id)
        if (error) throw error
      }

      navigate('/cultos')
    } catch (err) {
      setError('Não foi possível salvar. Tente novamente. (' + (err.message || 'erro desconhecido') + ')')
    } finally {
      setSaving(false)
    }
  }

  async function handleDelete() {
    if (!window.confirm('Tem certeza que deseja excluir este culto? Essa ação não pode ser desfeita.')) {
      return
    }
    setSaving(true)
    try {
      const { error } = await supabase.from('cultos').delete().eq('id', id)
      if (error) throw error
      navigate('/cultos')
    } catch {
      setError('Não foi possível excluir. Tente novamente.')
      setSaving(false)
    }
  }

  if (loading) return <p className="text-slate-500 text-center py-10">Carregando...</p>

  return (
    <div className="space-y-4">
      <div className="flex items-center gap-2">
        <button onClick={() => navigate(-1)} className="text-brand-navy text-sm font-medium">← Voltar</button>
      </div>

      <h1 className="text-xl font-semibold text-slate-900">
        {isNew ? 'Novo culto' : 'Editar culto'}
      </h1>

      <form onSubmit={handleSubmit} className="card p-5 space-y-4">
        <Field label="Data do culto *">
          <input
            type="date"
            required
            value={form.service_date}
            onChange={(e) => handleChange('service_date', e.target.value)}
            className="input"
          />
        </Field>

        <Field label="Tipo do culto">
          <select
            value={form.service_type}
            onChange={(e) => handleChange('service_type', e.target.value)}
            className="input"
          >
            {SERVICE_TYPE_OPTIONS.map((t) => (
              <option key={t} value={t}>{t}</option>
            ))}
          </select>
        </Field>

        <Field label="Nome do pastor">
          <input
            type="text"
            value={form.pastor_name}
            onChange={(e) => handleChange('pastor_name', e.target.value)}
            className="input"
            placeholder="Nome do pastor"
          />
        </Field>

        <Field label="Quantidade de pessoas">
          <input
            type="number"
            min="0"
            step="1"
            inputMode="numeric"
            value={form.attendance_count}
            onChange={(e) => handleChange('attendance_count', e.target.value)}
            className="input"
            placeholder="0"
          />
        </Field>

        <Field label="Observações">
          <textarea
            value={form.notes}
            onChange={(e) => handleChange('notes', e.target.value)}
            className="input min-h-[100px] resize-y"
            placeholder="Observações sobre o culto..."
          />
        </Field>

        {error && (
          <p className="text-sm text-red-600 bg-red-50 border border-red-200 rounded-lg px-3 py-2">{error}</p>
        )}

        <button type="submit" disabled={saving} className="btn-primary w-full py-2.5">
          {saving ? 'Salvando...' : 'Salvar'}
        </button>

        {!isNew && (
          <button
            type="button"
            onClick={handleDelete}
            disabled={saving}
            className="w-full rounded-xl bg-red-50 text-red-700 font-medium py-2.5 active:scale-[0.98] active:bg-red-100 disabled:opacity-60 transition"
          >
            Excluir culto
          </button>
        )}
      </form>
    </div>
  )
}

function Field({ label, children }) {
  return (
    <div>
      <label className="block text-sm font-medium text-slate-700 mb-1">{label}</label>
      {children}
    </div>
  )
}
