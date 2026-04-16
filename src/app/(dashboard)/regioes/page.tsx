'use client'

const TX = '#faf9ff'
const MT = '#9ca3af'
const AC = '#a78bfa'
const GR = '#10b981'
const GL = '#f59e0b'
const RD = '#ef4444'
const BD = 'rgba(139,92,246,0.2)'
const CARD: React.CSSProperties = { background: '#1e1c2e', border: `1px solid ${BD}`, borderRadius: 16, padding: 28 }

const REGIOES = [
  {
    nome: 'Sudeste', lojas: 8400, demanda: 'Alta', crescimento: '+34%',
    categorias: ['Vibradores premium', 'Plugs anais', 'Pompoarismo'],
  },
  {
    nome: 'Nordeste', lojas: 3200, demanda: 'Alta', crescimento: '+28%',
    categorias: ['Vibradores', 'Roupas íntimas', 'Géis aquecidos'],
  },
  {
    nome: 'Sul', lojas: 2900, demanda: 'Média', crescimento: '+19%',
    categorias: ['Roupas íntimas', 'Vibradores discretos', 'Géis'],
  },
  {
    nome: 'Centro-Oeste', lojas: 1100, demanda: 'Média', crescimento: '+21%',
    categorias: ['Kits para casais', 'Algemas', 'Vibradores'],
  },
  {
    nome: 'Norte', lojas: 820, demanda: 'Baixa', crescimento: '+11%',
    categorias: ['Géis lubrificantes', 'Preservativos', 'Vibradores básicos'],
  },
]

function badgeStyle(d: string): React.CSSProperties {
  if (d === 'Alta') return { background: 'rgba(16,185,129,0.15)', color: GR, border: '1px solid rgba(16,185,129,0.25)', borderRadius: 100, padding: '3px 12px', fontSize: 11, fontWeight: 600 }
  if (d === 'Média') return { background: 'rgba(245,158,11,0.15)', color: GL, border: '1px solid rgba(245,158,11,0.25)', borderRadius: 100, padding: '3px 12px', fontSize: 11, fontWeight: 600 }
  return { background: 'rgba(239,68,68,0.15)', color: RD, border: '1px solid rgba(239,68,68,0.25)', borderRadius: 100, padding: '3px 12px', fontSize: 11, fontWeight: 600 }
}

export default function RegioesPage() {
  return (
    <>
      <div style={{ marginBottom: 32 }}>
        <h1 style={{ fontSize: 24, fontWeight: 800, color: TX, letterSpacing: '-0.5px', marginBottom: 4 }}>Demanda por Região</h1>
        <p style={{ fontSize: 14, color: MT }}>Veja onde cada produto vende mais no Brasil</p>
      </div>

      {/* Destaque */}
      <div style={{
        background: 'rgba(139,92,246,0.1)',
        border: '1px solid rgba(139,92,246,0.3)',
        borderRadius: 16, padding: 28, marginBottom: 32,
      }}>
        <p style={{ fontSize: 11, color: AC, fontWeight: 600, letterSpacing: '0.5px', marginBottom: 8, textTransform: 'uppercase' }}>
          Maior demanda esta semana
        </p>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: 16 }}>
          <div>
            <p style={{ fontSize: 28, fontWeight: 800, color: TX, letterSpacing: '-1px' }}>
              Sudeste <span style={{ color: '#8b5cf6' }}>+34%</span>
            </p>
            <p style={{ fontSize: 13, color: MT, marginTop: 4 }}>
              Top produtos: Vibradores premium, Plugs anais, Kits para casais
            </p>
          </div>
          <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
            {['SP +38%', 'RJ +29%', 'MG +24%'].map(s => (
              <span key={s} style={{
                padding: '6px 14px', borderRadius: 10, fontSize: 13, fontWeight: 600,
                background: 'rgba(139,92,246,0.15)', color: AC
              }}>{s}</span>
            ))}
          </div>
        </div>
      </div>

      {/* Cards grid */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(280px, 1fr))', gap: 16, marginBottom: 32 }}>
        {REGIOES.map(r => (
          <div key={r.nome} style={CARD}>
            <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', marginBottom: 16 }}>
              <div>
                <p style={{ fontSize: 20, fontWeight: 700, color: TX, marginBottom: 4 }}>{r.nome}</p>
                <p style={{ fontSize: 12, color: MT }}>{r.lojas.toLocaleString('pt-BR')} sex shops estimados</p>
              </div>
              <span style={badgeStyle(r.demanda)}>{r.demanda}</span>
            </div>

            <div style={{ height: 1, background: BD, marginBottom: 16 }} />

            <p style={{ fontSize: 11, color: MT, fontWeight: 500, marginBottom: 8, textTransform: 'uppercase', letterSpacing: '0.5px' }}>Top categorias:</p>
            <div style={{ display: 'flex', flexWrap: 'wrap', gap: 6, marginBottom: 16 }}>
              {r.categorias.map(c => (
                <span key={c} style={{
                  background: 'rgba(139,92,246,0.15)', color: AC,
                  padding: '4px 12px', borderRadius: 100, fontSize: 12,
                  display: 'inline-block',
                }}>{c}</span>
              ))}
            </div>

            <p style={{ fontSize: 14, fontWeight: 700, color: GR }}>{r.crescimento} esta semana</p>
          </div>
        ))}
      </div>

      <p style={{ fontSize: 12, color: MT, textAlign: 'center' }}>
        Dados baseados em volume de busca e vendas em marketplaces por estado. Atualizado semanalmente.
      </p>
    </>
  )
}
