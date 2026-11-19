'use client'
import { useEffect, useMemo, useState, useTransition } from 'react'
import { useRouter } from 'next/navigation'
import QRCode from 'qrcode'
import { brl, dataHora } from '@/lib/formato'
import { pixCopiaECola } from '@/lib/pix'
import { linkWhatsApp, STATUS, type StatusPedido } from '@/lib/pedidos'
import { CORES, type PedidoPublico } from './tipos'
import { pagarPedido } from './acoes'
import { serifa } from './fonte'

const PASSOS: { status: StatusPedido; nome: string }[] = [
  { status: 'novo', nome: 'Pedido recebido' },
  { status: 'pago', nome: 'Pagamento confirmado' },
  { status: 'separado', nome: 'Separado e embalado' },
  { status: 'enviado', nome: 'A caminho' },
  { status: 'entregue', nome: 'Entregue' },
]

export function PedidoConfirmado({ pedido, simulado, token = '' }: { pedido: PedidoPublico; simulado?: boolean; token?: string }) {
  const cor = CORES[pedido.loja.cor] ?? CORES.rosa
  const router = useRouter()
  const [qr, setQr] = useState<string | null>(null)
  const [copiado, setCopiado] = useState(false)
  const [erroMp, setErroMp] = useState<string | null>(null)
  const [abrindo, iniciarMp] = useTransition()
  const mp = pedido.pagamento === 'mercadopago'
  function pagarAgora() {
    setErroMp(null)
    if (simulado) return setErroMp('Prévia: aqui abriria o pagamento do Mercado Pago.')
    if (pedido.mp_link) { window.location.href = pedido.mp_link; return }
    iniciarMp(async () => { const r = await pagarPedido(token); if ('link' in r && r.link) window.location.href = r.link; else setErroMp(r.erro ?? 'Não deu certo agora.') })
  }
  const status = pedido.status as StatusPedido
  const final = status === 'entregue' || status === 'cancelado'
  // valor com centavos de identificação: é assim que a loja reconhece o seu Pix no extrato
  const valorPix = Number(pedido.valor_pix ?? pedido.total)

  // atualiza sozinho enquanto o pedido anda (a cada 30 s)
  useEffect(() => {
    if (simulado || final) return
    const id = setInterval(() => router.refresh(), 30_000)
    return () => clearInterval(id)
  }, [router, simulado, final])

  const pix = useMemo(() => {
    if (pedido.pagamento !== 'pix' || !pedido.loja.pix_chave || status !== 'novo') return null
    return pixCopiaECola({ chave: pedido.loja.pix_chave, nome: pedido.loja.pix_nome, cidade: pedido.loja.cidade, valor: valorPix, referencia: `PEDIDO${pedido.numero}` })
  }, [pedido, status])

  useEffect(() => {
    if (pix) QRCode.toDataURL(pix, { margin: 1, width: 440, color: { dark: '#1e1720', light: '#ffffff' } }).then(setQr).catch(() => setQr(null))
  }, [pix])

  // mensagem que a cliente manda para a loja: chega como "alguém fez um pedido pelo site"
  const texto = [
    `🛍️ *Novo pedido #${pedido.numero}* pela vitrine`,
    `Cliente: ${pedido.cliente}`,
    '',
    ...pedido.itens.map((i) => `• ${i.quantidade}× ${i.nome} — ${brl(i.quantidade * Number(i.preco))}`),
    Number(pedido.frete) > 0 ? `Entrega: ${brl(pedido.frete)}` : '',
    `*Total: ${brl(pedido.total)}*`,
    `Entrega: ${pedido.entrega === 'retirada' ? 'vou retirar na loja' : pedido.entrega === 'local' ? 'entrega na cidade' : pedido.entrega === 'brasil' ? 'envio para o meu endereço' : 'combinar envio'}`,
    pedido.pagamento === 'pix' ? 'Pagamento: Pix (envio o comprovante aqui)' : pedido.pagamento === 'mercadopago' ? 'Pagamento: online pelo Mercado Pago' : 'Pagamento: quero combinar',
  ].filter((l) => l !== '').join('\n')
  const zap = pedido.loja.whatsapp ? linkWhatsApp(pedido.loja.whatsapp, texto) : null

  async function copiar() {
    if (!pix) return
    try { await navigator.clipboard.writeText(pix); setCopiado(true); setTimeout(() => setCopiado(false), 2500) } catch {}
  }

  const quando = (s: string) => pedido.eventos?.find((e) => e.status === s)?.em
  const atual = PASSOS.findIndex((p) => p.status === status)
  const passoZap = pix ? 2 : 1

  return (
    <div className={`vt ${serifa.variable}`} style={{ '--va': cor.a, '--vb': cor.b } as React.CSSProperties}>
      <main className="vt-ok">
        <div className={`vt-ok-check${status === 'cancelado' ? ' cancelado' : ''}`} aria-hidden>
          <svg viewBox="0 0 24 24" fill="none" stroke="#fff" strokeWidth="2.6" strokeLinecap="round" strokeLinejoin="round">
            <path pathLength={1} d={status === 'cancelado' ? 'M7 7l10 10M17 7L7 17' : 'M5 12.5l4.5 4.5L19 7.5'} />
          </svg>
        </div>
        <h1>Pedido #{pedido.numero}</h1>
        <p className="vt-ok-sub">{STATUS[status]?.cliente ?? pedido.status} · {pedido.loja.nome}</p>
        {simulado && <p className="vt-aviso">{mp ? 'Prévia: nenhum pedido foi gravado e o pagamento não é aberto.' : 'Prévia: nenhum pedido foi gravado e o Pix abaixo é de exemplo.'}</p>}

        {status === 'novo' && mp && (
          <section className="vt-pix">
            <span className="vt-passo">Falta pagar</span>
            <h2>Pague com Pix ou cartão</h2>
            <p>Total: <strong>{brl(pedido.total)}</strong> · pagamento seguro pelo Mercado Pago</p>
            <button className="vt-btn cheio" onClick={pagarAgora} disabled={abrindo}>{abrindo ? 'Abrindo…' : 'Pagar agora'}</button>
            {erroMp && <p className="vt-erro">{erroMp}</p>}
            <p className="vt-pix-dica">Assim que o pagamento for aprovado, esta página muda para “Pagamento confirmado” sozinha.</p>
          </section>
        )}
        {status !== 'novo' && mp && pedido.pago_por && (
          <p className="vt-pix-dica">Pago pelo Mercado Pago ({pedido.pago_por === 'pix' ? 'Pix' : pedido.pago_por === 'credito' ? 'cartão de crédito' : pedido.pago_por === 'debito' ? 'cartão de débito' : 'online'}).</p>
        )}

        {status === 'novo' && (
          <>
            {pix && (
              <section className="vt-pix">
                <span className="vt-passo">Passo 1</span>
                <h2>Pague com Pix</h2>
                <p>Valor exato: <strong>{brl(valorPix)}</strong> · para {pedido.loja.pix_nome}</p>
                {valorPix < Number(pedido.total) && <p className="vt-pix-dica">Os {Math.round((Number(pedido.total) - valorPix) * 100)} centavos de desconto identificam o seu pagamento. Pague o valor exato.</p>}
                {qr ? <img src={qr} alt="QR Code do Pix" width={220} height={220} /> : <div className="vt-pix-qr-vazio" />}
                <button className="vt-btn cheio" onClick={copiar}>{copiado ? 'Código copiado ✓' : 'Copiar código Pix'}</button>
                <p className="vt-pix-dica">No app do banco, escolha Pix copia e cola e cole o código.</p>
              </section>
            )}
            {zap && (
              <section className="vt-pix vt-passo-zap">
                <span className="vt-passo">{mp ? 'Opcional' : `Passo ${passoZap}`}</span>
                <h2>{mp ? 'Avise a loja no WhatsApp' : 'Envie o pedido para a loja'}</h2>
                <p className="vt-pix-dica">O WhatsApp abre com o seu pedido já escrito. É só tocar em enviar{pix ? ' e mandar o comprovante' : ''}.</p>
                <a className="vt-btn cheio vt-zap" href={zap} target="_blank" rel="noopener noreferrer">Enviar pedido no WhatsApp</a>
              </section>
            )}
          </>
        )}

        {status !== 'cancelado' && (
          <section className="vt-resumo">
            <h2>Acompanhe</h2>
            <ol className="vt-linha">
              {PASSOS.map((p, i) => {
                const em = quando(p.status)
                return (
                  <li key={p.status} className={i < atual ? 'feito' : i === atual ? 'agora' : ''}>
                    <i aria-hidden />
                    <span>{p.nome}{p.status === 'enviado' && pedido.rastreio && i <= atual && <small>Rastreio: <b>{pedido.rastreio}</b></small>}</span>
                    {em && i <= atual && <time>{dataHora(em)}</time>}
                  </li>
                )
              })}
            </ol>
            {!final && <p className="vt-pix-dica">Esta página se atualiza sozinha.</p>}
          </section>
        )}

        <section className="vt-resumo">
          <h2>Resumo</h2>
          <ul>
            {pedido.itens.map((i, k) => <li key={k}><span>{i.quantidade}× {i.nome}</span><span>{brl(i.quantidade * Number(i.preco))}</span></li>)}
            {Number(pedido.frete) > 0 && <li><span>Entrega</span><span>{brl(pedido.frete)}</span></li>}
            <li className="total"><span>Total</span><strong>{brl(pedido.total)}</strong></li>
          </ul>
          {pedido.entrega === 'retirada' && pedido.loja.endereco_retirada && <p className="vt-pix-dica">Retirada: {pedido.loja.endereco_retirada}</p>}
        </section>

        {status !== 'novo' && zap && <a className="vt-btn cheio vt-zap" href={linkWhatsApp(pedido.loja.whatsapp!, `Oi! Sobre o meu pedido #${pedido.numero}:`)} target="_blank" rel="noopener noreferrer">Falar com a loja</a>}
        <a className="vt-link" href={simulado ? '/previa-loja' : `/loja/${pedido.loja.slug}`}>Voltar para a loja</a>
        <p className="vt-pix-dica">Guarde este link para acompanhar o pedido.</p>
      </main>
    </div>
  )
}
