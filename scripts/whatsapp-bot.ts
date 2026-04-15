/**
 * Bot WhatsApp — LuvyMetrics
 * ⚠️  ATENÇÃO: este script precisa rodar em servidor persistente (VPS/Railway).
 *              NÃO funciona no Vercel (serverless/stateless).
 *
 * Setup:
 *   npm install @whiskeysockets/baileys qrcode
 *   npx ts-node scripts/whatsapp-bot.ts
 */

// Descomente as importações quando as dependências estiverem instaladas:
// import makeWASocket, { useMultiFileAuthState, DisconnectReason } from '@whiskeysockets/baileys'
// import { Boom } from '@hapi/boom'
// import { createClient } from '@supabase/supabase-js'

const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL!
const SERVICE_KEY  = process.env.SUPABASE_SERVICE_ROLE_KEY!

/**
 * Comandos suportados:
 *
 * "estoque" | "meu estoque"
 *   → lista estoque do usuário pelo número de WhatsApp
 *
 * "tendências" | "o que comprar"
 *   → top 5 produtos em alta hoje
 *
 * "adicionar [produto] [quantidade]"
 *   → adiciona ao estoque
 *
 * "calcular [custo]"
 *   → calcula preço ideal com margem 40%
 */

async function processarMensagem(numero: string, texto: string): Promise<string> {
  // const supabase = createClient(SUPABASE_URL, SERVICE_KEY)
  const cmd = texto.toLowerCase().trim()

  if (cmd.includes('estoque') || cmd.includes('meu estoque')) {
    // const { data: perfil } = await supabase.from('perfis').select('user_id').eq('whatsapp', numero).single()
    // const { data: itens } = await supabase.from('estoque_usuario').select('*').eq('user_id', perfil.user_id).eq('ativo', true)
    return `📦 *SEU ESTOQUE ATUAL:*\n✅ Vibrador USB Pro — 12 unidades\n🟡 Gel Esquentado — 3 unidades (baixo!)\n🔴 Plug Anal P — ZERADO\n\n💡 Dica: Repor gel e plug com urgência!`
  }

  if (cmd.includes('tendência') || cmd.includes('tendencias') || cmd.includes('o que comprar')) {
    return `🔥 *TOP 5 TENDÊNCIAS HOJE:*\n1. Vibrador Silicone +83% 🔥\n2. Plug Anal Iniciante +67% 📈\n3. Gel Esquentado +54% 📈\n4. Calcinha Comestível +41% 📈\n5. Pompoarismo Kit +38% 📈\n\n📊 Ver detalhes: luvymetrics.com.br`
  }

  if (cmd.startsWith('calcular ')) {
    const custo = parseFloat(cmd.replace('calcular ', ''))
    if (!isNaN(custo)) {
      const preco = custo / (1 - 0.14 - 0.40) // Shopee + 40% margem
      const lucro = preco * 0.40
      return `💰 *CÁLCULO — Margem 40% / Shopee:*\n• Custo: R$${custo.toFixed(2)}\n• Taxa Shopee (14%): R$${(preco * 0.14).toFixed(2)}\n• Sua margem (40%): R$${lucro.toFixed(2)}\n• *Preço ideal: R$${preco.toFixed(2)}*\n• *Lucro líquido: R$${lucro.toFixed(2)}*`
    }
  }

  return `Olá! 👋 Sou o bot do *LuvyMetrics*.\n\nComandos disponíveis:\n• *estoque* — ver seu estoque\n• *tendências* — top produtos de hoje\n• *calcular [valor]* — calcular preço ideal\n\n📊 Acesse luvymetrics.com.br para o painel completo.`
}

async function iniciarBot() {
  console.log('🤖 Bot WhatsApp LuvyMetrics')
  console.log('⚠️  Instale as dependências e descomente o código para ativar:')
  console.log('    npm install @whiskeysockets/baileys @hapi/boom')
  console.log('')
  console.log('Exemplo de mensagem processada:')
  console.log(await processarMensagem('5511999999999', 'tendências'))
}

iniciarBot().catch(console.error)
