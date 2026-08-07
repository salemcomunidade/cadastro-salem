import { Link } from 'react-router-dom'
import StatusBadge from './StatusBadge'

export default function MemberCard({ member }) {
  return (
    <Link
      to={`/membros/${member.id}`}
      className="flex items-center gap-3 bg-white rounded-2xl border border-slate-200 p-3 active:bg-slate-50 transition"
    >
      {member.photo_url ? (
        <img
          src={member.photo_url}
          alt={member.full_name}
          className="w-12 h-12 rounded-full object-cover flex-shrink-0 bg-slate-100"
        />
      ) : (
        <div className="w-12 h-12 rounded-full bg-brand-navy/10 text-brand-navy flex items-center justify-center font-semibold flex-shrink-0">
          {member.full_name?.charAt(0)?.toUpperCase() || '?'}
        </div>
      )}

      <div className="min-w-0 flex-1">
        <p className="font-medium text-slate-900 truncate">{member.full_name}</p>
        <p className="text-sm text-slate-500 truncate">{member.phone || 'Sem telefone'}</p>
      </div>

      <StatusBadge status={member.status} />
    </Link>
  )
}
