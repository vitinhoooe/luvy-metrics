import Link from 'next/link'
import { notFound } from 'next/navigation'
import type { Metadata } from 'next'
import { exigirLoja } from '@/lib/sessao'
import { dataHora, num } from '@/lib/formato'
import { FormMovimento, FormProduto, type ProdutoForm } from '../FormProduto'
import { FotosProduto } from '../FotosProduto'
import { arquivarProduto } from '../acoes'

export const metadata: Metadata = { title: 'Produto' }

const TIPO: Record<string, string> = {
  entrada: 'Entrada', saida: 'Saída', ajuste: 'Contagem', venda: 'Venda', cancelamento: 'Venda cancelada', importacao: 'Planilha',
}

export default async function Produto({ params, searchParams }: { params: Promise<{ id: string }>; searchParams: Promise<{ novo?: string }> }) {
  const { supabase, podeEditar } = await exigirLoja()
  const { id } = await params
  const { novo } = await searchParams
  if (!/^[0-9a-f-]{36}$/i.test(id)) notFound()

  const [{ data: p }, { data: movs }] = await Promise.all([
    supabase.from('produtos').select('*').eq('id', id).eq('ativo', true).maybeSingle(),
    supabase.from('movimentos').select('id, tipo, quantidade, motivo, criado_em').eq('produto_id', id).order('criado_em', { ascending: false }).limit(30),
  ])
  if (!p) notFound()
  const produto = { ...p, custo: Number(p.custo), preco: Number(p.preco) } as ProdutoForm & { quantidade: number; estoque_minimo: number }

  return (
    <>
      <div className="lv-top">
        <div>
          <h1>{produto.nome}</h1>
          <p><Link href="/produtos">← Produtos</Link></p>
        </div>
        <div className="lv-kpi" style={{ padding: '10px 16px' }}>
          <span>Em estoque</span>
          <strong style={{ fontSize: 24, marginTop: 2, color: produto.quantidade <= produto.estoque_minimo ? 'var(--warn)' : undefined }}>{num(produto.quantidade)}</strong>
        </div>
      </div>
      {novo && <p className="lv-msg ok" style={{ marginBottom: 14 }}>Produto cadastrado.</p>}

      <div className="lv-grid c2" style={{ alignItems: 'start' }}>
        <div className="lv-card">
          <h2>Dados do produto</h2>
          <FormProduto p={produto} podeEditar={podeEditar} />
        </div>
        <div className="lv-grid">
          <div className="lv-card">
            <h2>Fotos na vitrine</h2>
            <FotosProduto produtoId={produto.id!} fotos={(p.fotos ?? []) as string[]} podeEditar={podeEditar} />
          </div>
          <div className="lv-card">
            <h2>Movimentar estoque</h2>
            <FormMovimento id={produto.id!} atual={produto.quantidade} podeEditar={podeEditar} />
          </div>
          <div className="lv-card">
            <h2>Histórico <small>últimos 30</small></h2>
            {!movs?.length ? <p style={{ color: 'var(--dim)', fontSize: 14 }}>Sem movimentações.</p> : (
              <div className="lv-lista">
                {movs.map((m) => (
                  <div key={m.id}>
                    <span className="lv-selo">{TIPO[m.tipo] ?? m.tipo}</span>
                    <span style={{ color: 'var(--dim)', fontSize: 13 }}>{dataHora(m.criado_em)}{m.motivo ? ` · ${m.motivo}` : ''}</span>
                    <span className="fim" style={{ fontWeight: 600, color: m.quantidade < 0 ? 'var(--err)' : 'var(--ok)' }}>{m.quantidade > 0 ? '+' : ''}{m.quantidade}</span>
                  </div>
                ))}
              </div>
            )}
          </div>
          {podeEditar && (
            <form action={arquivarProduto}>
              <input type="hidden" name="id" value={produto.id} />
              <button className="lv-btn perigo pq" type="submit">Remover do catálogo</button>
              <p style={{ color: 'var(--dim)', fontSize: 12.5, marginTop: 6 }}>O histórico de vendas deste produto continua guardado.</p>
            </form>
          )}
        </div>
      </div>
    </>
  )
}
