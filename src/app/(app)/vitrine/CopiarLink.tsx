'use client'
import { useState } from 'react'

export function CopiarLink({ link }: { link: string }) {
  const [ok, setOk] = useState(false)
  return (
    <button
      type="button"
      className="lv-btn sec pq"
      onClick={async () => { try { await navigator.clipboard.writeText(link); setOk(true); setTimeout(() => setOk(false), 2000) } catch {} }}
    >
      {ok ? 'Copiado ✓' : 'Copiar link'}
    </button>
  )
}
