'use client'

/*
 * O vídeo do LuvyMetrics (feito no Remotion, em video/), tocando dentro da página.
 * Capa com play; ao clicar, toca com som. Outros botões da página podem disparar
 * o evento 'luvy-video-play' para rolar até aqui e tocar.
 */
import { useEffect, useRef, useState } from 'react'
import './video.css'

const SRC = '/video/luvy-produto.mp4'
const CAPA = '/video/luvy-produto-capa.jpg'

export default function VideoReal({ id = 'video' }: { id?: string }) {
  const v = useRef<HTMLVideoElement>(null)
  const [tocou, setTocou] = useState(false)

  const tocar = () => {
    const el = v.current
    if (!el) return
    setTocou(true)
    el.muted = false
    el.play().catch(() => { el.muted = true; el.play() })
  }

  useEffect(() => {
    const f = () => tocar()
    window.addEventListener('luvy-video-play', f)
    return () => window.removeEventListener('luvy-video-play', f)
  }, [])

  // pausa quando sai da tela
  useEffect(() => {
    const el = v.current
    if (!el) return
    const io = new IntersectionObserver(([e]) => { if (!e.isIntersecting) el.pause() }, { threshold: 0.2 })
    io.observe(el)
    return () => io.disconnect()
  }, [])

  return (
    <div className="vx" id={id}>
      <div className="vx-tela vr-tela">
        <video ref={v} src={SRC} poster={CAPA} preload="metadata" playsInline controls={tocou}
          aria-label="Vídeo: o LuvyMetrics por dentro, com telas reais" />
        {!tocou && (
          <button className="vx-capa vr-capa" onClick={tocar} aria-label="Assistir ao vídeo">
            <span className="vx-play" aria-hidden><svg width="28" height="28" viewBox="0 0 24 24"><path d="M8 5.5v13l11-6.5z" fill="currentColor" /></svg></span>
            <p><strong>O Luvy por dentro</strong><span>Telas reais · 44 segundos</span></p>
          </button>
        )}
      </div>
    </div>
  )
}
