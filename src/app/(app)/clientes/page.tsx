import type { Metadata } from 'next'
import { exigirLoja } from '@/lib/sessao'
import { origem } from '@/lib/origem'
import { agruparClientes, ListaClientes, type PedidoCliente } from './ListaClientes'

export const metadata: Metadata = { title: 'Clientes' }

export default async function Clientes({ searchParams }: { searchParams: Promise<{ f?: string }> }) {
  const { supabase, loja } = await exigirLoja()
  const { f = 'todas' } = await searchParams
  const { data } = await supabase.from('pedidos').select('cliente_nome, cliente_whatsapp, total, status, criado_em').order('criado_em', { ascending: false }).limit(5000)
  const clientes = agruparClientes((data ?? []) as PedidoCliente[])
  return (
    <>
      <div className="lv-top">
        <div><h1>Clientes</h1><p>Quem compra na sua vitrine, quem volta e quem sumiu. Um toque para chamar no WhatsApp.</p></div>
      </div>
      <ListaClientes clientes={clientes} filtro={f} base="/clientes" loja={loja.nome} linkVitrine={`${await origem()}/loja/${loja.slug}`} />
    </>
  )
}
