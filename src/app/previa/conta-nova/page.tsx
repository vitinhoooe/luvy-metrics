// Prévia: como a cliente nova vê o Luvy no primeiro acesso (conta vazia).
import Link from 'next/link'
import { brl } from '@/lib/formato'
import { Icone } from '@/components/Icone'
import { montarPassos, PrimeirosPassos } from '@/components/PrimeirosPassos'

const MAPA: Record<string, string> = {
  '/produtos/importar': '/previa/importar', '/vendas/importar': '/previa/importar-vendas', '/vender': '/previa/vender',
  '/vitrine': '/previa/vitrine', '/fornecedores': '/previa/fornecedores',
}

export default async function PreviaContaNova({ searchParams }: { searchParams: Promise<{ feitos?: string }> }) {
  const { feitos = '' } = await searchParams
  const f = feitos.split(',')
  const passos = montarPassos({ produtos: f.includes('produtos'), historico: f.includes('historico'), venda: f.includes('venda'), vitrine: f.includes('vitrine'), fornecedores: f.includes('fornecedores') })
  return (
    <>
      <div className="lv-top">
        <div><h1>Sua loja está pronta, Amor & Cia!</h1><p>primeiro acesso · conta nova, sem nenhum dado</p></div>
        <div className="lv-acoes"><Link href="/previa/vender" className="lv-btn"><Icone nome="vender" />Nova venda</Link></div>
      </div>
      <PrimeirosPassos passos={passos} mapa={(h) => MAPA[h] ?? '/previa'} />
      <div className="lv-grid c3">
        <div className="lv-kpi"><span>Vendido hoje</span><strong>{brl(0)}</strong><small>nenhuma venda ainda</small></div>
        <div className="lv-kpi"><span>Vendido no mês</span><strong>{brl(0)}</strong><small>importe o histórico para ver os meses anteriores</small></div>
        <div className="lv-kpi"><span>Estoque (a custo)</span><strong>{brl(0)}</strong><small>0 produtos</small></div>
      </div>
      <p style={{ color: 'var(--dim)', fontSize: 12.5, marginTop: 14 }}>
        Prévia do primeiro acesso. Teste o progresso: <Link href="/previa/conta-nova?feitos=produtos,historico">2 feitos</Link> · <Link href="/previa/conta-nova">nenhum</Link>
      </p>
    </>
  )
}
