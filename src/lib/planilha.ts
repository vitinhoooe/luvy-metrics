// Lê Excel/CSV no navegador. CSV é lido como texto (para "49,80" e "02/10/2026" no padrão brasileiro)
// e com tabela de acentos, porque o Excel no Windows exporta CSV em Latin-1.
export async function lerPlanilha(f: File, opcoes: { datas?: boolean } = {}) {
  const XLSX = await import('xlsx')
  const csv = /\.csv$/i.test(f.name)
  let codepage: number | undefined
  if (csv) {
    const cp = await import('xlsx/dist/cpexcel')
    XLSX.set_cptable(cp)
    const bytes = new Uint8Array(await f.slice(0, 65536).arrayBuffer())
    // UTF-8 válido? senão, Windows-1252 (Latin-1 do Excel brasileiro)
    try { new TextDecoder('utf-8', { fatal: true }).decode(bytes); codepage = 65001 } catch { codepage = 1252 }
  }
  const wb = XLSX.read(await f.arrayBuffer(), { type: 'array', codepage, cellDates: !!opcoes.datas, raw: csv })
  return XLSX.utils.sheet_to_json<unknown[]>(wb.Sheets[wb.SheetNames[0]], { header: 1, raw: true, defval: null, blankrows: false })
}
