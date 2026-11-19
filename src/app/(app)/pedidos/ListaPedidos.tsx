'use client'
import { useMemo, useState, useTransition } from 'react'
import { useRouter } from 'next/navigation'
import { brl, dataHora } from '@/lib/formato'
import { linkWhatsApp, mensagemCliente, PROXIMO, STATUS, type StatusPedido } from '@/lib/pedidos'
import type { ResultadoMassa } from './acoesMassa'

export type Pedido = {
  id: string
  token: string
  numero: number
  cliente_nome: string
  cliente_whatsapp: string
  entrega: string
  endereco: string | null
  observacao: string | null
  pagamento: string
  frete: number
  total: number
  valor_pix?: number | null
  status: StatusPedido
  codigo_rastreio: string | null
  criado_em: string
  atualizado_em?: string
  pedido_itens: { nome: string; quantidade: number; preco_unit: number }[]
  prazo?: { atrasado: boolean; texto: string } | null
}

const ENTREGA: Record<string, string> = { retirada: 'Retira na loja', local: 'Entrega na cidade', combinar: 'Envio a combinar', brasil: 'Envio (Brasil)' }

type Props = {
  pedidos: Pedido[]
  acao?: (fd: FormData) => Promise<void>
  acaoMassa?: (ids: string[], acao: 'confirmar' | 'avancar' | 'cancelar') => Promise<ResultadoMassa>
  rastreiosMassa?: (texto: string) => Promise<ResultadoMassa>
  podeEditar: boolean
  loja: string
  slug: string
  enderecoRetirada?: string | null
  base: string
  aba?: string
}

