import { supabase, PHOTOS_BUCKET } from '../supabaseClient'

// Recebe um File (imagem) e devolve a URL pública para salvar em members.photo_url
export async function uploadMemberPhoto(file) {
  const ext = (file.name.split('.').pop() || 'jpg').toLowerCase()
  const fileName = `${crypto.randomUUID()}.${ext}`

  const { error } = await supabase.storage.from(PHOTOS_BUCKET).upload(fileName, file, {
    cacheControl: '3600',
    upsert: false,
    contentType: file.type || 'image/jpeg',
  })

  if (error) throw error

  const { data } = supabase.storage.from(PHOTOS_BUCKET).getPublicUrl(fileName)
  return data.publicUrl
}

// Extrai o nome do arquivo a partir da URL pública, para poder apagar do Storage
export function photoPathFromUrl(url) {
  if (!url) return null
  const marker = `/${PHOTOS_BUCKET}/`
  const idx = url.indexOf(marker)
  if (idx === -1) return null
  return url.slice(idx + marker.length)
}

export async function deleteMemberPhoto(url) {
  const path = photoPathFromUrl(url)
  if (!path) return
  await supabase.storage.from(PHOTOS_BUCKET).remove([path])
}
