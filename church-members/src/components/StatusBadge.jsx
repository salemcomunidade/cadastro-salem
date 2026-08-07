const STYLES = {
  Visitante: 'bg-amber-100 text-amber-800 ring-amber-200',
  Membro: 'bg-brand-green/15 text-brand-green-dark ring-brand-green/30',
  Obreiro: 'bg-brand-navy/10 text-brand-navy ring-brand-navy/20',
}

export default function StatusBadge({ status }) {
  const style = STYLES[status] || 'bg-slate-100 text-slate-700 ring-slate-200'
  return (
    <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ring-1 ring-inset ${style}`}>
      {status}
    </span>
  )
}
