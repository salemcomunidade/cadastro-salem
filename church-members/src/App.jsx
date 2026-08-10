import { Navigate, Route, Routes } from 'react-router-dom'
import { AuthProvider, useAuth } from './context/AuthContext'
import LoginPage from './components/LoginPage'
import Layout from './components/Layout'
import MemberList from './components/MemberList'
import MemberForm from './components/MemberForm'
import BirthdayReport from './components/BirthdayReport'
import VisitorsByDateReport from './components/VisitorsByDateReport'
import DepartmentsReport from './components/DepartmentsReport'
import RelationshipsReport from './components/RelationshipsReport'
import CultosList from './components/CultosList'
import CultoForm from './components/CultoForm'
import CultoReport from './components/CultoReport'

function PrivateArea() {
  const { session, loading } = useAuth()

  if (loading) {
    return <div className="min-h-svh flex items-center justify-center text-slate-500">Carregando...</div>
  }

  if (!session) {
    return <LoginPage />
  }

  return (
    <Routes>
      <Route element={<Layout />}>
        <Route path="/" element={<MemberList />} />
        <Route path="/membros/novo" element={<MemberForm />} />
        <Route path="/membros/:id" element={<MemberForm />} />
        <Route path="/aniversariantes" element={<BirthdayReport />} />
        <Route path="/visitantes" element={<VisitorsByDateReport />} />
        <Route path="/departamentos" element={<DepartmentsReport />} />
        <Route path="/parentescos" element={<RelationshipsReport />} />
        <Route path="/cultos" element={<CultosList />} />
        <Route path="/cultos/novo" element={<CultoForm />} />
        <Route path="/cultos/relatorio" element={<CultoReport />} />
        <Route path="/cultos/:id" element={<CultoForm />} />
        <Route path="*" element={<Navigate to="/" replace />} />
      </Route>
    </Routes>
  )
}

export default function App() {
  return (
    <AuthProvider>
      <PrivateArea />
    </AuthProvider>
  )
}
