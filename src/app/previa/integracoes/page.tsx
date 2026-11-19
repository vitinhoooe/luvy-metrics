import { Integracoes, type StatusLigada } from '../../(app)/integracoes/Integracoes'

const STATUS: StatusLigada = {
  balcao: { ativo: true, resumo: '81 vendas registradas nos últimos 30 dias' },
  vitrine: { ativo: true, resumo: 'No ar' },
  mercadopago: { ativo: true, resumo: 'Conectado: AMORECIA.LOJA' },
  extrato: { ativo: true, resumo: '46 lançamentos do extrato já conferidos' },
  planilha: { ativo: true, resumo: '8 produtos no catálogo' },
  exportar: { ativo: true, resumo: '' },
  atendente: { ativo: true, resumo: 'Atendendo na sua vitrine' },
  'whatsapp-links': { ativo: true, resumo: 'Pedidos chegam no WhatsApp da loja' },
}

export default function PreviaIntegracoes() {
  return (
    <>
      <div className="lv-top">
        <div><h1>Integrações</h1><p>O que conversa com o Luvy e de onde vem cada número da sua loja · dados de exemplo</p></div>
      </div>
      <Integracoes status={STATUS} simular />
    </>
  )
}
