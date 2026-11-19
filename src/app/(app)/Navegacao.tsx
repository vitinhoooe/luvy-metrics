'use client'
import Link from 'next/link'
import { usePathname, useRouter } from 'next/navigation'
import { useEffect, useMemo, useRef, useState } from 'react'
import { createPortal } from 'react-dom'
import { Icone } from '@/components/Icone'
import { Logotipo } from '@/components/Marca'

const PRINCIPAL = [
  { href: '/painel', nome: 'Hoje', icone: 'painel' },
  { href: '/vender', nome: 'Vender', icone: 'vender' },
  { href: '/produtos', nome: 'Produtos e estoque', icone: 'produtos' },
  { href: '/repor', nome: 'Estoque inteligente', icone: 'repor' },
  { href: '/caixa', nome: 'Caixa', icone: 'caixa' },
  { href: '/vendas', nome: 'Vendas', icone: 'vendas' },
  { href: '/calculadora', nome: 'Calculadora de preço', icone: 'calculadora' },
  { href: '/vitrine', nome: 'Vitrine online', icone: 'vitrine' },
  { href: '/pedidos', nome: 'Pedidos da vitrine', icone: 'pedidos' },
  { href: '/clientes', nome: 'Clientes', icone: 'clientes' },
  { href: '/fornecedores', nome: 'Fornecedores', icone: 'fornecedores' },
  { href: '/atendente', nome: 'Atendente IA', icone: 'atendente' },
  { href: '/integracoes', nome: 'Integrações', icone: 'integracoes' },
]
const BAIXO = [
  { href: '/painel', nome: 'Hoje', icone: 'painel' },
  { href: '/vender', nome: 'Vender', icone: 'vender' },
  { href: '/produtos', nome: 'Produtos', icone: 'produtos' },
  { href: '/caixa', nome: 'Caixa', icone: 'caixa' },
  { href: '/conta', nome: 'Mais', icone: 'conta' },
]
const ACOES = [
  { href: '/vender', nome: 'Nova venda no balcão', icone: 'vender', dica: 'balcão pdv vender' },
  { href: '/produtos/novo', nome: 'Cadastrar produto', icone: 'mais', dica: 'novo produto cadastro' },
  { href: '/produtos/importar', nome: 'Importar planilha', icone: 'importar', dica: 'excel csv planilha' },
  { href: '/caixa', nome: 'Abrir ou fechar o caixa', icone: 'caixa', dica: 'caixa troco gaveta' },
  { href: '/calculadora', nome: 'Calcular um preço', icone: 'calculadora', dica: 'preço margem taxa' },
  { href: '/pedidos', nome: 'Ver pedidos da vitrine', icone: 'pedidos', dica: 'pedido site online cliente' },
  { href: '/vitrine', nome: 'Configurar minha vitrine', icone: 'vitrine', dica: 'site loja online pix entrega' },
  { href: '/repor', nome: 'O que repor', icone: 'repor', dica: 'acabando repor comprar fornecedor reposição' },
  { href: '/repor?v=parado', nome: 'Dinheiro parado / promoção', icone: 'repor', dica: 'parado encalhado promoção desconto' },
  { href: '/clientes', nome: 'Clientes', icone: 'clientes', dica: 'cliente recompra sumidas fiéis' },
  { href: '/fornecedores', nome: 'Fornecedores', icone: 'fornecedores', dica: 'fornecedor distribuidora atacado fabricante comprar' },
  { href: '/atendente', nome: 'Atendente IA e conversas', icone: 'atendente', dica: 'ia bot chat conversa robô' },
  { href: '/vendas/importar', nome: 'Importar vendas antigas', icone: 'importar', dica: 'histórico vendas antigas sistema anterior relatório' },
  { href: '/integracoes', nome: 'Integrações', icone: 'integracoes', dica: 'api integração maquininha pix mercado livre nuvemshop shopify nota fiscal conectar' },
  { href: '/vendas', nome: 'Relatório de vendas', icone: 'vendas', dica: 'faturamento lucro' },
  { href: '/planos', nome: 'Planos e pagamento', icone: 'planos', dica: 'assinar plano pro' },
  { href: '/conta', nome: 'Minha conta', icone: 'conta', dica: 'loja dados sair senha' },
]

// na prévia (sem login) os links apontam para as telas de exemplo
const PREVIA: Record<string, string> = {
  '/painel': '/previa', '/vender': '/previa/vender', '/produtos': '/previa/produtos', '/caixa': '/previa/caixa',
  '/vendas': '/previa/vendas', '/calculadora': '/previa/calculadora', '/planos': '/previa/planos',
  '/produtos/importar': '/previa/importar', '/vitrine': '/previa/vitrine', '/pedidos': '/previa/pedidos', '/repor': '/previa/repor', '/repor?v=parado': '/previa/repor?v=parado', '/clientes': '/previa/clientes', '/fornecedores': '/previa/fornecedores', '/vendas/importar': '/previa/importar-vendas', '/integracoes': '/previa/integracoes','/atendente': '/previa/atendente', '/produtos/novo': '/previa/produtos', '/produtos?filtro=baixo': '/previa/produtos', '/conta': '/previa/planos',
}
const rota = (href: string, previa?: boolean) => (previa ? PREVIA[href] ?? '/previa' : href)
const ativo = (p: string, href: string) => (href === '/previa' ? p === href : p === href || p.startsWith(href + '/'))

