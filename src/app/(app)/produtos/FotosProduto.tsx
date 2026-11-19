'use client'
import { useState, useTransition } from 'react'
import { EnviarImagem } from '@/components/EnviarImagem'
import { apagarFotoProduto, enviarFotoProduto, fotoPrincipal } from '../imagens/acoes'

/** Fotos do produto na vitrine (até 4). A primeira aparece no catálogo. */
export function FotosProduto({ produtoId, fotos: iniciais, podeEditar, simular }: { produtoId: string; fotos: string[]; podeEditar: boolean; simular?: boolean }) {
  const [fotos, setFotos] = useState(iniciais)
  const [pendente, iniciar] = useTransition()
  const cheio = fotos.length >= 4

  async function enviar(arquivo: File) {
    if (simular) { setFotos((f) => (f.length < 4 ? [...f, URL.createObjectURL(arquivo)] : f)); return null }
    const fd = new FormData()
    fd.set('produto_id', produtoId)
    fd.set('arquivo', arquivo)
    const r = await enviarFotoProduto(fd)
    if (r.fotos) setFotos(r.fotos)
    return r.erro
  }
  const acao = (fn: () => Promise<{ fotos?: string[] }>) => iniciar(async () => { const r = await fn(); if (r.fotos) setFotos(r.fotos) })

  return (
    <div className="lv-fotos">
      <div className="lv-fotos-grade">
        {fotos.map((f, i) => (
          <figure key={f} className={i === 0 ? 'principal' : ''}>
            <img src={f} alt={`Foto ${i + 1} do produto`} />
            {i === 0 && <span className="lv-fotos-selo">Principal</span>}
            {podeEditar && (
              <div className="lv-fotos-acoes">
                {i > 0 && <button type="button" disabled={pendente} onClick={() => simular ? setFotos([f, ...fotos.filter((x) => x !== f)]) : acao(() => fotoPrincipal(produtoId, f))}>Principal</button>}
                <button type="button" disabled={pendente} onClick={() => { if (!confirm('Apagar esta foto?')) return; if (simular) setFotos(fotos.filter((x) => x !== f)); else acao(() => apagarFotoProduto(produtoId, f)) }}>Apagar</button>
              </div>
            )}
          </figure>
        ))}
        {!cheio && (
          <div className="lv-fotos-vazio">
            <span>{fotos.length ? 'Mais uma foto' : 'Sem foto ainda'}</span>
            <EnviarImagem aoEnviar={enviar} rotulo={fotos.length ? '+ Adicionar' : 'Adicionar fotos'} varias desativado={!podeEditar} max={1600} />
          </div>
        )}
      </div>
      <small className="lv-fotos-dica">Até 4 fotos. Fundo claro e luz natural vendem mais. A primeira aparece no catálogo da vitrine.</small>
    </div>
  )
}
