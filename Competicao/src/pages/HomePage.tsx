import { ArrowDownRight, ArrowRight, CalendarDays, Trophy } from 'lucide-react'
import { Link } from 'react-router-dom'
import { useEffect, useState } from 'react'
import ProgressChart from '../components/ProgressChart'
import { DatabaseNotice, ErrorMessage, Loading } from '../components/Status'
import { isSupabaseConfigured, supabase } from '../lib/supabase'
import {
  formatDate,
  getLoss,
  getLossPercentage,
  PEOPLE,
  type Person,
  type WeekRecord,
} from '../types'

export default function HomePage() {
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

  const currentWeek = records[records.length - 1]
  const ranking = PEOPLE.map((person) => ({
    person,
    loss: getLoss(records, person),
    percentage: getLossPercentage(records, person),
  })).sort((a, b) => (b.loss ?? -Infinity) - (a.loss ?? -Infinity))
  const winner = ranking[0]?.loss !== null && (ranking[0]?.loss ?? 0) > 0
    ? ranking[0].person
    : null

  return (
    <>
      <section className="hero">
        <div className="hero-copy">
          <div className="eyebrow"><span className="eyebrow-dot" /> DESAFIO EM ANDAMENTO</div>
          <h1>Pequenos passos.<br /><span>Grandes mudanças.</span></h1>
          <p>Uma jornada compartilhada, uma semana de cada vez. Acompanhe a evolução de todo mundo.</p>
          <div className="hero-meta">
            <span><Trophy size={16} /> Ana · Luis · Sabrina</span>
            {currentWeek && <span><CalendarDays size={16} /> Atualizado em {formatDate(currentWeek.week_date)}</span>}
          </div>
        </div>
        <div className="hero-art" aria-hidden="true">
          <div className="art-orbit orbit-one" />
          <div className="art-orbit orbit-two" />
          <div className="art-center"><img src="/logo.svg" alt="" /></div>
          <span className="art-star star-one">✳</span>
          <span className="art-star star-two">✳</span>
          <span className="art-label">JUNTOS<br />NESSA</span>
        </div>
      </section>

      {!isSupabaseConfigured && <DatabaseNotice />}
      {error && <ErrorMessage message={error} />}

      <section className="section-block leaderboard-section">
        <div className="section-heading">
          <div>
            <span className="section-kicker">PLACAR DA COMPETIÇÃO</span>
            <h2>Quem está na frente?</h2>
          </div>
          <span className="week-count">{records.length} {records.length === 1 ? 'semana' : 'semanas'}</span>
        </div>
        {loading ? <Loading /> : (
          <div className="leaderboard">
            {ranking.map((item, index) => (
              <RankingCard
                key={item.person.id}
                person={item.person}
                rank={index + 1}
                loss={item.loss}
                percentage={item.percentage}
                winner={winner?.id === item.person.id}
                currentWeight={currentWeek?.[item.person.id] ?? null}
              />
            ))}
          </div>
        )}
        {records.length === 1 && (
          <p className="supporting-note">O placar da perda começa a contar depois da próxima pesagem. Este é o peso de referência!</p>
        )}
      </section>

      <section className="section-block chart-section">
        <div className="section-heading">
          <div>
            <span className="section-kicker">EVOLUÇÃO SEMANAL</span>
            <h2>A jornada em números</h2>
          </div>
          <div className="chart-legend">
            {PEOPLE.map((person) => (
              <span key={person.id}><i style={{ backgroundColor: person.color }} />{person.name}</span>
            ))}
          </div>
        </div>
        <div className="panel chart-panel">
          {loading ? <Loading /> : <ProgressChart records={records} />}
        </div>
      </section>

      <section className="section-block people-section">
        <div className="section-heading">
          <div>
            <span className="section-kicker">CADA PASSO CONTA</span>
            <h2>Veja cada jornada</h2>
          </div>
        </div>
        <div className="people-grid">
          {PEOPLE.map((person) => (
            <Link key={person.id} to={`/participante/${person.id}`} className="person-link-card">
              <span className={`avatar avatar-${person.id}`}>{person.name.slice(0, 1)}</span>
              <span className="person-card-copy"><strong>{person.name}</strong><small>Ver progresso individual</small></span>
              <ArrowRight size={18} />
            </Link>
          ))}
        </div>
      </section>

      <Link to="/imc" className="bmi-banner">
        <span className="bmi-banner-icon"><ArrowDownRight size={22} /></span>
        <span><strong>Curioso sobre seu IMC?</strong><small>Calcule com seu peso mais recente, sem salvar nenhum dado.</small></span>
        <ArrowRight className="bmi-banner-arrow" size={20} />
      </Link>
    </>
  )
}

function RankingCard({
  person,
  rank,
  loss,
  percentage,
  winner,
  currentWeight,
}: {
  person: Person
  rank: number
  loss: number | null
  percentage: number | null
  winner: boolean
  currentWeight: number | null
}) {
  const lossText = loss === null ? '—' : `${loss > 0 ? '−' : '+'}${Math.abs(loss).toFixed(1)} kg`
  const percentageText = percentage === null ? 'Aguardando nova semana' : `${Math.abs(percentage).toFixed(1)}% ${loss! > 0 ? 'a menos' : 'de variação'}`

  return (
    <Link to={`/participante/${person.id}`} className={`ranking-card ${winner ? 'is-winner' : ''}`}>
      <span className={`rank-number ${winner ? 'rank-winner' : ''}`}>{winner ? <Trophy size={18} /> : `0${rank}`}</span>
      <span className={`avatar avatar-${person.id}`}>{person.name.slice(0, 1)}</span>
      <span className="ranking-name"><strong>{person.name}</strong><small>{percentageText}</small></span>
      <span className="ranking-weight">{currentWeight === null ? '—' : `${currentWeight.toFixed(1)} kg`}<small>peso atual</small></span>
      <span className={`loss-value ${loss !== null && loss > 0 ? 'loss-positive' : ''}`}>{lossText}<small>{winner ? 'na liderança' : 'perda total'}</small></span>
      <ArrowRight className="ranking-arrow" size={17} />
    </Link>
  )
}
