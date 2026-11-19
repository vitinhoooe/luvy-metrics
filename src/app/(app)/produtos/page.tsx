import Link from 'next/link'
import type { Metadata } from 'next'
import { exigirLoja } from '@/lib/sessao'
import { brl, num } from '@/lib/formato'
import { Icone } from '@/components/Icone'

export const metadata: Metadata = { title: 'Produtos e estoque' }

type Prod = { id: string; nome: string; categoria: string | null; codigo_barras: string | null; custo: number; preco: number; quantidade: number; estoque_minimo: number }

const FILTROS = [
  { id: '', nome: 'Todos' },
  { id: 'baixo', nome: 'Estoque baixo' },
  { id: 'esgotado', nome: 'Esgotados' },
  { id: 'preco', nome: 'Sem preço / abaixo do custo' },
]

export default async function Produtos({ searchParams }: { searchParams: Promise<{ q?: string; filtro?: string }> }) {
  const { supabase } = await exigirLoja()
  const { q = '', filtro = '' } = await searchParams

  let consulta = supabase
    .from('produtos')
    .select('id, nome, categoria, codigo_barras, custo, preco, quantidade, estoque_minimo')
    .eq('ativo', true)
    .order('nome')
    .limit(2000)
  const busca = q.trim().slice(0, 80).replace(/[%,()]/g, ' ')
  if (busca) consulta = consulta.or(`nome.ilike.%${busca}%,codigo_barras.eq.${busca},categoria.ilike.%${busca}%`)
  if (filtro === 'esgotado') consulta = consulta.eq('quantidade', 0)
  const { data } = await consulta

  let lista = (data ?? []) as Prod[]
  if (filtro === 'baixo') lista = lista.filter((p) => p.quantidade <= p.estoque_minimo)
  if (filtro === 'preco') lista = lista.filter((p) => Number(p.preco) <= 0 || Number(p.preco) <= Number(p.custo))

  const totalUn = lista.reduce((s, p) => s + p.quantidade, 0)

  return (
    <>
      <div className="lv-top">
        <div>
          <h1>Produtos e estoque</h1>
          <p>{num(lista.length)} produtos · {num(totalUn)} unidades</p>
        </div>
        <div className="lv-acoes">
          <Link href="/produtos/importar" className="lv-btn sec"><Icone nome="importar" />Importar planilha</Link>
          <Link href="/produtos/novo" className="lv-btn"><Icone nome="mais" />Novo produto</Link>
        </div>
      </div>

      <form className="lv-filtros" role="search">
        <input name="q" defaultValue={q} className="lv-input" placeholder="Buscar por nome, categoria ou código" aria-label="Buscar" />
        {filtro && <input type="hidden" name="filtro" value={filtro} />}
        <button className="lv-btn sec" type="submit"><Icone nome="buscar" />Buscar</button>
      </form>
      <div className="lv-chips" style={{ marginBottom: 14 }}>
        {FILTROS.map((f) => (
          <Link key={f.id} href={`/produtos?${new URLSearchParams({ ...(q ? { q } : {}), ...(f.id ? { filtro: f.id } : {}) })}`} className={`lv-chip${filtro === f.id ? ' on' : ''}`}>{f.nome}</Link>
        ))}
      </div>

      {lista.length === 0 ? (
        <div className="lv-card lv-vazio">
          <h3>{q || filtro ? 'Nada encontrado' : 'Nenhum produto ainda'}</h3>
          <p>{q || filtro ? 'Tente outra busca ou filtro.' : 'Importe sua planilha e seu estoque entra em 2 minutos.'}</p>
          {!q && !filtro && (
            <div className="lv-acoes">
              <Link href="/produtos/importar" className="lv-btn">Importar planilha</Link>
              <Link href="/produtos/novo" className="lv-btn sec">Cadastrar manualmente</Link>
            </div>
          )}
        </div>
      ) : (
        <div className="lv-tabela-wrap">
          <table className="lv-tabela">
            <thead>
              <tr>
                <th>Produto</th>
                <th className="dir">Estoque</th>
                <th className="dir esconde-cel">Custo</th>
                <th className="dir">Preço</th>
                <th className="dir esconde-cel">Margem</th>
              </tr>
            </thead>
            <tbody>
              {lista.map((p) => {
                const preco = Number(p.preco), custo = Number(p.custo)
                const margem = preco > 0 ? ((preco - custo) / preco) * 100 : null
                return (
                  <tr key={p.id}>
                    <td>
                      <Link href={`/produtos/${p.id}`} className="nome">{p.nome}</Link>
                      <div className="sub">{[p.categoria, p.codigo_barras].filter(Boolean).join(' · ') || '—'}</div>
                    </td>
                    <td className="dir">
                      {p.quantidade === 0 ? <span className="lv-selo erro">0</span>
                        : p.quantidade <= p.estoque_minimo ? <span className="lv-selo alerta">{p.quantidade}</span>
                        : num(p.quantidade)}
                    </td>
                    <td className="dir esconde-cel">{brl(custo)}</td>
                    <td className="dir">{preco > 0 ? brl(preco) : <span className="lv-selo alerta">sem preço</span>}</td>
                    <td className="dir esconde-cel">{margem === null ? '—' : <span style={{ color: margem <= 0 ? 'var(--err)' : undefined }}>{margem.toFixed(0)}%</span>}</td>
                  </tr>
                )
              })}
            </tbody>
          </table>
        </div>
      )}
    </>
  )
}
