'use client'
import { useFormStatus } from 'react-dom'

export function Enviar({
  children,
  enviando = 'Salvando…',
  className = 'lv-btn',
  disabled,
}: {
  children: React.ReactNode
  enviando?: string
  className?: string
  disabled?: boolean
}) {
  const { pending } = useFormStatus()
  return (
    <button type="submit" className={className} disabled={pending || disabled} aria-busy={pending}>
      {pending ? enviando : children}
    </button>
  )
}

export type Estado = { erro?: string; ok?: string } | null

export function Mensagem({ estado }: { estado: Estado }) {
  if (!estado) return null
  if (estado.erro) return <p className="lv-msg erro" role="alert">{estado.erro}</p>
  if (estado.ok) return <p className="lv-msg ok" role="status">{estado.ok}</p>
  return null
}
