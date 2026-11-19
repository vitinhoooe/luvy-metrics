import Link from 'next/link'
import { ListaPedidos, type Pedido } from '../../(app)/pedidos/ListaPedidos'
import { calcularPrazo, PRAZOS_PADRAO } from '@/lib/pedidos'

const h = (horas: number) => new Date(Date.now() - horas * 3600000).toISOString()
const it = (nome: string, q: number, p: number) => ({ nome, quantidade: q, preco_unit: p })

// pedidos de exemplo em várias etapas (alguns atrasados de propósito)
const BASE: Pedido[] = [
  { id: 'a', token: 't-a', numero: 48, cliente_nome: 'Juliana M.', cliente_whatsapp: '81999990001', entrega: 'local', endereco: 'Rua das Flores, 120, ap 302 - Boa Vista', observacao: 'Entregar depois das 18h', pagamento: 'pix', frete: 10, total: 124.7, valor_pix: 124.69, status: 'novo', codigo_rastreio: null, criado_em: h(0.3), pedido_itens: [it('Óleo de massagem ylang-ylang', 1, 39.9), it('Gel beijável morango 30ml', 3, 24.9)] },
  { id: 'b', token: 't-b', numero: 47, cliente_nome: 'Patrícia L.', cliente_whatsapp: '81999990004', entrega: 'combinar', endereco: null, observacao: null, pagamento: 'pix', frete: 0, total: 89.9, valor_pix: 89.89, status: 'novo', codigo_rastreio: null, criado_em: h(3.5), pedido_itens: [it('Vibrador bullet recarregável', 1, 89.9)] },
  { id: 'c', token: 't-c', numero: 46, cliente_nome: 'Carla S.', cliente_whatsapp: '81999990002', entrega: 'retirada', endereco: null, observacao: null, pagamento: 'pix', frete: 0, total: 64.8, valor_pix: 64.79, status: 'pago', codigo_rastreio: null, criado_em: h(5), atualizado_em: h(4), pedido_itens: [it('Lubrificante à base d’água 60g', 1, 21.9), it('Jogo de dados eróticos', 1, 19.9), it('Preservativo texturizado c/3', 1, 12.9)] },
  { id: 'd', token: 't-d', numero: 45, cliente_nome: 'Bianca R.', cliente_whatsapp: '81999990005', entrega: 'combinar', endereco: null, observacao: null, pagamento: 'pix', frete: 0, total: 119, valor_pix: 118.99, status: 'pago', codigo_rastreio: null, criado_em: h(30), atualizado_em: h(29), pedido_itens: [it('Body de renda preto', 1, 119)] },
  { id: 'e', token: 't-e', numero: 44, cliente_nome: 'Fernanda T.', cliente_whatsapp: '81999990006', entrega: 'combinar', endereco: null, observacao: 'Embalagem sem identificação', pagamento: 'pix', frete: 0, total: 39.9, valor_pix: 39.89, status: 'separado', codigo_rastreio: null, criado_em: h(20), atualizado_em: h(6), pedido_itens: [it('Kit fantasia enfermeira', 1, 39.9)] },
  { id: 'f', token: 't-f', numero: 43, cliente_nome: 'Renata P.', cliente_whatsapp: '81999990003', entrega: 'combinar', endereco: null, observacao: null, pagamento: 'pix', frete: 0, total: 34.8, valor_pix: 34.79, status: 'enviado', codigo_rastreio: 'AB123456789BR', criado_em: h(40), atualizado_em: h(26), pedido_itens: [it('Lubrificante à base d’água 60g', 1, 21.9), it('Preservativo texturizado c/3', 1, 12.9)] },
]

export default function PreviaPedidos() {
  const pedidos = BASE.map((p) => ({ ...p, prazo: calcularPrazo(p, PRAZOS_PADRAO) }))
  const atrasados = pedidos.filter((p) => p.prazo?.atrasado).length
  return (
    <>
      <div className="lv-top">
        <div><h1>Pedidos da vitrine</h1><p>Do pedido à entrega, num lugar só · dados de exemplo</p></div>
        <div className="lv-acoes">
          <Link href="/previa/vitrine" className="lv-btn sec">Prazos e vitrine</Link>
          <Link href="/previa/conciliar" className="lv-btn">Conferir Pix pelo extrato</Link>
        </div>
      </div>
      <div className="lv-grid c4" style={{ marginBottom: 14 }}>
        <div className="lv-kpi"><span>Novos (aguardando pagamento)</span><strong>2</strong><small>R$ 214,58 a receber</small></div>
        <div className="lv-kpi"><span>Para separar</span><strong>2</strong><small>pagos, ainda na loja</small></div>
        <div className="lv-kpi"><span>A caminho</span><strong>1</strong><small>saíram para entrega</small></div>
        <div className="lv-kpi"><span>Entregues</span><strong>38</strong><small>últimos 500 pedidos</small></div>
      </div>
      <div className="lv-aviso alerta" style={{ marginBottom: 14 }}>
        <span className="lv-semaforo vermelho">{atrasados} atrasados</span>
        <span><strong>Precisam de você.</strong> Pedidos que passaram do prazo da etapa em que estão.</span>
      </div>
      <div className="lv-chips lv-abas" style={{ marginBottom: 14 }}>
        <span className="lv-chip alerta">Atrasados<em>{atrasados}</em></span><span className="lv-chip on">Em aberto<em>6</em></span><span className="lv-chip">Novos<em>2</em></span>
        <span className="lv-chip">Pagos<em>2</em></span><span className="lv-chip">Separados<em>1</em></span><span className="lv-chip">A caminho<em>1</em></span><span className="lv-chip">Entregues<em>38</em></span>
      </div>
      <ListaPedidos pedidos={pedidos} podeEditar loja="Amor & Cia" slug="amor-e-cia" enderecoRetirada="Rua do Exemplo, 100 - Boa Vista" base="https://luvymetrics.com.br" />
    </>
  )
}
