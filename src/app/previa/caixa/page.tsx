import { brl } from '@/lib/formato'
import { Numero } from '@/components/Numero'

const FORMAS = [['Pix', 1240.6], ['Dinheiro', 386.4], ['Débito', 512], ['Crédito', 893.8], ['Outro', 0]] as const

export default function PreviaCaixa() {
  const total = FORMAS.reduce((s, [, v]) => s + v, 0)
  const troco = 150
  const esperado = troco + 386.4
  return (
    <>
      <div className="lv-top"><div><h1>Caixa</h1><p>Aberto hoje às 09:02 · dados de exemplo</p></div></div>
      <div className="lv-grid c2" style={{ alignItems: 'start' }}>
        <div className="lv-card">
          <h2>Resumo do caixa <small>23 vendas</small></h2>
          <div className="lv-lista">
            {FORMAS.map(([n, v]) => (
              <div key={n}>
                <span>{n}</span>
                <span className="lv-barra" aria-hidden><i style={{ width: `${(v / total) * 100}%` }} /></span>
                <span className="fim">{brl(v)}</span>
              </div>
            ))}
            <div><strong>Total vendido</strong><span className="fim"><strong><Numero valor={total} /></strong></span></div>
            <div><span style={{ color: 'var(--dim)' }}>Lucro bruto (preço − custo)</span><span className="fim">{brl(1561.3)}</span></div>
          </div>
        </div>
        <div className="lv-card">
          <h2>Fechar caixa</h2>
          <div className="lv-lista" style={{ marginBottom: 14 }}>
            <div><span>Troco inicial</span><span className="fim">{brl(troco)}</span></div>
            <div><span>+ Vendas em dinheiro</span><span className="fim">{brl(386.4)}</span></div>
            <div><strong>Deve ter na gaveta</strong><span className="fim"><strong>{brl(esperado)}</strong></span></div>
          </div>
          <div className="lv-campo">
            <label htmlFor="contado">Quanto tem de dinheiro na gaveta agora? (R$)</label>
            <input id="contado" className="lv-input grande mono" inputMode="decimal" placeholder="0,00" />
          </div>
          <p style={{ color: 'var(--dim)', fontSize: 13, marginTop: 10 }}>No app real, ao digitar o valor aparece na hora se sobrou ou faltou.</p>
        </div>
      </div>
    </>
  )
}
