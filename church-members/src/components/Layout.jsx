import { NavLink, Outlet } from 'react-router-dom'
import { useAuth } from '../context/AuthContext'

const tabs = [
  { to: '/', label: 'Membros', icon: '👥', end: true },
  { to: '/aniversariantes', label: 'Aniversariantes', icon: '🎂', end: false },
  { to: '/visitantes', label: 'Visitantes', icon: '📋', end: false },
  { to: '/obreiros', label: 'Obreiros', icon: '🛠️', end: false },
]

export default function Layout() {
  const { user, signOut } = useAuth()

  return (
    <div className="min-h-svh flex flex-col bg-slate-50">
      <header className="no-print sticky top-0 z-10 bg-brand-navy text-white shadow-sm">
        <div className="max-w-2xl mx-auto px-4 py-3 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <img src="/icons/icon-192.png" alt="" className="w-7 h-7 rounded-md" />
            <span className="font-semibold">Cadastro Salém</span>
          </div>
          <button
            onClick={signOut}
            title={user?.email}
            className="text-xs bg-white/10 hover:bg-white/20 rounded-lg px-3 py-1.5 transition"
          >
            Sair
          </button>
        </div>
      </header>

      <main className="flex-1 max-w-2xl w-full mx-auto px-4 py-4 pb-24">
        <Outlet />
      </main>

      <nav className="no-print fixed bottom-0 inset-x-0 bg-white border-t border-slate-200 pb-[env(safe-area-inset-bottom)]">
        <div className="max-w-2xl mx-auto grid grid-cols-4">
          {tabs.map((tab) => (
            <NavLink
              key={tab.to}
              to={tab.to}
              end={tab.end}
              className={({ isActive }) =>
                `flex flex-col items-center justify-center gap-0.5 py-2.5 text-xs font-medium transition ${
                  isActive ? 'text-brand-navy' : 'text-slate-500'
                }`
              }
            >
              <span className="text-lg leading-none">{tab.icon}</span>
              {tab.label}
            </NavLink>
          ))}
        </div>
      </nav>
    </div>
  )
}
