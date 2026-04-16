'use client'

const REGIOES = [
  {
    nome: 'Sudeste',
    lojas: 8400,
    demanda: 'Alta',
    crescimento: '+34%',
    categorias: ['Vibradores premium', 'Plugs anais', 'Pompoarismo'],
    detalhe: 'São Paulo lidera com maior volume de vendas online e físico.',
  },
  {
    nome: 'Nordeste',
    lojas: 3200,
    demanda: 'Alta',
    crescimento: '+28%',
    categorias: ['Vibradores', 'Roupas íntimas', 'Géis aquecidos'],
    detalhe: 'Crescimento acelerado pela expansão do e-commerce na região.',
  },
  {
    nome: 'Sul',
    lojas: 2900,
    demanda: 'Média',
    crescimento: '+19%',
    categorias: ['Roupas íntimas', 'Vibradores discretos', 'Géis'],
    detalhe: 'Perfil de consumo voltado a produtos premium e discretos.',
  },
  {
    nome: 'Centro-Oeste',
    lojas: 1100,
    demanda: 'Média',
    crescimento: '+21%',
    categorias: ['Kits para casais', 'Algemas e acessórios', 'Vibradores'],
    detalhe: 'Brasília e Goiânia concentram a maior parte das vendas.',
  },
  {
    nome: 'Norte',
    lojas: 820,
    demanda: 'Baixa',
    crescimento: '+11%',
    categorias: ['Géis lubrificantes', 'Preservativos', 'Vibradores básicos'],
    detalhe: 'Mercado em desenvolvimento — grande potencial não explorado.',
  },
]

const CATEGORIAS_TABELA = [
  { nome: 'Vibradores',         norte: '🟡', ne: '🟢', co: '🟡', se: '🟢', sul: '🟡' },
  { nome: 'Géis lubrificantes', norte: '🟢', ne: '🟡', co: '🟡', se: '🟢', sul: '🟡' },
  { nome: 'Roupas íntimas',     norte: '🔴', ne: '🟢', co: '🟡', se: '🟡', sul: '🟢' },
  { nome: 'Kits para casais',   norte: '🔴', ne: '🟡', co: '🟢', se: '🟢', sul: '🟡' },
  { nome: 'Preservativos',      norte: '🟢', ne: '🟢', co: '🟡', se: '🟢', sul: '🟢' },
  { nome: 'Plugs anais',        norte: '🔴', ne: '🟡', co: '🟡', se: '🟢', sul: '🟡' },
]

function demandaStyle(d: string): React.CSSProperties {
  if (d === 'Alta')  return { background: 'var(--green-soft)', color: 'var(--green)',  border: '1px solid rgba(34,197,94,0.2)'   }
  if (d === 'Média') return { background: 'var(--gold-soft)',  color: 'var(--gold)',   border: '1px solid rgba(245,158,11,0.2)'  }
  return               { background: 'var(--red-soft)',   color: 'var(--red)',    border: '1px solid rgba(239,68,68,0.2)'   }
}

