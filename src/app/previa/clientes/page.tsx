import { agruparClientes, ListaClientes, type PedidoCliente } from '../../(app)/clientes/ListaClientes'

const d = (dias: number) => new Date(Date.now() - dias * 86400000).toISOString()
const P = (nome: string, zap: string, total: number, dias: number): PedidoCliente => ({ cliente_nome: nome, cliente_whatsapp: zap, total, status: 'entregue', criado_em: d(dias) })

const PEDIDOS: PedidoCliente[] = [
  P('Juliana M.', '81999990001', 124.7, 0), P('Juliana M.', '81999990001', 89.9, 21), P('Juliana M.', '81999990001', 64.8, 45), P('Juliana M.', '81999990001', 39.9, 80),
  P('Carla S.', '81999990002', 64.8, 2), P('Carla S.', '81999990002', 119, 30),
  P('Renata P.', '81999990003', 34.8, 75), P('Renata P.', '81999990003', 89.9, 110),
  P('Bianca R.', '81999990005', 119, 5),
  P('Patrícia L.', '81999990004', 212.5, 92), P('Patrícia L.', '81999990004', 99.9, 130), P('Patrícia L.', '81999990004', 45.8, 160),
  P('Fernanda T.', '81999990006', 39.9, 12),
]

export default async function PreviaClientes({ searchParams }: { searchParams: Promise<{ f?: string }> }) {
  const { f = 'todas' } = await searchParams
  return (
    <>
      <div className="lv-top"><div><h1>Clientes</h1><p>Quem compra na sua vitrine, quem volta e quem sumiu · dados de exemplo</p></div></div>
      <ListaClientes clientes={agruparClientes(PEDIDOS)} filtro={f} base="/previa/clientes" loja="Amor & Cia" linkVitrine="https://luvymetrics.com.br/loja/amor-e-cia" />
    </>
  )
}
