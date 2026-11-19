'use client'
import { useEffect, useState } from 'react'
import QRCode from 'qrcode'

/** O link da vitrine para a lojista mandar para as clientes: copiar, WhatsApp, Instagram e QR Code para o balcão. */
export function Compartilhar({ link, nomeLoja, abrir }: { link: string; nomeLoja: string; abrir?: string }) {
  const [copiado, setCopiado] = useState<string | null>(null)
  const [qr, setQr] = useState<string | null>(null)
  useEffect(() => { QRCode.toDataURL(link, { margin: 1, width: 520, color: { dark: '#1e1720', light: '#ffffff' } }).then(setQr).catch(() => setQr(null)) }, [link])

  const curto = link.replace(/^https?:\/\//, '')
  const msgZap = `Oi! 💜 Agora a ${nomeLoja} tem loja online: veja os produtos, monte sua sacola e peça com discrição. ${link}`
  const msgBio = `🛍️ Loja online: ${curto}`
  const copiar = async (texto: string, qual: string) => {
    try { await navigator.clipboard.writeText(texto); setCopiado(qual); setTimeout(() => setCopiado(null), 2200) } catch {}
  }

  return (
    <section className="lv-card lv-share">
      <div className="lv-share-txt">
        <span className="lv-share-rot">O link da sua loja</span>
        <a href={abrir ?? link} target="_blank" rel="noopener noreferrer" className="lv-share-link mono">{curto}</a>
        <p>Mande para as clientes, coloque na bio do Instagram e no status do WhatsApp. Quem abrir vê seus produtos e faz o pedido.</p>
        <div className="lv-share-acoes">
          <button type="button" className="lv-btn pq" onClick={() => copiar(link, 'link')}>{copiado === 'link' ? 'Copiado ✓' : 'Copiar link'}</button>
          <a className="lv-btn lv-btn-zap pq" href={`https://wa.me/?text=${encodeURIComponent(msgZap)}`} target="_blank" rel="noopener noreferrer">Mandar no WhatsApp</a>
          <button type="button" className="lv-btn sec pq" onClick={() => copiar(msgBio, 'bio')}>{copiado === 'bio' ? 'Copiado ✓' : 'Texto para a bio'}</button>
          <a className="lv-btn sec pq" href={abrir ?? link} target="_blank" rel="noopener noreferrer">Abrir a vitrine</a>
        </div>
      </div>
      <div className="lv-share-qr">
        {qr ? <img src={qr} alt={`QR Code da loja ${nomeLoja}`} width={150} height={150} /> : <div className="lv-share-qr-vazio" />}
        {qr && <a className="lv-btn fant pq" href={qr} download={`qr-${nomeLoja.toLowerCase().replace(/[^a-z0-9]+/g, '-')}.png`}>Baixar QR para o balcão</a>}
      </div>
    </section>
  )
}
