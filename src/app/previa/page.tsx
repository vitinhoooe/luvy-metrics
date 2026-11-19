import Link from 'next/link'
import { brl } from '@/lib/formato'
import { Icone } from '@/components/Icone'
import { Numero } from '@/components/Numero'
import { Tendencia } from '@/components/Tendencia'
import { PRODUTOS_EXEMPLO } from './exemplo'

const dias = [
  { rotulo: 'dom', total: 212.6 }, { rotulo: 'seg', total: 158.4 }, { rotulo: 'ter', total: 289.7 },
  { rotulo: 'qua', total: 241.2 }, { rotulo: 'qui', total: 318.9 }, { rotulo: 'sex', total: 402.5 }, { rotulo: 'hoje', total: 370.4 },
]

export default function PreviaPainel() {
  const baixo = PRODUTOS_EXEMPLO.filter((p) => p.quantidade <= p.estoque_minimo)
  const vendas = [
    { n: 128, forma: 'Pix', total: 114.7 }, { n: 127, forma: 'Crédito', total: 89.9 },
    { n: 126, forma: 'Dinheiro', total: 46.8 }, { n: 125, forma: 'Débito', total: 119 },
  ]
  return (
    <>
      <div className="lv-top">
        <div>
          <h1>Hoje</h1>
          <p>sábado, 14 de novembro · dados de exemplo</p>
        </div>
        <div className="lv-acoes"><Link href="/previa/vender" className="lv-btn"><Icone nome="vender" />Nova venda</Link></div>
      </div>

      <div className="lv-hoje">
        <div className="lv-kpi destaque">
          <div className="lv-hoje-num">
            <div><span>Vendido hoje</span><strong><Numero valor={370.4} /></strong><small>4 vendas</small></div>
            <div className="lucro"><span>Lucro bruto hoje</span><strong><Numero valor={198.1} /></strong><small>preço − custo dos produtos</small></div>
          </div>
          <Tendencia dias={dias} />
        </div>
        <div className="lv-hoje-lado">
          <div className="lv-kpi"><span>Vendido no mês</span><strong>{brl(6842.3)}</strong><small>lucro bruto {brl(3511.6)}</small></div>
          <div className="lv-kpi"><span>Estoque (a custo)</span><strong>{brl(1307.8)}</strong><small>8 produtos</small></div>
        </div>
      </div>

      <section className="lv-semana" aria-label="Sua semana">
        <h2>Sua semana com o Luvy</h2>
        <div className="lv-semana-itens">
          <Link href="/previa/vendas"><span>Vendido em 7 dias</span><strong>{brl(1993.8)}</strong><small>▲ 12% vs. semana anterior</small></Link>
          <Link href="/previa/pedidos"><span>Pedidos pela vitrine</span><strong>14</strong><small>nos últimos 7 dias</small></Link>
          <Link href="/previa/repor"><span>Para repor</span><strong>3</strong><small>acabam em até 15 dias</small></Link>
          <Link href="/previa/repor?v=parado"><span>Dinheiro parado</span><strong>{brl(853)}</strong><small>sem vender há 60+ dias</small></Link>
        </div>
      </section>

      <div className="lv-grid c2">
        <div className="lv-card">
          <h2>Estoque baixo <small>{baixo.length} produtos</small></h2>
          <div className="lv-lista">
            {baixo.map((p) => (
              <a key={p.id}>
                <span>{p.nome}</span>
                <span className="fim"><span className={`lv-selo ${p.quantidade === 0 ? 'erro' : 'alerta'}`}>{p.quantidade === 0 ? 'Esgotado' : `Restam ${p.quantidade}`}</span></span>
              </a>
            ))}
          </div>
        </div>
        <div className="lv-card">
          <h2>Caixa <small>aberto às 09:02</small></h2>
          <div className="lv-lista" style={{ marginBottom: 12 }}>
            {vendas.map((v) => (
              <a key={v.n}><span>#{v.n}</span><span className="lv-selo">{v.forma}</span><span className="fim">{brl(v.total)}</span></a>
            ))}
          </div>
          <Link href="/previa/vender" className="lv-btn sec pq">Ver caixa</Link>
        </div>
      </div>

      <div className="lv-aviso alerta" style={{ marginTop: 14 }}>
        <span><strong>1 produto está vendendo abaixo do custo.</strong></span>
        <span className="lv-btn sec pq">Revisar</span>
      </div>
    </>
  )
}
