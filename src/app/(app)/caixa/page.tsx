import type { Metadata } from 'next'
import { exigirLoja } from '@/lib/sessao'
import { brl, dataHora } from '@/lib/formato'
import { FORMAS_PAGAMENTO } from '@/lib/constantes'
import { FormAbrir, FormFechar } from './Forms'

export const metadata: Metadata = { title: 'Caixa' }

type Venda = { total: number; custo_total: number; forma_pagamento: string }

export default async function Caixa() {
  const { supabase, podeEditar } = await exigirLoja()
  const [{ data: aberto }, { data: fechados }] = await Promise.all([
    supabase.from('caixas').select('id, troco_inicial, aberto_em').eq('status', 'aberto').maybeSingle(),
    supabase.from('caixas').select('id, troco_inicial, valor_contado, aberto_em, fechado_em, observacao').eq('status', 'fechado').order('fechado_em', { ascending: false }).limit(10),
  ])

  let vendas: Venda[] = []
  if (aberto) {
    const { data } = await supabase.from('vendas').select('total, custo_total, forma_pagamento').eq('caixa_id', aberto.id).eq('status', 'concluida')
    vendas = (data ?? []) as Venda[]
  }
  const porForma = FORMAS_PAGAMENTO.map((f) => ({ ...f, total: vendas.filter((v) => v.forma_pagamento === f.id).reduce((s, v) => s + Number(v.total), 0) }))
  const total = vendas.reduce((s, v) => s + Number(v.total), 0)
  const lucro = total - vendas.reduce((s, v) => s + Number(v.custo_total), 0)
  const dinheiro = porForma.find((f) => f.id === 'dinheiro')!.total
  const esperado = Number(aberto?.troco_inicial ?? 0) + dinheiro

  // para o histórico: total vendido em dinheiro em cada caixa fechado
  const ids = (fechados ?? []).map((c) => c.id)
  const dinheiroPorCaixa = new Map<string, number>()
  if (ids.length) {
    const { data } = await supabase.from('vendas').select('caixa_id, total').in('caixa_id', ids).eq('status', 'concluida').eq('forma_pagamento', 'dinheiro')
    ;(data ?? []).forEach((v) => dinheiroPorCaixa.set(v.caixa_id, (dinheiroPorCaixa.get(v.caixa_id) ?? 0) + Number(v.total)))
  }

  return (
    <>
      <div className="lv-top">
        <div>
          <h1>Caixa</h1>
          <p>{aberto ? `Aberto ${dataHora(aberto.aberto_em)}` : 'Abra o caixa no começo do dia e feche no fim para conferir o dinheiro.'}</p>
        </div>
      </div>

      {!aberto ? (
        <div className="lv-card"><h2>Abrir caixa</h2><FormAbrir podeEditar={podeEditar} /></div>
      ) : (
        <div className="lv-grid c2" style={{ alignItems: 'start' }}>
          <div className="lv-card">
            <h2>Resumo do caixa <small>{vendas.length} vendas</small></h2>
            <div className="lv-lista">
              {porForma.map((f) => <div key={f.id}><span style={{ minWidth: 70 }}>{f.nome}</span><span className="lv-barra" aria-hidden><i style={{ width: `${total ? (f.total / total) * 100 : 0}%` }} /></span><span className="fim">{brl(f.total)}</span></div>)}
              <div><strong>Total vendido</strong><span className="fim"><strong>{brl(total)}</strong></span></div>
              <div><span style={{ color: 'var(--dim)' }}>Lucro bruto (preço − custo)</span><span className="fim">{brl(lucro)}</span></div>
            </div>
          </div>
          <div className="lv-card">
            <h2>Fechar caixa</h2>
            <div className="lv-lista" style={{ marginBottom: 14 }}>
              <div><span>Troco inicial</span><span className="fim">{brl(aberto.troco_inicial)}</span></div>
              <div><span>+ Vendas em dinheiro</span><span className="fim">{brl(dinheiro)}</span></div>
              <div><strong>Deve ter na gaveta</strong><span className="fim"><strong>{brl(esperado)}</strong></span></div>
            </div>
            <FormFechar id={aberto.id} esperado={esperado} podeEditar={podeEditar} />
          </div>
        </div>
      )}

      {!!fechados?.length && (
        <div className="lv-card" style={{ marginTop: 14 }}>
          <h2>Caixas fechados</h2>
          <div className="lv-lista">
            {fechados.map((c) => {
              const esp = Number(c.troco_inicial) + (dinheiroPorCaixa.get(c.id) ?? 0)
              const dif = Number(c.valor_contado ?? 0) - esp
              return (
                <div key={c.id}>
                  <span>{dataHora(c.aberto_em)} → {c.fechado_em ? dataHora(c.fechado_em) : ''}{c.observacao ? <span style={{ color: 'var(--dim)' }}> · {c.observacao}</span> : null}</span>
                  <span className="fim">
                    {Math.abs(dif) < 0.01 ? <span className="lv-selo ok">bateu</span> : <span className="lv-selo erro">{dif > 0 ? '+' : '−'}{brl(Math.abs(dif))}</span>}
                  </span>
                </div>
              )
            })}
          </div>
        </div>
      )}
    </>
  )
}
