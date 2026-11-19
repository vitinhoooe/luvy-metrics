'use client'
import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { Logotipo } from '@/components/Marca'
import { Logo3D } from './Logo3D'
import { LojaAoVivo } from './LojaAoVivo'

// Entrar / recuperar senha: o logo 3D (momento de marca, para quem já é cliente).
// Criar conta: a mini loja interativa (para convencer quem ainda não é).
export function LadoConta() {
  const p = usePathname()
  const novaConta = p.startsWith('/criar-conta')

  return (
    <aside className={`lv-conta-lado${novaConta ? ' demo' : ' marca'}`}>
      <span className="lv-conta-raio" aria-hidden />
      <Link href="/" className="lv-brand lv-conta-lado-marca" aria-label="LuvyMetrics, início"><Logotipo animar /></Link>
      {novaConta ? (
        <>
          <div className="lv-conta-titulo">
            <h2>
              Vendeu no balcão.
              <span>A vitrine já sabe.</span>
            </h2>
            <p>Um estoque só para a loja física e a online. Experimente: venda um produto e veja a vitrine atualizar.</p>
          </div>
          <LojaAoVivo />
          <p className="lv-demo-nota">Loja de exemplo, com produtos e valores fictícios.</p>
        </>
      ) : (
        <>
          <div className="lv-palco">
            <Logo3D />
            <span className="lv-chao-grade" aria-hidden />
          </div>
          <div className="lv-conta-titulo centro">
            <h2>Estoque, balcão, vitrine e pedidos da sua loja num controle só.</h2>
          </div>
          <ul className="lv-conta-recursos" aria-label="O que tem no LuvyMetrics">
            <li>Estoque</li><li>Balcão</li><li>Site próprio</li><li>Pedidos</li><li>Atendente IA</li><li>Lucro real</li>
          </ul>
        </>
      )}
    </aside>
  )
}
