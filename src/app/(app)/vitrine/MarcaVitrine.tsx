'use client'
import { useState, useTransition } from 'react'
import { EnviarImagem } from '@/components/EnviarImagem'
import { enviarMarca, removerMarca } from '../imagens/acoes'

/** Logo e foto de capa da vitrine. */
export function MarcaVitrine({ logo: logo0, capa: capa0, nomeLoja, podeEditar, simular }: { logo: string | null; capa: string | null; nomeLoja: string; podeEditar: boolean; simular?: boolean }) {
  const [logo, setLogo] = useState(logo0)
  const [capa, setCapa] = useState(capa0)
  const [pendente, iniciar] = useTransition()

  const enviar = (tipo: 'logo' | 'capa') => async (arquivo: File) => {
    if (simular) { (tipo === 'logo' ? setLogo : setCapa)(URL.createObjectURL(arquivo)); return null }
    const fd = new FormData()
    fd.set('tipo', tipo)
    fd.set('arquivo', arquivo)
    const r = await enviarMarca(fd)
    if (r.url !== undefined) (tipo === 'logo' ? setLogo : setCapa)(r.url)
    return r.erro
  }
  const remover = (tipo: 'logo' | 'capa') => iniciar(async () => {
    if (!simular) await removerMarca(tipo)
    ;(tipo === 'logo' ? setLogo : setCapa)(null)
  })

  return (
    <section className="lv-card lv-identidade">
      <h2>Identidade da loja</h2>
      <div className="lv-ident-grade">
        <div className="lv-ident-item">
          <div className="lv-ident-logo">{logo ? <img src={logo} alt="Logo da loja" /> : <span>{nomeLoja.slice(0, 2).toUpperCase()}</span>}</div>
          <div>
            <strong>Logo</strong>
            <small>Quadrada, de preferência com fundo. Aparece no topo da vitrine.</small>
            <div className="lv-acoes">
              <EnviarImagem aoEnviar={enviar('logo')} rotulo={logo ? 'Trocar logo' : 'Enviar logo'} desativado={!podeEditar} max={800} />
              {logo && <button type="button" className="lv-btn fant pq" disabled={pendente || !podeEditar} onClick={() => remover('logo')}>Tirar</button>}
            </div>
          </div>
        </div>
        <div className="lv-ident-item">
          <div className="lv-ident-capa" style={capa ? { backgroundImage: `url(${capa})` } : undefined}>{!capa && <span>Sem capa: usa a cor da loja</span>}</div>
          <div>
            <strong>Foto de capa</strong>
            <small>Horizontal (ex.: fachada, vitrine física ou produtos arrumados). Fica atrás da frase de boas-vindas.</small>
            <div className="lv-acoes">
              <EnviarImagem aoEnviar={enviar('capa')} rotulo={capa ? 'Trocar capa' : 'Enviar capa'} desativado={!podeEditar} max={2200} />
              {capa && <button type="button" className="lv-btn fant pq" disabled={pendente || !podeEditar} onClick={() => remover('capa')}>Tirar</button>}
            </div>
          </div>
        </div>
      </div>
    </section>
  )
}
