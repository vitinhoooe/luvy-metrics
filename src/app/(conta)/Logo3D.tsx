'use client'
import { useEffect, useRef } from 'react'

/**
 * O logo 3D (renderizado no Remotion) em loop, com fundo transparente (WebM).
 * No Safari cai para o MP4 de fundo preto com mix-blend-mode: screen.
 * Acompanha o mouse com uma inclinação leve.
 */
export function Logo3D() {
  const caixa = useRef<HTMLDivElement>(null)
  const video = useRef<HTMLVideoElement>(null)

  useEffect(() => {
    const el = caixa.current
    if (!el) return
    // Safari toca WebM mas ignora a transparência: troca para o MP4 com mistura "screen"
    const ua = navigator.userAgent
    const webkit = /Safari/.test(ua) && !/Chrome|Chromium|Edg|OPR|Android/.test(ua)
    if (webkit && video.current) {
      video.current.src = '/video/logo-3d.mp4'
      video.current.classList.add('tela')
      video.current.play().catch(() => {})
    }
    const reduz = window.matchMedia('(prefers-reduced-motion: reduce)').matches
    if (reduz) {
      video.current?.pause()
      return
    }
    const painel = el.closest('.lv-conta-lado') as HTMLElement | null
    const alvo = painel ?? el
    let raf = 0
    const mover = (e: PointerEvent) => {
      const r = alvo.getBoundingClientRect()
      const x = (e.clientX - r.left) / r.width - 0.5
      const y = (e.clientY - r.top) / r.height - 0.5
      cancelAnimationFrame(raf)
      raf = requestAnimationFrame(() => {
        el.style.setProperty('--rx', `${(-y * 10).toFixed(2)}deg`)
        el.style.setProperty('--ry', `${(x * 14).toFixed(2)}deg`)
        el.style.setProperty('--gx', `${(50 + x * 30).toFixed(1)}%`)
        el.style.setProperty('--gy', `${(50 + y * 30).toFixed(1)}%`)
      })
    }
    const sair = () => {
      el.style.setProperty('--rx', '0deg'); el.style.setProperty('--ry', '0deg')
      el.style.setProperty('--gx', '50%'); el.style.setProperty('--gy', '50%')
    }
    alvo.addEventListener('pointermove', mover)
    alvo.addEventListener('pointerleave', sair)
    return () => { alvo.removeEventListener('pointermove', mover); alvo.removeEventListener('pointerleave', sair); cancelAnimationFrame(raf) }
  }, [])

  return (
    <div className="lv-logo3d" ref={caixa} aria-hidden>
      <span className="lv-logo3d-luz" />
      <video
        ref={video}
        poster="/video/logo-3d.png"
        autoPlay muted loop playsInline preload="auto"
        onLoadedData={(e) => {
          // navegador sem WebM: caiu no MP4 de fundo preto, então usa a mistura "screen"
          if (e.currentTarget.currentSrc.endsWith('.mp4')) e.currentTarget.classList.add('tela')
        }}
      >
        <source src="/video/logo-3d.webm" type='video/webm; codecs="vp9"' />
        <source src="/video/logo-3d.mp4" type="video/mp4" />
      </video>
      <span className="lv-logo3d-chao" />
    </div>
  )
}
