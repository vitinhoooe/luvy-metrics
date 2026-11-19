'use client'
import { useMemo, useState } from 'react'
import { DIRETORIO_CONFERIDO, FORNECEDORES, MENSAGEM_FORNECEDOR, telefoneBonito, type TipoFornecedor } from '@/lib/fornecedores'
import { linkWhatsApp } from '@/lib/pedidos'
import { salvarDoDiretorio } from './acoes'

const norm = (s: string) => s.normalize('NFD').replace(/[̀-ͯ]/g, '').toLowerCase()

export function Diretorio({ loja, salvos = [], simular }: { loja: string; salvos?: string[]; simular?: boolean }) {
  const [tipo, setTipo] = useState<'todos' | TipoFornecedor>('todos')
  const [q, setQ] = useState('')

  const lista = useMemo(() => {
    const t = norm(q.trim())
    return FORNECEDORES.filter((f) => (tipo === 'todos' || f.tipo === tipo) && (!t || norm(`${f.nome} ${f.cidade ?? ''} ${f.uf ?? ''} ${f.vende}`).includes(t)))
  }, [tipo, q])

  const assunto = encodeURIComponent('Condições para lojista')
  const corpo = encodeURIComponent(MENSAGEM_FORNECEDOR(loja))

  return (
    <>
      <div className="lv-forn-aviso" role="note">
        <strong>Contatos públicos, sem parceria.</strong> Coletamos estes contatos no site oficial de cada empresa em {DIRETORIO_CONFERIDO}.
        O LuvyMetrics não tem parceria com eles e não verificou produtos, prazos ou entregas. Antes de comprar, confira o CNPJ na Receita,
        a reputação no Reclame Aqui, peça nota fiscal e comece com um pedido pequeno.
      </div>

      <div className="lv-forn-filtros">
        <div className="lv-chips">
          {(['todos', 'distribuidora', 'fabricante'] as const).map((t) => (
            <button key={t} type="button" className={`lv-chip${tipo === t ? ' on' : ''}`} onClick={() => setTipo(t)}>
              {t === 'todos' ? 'Todos' : t === 'distribuidora' ? 'Distribuidoras' : 'Fabricantes'}
              <em>{t === 'todos' ? FORNECEDORES.length : FORNECEDORES.filter((f) => f.tipo === t).length}</em>
            </button>
          ))}
        </div>
        <input className="lv-input" value={q} onChange={(e) => setQ(e.target.value)} placeholder="Buscar por nome, cidade ou produto" aria-label="Buscar fornecedor" />
      </div>

      {lista.length === 0 ? (
        <div className="lv-card lv-vazio"><h3>Nenhum fornecedor encontrado</h3><p>Tente outra busca.</p></div>
      ) : (
        <div className="lv-forn-grade">
          {lista.map((f) => (
            <article key={f.id} className="lv-card lv-forn">
              <header>
                <div>
                  <h3>{f.nome}</h3>
                  <span className="lugar">{f.cidade ? `${f.cidade} · ${f.uf}` : 'Cidade não informada no site'}</span>
                </div>
                <span className={`lv-selo ${f.tipo === 'fabricante' ? 'escuro' : ''}`}>{f.tipo === 'fabricante' ? 'Fabricante' : 'Distribuidora'}</span>
              </header>
              <p className="vende">{f.vende}</p>
              {f.condicoes && <p className="cond"><b>Condições:</b> {f.condicoes}</p>}
              {f.obs && <p className="obs">{f.obs}</p>}
              <dl>
                {f.whatsapp && <><dt>WhatsApp</dt><dd>{telefoneBonito(f.whatsapp)}</dd></>}
                {f.telefone && <><dt>Telefone</dt><dd>{telefoneBonito(f.telefone)}</dd></>}
                {f.email && <><dt>E-mail</dt><dd>{f.email}</dd></>}
                {f.cnpj && <><dt>CNPJ</dt><dd>{f.cnpj}</dd></>}
              </dl>
              <div className="acoes">
                {f.whatsapp && <a className="lv-btn lv-btn-zap pq" href={linkWhatsApp(f.whatsapp, MENSAGEM_FORNECEDOR(loja))} target="_blank" rel="noopener noreferrer">Chamar no WhatsApp</a>}
                {f.email && <a className="lv-btn sec pq" href={`mailto:${f.email}?subject=${assunto}&body=${corpo}`}>Enviar e-mail</a>}
                {!f.whatsapp && f.telefone && <a className="lv-btn sec pq" href={`tel:+55${f.telefone}`}>Ligar</a>}
                <a className="lv-btn sec pq" href={f.site} target="_blank" rel="noopener noreferrer">Ver site</a>
                {salvos.includes(f.id) ? (
                  <span className="lv-selo ok">Nos meus fornecedores</span>
                ) : (
                  <form action={simular ? undefined : salvarDoDiretorio} onSubmit={simular ? (e) => { e.preventDefault(); alert('Prévia: nada foi gravado.') } : undefined}>
                    <input type="hidden" name="diretorio_id" value={f.id} />
                    <button type="submit" className="lv-btn sec pq">+ Salvar nos meus</button>
                  </form>
                )}
              </div>
              <small className="fonte">Fonte: <a href={f.fonte} target="_blank" rel="noopener noreferrer">{f.fonte.replace(/^https?:\/\/(www\.)?/, '')}</a> · conferido em {f.conferido_em.split('-').reverse().join('/')}</small>
            </article>
          ))}
        </div>
      )}

      <p className="lv-forn-rodape">
        Conhece um fornecedor bom que não está aqui, ou algum contato mudou? Avise a gente pelo suporte: a lista só cresce com contato oficial conferido.
      </p>
    </>
  )
}
