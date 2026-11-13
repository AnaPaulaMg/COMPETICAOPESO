import { useMemo } from 'react'
import { formatDate, PEOPLE, type Person, type WeekRecord } from '../types'

type Props = {
  records: WeekRecord[]
  people?: Person[]
  selected?: Person
}

const WIDTH = 720
const HEIGHT = 252
const PAD = { top: 18, right: 24, bottom: 42, left: 44 }

export default function ProgressChart({ records, people = PEOPLE, selected }: Props) {
  const chartPeople = selected ? [selected] : people
  const { paths, labels, min, max } = useMemo(() => {
    const values = records.flatMap((record) =>
      chartPeople.map((person) => record[person.id]),
    )
    const floor = values.length ? Math.floor(Math.min(...values) - 2) : 0
    const ceil = values.length ? Math.ceil(Math.max(...values) + 2) : 100
    const x = (index: number) =>
      PAD.left +
      (records.length <= 1
        ? (WIDTH - PAD.left - PAD.right) / 2
        : (index / (records.length - 1)) * (WIDTH - PAD.left - PAD.right))
    const y = (value: number) =>
      PAD.top +
      ((ceil - value) / Math.max(ceil - floor, 1)) *
        (HEIGHT - PAD.top - PAD.bottom)

    return {
      min: floor,
      max: ceil,
      labels: records.map((record, index) => ({
        x: x(index),
        value: formatDate(record.week_date, { day: 'numeric', month: 'short' }),
      })),
      paths: chartPeople.map((person) => ({
        ...person,
        points: records
          .map((record, index) => `${x(index)},${y(record[person.id])}`)
          .join(' '),
        circles: records.map((record, index) => ({
          x: x(index),
          y: y(record[person.id]),
          value: record[person.id],
        })),
      })),
    }
  }, [chartPeople, records])

  if (!records.length) {
    return (
      <div className="chart-empty">
        <span className="empty-icon">
          <span />
          <span />
          <span />
        </span>
        <p>O gráfico ganha vida assim que os primeiros pesos forem registrados.</p>
      </div>
    )
  }

  const yPosition = (value: number) =>
    PAD.top +
    ((max - value) / Math.max(max - min, 1)) *
      (HEIGHT - PAD.top - PAD.bottom)

  return (
    <div className="chart-wrap">
      <svg
        className="progress-chart"
        viewBox={`0 0 ${WIDTH} ${HEIGHT}`}
        preserveAspectRatio="none"
        role="img"
        aria-label={
          selected
            ? `Evolução de peso de ${selected.name} por semana`
            : 'Evolução semanal de peso dos participantes'
        }
      >
        {[0, 1, 2, 3].map((step) => {
          const value = min + ((max - min) * step) / 3
          return (
            <g key={step}>
              <line
                x1={PAD.left}
                x2={WIDTH - PAD.right}
                y1={yPosition(value)}
                y2={yPosition(value)}
                className="chart-grid"
              />
              <text x={PAD.left - 10} y={yPosition(value) + 4} className="chart-axis">
                {value.toFixed(0)}
              </text>
            </g>
          )
        })}
        <text
          x="14"
          y={HEIGHT / 2}
          className="chart-unit"
          transform={`rotate(-90 14 ${HEIGHT / 2})`}
        >
          kg
        </text>
        {paths.map((path) => (
          <g key={path.id}>
            {records.length > 1 && (
              <polyline
                points={path.points}
                fill="none"
                stroke={path.color}
                strokeWidth="3"
                strokeLinecap="round"
                strokeLinejoin="round"
              />
            )}
            {path.circles.map((point, index) => (
              <circle
                key={`${path.id}-${index}`}
                cx={point.x}
                cy={point.y}
                r="5"
                fill={path.color}
                stroke="#fff"
                strokeWidth="2"
              >
                <title>{`${path.name}: ${point.value.toFixed(1)} kg`}</title>
              </circle>
            ))}
          </g>
        ))}
        {labels.map((label, index) => (
          <text
            key={`${label.value}-${index}`}
            x={label.x}
            y={HEIGHT - 12}
            className="chart-axis chart-date"
            textAnchor="middle"
          >
            {label.value}
          </text>
        ))}
      </svg>
    </div>
  )
}
