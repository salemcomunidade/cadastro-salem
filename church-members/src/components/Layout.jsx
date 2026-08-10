import { NavLink, Outlet } from 'react-router-dom'
import { useAuth } from '../context/AuthContext'

const tabs = [
  { to: '/', label: 'Membros', icon: '👥', end: true },
  { to: '/aniversariantes', label: 'Aniversários', icon: '🎂', end: false },
  { to: '/visitantes', label: 'Visitantes', icon: '📋', end: false },
  { to: '/obreiros', label: 'Obreiros', icon: '🛠️', end: false },
  { to: '/parentescos', label: 'Parentescos', icon: '👪', end: false },
  { to: '/cultos', label: 'Cultos', icon: '⛪', end: false },
]

export default function Layout() {
  const { user, signOut } = useAuth()

  return (
    <div className="min-h-svh flex flex-col bg-[#f6f7fb]">
      <header className="no-print sticky top-0 z-10 bg-gradient-to-r from-brand-navy-dark via-brand-navy to-brand-navy-light text-white shadow-lg shadow-brand-navy/10">
        <div className="max-w-2xl mx-auto px-4 py-3 flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <img src="/icons/icon-192.png" alt="" className="w-8 h-8 rounded-lg shadow-sm ring-1 ring-white/20" />
            <span className="font-display font-semibold tracking-tight">Cadastro Salém</span>
          </div>
          <button
            onClick={signOut}
            title={user?.email}
            className="text-xs font-medium bg-white/10 hover:bg-white/20 active:scale-95 rounded-lg px-3 py-1.5 transition"
          >
            Sair
          </button>
        </div>
      </header>

      <main className="flex-1 max-w-2xl w-full mx-auto px-4 py-5 pb-28">
        <Outlet />
      </main>

      <nav className="no-print fixed bottom-0 inset-x-0 bg-white/95 backdrop-blur border-t border-slate-200/70 shadow-[0_-4px_20px_rgba(15,23,42,0.06)] pb-[env(safe-area-inset-bottom)]">
        <div className="max-w-2xl mx-auto grid grid-cols-6">
          {tabs.map((tab) => (
            <NavLink
              key={tab.to}
              to={tab.to}
              end={tab.end}
              className={({ isActive }) =>
                `flex flex-col items-center justify-center gap-1 py-2.5 text-[11px] font-medium transition ${
                  isActive ? 'text-brand-navy' : 'text-slate-400'
                }`
              }
            >
              {({ isActive }) => (
                <>
                  <span
                    className={`w-9 h-8 flex items-center justify-center rounded-xl text-base leading-none transition ${
                      isActive ? 'bg-brand-navy/10' : ''
                    }`}
                  >
                    {tab.icon}
                  </span>
                  {tab.label}
                </>
              )}
            </NavLink>
          ))}
        </div>
      </nav>
    </div>
  )
}
