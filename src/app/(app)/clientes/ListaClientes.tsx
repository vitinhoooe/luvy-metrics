import Link from 'next/link'
import { brl, num } from '@/lib/formato'
import { linkWhatsApp } from '@/lib/pedidos'

export type PedidoCliente = { cliente_nome: string; cliente_whatsapp: string; total: number; status: string; criado_em: string }

export type Cliente = { nome: string; whatsapp: string; pedidos: number; gasto: number; ultimo: string; dias: number; ticket: number }

/** Junta os pedidos (não cancelados) por WhatsApp. */
export function agruparClientes(pedidos: PedidoCliente[], agora = Date.now()): Cliente[] {
  const mapa = new Map<string, Cliente>()
  for (const p of pedidos) {
    if (p.status === 'cancelado') continue
    const c = mapa.get(p.cliente_whatsapp)
    if (!c) {
      mapa.set(p.cliente_whatsapp, { nome: p.cliente_nome, whatsapp: p.cliente_whatsapp, pedidos: 1, gasto: Number(p.total), ultimo: p.criado_em, dias: 0, ticket: 0 })
    } else {
      c.pedidos++
      c.gasto += Number(p.total)
      if (p.criado_em > c.ultimo) { c.ultimo = p.criado_em; c.nome = p.cliente_nome }
    }
  }
  return [...mapa.values()].map((c) => ({ ...c, dias: Math.floor((agora - Date.parse(c.ultimo)) / 86400000), ticket: c.gasto / c.pedidos }))
}

export const FILTROS_CLIENTE = [
  { id: 'todas', nome: 'Todas', f: (_: Cliente) => true },
  { id: 'fieis', nome: 'Fiéis (3+ compras)', f: (c: Cliente) => c.pedidos >= 3 },
  { id: 'sumidas', nome: 'Sumidas há 60+ dias', f: (c: Cliente) => c.dias >= 60 },
  { id: 'novas', nome: 'Novas (1 compra)', f: (c: Cliente) => c.pedidos === 1 },
]

export function ListaClientes({ clientes, filtro, base, loja, linkVitrine }: { clientes: Cliente[]; filtro: string; base: string; loja: string; linkVitrine: string }) {
  const f = FILTROS_CLIENTE.find((x) => x.id === filtro) ?? FILTROS_CLIENTE[0]
  const lista = clientes.filter(f.f).sort((a, b) => (filtro === 'sumidas' ? b.gasto - a.gasto : b.gasto - a.gasto))
  const total = clientes.reduce((s, c) => s + c.gasto, 0)
  const recorrentes = clientes.filter((c) => c.pedidos >= 2).length

  const mensagem = (c: Cliente) => {
    const nome = c.nome.split(' ')[0]
    return c.dias >= 60
      ? `Oi, ${nome}! Aqui é da ${loja} 💜 Faz tempo que você não passa por aqui. Chegaram novidades que acho que você vai gostar: ${linkVitrine}`
      : `Oi, ${nome}! Aqui é da ${loja} 💜 Obrigada por comprar com a gente. Separei as novidades da semana pra você: ${linkVitrine}`
  }

  return (
    <>
      <div className="lv-grid c4" style={{ marginBottom: 14 }}>
        <div className="lv-kpi"><span>Clientes da vitrine</span><strong>{num(clientes.length)}</strong><small>que já fizeram pedido</small></div>
        <div className="lv-kpi"><span>Voltaram a comprar</span><strong>{clientes.length ? Math.round((recorrentes / clientes.length) * 100) : 0}%</strong><small>{recorrentes} com 2+ compras</small></div>
        <div className="lv-kpi"><span>Gasto médio por cliente</span><strong>{brl(clientes.length ? total / clientes.length : 0)}</strong><small>somando todos os pedidos</small></div>
        <div className="lv-kpi"><span>Sumidas há 60+ dias</span><strong>{clientes.filter((c) => c.dias >= 60).length}</strong><small>boas para chamar de volta</small></div>
      </div>
      <div className="lv-chips lv-abas" style={{ marginBottom: 14 }}>
        {FILTROS_CLIENTE.map((x) => {
          const n = clientes.filter(x.f).length
          return <Link key={x.id} href={`${base}?f=${x.id}`} className={`lv-chip${x.id === f.id ? ' on' : ''}`}>{x.nome}{n > 0 && <em>{n}</em>}</Link>
        })}
      </div>
      {lista.length === 0 ? (
        <div className="lv-card lv-vazio"><h3>Ninguém aqui ainda</h3><p>Cada cliente que compra pela vitrine aparece nesta lista automaticamente.</p></div>
      ) : (
        <div className="lv-tabela-wrap">
          <table className="lv-tabela">
            <thead><tr><th>Cliente</th><th className="dir">Compras</th><th className="dir esconde-cel">Gasto total</th><th className="dir esconde-cel">Ticket médio</th><th className="dir">Última compra</th><th /></tr></thead>
            <tbody>
              {lista.map((c) => (
                <tr key={c.whatsapp}>
                  <td><strong>{c.nome}</strong><div className="sub">({c.whatsapp.slice(0, 2)}) {c.whatsapp.slice(2, -4)}-{c.whatsapp.slice(-4)}</div></td>
                  <td className="dir">{c.pedidos}{c.pedidos >= 3 && ' 💜'}</td>
                  <td className="dir esconde-cel">{brl(c.gasto)}</td>
                  <td className="dir esconde-cel">{brl(c.ticket)}</td>
                  <td className="dir">{c.dias === 0 ? 'hoje' : `há ${c.dias} dias`}</td>
                  <td className="dir"><a className="lv-btn lv-btn-zap pq" href={linkWhatsApp(c.whatsapp, mensagem(c))} target="_blank" rel="noopener noreferrer">{c.dias >= 60 ? 'Chamar de volta' : 'Mandar novidades'}</a></td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
      <p style={{ color: 'var(--dim)', fontSize: 12.5, marginTop: 10 }}>
        As clientes informaram o WhatsApp ao fazer o pedido. Use para falar sobre pedidos e novidades da loja, sem exagerar: quem pede para não receber mais deve ser respeitada.
      </p>
    </>
  )
}
