'use client'
import Link from 'next/link'
import { INTEGRACOES, type Integracao } from '@/lib/integracoes'

export type StatusLigada = Record<string, { ativo: boolean; resumo: string }>

// na prévia (sem login) os botões abrem as telas de exemplo
const PREVIA: Record<string, string> = {
  '/vender': '/previa/vender', '/vitrine': '/previa/vitrine', '/pedidos/conciliar': '/previa/conciliar', '/produtos/importar': '/previa/importar',
  '/conta': '/previa/planos', '/atendente': '/previa/atendente', '/pedidos': '/previa/pedidos', '/vitrine#mercadopago': '/previa/vitrine#mercadopago',
}

export function Integracoes({ status, simular }: { status: StatusLigada; simular?: boolean }) {
  const rota = (h: string) => (simular ? PREVIA[h] ?? '/previa' : h)
  const ligadas = INTEGRACOES.filter((i) => i.estado === 'ligada')
  return (
    <>
      <section className="lv-int-bloco">
        <h2>Funcionando <small>{ligadas.length}</small></h2>
        <div className="lv-int-grade">
          {ligadas.map((i) => <CartaoLigada key={i.id} i={i} s={status[i.id]} href={i.href ? rota(i.href) : undefined} />)}
        </div>
      </section>

      <section className="lv-card lv-int-fontes">
        <h2>De onde vêm os seus números</h2>
        <div className="lv-tabela-wrap">
          <table className="lv-tabela">
            <thead><tr><th>Onde vendeu</th><th>Como entra no Luvy</th><th>Forma de pagamento</th></tr></thead>
            <tbody>
              <tr><td><strong>Balcão</strong></td><td>Você registra no PDV (código de barras ou toque)</td><td>Você escolhe na hora: Pix, dinheiro, débito ou crédito</td></tr>
              <tr><td><strong>WhatsApp e Instagram</strong></td><td>Você registra no PDV com “Onde vendeu”</td><td>Você escolhe na hora</td></tr>
              <tr><td><strong>Seu site (vitrine)</strong></td><td>Sozinho: o pedido cai em Pedidos</td><td>Mercado Pago: automático (Pix ou cartão). Chave Pix: conferido pelo extrato</td></tr>
              <tr><td><strong>Mercado Livre e outros sites</strong></td><td>Registre no PDV ou importe os pedidos por planilha</td><td>Vem junto com o pedido</td></tr>
              <tr><td><strong>Vendas antigas</strong></td><td>Planilha do sistema que você usava</td><td>Ficam como “Histórico”</td></tr>
            </tbody>
          </table>
        </div>
        <p className="lv-int-nota">O dinheiro em espécie é o único que nunca fica automático: ele aparece no fechamento do caixa, comparando o que foi vendido com o que tem na gaveta.</p>
      </section>
    </>
  )
}


function CartaoLigada({ i, s, href }: { i: Integracao; s?: { ativo: boolean; resumo: string }; href?: string }) {
  const ativo = s?.ativo ?? true
  return (
    <article className={`lv-card lv-int ${ativo ? 'on' : ''}`}>
      <header>
        <h3>{i.nome}</h3>
        {ativo ? <span className="lv-int-selo ligada">● Funcionando</span> : <span className="lv-int-selo desligada">Desligada</span>}
      </header>
      <p>{i.oQueFaz}</p>
      <p className="dados"><b>Entra no Luvy:</b> {i.dados}</p>
      {s?.resumo && <p className="resumo">{s.resumo}</p>}
      {href && <Link href={href} className="lv-btn sec pq">{ativo ? 'Abrir' : 'Ligar'}</Link>}
    </article>
  )
}
