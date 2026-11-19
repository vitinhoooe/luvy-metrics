import Link from 'next/link'
import { exigirLoja } from '@/lib/sessao'
import { diasRestantesTeste, pode, PLANOS } from '@/lib/planos'
import { AlertaPedidos } from '@/components/AlertaPedidos'
import { BarraInferior, Lateral } from './Navegacao'
import '../app.css'
import { Logotipo } from '@/components/Marca'

export default async function AppLayout({ children }: { children: React.ReactNode }) {
  const { loja, assinatura, podeEditar } = await exigirLoja()
  const dias = diasRestantesTeste(assinatura)

  let aviso: React.ReactNode = null
  if (!podeEditar) {
    aviso = (
      <div className="lv-aviso bloqueio" role="status">
        <span><strong>{assinatura.status === 'teste' ? 'Seu teste terminou.' : 'Seu plano está inativo.'}</strong> Seus dados estão guardados. Para voltar a vender e editar, escolha um plano.</span>
        <Link href="/planos" className="lv-btn pq">Escolher plano</Link>
      </div>
    )
  } else if (assinatura.status === 'teste') {
    aviso = (
      <div className={`lv-aviso${dias <= 2 ? ' alerta' : ''}`} role="status">
        <span className="lv-selo escuro">Teste {PLANOS[assinatura.plano].nome}</span>
        <span>{dias <= 1 ? <strong>Seu teste acaba hoje.</strong> : <>Faltam <strong>{dias} dias</strong> do seu teste grátis.</>}</span>
        <Link href="/planos" className="lv-btn sec pq">Ver planos</Link>
      </div>
    )
  } else if (assinatura.status === 'atrasado') {
    aviso = (
      <div className="lv-aviso alerta" role="status">
        <span><strong>Pagamento pendente.</strong> Regularize em até 3 dias para não perder o acesso.</span>
        <Link href="/planos" className="lv-btn pq">Regularizar</Link>
      </div>
    )
  }

  return (
    <div className="lv">
      <div className="lv-shell">
        <Lateral loja={loja.nome} cidade={`${loja.cidade} · ${loja.uf}`} />
        <main className="lv-main">
          <div className="lv-mobile-topo">
            <Logotipo tom="escuro" />
            <span className="lv-mobile-loja">{loja.nome}</span>
          </div>
          {aviso}
          {children}
        </main>
      </div>
      <BarraInferior />
      {pode(assinatura, 'vitrine') && <AlertaPedidos />}
    </div>
  )
}
