import { useEffect, useState } from 'react'
import { useNavigate, useParams } from 'react-router-dom'
import { supabase } from '../supabaseClient'
import { uploadMemberPhoto, deleteMemberPhoto } from '../lib/photos'

const STATUS_OPTIONS = ['Visitante', 'Membro', 'Obreiro']

const EMPTY_FORM = {
  full_name: '',
  phone: '',
  birth_date: '',
  wedding_date: '',
  baptism_date: '',
  first_visit_date: '',
  status: 'Visitante',
  photo_url: '',
}

export default function MemberForm() {
  const { id } = useParams()
  const navigate = useNavigate()
  const isNew = !id || id === 'novo'

  const [form, setForm] = useState(EMPTY_FORM)
  const [photoFile, setPhotoFile] = useState(null)
  const [photoPreview, setPhotoPreview] = useState('')
  const [loading, setLoading] = useState(!isNew)
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState('')

  useEffect(() => {
    if (!isNew) loadMember()
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [id])

  async function loadMember() {
    setLoading(true)
    const { data, error } = await supabase.from('members').select('*').eq('id', id).single()
    if (error) {
      setError('Não foi possível carregar este cadastro.')
    } else {
      setForm({
        full_name: data.full_name || '',
        phone: data.phone || '',
        birth_date: data.birth_date || '',
        wedding_date: data.wedding_date || '',
        baptism_date: data.baptism_date || '',
        first_visit_date: data.first_visit_date || '',
        status: data.status || 'Visitante',
        photo_url: data.photo_url || '',
      })
    }
    setLoading(false)
  }

  function handleChange(field, value) {
    setForm((prev) => ({ ...prev, [field]: value }))
  }

  function handlePhotoChange(e) {
    const file = e.target.files?.[0]
    if (!file) return
    setPhotoFile(file)
    setPhotoPreview(URL.createObjectURL(file))
  }

  async function handleSubmit(e) {
    e.preventDefault()
    setError('')

    if (!form.full_name.trim()) {
      setError('O nome completo é obrigatório.')
      return
    }

    setSaving(true)
    try {
      let photoUrl = form.photo_url

      if (photoFile) {
        photoUrl = await uploadMemberPhoto(photoFile)
        if (!isNew && form.photo_url) {
          await deleteMemberPhoto(form.photo_url)
        }
      }

      const payload = {
        full_name: form.full_name.trim(),
        phone: form.phone.trim() || null,
        birth_date: form.birth_date || null,
        wedding_date: form.wedding_date || null,
        baptism_date: form.baptism_date || null,
        first_visit_date: form.first_visit_date || null,
        status: form.status,
        photo_url: photoUrl || null,
      }

      if (isNew) {
        const { error } = await supabase.from('members').insert(payload)
        if (error) throw error
      } else {
        const { error } = await supabase.from('members').update(payload).eq('id', id)
        if (error) throw error
      }

      navigate('/')
    } catch (err) {
      setError('Não foi possível salvar. Tente novamente. (' + (err.message || 'erro desconhecido') + ')')
    } finally {
      setSaving(false)
    }
  }

  async function handleDelete() {
    if (!window.confirm(`Tem certeza que deseja excluir o cadastro de "${form.full_name}"? Essa ação não pode ser desfeita.`)) {
      return
    }
    setSaving(true)
    try {
      const { error } = await supabase.from('members').delete().eq('id', id)
      if (error) throw error
      if (form.photo_url) await deleteMemberPhoto(form.photo_url)
      navigate('/')
    } catch {
      setError('Não foi possível excluir. Tente novamente.')
      setSaving(false)
    }
  }

  if (loading) return <p className="text-slate-500 text-center py-10">Carregando...</p>

  const currentPhoto = photoPreview || form.photo_url

  return (
    <div className="space-y-4">
      <div className="flex items-center gap-2">
        <button onClick={() => navigate(-1)} className="text-brand-navy text-sm font-medium">← Voltar</button>
      </div>

      <h1 className="text-xl font-semibold text-slate-900">
        {isNew ? 'Novo cadastro' : 'Editar cadastro'}
      </h1>

      <form onSubmit={handleSubmit} className="bg-white rounded-2xl border border-slate-200 p-5 space-y-4">
        <div className="flex flex-col items-center gap-3">
          {currentPhoto ? (
            <img src={currentPhoto} alt="Foto" className="w-24 h-24 rounded-full object-cover bg-slate-100" />
          ) : (
            <div className="w-24 h-24 rounded-full bg-brand-navy/10 text-brand-navy flex items-center justify-center text-3xl">
              📷
            </div>
          )}
          <label className="text-sm font-medium text-brand-navy cursor-pointer">
            {currentPhoto ? 'Trocar foto' : 'Adicionar foto'}
            <input type="file" accept="image/*" capture="environment" className="hidden" onChange={handlePhotoChange} />
          </label>
        </div>

        <Field label="Nome completo *">
          <input
            type="text"
            required
            value={form.full_name}
            onChange={(e) => handleChange('full_name', e.target.value)}
            className="input"
            placeholder="Nome completo"
          />
        </Field>

        <Field label="Telefone">
          <input
            type="tel"
            value={form.phone}
            onChange={(e) => handleChange('phone', e.target.value)}
            className="input"
            placeholder="(00) 00000-0000"
          />
        </Field>

        <Field label="Status">
          <select
            value={form.status}
            onChange={(e) => handleChange('status', e.target.value)}
            className="input"
          >
            {STATUS_OPTIONS.map((s) => (
              <option key={s} value={s}>{s}</option>
            ))}
          </select>
        </Field>

        <Field label="Data de nascimento">
          <input
            type="date"
            value={form.birth_date}
            onChange={(e) => handleChange('birth_date', e.target.value)}
            className="input"
          />
        </Field>

        <Field label="Data da 1ª visita">
          <input
            type="date"
            value={form.first_visit_date}
            onChange={(e) => handleChange('first_visit_date', e.target.value)}
            className="input"
          />
        </Field>

        <Field label="Data de batismo">
          <input
            type="date"
            value={form.baptism_date}
            onChange={(e) => handleChange('baptism_date', e.target.value)}
            className="input"
          />
        </Field>

        <Field label="Data de casamento">
          <input
            type="date"
            value={form.wedding_date}
            onChange={(e) => handleChange('wedding_date', e.target.value)}
            className="input"
          />
        </Field>

        {error && (
          <p className="text-sm text-red-600 bg-red-50 border border-red-200 rounded-lg px-3 py-2">{error}</p>
        )}

        <button
          type="submit"
          disabled={saving}
          className="w-full rounded-xl bg-brand-navy text-white font-medium py-2.5 active:bg-brand-navy-dark disabled:opacity-60 transition"
        >
          {saving ? 'Salvando...' : 'Salvar'}
        </button>

        {!isNew && (
          <button
            type="button"
            onClick={handleDelete}
            disabled={saving}
            className="w-full rounded-xl bg-red-50 text-red-700 font-medium py-2.5 active:bg-red-100 disabled:opacity-60 transition"
          >
            Excluir cadastro
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
