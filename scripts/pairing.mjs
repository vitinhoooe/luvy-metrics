import fs from 'fs'

const API_URL = 'https://evolution-api-production-cbb2.up.railway.app'
const API_KEY = '5da2aeba851c0468bd86661286cc378fe37e628c8c936d149e3712f69109c9d4'
const NUMERO = process.argv[2]

async function pairingCode() {
  if (!NUMERO) {
    console.log('Use: node scripts/pairing.mjs 5521999999999')
    return
  }

  // Deleta instância anterior
  await fetch(`${API_URL}/instance/delete/luvymetrics`, {
    method: 'DELETE',
    headers: { 'apikey': API_KEY }
  }).catch(() => {})

  await new Promise(r => setTimeout(r, 1000))

  // Cria instância com pairing code
  const res = await fetch(`${API_URL}/instance/create`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'apikey': API_KEY
    },
    body: JSON.stringify({
      instanceName: 'luvymetrics',
      qrcode: false,
      integration: 'WHATSAPP-BAILEYS'
    })
  })

  const data = await res.json()
  console.log('Instância:', JSON.stringify(data).substring(0, 200))

  await new Promise(r => setTimeout(r, 2000))

  // Pede pairing code
  const res2 = await fetch(
    `${API_URL}/instance/pairingCode/luvymetrics`,
    {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'apikey': API_KEY
      },
      body: JSON.stringify({ number: NUMERO })
    }
  )

  const code = await res2.json()
  console.log('=== PAIRING CODE ===')
  console.log(JSON.stringify(code, null, 2))
  console.log('====================')
}

pairingCode().catch(console.error)
