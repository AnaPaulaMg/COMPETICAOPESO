import { Activity, ArrowUpRight, Calculator, House, Shield } from 'lucide-react'
import { NavLink, Outlet } from 'react-router-dom'

export default function Layout() {
  return (
    <div className="app-shell">
      <header className="topbar">
        <NavLink className="brand" to="/" aria-label="Competição de Peso — início">
          <img src="/logo.svg" alt="" className="brand-logo" />
          <span>
            <strong>COMPETIÇÃO</strong>
            <small>DE PESO</small>
          </span>
        </NavLink>
        <nav className="desktop-nav" aria-label="Navegação principal">
          <NavLink to="/" end>
            Visão geral
          </NavLink>
          <NavLink to="/imc">Calculadora de IMC</NavLink>
        </nav>
        <NavLink className="admin-link" to="/admin">
          <Shield size={16} />
          <span>Área do admin</span>
          <ArrowUpRight size={15} />
        </NavLink>
      </header>
      <main className="page-content">
        <Outlet />
      </main>
      <nav className="mobile-nav" aria-label="Navegação principal">
        <NavLink to="/" end>
          <House size={19} />
          <span>Início</span>
        </NavLink>
        <NavLink to="/imc">
          <Calculator size={19} />
          <span>Meu IMC</span>
        </NavLink>
        <NavLink to="/admin">
          <Activity size={19} />
          <span>Admin</span>
        </NavLink>
      </nav>
      <footer className="site-footer">
        <span>Um passo de cada vez. A evolução é de vocês.</span>
        <span>Competição de Peso · 2026</span>
      </footer>
    </div>
  )
}
