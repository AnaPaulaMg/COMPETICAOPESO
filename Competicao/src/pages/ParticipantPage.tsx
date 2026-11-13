import { ArrowLeft, ArrowUpRight, Scale, TrendingDown } from 'lucide-react'
import { Link, Navigate, useParams } from 'react-router-dom'
import { useEffect, useState } from 'react'
import ProgressChart from '../components/ProgressChart'
import { DatabaseNotice, ErrorMessage, Loading } from '../components/Status'
import { isSupabaseConfigured, supabase } from '../lib/supabase'
import { formatDate, getLoss, getLossPercentage, PEOPLE, type WeekRecord } from '../types'

export default function ParticipantPage() {
  const { slug } = useParams()
  const person = PEOPLE.find((item) => item.id === slug)
  const [records, setRecords] = useState<WeekRecord[]>([])
  const [loading, setLoading] = useState(isSupabaseConfigured)
  const [error, setError] = useState('')

  useEffect(() => {
    if (!supabase) return
    supabase
      .from('weekly_weights')
      .select('week_date, ana, luis, sabrina')
      .order('week_date', { ascending: true })
      .then(({ data, error: queryError }) => {
        if (queryError) setError(`Não foi possível carregar os pesos: ${queryError.message}`)
        else setRecords((data ?? []) as WeekRecord[])
        setLoading(false)
      })
  }, [])

  if (!person) return <Navigate to="/" replace />

  const first = records[0]
  const latest = records[records.length - 1]
  const loss = getLoss(records, person)
  const lossPercent = getLossPercentage(records, person)

  return (
    <>
      <Link to="/" className="back-link"><ArrowLeft size={16} /> Voltar para a visão geral</Link>
      <section className={`profile-hero profile-${person.id}`}>
        <div>
          <span className="section-kicker">JORNADA INDIVIDUAL</span>
          <div className="profile-title"><span className={`avatar avatar-${person.id}`}>{person.name.slice(0, 1)}</span><h1>{person.name}</h1></div>
          <p>A evolução semana a semana, no seu ritmo.</p>
        </div>
        <div className="profile-mark" aria-hidden="true">✳</div>
      </section>
      {!isSupabaseConfigured && <DatabaseNotice />}
      {error && <ErrorMessage message={error} />}

      {loading ? <Loading /> : (
        <>
          <section className="stats-grid">
            <div className="panel stat-card">
              <span className="stat-icon"><Scale size={19} /></span>
              <span className="stat-label">Peso atual</span>
              <strong>{latest ? `${latest[person.id].toFixed(1)} kg` : '—'}</strong>
              <span className="stat-foot">{latest ? `Em ${formatDate(latest.week_date)}` : 'Aguardando pesagem'}</span>
            </div>
            <div className="panel stat-card">
              <span className="stat-icon stat-icon-green"><TrendingDown size={19} /></span>
              <span className="stat-label">Peso perdido</span>
              <strong>{loss === null ? '—' : `${Math.abs(loss).toFixed(1)} kg`}</strong>
              <span className="stat-foot">{first ? `Desde ${formatDate(first.week_date)}` : 'Aguardando pesagem'}</span>
            </div>
            <div className="panel stat-card">
              <span className="stat-icon stat-icon-green"><ArrowUpRight size={19} /></span>
              <span className="stat-label">Variação total</span>
              <strong>{lossPercent === null ? '—' : `${Math.abs(lossPercent).toFixed(1)}%`}</strong>
              <span className="stat-foot">{loss === null ? 'Mais semanas para comparar' : loss > 0 ? 'de redução desde o início' : 'de variação desde o início'}</span>
            </div>
          </section>

          <section className="section-block chart-section">
            <div className="section-heading">
              <div><span className="section-kicker">SEU HISTÓRICO</span><h2>Como você está evoluindo</h2></div>
              <span className="week-count">{records.length} {records.length === 1 ? 'semana' : 'semanas'}</span>
            </div>
            <div className="panel chart-panel"><ProgressChart records={records} selected={person} /></div>
          </section>

          <section className="section-block history-section">
            <div className="section-heading"><div><span className="section-kicker">REGISTROS</span><h2>Pesagem por pesagem</h2></div></div>
            {!records.length ? (
              <div className="panel empty-history">As pesagens de {person.name} aparecerão aqui.</div>
            ) : (
              <div className="panel history-table">
                <div className="history-row history-header"><span>SEMANA</span><span>PESO</span><span>VARIAÇÃO</span></div>
                {records.map((record, index) => {
                  const previous = records[index - 1]
                  const change = previous ? record[person.id] - previous[person.id] : null
                  return (
                    <div className="history-row" key={record.week_date}>
                      <span>{formatDate(record.week_date, { day: 'numeric', month: 'short', year: 'numeric' })}</span>
                      <strong>{record[person.id].toFixed(1)} kg</strong>
                      <span className={change !== null && change < 0 ? 'table-loss' : ''}>
                        {change === null ? 'Peso inicial' : `${change > 0 ? '+' : ''}${change.toFixed(1)} kg`}
                      </span>
                    </div>
                  )
                })}
              </div>
            )}
          </section>
        </>
      )}
    </>
  )
}
