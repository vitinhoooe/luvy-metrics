import fs from 'fs'

const API_URL = 'https://evolution-api-production-cbb2.up.railway.app'
const API_KEY = '5da2aeba851c0468bd86661286cc378fe37e628c8c936d149e3712f69109c9d4'

async function setup() {
  console.log('Criando instância...')

  const res = await fetch(`${API_URL}/instance/create`, {
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

  const data = await res.json()
  console.log('Resposta:', JSON.stringify(data, null, 2))

  // Aguarda 2 segundos
  await new Promise(r => setTimeout(r, 2000))

  console.log('Buscando QR code...')

  const res2 = await fetch(`${API_URL}/instance/connect/luvymetrics`, {
    headers: { 'apikey': API_KEY }
  })

  const qr = await res2.json()
  console.log('QR Data:', JSON.stringify(qr, null, 2))

  // Salva QR code como HTML para visualizar
  const base64 = qr?.base64 || qr?.qrcode?.base64 || qr?.code

  if (base64 && base64.startsWith('data:')) {
    const html = `<html><body style="display:flex;align-items:center;justify-content:center;height:100vh;background:#000">
      <img src="${base64}" style="width:300px;height:300px"/>
    </body></html>`
    fs.writeFileSync('qrcode.html', html)
    console.log('✅ QR Code salvo! Abra qrcode.html no navegador')
  } else if (base64) {
    const html = `<html><body style="display:flex;align-items:center;justify-content:center;height:100vh;background:#000">
      <img src="data:image/png;base64,${base64}" style="width:300px;height:300px"/>
    </body></html>`
    fs.writeFileSync('qrcode.html', html)
    console.log('✅ QR Code salvo! Abra qrcode.html no navegador')
  } else {
    console.log('❌ QR code não encontrado na resposta')
  }
}

setup().catch(console.error)
