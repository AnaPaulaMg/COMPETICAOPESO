export type Person = {
  id: 'ana' | 'luis' | 'sabrina'
  name: string
  color: string
}

export type WeekRecord = {
  week_date: string
  ana: number
  luis: number
  sabrina: number
}

export const PEOPLE: Person[] = [
  { id: 'ana', name: 'Ana', color: '#91b94b' },
  { id: 'luis', name: 'Luis', color: '#6498c5' },
  { id: 'sabrina', name: 'Sabrina', color: '#da8b70' },
]

export function weightFor(record: WeekRecord, personId: Person['id']) {
  return record[personId]
}

export function getLoss(records: WeekRecord[], person: Person) {
  if (records.length < 2) return null
  return records[0][person.id] - records[records.length - 1][person.id]
}

export function getLossPercentage(records: WeekRecord[], person: Person) {
  const loss = getLoss(records, person)
  if (loss === null || records[0][person.id] === 0) return null
  return (loss / records[0][person.id]) * 100
}

export function formatDate(date: string, options?: Intl.DateTimeFormatOptions) {
  return new Intl.DateTimeFormat('pt-BR', options).format(
    new Date(`${date}T12:00:00`),
  )
}
