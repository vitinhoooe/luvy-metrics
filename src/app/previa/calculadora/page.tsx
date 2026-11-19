import { Calculadora } from '../../(app)/calculadora/Calculadora'
import { PRODUTOS_EXEMPLO } from '../exemplo'

export default function PreviaCalculadora() {
  return (
    <>
      <div className="lv-top"><div><h1>Calculadora de preço</h1><p>Preço certo com custo, taxa do canal, imposto e o lucro que você quer.</p></div></div>
      <Calculadora produtos={PRODUTOS_EXEMPLO} podeEditar />
    </>
  )
}
