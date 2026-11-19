'use client'
import { useActionState, useState } from 'react'
import { Enviar, Mensagem } from '@/components/Enviar'
import { brl, paraNumero } from '@/lib/formato'
import { CATEGORIAS } from '@/lib/constantes'
import { movimentar, salvarProduto } from './acoes'

export type ProdutoForm = {
  id?: string
  nome?: string
  categoria?: string | null
  codigo_barras?: string | null
  sku?: string | null
  fornecedor?: string | null
  custo?: number
  preco?: number
  quantidade?: number
  estoque_minimo?: number
  na_vitrine?: boolean
  descricao?: string | null
  destaque?: boolean
  fotos?: string[]
}

const dinheiro = (v?: number) => (v || v === 0 ? String(v).replace('.', ',') : '')

export function FormProduto({ p = {}, podeEditar, salvo }: { p?: ProdutoForm; podeEditar: boolean; salvo?: boolean }) {
  const [estado, acao] = useActionState(salvarProduto, salvo ? { ok: 'Produto salvo. Cadastre o próximo.' } : null)
  const [custo, setCusto] = useState(dinheiro(p.custo))
  const [preco, setPreco] = useState(dinheiro(p.preco))
  const c = paraNumero(custo) ?? 0
  const v = paraNumero(preco) ?? 0
  const margem = v > 0 ? ((v - c) / v) * 100 : null
  const novo = !p.id

  return (
    <form action={acao} className="lv-form" key={p.id ?? (salvo ? 'novo-salvo' : 'novo')}>
      {p.id && <input type="hidden" name="id" value={p.id} />}
      <fieldset disabled={!podeEditar} style={{ border: 0, display: 'grid', gap: 14 }}>
        <div className="lv-campo">
          <label htmlFor="nome">Nome do produto</label>
          <input id="nome" name="nome" className="lv-input" defaultValue={p.nome} maxLength={160} required autoFocus={novo} />
        </div>
        <div className="linha">
          <div className="lv-campo">
            <label htmlFor="categoria">Categoria</label>
            <input id="categoria" name="categoria" className="lv-input" defaultValue={p.categoria ?? ''} list="categorias" maxLength={60} />
            <datalist id="categorias">{CATEGORIAS.map((x) => <option key={x} value={x} />)}</datalist>
          </div>
          <div className="lv-campo">
            <label htmlFor="codigo_barras">Código de barras</label>
            <input id="codigo_barras" name="codigo_barras" className="lv-input" defaultValue={p.codigo_barras ?? ''} inputMode="numeric" maxLength={40} />
          </div>
        </div>
        <div className="linha">
          <div className="lv-campo">
            <label htmlFor="custo">Custo (R$)</label>
            <input id="custo" name="custo" className="lv-input mono" inputMode="decimal" value={custo} onChange={(e) => setCusto(e.target.value)} placeholder="0,00" />
          </div>
          <div className="lv-campo">
            <label htmlFor="preco">Preço de venda (R$)</label>
            <input id="preco" name="preco" className="lv-input mono" inputMode="decimal" value={preco} onChange={(e) => setPreco(e.target.value)} placeholder="0,00" />
          </div>
          <div className="lv-campo">
            <span className="lv-rotulo">Lucro por unidade</span>
            <div className="lv-input mono" style={{ display: 'flex', alignItems: 'center', background: 'var(--soft)', color: v > 0 && v <= c ? 'var(--err)' : 'inherit' }}>
              {v > 0 ? `${brl(v - c)} · ${margem!.toFixed(0)}%` : '—'}
            </div>
          </div>
        </div>
        <div className="linha">
          {novo && (
            <div className="lv-campo">
              <label htmlFor="quantidade">Quantidade em estoque</label>
              <input id="quantidade" name="quantidade" className="lv-input mono" inputMode="numeric" defaultValue="0" />
            </div>
          )}
          <div className="lv-campo">
            <label htmlFor="estoque_minimo">Avisar quando restar</label>
            <input id="estoque_minimo" name="estoque_minimo" className="lv-input mono" inputMode="numeric" defaultValue={p.estoque_minimo ?? 2} />
          </div>
          <div className="lv-campo">
            <label htmlFor="fornecedor">Fornecedor</label>
            <input id="fornecedor" name="fornecedor" className="lv-input" defaultValue={p.fornecedor ?? ''} maxLength={80} />
          </div>
        </div>
        <div className="lv-campo">
          <label htmlFor="sku">Código interno (SKU)</label>
          <input id="sku" name="sku" className="lv-input" defaultValue={p.sku ?? ''} maxLength={40} style={{ maxWidth: 260 }} />
        </div>
        <div className="lv-campo">
          <label htmlFor="descricao">Descrição na vitrine</label>
          <textarea id="descricao" name="descricao" rows={3} maxLength={1000} defaultValue={p.descricao ?? ''} placeholder="Ex.: Gel beijável sabor morango, 30 ml. Esquenta ao contato e não mancha. Embalagem discreta." />
          <small>Aparece quando a cliente toca no produto. Conte para que serve, tamanho e cuidados.</small>
        </div>
        <label className="lv-check">
          <input type="checkbox" name="na_vitrine" defaultChecked={p.na_vitrine ?? true} />
          <span>Mostrar na vitrine online</span>
        </label>
        <label className="lv-check">
          <input type="checkbox" name="destaque" defaultChecked={p.destaque ?? false} />
          <span>Destaque: aparece primeiro na vitrine, com selo</span>
        </label>
        <Mensagem estado={estado} />
        <div className="lv-acoes">
          <Enviar>{novo ? 'Cadastrar produto' : 'Salvar alterações'}</Enviar>
          {novo && <button type="submit" name="outro" value="1" className="lv-btn sec">Salvar e cadastrar outro</button>}
        </div>
      </fieldset>
    </form>
  )
}

export function FormMovimento({ id, atual, podeEditar }: { id: string; atual: number; podeEditar: boolean }) {
  const [estado, acao] = useActionState(movimentar, null)
  const [tipo, setTipo] = useState<'entrada' | 'saida' | 'ajuste'>('entrada')
  return (
    <form action={acao} className="lv-form">
      <input type="hidden" name="id" value={id} />
      <input type="hidden" name="atual" value={atual} />
      <input type="hidden" name="tipo" value={tipo} />
      <fieldset disabled={!podeEditar} style={{ border: 0, display: 'grid', gap: 12 }}>
        <div className="lv-chips">
          {([['entrada', 'Chegou mercadoria'], ['saida', 'Saída / perda'], ['ajuste', 'Contei o estoque']] as const).map(([t, n]) => (
            <button key={t} type="button" className={`lv-chip${tipo === t ? ' on' : ''}`} onClick={() => setTipo(t)}>{n}</button>
          ))}
        </div>
        <div className="linha">
          <div className="lv-campo">
            <label htmlFor="mov-qtd">{tipo === 'ajuste' ? 'Quantidade real na prateleira' : 'Quantidade'}</label>
            <input id="mov-qtd" name="quantidade" className="lv-input mono" inputMode="numeric" required />
          </div>
          <div className="lv-campo">
            <label htmlFor="mov-motivo">Observação</label>
            <input id="mov-motivo" name="motivo" className="lv-input" maxLength={120} placeholder={tipo === 'saida' ? 'Ex.: avaria, brinde' : 'Opcional'} />
          </div>
        </div>
        <Mensagem estado={estado} />
        <div><Enviar>Registrar</Enviar></div>
      </fieldset>
    </form>
  )
}
