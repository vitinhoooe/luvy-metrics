import { brl, num } from '@/lib/formato'
import { Icone } from '@/components/Icone'
import { PRODUTOS_EXEMPLO } from '../exemplo'

export default function PreviaProdutos() {
  return (
    <>
      <div className="lv-top">
        <div><h1>Produtos e estoque</h1><p>8 produtos · 96 unidades</p></div>
        <div className="lv-acoes">
          <span className="lv-btn sec"><Icone nome="importar" />Importar planilha</span>
          <span className="lv-btn"><Icone nome="mais" />Novo produto</span>
        </div>
      </div>
      <div className="lv-filtros">
        <input className="lv-input" placeholder="Buscar por nome, categoria ou código" aria-label="Buscar" />
        <span className="lv-btn sec"><Icone nome="buscar" />Buscar</span>
      </div>
      <div className="lv-chips" style={{ marginBottom: 14 }}>
        <span className="lv-chip on">Todos</span><span className="lv-chip">Estoque baixo</span><span className="lv-chip">Esgotados</span><span className="lv-chip">Sem preço / abaixo do custo</span>
      </div>
      <div className="lv-tabela-wrap">
        <table className="lv-tabela">
          <thead><tr><th>Produto</th><th className="dir">Estoque</th><th className="dir esconde-cel">Custo</th><th className="dir">Preço</th><th className="dir esconde-cel">Margem</th></tr></thead>
          <tbody>
            {PRODUTOS_EXEMPLO.map((p) => {
              const m = ((p.preco - p.custo) / p.preco) * 100
              return (
                <tr key={p.id}>
                  <td><a className="nome">{p.nome}</a><div className="sub">{[p.categoria, p.codigo_barras].filter(Boolean).join(' · ')}</div></td>
                  <td className="dir">{p.quantidade === 0 ? <span className="lv-selo erro">0</span> : p.quantidade <= p.estoque_minimo ? <span className="lv-selo alerta">{p.quantidade}</span> : num(p.quantidade)}</td>
                  <td className="dir esconde-cel">{brl(p.custo)}</td>
                  <td className="dir">{brl(p.preco)}</td>
                  <td className="dir esconde-cel"><span style={{ color: m <= 0 ? 'var(--err)' : undefined }}>{m.toFixed(0)}%</span></td>
                </tr>
              )
            })}
          </tbody>
        </table>
      </div>
    </>
  )
}
