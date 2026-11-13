import { Activity, ArrowUpRight, Calculator, House, Shield } from 'lucide-react'
import { NavLink, Outlet } from 'react-router-dom'
import { useEffect, useState } from 'react'
import { ErrorMessage } from './Status'
import { ADMIN_IDLE_TIMEOUT, ADMIN_LAST_ACTIVITY_KEY } from '../lib/adminSession'
import { supabase } from '../lib/supabase'

export default function Layout() {
  const [sessionError, setSessionError] = useState('')
  const [sessionNotice, setSessionNotice] = useState('')

  useEffect(() => {
    if (!supabase) return
    const client = supabase
    let intervalId: number | null = null
    let signingOut = false
    let lastRecordedAt = Date.now()

    const checkInactivity = () => {
      const lastActivity = Number(window.localStorage.getItem(ADMIN_LAST_ACTIVITY_KEY))
      if (!Number.isFinite(lastActivity) || lastActivity <= 0) {
        lastRecordedAt = Date.now()
        window.localStorage.setItem(ADMIN_LAST_ACTIVITY_KEY, String(lastRecordedAt))
        return
      }
      if (Date.now() - lastActivity < ADMIN_IDLE_TIMEOUT || signingOut) return

      signingOut = true
      void client.auth.signOut().then(({ error }) => {
        if (error) {
          setSessionError(`Não foi possível encerrar a sessão por inatividade: ${error.message}`)
          signingOut = false
          return
        }
        window.localStorage.removeItem(ADMIN_LAST_ACTIVITY_KEY)
        setSessionError('')
        setSessionNotice('Sessão encerrada após 30 minutos de inatividade. Entre novamente.')
      })
    }

    const recordActivity = () => {
      const now = Date.now()
      if (now - lastRecordedAt < 1000) return
      lastRecordedAt = now
      window.localStorage.setItem(ADMIN_LAST_ACTIVITY_KEY, String(now))
    }

    const checkWhenVisible = () => {
      if (document.visibilityState === 'visible') checkInactivity()
    }

    const startMonitoring = () => {
      if (intervalId !== null) return
      lastRecordedAt = Date.now()
      if (!window.localStorage.getItem(ADMIN_LAST_ACTIVITY_KEY)) {
        window.localStorage.setItem(ADMIN_LAST_ACTIVITY_KEY, String(lastRecordedAt))
      }
      window.addEventListener('pointerdown', recordActivity, { passive: true })
      window.addEventListener('pointermove', recordActivity, { passive: true })
      window.addEventListener('keydown', recordActivity, { passive: true })
      window.addEventListener('touchstart', recordActivity, { passive: true })
      window.addEventListener('scroll', recordActivity, { passive: true })
      window.addEventListener('focus', checkInactivity)
      document.addEventListener('visibilitychange', checkWhenVisible)
      intervalId = window.setInterval(checkInactivity, 10_000)
    }

    const stopMonitoring = () => {
      if (intervalId === null) return
      window.clearInterval(intervalId)
      intervalId = null
      window.removeEventListener('pointerdown', recordActivity)
      window.removeEventListener('pointermove', recordActivity)
      window.removeEventListener('keydown', recordActivity)
      window.removeEventListener('touchstart', recordActivity)
      window.removeEventListener('scroll', recordActivity)
      window.removeEventListener('focus', checkInactivity)
      document.removeEventListener('visibilitychange', checkWhenVisible)
    }

    const { data: listener } = client.auth.onAuthStateChange((event, session) => {
      if (event === 'SIGNED_OUT') {
        stopMonitoring()
        window.localStorage.removeItem(ADMIN_LAST_ACTIVITY_KEY)
      } else if (session) {
        if (event === 'SIGNED_IN') {
          setSessionError('')
          setSessionNotice('')
        }
        startMonitoring()
      }
    })

    return () => {
      stopMonitoring()
      listener.subscription.unsubscribe()
    }
  }, [])

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
        {sessionError && <ErrorMessage message={sessionError} />}
        {sessionNotice && <ErrorMessage message={sessionNotice} />}
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
