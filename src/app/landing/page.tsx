'use client'

import { useState } from 'react'

const CAKTO   = 'https://pay.cakto.com.br/wi3b98b_851240'
const WPP_NUM = process.env.NEXT_PUBLIC_WPP_SUPORTE ?? '5521999999999'

// ─── Máscara de WhatsApp ──────────────────────────────────────────
function mascaraWpp(v: string) {
  const n = v.replace(/\D/g, '').slice(0, 11)
  if (n.length <= 2)  return `(${n}`
  if (n.length <= 6)  return `(${n.slice(0,2)}) ${n.slice(2)}`
  if (n.length <= 10) return `(${n.slice(0,2)}) ${n.slice(2,6)}-${n.slice(6)}`
  return `(${n.slice(0,2)}) ${n.slice(2,7)}-${n.slice(7)}`
}

// ─── Formulário de captação ───────────────────────────────────────
function FormularioLead() {
  const [nome,       setNome]       = useState('')
  const [wpp,        setWpp]        = useState('')
  const [nomeLoja,   setNomeLoja]   = useState('')
  const [faturamento, setFaturamento] = useState('')
  const [loading,    setLoading]    = useState(false)
  const [enviado,    setEnviado]    = useState(false)
  const [erro,       setErro]       = useState('')

  async function enviar(e: React.FormEvent) {
    e.preventDefault()
    if (!nome.trim() || !wpp.trim()) { setErro('Preencha nome e WhatsApp'); return }
    setLoading(true); setErro('')
    try {
      const res = await fetch('/api/leads', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          nome: nome.trim(),
          whatsapp: wpp.replace(/\D/g, ''),
          nome_loja: nomeLoja.trim() || null,
          faturamento_mensal: faturamento || null,
        }),
      })
      if (!res.ok) throw new Error()
      setEnviado(true)
      // Abre WhatsApp do suporte
      const msg = encodeURIComponent(`Olá! Me chamo ${nome} e quero saber mais sobre o LuvyMetrics para a minha sex shop.`)
      window.open(`https://wa.me/${WPP_NUM}?text=${msg}`, '_blank')
    } catch {
      setErro('Erro ao enviar. Tente novamente.')
    } finally {
      setLoading(false)
    }
  }

  const inputCls = `w-full px-4 py-3 rounded-lg text-sm focus:outline-none transition-colors`
  const inputStyle: React.CSSProperties = {
    background: 'rgba(255,255,255,0.06)',
    border: '1px solid rgba(255,255,255,0.1)',
    color: '#f1f1f3',
  }

  if (enviado) {
    return (
      <div className="text-center py-8">
        <p className="text-4xl mb-3">✅</p>
        <p className="font-bold text-xl mb-2" style={{ color: '#f1f1f3' }}>Recebemos suas informações!</p>
        <p style={{ color: '#6b6b7a', fontSize: 14 }}>
          Nossa equipe vai entrar em contato no WhatsApp em breve.
        </p>
      </div>
    )
  }

  return (
    <form onSubmit={enviar} className="space-y-3">
      <div>
        <label className="block mb-1" style={{ fontSize: 11, color: '#6b6b7a', fontWeight: 500 }}>Seu nome *</label>
        <input value={nome} onChange={(e) => setNome(e.target.value)}
          placeholder="João Silva" className={inputCls} style={inputStyle} />
      </div>
      <div>
        <label className="block mb-1" style={{ fontSize: 11, color: '#6b6b7a', fontWeight: 500 }}>WhatsApp *</label>
        <input value={wpp} onChange={(e) => setWpp(mascaraWpp(e.target.value))}
          placeholder="(11) 99999-9999" type="tel" className={inputCls} style={inputStyle} />
      </div>
      <div>
        <label className="block mb-1" style={{ fontSize: 11, color: '#6b6b7a', fontWeight: 500 }}>Nome da loja</label>
        <input value={nomeLoja} onChange={(e) => setNomeLoja(e.target.value)}
          placeholder="Boutique Secreta" className={inputCls} style={inputStyle} />
      </div>
      <div>
        <label className="block mb-1" style={{ fontSize: 11, color: '#6b6b7a', fontWeight: 500 }}>Faturamento mensal</label>
        <select value={faturamento} onChange={(e) => setFaturamento(e.target.value)}
          className={inputCls} style={{ ...inputStyle, cursor: 'pointer' }}>
          <option value="">Selecione (opcional)</option>
          <option value="ate5k">Até R$ 5.000</option>
          <option value="5k-20k">R$ 5.000 — R$ 20.000</option>
          <option value="20k-50k">R$ 20.000 — R$ 50.000</option>
          <option value="acima50k">Acima de R$ 50.000</option>
        </select>
      </div>
      {erro && <p style={{ color: '#ef4444', fontSize: 13 }}>{erro}</p>}
      <button type="submit" disabled={loading}
        className="w-full py-3.5 rounded-lg font-bold text-white text-base disabled:opacity-50 transition-opacity"
        style={{ background: '#7c5cfc' }}>
        {loading ? 'Enviando...' : 'Quero saber mais →'}
      </button>
      <p style={{ fontSize: 11, color: '#4a4a57', textAlign: 'center' }}>
        Sem spam. Entraremos em contato no WhatsApp.
      </p>
    </form>
  )
}

