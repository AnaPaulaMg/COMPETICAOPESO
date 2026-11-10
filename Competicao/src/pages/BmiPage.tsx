import { ArrowLeft, Check, HeartPulse, Ruler } from 'lucide-react'
import { Link } from 'react-router-dom'
import { useEffect, useMemo, useState } from 'react'
import { DatabaseNotice, ErrorMessage, Loading } from '../components/Status'
import { isSupabaseConfigured, supabase } from '../lib/supabase'
import { PEOPLE, type WeekRecord } from '../types'

export default function BmiPage() {
  const [selectedId, setSelectedId] = useState(PEOPLE[0].id)
  const [height, setHeight] = useState('')
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

  const participant = PEOPLE.find((person) => person.id === selectedId)!
  const currentWeight = records[records.length - 1]?.[selectedId] ?? null
  const heightInMeters = Number(height.replace(',', '.')) / 100
  const bmi = useMemo(() => {
    if (!currentWeight || !heightInMeters || heightInMeters < 0.8 || heightInMeters > 2.5) return null
    return currentWeight / (heightInMeters * heightInMeters)
  }, [currentWeight, heightInMeters])
  const healthyWeight = heightInMeters ? 24.9 * heightInMeters * heightInMeters : null
  const weightToLose = bmi !== null && healthyWeight !== null && bmi > 24.9
    ? currentWeight! - healthyWeight
    : 0

  return (
    <>
      <Link to="/" className="back-link"><ArrowLeft size={16} /> Voltar para a visão geral</Link>
      <section className="bmi-page-hero">
        <span className="bmi-large-icon"><HeartPulse size={25} /></span>
        <span className="section-kicker">UMA REFERÊNCIA PARA VOCÊ</span>
        <h1>Seu corpo, <span>seus números.</span></h1>
        <p>Confira seu IMC e veja a distância até a faixa considerada saudável, usando o peso mais recente da competição.</p>
      </section>
      {!isSupabaseConfigured && <DatabaseNotice />}
      {error && <ErrorMessage message={error} />}

      <div className="bmi-layout">
        <section className="panel bmi-form-panel">
          <div className="section-heading">
            <div><span className="section-kicker">CALCULADORA</span><h2>Seus dados</h2></div>
          </div>
          {loading ? <Loading /> : (
            <>
              <label className="form-label" htmlFor="person">Quem está calculando?</label>
              <div className="person-select" role="group" aria-label="Selecione a pessoa">
                {PEOPLE.map((person) => (
                  <button
                    className={selectedId === person.id ? 'selected' : ''}
                    key={person.id}
                    type="button"
                    onClick={() => setSelectedId(person.id)}
                  >
                    <span className={`avatar avatar-${person.id}`}>{person.name.slice(0, 1)}</span>
                    {person.name}
                  </button>
                ))}
              </div>
              <div className="weight-source">
                <span className="source-check"><Check size={14} /></span>
                <span><small>PESO MAIS RECENTE</small><strong>{currentWeight === null ? 'Ainda não registrado' : `${currentWeight.toFixed(1)} kg`}</strong></span>
                {currentWeight !== null && <Link to={`/participante/${participant.id}`}>Ver dados</Link>}
              </div>
              <label className="form-label" htmlFor="height">Sua altura</label>
              <div className="input-with-icon">
                <Ruler size={18} />
                <input
                  id="height"
                  type="number"
                  min="80"
                  max="250"
                  step="1"
                  inputMode="decimal"
                  placeholder="Ex.: 165"
                  value={height}
                  onChange={(event) => setHeight(event.target.value)}
                />
                <span>cm</span>
              </div>
              <p className="form-hint">Sua altura fica só neste dispositivo. Não salvamos nenhum dado pessoal.</p>
            </>
          )}
        </section>

        <section className="panel bmi-result-panel">
          <span className="section-kicker">SEU RESULTADO</span>
          {loading ? <Loading /> : currentWeight === null ? (
            <div className="bmi-placeholder"><span className="bmi-placeholder-icon"><HeartPulse size={23} /></span><h2>Aguardando a primeira pesagem</h2><p>Assim que houver um peso registrado para {participant.name}, você poderá calcular seu IMC por aqui.</p></div>
          ) : !height || !bmi ? (
            <div className="bmi-placeholder"><span className="bmi-placeholder-icon"><Ruler size={23} /></span><h2>Informe sua altura</h2><p>Com seu peso mais recente e sua altura, mostramos seu IMC e uma estimativa de referência.</p></div>
          ) : (
            <>
              <div className="bmi-number">{bmi.toFixed(1)}</div>
              <span className={`bmi-tag ${bmi < 18.5 ? 'bmi-tag-caution' : bmi < 25 ? 'bmi-tag-good' : 'bmi-tag-neutral'}`}>
                {bmi < 18.5 ? 'Abaixo da faixa de referência' : bmi < 25 ? 'Na faixa de referência' : bmi < 30 ? 'Acima da faixa de referência' : 'Bem acima da faixa de referência'}
              </span>
              <div className="bmi-meter"><span style={{ left: `${Math.min(Math.max((bmi / 40) * 100, 2), 98)}%` }} /></div>
              <div className="meter-labels"><span>18,5</span><span>24,9</span></div>
              <div className="weight-goal">
                {weightToLose > 0 ? (
                  <><strong>{weightToLose.toFixed(1)} kg</strong><span>até o limite superior da faixa de referência para sua altura.</span></>
                ) : bmi < 18.5 ? (
                  <><strong>Cuide de você</strong><span>Seu IMC está abaixo da faixa de referência. Procure orientação de um profissional de saúde.</span></>
                ) : (
                  <><strong>Você está na faixa!</strong><span>Seu IMC está dentro da faixa de referência para adultos.</span></>
                )}
              </div>
              <p className="bmi-disclaimer">IMC é uma estimativa geral para adultos, não substitui avaliação profissional e não considera composição corporal.</p>
            </>
          )}
        </section>
      </div>
    </>
  )
}
