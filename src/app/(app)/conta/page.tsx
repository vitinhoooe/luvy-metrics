import Link from 'next/link'
import type { Metadata } from 'next'
import { revalidatePath } from 'next/cache'
import { exigirLoja } from '@/lib/sessao'
import { CATEGORIAS, UFS } from '@/lib/constantes'
import { PLANOS } from '@/lib/planos'
import { Icone } from '@/components/Icone'
import { sair } from '../../(conta)/acoes'

export const metadata: Metadata = { title: 'Minha conta' }

async function salvarLoja(fd: FormData) {
  'use server'
  const { supabase, loja } = await exigirLoja()
  const nome = String(fd.get('nome') ?? '').trim().slice(0, 80)
  const cidade = String(fd.get('cidade') ?? '').trim().slice(0, 80)
  const uf = String(fd.get('uf') ?? '').toUpperCase()
  const whatsapp = String(fd.get('whatsapp') ?? '').replace(/\D/g, '').slice(0, 13) || null
  const categorias = fd.getAll('categorias').map(String).filter((c) => (CATEGORIAS as readonly string[]).includes(c))
  if (nome.length < 2 || cidade.length < 2 || !(UFS as readonly string[]).includes(uf)) return
  // dados da loja: editáveis mesmo com plano vencido (não é recurso pago)
  await supabase.from('lojas').update({ nome, cidade, uf, whatsapp, categorias }).eq('id', loja.id)
  revalidatePath('/', 'layout')
}

export default async function Conta() {
  const { user, loja, assinatura } = await exigirLoja()
  return (
    <>
      <div className="lv-top">
        <div><h1>Minha conta</h1><p>{user.email} · Plano {PLANOS[assinatura.plano].nome} ({assinatura.status})</p></div>
        <form action={sair}><button className="lv-btn sec" type="submit"><Icone nome="sair" />Sair</button></form>
      </div>

      <div className="lv-grid c2" style={{ alignItems: 'start' }}>
        <form action={salvarLoja} className="lv-card lv-form">
          <h2>Dados da loja</h2>
          <div className="lv-campo"><label htmlFor="nome">Nome</label><input id="nome" name="nome" className="lv-input" defaultValue={loja.nome} required /></div>
          <div className="linha">
            <div className="lv-campo"><label htmlFor="cidade">Cidade</label><input id="cidade" name="cidade" className="lv-input" defaultValue={loja.cidade} required /></div>
            <div className="lv-campo"><label htmlFor="uf">UF</label><select id="uf" name="uf" defaultValue={loja.uf}>{UFS.map((u) => <option key={u}>{u}</option>)}</select></div>
          </div>
          <div className="lv-campo"><label htmlFor="whatsapp">WhatsApp</label><input id="whatsapp" name="whatsapp" className="lv-input" inputMode="tel" defaultValue={loja.whatsapp ?? ''} /></div>
          <div className="lv-campo">
            <span className="lv-rotulo">Categorias</span>
            <div className="lv-chips">
              {CATEGORIAS.map((c) => <label key={c} className="lv-chip"><input type="checkbox" name="categorias" value={c} defaultChecked={loja.categorias.includes(c)} />{c}</label>)}
            </div>
          </div>
          <div><button className="lv-btn" type="submit">Salvar</button></div>
        </form>

        <div className="lv-grid">
          <div className="lv-card">
            <h2>Endereço da sua vitrine</h2>
            <p className="mono" style={{ fontSize: 14 }}>luvymetrics.com.br/loja/<strong>{loja.slug}</strong></p>
            <p style={{ color: 'var(--dim)', fontSize: 13, marginTop: 6 }}>Já reservado para você. <Link href="/vitrine">Configurar a vitrine →</Link></p>
          </div>
          <div className="lv-card">
            <h2>Baixar meus dados</h2>
            <p style={{ color: 'var(--dim)', fontSize: 13, marginBottom: 10 }}>Planilhas que abrem no Excel. Os dados são seus: leve quando quiser.</p>
            <div className="lv-lista">
              <a href="/api/exportar?tipo=produtos"><span>Produtos e estoque</span><span className="fim">Baixar</span></a>
              <a href="/api/exportar?tipo=vendas"><span>Vendas (item por item)</span><span className="fim">Baixar</span></a>
              <a href="/api/exportar?tipo=clientes"><span>Clientes da vitrine</span><span className="fim">Baixar</span></a>
            </div>
          </div>
          <div className="lv-card">
            <h2>Atalhos</h2>
            <div className="lv-lista">
              <Link href="/planos"><span>Planos e pagamento</span><span className="fim">→</span></Link>
              <Link href="/calculadora"><span>Calculadora de preço</span><span className="fim">→</span></Link>
              <Link href="/vendas"><span>Relatório de vendas</span><span className="fim">→</span></Link>
              <Link href="/produtos/importar"><span>Importar planilha</span><span className="fim">→</span></Link>
              <Link href="/recuperar-senha"><span>Trocar senha</span><span className="fim">→</span></Link>
            </div>
          </div>
        </div>
      </div>
    </>
  )
}
