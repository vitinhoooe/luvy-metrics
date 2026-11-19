import { Importador } from '../../(app)/produtos/importar/Importador'

export default function PreviaImportar() {
  return (
    <>
      <div className="lv-top"><div><h1>Importar planilha</h1><p>Nada é gravado antes de você conferir. Na prévia, nada é salvo.</p></div></div>
      <Importador podeEditar simular />
    </>
  )
}
