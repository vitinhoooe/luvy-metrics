import Link from 'next/link'
import type { Metadata } from 'next'
import { exigirLoja } from '@/lib/sessao'
import { Conciliador } from './Conciliador'

export const metadata: Metadata = { title: 'Conferir pagamentos' }

export default async function Conciliar() {
  const { podeEditar } = await exigirLoja()
  return (
    <>
      <div className="lv-top">
        <div>
          <h1>Conferir pagamentos pelo extrato</h1>
          <p><Link href="/pedidos">← Pedidos</Link> · Cada pedido tem um valor de Pix com centavos únicos. O Luvy acha cada pagamento no extrato e confirma sozinho.</p>
        </div>
      </div>
      <Conciliador podeEditar={podeEditar} />
      <details className="lv-card" style={{ maxWidth: 860, marginTop: 14 }}>
        <summary style={{ cursor: 'pointer', fontWeight: 600 }}>Como exportar o extrato do meu banco?</summary>
        <p style={{ color: 'var(--dim)', fontSize: 14, marginTop: 8 }}>
          No app ou no site do banco, abra o extrato da conta onde cai o Pix, escolha o período (hoje, por exemplo) e procure
          “Exportar”, “Salvar extrato” ou “Baixar”. Escolha o formato <b>OFX</b> (às vezes aparece como “Money” ou “Quicken”).
          Se não tiver OFX, use CSV ou Excel salvo como CSV. Pode enviar o mesmo extrato mais de uma vez: o que já foi conferido não é confirmado de novo.
        </p>
      </details>
    </>
  )
}
