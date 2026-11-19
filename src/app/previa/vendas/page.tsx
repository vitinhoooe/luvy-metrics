import Link from 'next/link'
import { brl } from '@/lib/formato'
import { Numero } from '@/components/Numero'

const VENDAS = [
  { n: 128, quando: '14/11 17:42', canal: 'Balcão', forma: 'Pix', total: 114.7, lucro: 61.2 },
  { n: 127, quando: '14/11 16:05', canal: 'WhatsApp', forma: 'Pix', total: 89.9, lucro: 51.9 },
  { n: 126, quando: '14/11 14:31', canal: 'Balcão', forma: 'Dinheiro', total: 46.8, lucro: 28.6 },
  { n: 125, quando: '14/11 11:18', canal: 'Balcão', forma: 'Débito', total: 119, lucro: 67 },
  { n: 124, quando: '13/11 19:50', canal: 'Instagram', forma: 'Pix', total: 64.8, lucro: 33.1 },
  { n: 123, quando: '13/11 15:12', canal: 'Balcão', forma: 'Crédito', total: 209.7, lucro: 98.4 },
]

export default function PreviaVendas() {
  return (
    <>
      <div className="lv-top"><div><h1>Vendas</h1><p>Balcão, WhatsApp, Instagram e vitrine num lugar só · dados de exemplo</p></div><div className="lv-acoes"><Link href="/previa/importar-vendas" className="lv-btn sec">Importar vendas antigas</Link></div></div>
      <div className="lv-chips" style={{ marginBottom: 14 }}>
        <span className="lv-chip">Hoje</span><span className="lv-chip">7 dias</span><span className="lv-chip on">Este mês</span><span className="lv-chip">90 dias</span>
      </div>
      <div className="lv-grid c4" style={{ marginBottom: 14 }}>
        <div className="lv-kpi"><span>Faturamento</span><strong><Numero valor={6842.3} /></strong><small>81 vendas</small></div>
        <div className="lv-kpi"><span>Lucro bruto</span><strong><Numero valor={3511.6} /></strong><small>51% de margem</small></div>
        <div className="lv-kpi"><span>Ticket médio</span><strong><Numero valor={84.47} /></strong><small>por venda</small></div>
        <div className="lv-kpi"><span>Por canal</span><strong style={{ fontSize: 16 }}>Balcão 64% · WhatsApp 21% · Instagram 15%</strong><small>onde a loja vende de verdade</small></div>
      </div>
      <div className="lv-tabela-wrap">
        <table className="lv-tabela">
          <thead><tr><th>Venda</th><th className="esconde-cel">Canal</th><th>Pagamento</th><th className="dir">Total</th><th className="dir esconde-cel">Lucro</th></tr></thead>
          <tbody>
            {VENDAS.map((v) => (
              <tr key={v.n}>
                <td><a className="nome">#{v.n}</a><div className="sub">{v.quando}</div></td>
                <td className="esconde-cel">{v.canal}</td>
                <td>{v.forma}</td>
                <td className="dir">{brl(v.total)}</td>
                <td className="dir esconde-cel">{brl(v.lucro)}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </>
  )
}
