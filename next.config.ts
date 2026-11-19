import type { NextConfig } from 'next'

const nextConfig: NextConfig = {
  async redirects() {
    // endereços do app antigo continuam funcionando
    return [
      { source: '/login', destination: '/entrar', permanent: true },
      { source: '/dashboard', destination: '/painel', permanent: true },
      { source: '/onboarding', destination: '/comecar', permanent: true },
      { source: '/estoque', destination: '/produtos', permanent: true },
    ]
  },
  experimental: {
    serverActions: { bodySizeLimit: '4mb' }, // importação de planilha
  },
}

export default nextConfig
