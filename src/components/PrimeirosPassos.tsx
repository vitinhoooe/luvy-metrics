import Link from 'next/link'

export type Passo = { id: string; titulo: string; texto: string; href: string; acao: string; feito: boolean; opcional?: boolean }

const PASSOS: Omit<Passo, 'feito'>[] = [
  { id: 'produtos', titulo: 'Trazer seus produtos', texto: 'Suba a planilha que você já usa. A IA entende as colunas.', href: '/produtos/importar', acao: 'Importar planilha' },
  { id: 'historico', titulo: 'Importar vendas antigas', texto: 'Com o histórico, o “O que repor” funciona desde hoje.', href: '/vendas/importar', acao: 'Importar vendas', opcional: true },
  { id: 'venda', titulo: 'Fazer a 1ª venda no Luvy', texto: 'No balcão, ou registrando uma venda do WhatsApp ou Instagram.', href: '/vender', acao: 'Abrir o balcão' },
  { id: 'vitrine', titulo: 'Ligar sua vitrine', texto: 'Seu site próprio, com Pix e entrega, sem comissão.', href: '/vitrine', acao: 'Configurar vitrine' },
  { id: 'fornecedores', titulo: 'Salvar seus fornecedores', texto: 'Contato, prazo e pedido mínimo para repor em um toque.', href: '/fornecedores', acao: 'Ver fornecedores', opcional: true },
]

export function montarPassos(feitos: Record<string, boolean>): Passo[] {
  return PASSOS.map((p) => ({ ...p, feito: !!feitos[p.id] }))
}

/** Checklist da cliente nova. Some sozinho quando os passos principais estão feitos. */
export function PrimeirosPassos({ passos, mapa }: { passos: Passo[]; mapa?: (href: string) => string }) {
  const principais = passos.filter((p) => !p.opcional)
  if (principais.every((p) => p.feito)) return null
  const feitos = passos.filter((p) => p.feito).length
  const proximo = passos.find((p) => !p.feito && !p.opcional) ?? passos.find((p) => !p.feito)
  const ir = (h: string) => (mapa ? mapa(h) : h)
  return (
    <section className="lv-card lv-guia" aria-label="Primeiros passos" style={{ marginBottom: 14 }}>
      <div className="lv-guia-topo">
        <div>
          <h2>Deixe sua loja pronta</h2>
          <p>{feitos === 0 ? 'Leva uns 15 minutos. Comece pelos produtos.' : `${feitos} de ${passos.length} feitos. Falta pouco.`}</p>
        </div>
        <div className="lv-guia-barra" role="progressbar" aria-valuenow={feitos} aria-valuemin={0} aria-valuemax={passos.length} aria-label="Progresso">
          <span style={{ width: `${(feitos / passos.length) * 100}%` }} />
        </div>
      </div>
      <ol className="lv-guia-lista">
        {passos.map((p, i) => (
          <li key={p.id} className={`${p.feito ? 'feito' : ''}${p.id === proximo?.id ? ' agora' : ''}`}>
            <span className="marca" aria-hidden>{p.feito ? '✓' : i + 1}</span>
            <div className="txt">
              <strong>{p.titulo}{p.opcional && <em> · opcional</em>}</strong>
              <span>{p.texto}</span>
            </div>
            {p.feito ? <span className="lv-selo ok">feito</span> : <Link href={ir(p.href)} className={`lv-btn pq${p.id === proximo?.id ? '' : ' sec'}`}>{p.acao}</Link>}
          </li>
        ))}
      </ol>
    </section>
  )
}
