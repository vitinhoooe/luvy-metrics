import { notFound } from 'next/navigation'
import type { Metadata } from 'next'
import { createClient } from '@/lib/supabase/server'
import { Vitrine } from '../Vitrine'
import type { LojaVitrine } from '../tipos'
import '../vitrine.css'

type Resposta = LojaVitrine | { fechada: true; nome: string } | null

async function carregar(slug: string): Promise<Resposta> {
  if (!/^[a-z0-9-]{3,40}$/.test(slug)) return null
  const supabase = await createClient()
  const { data } = await supabase.rpc('vitrine_publica', { p_slug: slug })
  return (data as Resposta) ?? null
}

export async function generateMetadata({ params }: { params: Promise<{ slug: string }> }): Promise<Metadata> {
  const loja = await carregar((await params).slug)
  if (!loja) return { title: 'Loja não encontrada' }
  return { title: { absolute: loja.nome }, description: loja.fechada ? undefined : loja.descricao ?? `Loja online da ${loja.nome}.` }
}

export default async function PaginaLoja({ params }: { params: Promise<{ slug: string }> }) {
  const loja = await carregar((await params).slug)
  if (!loja) notFound()
  if (loja.fechada) {
    return (
      <div className="vt" style={{ '--va': '#ff6fa3', '--vb': '#a23a8e' } as React.CSSProperties}>
        <main className="vt-ok">
          <h1>{loja.nome}</h1>
          <p className="vt-ok-sub">A loja online está fechada no momento. Volte em breve.</p>
        </main>
      </div>
    )
  }
  return <Vitrine loja={{ ...loja, produtos: loja.produtos.map((p) => ({ ...p, preco: Number(p.preco), preco_de: p.preco_de ? Number(p.preco_de) : null })) }} />
}