/** Lista de pedidos com seleção e ações em massa. Sem ações (prévia), só simula. */
export function ListaPedidos({ pedidos, acao, acaoMassa, rastreiosMassa, podeEditar, loja, slug, enderecoRetirada, base, aba }: Props) {
  const [sel, setSel] = useState<Set<string>>(new Set())
  const [msg, setMsg] = useState<{ ok?: string; erro?: string } | null>(null)
  const [colar, setColar] = useState(false)
  const [rastreios, setRastreios] = useState('')
  const [pendente, iniciar] = useTransition()
  const router = useRouter()

  const selecionados = useMemo(() => pedidos.filter((p) => sel.has(p.id)), [pedidos, sel])
  const tem = (s: StatusPedido[]) => selecionados.some((p) => s.includes(p.status))
  const alternar = (id: string) => setSel((x) => { const n = new Set(x); if (n.has(id)) n.delete(id); else n.add(id); return n })
  const selecionarStatus = (s: StatusPedido) => setSel(new Set(pedidos.filter((p) => p.status === s).map((p) => p.id)))

  function emMassa(tipo: 'confirmar' | 'avancar' | 'cancelar') {
    const ids = [...sel]
    if (tipo === 'cancelar' && !confirm(`Cancelar ${ids.length} pedidos? O estoque dos pagos volta para a loja.`)) return
    setMsg(null)
    iniciar(async () => {
      if (!acaoMassa) { setMsg({ ok: `Prévia: ${ids.length} pedidos seriam atualizados de uma vez.` }); setSel(new Set()); return }
      const r = await acaoMassa(ids, tipo)
      if (r.erro) return setMsg({ erro: r.erro })
      setMsg(r.falhas.length ? { erro: `${r.ok} atualizados. ${r.falhas.length} precisam de você: ${r.falhas.slice(0, 3).join(' · ')}` } : { ok: `${r.ok} pedidos atualizados de uma vez.` })
      setSel(new Set())
      router.refresh()
    })
  }

  function salvarRastreios() {
    setMsg(null)
    iniciar(async () => {
      if (!rastreiosMassa) { setMsg({ ok: 'Prévia: os rastreios seriam salvos e os pedidos marcados como a caminho.' }); setColar(false); return }
      const r = await rastreiosMassa(rastreios)
      if (r.erro) return setMsg({ erro: r.erro })
      setMsg(r.falhas.length ? { erro: `${r.ok} rastreios salvos. Não deu em: ${r.falhas.slice(0, 4).join(' · ')}` } : { ok: `${r.ok} rastreios salvos. Pedidos a caminho.` })
      setRastreios(''); setColar(false)
      router.refresh()
    })
  }

  if (!pedidos.length) {
    return (
      <div className="lv-card lv-vazio">
        <h3>Nenhum pedido aqui</h3>
        <p>Quando uma cliente comprar na sua vitrine, o pedido aparece na hora, com som e aviso.</p>
      </div>
    )
  }

  return (
    <>
      {podeEditar && (
        <div className="lv-massa-atalhos">
          <span>Selecionar:</span>
          {(['novo', 'pago', 'separado', 'enviado'] as StatusPedido[]).filter((s) => pedidos.some((p) => p.status === s)).map((s) => (
            <button key={s} type="button" className="lv-chip" onClick={() => selecionarStatus(s)}>todos “{STATUS[s].nome}”</button>
          ))}
          <button type="button" className="lv-chip" onClick={() => setColar((c) => !c)}>Colar rastreios</button>
        </div>
      )}

      {colar && (
        <div className="lv-card lv-colar">
          <h2>Colar rastreios <small>um por linha: número do pedido e código</small></h2>
          <textarea value={rastreios} onChange={(e) => setRastreios(e.target.value)} rows={5} placeholder={'42 AB123456789BR\n43 AB987654321BR'} />
          <div className="lv-acoes"><button className="lv-btn" disabled={pendente || !rastreios.trim()} onClick={salvarRastreios}>Salvar e marcar “a caminho”</button></div>
        </div>
      )}

      {msg?.ok && <p className="lv-msg ok" style={{ marginBottom: 12 }}>{msg.ok}</p>}
      {msg?.erro && <p className="lv-msg erro" style={{ marginBottom: 12 }}>{msg.erro}</p>}

      <div className="lv-pedidos">
        {pedidos.map((p) => {
          const st = STATUS[p.status]
          const prox = PROXIMO[p.status]
          const texto = mensagemCliente({
            numero: p.numero, cliente: p.cliente_nome, loja, status: p.status, pagamento: p.pagamento, entrega: p.entrega,
            enderecoRetirada, rastreio: p.codigo_rastreio, link: `${base}/loja/${slug}/pedido/${p.token}`,
          })
          const etapa = ['novo', 'pago', 'separado', 'enviado', 'entregue'].indexOf(p.status)
          const marcado = sel.has(p.id)
          return (
            <article key={p.id} className={`lv-card lv-pedido st-${p.status}${marcado ? ' marcado' : ''}${p.prazo?.atrasado ? ' atrasado' : ''}`}>
              <header>
                {podeEditar && p.status !== 'entregue' && p.status !== 'cancelado' && (
                  <input type="checkbox" className="lv-sel" checked={marcado} onChange={() => alternar(p.id)} aria-label={`Selecionar pedido ${p.numero}`} />
                )}
                <div>
                  <strong>#{p.numero} · {p.cliente_nome}</strong>
                  <small>{dataHora(p.criado_em)} · {ENTREGA[p.entrega] ?? p.entrega} · {p.pagamento === 'pix' ? `Pix ${p.valor_pix ? brl(p.valor_pix) : ''}` : 'Pagamento a combinar'}</small>
                </div>
                <span className="lv-pedido-selos">
                  {p.prazo && <span className={`lv-semaforo ${p.prazo.atrasado ? 'vermelho' : 'verde'}`}>{p.prazo.texto}</span>}
                  <span className={`lv-selo ${st.classe}`}>{st.nome}</span>
                </span>
              </header>

              {p.status !== 'cancelado' && (
                <ol className="lv-trilha" aria-label="Andamento do pedido">
                  {['Recebido', 'Pago', 'Separado', 'A caminho', 'Entregue'].map((n, i) => (
                    <li key={n} className={i <= etapa ? 'feito' : ''}><i />{n}</li>
                  ))}
                </ol>
              )}

              <ul>
                {p.pedido_itens.map((i, k) => <li key={k}><span>{i.quantidade}× {i.nome}</span><span>{brl(i.quantidade * Number(i.preco_unit))}</span></li>)}
                {Number(p.frete) > 0 && <li><span>Entrega</span><span>{brl(p.frete)}</span></li>}
                <li className="total"><span>Total</span><strong>{brl(p.total)}</strong></li>
              </ul>
              {(p.endereco || p.observacao || p.codigo_rastreio) && (
                <p className="lv-pedido-obs">
                  {p.endereco && <>📍 {p.endereco}<br /></>}
                  {p.observacao && <>💬 {p.observacao}<br /></>}
                  {p.codigo_rastreio && <>🚚 Rastreio: <b>{p.codigo_rastreio}</b></>}
                </p>
              )}

              <footer>
                <a className="lv-btn lv-btn-zap pq" href={linkWhatsApp(p.cliente_whatsapp, texto)} target="_blank" rel="noopener noreferrer">
                  Avisar cliente: “{st.cliente}”
                </a>
                {podeEditar && p.status !== 'cancelado' && p.status !== 'entregue' && (
                  <form action={acao} className="lv-pedido-acoes">
                    <input type="hidden" name="id" value={p.id} />
                    <input type="hidden" name="aba" value={aba ?? 'abertos'} />
                    {p.status === 'novo' && <button type={acao ? 'submit' : 'button'} className="lv-btn pq" name="acao" value="confirmar">Confirmar pagamento</button>}
                    {p.status === 'separado' && p.entrega !== 'retirada' && (
                      <input name="rastreio" className="lv-input lv-rastreio" placeholder="Rastreio (opcional)" maxLength={40} defaultValue={p.codigo_rastreio ?? ''} />
                    )}
                    {prox && <button type={acao ? 'submit' : 'button'} className="lv-btn pq" name="acao" value="avancar">{p.status === 'separado' && p.entrega === 'retirada' ? 'Cliente retirou' : prox.acao}</button>}
                    <button type={acao ? 'submit' : 'button'} className="lv-btn fant pq" name="acao" value="cancelar">Cancelar</button>
                  </form>
                )}
              </footer>
            </article>
          )
        })}
      </div>

      {sel.size > 0 && (
        <div className="lv-massa" role="region" aria-label="Ações em massa">
          <strong>{sel.size} {sel.size === 1 ? 'pedido selecionado' : 'pedidos selecionados'}</strong>
          {tem(['novo']) && <button className="lv-btn pq" disabled={pendente} onClick={() => emMassa('confirmar')}>Confirmar pagamento</button>}
          {tem(['pago', 'separado', 'enviado']) && <button className="lv-btn pq" disabled={pendente} onClick={() => emMassa('avancar')}>Avançar etapa</button>}
          <button className="lv-btn sec pq" disabled={pendente} onClick={() => emMassa('cancelar')}>Cancelar</button>
          <button className="lv-btn fant pq" onClick={() => setSel(new Set())}>Limpar</button>
        </div>
      )}
    </>
  )
}
