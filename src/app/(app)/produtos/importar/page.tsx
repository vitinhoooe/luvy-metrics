import Link from 'next/link'
import type { Metadata } from 'next'
import { exigirLoja } from '@/lib/sessao'
import { dataHora, num } from '@/lib/formato'
import { Importador } from './Importador'
import { desfazer } from './acoes'

export const metadata: Metadata = { title: 'Importar planilha' }

export default async function Importar() {
  const { supabase, podeEditar } = await exigirLoja()
  const { data: historico } = await supabase
    .from('importacoes')
    .select('id, arquivo, criados, atualizados, ignorados, desfeita, criado_em')
    .order('criado_em', { ascending: false })
    .limit(10)

  return (
    <>
      <div className="lv-top">
        <div>
          <h1>Importar planilha</h1>
          <p><Link href="/produtos">← Produtos</Link> · Nada é gravado antes de você conferir.</p>
        </div>
      </div>

      <Importador podeEditar={podeEditar} />

      {!!historico?.length && (
        <div className="lv-card" style={{ marginTop: 22, maxWidth: 820 }}>
          <h2>Importações anteriores</h2>
          <div className="lv-lista">
            {historico.map((h) => (
              <div key={h.id}>
                <span style={{ minWidth: 0 }}>
                  <strong style={{ fontWeight: 600 }}>{h.arquivo ?? 'planilha'}</strong>
                  <span style={{ display: 'block', color: 'var(--dim)', fontSize: 13 }}>
                    {dataHora(h.criado_em)} · {num(h.criados)} novos · {num(h.atualizados)} atualizados
                  </span>
                </span>
                <span className="fim">
                  {h.desfeita ? <span className="lv-selo">desfeita</span> : podeEditar && (
                    <form action={desfazer}>
                      <input type="hidden" name="id" value={h.id} />
                      <button className="lv-btn perigo pq" type="submit">Desfazer</button>
                    </form>
                  )}
                </span>
              </div>
            ))}
          </div>
        </div>
      )}
    </>
  )
}
