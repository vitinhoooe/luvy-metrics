import Link from 'next/link'
import type { Metadata } from 'next'
import { exigirLoja } from '@/lib/sessao'
import { brl, dataHora, inicioDia, inicioMes, num } from '@/lib/formato'
import { Icone } from '@/components/Icone'
import { FORMAS_PAGAMENTO } from '@/lib/constantes'
import { Numero } from '@/components/Numero'
import { Tendencia } from '@/components/Tendencia'
import { montarPassos, PrimeirosPassos } from '@/components/PrimeirosPassos'

export const metadata: Metadata = { title: 'Hoje' }

type Venda = { id: string; numero: number; total: number; custo_total: number; forma_pagamento: string; criado_em: string; canal: string }
type Prod = { id: string; nome: string; quantidade: number; estoque_minimo: number; custo: number; preco: number }

const somar = (vs: Venda[], k: 'total' | 'custo_total') => vs.reduce((s, v) => s + Number(v[k]), 0)

export default async function Painel({ searchParams }: { searchParams: Promise<{ bemvinda?: string }> }) {
  const { supabase, loja } = await exigirLoja()
  const { bemvinda } = await searchParams

  const [{ data: vendasMes }, { data: produtos }, { data: caixa }] = await Promise.all([
    supabase.from('vendas').select('id, numero, total, custo_total, forma_pagamento, criado_em, canal')
      .eq('status', 'concluida').gte('criado_em', new Date(Math.min(Date.parse(inicioMes()), Date.parse(inicioDia(13)))).toISOString()).order('criado_em', { ascending: false }).limit(5000),
    supabase.from('produtos').select('id, nome, quantidade, estoque_minimo, custo, preco').eq('ativo', true).limit(5000),
    supabase.from('caixas').select('id, aberto_em').eq('status', 'aberto').maybeSingle(),
  ])
  const [{ count: pedidosNovos }, { count: pedidosSemana }, { data: giro }, { count: nHistorico }, { count: nVendasPdv }, { count: nFornecedores }, { data: lojaVit }] = await Promise.all([
    supabase.from('pedidos').select('id', { count: 'exact', head: true }).eq('status', 'novo'),
    supabase.from('pedidos').select('id', { count: 'exact', head: true }).neq('status', 'cancelado').gte('criado_em', inicioDia(6)),
    supabase.rpc('giro_estoque', { p_dias: 30, p_cobertura: 30 }),
    supabase.from('vendas').select('id', { count: 'exact', head: true }).eq('canal', 'historico'),
    supabase.from('vendas').select('id', { count: 'exact', head: true }).in('canal', ['balcao', 'whatsapp', 'instagram']),
    supabase.from('fornecedores').select('id', { count: 'exact', head: true }),
    supabase.from('lojas').select('vitrine_ativa').eq('id', loja.id).maybeSingle(),
  ])
  const recentes = (vendasMes ?? []) as Venda[]
  const giroLista = (giro ?? []) as { por_dia: number; sugestao: number; dias_restantes: number | null; quantidade: number; dias_sem_vender: number; valor_parado: number }[]
  const paraRepor = giroLista.filter((i) => Number(i.por_dia) > 0 && (i.sugestao > 0 || (i.dias_restantes ?? 999) <= 15)).length
  const parado = giroLista.filter((i) => i.quantidade > 0 && i.dias_sem_vender >= 60).reduce((s, i) => s + Number(i.valor_parado), 0)
  const tSemana = (de: number, ate: number) => recentes.filter((v) => { const t = Date.parse(v.criado_em); return t >= Date.parse(inicioDia(de)) && (ate < 0 || t < Date.parse(inicioDia(ate))) }).reduce((s, v) => s + Number(v.total), 0)
  const semana = tSemana(6, -1)
  const semanaAnterior = tSemana(13, 6)
  const variacao = semanaAnterior > 0 ? Math.round(((semana - semanaAnterior) / semanaAnterior) * 100) : null

  const mes = recentes.filter((v) => Date.parse(v.criado_em) >= Date.parse(inicioMes()))
  // últimos 7 dias, para a linha do destaque
  const dias = Array.from({ length: 7 }, (_, k) => {
    const i = 6 - k
    const ini = Date.parse(inicioDia(i))
    const fim = i === 0 ? Infinity : Date.parse(inicioDia(i - 1))
    const total = recentes.filter((v) => { const t = Date.parse(v.criado_em); return t >= ini && t < fim }).reduce((s, v) => s + Number(v.total), 0)
    const rotulo = i === 0 ? 'hoje' : new Date(ini).toLocaleDateString('pt-BR', { weekday: 'short', timeZone: 'America/Sao_Paulo' }).replace('.', '')
    return { rotulo, total }
  })
  const corte = Date.parse(inicioDia())
  const hoje = mes.filter((v) => Date.parse(v.criado_em) >= corte)
  const prods = (produtos ?? []) as Prod[]
  const baixo = prods.filter((p) => p.quantidade <= p.estoque_minimo).sort((a, b) => a.quantidade - b.quantidade)
  const semPreco = prods.filter((p) => Number(p.preco) <= 0 || Number(p.preco) <= Number(p.custo))
  const valorEstoque = prods.reduce((s, p) => s + Number(p.custo) * p.quantidade, 0)

  const totalHoje = somar(hoje, 'total')
  const lucroHoje = totalHoje - somar(hoje, 'custo_total')
  const totalMes = somar(mes, 'total')
  const lucroMes = totalMes - somar(mes, 'custo_total')

  const passos = montarPassos({
    produtos: prods.length > 0, historico: !!nHistorico, venda: !!nVendasPdv, vitrine: !!lojaVit?.vitrine_ativa, fornecedores: !!nFornecedores,
  })

  return (
    <>
      <div className="lv-top">
        <div>
          <h1>{bemvinda ? `Sua loja está pronta, ${loja.nome}!` : 'Hoje'}</h1>
          <p>{new Date().toLocaleDateString('pt-BR', { weekday: 'long', day: 'numeric', month: 'long', timeZone: 'America/Sao_Paulo' })}</p>
        </div>
        <div className="lv-acoes">
          <Link href="/vender" className="lv-btn"><Icone nome="vender" />Nova venda</Link>
        </div>
      </div>

      {!!pedidosNovos && (
        <Link href="/pedidos?f=novo" className="lv-aviso lv-aviso-pedido" style={{ marginBottom: 14 }}>
          <span className="lv-selo escuro">{pedidosNovos} {pedidosNovos === 1 ? 'pedido novo' : 'pedidos novos'}</span>
          <span>Chegou pedido pela sua vitrine. Confirme o pagamento para baixar o estoque.</span>
          <span className="lv-btn pq">Ver pedidos</span>
        </Link>
      )}

      <PrimeirosPassos passos={passos} />

      <div className="lv-hoje">
        <div className="lv-kpi destaque">
          <div className="lv-hoje-num">
            <div><span>Vendido hoje</span><strong><Numero valor={totalHoje} /></strong><small>{hoje.length} {hoje.length === 1 ? 'venda' : 'vendas'}</small></div>
            <div className="lucro"><span>Lucro bruto hoje</span><strong><Numero valor={lucroHoje} /></strong><small>preço − custo dos produtos</small></div>
          </div>
          <Tendencia dias={dias} />
        </div>
        <div className="lv-hoje-lado">
          <div className="lv-kpi"><span>Vendido no mês</span><strong>{brl(totalMes)}</strong><small>lucro bruto {brl(lucroMes)}</small></div>
          <div className="lv-kpi"><span>Estoque (a custo)</span><strong>{brl(valorEstoque)}</strong><small>{num(prods.length)} produtos</small></div>
        </div>
      </div>

      <section className="lv-semana" aria-label="Sua semana">
        <h2>Sua semana com o Luvy</h2>
        <div className="lv-semana-itens">
          <Link href="/vendas?p=7d"><span>Vendido em 7 dias</span><strong>{brl(semana)}</strong><small>{variacao === null ? 'sem semana anterior para comparar' : `${variacao >= 0 ? '▲' : '▼'} ${Math.abs(variacao)}% vs. semana anterior`}</small></Link>
          <Link href="/pedidos"><span>Pedidos pela vitrine</span><strong>{pedidosSemana ?? 0}</strong><small>nos últimos 7 dias</small></Link>
          <Link href="/repor"><span>Para repor</span><strong>{paraRepor}</strong><small>{paraRepor ? 'acabam em até 15 dias' : 'nada acabando'}</small></Link>
          <Link href="/repor?v=parado"><span>Dinheiro parado</span><strong>{brl(parado)}</strong><small>sem vender há 60+ dias</small></Link>
        </div>
      </section>

      <div className="lv-grid c2">
        <div className="lv-card">
          <h2>Estoque baixo <small>{baixo.length > 0 ? `${baixo.length} produtos` : ''}</small></h2>
          {baixo.length === 0 ? (
            <p style={{ color: 'var(--dim)', fontSize: 14 }}>{prods.length ? 'Nenhum produto abaixo do mínimo. 👌' : 'Cadastre produtos para ver os alertas.'}</p>
          ) : (
            <div className="lv-lista">
              {baixo.slice(0, 8).map((p) => (
                <Link key={p.id} href={`/produtos/${p.id}`}>
                  <span>{p.nome}</span>
                  <span className="fim"><span className={`lv-selo ${p.quantidade === 0 ? 'erro' : 'alerta'}`}>{p.quantidade === 0 ? 'Esgotado' : `Restam ${p.quantidade}`}</span></span>
                </Link>
              ))}
              {baixo.length > 8 && <Link href="/produtos?filtro=baixo" style={{ color: 'var(--dim)' }}>Ver todos <span className="fim">→</span></Link>}
            </div>
          )}
        </div>

        <div className="lv-card">
          <h2>Caixa <small>{caixa ? `aberto ${dataHora(caixa.aberto_em)}` : 'fechado'}</small></h2>
          {hoje.length === 0 ? (
            <p style={{ color: 'var(--dim)', fontSize: 14, marginBottom: 14 }}>Nenhuma venda hoje ainda.</p>
          ) : (
            <div className="lv-lista" style={{ marginBottom: 12 }}>
              {hoje.slice(0, 6).map((v) => (
                <Link key={v.id} href={`/vendas/${v.id}`}>
                  <span>#{v.numero}</span>
                  <span className="lv-selo">{FORMAS_PAGAMENTO.find((f) => f.id === v.forma_pagamento)?.nome ?? v.forma_pagamento}</span>
                  <span className="fim">{brl(v.total)}</span>
                </Link>
              ))}
            </div>
          )}
          <Link href="/caixa" className="lv-btn sec pq">{caixa ? 'Ver caixa' : 'Abrir caixa'}</Link>
        </div>
      </div>

      {semPreco.length > 0 && (
        <div className="lv-aviso alerta" style={{ marginTop: 14 }}>
          <span><strong>{semPreco.length} {semPreco.length === 1 ? 'produto está' : 'produtos estão'} sem preço ou vendendo abaixo do custo.</strong></span>
          <Link href="/produtos?filtro=preco" className="lv-btn sec pq">Revisar</Link>
        </div>
      )}
    </>
  )
}
