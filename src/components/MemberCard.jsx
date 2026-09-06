import { Link } from 'react-router-dom'
import StatusBadge from './StatusBadge'

export default function MemberCard({ member, departments }) {
  return (
    <Link
      to={`/membros/${member.id}`}
      className="card flex items-center gap-3 p-3.5 transition hover:shadow-md hover:-translate-y-0.5 active:translate-y-0 active:bg-slate-50"
    >
      {member.photo_url ? (
        <img
          src={member.photo_url}
          alt={member.full_name}
          className="w-12 h-12 rounded-full object-cover flex-shrink-0 bg-slate-100 ring-2 ring-white shadow-sm"
        />
      ) : (
        <div className="w-12 h-12 rounded-full bg-gradient-to-br from-brand-navy-light to-brand-navy text-white flex items-center justify-center font-semibold flex-shrink-0 shadow-sm">
          {member.full_name?.charAt(0)?.toUpperCase() || '?'}
        </div>
      )}

      <div className="min-w-0 flex-1">
        <p className="font-medium text-slate-900 truncate">{member.full_name}</p>
        <p className="text-sm text-slate-500 truncate">
          {member.phone || 'Sem telefone'}
          {departments?.length ? ` · ${departments.join(', ')}` : ''}
        </p>
      </div>

      <StatusBadge status={member.status} />
    </Link>
  )
}
