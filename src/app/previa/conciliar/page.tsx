import Link from 'next/link'
import { Conciliador } from '../../(app)/pedidos/conciliar/Conciliador'

const ABERTOS = [
  { numero: 48, cliente: 'Juliana M.', valor_pix: 124.69 },
  { numero: 47, cliente: 'Patrícia L.', valor_pix: 89.89 },
  { numero: 49, cliente: 'Lívia C.', valor_pix: 89.88 },
  { numero: 50, cliente: 'Marina A.', valor_pix: 45.79 },
  { numero: 51, cliente: 'Sofia D.', valor_pix: 212.49 },
]

export default function PreviaConciliar() {
  return (
    <>
      <div className="lv-top">
        <div>
          <h1>Conferir pagamentos pelo extrato</h1>
          <p><Link href="/previa/pedidos">← Pedidos</Link> · Cada pedido tem um valor de Pix com centavos únicos. O Luvy acha cada pagamento no extrato e confirma sozinho.</p>
        </div>
      </div>
      <Conciliador podeEditar exemplo={ABERTOS} voltar="/previa/pedidos" />
    </>
  )
}
