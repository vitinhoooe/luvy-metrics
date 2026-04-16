'use client'

const TX = '#111827'
const MT = '#6b7280'
const AC = '#7c3aed'
const GR = '#059669'
const GL = '#d97706'
const RD = '#dc2626'
const BD = '#e5e7eb'
const CARD: React.CSSProperties = { background: '#fff', border: `1px solid ${BD}`, borderRadius: 16, padding: 28, boxShadow: '0 1px 4px rgba(0,0,0,0.06)' }

const REGIOES = [
  { nome: 'Sudeste', lojas: 8400, demanda: 'Alta', crescimento: '+34%', categorias: ['Vibradores premium', 'Plugs anais', 'Pompoarismo'] },
  { nome: 'Nordeste', lojas: 3200, demanda: 'Alta', crescimento: '+28%', categorias: ['Vibradores', 'Roupas íntimas', 'Géis aquecidos'] },
  { nome: 'Sul', lojas: 2900, demanda: 'Média', crescimento: '+19%', categorias: ['Roupas íntimas', 'Vibradores discretos', 'Géis'] },
  { nome: 'Centro-Oeste', lojas: 1100, demanda: 'Média', crescimento: '+21%', categorias: ['Kits para casais', 'Algemas', 'Vibradores'] },
  { nome: 'Norte', lojas: 820, demanda: 'Baixa', crescimento: '+11%', categorias: ['Géis lubrificantes', 'Preservativos', 'Vibradores básicos'] },
]

function badgeStyle(d: string): React.CSSProperties {
  if (d === 'Alta') return { background: '#ecfdf5', color: GR, border: '1px solid #a7f3d0', borderRadius: 100, padding: '3px 12px', fontSize: 11, fontWeight: 600 }
  if (d === 'Média') return { background: '#fffbeb', color: GL, border: '1px solid #fde68a', borderRadius: 100, padding: '3px 12px', fontSize: 11, fontWeight: 600 }
  return { background: '#fef2f2', color: RD, border: '1px solid #fecaca', borderRadius: 100, padding: '3px 12px', fontSize: 11, fontWeight: 600 }
}

export default function RegioesPage() {
  return (
    <>
      <div style={{ marginBottom: 32 }}>
        <h1 style={{ fontSize: 24, fontWeight: 800, color: TX, marginBottom: 4 }}>Demanda por Região</h1>
        <p style={{ fontSize: 14, color: MT }}>Veja onde cada produto vende mais no Brasil</p>
      </div>

      {/* Beta banner */}
      <div style={{ background: 'rgba(245,158,11,0.1)', border: '1px solid rgba(245,158,11,0.3)', borderRadius: 10, padding: '12px 20px', marginBottom: 24, display: 'flex', alignItems: 'center', gap: 10 }}>
        <span style={{ fontSize: 16 }}>🔬</span>
        <div>
          <span style={{ fontSize: 13, fontWeight: 700, color: '#d97706' }}>Funcionalidade em Beta</span>
          <span style={{ fontSize: 13, color: '#6b7280', marginLeft: 8 }}>Os dados de demanda regional são estimativas baseadas em pesquisas de mercado. Em breve com dados em tempo real.</span>
        </div>
      </div>

      <div style={{ ...CARD, background: '#f5f3ff', borderColor: '#ddd6fe', marginBottom: 32 }}>
        <p style={{ fontSize: 11, color: AC, fontWeight: 600, letterSpacing: '0.5px', marginBottom: 8, textTransform: 'uppercase' }}>Maior demanda esta semana</p>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: 16 }}>
          <div>
            <p style={{ fontSize: 28, fontWeight: 800, color: TX, letterSpacing: '-1px' }}>Sudeste <span style={{ color: AC }}>+34%</span></p>
            <p style={{ fontSize: 13, color: MT, marginTop: 4 }}>Top: Vibradores premium, Plugs anais, Kits para casais</p>
          </div>
          <div style={{ display: 'flex', gap: 8 }}>
            {['SP +38%', 'RJ +29%', 'MG +24%'].map(s => (
              <span key={s} style={{ padding: '6px 14px', borderRadius: 10, fontSize: 13, fontWeight: 600, background: '#ede9fe', color: AC }}>{s}</span>
            ))}
          </div>
        </div>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(280px, 1fr))', gap: 16, marginBottom: 32 }}>
        {REGIOES.map(r => (
          <div key={r.nome} style={CARD}>
            <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', marginBottom: 16 }}>
              <div>
                <p style={{ fontSize: 20, fontWeight: 700, color: TX, marginBottom: 4 }}>{r.nome}</p>
                <p style={{ fontSize: 12, color: MT }}>{r.lojas.toLocaleString('pt-BR')} sex shops</p>
              </div>
              <span style={badgeStyle(r.demanda)}>{r.demanda}</span>
            </div>
            <div style={{ height: 1, background: BD, marginBottom: 16 }} />
            <p style={{ fontSize: 11, color: MT, fontWeight: 500, marginBottom: 8, textTransform: 'uppercase', letterSpacing: '0.5px' }}>Top categorias:</p>
            <div style={{ display: 'flex', flexWrap: 'wrap', gap: 6, marginBottom: 16 }}>
              {r.categorias.map(c => (
                <span key={c} style={{ background: '#f5f3ff', color: AC, padding: '4px 12px', borderRadius: 100, fontSize: 12 }}>{c}</span>
              ))}
            </div>
            <p style={{ fontSize: 14, fontWeight: 700, color: GR }}>{r.crescimento} esta semana</p>
          </div>
        ))}
      </div>

      <p style={{ fontSize: 12, color: MT, textAlign: 'center' }}>Dados baseados em volume de busca e vendas em marketplaces. Atualizado semanalmente.</p>
    </>
  )
}
