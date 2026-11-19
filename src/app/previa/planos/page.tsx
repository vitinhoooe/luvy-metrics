import { TabelaPlanos } from '../../(app)/planos/TabelaPlanos'

export default function PreviaPlanos() {
  return (
    <>
      <div className="lv-top"><div><h1>Planos</h1><p>Você está no teste do Pro: 6 dias restantes.</p></div></div>
      <TabelaPlanos assinatura={{ plano: 'pro', status: 'teste', teste_ate: new Date(Date.now() + 6 * 864e5).toISOString(), pago_ate: null }} loja="Amor & Cia" />
    </>
  )
}
