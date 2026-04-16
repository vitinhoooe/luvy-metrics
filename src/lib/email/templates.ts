const CAKTO = 'https://pay.cakto.com.br/wi3b98b_851240'
const SITE  = 'https://luvymetrics.com.br'
const WPP   = process.env.NEXT_PUBLIC_WPP_SUPORTE ?? '5521999999999'

const base = (conteudo: string) => `
<!DOCTYPE html>
<html lang="pt-BR">
<head>
  <meta charset="UTF-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1.0" />
  <title>LuvyMetrics</title>
</head>
<body style="margin:0;padding:0;background:#0d0d0f;font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',sans-serif;">
  <table width="100%" cellpadding="0" cellspacing="0" style="background:#0d0d0f;padding:40px 16px;">
    <tr>
      <td align="center">
        <table width="560" cellpadding="0" cellspacing="0" style="max-width:560px;width:100%;">

          <!-- Logo -->
          <tr>
            <td align="center" style="padding-bottom:32px;">
              <div style="display:inline-block;background:#7c5cfc;border-radius:12px;padding:10px 20px;">
                <span style="color:#fff;font-size:18px;font-weight:700;letter-spacing:-0.5px;">📊 LuvyMetrics</span>
              </div>
            </td>
          </tr>

          <!-- Card principal -->
          <tr>
            <td style="background:#1a1a1f;border:1px solid rgba(255,255,255,0.07);border-radius:16px;padding:40px 36px;">
              ${conteudo}
            </td>
          </tr>

          <!-- Rodapé -->
          <tr>
            <td align="center" style="padding-top:24px;">
              <p style="color:#4a4a57;font-size:12px;margin:0;">
                LuvyMetrics · Dados para sex shops venderem mais
              </p>
              <p style="color:#4a4a57;font-size:12px;margin:4px 0 0;">
                <a href="${SITE}" style="color:#7c5cfc;text-decoration:none;">${SITE}</a>
              </p>
            </td>
          </tr>

        </table>
      </td>
    </tr>
  </table>
</body>
</html>`

// ─── Template 1: Boas-vindas ──────────────────────────────────────
export function boasVindasTemplate(nome: string, email: string): string {
  const primeiroNome = nome?.split(' ')[0] ?? 'Lojista'
  return base(`
    <h1 style="color:#f1f1f3;font-size:24px;font-weight:700;margin:0 0 8px;">
      🎉 Seu acesso está pronto, ${primeiroNome}!
    </h1>
    <p style="color:#6b6b7a;font-size:15px;margin:0 0 28px;line-height:1.6;">
      Bem-vindo ao LuvyMetrics. Sua conta foi criada com sucesso.
    </p>

    <div style="background:#141417;border-radius:10px;padding:20px;margin-bottom:24px;">
      <p style="color:#6b6b7a;font-size:12px;font-weight:500;margin:0 0 6px;letter-spacing:0.4px;">
        SEU EMAIL DE ACESSO
      </p>
      <p style="color:#f1f1f3;font-size:16px;font-weight:600;margin:0;">${email}</p>
    </div>

    <a href="${SITE}/login"
      style="display:block;text-align:center;background:#7c5cfc;color:#fff;font-size:16px;font-weight:600;padding:14px 24px;border-radius:10px;text-decoration:none;margin-bottom:28px;">
      Acessar o LuvyMetrics →
    </a>

    <p style="color:#f1f1f3;font-size:15px;font-weight:600;margin:0 0 12px;">O que fazer agora:</p>
    <ol style="color:#6b6b7a;font-size:14px;line-height:2;margin:0 0 24px;padding-left:20px;">
      <li>Clique no botão acima e faça login com seu email</li>
      <li>Complete seu perfil com o nome da loja</li>
      <li>Adicione seus produtos ao estoque</li>
      <li>Explore as tendências do mercado</li>
    </ol>

    <div style="background:rgba(124,92,252,0.1);border:1px solid rgba(124,92,252,0.2);border-radius:10px;padding:16px;margin-bottom:24px;">
      <p style="color:#f1f1f3;font-size:14px;font-weight:600;margin:0 0 4px;">⏰ Amanhã às 7h</p>
      <p style="color:#6b6b7a;font-size:13px;margin:0;">
        Você receberá sua primeira planilha de tendências com os produtos mais quentes do mercado.
      </p>
    </div>

    <p style="color:#6b6b7a;font-size:13px;margin:0;line-height:1.6;">
      Precisa de ajuda? Fale com o suporte via WhatsApp:
      <a href="https://wa.me/${WPP}" style="color:#7c5cfc;text-decoration:none;">
        wa.me/${WPP}
      </a>
    </p>
  `)
}

