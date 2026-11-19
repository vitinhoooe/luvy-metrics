// Exporta os dados da própria loja em CSV (abre no Excel). RLS garante que cada loja só baixa o que é dela.
import { NextResponse, type NextRequest } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { FORMAS_PAGAMENTO, NOME_CANAL } from '@/lib/constantes'
import { agruparClientes, type PedidoCliente } from '../../(app)/clientes/ListaClientes'

const celula = (v: unknown) => {
  if (v === null || v === undefined) return ''
  const s = typeof v === 'number' ? String(v).replace('.', ',') : String(v)
  return /[;"\n\r]/.test(s) ? `"${s.replace(/"/g, '""')}"` : s
}
// ; e BOM: o Excel em português abre com acentos e colunas certas
const csv = (cab: string[], linhas: unknown[][]) => '﻿' + [cab, ...linhas].map((l) => l.map(celula).join(';')).join('\r\n')
const dataBr = (iso: string) => new Date(iso).toLocaleString('pt-BR', { timeZone: 'America/Sao_Paulo' })

export async function GET(req: NextRequest) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ erro: 'Entre na sua conta.' }, { status: 401 })
  const tipo = req.nextUrl.searchParams.get('tipo')
  let corpo = ''

  if (tipo === 'produtos') {
    const { data } = await supabase.from('produtos').select('nome, categoria, codigo_barras, sku, fornecedor, custo, preco, quantidade, estoque_minimo, ativo').order('nome').limit(50000)
    corpo = csv(['Produto', 'Categoria', 'Código de barras', 'SKU', 'Fornecedor', 'Custo', 'Preço', 'Estoque', 'Estoque mínimo', 'Ativo'],
      (data ?? []).map((p) => [p.nome, p.categoria, p.codigo_barras, p.sku, p.fornecedor, Number(p.custo), Number(p.preco), p.quantidade, p.estoque_minimo, p.ativo ? 'sim' : 'não']))
  } else if (tipo === 'vendas') {
    const { data } = await supabase.from('venda_itens')
      .select('nome, quantidade, preco_unit, custo_unit, vendas!inner(numero, criado_em, canal, forma_pagamento, status, desconto, total)')
      .limit(100000)
    type V = { numero: number; criado_em: string; canal: string; forma_pagamento: string; status: string; desconto: number; total: number }
    const linhas = (data ?? []).map((i) => ({ ...i, v: (Array.isArray(i.vendas) ? i.vendas[0] : i.vendas) as V }))
      .sort((a, b) => b.v.criado_em.localeCompare(a.v.criado_em))
    corpo = csv(['Venda', 'Data', 'Canal', 'Pagamento', 'Situação', 'Produto', 'Quantidade', 'Preço unitário', 'Custo unitário', 'Desconto da venda', 'Total da venda'],
      linhas.map((i) => [i.v.numero, dataBr(i.v.criado_em), NOME_CANAL[i.v.canal] ?? i.v.canal,
        i.v.canal === 'historico' ? '' : FORMAS_PAGAMENTO.find((f) => f.id === i.v.forma_pagamento)?.nome ?? i.v.forma_pagamento,
        i.v.status === 'cancelada' ? 'cancelada' : 'concluída', i.nome, i.quantidade, Number(i.preco_unit), Number(i.custo_unit), Number(i.v.desconto), Number(i.v.total)]))
  } else if (tipo === 'clientes') {
    const { data } = await supabase.from('pedidos').select('cliente_nome, cliente_whatsapp, total, status, criado_em').limit(50000)
    corpo = csv(['Cliente', 'WhatsApp', 'Compras', 'Gasto total', 'Ticket médio', 'Última compra'],
      agruparClientes((data ?? []) as PedidoCliente[]).sort((a, b) => b.gasto - a.gasto)
        .map((c) => [c.nome, c.whatsapp, c.pedidos, Math.round(c.gasto * 100) / 100, Math.round(c.ticket * 100) / 100, dataBr(c.ultimo)]))
  } else {
    return NextResponse.json({ erro: 'Tipo inválido.' }, { status: 400 })
  }

  const dia = new Date().toISOString().slice(0, 10)
  return new NextResponse(corpo, {
    headers: {
      'Content-Type': 'text/csv; charset=utf-8',
      'Content-Disposition': `attachment; filename="luvymetrics-${tipo}-${dia}.csv"`,
      'Cache-Control': 'no-store',
    },
  })
}
