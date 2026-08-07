export const MESES = [
  'Janeiro', 'Fevereiro', 'Março', 'Abril', 'Maio', 'Junho',
  'Julho', 'Agosto', 'Setembro', 'Outubro', 'Novembro', 'Dezembro',
]

// Recebe "YYYY-MM-DD" (formato do <input type="date"> e do Postgres) e devolve
// { year, month, day } sem sofrer problemas de fuso horário do objeto Date do JS.
export function parseISODate(value) {
  if (!value) return null
  const [year, month, day] = value.split('-').map(Number)
  if (!year || !month || !day) return null
  return { year, month, day }
}

export function formatDateBR(value) {
  const parsed = parseISODate(value)
  if (!parsed) return '—'
  const { year, month, day } = parsed
  return `${String(day).padStart(2, '0')}/${String(month).padStart(2, '0')}/${year}`
}

export function formatDayMonth(value) {
  const parsed = parseISODate(value)
  if (!parsed) return '—'
  const { day, month } = parsed
  return `${String(day).padStart(2, '0')}/${String(month).padStart(2, '0')}`
}

// Idade que a pessoa completa no ano de referência informado
export function ageInYear(birthDate, referenceYear) {
  const parsed = parseISODate(birthDate)
  if (!parsed) return null
  return referenceYear - parsed.year
}

// Data de hoje no formato "YYYY-MM-DD" (fuso horário local, não UTC)
export function todayISO() {
  const d = new Date()
  const year = d.getFullYear()
  const month = String(d.getMonth() + 1).padStart(2, '0')
  const day = String(d.getDate()).padStart(2, '0')
  return `${year}-${month}-${day}`
}