export default function RegioesPage() {
  return (
    <>
      <div className="mb-8">
        <h1 className="text-2xl font-bold" style={{ color: 'var(--text)' }}>Demanda por Região</h1>
        <p style={{ fontSize: 13, color: 'var(--muted)', marginTop: 4 }}>
          Veja onde cada produto vende mais no Brasil
        </p>
      </div>

      {/* Destaque */}
      <div className="mb-8 p-6 rounded-xl" style={{ background: 'var(--accent-soft)', border: '1px solid rgba(124,92,252,0.2)' }}>
        <p style={{ fontSize: 11, color: 'var(--accent)', fontWeight: 500, letterSpacing: '0.5px', marginBottom: 6 }}>
          Região com maior crescimento esta semana
        </p>
        <div className="flex items-center justify-between flex-wrap gap-4">
          <div>
            <p className="text-2xl font-bold" style={{ color: 'var(--text)' }}>
              Sudeste <span style={{ color: 'var(--accent)' }}>+34%</span>
            </p>
            <p style={{ fontSize: 13, color: 'var(--muted)', marginTop: 4 }}>
              Produtos mais buscados: Vibradores premium, Plugs anais, Kits para casais
            </p>
          </div>
          <div className="flex gap-2 flex-wrap">
            {['SP +38%', 'RJ +29%', 'MG +24%'].map((s) => (
              <span key={s} className="px-3 py-1 rounded-lg text-sm font-medium"
                style={{ background: 'rgba(124,92,252,0.15)', color: 'var(--accent)' }}>{s}</span>
            ))}
          </div>
        </div>
      </div>

      {/* Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 mb-8">
        {REGIOES.map((r) => (
          <div key={r.nome} className="p-5 rounded-xl" style={{ background: 'var(--card)', border: '1px solid var(--border)' }}>
            <div className="flex items-start justify-between mb-3">
              <div>
                <p className="font-semibold" style={{ color: 'var(--text)', fontSize: 16 }}>{r.nome}</p>
                <p style={{ fontSize: 12, color: 'var(--muted)', marginTop: 2 }}>
                  {r.lojas.toLocaleString('pt-BR')} sex shops estimados
                </p>
              </div>
              <div className="flex flex-col items-end gap-1">
                <span className="px-2 py-0.5 rounded-md text-xs font-medium" style={demandaStyle(r.demanda)}>{r.demanda}</span>
                <span style={{ fontSize: 12, color: 'var(--green)', fontWeight: 600 }}>{r.crescimento} esta semana</span>
              </div>
            </div>
            <div className="flex flex-wrap gap-1.5 mb-3">
              {r.categorias.map((c) => (
                <span key={c} className="px-2 py-0.5 rounded-md text-xs"
                  style={{ background: 'rgba(255,255,255,0.04)', color: 'var(--muted)', border: '1px solid var(--border)' }}>{c}</span>
              ))}
            </div>
            <p style={{ fontSize: 12, color: 'var(--muted2)', lineHeight: 1.6 }}>{r.detalhe}</p>
          </div>
        ))}
      </div>

      {/* Tabela */}
      <div className="rounded-xl overflow-hidden mb-6" style={{ background: 'var(--card)', border: '1px solid var(--border)' }}>
        <div className="px-6 py-4" style={{ borderBottom: '1px solid var(--border)' }}>
          <p className="font-semibold" style={{ color: 'var(--text)' }}>Demanda por categoria e região</p>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full" style={{ fontSize: 13 }}>
            <thead>
              <tr style={{ background: 'rgba(255,255,255,0.02)', borderBottom: '1px solid var(--border)' }}>
                <th className="text-left px-6 py-3" style={{ fontSize: 11, color: 'var(--muted)', fontWeight: 500 }}>Categoria</th>
                {['Norte', 'Nordeste', 'Centro-Oeste', 'Sudeste', 'Sul'].map((r) => (
                  <th key={r} className="text-center px-4 py-3" style={{ fontSize: 11, color: 'var(--muted)', fontWeight: 500 }}>{r}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {CATEGORIAS_TABELA.map((cat) => (
                <tr key={cat.nome} style={{ borderTop: '1px solid var(--border)' }}>
                  <td className="px-6 py-3 font-medium" style={{ color: 'var(--text)' }}>{cat.nome}</td>
                  {[cat.norte, cat.ne, cat.co, cat.se, cat.sul].map((v, i) => (
                    <td key={i} className="px-4 py-3 text-center text-base">{v}</td>
                  ))}
                </tr>
              ))}
            </tbody>
          </table>
        </div>
        <div className="px-6 py-3 flex items-center gap-5" style={{ borderTop: '1px solid var(--border)' }}>
          {[['🟢', 'Alta demanda'], ['🟡', 'Média'], ['🔴', 'Baixa']].map(([ic, lb]) => (
            <div key={lb} className="flex items-center gap-1.5">
              <span>{ic}</span>
              <span style={{ fontSize: 12, color: 'var(--muted)' }}>{lb}</span>
            </div>
          ))}
        </div>
      </div>

      <p style={{ fontSize: 12, color: 'var(--muted2)', textAlign: 'center' }}>
        Dados baseados em volume de busca e vendas em marketplaces por estado. Atualizado semanalmente.
      </p>
    </>
  )
}
