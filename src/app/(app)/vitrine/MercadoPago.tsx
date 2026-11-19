'use client'
import { useActionState, useState } from 'react'
import { Enviar, Mensagem, type Estado } from '@/components/Enviar'
import { conectarMercadoPago, desconectarMercadoPago } from './acoesMp'

const simulado = async (): Promise<Estado> => ({ ok: 'Prévia: nada foi gravado.' })

/** Conexão da conta do Mercado Pago da lojista: o dinheiro das vendas da vitrine cai direto nela. */
export function MercadoPago({ conectado, conta, descritor, podeEditar, simular }: { conectado: boolean; conta: string | null; descritor: string | null; podeEditar: boolean; simular?: boolean }) {
  const [estado, acao] = useActionState<Estado, FormData>(simular ? simulado : conectarMercadoPago, null)
  const [ajuda, setAjuda] = useState(false)
  return (
    <section className="lv-card lv-mp" id="mercadopago">
      <header>
        <div className="lv-mp-logo" aria-hidden>MP</div>
        <div>
          <h2>Pagamento online · Mercado Pago</h2>
          <p>Sua cliente paga com <b>Pix ou cartão</b> na sua vitrine e o pedido vira <b>“Pago” sozinho</b>. O dinheiro cai direto na <b>sua</b> conta do Mercado Pago: o Luvy não toca no seu dinheiro e não cobra taxa por venda.</p>
        </div>
        {conectado ? <span className="lv-selo ok">● Conectado</span> : <span className="lv-selo">Desconectado</span>}
      </header>

      {conectado ? (
        <div className="lv-mp-ok">
          <p>Conta conectada: <b>{conta}</b>. As taxas do Mercado Pago são as do seu contrato com eles.</p>
          {!simular && podeEditar && (
            <form action={desconectarMercadoPago} onSubmit={(e) => { if (!confirm('Desconectar o Mercado Pago? A vitrine volta a aceitar só Pix pela chave e “combinar”.')) e.preventDefault() }}>
              <button className="lv-btn fant pq" type="submit">Desconectar</button>
            </form>
          )}
        </div>
      ) : null}

      <form action={acao} className="lv-mp-form">
        {!conectado && (
          <label className="lv-campo">
            <span>Access Token de produção</span>
            <input name="token" className="lv-input mono" placeholder="APP_USR-0000000000000000-000000-…" autoComplete="off" spellCheck={false} disabled={!podeEditar} />
            <small>Fica guardado criptografado e nunca aparece de novo na tela.</small>
          </label>
        )}
        <label className="lv-campo">
          <span>Nome na fatura do cartão (discreto)</span>
          <input name="descritor" className="lv-input" defaultValue={descritor ?? ''} maxLength={13} placeholder="Ex.: LOJA ONLINE" disabled={!podeEditar} />
          <small>Até 13 letras. É o que aparece na fatura da sua cliente. Evite palavras que revelem o tipo de produto.</small>
        </label>
        <Mensagem estado={estado} />
        <div className="lv-acoes">
          <Enviar enviando="Conferindo…" disabled={!podeEditar}>{conectado ? 'Salvar nome na fatura' : 'Conectar Mercado Pago'}</Enviar>
          {!conectado && <button type="button" className="lv-btn fant" onClick={() => setAjuda((a) => !a)}>{ajuda ? 'Fechar ajuda' : 'Onde pego o token?'}</button>}
        </div>
      </form>

      {ajuda && !conectado && (
        <ol className="lv-mp-ajuda">
          <li>Entre em <b>mercadopago.com.br/developers</b> com a conta da sua loja.</li>
          <li>Abra <b>Suas integrações</b> e clique em <b>Criar aplicação</b> (nome: o da sua loja; produto: <b>Checkout Pro</b>).</li>
          <li>Dentro da aplicação, vá em <b>Credenciais de produção</b> e ative, se pedir.</li>
          <li>Copie o <b>Access Token</b> (começa com <b>APP_USR-</b>) e cole aqui.</li>
          <li>Pronto: teste fazendo um pedido pequeno na sua vitrine.</li>
        </ol>
      )}
      <p className="lv-mp-nota">Produtos para adultos seguem as regras de uso do Mercado Pago. A conta e o recebimento são seus: confira com o Mercado Pago se o seu tipo de venda é aceito.</p>
    </section>
  )
}