// ─── Template 2: Trial expirando ─────────────────────────────────
export function trialExpirandoTemplate(nome: string): string {
  const primeiroNome = nome?.split(' ')[0] ?? 'Lojista'
  return base(`
    <h1 style="color:#f1f1f3;font-size:24px;font-weight:700;margin:0 0 8px;">
      ⏰ Seu trial expira amanhã, ${primeiroNome}
    </h1>
    <p style="color:#6b6b7a;font-size:15px;margin:0 0 24px;line-height:1.6;">
      Você tem menos de 24 horas de acesso gratuito. Não perca o acesso às tendências que estão fazendo lojistas venderem mais.
    </p>

    <div style="background:rgba(245,158,11,0.1);border:1px solid rgba(245,158,11,0.2);border-radius:10px;padding:16px;margin-bottom:24px;">
      <p style="color:#f59e0b;font-size:14px;font-weight:600;margin:0 0 4px;">O que você vai perder ao não assinar:</p>
      <ul style="color:#6b6b7a;font-size:13px;line-height:2;margin:0;padding-left:18px;">
        <li>Planilha diária de tendências às 7h</li>
        <li>Alertas de produtos explodindo em vendas</li>
        <li>Assistente IA especialista em sex shop</li>
        <li>Controle de estoque com alertas inteligentes</li>
      </ul>
    </div>

    <a href="${CAKTO}"
      style="display:block;text-align:center;background:#7c5cfc;color:#fff;font-size:16px;font-weight:600;padding:14px 24px;border-radius:10px;text-decoration:none;margin-bottom:16px;">
      Assinar agora por R$297/mês →
    </a>

    <p style="color:#4a4a57;font-size:12px;text-align:center;margin:0;">
      Cancele a qualquer momento. Sem fidelidade.
    </p>
  `)
}

// ─── Template 3: Trial expirado ───────────────────────────────────
export function trialExpiradoTemplate(nome: string): string {
  const primeiroNome = nome?.split(' ')[0] ?? 'Lojista'
  return base(`
    <h1 style="color:#f1f1f3;font-size:24px;font-weight:700;margin:0 0 8px;">
      Sentimos sua falta, ${primeiroNome} 💜
    </h1>
    <p style="color:#6b6b7a;font-size:15px;margin:0 0 24px;line-height:1.6;">
      Seu período de trial encerrou, mas queremos que você continue vendendo mais. Por isso, preparamos uma oferta especial.
    </p>

    <div style="background:#141417;border:1px solid rgba(124,92,252,0.3);border-radius:12px;padding:24px;margin-bottom:24px;text-align:center;">
      <p style="color:#7c5cfc;font-size:13px;font-weight:600;margin:0 0 8px;letter-spacing:0.4px;">OFERTA ESPECIAL</p>
      <p style="color:#f1f1f3;font-size:28px;font-weight:700;margin:0 0 4px;">+7 dias grátis</p>
      <p style="color:#6b6b7a;font-size:14px;margin:0 0 20px;">ao assinar hoje</p>
      <a href="${CAKTO}"
        style="display:inline-block;background:#7c5cfc;color:#fff;font-size:16px;font-weight:600;padding:14px 32px;border-radius:10px;text-decoration:none;">
        Reativar meu acesso →
      </a>
    </div>

    <p style="color:#6b6b7a;font-size:13px;margin:0 0 8px;line-height:1.6;">
      Enquanto seu acesso ficou pausado, o mercado não parou:
    </p>
    <ul style="color:#6b6b7a;font-size:13px;line-height:2;margin:0 0 24px;padding-left:18px;">
      <li>Novos produtos entraram em tendência</li>
      <li>Concorrentes identificaram oportunidades</li>
      <li>Planilhas diárias foram enviadas para outros lojistas</li>
    </ul>

    <p style="color:#4a4a57;font-size:12px;text-align:center;margin:0;">
      Dúvidas? <a href="https://wa.me/${WPP}" style="color:#7c5cfc;text-decoration:none;">Fale com o suporte</a>
    </p>
  `)
}
