import { FormVitrine } from '../../(app)/vitrine/FormVitrine'
import { Compartilhar } from '../../(app)/vitrine/Compartilhar'
import { MercadoPago } from '../../(app)/vitrine/MercadoPago'
import { MarcaVitrine } from '../../(app)/vitrine/MarcaVitrine'

export default function PreviaVitrine() {
  return (
    <>
      <div className="lv-top">
        <div><h1>Vitrine online</h1><p>7 produtos aparecem na vitrine · dados de exemplo</p></div>
      </div>
      <Compartilhar link="https://luvymetrics.com.br/loja/amor-e-cia" nomeLoja="Amor & Cia" abrir="/previa-loja" />
      <MarcaVitrine simular logo={null} capa={null} nomeLoja="Amor & Cia" podeEditar />
      <MercadoPago simular conectado conta="AMORECIA.LOJA" descritor="AMOR CIA" podeEditar />
      <FormVitrine
        simular
        nomeLoja="Amor & Cia"
        podeEditar
        c={{
          vitrine_ativa: true, vitrine_cor: 'rosa', vitrine_descricao: 'Bem-estar íntimo com discrição e carinho.',
          pix_chave: 'exemplo@luvymetrics.com.br', pix_nome: 'Amor e Cia', entrega_retirada: true, endereco_retirada: 'Rua do Exemplo, 100 - Boa Vista',
          entrega_local: true, entrega_local_taxa: 10, entrega_combinar: true,
          entrega_brasil: true, frete_regioes: { NE: { valor: 15, prazo: '3 a 6 dias úteis' }, SE: { valor: 22, prazo: '5 a 8 dias úteis' }, S: { valor: 26, prazo: '6 a 9 dias úteis' }, CO: { valor: 24, prazo: '6 a 9 dias úteis' }, N: { valor: 30, prazo: '8 a 12 dias úteis' } },
          frete_gratis_acima: 199, prazo_retirada: 'Pronto em 2 horas', prazo_local: 'No mesmo dia',
          vitrine_instagram: 'amorecia.recife', vitrine_horario: 'Seg a sáb, 9h às 19h', vitrine_sobre: 'Loja de bem-estar íntimo em Recife desde 2019. Atendimento acolhedor e entrega discreta.',
        }}
      />
    </>
  )
}
