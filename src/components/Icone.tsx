// ícones de traço simples (24x24), sem dependência externa
const P: Record<string, string> = {
  painel: 'M3 13h8V3H3zM13 21h8v-8h-8zM3 21h8v-6H3zM13 3v8h8V3z',
  produtos: 'M21 8l-9-5-9 5 9 5 9-5zM3 8v8l9 5 9-5V8M12 13v8',
  vender: 'M3 4h2l2.4 11.2a2 2 0 002 1.6h7.7a2 2 0 002-1.5L21 8H6.2M10 21a1 1 0 100-2 1 1 0 000 2zM18 21a1 1 0 100-2 1 1 0 000 2z',
  caixa: 'M3 7h18v12H3zM3 11h18M7 15h3',
  vendas: 'M4 19V5M4 19h16M8 15l3-4 3 2 5-6',
  calculadora: 'M6 3h12a1 1 0 011 1v16a1 1 0 01-1 1H6a1 1 0 01-1-1V4a1 1 0 011-1zM8 7h8M8 12h.01M12 12h.01M16 12h.01M8 16h.01M12 16h.01M16 16h.01',
  vitrine: 'M4 9l1.5-5h13L20 9M4 9h16v11H4zM4 9a2.7 2.7 0 005.3 0 2.7 2.7 0 005.4 0 2.7 2.7 0 005.3 0M10 20v-5h4v5',
  atendente: 'M21 12a8 8 0 01-11.6 7.1L4 20l1-4.4A8 8 0 1121 12zM9 11h.01M12 11h.01M15 11h.01',
  radar: 'M12 12l6-6M21 12a9 9 0 11-9-9M17 12a5 5 0 11-5-5M12 12h.01',
  planos: 'M12 2l3 6 6.5 1-4.7 4.6 1.1 6.4L12 17l-5.9 3 1.1-6.4L2.5 9 9 8z',
  conta: 'M12 12a4 4 0 100-8 4 4 0 000 8zM4 21a8 8 0 0116 0',
  sair: 'M15 4h3a2 2 0 012 2v12a2 2 0 01-2 2h-3M10 17l-5-5 5-5M5 12h11',
  mais: 'M12 5v14M5 12h14',
  importar: 'M12 3v12M7 10l5 5 5-5M4 21h16',
  buscar: 'M11 18a7 7 0 100-14 7 7 0 000 14zM21 21l-4.3-4.3',
  lixo: 'M4 7h16M10 11v6M14 11v6M6 7l1 13h10l1-13M9 7V4h6v3',
  seta: 'M5 12h14M13 6l6 6-6 6',
  cadeado: 'M6 11h12v10H6zM8 11V7a4 4 0 018 0v4',
  pedidos: 'M9 4h6a1 1 0 011 1v1H8V5a1 1 0 011-1zM6 6h12v14H6zM9 11h6M9 15h4',
  repor: 'M20 11a8 8 0 10-2.3 5.7M20 5v6h-6M12 8v4l3 2',
  fornecedores: 'M2 7h11v9H2zM13 10h4l3 3v3h-7M6 19a2 2 0 100-4 2 2 0 000 4zM17 19a2 2 0 100-4 2 2 0 000 4z',
  integracoes: 'M9 7V3M15 7V3M7 7h10v4a5 5 0 01-10 0zM12 16v5',
  clientes: 'M9 11a3.5 3.5 0 100-7 3.5 3.5 0 000 7zM2.5 20a6.5 6.5 0 0113 0M16 4.5a3.5 3.5 0 010 6.5M18 14a6 6 0 013.5 6',
}

export function Icone({ nome, className }: { nome: string; className?: string }) {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.8} strokeLinecap="round" strokeLinejoin="round" className={className} aria-hidden>
      <path d={P[nome] ?? ''} />
    </svg>
  )
}
