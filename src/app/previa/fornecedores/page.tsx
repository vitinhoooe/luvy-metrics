import { Diretorio } from '../../(app)/fornecedores/Diretorio'
import { AbasFornecedores } from '../../(app)/fornecedores/Abas'
import { MeusFornecedores, type MeuFornecedor, type ResumoFornecedor } from '../../(app)/fornecedores/MeusFornecedores'

// dados de exemplo: nomes fictícios, iguais aos da prévia de "O que repor"
const MEUS: MeuFornecedor[] = [
  { id: 'a', nome: 'Distribuidora Sensual', contato: 'Marcos', whatsapp: '81999990101', email: null, site: null, cidade: 'Recife/PE', prazo_dias: 3, pedido_minimo: 400, pagamento: 'Pix 5% off ou boleto 28 dias', nota: 5, obs: 'Manda amostra grátis de lançamento.', ultimo_pedido: '2026-10-28', diretorio_id: null },
  { id: 'b', nome: 'Importadora Prazer', contato: null, whatsapp: '11999990202', email: 'vendas@exemplo.com', site: null, cidade: 'São Paulo/SP', prazo_dias: 9, pedido_minimo: 1000, pagamento: 'Pix à vista', nota: 3, obs: 'Atrasa em dezembro: pedir com antecedência.', ultimo_pedido: '2026-09-15', diretorio_id: null },
]
const RESUMO: ResumoFornecedor[] = [
  { nome: 'Distribuidora Sensual', produtos: 3, valor: 233, repor: 2 },
  { nome: 'Importadora Prazer', produtos: 1, valor: 190, repor: 0 },
  { nome: 'Moda Íntima Recife', produtos: 2, valor: 769, repor: 0 },
]

export default async function PreviaFornecedores({ searchParams }: { searchParams: Promise<{ aba?: string }> }) {
  const { aba: a } = await searchParams
  const aba = a === 'diretorio' ? 'diretorio' : 'meus'
  return (
    <>
      <div className="lv-top">
        <div><h1>Fornecedores</h1><p>De quem você compra, quanto tem de cada um no estoque e o que precisa repor · dados de exemplo</p></div>
      </div>
      <AbasFornecedores base="/previa/fornecedores" aba={aba} meus={MEUS.length} />
      {aba === 'meus'
        ? <MeusFornecedores fornecedores={MEUS} resumo={RESUMO} loja="Amor & Cia" simular />
        : <Diretorio loja="Amor & Cia" simular />}
    </>
  )
}
