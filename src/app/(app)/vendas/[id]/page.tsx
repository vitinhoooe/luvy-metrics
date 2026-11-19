import Link from 'next/link'
import { notFound } from 'next/navigation'
import { revalidatePath } from 'next/cache'
import type { Metadata } from 'next'
import { exigirEdicao, exigirLoja } from '@/lib/sessao'
import { brl, dataHora } from '@/lib/formato'
import { FORMAS_PAGAMENTO } from '@/lib/constantes'

export const metadata: Metadata = { title: 'Venda' }

async function cancelar(fd: FormData) {
  'use server'
  const { supabase } = await exigirEdicao('pdv')
  const id = String(fd.get('id') ?? '')
  await supabase.rpc('cancelar_venda', { p_venda: id })
  revalidatePath(`/vendas/${id}`)
  revalidatePath('/vendas')
  revalidatePath('/painel')
  revalidatePath('/caixa')
}

export default async function Venda({ params }: { params: Promise<{ id: string }> }) {
  const { supabase, podeEditar } = await exigirLoja()
  const { id } = await params
  if (!/^[0-9a-f-]{36}$/i.test(id)) notFound()
  const [{ data: v }, { data: itens }] = await Promise.all([
    supabase.from('vendas').select('*').eq('id', id).maybeSingle(),
    supabase.from('venda_itens').select('id, produto_id, nome, quantidade, preco_unit, custo_unit').eq('venda_id', id),
  ])
  if (!v) notFound()
  const cancelada = v.status === 'cancelada'

  return (
    <>
      <div className="lv-top">
        <div>
          <h1>Venda #{v.numero} {cancelada && <span className="lv-selo erro">cancelada</span>}</h1>
          <p><Link href="/vendas">← Vendas</Link> · {dataHora(v.criado_em)} · {FORMAS_PAGAMENTO.find((f) => f.id === v.forma_pagamento)?.nome}</p>
        </div>
      </div>
      <div className="lv-card" style={{ maxWidth: 640 }}>
        <div className="lv-lista">
          {(itens ?? []).map((i) => (
            <div key={i.id}>
              <span>{i.quantidade}× {i.produto_id ? <Link href={`/produtos/${i.produto_id}`} style={{ textDecoration: 'underline' }}>{i.nome}</Link> : i.nome}</span>
              <span className="fim">{brl(i.quantidade * Number(i.preco_unit))}</span>
            </div>
          ))}
          {Number(v.desconto) > 0 && <div><span>Desconto</span><span className="fim">− {brl(v.desconto)}</span></div>}
          <div><strong>Total</strong><span className="fim"><strong>{brl(v.total)}</strong></span></div>
          <div><span style={{ color: 'var(--dim)' }}>Lucro bruto</span><span className="fim">{brl(Number(v.total) - Number(v.custo_total))}</span></div>
        </div>
        {!cancelada && podeEditar && v.canal !== 'historico' && (
          <form action={cancelar} style={{ marginTop: 16 }}>
            <input type="hidden" name="id" value={v.id} />
            <button className="lv-btn perigo pq" type="submit">Cancelar venda e devolver ao estoque</button>
          </form>
        )}
      </div>
    </>
  )
}
