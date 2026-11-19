import type { MetadataRoute } from 'next'

// permite instalar o LuvyMetrics na tela inicial do celular, como um aplicativo
export default function manifest(): MetadataRoute.Manifest {
  return {
    name: 'LuvyMetrics',
    short_name: 'Luvy',
    description: 'Estoque, balcão, vitrine e pedidos da sua loja num controle só.',
    start_url: '/painel',
    scope: '/',
    display: 'standalone',
    background_color: '#f8f5f9',
    theme_color: '#1c1222',
    lang: 'pt-BR',
    icons: [
      { src: '/icone-192.png', sizes: '192x192', type: 'image/png' },
      { src: '/icone-512.png', sizes: '512x512', type: 'image/png' },
      { src: '/icone-512.png', sizes: '512x512', type: 'image/png', purpose: 'maskable' },
    ],
    shortcuts: [
      { name: 'Vender', url: '/vender' },
      { name: 'Pedidos', url: '/pedidos' },
      { name: 'Produtos', url: '/produtos' },
    ],
  }
}
