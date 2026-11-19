// Renderiza quadros-chave do ProdutoLuvy para conferência: node quadros.mjs 60 240 ...
import { bundle } from '@remotion/bundler'
import { renderStill, selectComposition } from '@remotion/renderer'
import path from 'node:path'
const frames = process.argv.slice(2).map(Number)
const serveUrl = await bundle({ entryPoint: path.resolve('src/index.ts') })
const composition = await selectComposition({ serveUrl, id: 'ProdutoLuvy', port: 3123 })
for (const frame of frames) {
  await renderStill({ serveUrl, composition, frame, output: `out/produto/q${String(frame).padStart(4, '0')}.jpg`, imageFormat: 'jpeg', jpegQuality: 80, scale: 0.5, port: 3123 })
  console.log('ok', frame)
}
