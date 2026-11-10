import { ArrowLeft, Check, LogOut, Plus, Shield, Trash2 } from 'lucide-react'
import { Link } from 'react-router-dom'
import { FormEvent, useCallback, useEffect, useState } from 'react'
import { DatabaseNotice, ErrorMessage, Loading } from '../components/Status'
import { isSupabaseConfigured, supabase } from '../lib/supabase'
import { formatDate, type WeekRecord } from '../types'

const EMPTY_WEIGHTS = { ana: '', luis: '', sabrina: '' }

export default function AdminPage() {
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [sessionEmail, setSessionEmail] = useState<string | null>(null)
  const [isAdmin, setIsAdmin] = useState(false)
  const [records, setRecords] = useState<WeekRecord[]>([])
  const [date, setDate] = useState('')
  const [weights, setWeights] = useState(EMPTY_WEIGHTS)
  const [loading, setLoading] = useState(isSupabaseConfigured)
  const [saving, setSaving] = useState(false)
  const [message, setMessage] = useState('')
  const [error, setError] = useState('')

  const refreshRecords = useCallback(async () => {
    if (!supabase) return
    const { data, error: queryError } = await supabase
      .from('weekly_weights')
      .select('week_date, ana, luis, sabrina')
      .order('week_date', { ascending: false })
    if (queryError) setError(`Não foi possível carregar os pesos: ${queryError.message}`)
    else setRecords((data ?? []) as WeekRecord[])
  }, [])

  useEffect(() => {
    if (!supabase) return
    const client = supabase
    let active = true
    client.auth.getSession().then(async ({ data, error: sessionError }) => {
      if (sessionError) {
        if (active) {
          setError(`Não foi possível verificar o acesso: ${sessionError.message}`)
          setLoading(false)
        }
        return
      }
      const currentEmail = data.session?.user.email ?? null
      if (currentEmail) {
        const { data: adminResult, error: adminError } = await client.rpc('is_site_admin')
        if (!active) return
        if (adminError) setError(`Não foi possível verificar a permissão: ${adminError.message}`)
        else if (adminResult === true) {
          setSessionEmail(currentEmail)
          setIsAdmin(true)
          await refreshRecords()
        } else {
          setError('Esta conta não tem permissão para registrar pesos.')
        }
      }
      if (active) setLoading(false)
    })
    const { data: listener } = client.auth.onAuthStateChange((event) => {
      if (active && event === 'SIGNED_OUT') {
        setSessionEmail(null)
        setIsAdmin(false)
      }
    })
    return () => {
      active = false
      listener.subscription.unsubscribe()
    }
  }, [refreshRecords])

  async function handleLogin(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()
    if (!supabase) return
    setError('')
    setLoading(true)
    const { data, error: loginError } = await supabase.auth.signInWithPassword({ email, password })
    if (loginError) {
      setError(`Não foi possível entrar: ${loginError.message}`)
      setLoading(false)
      return
    }
    const { data: adminResult, error: adminError } = await supabase.rpc('is_site_admin')
    if (adminError) {
      setError(`Não foi possível verificar a permissão: ${adminError.message}`)
      await supabase.auth.signOut()
    } else if (adminResult !== true) {
      setError('Esta conta não está autorizada a registrar pesos.')
      await supabase.auth.signOut()
    } else {
      setSessionEmail(data.user.email ?? email)
      setIsAdmin(true)
      await refreshRecords()
    }
    setLoading(false)
  }

  async function handleSave(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()
    if (!supabase) return
    setError('')
    setMessage('')
    const parsedWeights = {
      ana: Number(weights.ana.replace(',', '.')),
      luis: Number(weights.luis.replace(',', '.')),
      sabrina: Number(weights.sabrina.replace(',', '.')),
    }
    if (!date || Object.values(parsedWeights).some((value) => !Number.isFinite(value) || value < 20 || value > 500)) {
      setError('Informe a data e os três pesos entre 20 e 500 kg.')
      return
    }
    setSaving(true)
    const { error: saveError } = await supabase.from('weekly_weights').upsert({
      week_date: date,
      ...parsedWeights,
    }, { onConflict: 'week_date' })
    if (saveError) setError(`Não foi possível salvar os pesos: ${saveError.message}`)
    else {
      setMessage('Pesos salvos. O placar e os gráficos já foram atualizados.')
      setWeights(EMPTY_WEIGHTS)
      await refreshRecords()
    }
    setSaving(false)
  }

  async function handleDelete(weekDate: string) {
    if (!supabase) return
    setError('')
    setMessage('')
    const { error: deleteError } = await supabase.from('weekly_weights').delete().eq('week_date', weekDate)
    if (deleteError) setError(`Não foi possível excluir a pesagem: ${deleteError.message}`)
    else {
      setMessage('Pesagem excluída.')
      await refreshRecords()
    }
  }

  async function handleLogout() {
    if (!supabase) return
    const { error: logoutError } = await supabase.auth.signOut()
    if (logoutError) setError(`Não foi possível sair: ${logoutError.message}`)
    setSessionEmail(null)
    setIsAdmin(false)
  }

  return (
    <>
      <Link to="/" className="back-link"><ArrowLeft size={16} /> Voltar para a visão geral</Link>
      <section className="admin-heading">
        <span className="admin-lock"><Shield size={22} /></span>
        <div><span className="section-kicker">ACESSO RESTRITO</span><h1>Painel de controle</h1><p>Só a pessoa administradora pode publicar e atualizar os pesos.</p></div>
      </section>
      {!isSupabaseConfigured && <DatabaseNotice />}
      {error && <ErrorMessage message={error} />}
      {message && <div className="status-card status-success" role="status"><Check size={20} /><span>{message}</span></div>}

      {loading ? <Loading label="Verificando acesso..." /> : !isSupabaseConfigured ? null : !isAdmin ? (
        <form className="panel login-panel" onSubmit={handleLogin}>
          <h2>Entrar como administrador</h2>
          <p>Use a conta cadastrada no Supabase para gerenciar as pesagens.</p>
          <label className="form-label" htmlFor="admin-email">E-mail</label>
          <input className="text-input" id="admin-email" type="email" autoComplete="username" required value={email} onChange={(event) => setEmail(event.target.value)} />
          <label className="form-label" htmlFor="admin-password">Senha</label>
          <input className="text-input" id="admin-password" type="password" autoComplete="current-password" required value={password} onChange={(event) => setPassword(event.target.value)} />
          <button className="primary-button" type="submit">Entrar <ArrowLeft size={16} className="login-arrow" /></button>
          <span className="login-footnote"><Shield size={14} /> Acesso protegido pelas permissões do banco de dados.</span>
        </form>
      ) : (
        <div className="admin-content">
          <section className="panel admin-session">
            <span><span className="online-dot" /> Conectado como <strong>{sessionEmail}</strong></span>
            <button type="button" className="text-button" onClick={handleLogout}><LogOut size={15} /> Sair</button>
          </section>
          <form className="panel add-week-panel" onSubmit={handleSave}>
            <div className="section-heading">
              <div><span className="section-kicker">ATUALIZAR O PLACAR</span><h2>Registrar pesagem da semana</h2></div>
            </div>
            <label className="form-label" htmlFor="week-date">Data da pesagem</label>
            <input className="text-input date-input" id="week-date" type="date" required value={date} onChange={(event) => setDate(event.target.value)} />
            <div className="weight-input-grid">
              {(['ana', 'luis', 'sabrina'] as const).map((personId) => (
                <label key={personId} className="weight-field">
                  <span>{personId[0].toUpperCase() + personId.slice(1)}</span>
                  <span className="input-suffix">
                    <input type="number" min="20" max="500" step="0.1" inputMode="decimal" placeholder="00,0" required value={weights[personId]} onChange={(event) => setWeights((previous) => ({ ...previous, [personId]: event.target.value }))} />
                    <small>kg</small>
                  </span>
                </label>
              ))}
            </div>
            <p className="form-hint">Se a data já existir, salvar novamente atualiza os pesos daquela semana.</p>
            <button className="primary-button" type="submit" disabled={saving}>{saving ? 'Salvando...' : <><Plus size={17} /> Salvar pesagem</>}</button>
          </form>
          <section className="section-block saved-weeks">
            <div className="section-heading"><div><span className="section-kicker">HISTÓRICO ADMINISTRATIVO</span><h2>Pesagens registradas</h2></div></div>
            {!records.length ? <div className="panel empty-history">Nenhuma pesagem registrada ainda.</div> : (
              <div className="panel history-table">
                <div className="history-row admin-history-header"><span>DATA</span><span>ANA</span><span>LUIS</span><span>SABRINA</span><span /></div>
                {records.map((record) => (
                  <div className="history-row admin-history-row" key={record.week_date}>
                    <span>{formatDate(record.week_date, { day: 'numeric', month: 'short', year: 'numeric' })}</span>
                    <strong>{record.ana.toFixed(1)} kg</strong><strong>{record.luis.toFixed(1)} kg</strong><strong>{record.sabrina.toFixed(1)} kg</strong>
                    <button className="icon-button danger-button" type="button" onClick={() => void handleDelete(record.week_date)} aria-label={`Excluir pesagem de ${formatDate(record.week_date)}`}><Trash2 size={16} /></button>
                  </div>
                ))}
              </div>
            )}
          </section>
        </div>
      )}
    </>
  )
}
