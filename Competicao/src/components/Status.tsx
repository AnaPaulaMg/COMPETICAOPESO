import { AlertCircle, LoaderCircle } from 'lucide-react'

export function Loading({ label = 'Carregando os dados...' }: { label?: string }) {
  return (
    <div className="status-card" role="status">
      <LoaderCircle className="spin" size={21} />
      <span>{label}</span>
    </div>
  )
}

export function ErrorMessage({ message }: { message: string }) {
  return (
    <div className="status-card status-error" role="alert">
      <AlertCircle size={21} />
      <span>{message}</span>
    </div>
  )
}

export function DatabaseNotice() {
  return (
    <div className="status-card status-warning" role="status">
      <AlertCircle size={21} />
      <span>
        O banco de dados ainda não foi conectado. Configure as variáveis do
        Supabase para publicar os pesos.
      </span>
    </div>
  )
}
