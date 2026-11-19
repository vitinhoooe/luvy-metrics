// Prévia da tela de um produto (com fotos e descrição). Dados de exemplo, nada é gravado.
import Link from 'next/link'
import { FotosProduto } from '../../(app)/produtos/FotosProduto'

export default function PreviaProduto() {
  return (
    <>
      <div className="lv-top">
        <div><h1>Gel beijável morango 30ml</h1><p><Link href="/previa/produtos">← Produtos</Link> · dados de exemplo</p></div>
      </div>
      <div className="lv-grid c2" style={{ alignItems: 'start' }}>
        <div className="lv-card">
          <h2>Fotos na vitrine</h2>
          <FotosProduto simular produtoId="1" fotos={['/exemplo/gel-1.webp', '/exemplo/gel-2.webp']} podeEditar />
        </div>
        <div className="lv-card lv-form">
          <h2>Na vitrine</h2>
          <div className="lv-campo">
            <label htmlFor="descricao">Descrição na vitrine</label>
            <textarea id="descricao" rows={4} defaultValue={'Gel beijável sabor morango, 30 ml.\nEsquenta levemente ao contato e não mancha. Base d’água, fácil de limpar.'} />
            <small>Aparece quando a cliente toca no produto. Conte para que serve, tamanho e cuidados.</small>
          </div>
          <label className="lv-check"><input type="checkbox" defaultChecked /><span>Mostrar na vitrine online</span></label>
          <label className="lv-check"><input type="checkbox" defaultChecked /><span>Destaque: aparece primeiro na vitrine, com selo</span></label>
        </div>
      </div>
    </>
  )
}
