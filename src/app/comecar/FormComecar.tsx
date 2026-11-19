'use client'
import { useActionState } from 'react'
import { Enviar, Mensagem } from '@/components/Enviar'
import { CATEGORIAS, UFS } from '@/lib/constantes'
import { criarLoja } from './acoes'

export function FormComecar() {
  const [estado, acao] = useActionState(criarLoja, null)
  return (
    <form action={acao} className="lv-form">
      <div className="lv-campo">
        <label htmlFor="nome">Nome da loja</label>
        <input id="nome" name="nome" className="lv-input" placeholder="Ex.: Amor & Cia" maxLength={80} required autoFocus />
      </div>
      <div className="linha">
        <div className="lv-campo" style={{ gridColumn: 'span 2' }}>
          <label htmlFor="cidade">Cidade</label>
          <input id="cidade" name="cidade" className="lv-input" required />
        </div>
        <div className="lv-campo">
          <label htmlFor="uf">Estado</label>
          <select id="uf" name="uf" required defaultValue="">
            <option value="" disabled>UF</option>
            {UFS.map((u) => <option key={u}>{u}</option>)}
          </select>
        </div>
      </div>
      <div className="lv-campo">
        <label htmlFor="whatsapp">WhatsApp da loja <span style={{ fontWeight: 400, color: 'var(--dim)' }}>(opcional)</span></label>
        <input id="whatsapp" name="whatsapp" className="lv-input" inputMode="tel" placeholder="(11) 91234-5678" />
        <small>Usado depois no botão “Falar com a loja” da vitrine.</small>
      </div>
      <div className="lv-campo">
        <span className="lv-rotulo">O que você vende?</span>
        <div className="lv-chips">
          {CATEGORIAS.map((c) => (
            <label key={c} className="lv-chip"><input type="checkbox" name="categorias" value={c} />{c}</label>
          ))}
        </div>
      </div>
      <Mensagem estado={estado} />
      <Enviar className="lv-btn grande cheio" enviando="Criando sua loja…">Criar minha loja</Enviar>
    </form>
  )
}
