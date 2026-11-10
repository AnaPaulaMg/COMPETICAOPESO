import { Route, Routes } from 'react-router-dom'
import Layout from './components/Layout'
import AdminPage from './pages/AdminPage'
import BmiPage from './pages/BmiPage'
import HomePage from './pages/HomePage'
import ParticipantPage from './pages/ParticipantPage'

export default function App() {
  return (
    <Routes>
      <Route element={<Layout />}>
        <Route index element={<HomePage />} />
        <Route path="participante/:slug" element={<ParticipantPage />} />
        <Route path="imc" element={<BmiPage />} />
        <Route path="admin" element={<AdminPage />} />
        <Route path="*" element={<HomePage />} />
      </Route>
    </Routes>
  )
}
