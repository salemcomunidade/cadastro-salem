const STYLES = {
  Presencial: 'bg-brand-green/15 text-brand-green-dark ring-brand-green/30',
  'On-Line': 'bg-brand-navy/10 text-brand-navy ring-brand-navy/20',
}

export default function ServiceTypeBadge({ type }) {
  const style = STYLES[type] || 'bg-slate-100 text-slate-700 ring-slate-200'
  return (
    <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ring-1 ring-inset ${style}`}>
      {type}
    </span>
  )
}
