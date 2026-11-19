import { redirect } from 'next/navigation'
import type { Metadata } from 'next'
import { contexto } from '@/lib/sessao'
import { FormComecar } from './FormComecar'
import '../app.css'
import { Logotipo } from '@/components/Marca'

export const metadata: Metadata = { title: 'Sua loja' }

export default async function Comecar() {
  const { user, loja } = await contexto()
  if (!user) redirect('/entrar')
  if (loja) redirect('/painel')
  return (
    <div className="lv">
      <div className="lv-comecar">
        <div className="lv-card">
          <div style={{ marginBottom: 22 }}><Logotipo tom="escuro" animar /></div>
          <h1 style={{ fontSize: 26, letterSpacing: '-.03em', marginBottom: 6 }}>Conte sobre sua loja</h1>
          <p style={{ color: 'var(--dim)', marginBottom: 22 }}>Com isso já montamos seu painel. Dá para mudar tudo depois.</p>
          <FormComecar />
        </div>
      </div>
    </div>
  )
}
