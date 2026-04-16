import fs from 'fs'

const API_URL = 'https://evolution-api-production-cbb2.up.railway.app'
const API_KEY = '5da2aeba851c0468bd86661286cc378fe37e628c8c936d149e3712f69109c9d4'

async function getQR() {
  // Primeiro deleta instância se existir
  await fetch(`${API_URL}/instance/delete/luvymetrics`, {
    method: 'DELETE',
    headers: { 'apikey': API_KEY }
  }).catch(() => {})

  await new Promise(r => setTimeout(r, 1000))

  // Cria instância nova
  const criar = await fetch(`${API_URL}/instance/create`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'apikey': API_KEY
    },
    body: JSON.stringify({
      instanceName: 'luvymetrics',
      qrcode: true,
      integration: 'WHATSAPP-BAILEYS'
    })
  })

  const criarData = await criar.json()
  console.log('Criou:', JSON.stringify(criarData).substring(0, 200))

  // Pega QR do response de criação
  const qrBase64 = criarData?.qrcode?.base64 ||
                   criarData?.base64 ||
                   criarData?.qr?.base64

  if (qrBase64) {
    const src = qrBase64.startsWith('data:')
      ? qrBase64
      : `data:image/png;base64,${qrBase64}`

    fs.writeFileSync('qrcode.html',
      `<!DOCTYPE html>
      <html>
      <body style="background:#fff;display:flex;
        flex-direction:column;align-items:center;
        justify-content:center;min-height:100vh;
        font-family:sans-serif">
        <h2>Escaneie com o WhatsApp</h2>
        <p>WhatsApp > Dispositivos conectados > Conectar</p>
        <img src="${src}" style="width:256px;height:256px"/>
      </body>
      </html>`
    )
    console.log('✅ Abra qrcode.html no navegador agora!')
    return
  }

  // Tenta buscar QR separado
  await new Promise(r => setTimeout(r, 2000))

  const connect = await fetch(
    `${API_URL}/instance/connect/luvymetrics`,
    { headers: { 'apikey': API_KEY } }
  )
  const connectData = await connect.json()
  console.log('Connect data:', JSON.stringify(connectData).substring(0, 300))

  const qr2 = connectData?.base64 ||
               connectData?.qrcode?.base64 ||
               connectData?.code

  if (qr2) {
    const src = qr2.startsWith('data:')
      ? qr2
      : `data:image/png;base64,${qr2}`

    fs.writeFileSync('qrcode.html',
      `<!DOCTYPE html>
      <html>
      <body style="background:#fff;display:flex;
        flex-direction:column;align-items:center;
        justify-content:center;min-height:100vh;
        font-family:sans-serif">
        <h2>Escaneie com o WhatsApp</h2>
        <p>WhatsApp > Dispositivos conectados > Conectar</p>
        <img src="${src}" style="width:256px;height:256px"/>
      </body>
      </html>`
    )
    console.log('✅ Abra qrcode.html no navegador agora!')
  } else {
    console.log('❌ QR não encontrado')
    console.log('Resposta completa:', JSON.stringify(connectData))
  }
}

getQR().catch(console.error)
