import Link from 'next/link'
import type { Metadata } from 'next'
import { exigirLoja } from '@/lib/sessao'
import { brl, data, num } from '@/lib/formato'
import { ImportarHistorico } from './ImportarHistorico'
import { desfazerHistorico } from './acoes'

export const metadata: Metadata = { title: 'Importar vendas antigas' }

type Lote = { lote: string; vendas: number; total: number; de: string; ate: string }

export default async function ImportarVendas() {
  const { supabase, podeEditar } = await exigirLoja()
  const { data: l } = await supabase.rpc('lotes_historico')
  const lotes = (l ?? []) as Lote[]
  return (
    <>
      <div className="lv-top">
        <div>
          <h1>Importar vendas antigas</h1>
          <p><Link href="/vendas">← Vendas</Link> · Traga o histórico do sistema antigo e o Luvy já começa sabendo o que gira.</p>
        </div>
      </div>
      <ImportarHistorico podeEditar={podeEditar} />
      {lotes.length > 0 && (
        <div className="lv-card" style={{ marginTop: 22, maxWidth: 820 }}>
          <h2>Importações feitas</h2>
          <div className="lv-lista">
            {lotes.map((x) => (
              <div key={x.lote}>
                <span>{num(x.vendas)} vendas · {brl(x.total)}<span className="sub" style={{ display: 'block', color: 'var(--dim)', fontSize: 12.5 }}>de {data(x.de)} a {data(x.ate)}</span></span>
                {podeEditar && (
                  <form action={desfazerHistorico} className="fim">
                    <input type="hidden" name="lote" value={x.lote} />
                    <button type="submit" className="lv-btn sec pq">Desfazer</button>
                  </form>
                )}
              </div>
            ))}
          </div>
        </div>
      )}
    </>
  )
}
