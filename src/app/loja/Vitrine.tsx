'use client'
import { useEffect, useMemo, useState, useTransition } from 'react'
import { useRouter } from 'next/navigation'
import { brl } from '@/lib/formato'
import { CORES, type LojaVitrine, type ProdutoVitrine } from './tipos'
import { criarPedido, type DadosPedido } from './acoes'
import { ChatAtendente } from './ChatAtendente'
import { serifa } from './fonte'
import { linkWhatsApp } from '@/lib/pedidos'
import { formatarCep, freteBrasil } from '@/lib/frete'

type Linha = { p: ProdutoVitrine; qtd: number }
const norm = (s: string) => s.normalize('NFD').replace(/[̀-ͯ]/g, '').toLowerCase()
const iniciais = (s: string) => s.split(/\s+/).filter((w) => w.length > 2).slice(0, 2).map((w) => w[0]).join('').toUpperCase() || s[0]?.toUpperCase()

/** Vitrine pública da loja. `simular`: prévia sem banco (não grava pedido). */
export function Vitrine({ loja, simular }: { loja: LojaVitrine; simular?: boolean }) {
  const cor = CORES[loja.cor] ?? CORES.rosa
  const router = useRouter()
  const chaveCarrinho = `luvy-carrinho-${loja.slug}`

  const [maior, setMaior] = useState<boolean | null>(null)
  const [cat, setCat] = useState<string>('')
  const [busca, setBusca] = useState('')
  const [carrinho, setCarrinho] = useState<Linha[]>([])
  const [aberto, setAberto] = useState(false)
  const [etapa, setEtapa] = useState<'sacola' | 'dados'>('sacola')
  const [erro, setErro] = useState<string | null>(null)
  const [pulo, setPulo] = useState(0)
  const [aberto2, setAberto2] = useState<ProdutoVitrine | null>(null)
  const [fotoIdx, setFotoIdx] = useState(0)
  const [pendente, iniciar] = useTransition()
  const [d, setD] = useState<DadosPedido>({
    nome: '', whatsapp: '', observacao: '', endereco: '', cep: '',
    entrega: loja.entrega.retirada ? 'retirada' : loja.entrega.local ? 'local' : loja.entrega.brasil ? 'brasil' : 'combinar',
    pagamento: loja.mercadopago ? 'mercadopago' : loja.pix ? 'pix' : 'combinar',
  })

  // aviso de maioridade e sacola guardados só neste navegador
  useEffect(() => {
    try { setMaior(localStorage.getItem('luvy-18') === 'sim') } catch { setMaior(false) }
    try {
      const salvo = JSON.parse(localStorage.getItem(chaveCarrinho) ?? '[]') as { id: string; qtd: number }[]
      setCarrinho(salvo.flatMap((s) => { const p = loja.produtos.find((x) => x.id === s.id); return p ? [{ p, qtd: Math.min(s.qtd, p.disponivel) }] : [] }).filter((l) => l.qtd > 0))
    } catch {}
  }, [chaveCarrinho, loja.produtos])
  useEffect(() => {
    try { localStorage.setItem(chaveCarrinho, JSON.stringify(carrinho.map((l) => ({ id: l.p.id, qtd: l.qtd })))) } catch {}
  }, [carrinho, chaveCarrinho])
  useEffect(() => { document.body.style.overflow = aberto || aberto2 || maior === false ? 'hidden' : ''; return () => { document.body.style.overflow = '' } }, [aberto, aberto2, maior])

  const categorias = useMemo(() => Array.from(new Set(loja.produtos.map((p) => p.categoria).filter(Boolean))) as string[], [loja.produtos])
  const lista = useMemo(() => {
    const t = norm(busca.trim())
    return loja.produtos.filter((p) => (!cat || p.categoria === cat) && (!t || norm(p.nome).includes(t)))
  }, [loja.produtos, cat, busca])

  const qtdNa = (id: string) => carrinho.find((l) => l.p.id === id)?.qtd ?? 0
  function por(p: ProdutoVitrine, delta: number) {
    setErro(null)
    setCarrinho((c) => {
      const atual = c.find((l) => l.p.id === p.id)?.qtd ?? 0
      const nova = Math.max(0, Math.min(atual + delta, p.disponivel))
      if (nova === 0) return c.filter((l) => l.p.id !== p.id)
      return atual ? c.map((l) => (l.p.id === p.id ? { ...l, qtd: nova } : l)) : [...c, { p, qtd: nova }]
    })
    if (delta > 0) setPulo((n) => n + 1)
  }

  // vindo do atendente IA: soma à sacola respeitando o disponível
  function adicionarVarios(lista: { id: string; quantidade: number }[]) {
    setCarrinho((c) => {
      let n = [...c]
      for (const it of lista) {
        const p = loja.produtos.find((x) => x.id === it.id)
        if (!p || p.disponivel <= 0) continue
        const atual = n.find((l) => l.p.id === p.id)?.qtd ?? 0
        const nova = Math.min(atual + Math.max(1, it.quantidade), p.disponivel)
        n = atual ? n.map((l) => (l.p.id === p.id ? { ...l, qtd: nova } : l)) : [...n, { p, qtd: nova }]
      }
      return n
    })
    setPulo((x) => x + 1)
  }

  const subtotal = carrinho.reduce((s, l) => s + l.qtd * l.p.preco, 0)
  const gratisAcima = loja.entrega.gratis_acima != null ? Number(loja.entrega.gratis_acima) : null
  const fb = loja.entrega.brasil ? freteBrasil(loja.entrega.regioes ?? {}, d.cep ?? '', carrinho.reduce((s, l) => s + l.qtd * l.p.preco, 0), gratisAcima) : null
  const subtotalAntes = carrinho.reduce((s, l) => s + l.qtd * l.p.preco, 0)
  const gratisLocal = gratisAcima != null && subtotalAntes >= gratisAcima
  const frete = d.entrega === 'local' ? (gratisLocal ? 0 : Number(loja.entrega.local_taxa)) : d.entrega === 'brasil' ? (fb && fb.atende ? fb.valor : 0) : 0
  const faltaGratis = gratisAcima != null && (loja.entrega.local || loja.entrega.brasil) ? Math.max(0, gratisAcima - subtotalAntes) : null
  const itens = carrinho.reduce((s, l) => s + l.qtd, 0)

  function enviar(e: React.FormEvent) {
    e.preventDefault()
    setErro(null)
    iniciar(async () => {
      if (simular) {
        router.push(`/previa-loja/pedido?total=${(subtotal + frete).toFixed(2)}&n=${itens}&pg=${d.pagamento}`)
        return
      }
      const r = await criarPedido(loja.slug, carrinho.map((l) => ({ produto_id: l.p.id, quantidade: l.qtd })), d)
      if ('erro' in r && r.erro) return setErro(r.erro)
      if ('token' in r && r.token) {
        try { localStorage.removeItem(chaveCarrinho) } catch {}
        if ('pagar' in r && r.pagar) { window.location.href = r.pagar; return }
        router.push(`/loja/${loja.slug}/pedido/${r.token}`)
      }
    })
  }

  const estilo = { '--va': cor.a, '--vb': cor.b } as React.CSSProperties

  return (
    <div className={`vt ${serifa.variable}`} style={estilo}>
      {maior === false && (
        <div className="vt-18" role="dialog" aria-modal="true" aria-labelledby="vt18t">
          <div className="vt-18-caixa">
            <span className="vt-18-selo">18+</span>
            <h2 id="vt18t">{loja.nome}</h2>
            <p>Esta loja vende produtos para adultos. Para continuar, confirme que você tem 18 anos ou mais.</p>
            <button className="vt-btn" onClick={() => { try { localStorage.setItem('luvy-18', 'sim') } catch {} setMaior(true) }}>Tenho 18 anos ou mais</button>
            <a className="vt-link" href="https://www.google.com" rel="noreferrer">Sair</a>
          </div>
        </div>
      )}

      <div className="vt-faixa" role="note">
        <span>Embalagem discreta</span><i aria-hidden>✦</i>
        <span>{loja.mercadopago ? 'Pix ou cartão' : loja.pix ? 'Pagamento por Pix' : 'Pagamento combinado'}</span><i aria-hidden>✦</i>
        <span>{loja.entrega.local ? `Entrega em ${loja.cidade}` : loja.entrega.combinar ? 'Enviamos para todo o Brasil' : 'Retirada na loja'}</span>
      </div>
      <header className="vt-topo">
        <div className="vt-topo-in">
          <div className="vt-marca">{loja.logo ? <img className="vt-logo" src={loja.logo} alt={`Logo ${loja.nome}`} /> : <span className="vt-mono">{iniciais(loja.nome)}</span>}<span><strong>{loja.nome}</strong><small>{loja.cidade} · {loja.uf}</small></span></div>
          <div className="vt-topo-acoes">
          {loja.instagram && (
            <a className="vt-ig" href={`https://instagram.com/${loja.instagram}`} target="_blank" rel="noopener noreferrer" aria-label={`Instagram @${loja.instagram}`}>
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" aria-hidden><rect x="3.5" y="3.5" width="17" height="17" rx="5" /><circle cx="12" cy="12" r="4" /><circle cx="17.3" cy="6.7" r=".9" fill="currentColor" /></svg>
            </a>
          )}
          <button className="vt-sacola" onClick={() => { setAberto(true); setEtapa('sacola') }} aria-label={`Sacola com ${itens} itens`}>
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" aria-hidden><path d="M6 7h12l1 13H5zM9 7a3 3 0 016 0" /></svg>
            Sacola{itens > 0 && <em key={pulo} className="vt-cont">{itens}</em>}
          </button>
          </div>
        </div>
      </header>

      <section className="vt-hero">
        <div className={`vt-hero-cartao${loja.capa ? ' com-capa' : ''}`} style={loja.capa ? { backgroundImage: `linear-gradient(100deg, color-mix(in srgb, var(--vb) 88%, transparent) 0%, color-mix(in srgb, var(--vb) 55%, transparent) 55%, transparent 100%), url(${loja.capa})` } : undefined}>
          <span className="vt-hero-rot">{loja.nome}</span>
          <h1>{loja.descricao || `Boas-vindas à ${loja.nome}`}</h1>
          <ul className="vt-selos">
            <li>Compra discreta</li>
            {(loja.mercadopago || loja.pix) && <li>{loja.mercadopago ? 'Pix ou cartão com segurança' : 'Pix na hora'}</li>}
            {loja.entrega.retirada && <li>Retirada na loja</li>}
            {loja.entrega.local && <li>Entrega em {loja.cidade}</li>}
            {(loja.entrega.brasil || loja.entrega.combinar) && <li>Envio para todo o Brasil</li>}
            {gratisAcima != null && (loja.entrega.local || loja.entrega.brasil) && <li>Frete grátis acima de {brl(gratisAcima)}</li>}
          </ul>
          <a className="vt-btn" href="#produtos">Ver produtos</a>
        </div>
      </section>

      <div className="vt-filtros">
        <input className="vt-busca" placeholder="Buscar produto" value={busca} onChange={(e) => setBusca(e.target.value)} aria-label="Buscar produto" />
        <div className="vt-cats" role="tablist">
          <button role="tab" aria-selected={!cat} className={!cat ? 'on' : ''} onClick={() => setCat('')}>Tudo</button>
          {categorias.map((c) => <button key={c} role="tab" aria-selected={cat === c} className={cat === c ? 'on' : ''} onClick={() => setCat(c)}>{c}</button>)}
        </div>
      </div>

      <main className="vt-grade" id="produtos">
        {lista.length === 0 && <p className="vt-vazio">Nenhum produto encontrado.</p>}
        {lista.map((p) => {
          const q = qtdNa(p.id)
          const esgotado = p.disponivel <= 0
          return (
            <article key={p.id} className={`vt-prod${esgotado ? ' esgotado' : ''}${q ? ' na-sacola' : ''}`}>
              <div className="vt-foto" role="button" tabIndex={0} aria-label={`Ver ${p.nome}`} onClick={() => { setAberto2(p); setFotoIdx(0) }} onKeyDown={(e) => { if (e.key === 'Enter') { setAberto2(p); setFotoIdx(0) } }}>
                {p.foto ? <img src={p.foto} alt={p.nome} loading="lazy" /> : <span>{iniciais(p.nome)}</span>}
                {p.destaque && !esgotado && <em className="destaque">Destaque</em>}
                {esgotado && <em>Esgotado</em>}
                {!esgotado && p.disponivel <= 3 && <em className="ultimas">Últimas {p.disponivel}</em>}
                {!esgotado && p.preco_de && <em className="promo">-{Math.round((1 - p.preco / p.preco_de) * 100)}%</em>}
              </div>
              <div className="vt-info">
                {p.categoria && <small>{p.categoria}</small>}
                <h3><button type="button" className="vt-nome" onClick={() => { setAberto2(p); setFotoIdx(0) }}>{p.nome}</button></h3>
                {p.preco_de ? <b className="vt-promo"><s>{brl(p.preco_de)}</s>{brl(p.preco)}</b> : <b>{brl(p.preco)}</b>}
              </div>
              {esgotado ? (
                <button className="vt-add" disabled>Indisponível</button>
              ) : q ? (
                <div className="vt-qtd">
                  <button onClick={() => por(p, -1)} aria-label={`Tirar um ${p.nome}`}>−</button>
                  <span>{q}</span>
                  <button onClick={() => por(p, 1)} disabled={q >= p.disponivel} aria-label={`Mais um ${p.nome}`}>+</button>
                </div>
              ) : (
                <button className="vt-add" onClick={() => por(p, 1)}>Adicionar</button>
              )}
            </article>
          )
        })}
      </main>

      {itens > 0 && !aberto && (
        <button className="vt-barra" onClick={() => { setAberto(true); setEtapa('sacola') }}>
          <span>{itens} {itens === 1 ? 'item' : 'itens'}</span><strong>Ver sacola · {brl(subtotal)}</strong>
        </button>
      )}

      {loja.atendente?.ativo && (
        <ChatAtendente slug={loja.slug} nomeAtendente={loja.atendente.nome || 'Lia'} nomeLoja={loja.nome} whatsapp={loja.whatsapp} aoAdicionar={adicionarVarios} />
      )}

      <footer className="vt-rodape">
        <div className="vt-rodape-grade">
          <div>
            <h4>{loja.nome}</h4>
            <p>{loja.sobre || `Bem-estar íntimo em ${loja.cidade} · ${loja.uf}, com atendimento acolhedor e discreto.`}</p>
          </div>
          <div>
            <h4>Atendimento</h4>
            {loja.horario && <p>{loja.horario}</p>}
            {loja.whatsapp && <p><a href={linkWhatsApp(loja.whatsapp, `Oi! Vim pela loja online da ${loja.nome}.`)} target="_blank" rel="noopener noreferrer">WhatsApp da loja</a></p>}
            {loja.instagram && <p><a href={`https://instagram.com/${loja.instagram}`} target="_blank" rel="noopener noreferrer">@{loja.instagram}</a></p>}
            {loja.entrega.retirada && loja.entrega.endereco_retirada && <p>Retirada: {loja.entrega.endereco_retirada}</p>}
          </div>
          <div>
            <h4>Sua compra</h4>
            <p>Embalagem sem identificação do conteúdo.</p>
            <p>{loja.mercadopago ? 'Pix ou cartão pelo Mercado Pago' : loja.pix ? 'Pix direto para a loja' : 'Pagamento combinado com a loja'}</p>
            <p>Seus dados são usados só para este pedido.</p>
          </div>
        </div>
        <p className="vt-feito">Venda somente para maiores de 18 anos · Loja criada com <a href="/" target="_blank" rel="noopener">LuvyMetrics</a></p>
      </footer>

      {aberto2 && (() => {
        const p = aberto2
        const fotos = p.fotos?.length ? p.fotos : p.foto ? [p.foto] : []
        const q = qtdNa(p.id)
        return (
          <div className="vt-modal-fundo" onClick={() => setAberto2(null)}>
            <div className="vt-modal" role="dialog" aria-modal="true" aria-label={p.nome} onClick={(e) => e.stopPropagation()}>
              <button className="vt-fechar vt-modal-x" onClick={() => setAberto2(null)} aria-label="Fechar">×</button>
              <div className="vt-modal-fotos">
                <div className="vt-modal-foto">{fotos[fotoIdx] ? <img src={fotos[fotoIdx]} alt={p.nome} /> : <span>{iniciais(p.nome)}</span>}</div>
                {fotos.length > 1 && (
                  <div className="vt-modal-mini">
                    {fotos.map((f, i) => <button key={f} className={i === fotoIdx ? 'on' : ''} onClick={() => setFotoIdx(i)} aria-label={`Foto ${i + 1}`}><img src={f} alt="" /></button>)}
                  </div>
                )}
              </div>
              <div className="vt-modal-info">
                {p.categoria && <small>{p.categoria}</small>}
                <h2>{p.nome}</h2>
                {p.preco_de ? <b className="vt-promo grande"><s>{brl(p.preco_de)}</s>{brl(p.preco)}</b> : <b className="grande">{brl(p.preco)}</b>}
                {p.descricao ? <p className="vt-modal-desc">{p.descricao}</p> : <p className="vt-modal-desc apagado">Dúvidas sobre este produto? Fale com a loja.</p>}
                <ul className="vt-modal-garantias"><li>Embalagem discreta</li>{p.disponivel > 0 && p.disponivel <= 3 && <li>Últimas {p.disponivel} unidades</li>}</ul>
                {p.disponivel <= 0 ? <button className="vt-btn cheio" disabled>Indisponível</button> : q ? (
                  <div className="vt-qtd"><button onClick={() => por(p, -1)} aria-label="Menos">−</button><span>{q} na sacola</span><button onClick={() => por(p, 1)} disabled={q >= p.disponivel} aria-label="Mais">+</button></div>
                ) : <button className="vt-btn cheio" onClick={() => por(p, 1)}>Adicionar à sacola</button>}
                {q > 0 && <button className="vt-link" onClick={() => { setAberto2(null); setAberto(true); setEtapa('sacola') }}>Ver sacola</button>}
              </div>
            </div>
          </div>
        )
      })()}

      {aberto && (
        <div className="vt-gaveta-fundo" onClick={() => setAberto(false)}>
          <aside className="vt-gaveta" role="dialog" aria-modal="true" aria-label="Sacola" onClick={(e) => e.stopPropagation()}>
            <div className="vt-gaveta-topo">
              <h2>{etapa === 'sacola' ? 'Sua sacola' : 'Seus dados'}</h2>
              <button className="vt-fechar" onClick={() => setAberto(false)} aria-label="Fechar">×</button>
            </div>

            {etapa === 'sacola' ? (
              <>
                {carrinho.length === 0 ? <p className="vt-vazio">Sua sacola está vazia.</p> : (
                  <ul className="vt-itens">
                    {carrinho.map((l) => (
                      <li key={l.p.id}>
                        <span className="vt-mini">{iniciais(l.p.nome)}</span>
                        <div><strong>{l.p.nome}</strong><small>{brl(l.p.preco)} cada</small></div>
                        <div className="vt-qtd pq">
                          <button onClick={() => por(l.p, -1)} aria-label="Menos">−</button><span>{l.qtd}</span>
                          <button onClick={() => por(l.p, 1)} disabled={l.qtd >= l.p.disponivel} aria-label="Mais">+</button>
                        </div>
                      </li>
                    ))}
                  </ul>
                )}
                {faltaGratis != null && carrinho.length > 0 && (
                  <div className={`vt-gratis${faltaGratis === 0 ? ' ok' : ''}`}>
                    <span>{faltaGratis === 0 ? 'Você ganhou frete grátis 🎉' : <>Faltam <b>{brl(faltaGratis)}</b> para frete grátis</>}</span>
                    <i style={{ width: `${Math.min(100, (subtotalAntes / gratisAcima!) * 100)}%` }} />
                  </div>
                )}
                <div className="vt-soma"><span>Subtotal</span><strong>{brl(subtotal)}</strong></div>
                <button className="vt-btn cheio" disabled={!carrinho.length} onClick={() => setEtapa('dados')}>Continuar</button>
              </>
            ) : (
              <form className="vt-form" onSubmit={enviar}>
                <label>Seu nome<input required maxLength={80} value={d.nome} onChange={(e) => setD({ ...d, nome: e.target.value })} autoComplete="name" /></label>
                <label>WhatsApp com DDD<input required inputMode="tel" value={d.whatsapp} onChange={(e) => setD({ ...d, whatsapp: e.target.value })} placeholder="(81) 99999-8888" autoComplete="tel" /></label>
                <input className="vt-armadilha" tabIndex={-1} autoComplete="off" value={d.site ?? ''} onChange={(e) => setD({ ...d, site: e.target.value })} aria-hidden />

                <fieldset>
                  <legend>Entrega</legend>
                  {loja.entrega.retirada && <label className="vt-op"><input type="radio" name="ent" checked={d.entrega === 'retirada'} onChange={() => setD({ ...d, entrega: 'retirada' })} /><span>Retirar na loja<small>{[loja.entrega.prazo_retirada, loja.entrega.endereco_retirada || 'Endereço enviado após o pedido'].filter(Boolean).join(' · ')}</small></span><b>grátis</b></label>}
                  {loja.entrega.local && <label className="vt-op"><input type="radio" name="ent" checked={d.entrega === 'local'} onChange={() => setD({ ...d, entrega: 'local' })} /><span>Entrega na cidade<small>{[loja.cidade, loja.entrega.prazo_local].filter(Boolean).join(' · ')}</small></span><b>{gratisLocal || Number(loja.entrega.local_taxa) === 0 ? 'grátis' : brl(loja.entrega.local_taxa)}</b></label>}
                  {loja.entrega.brasil && <label className="vt-op"><input type="radio" name="ent" checked={d.entrega === 'brasil'} onChange={() => setD({ ...d, entrega: 'brasil' })} /><span>Envio para todo o Brasil<small>{fb && fb.atende ? `${fb.uf}${fb.prazo ? ` · ${fb.prazo}` : ''}` : 'Digite o CEP para ver o frete e o prazo'}</small></span><b>{fb && fb.atende ? (fb.valor === 0 ? 'grátis' : brl(fb.valor)) : 'pelo CEP'}</b></label>}
                  {loja.entrega.combinar && <label className="vt-op"><input type="radio" name="ent" checked={d.entrega === 'combinar'} onChange={() => setD({ ...d, entrega: 'combinar' })} /><span>Envio (Correios ou outro)<small>Frete combinado com a loja</small></span><b>a combinar</b></label>}
                </fieldset>
                {d.entrega === 'brasil' && (
                  <label>CEP<input required inputMode="numeric" value={d.cep ?? ''} onChange={(e) => setD({ ...d, cep: formatarCep(e.target.value) })} placeholder="00000-000" autoComplete="postal-code" />
                    {fb && !fb.atende && (d.cep ?? '').replace(/\D/g, '').length === 8 && <small className="vt-erro-mini">{fb.uf ? 'A loja ainda não envia para a sua região.' : 'CEP não encontrado.'}</small>}
                  </label>
                )}
                {(d.entrega === 'local' || d.entrega === 'brasil') && <label>Endereço completo{d.entrega === 'brasil' && <small className="vt-dica-mini">Rua, número, complemento, bairro e cidade</small>}<input required minLength={8} value={d.endereco} onChange={(e) => setD({ ...d, endereco: e.target.value })} autoComplete="street-address" /></label>}

                <fieldset>
                  <legend>Pagamento</legend>
                  {loja.mercadopago && <label className="vt-op destaque"><input type="radio" name="pg" checked={d.pagamento === 'mercadopago'} onChange={() => setD({ ...d, pagamento: 'mercadopago' })} /><span>Pix ou cartão<small>Pagamento seguro pelo Mercado Pago · confirmação na hora</small></span><b className="vt-mp">Mercado Pago</b></label>}
                  {loja.pix && <label className="vt-op"><input type="radio" name="pg" checked={d.pagamento === 'pix'} onChange={() => setD({ ...d, pagamento: 'pix' })} /><span>{loja.mercadopago ? 'Pix direto para a loja' : 'Pix'}<small>Você recebe o QR Code na próxima tela</small></span></label>}
                  <label className="vt-op"><input type="radio" name="pg" checked={d.pagamento === 'combinar'} onChange={() => setD({ ...d, pagamento: 'combinar' })} /><span>Combinar com a loja<small>Cartão, dinheiro ou outra forma</small></span></label>
                </fieldset>
                <label>Observação (opcional)<input maxLength={300} value={d.observacao} onChange={(e) => setD({ ...d, observacao: e.target.value })} /></label>

                <div className="vt-soma"><span>Produtos</span><span>{brl(subtotal)}</span></div>
                {frete > 0 && <div className="vt-soma"><span>Entrega</span><span>{brl(frete)}</span></div>}
                <div className="vt-soma total"><span>Total</span><strong>{brl(subtotal + frete)}</strong></div>
                {erro && <p className="vt-erro" role="alert">{erro}</p>}
                <button className="vt-btn cheio" disabled={pendente || (d.entrega === 'brasil' && !(fb && fb.atende))}>{pendente ? 'Enviando…' : d.pagamento === 'mercadopago' ? 'Ir para o pagamento' : 'Fazer pedido'}</button>
                <button type="button" className="vt-link" onClick={() => setEtapa('sacola')}>Voltar para a sacola</button>
              </form>
            )}
          </aside>
        </div>
      )}
    </div>
  )
}
