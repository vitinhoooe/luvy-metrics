export default function AssinarPage() {
  return (
    <div style={{
      minHeight: '100vh', background: '#08060d',
      display: 'flex', alignItems: 'center', justifyContent: 'center',
      fontFamily: "'Plus Jakarta Sans', sans-serif", padding: '24px'
    }}>
      <link href="https://fonts.googleapis.com/css2?family=Plus+Jakarta+Sans:wght@400;500;600;700;800&display=swap" rel="stylesheet" />
      <div style={{ width: '100%', maxWidth: '420px', textAlign: 'center' }}>
        <div style={{ fontSize: '64px', marginBottom: '24px' }}>⏳</div>
        <h1 style={{ fontSize: '24px', fontWeight: '800', color: '#f5f0ff', margin: '0 0 12px' }}>
          Período de teste encerrado
        </h1>
        <p style={{ color: '#9d8faa', fontSize: '15px', lineHeight: 1.7, margin: '0 0 16px' }}>
          Seus 7 dias de teste gratuito acabaram. Assine agora para continuar acessando todas as tendências e ferramentas do LuvyMetrics.
        </p>
        <div style={{
          background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(200,64,224,0.2)',
          borderRadius: '12px', padding: '20px', margin: '0 0 24px',
        }}>
          <p style={{ color: '#c840e0', fontSize: '28px', fontWeight: '800', margin: '0 0 4px' }}>R$97<span style={{ fontSize: '16px', fontWeight: '500' }}>/mês</span></p>
          <p style={{ color: '#9d8faa', fontSize: '13px', margin: 0 }}>Acesso completo a todas as funcionalidades</p>
        </div>
        <a href="https://pay.cakto.com.br/wanxtpo" style={{
          display: 'inline-block', padding: '16px 36px',
          background: 'linear-gradient(135deg, #c840e0, #9333ea)',
          borderRadius: '10px', color: '#fff', fontSize: '16px',
          fontWeight: '700', textDecoration: 'none',
        }}>
          Assinar agora →
        </a>
        <p style={{ color: '#6d6079', fontSize: '13px', marginTop: '24px' }}>
          <a href="/login" style={{ color: '#9d8faa', textDecoration: 'none' }}>← Voltar para o login</a>
        </p>
      </div>
    </div>
  )
}
