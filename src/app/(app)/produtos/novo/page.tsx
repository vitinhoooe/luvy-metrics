import Link from 'next/link'
import type { Metadata } from 'next'
import { exigirLoja } from '@/lib/sessao'
import { FormProduto } from '../FormProduto'

export const metadata: Metadata = { title: 'Novo produto' }

export default async function NovoProduto({ searchParams }: { searchParams: Promise<{ salvo?: string }> }) {
  const { podeEditar } = await exigirLoja()
  const { salvo } = await searchParams
  return (
    <>
      <div className="lv-top">
        <div>
          <h1>Novo produto</h1>
          <p><Link href="/produtos">← Produtos</Link> · Tem muitos? <Link href="/produtos/importar" style={{ textDecoration: 'underline' }}>Importe a planilha</Link></p>
        </div>
      </div>
      <div className="lv-card" style={{ maxWidth: 760 }}>
        <FormProduto podeEditar={podeEditar} salvo={salvo === '1'} />
      </div>
    </>
  )
}
