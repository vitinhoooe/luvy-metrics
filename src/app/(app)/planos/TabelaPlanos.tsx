import { PLANOS, type Assinatura, type Plano } from '@/lib/planos'

const ITENS: Record<Plano, { sim: string[]; nao: string[] }> = {
  starter: {
    sim: ['Produtos e estoque sem limite', 'Importação de planilha com IA', 'Balcão (PDV) e caixa do dia', 'Preço certo por canal', 'Lucro real de cada venda'],
    nao: ['Site próprio', 'Atendente IA 24h'],
  },
  pro: {
    sim: ['Tudo do Starter', 'Site próprio com logo, fotos e frete para todo o Brasil', 'Pix e cartão pelo Mercado Pago, pedido confirmado sozinho', 'Atendente IA 24h', 'Estoque inteligente', 'Clientes e fornecedores'],
    nao: [],
  },
  business: {
    sim: ['Tudo do Pro, por 1 ano', 'A gente monta seu site com você', 'Pagamento único: 2 meses grátis'],
    nao: [],
  },
}

// preço ÷ 30 dias (mensal) ou ÷ 365 (anual), arredondado ao centavo
const POR_DIA: Record<Plano, string> = { starter: 'R$ 3,23', pro: 'R$ 6,57', business: 'R$ 5,40' }

export function TabelaPlanos({ assinatura, loja, wpp }: { assinatura: Assinatura; loja: string; wpp?: string }) {
  const ativo = assinatura.status === 'ativo' || assinatura.status === 'atrasado'
  return (
    <>
      <div className="lv-planos">
        {(['starter', 'pro', 'business'] as Plano[]).map((id) => {
          const p = PLANOS[id]
          const atual = ativo && assinatura.plano === id
          const msg = encodeURIComponent(`Olá! Quero assinar o plano ${p.nome} do LuvyMetrics para a loja ${loja}.`)
          return (
            <div key={id} className={`lv-plano${id === 'pro' ? ' destaque' : ''}`}>
              <h3>{p.nome} {id === 'pro' && <span className="lv-selo escuro">Preço de lançamento</span>}</h3>
              {id === 'pro' && <small style={{ opacity: .7, marginBottom: -10 }}>Preço de lançamento · depois R$ 297</small>}
              <div className="preco">R$ {p.preco}<small> {p.periodo}</small></div>
              <small style={{ fontWeight: 600, marginTop: -6 }}>Dá {POR_DIA[id]} por dia</small>
              {p.nota && <small style={{ opacity: .7, marginTop: -8 }}>{p.nota}</small>}
              <ul>
                {ITENS[id].sim.map((i) => <li key={i}>{i}</li>)}
                {ITENS[id].nao.map((i) => <li key={i} className="nao">{i}</li>)}
              </ul>
              {atual ? (
                <span className="lv-btn sec" aria-disabled>Seu plano atual</span>
              ) : wpp ? (
                <a className="lv-btn" href={`https://wa.me/${wpp}?text=${msg}`} target="_blank" rel="noopener noreferrer">Assinar {p.nome}</a>
              ) : (
                <span className="lv-btn sec" aria-disabled>Assinatura com a nossa equipe</span>
              )}
            </div>
          )
        })}
      </div>
      <p style={{ color: 'var(--dim)', fontSize: 13, marginTop: 14 }}>
        A assinatura é feita com a nossa equipe pelo WhatsApp: você escolhe o plano e paga por Pix. Sem fidelidade no mensal.
      </p>
    </>
  )
}
