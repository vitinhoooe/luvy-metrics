export default function BotPage() {
  return (
    <div style={{
      display: 'flex', flexDirection: 'column',
      alignItems: 'center', justifyContent: 'center',
      minHeight: '60vh', textAlign: 'center', gap: '16px'
    }}>
      <div style={{ fontSize: '64px' }}>📱</div>
      <h1 style={{ fontSize: '24px', fontWeight: '800', color: '#111827' }}>
        Alertas no WhatsApp
      </h1>
      <p style={{ fontSize: '16px', color: '#6b7280', maxWidth: '400px', lineHeight: '1.7' }}>
        Você receberá tendências diárias, alertas de
        oportunidade e resumo semanal diretamente
        no seu WhatsApp — sem precisar abrir o sistema.
      </p>
      <p style={{ fontSize: '14px', color: '#9ca3af' }}>
        Configure seu número em Configurações para
        começar a receber os alertas.
      </p>
      <a href="/configuracoes" style={{
        background: '#7c3aed', color: '#fff',
        padding: '12px 24px', borderRadius: '8px',
        textDecoration: 'none', fontWeight: '600',
        fontSize: '14px'
      }}>
        Configurar WhatsApp →
      </a>
    </div>
  )
}
