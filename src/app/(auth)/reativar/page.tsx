export default function ReativarPage() {
  return (
    <div style={{
      minHeight: '100vh', background: '#08060d',
      display: 'flex', alignItems: 'center', justifyContent: 'center',
      fontFamily: "'Plus Jakarta Sans', sans-serif", padding: '24px'
    }}>
      <link href="https://fonts.googleapis.com/css2?family=Plus+Jakarta+Sans:wght@400;500;600;700;800&display=swap" rel="stylesheet" />
      <div style={{ width: '100%', maxWidth: '420px', textAlign: 'center' }}>
        <div style={{ fontSize: '64px', marginBottom: '24px' }}>🔒</div>
        <h1 style={{ fontSize: '24px', fontWeight: '800', color: '#f5f0ff', margin: '0 0 12px' }}>
          Acesso cancelado
        </h1>
        <p style={{ color: '#9d8faa', fontSize: '15px', lineHeight: 1.7, margin: '0 0 32px' }}>
          Sua assinatura foi cancelada. Para continuar acessando o LuvyMetrics com todos os dados de tendências, reative sua conta abaixo.
        </p>
        <a href="https://pay.cakto.com.br/wanxtpo" style={{
          display: 'inline-block', padding: '16px 36px',
          background: 'linear-gradient(135deg, #c840e0, #9333ea)',
          borderRadius: '10px', color: '#fff', fontSize: '16px',
          fontWeight: '700', textDecoration: 'none',
        }}>
          Reativar minha conta →
        </a>
        <p style={{ color: '#6d6079', fontSize: '13px', marginTop: '24px' }}>
          <a href="/login" style={{ color: '#9d8faa', textDecoration: 'none' }}>← Voltar para o login</a>
        </p>
      </div>
    </div>
  )
}