export function Lateral({ loja, cidade, previa }: { loja: string; cidade: string; previa?: boolean }) {
  const p = usePathname()
  return (
    <aside className="lv-side">
      <Link href={rota('/painel', previa)} className="lv-brand" aria-label="LuvyMetrics, início"><Logotipo animar /></Link>
      <div className="lv-side-loja"><strong>{loja}</strong>{cidade}</div>
      <button type="button" className="lv-busca-abre" onClick={() => window.dispatchEvent(new Event('lv-comandos'))}>
        <Icone nome="buscar" />Buscar<kbd>Ctrl K</kbd>
      </button>
      <nav className="lv-nav" aria-label="Principal">
        {PRINCIPAL.map((i) => {
          const h = rota(i.href, previa)
          return <Link key={i.href} href={h} className={ativo(p, h) ? 'on' : ''}><Icone nome={i.icone} />{i.nome}</Link>
        })}
      </nav>
      <div className="lv-side-fim lv-nav">
        <Link href={rota('/planos', previa)} className={ativo(p, rota('/planos', previa)) ? 'on' : ''}><Icone nome="planos" />Planos</Link>
        <Link href={rota('/conta', previa)} className={!previa && ativo(p, '/conta') ? 'on' : ''}><Icone nome="conta" />Minha conta</Link>
      </div>
      <Comandos previa={previa} />
    </aside>
  )
}

export function BarraInferior({ previa }: { previa?: boolean }) {
  const p = usePathname()
  return (
    <nav className="lv-baixo" aria-label="Atalhos">
      {BAIXO.map((i) => {
        const h = rota(i.href, previa)
        return <Link key={i.href} href={h} className={ativo(p, h) ? 'on' : ''}><Icone nome={i.icone} />{i.nome}</Link>
      })}
    </nav>
  )
}

const norm = (s: string) => s.normalize('NFD').replace(/[̀-ͯ]/g, '').toLowerCase()

/** Paleta de comandos: Ctrl+K (ou Cmd+K) para buscar uma tela ou ação e ir direto. */
function Comandos({ previa }: { previa?: boolean }) {
  const [aberto, setAberto] = useState(false)
  const [q, setQ] = useState('')
  const [sel, setSel] = useState(0)
  const router = useRouter()
  const input = useRef<HTMLInputElement>(null)

  useEffect(() => {
    const tecla = (e: KeyboardEvent) => {
      if ((e.ctrlKey || e.metaKey) && e.key.toLowerCase() === 'k') { e.preventDefault(); setAberto((a) => !a) }
      if (e.key === 'Escape') setAberto(false)
    }
    const abrir = () => setAberto(true)
    window.addEventListener('keydown', tecla)
    window.addEventListener('lv-comandos', abrir)
    return () => { window.removeEventListener('keydown', tecla); window.removeEventListener('lv-comandos', abrir) }
  }, [])
  useEffect(() => { if (aberto) { setQ(''); setSel(0); setTimeout(() => input.current?.focus(), 10) } }, [aberto])

  const lista = useMemo(() => {
    const t = norm(q.trim())
    const todos = [...ACOES, ...PRINCIPAL.map((i) => ({ ...i, dica: '' }))]
    const unicos = todos.filter((x, i) => todos.findIndex((y) => y.nome === x.nome) === i)
    return t ? unicos.filter((x) => norm(`${x.nome} ${x.dica}`).includes(t)) : ACOES
  }, [q])

  function ir(href: string) {
    setAberto(false)
    router.push(rota(href, previa))
  }

  if (!aberto) return null
  // portal: o menu lateral é "sticky" e prenderia a janela atrás do conteúdo
  return createPortal(
    <div className="lv lv-modal-fundo lv-cmd-fundo" onClick={() => setAberto(false)}>
      <div className="lv-cmd" role="dialog" aria-modal="true" aria-label="Buscar ou ir para" onClick={(e) => e.stopPropagation()}>
        <div className="lv-cmd-busca">
          <Icone nome="buscar" />
          <input
            ref={input}
            value={q}
            onChange={(e) => { setQ(e.target.value); setSel(0) }}
            onKeyDown={(e) => {
              if (e.key === 'ArrowDown') { e.preventDefault(); setSel((s) => Math.min(s + 1, lista.length - 1)) }
              if (e.key === 'ArrowUp') { e.preventDefault(); setSel((s) => Math.max(s - 1, 0)) }
              if (e.key === 'Enter' && lista[sel]) ir(lista[sel].href)
            }}
            placeholder="O que você quer fazer?"
            aria-label="Buscar"
          />
          <kbd>Esc</kbd>
        </div>
        <ul className="lv-cmd-lista" role="listbox">
          {lista.length === 0 && <li className="vazio">Nada encontrado para “{q}”.</li>}
          {lista.map((x, i) => (
            <li key={x.nome} role="option" aria-selected={i === sel}>
              <button type="button" className={i === sel ? 'on' : ''} onMouseEnter={() => setSel(i)} onClick={() => ir(x.href)}>
                <span className="ico"><Icone nome={x.icone} /></span>{x.nome}<span className="seta">↵</span>
              </button>
            </li>
          ))}
        </ul>
      </div>
    </div>,
    document.body,
  )
}
