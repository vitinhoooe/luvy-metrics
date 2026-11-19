'use client'
import { useEffect, useRef, useState } from 'react'
import { brl } from '@/lib/formato'

// produtos de exemplo: só para mostrar como o estoque único funciona
const PRODUTOS = [
  { nome: 'Gel beijável morango', preco: 24.9, estoque: 4, cor: 'linear-gradient(140deg, #ffc2d8, #f0508c)' },
  { nome: 'Óleo de massagem', preco: 39.9, estoque: 3, cor: 'linear-gradient(140deg, #ffe0c4, #e88a5a)' },
  { nome: 'Vibrador bullet', preco: 89.9, estoque: 2, cor: 'linear-gradient(140deg, #e3d4f2, #7a488c)' },
  { nome: 'Body de renda', preco: 119, estoque: 1, cor: 'linear-gradient(140deg, #3a2c3f, #17121a)' },
]

export function LojaAoVivo() {
  const [estoque, setEstoque] = useState(() => PRODUTOS.map((p) => p.estoque))
  const [total, setTotal] = useState(0)
  const [vendas, setVendas] = useState(0)
  const [flash, setFlash] = useState<number | null>(null)
  const [menos, setMenos] = useState<{ i: number; k: number } | null>(null)
  const tocou = useRef(false)

  function vender(i: number) {
    setEstoque((e) => {
      if (e[i] <= 0) return e
      const n = [...e]
      n[i] -= 1
      return n
    })
    if (estoque[i] <= 0) return
    setTotal((t) => t + PRODUTOS[i].preco)
    setVendas((v) => v + 1)
    setFlash(i)
    setMenos({ i, k: Date.now() })
    window.setTimeout(() => setFlash((f) => (f === i ? null : f)), 60)
  }

  // uma venda automática ao abrir, para mostrar o que acontece
  useEffect(() => {
    const t = window.setTimeout(() => { if (!tocou.current) vender(0) }, 1600)
    return () => window.clearTimeout(t)
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  const acabou = estoque.every((e) => e === 0)

  return (
    <>
      <div className="lv-demo" onPointerDown={() => { tocou.current = true }}>
        <section className="lv-demo-painel" aria-label="Balcão da loja (exemplo)">
          <div className="lv-demo-cab"><strong>Balcão</strong><span>{vendas} {vendas === 1 ? 'venda' : 'vendas'} hoje</span></div>
          {PRODUTOS.map((p, i) => (
            <div key={p.nome} className={`lv-demo-linha${flash === i ? ' vendeu' : ''}`}>
              <span style={{ minWidth: 0 }}><b>{p.nome}</b><small>{brl(p.preco)}</small></span>
              <span className={`lv-demo-est${estoque[i] === 0 ? ' zero' : ''}`}>{estoque[i] === 0 ? 'esgotou' : `${estoque[i]} un.`}</span>
              <button type="button" className="lv-demo-vender" onClick={() => vender(i)} disabled={estoque[i] === 0} aria-label={`Vender ${p.nome}`}>
                Vender
              </button>
            </div>
          ))}
        </section>

        <section className="lv-demo-cel" aria-label="Vitrine online da loja (exemplo)">
          <div className="lv-demo-cel-cab"><strong>Sua vitrine</strong><span><span className="lv-demo-pulso" aria-hidden />ao vivo</span></div>
          <div className="lv-demo-grade">
            {PRODUTOS.map((p, i) => (
              <div key={`${p.nome}-${menos?.i === i ? menos.k : 0}`} className={`lv-demo-item${estoque[i] === 0 ? ' esgotado' : ''}${menos?.i === i ? ' bate' : ''}`}>
                {menos?.i === i && <span key={menos.k} className="lv-demo-menos" aria-hidden>−1</span>}
                <i style={{ ['--c' as string]: p.cor }} />
                <b>{p.nome}</b>
                <span>{estoque[i] === 0 ? 'Esgotado' : `${brl(p.preco)} · ${estoque[i]} disp.`}</span>
              </div>
            ))}
          </div>
        </section>
      </div>

      <div className="lv-demo-rodape">
        <div className="lv-demo-total" aria-live="polite">
          Vendido hoje
          <strong>{brl(total)}</strong>
        </div>
        {(acabou || vendas >= 3) && (
          <button type="button" className="lv-demo-repor" onClick={() => { setEstoque(PRODUTOS.map((p) => p.estoque)); setMenos(null) }}>
            Chegou mercadoria
          </button>
        )}
      </div>
    </>
  )
}
