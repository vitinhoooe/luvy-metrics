import { Pdv } from '../../(app)/vender/Pdv'
import { PRODUTOS_EXEMPLO } from '../exemplo'

export default function PreviaVender() {
  return (
    <>
      <div className="lv-top"><div><h1>Vender no balcão</h1><p>Cada venda baixa o estoque na hora.</p></div></div>
      <Pdv produtos={PRODUTOS_EXEMPLO} caixaAberto podeEditar simular />
    </>
  )
}
