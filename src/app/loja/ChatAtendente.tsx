'use client'
import { useEffect, useRef, useState } from 'react'
import { brl } from '@/lib/formato'
import { linkWhatsApp } from '@/lib/pedidos'

type Acao =
  | { tipo: 'sacola'; itens: { id: string; nome: string; quantidade: number; preco: number }[] }
  | { tipo: 'whatsapp'; motivo: string }
type Msg = { papel: 'cliente' | 'atendente'; texto: string; acoes?: Acao[] }

const SUGESTOES = ['Quero um presente para casal', 'Qual lubrificante vocês indicam?', 'A entrega é discreta?']

/** Chat do atendente IA na vitrine. */
export function ChatAtendente({
  slug, nomeAtendente, nomeLoja, whatsapp, aoAdicionar,
}: {
  slug: string
  nomeAtendente: string
  nomeLoja: string
  whatsapp: string | null
  aoAdicionar: (itens: { id: string; quantidade: number }[]) => void
}) {
  const chave = `luvy-chat-${slug}`
  const [aberto, setAberto] = useState(false)
  const [msgs, setMsgs] = useState<Msg[]>([])
  const [conversa, setConversa] = useState<string | null>(null)
  const [texto, setTexto] = useState('')
  const [pensando, setPensando] = useState(false)
  const [adicionado, setAdicionado] = useState<number | null>(null)
  const fim = useRef<HTMLDivElement>(null)

  useEffect(() => {
    try {
      const s = JSON.parse(localStorage.getItem(chave) ?? 'null') as { conversa: string | null; msgs: Msg[] } | null
      if (s) { setConversa(s.conversa); setMsgs(s.msgs.slice(-30)) }
    } catch {}
  }, [chave])
  useEffect(() => {
    try { localStorage.setItem(chave, JSON.stringify({ conversa, msgs: msgs.slice(-30) })) } catch {}
    fim.current?.scrollIntoView({ behavior: 'smooth', block: 'end' })
  }, [msgs, conversa, chave])

  async function enviar(t: string) {
    const pergunta = t.trim().slice(0, 600)
    if (!pergunta || pensando) return
    setTexto('')
    setMsgs((m) => [...m, { papel: 'cliente', texto: pergunta }])
    setPensando(true)
    try {
      const r = await fetch('/api/atendente', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ slug, conversa, mensagem: pergunta, historico: slug === 'previa' ? msgs.map(({ papel, texto }) => ({ papel, texto })) : undefined }),
      })
      const d = await r.json()
      if (d.conversa) setConversa(d.conversa)
      setMsgs((m) => [...m, { papel: 'atendente', texto: d.erro ?? d.texto, acoes: d.erro ? (whatsapp ? [{ tipo: 'whatsapp', motivo: 'Tenho uma dúvida' }] : []) : d.acoes }])
    } catch {
      setMsgs((m) => [...m, { papel: 'atendente', texto: 'Não consegui responder agora. Tente de novo em instantes.' }])
    } finally {
      setPensando(false)
    }
  }

  return (
    <>
      {!aberto && (
        <button className="vt-chat-abre" onClick={() => setAberto(true)} aria-label={`Conversar com ${nomeAtendente}, atendente virtual`}>
          <span className="vt-chat-avatar" aria-hidden>{nomeAtendente[0]}</span>
          <span>Tirar dúvida</span>
        </button>
      )}
      {aberto && (
        <section className="vt-chat" role="dialog" aria-label={`Conversa com ${nomeAtendente}`}>
          <header>
            <span className="vt-chat-avatar" aria-hidden>{nomeAtendente[0]}</span>
            <div><strong>{nomeAtendente}</strong><small>Atendente virtual (IA) da {nomeLoja}</small></div>
            <button onClick={() => setAberto(false)} aria-label="Fechar conversa">×</button>
          </header>

          <div className="vt-chat-corpo" aria-live="polite">
            {msgs.length === 0 && (
              <div className="vt-chat-oi">
                <p>Oi! Sou a {nomeAtendente}, atendente virtual da loja. Posso te ajudar a escolher, tirar dúvidas de entrega e pagamento. Tudo com discrição 💜</p>
                <div className="vt-chat-sug">{SUGESTOES.map((s) => <button key={s} onClick={() => enviar(s)}>{s}</button>)}</div>
              </div>
            )}
            {msgs.map((m, i) => (
              <div key={i} className={`vt-bolha ${m.papel}`}>
                <p>{m.texto}</p>
                {m.acoes?.map((a, k) =>
                  a.tipo === 'sacola' ? (
                    <div key={k} className="vt-bolha-acao">
                      {a.itens.map((it) => <span key={it.id}>{it.quantidade}× {it.nome} · {brl(it.preco)}</span>)}
                      <button
                        className="vt-btn"
                        onClick={() => { aoAdicionar(a.itens.map((it) => ({ id: it.id, quantidade: it.quantidade }))); setAdicionado(i * 10 + k) }}
                        disabled={adicionado === i * 10 + k}
                      >
                        {adicionado === i * 10 + k ? 'Na sacola ✓' : 'Adicionar à sacola'}
                      </button>
                    </div>
                  ) : whatsapp ? (
                    <a key={k} className="vt-btn vt-zap" href={linkWhatsApp(whatsapp, `Oi! Vim pela vitrine. ${a.motivo}`)} target="_blank" rel="noopener noreferrer">Falar com a loja no WhatsApp</a>
                  ) : null,
                )}
              </div>
            ))}
            {pensando && <div className="vt-bolha atendente digitando" aria-label="Digitando"><i /><i /><i /></div>}
            <div ref={fim} />
          </div>

          <form className="vt-chat-envio" onSubmit={(e) => { e.preventDefault(); enviar(texto) }}>
            <input value={texto} onChange={(e) => setTexto(e.target.value)} maxLength={600} placeholder="Escreva sua dúvida" aria-label="Sua mensagem" />
            <button className="vt-btn" disabled={!texto.trim() || pensando} aria-label="Enviar">➤</button>
          </form>
          <p className="vt-chat-aviso">Respostas geradas por IA a partir do catálogo da loja. Não compartilhe dados sensíveis.</p>
        </section>
      )}
    </>
  )
}
