import type { Metadata } from 'next'
import { exigirLoja } from '@/lib/sessao'
import { data } from '@/lib/formato'
import { diasRestantesTeste, emDia, PLANOS } from '@/lib/planos'
import { TabelaPlanos } from './TabelaPlanos'

export const metadata: Metadata = { title: 'Planos' }

export default async function Planos() {
  const { assinatura, loja } = await exigirLoja()
  const wpp = process.env.NEXT_PUBLIC_WPP_SUPORTE?.replace(/\D/g, '')

  return (
    <>
      <div className="lv-top">
        <div>
          <h1>Planos</h1>
          <p>
            {assinatura.status === 'teste'
              ? emDia(assinatura) ? `Você está no teste do Pro: ${diasRestantesTeste(assinatura)} dias restantes (até ${data(assinatura.teste_ate)}).` : 'Seu teste terminou. Seus dados estão guardados.'
              : `Plano atual: ${PLANOS[assinatura.plano].nome}${assinatura.pago_ate ? ` · pago até ${data(assinatura.pago_ate)}` : ''}`}
          </p>
        </div>
      </div>
      <TabelaPlanos assinatura={assinatura} loja={loja.nome} wpp={wpp} />
    </>
  )
}