// ─── Seção ────────────────────────────────────────────────────────
function Secao({ id, children, className = '', style }: { id?: string; children: React.ReactNode; className?: string; style?: React.CSSProperties }) {
  return (
    <section id={id} className={`px-4 py-16 sm:py-20 ${className}`} style={style}>
      <div className="max-w-5xl mx-auto">{children}</div>
    </section>
  )
}

// ─── Página principal ─────────────────────────────────────────────
export default function LandingPage() {
  return (
    <div style={{ background: '#0d0d0f', color: '#f1f1f3', minHeight: '100vh' }}>

      {/* ── Nav ─────────────────────────────────── */}
      <nav style={{ borderBottom: '1px solid rgba(255,255,255,0.06)', background: 'rgba(13,13,15,0.95)', backdropFilter: 'blur(12px)' }}
        className="px-4 py-4 sticky top-0 z-50"
        aria-label="Navegação principal"
        role="navigation">
        <div className="max-w-5xl mx-auto flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-lg flex items-center justify-center" style={{ background: '#7c5cfc' }}>
              <span className="text-sm">📊</span>
            </div>
            <span className="font-bold" style={{ color: '#f1f1f3' }}>LuvyMetrics</span>
          </div>
          <a href="/login" style={{ color: '#6b6b7a', fontSize: 14 }}
            className="hover:text-white transition-colors">
            Entrar →
          </a>
        </div>
      </nav>

      {/* ── Hero ────────────────────────────────── */}
      <Secao className="pt-20 pb-12">
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 items-start">

          {/* Texto */}
          <div>
            <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full mb-6"
              style={{ background: 'rgba(124,92,252,0.12)', border: '1px solid rgba(124,92,252,0.2)', fontSize: 12, color: '#7c5cfc', fontWeight: 500 }}>
              🔥 Mais de 200 sex shops usando no Brasil
            </div>
            <h1 className="text-4xl sm:text-5xl font-bold mb-5 leading-tight">
              Seu sex shop deixando{' '}
              <span style={{ color: '#7c5cfc' }}>dinheiro na prateleira</span>{' '}
              todo mês?
            </h1>
            <p className="text-lg mb-8" style={{ color: '#6b6b7a', lineHeight: 1.7 }}>
              Descubra o que vai vender <strong style={{ color: '#f1f1f3' }}>antes de comprar</strong>.
              Nunca mais estoque parado. Nunca mais perder tendência por falta de informação.
            </p>
            <div className="flex flex-wrap gap-4 mb-8">
              {['✓ Sem planilha manual', '✓ Dados em tempo real', '✓ Teste grátis por 7 dias'].map((item) => (
                <span key={item} style={{ fontSize: 14, color: '#6b6b7a' }}>{item}</span>
              ))}
            </div>
            <div className="flex items-center gap-3">
              <div className="flex -space-x-2">
                {['👩', '👨', '👩', '👨'].map((e, i) => (
                  <div key={i} className="w-9 h-9 rounded-full border-2 flex items-center justify-center"
                    style={{ background: '#1a1a1f', borderColor: '#0d0d0f', fontSize: 16 }}>{e}</div>
                ))}
              </div>
              <p style={{ fontSize: 13, color: '#6b6b7a' }}>
                <strong style={{ color: '#f1f1f3' }}>+200 lojistas</strong> já usam o LuvyMetrics
              </p>
            </div>
          </div>

          {/* Formulário */}
          <div className="rounded-2xl p-6" style={{ background: '#1a1a1f', border: '1px solid rgba(255,255,255,0.07)' }}>
            <h2 className="text-xl font-bold mb-1" style={{ color: '#f1f1f3' }}>
              Quero começar gratuitamente
            </h2>
            <p className="mb-5" style={{ fontSize: 13, color: '#6b6b7a' }}>
              Preencha abaixo e nossa equipe vai entrar em contato no WhatsApp.
            </p>
            <FormularioLead />
          </div>

        </div>
      </Secao>

      {/* ── Dor vs Solução ──────────────────────── */}
      <Secao style={{ background: '#141417' } as React.CSSProperties}>
        <div className="text-center mb-12">
          <h2 className="text-3xl font-bold mb-4">Você se identifica com alguma dessas situações?</h2>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div className="space-y-4">
            {[
              'Compra produto e não vende, enquanto outro esgota em dias',
              'Não sabe o que está em alta no Mercado Livre e na Shopee agora',
              'Perde margem porque não calcula as taxas corretamente',
              'Fica sabendo das tendências tarde demais — quando o mercado já saturou',
            ].map((d) => (
              <div key={d} className="flex items-start gap-3 p-4 rounded-xl"
                style={{ background: 'rgba(239,68,68,0.05)', border: '1px solid rgba(239,68,68,0.12)' }}>
                <span style={{ color: '#ef4444', fontSize: 18, flexShrink: 0 }}>✗</span>
                <p style={{ color: '#6b6b7a', fontSize: 14, lineHeight: 1.6 }}>{d}</p>
              </div>
            ))}
          </div>
          <div className="space-y-4">
            {[
              'Sabe exatamente o que comprar antes de todo mundo, com dados reais',
              'Vê em tempo real o que está explodindo no ML, Shopee e Google Trends',
              'Calcula o preço ideal com taxa + margem em segundos',
              'Recebe alerta no WhatsApp quando um produto entra em tendência',
            ].map((s) => (
              <div key={s} className="flex items-start gap-3 p-4 rounded-xl"
                style={{ background: 'rgba(34,197,94,0.05)', border: '1px solid rgba(34,197,94,0.12)' }}>
                <span style={{ color: '#22c55e', fontSize: 18, flexShrink: 0 }}>✓</span>
                <p style={{ color: '#f1f1f3', fontSize: 14, lineHeight: 1.6 }}>{s}</p>
              </div>
            ))}
          </div>
        </div>
      </Secao>

      {/* ── Funcionalidades ─────────────────────── */}
      <Secao>
        <div className="text-center mb-12">
          <h2 className="text-3xl font-bold mb-4">Tudo que sua sex shop precisa em um lugar</h2>
          <p style={{ color: '#6b6b7a', maxWidth: 480, margin: '0 auto' }}>
            Desenvolvido especificamente para o segmento adulto, com dados do Mercado Livre, Shopee e Google Trends.
          </p>
        </div>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
          {[
            { emoji: '📡', titulo: 'Radar de Tendências',   desc: 'Veja os produtos que mais crescem em vendas hoje, com dados atualizados diariamente de múltiplos marketplaces.' },
            { emoji: '📲', titulo: 'Alertas no WhatsApp',   desc: 'Receba todo dia às 7h um resumo dos produtos mais quentes. Nunca mais perca uma tendência de alta.' },
            { emoji: '🧮', titulo: 'Calculadora de Lucro',  desc: 'Calcule o preço ideal considerando taxa de marketplace (ML, Shopee), margem desejada e Simples Nacional.' },
            { emoji: '📦', titulo: 'Gestão de Estoque',     desc: 'Controle entradas e saídas, defina estoque mínimo e receba alerta quando um produto estiver acabando.' },
          ].map((f) => (
            <div key={f.titulo} className="p-6 rounded-xl"
              style={{ background: '#1a1a1f', border: '1px solid rgba(255,255,255,0.07)' }}>
              <span className="text-3xl mb-4 block">{f.emoji}</span>
              <p className="font-bold text-base mb-2" style={{ color: '#f1f1f3' }}>{f.titulo}</p>
              <p style={{ color: '#6b6b7a', fontSize: 14, lineHeight: 1.7 }}>{f.desc}</p>
            </div>
          ))}
        </div>
      </Secao>

      {/* ── Depoimentos ─────────────────────────── */}
      <Secao style={{ background: '#141417' } as React.CSSProperties}>
        <div className="text-center mb-12">
          <h2 className="text-3xl font-bold">O que dizem nossos clientes</h2>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
          {[
            {
              nome: 'Camila R.',  cidade: 'São Paulo, SP',
              resultado: '+R$ 4.200 em 30 dias',
              texto: 'Antes eu ficava no achismo. Agora sei exatamente o que comprar. No primeiro mês já recuperei o investimento várias vezes.',
            },
            {
              nome: 'Pedro M.',  cidade: 'Fortaleza, CE',
              resultado: 'Estoque zerado em 12 dias',
              texto: 'O alerta de WhatsApp me avisou sobre um produto que estava explodindo. Comprei 50 unidades e vendi tudo em menos de 2 semanas.',
            },
            {
              nome: 'Ana L.',  cidade: 'Curitiba, PR',
              resultado: '67% menos estoque parado',
              texto: 'Eu travava R$ 8.000 em produtos que não saíam. Com o LuvyMetrics aprendi a comprar o que o mercado pede, não o que eu acho que vai vender.',
            },
          ].map((t) => (
            <div key={t.nome} className="p-6 rounded-xl flex flex-col gap-4"
              style={{ background: '#1a1a1f', border: '1px solid rgba(255,255,255,0.07)' }}>
              <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full self-start"
                style={{ background: 'rgba(34,197,94,0.1)', border: '1px solid rgba(34,197,94,0.2)', fontSize: 13, color: '#22c55e', fontWeight: 700 }}>
                {t.resultado}
              </div>
              <p style={{ color: '#6b6b7a', fontSize: 14, lineHeight: 1.7, flex: 1 }}>"{t.texto}"</p>
              <div>
                <p className="font-semibold" style={{ fontSize: 14, color: '#f1f1f3' }}>{t.nome}</p>
                <p style={{ fontSize: 12, color: '#4a4a57' }}>{t.cidade}</p>
              </div>
            </div>
          ))}
        </div>
      </Secao>

      {/* ── Pricing ─────────────────────────────── */}
      <Secao id="precos">
        <div className="max-w-md mx-auto text-center">
          <p style={{ color: '#7c5cfc', fontSize: 13, fontWeight: 600, letterSpacing: '0.5px', marginBottom: 12 }}>
            PLANO ÚNICO
          </p>
          <h2 className="text-3xl font-bold mb-3">Um preço. Acesso completo.</h2>
          <p style={{ color: '#6b6b7a', marginBottom: 40 }}>
            Sem plano básico, sem plano avançado. Tudo que sua sex shop precisa por um valor que cabe no orçamento.
          </p>

          <div className="rounded-2xl p-8 text-center"
            style={{ background: '#1a1a1f', border: '2px solid rgba(124,92,252,0.4)' }}>
            <p style={{ fontSize: 13, color: '#7c5cfc', fontWeight: 600, marginBottom: 8 }}>LuvyMetrics Pro</p>
            <p className="font-black" style={{ fontSize: 56, color: '#f1f1f3', lineHeight: 1 }}>
              R$297
            </p>
            <p style={{ color: '#6b6b7a', fontSize: 14, marginBottom: 32 }}>/mês · cancele quando quiser</p>

            <ul className="text-left space-y-3 mb-8">
              {[
                'Radar de tendências diário (ML + Shopee + Google Trends)',
                'Alertas no WhatsApp todos os dias às 7h',
                'Relatório semanal completo todo domingo',
                'Calculadora de lucro com todas as taxas',
                'Gestão de estoque com alertas de reposição',
                'Assistente IA especialista em sex shop',
                'Dados de demanda por região do Brasil',
                'Suporte via WhatsApp',
              ].map((item) => (
                <li key={item} className="flex items-start gap-3">
                  <span style={{ color: '#22c55e', flexShrink: 0, marginTop: 1 }}>✓</span>
                  <span style={{ color: '#6b6b7a', fontSize: 14 }}>{item}</span>
                </li>
              ))}
            </ul>

            <a href={CAKTO} target="_blank" rel="noopener noreferrer"
              className="block w-full py-4 rounded-lg font-bold text-white text-lg transition-opacity hover:opacity-90"
              style={{ background: '#7c5cfc' }}>
              Assinar agora →
            </a>
            <p style={{ fontSize: 12, color: '#4a4a57', marginTop: 12 }}>
              Pagamento 100% seguro. Cancele a qualquer momento.
            </p>
          </div>
        </div>
      </Secao>

      {/* ── FAQ ─────────────────────────────────── */}
      <Secao style={{ background: '#141417' } as React.CSSProperties}>
        <div className="max-w-2xl mx-auto">
          <h2 className="text-3xl font-bold text-center mb-10">Perguntas frequentes</h2>
          <div className="space-y-4">
            {[
              {
                p: 'Funciona para loja física ou só para e-commerce?',
                r: 'Funciona para os dois. As tendências mostram o que está em alta nos marketplaces, mas você pode usar esses dados para comprar estoque para a loja física também.',
              },
              {
                p: 'Os dados são atualizados com que frequência?',
                r: 'Diariamente. Todo dia às 6h coletamos dados do Mercado Livre, Shopee e Google Trends. Às 7h você já recebe o resumo no WhatsApp.',
              },
              {
                p: 'Posso cancelar quando quiser?',
                r: 'Sim. Sem fidelidade, sem multa. Cancele pela própria plataforma Cakto em qualquer momento.',
              },
              {
                p: 'Preciso ter conhecimento técnico para usar?',
                r: 'Não. O LuvyMetrics foi feito para lojistas, não para programadores. Se você sabe usar WhatsApp, consegue usar o LuvyMetrics.',
              },
              {
                p: 'O assistente IA realmente conhece o segmento adulto?',
                r: 'Sim. O assistente tem acesso aos seus dados reais de estoque e às tendências do mercado adulto. Você pergunta e ele responde com base no que está acontecendo agora no seu negócio.',
              },
            ].map((faq, i) => (
              <details key={i} className="rounded-xl group"
                style={{ background: '#1a1a1f', border: '1px solid rgba(255,255,255,0.07)' }}>
                <summary className="px-5 py-4 cursor-pointer font-medium select-none flex items-center justify-between"
                  style={{ color: '#f1f1f3', fontSize: 15 }}>
                  {faq.p}
                  <span style={{ color: '#6b6b7a', flexShrink: 0, marginLeft: 12 }}>＋</span>
                </summary>
                <p className="px-5 pb-4" style={{ color: '#6b6b7a', fontSize: 14, lineHeight: 1.7, marginTop: -4 }}>
                  {faq.r}
                </p>
              </details>
            ))}
          </div>
        </div>
      </Secao>

      {/* ── CTA final ───────────────────────────── */}
      <Secao>
        <div className="text-center max-w-xl mx-auto">
          <h2 className="text-3xl sm:text-4xl font-bold mb-4">
            Pare de adivinhar.<br />Comece a vender com dados.
          </h2>
          <p className="mb-8" style={{ color: '#6b6b7a', fontSize: 16, lineHeight: 1.7 }}>
            Enquanto você está lendo isso, outros lojistas já sabem o que vai vender essa semana. Não fique para trás.
          </p>
          <a href={CAKTO} target="_blank" rel="noopener noreferrer"
            className="inline-block px-10 py-4 rounded-xl font-bold text-white text-lg transition-opacity hover:opacity-90 mb-4"
            style={{ background: '#7c5cfc' }}>
            Começar agora por R$297/mês →
          </a>
          <p style={{ fontSize: 13, color: '#4a4a57' }}>Teste grátis por 7 dias. Cancele quando quiser.</p>
        </div>
      </Secao>

      {/* ── Footer ──────────────────────────────── */}
      <footer className="px-4 py-8" style={{ borderTop: '1px solid rgba(255,255,255,0.06)' }}>
        <div className="max-w-5xl mx-auto flex flex-col sm:flex-row items-center justify-between gap-3">
          <p style={{ fontSize: 13, color: '#4a4a57' }}>
            © {new Date().getFullYear()} LuvyMetrics. Todos os direitos reservados.
          </p>
          <a href="/login" style={{ fontSize: 13, color: '#7c5cfc', textDecoration: 'none' }}
            className="hover:underline">
            Já é cliente? Entrar →
          </a>
        </div>
      </footer>

    </div>
  )
}
