import Link from 'next/link'
import { ImportarHistorico } from '../../(app)/vendas/importar/ImportarHistorico'

export default function PreviaImportarVendas() {
  return (
    <>
      <div className="lv-top">
        <div>
          <h1>Importar vendas antigas</h1>
          <p><Link href="/previa/vendas">← Vendas</Link> · Traga o histórico do sistema antigo e o Luvy já começa sabendo o que gira.</p>
        </div>
      </div>
      <ImportarHistorico podeEditar simular />
    </>
  )
}
