'use server'
import { revalidatePath } from 'next/cache'
import { redirect } from 'next/navigation'
import { exigirEdicao, mensagemErro } from '@/lib/sessao'

function voltar(msg: string, tipo: 'ok' | 'erro', aba: string) {
  revalidatePath('/pedidos')
  revalidatePath('/painel')
  redirect(`/pedidos?f=${aba}&${tipo}=${encodeURIComponent(msg)}`)
}

export async function acaoPedido(fd: FormData) {
  const { supabase, loja } = await exigirEdicao('vitrine')
  const id = String(fd.get('id') ?? '')
  const acao = String(fd.get('acao') ?? '')
  const abaPedida = String(fd.get('aba') ?? '')
  const aba = ['atrasados', 'abertos', 'novo', 'pago', 'separado', 'enviado', 'entregue', 'cancelado', 'todos'].includes(abaPedida) ? abaPedida : 'abertos'
  let erro: string | null = null
  let ok = 'Status atualizado.'

  if (acao === 'confirmar') {
    const { error } = await supabase.rpc('confirmar_pedido', { p_pedido: id })
    if (error) erro = error.message.includes('ESTOQUE_INSUFICIENTE') ? `${mensagemErro(error)} Ajuste o estoque ou cancele o pedido.` : mensagemErro(error)
    ok = 'Pagamento confirmado. Estoque baixado e venda registrada. Avise a cliente pelo botão verde.'
  } else if (acao === 'cancelar') {
    const { error } = await supabase.rpc('cancelar_pedido', { p_pedido: id })
    if (error) erro = mensagemErro(error)
    ok = 'Pedido cancelado e estoque devolvido.'
  } else if (acao === 'avancar') {
    const { data: pe } = await supabase.from('pedidos').select('status, entrega').eq('id', id).eq('loja_id', loja.id).single()
    // retirada na loja: de "separado" vai direto para "entregue"
    const prox = !pe ? undefined
      : pe.status === 'pago' ? 'separado'
      : pe.status === 'separado' ? (pe.entrega === 'retirada' ? 'entregue' : 'enviado')
      : pe.status === 'enviado' ? 'entregue' : undefined
    if (!prox) erro = 'Este pedido não pode avançar.'
    else {
      const rastreio = String(fd.get('rastreio') ?? '').trim().slice(0, 40)
      const dados: Record<string, string> = { status: prox, atualizado_em: new Date().toISOString() }
      if (prox === 'enviado' && rastreio) dados.codigo_rastreio = rastreio
      const { error } = await supabase.from('pedidos').update(dados).eq('id', id).eq('loja_id', loja.id)
      if (error) erro = mensagemErro(error)
      ok = prox === 'enviado' ? 'Pedido a caminho. Avise a cliente pelo botão verde.' : prox === 'entregue' ? 'Pedido entregue.' : 'Pedido separado.'
    }
  } else erro = 'Ação inválida.'

  if (erro) voltar(erro, 'erro', aba)
  voltar(ok, 'ok', aba)
}
