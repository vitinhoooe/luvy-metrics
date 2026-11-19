import Link from 'next/link'
import type { Metadata } from 'next'
import { exigirLoja } from '@/lib/sessao'
import { brl, dataHora, inicioDia, inicioMes } from '@/lib/formato'
import { FORMAS_PAGAMENTO, NOME_CANAL as CANAL } from '@/lib/constantes'
import { Numero } from '@/components/Numero'

export const metadata: Metadata = { title: 'Vendas' }

const PERIODOS = [
  { id: 'hoje', nome: 'Hoje', desde: () => inicioDia() },
  { id: '7d', nome: '7 dias', desde: () => inicioDia(6) },
  { id: 'mes', nome: 'Este mês', desde: () => inicioMes() },
  { id: '90d', nome: '90 dias', desde: () => inicioDia(89) },
]
const nomeForma = (id: string, canal?: string) => canal === 'historico' ? '—' : FORMAS_PAGAMENTO.find((f) => f.id === id)?.nome ?? id

export default async function Vendas({ searchParams }: { searchParams: Promise<{ p?: string }> }) {
  const { supabase } = await exigirLoja()
  const { p = 'mes' } = await searchParams
  const periodo = PERIODOS.find((x) => x.id === p) ?? PERIODOS[2]

  const { data } = await supabase
    .from('vendas')
    .select('id, numero, canal, forma_pagamento, total, custo_total, desconto, status, criado_em')
    .gte('criado_em', periodo.desde())
    .order('criado_em', { ascending: false })
    .limit(1000)
  const vendas = data ?? []
  const ok = vendas.filter((v) => v.status === 'concluida')
  const total = ok.reduce((s, v) => s + Number(v.total), 0)
  const lucro = total - ok.reduce((s, v) => s + Number(v.custo_total), 0)
  const porCanal = Object.entries(ok.reduce<Record<string, number>>((m, v) => ({ ...m, [v.canal]: (m[v.canal] ?? 0) + Number(v.total) }), {}))

  return (
    <>
      <div className="lv-top">
        <div><h1>Vendas</h1><p>Balcão, WhatsApp, Instagram e vitrine num lugar só.</p></div>
        <div className="lv-acoes"><Link href="/vendas/importar" className="lv-btn sec">Importar vendas antigas</Link></div>
      </div>
      <div className="lv-chips" style={{ marginBottom: 14 }}>
        {PERIODOS.map((x) => <Link key={x.id} href={`/vendas?p=${x.id}`} className={`lv-chip${x.id === periodo.id ? ' on' : ''}`}>{x.nome}</Link>)}
      </div>
      <div className="lv-grid c4" style={{ marginBottom: 14 }}>
        <div className="lv-kpi"><span>Faturamento</span><strong><Numero valor={total} /></strong><small>{ok.length} vendas</small></div>
        <div className="lv-kpi"><span>Lucro bruto</span><strong><Numero valor={lucro} /></strong><small>{total > 0 ? `${((lucro / total) * 100).toFixed(0)}% de margem` : '—'}</small></div>
        <div className="lv-kpi"><span>Ticket médio</span><strong><Numero valor={ok.length ? total / ok.length : 0} /></strong><small>por venda</small></div>
        <div className="lv-kpi"><span>Por canal</span><strong style={{ fontSize: 16 }}>{porCanal.length ? porCanal.map(([c, v]) => `${CANAL[c] ?? c} ${total ? Math.round((v / total) * 100) : 0}%`).join(' · ') : '—'}</strong></div>
      </div>
      {vendas.length === 0 ? (
        <div className="lv-card lv-vazio"><h3>Nenhuma venda no período</h3><div className="lv-acoes"><Link href="/vender" className="lv-btn">Fazer uma venda</Link></div></div>
      ) : (
        <div className="lv-tabela-wrap">
          <table className="lv-tabela">
            <thead><tr><th>Venda</th><th className="esconde-cel">Canal</th><th>Pagamento</th><th className="dir">Total</th><th className="dir esconde-cel">Lucro</th></tr></thead>
            <tbody>
              {vendas.map((v) => (
                <tr key={v.id} style={{ opacity: v.status === 'cancelada' ? 0.5 : 1 }}>
                  <td><Link href={`/vendas/${v.id}`} className="nome">#{v.numero}</Link><div className="sub">{dataHora(v.criado_em)}{v.status === 'cancelada' ? ' · cancelada' : ''}</div></td>
                  <td className="esconde-cel">{CANAL[v.canal] ?? v.canal}</td>
                  <td>{nomeForma(v.forma_pagamento, v.canal)}</td>
                  <td className="dir">{brl(v.total)}</td>
                  <td className="dir esconde-cel">{brl(Number(v.total) - Number(v.custo_total))}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </>
  )
}
