import { previaLiberada } from '@/lib/previa'
import { notFound } from 'next/navigation'
import { PedidoConfirmado } from '../../loja/PedidoConfirmado'
import '../../loja/vitrine.css'

export default async function PreviaPedido({ searchParams }: { searchParams: Promise<{ total?: string; pg?: string; st?: string }> }) {
  if (!previaLiberada()) notFound()
  const { total, pg, st } = await searchParams
  const ordem = ['novo', 'pago', 'separado', 'enviado', 'entregue']
  const status = ordem.includes(st ?? '') ? st! : 'novo'
  const agora = Date.now()
  const eventos = ordem.slice(0, ordem.indexOf(status) + 1).map((s, i) => ({ status: s, em: new Date(agora - (4 - i) * 3600000).toISOString() }))
  const t = Math.max(0, Number(total) || 0)
  return (
    <PedidoConfirmado
      simulado
      pedido={{
        numero: 42, status, eventos, rastreio: status === 'enviado' || status === 'entregue' ? 'AB123456789BR' : null, total: t, subtotal: t, frete: 0, entrega: 'retirada', pagamento: pg === 'combinar' ? 'combinar' : pg === 'mercadopago' ? 'mercadopago' : 'pix', pago_por: pg === 'mercadopago' && status !== 'novo' ? 'pix' : null,
        cliente: 'Cliente de exemplo', criado_em: new Date().toISOString(),
        loja: { nome: 'Amor & Cia', slug: 'previa', cidade: 'Recife', cor: 'rosa', whatsapp: '81999999999', pix_chave: 'exemplo@luvymetrics.com.br', pix_nome: 'Amor e Cia', endereco_retirada: 'Rua do Exemplo, 100 - Boa Vista' },
        itens: [{ nome: 'Itens da sua sacola', quantidade: 1, preco: t }],
      }}
    />
  )
}
