import Link from 'next/link'
import type { Metadata } from 'next'
import { exigirLoja } from '@/lib/sessao'
import { pode } from '@/lib/planos'
import { origem } from '@/lib/origem'
import { brl } from '@/lib/formato'
import { calcularPrazo, PRAZOS_PADRAO, STATUS, type Prazos, type StatusPedido } from '@/lib/pedidos'
import { ListaPedidos, type Pedido } from './ListaPedidos'
import { acaoPedido } from './acoes'
import { acaoEmMassa, rastreiosEmMassa } from './acoesMassa'

export const metadata: Metadata = { title: 'Pedidos' }

const ABAS: { id: string; nome: string; status: StatusPedido[]; atrasados?: boolean }[] = [
  { id: 'atrasados', nome: 'Atrasados', status: ['novo', 'pago', 'separado', 'enviado'], atrasados: true },
  { id: 'abertos', nome: 'Em aberto', status: ['novo', 'pago', 'separado', 'enviado'] },
  { id: 'novo', nome: 'Novos', status: ['novo'] },
  { id: 'pago', nome: 'Pagos', status: ['pago'] },
  { id: 'separado', nome: 'Separados', status: ['separado'] },
  { id: 'enviado', nome: 'A caminho', status: ['enviado'] },
  { id: 'entregue', nome: 'Entregues', status: ['entregue'] },
  { id: 'cancelado', nome: 'Cancelados', status: ['cancelado'] },
]

export default async function Pedidos({ searchParams }: { searchParams: Promise<{ f?: string; q?: string; ok?: string; erro?: string }> }) {
  const { supabase, loja, assinatura, podeEditar } = await exigirLoja()
  const { f = 'abertos', q = '', ok, erro } = await searchParams
  if (!pode(assinatura, 'vitrine') && assinatura.plano === 'starter') {
    return (
      <>
        <div className="lv-top"><div><h1>Pedidos</h1></div></div>
        <div className="lv-card" style={{ maxWidth: 620 }}>
          <p style={{ marginBottom: 14 }}>Os pedidos chegam pela vitrine online, que faz parte do plano Pro.</p>
          <Link href="/planos" className="lv-btn">Ver o plano Pro</Link>
        </div>
      </>
    )
  }

  // cancela sozinho o que passou do prazo de pagamento (configurável na Vitrine)
  if (podeEditar) await supabase.rpc('expirar_pedidos')

  const [{ data }, { data: cfg }] = await Promise.all([
    supabase
      .from('pedidos')
      .select('id, token, numero, cliente_nome, cliente_whatsapp, entrega, endereco, observacao, pagamento, frete, total, valor_pix, status, codigo_rastreio, criado_em, atualizado_em, pedido_itens(nome, quantidade, preco_unit)')
      .order('criado_em', { ascending: false })
      .limit(500),
    supabase.from('lojas').select('endereco_retirada, prazo_pagamento_h, prazo_separar_h, prazo_entrega_h').eq('id', loja.id).single(),
  ])
  const prazos: Prazos = { ...PRAZOS_PADRAO, ...(cfg ?? {}) }
  const agora = Date.now()
  const todos = ((data ?? []) as Pedido[]).map((p) => ({ ...p, prazo: calcularPrazo(p, prazos, agora) }))
  const atrasados = todos.filter((p) => p.prazo?.atrasado)
  const aba = ABAS.find((x) => x.id === f) ?? ABAS[0]
  const termo = q.trim().toLowerCase().replace(/^#/, '')
  const lista = todos
    .filter((p) => aba.status.includes(p.status) && (!aba.atrasados || p.prazo?.atrasado))
    .filter((p) => !termo || p.cliente_nome.toLowerCase().includes(termo) || String(p.numero) === termo || p.cliente_whatsapp.includes(termo))
  const conta = (s: StatusPedido[], soAtrasados?: boolean) => todos.filter((p) => s.includes(p.status) && (!soAtrasados || p.prazo?.atrasado)).length
  const aReceber = todos.filter((p) => p.status === 'novo').reduce((s, p) => s + Number(p.total), 0)
  const base = await origem()

  return (
    <>
      <div className="lv-top">
        <div><h1>Pedidos da vitrine</h1><p>Do pedido à entrega, num lugar só. Cada mudança tem a mensagem pronta para a cliente.</p></div>
        <div className="lv-acoes">
          <Link href="/vitrine" className="lv-btn sec">Prazos e vitrine</Link>
          <Link href="/pedidos/conciliar" className="lv-btn">Conferir Pix pelo extrato</Link>
        </div>
      </div>

      <div className="lv-grid c4" style={{ marginBottom: 14 }}>
        <div className="lv-kpi"><span>Novos (aguardando pagamento)</span><strong>{conta(['novo'])}</strong><small>{brl(aReceber)} a receber</small></div>
        <div className="lv-kpi"><span>Para separar</span><strong>{conta(['pago'])}</strong><small>pagos, ainda na loja</small></div>
        <div className="lv-kpi"><span>A caminho</span><strong>{conta(['enviado'])}</strong><small>saíram para entrega</small></div>
        <div className="lv-kpi"><span>Entregues</span><strong>{conta(['entregue'])}</strong><small>últimos 500 pedidos</small></div>
      </div>

      {atrasados.length > 0 && aba.id !== 'atrasados' && (
        <Link href="/pedidos?f=atrasados" className="lv-aviso alerta" style={{ marginBottom: 14 }}>
          <span className="lv-semaforo vermelho">{atrasados.length} {atrasados.length === 1 ? 'atrasado' : 'atrasados'}</span>
          <span><strong>Precisam de você.</strong> Pedidos que passaram do prazo da etapa em que estão.</span>
          <span className="lv-btn pq">Ver só esses</span>
        </Link>
      )}
      {ok && <p className="lv-msg ok" style={{ marginBottom: 14 }}>{ok}</p>}
      {erro && <p className="lv-msg erro" style={{ marginBottom: 14 }}>{erro}</p>}

      <form className="lv-filtros" role="search">
        <input type="hidden" name="f" value={aba.id} />
        <input name="q" defaultValue={q} className="lv-input" placeholder="Buscar por cliente, número ou WhatsApp" aria-label="Buscar pedido" />
        <button className="lv-btn sec" type="submit">Buscar</button>
      </form>
      <div className="lv-chips lv-abas" style={{ marginBottom: 14 }}>
        {ABAS.map((x) => {
          const n = conta(x.status, x.atrasados)
          return (
            <Link key={x.id} href={`/pedidos?f=${x.id}`} className={`lv-chip${x.id === aba.id ? ' on' : ''}${x.atrasados && n ? ' alerta' : ''}`}>
              {x.nome}{n > 0 && <em>{n}</em>}
            </Link>
          )
        })}
      </div>

      <ListaPedidos pedidos={lista} acao={acaoPedido} acaoMassa={acaoEmMassa} rastreiosMassa={rastreiosEmMassa} podeEditar={podeEditar} loja={loja.nome} slug={loja.slug} enderecoRetirada={cfg?.endereco_retirada} base={base} aba={aba.id} />
      <p style={{ color: 'var(--dim)', fontSize: 12.5, marginTop: 14 }}>
        Caminho do pedido: {(['novo', 'pago', 'separado', 'enviado', 'entregue'] as StatusPedido[]).map((s) => STATUS[s].nome).join(' → ')}
      </p>
    </>
  )
}
