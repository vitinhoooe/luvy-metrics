// PRÉVIA VISUAL (só em desenvolvimento): mostra as telas internas com dados de exemplo,
// sem precisar de login nem de banco. Em produção esta rota não existe.
import { previaLiberada } from '@/lib/previa'
import Link from 'next/link'
import { notFound } from 'next/navigation'
import { BarraInferior, Lateral } from '../(app)/Navegacao'
import '../app.css'
import { Logotipo } from '@/components/Marca'
import { AlertaPedidos } from '@/components/AlertaPedidos'

export default function PreviaLayout({ children }: { children: React.ReactNode }) {
  if (!previaLiberada()) notFound()
  return (
    <div className="lv">
      <div className="lv-shell">
        <Lateral loja="Amor & Cia" cidade="Recife · PE" previa />
        <main className="lv-main">
          <div className="lv-mobile-topo">
            <Logotipo tom="escuro" /><span className="lv-mobile-loja">Amor & Cia</span>
          </div>
          <div className="lv-aviso" role="status">
            <span className="lv-selo escuro">Teste Pro</span>
            <span>Faltam <strong>6 dias</strong> do seu teste grátis.</span>
            <Link href="/previa/planos" className="lv-btn sec pq">Ver planos</Link>
          </div>
          {children}
        </main>
      </div>
      <BarraInferior previa />
      <AlertaPedidos simular />
    </div>
  )
}
