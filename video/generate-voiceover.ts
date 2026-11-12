/**
 * Gera a narração de cada cena com a ElevenLabs e grava:
 *   public/voz/<cena>.mp3  e  src/voz.json (duração e tempo de cada palavra, para a legenda)
 *
 * Uso:  node --strip-types generate-voiceover.ts            (gera tudo)
 *       node --strip-types generate-voiceover.ts --vozes    (lista as vozes da sua conta)
 * A chave fica em video/.env:  ELEVENLABS_API_KEY=...
 * Voz opcional:               ELEVENLABS_VOICE_ID=...
 */
import { existsSync, mkdirSync, readFileSync, writeFileSync } from 'node:fs'
import { CENAS } from './src/roteiro.ts'

// lê o .env sem dependência externa
if (existsSync('.env')) {
  for (const linha of readFileSync('.env', 'utf8').split(/\r?\n/)) {
    const m = linha.match(/^\s*([A-Z_]+)\s*=\s*(.*)\s*$/)
    if (m && !process.env[m[1]]) process.env[m[1]] = m[2].replace(/^["']|["']$/g, '')
  }
}
const CHAVE = process.env.ELEVENLABS_API_KEY
if (!CHAVE) { console.error('Falta ELEVENLABS_API_KEY no arquivo video/.env'); process.exit(1) }

if (process.argv.includes('--vozes')) {
  const r = await fetch('https://api.elevenlabs.io/v1/voices', { headers: { 'xi-api-key': CHAVE } })
  const j = await r.json() as { voices: { voice_id: string; name: string; labels?: Record<string, string> }[] }
  for (const v of j.voices) console.log(`${v.name.padEnd(28)} ${JSON.stringify(v.labels ?? {})}  ${v.voice_id}`)
  process.exit(0)
}

// voz padrão: uma voz pré-pronta multilíngue (troque por uma de sotaque brasileiro em ELEVENLABS_VOICE_ID)
const VOZ = process.env.ELEVENLABS_VOICE_ID || 'pNInz6obpgDQGcFmaJgB'

type Alinhamento = { characters: string[]; character_start_times_seconds: number[]; character_end_times_seconds: number[] }
const saida: Record<string, { duracao: number; palavras: { p: string; ini: number; fim: number }[] }> = {}
mkdirSync('public/voz', { recursive: true })

for (const cena of CENAS) {
  const r = await fetch(`https://api.elevenlabs.io/v1/text-to-speech/${VOZ}/with-timestamps?output_format=mp3_44100_128`, {
    method: 'POST',
    headers: { 'xi-api-key': CHAVE, 'Content-Type': 'application/json' },
    body: JSON.stringify({
      text: cena.fala,
      model_id: 'eleven_multilingual_v2',
      language_code: 'pt',
      voice_settings: { stability: 0.45, similarity_boost: 0.8, style: 0.35, use_speaker_boost: true },
    }),
  })
  if (!r.ok) { console.error(`Erro na cena ${cena.id}: ${r.status} ${await r.text()}`); process.exit(1) }
  const j = await r.json() as { audio_base64: string; alignment: Alinhamento }
  writeFileSync(`public/voz/${cena.id}.mp3`, Buffer.from(j.audio_base64, 'base64'))

  // agrupa os caracteres em palavras, com início e fim
  const a = j.alignment
  const palavras: { p: string; ini: number; fim: number }[] = []
  let atual = '', ini = 0
  a.characters.forEach((ch, i) => {
    if (/\s/.test(ch)) { if (atual) palavras.push({ p: atual, ini, fim: a.character_end_times_seconds[i - 1] }); atual = ''; return }
    if (!atual) ini = a.character_start_times_seconds[i]
    atual += ch
  })
  if (atual) palavras.push({ p: atual, ini, fim: a.character_end_times_seconds.at(-1)! })
  saida[cena.id] = { duracao: a.character_end_times_seconds.at(-1)!, palavras }
  console.log(`✓ ${cena.id}  ${saida[cena.id].duracao.toFixed(2)} s`)
}

writeFileSync('src/voz.json', JSON.stringify(saida, null, 2))
console.log('Pronto: public/voz/*.mp3 e src/voz.json')
