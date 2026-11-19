import Link from 'next/link'

export function AbasFornecedores({ base, aba, meus }: { base: string; aba: 'meus' | 'diretorio'; meus: number }) {
  return (
    <div className="lv-chips lv-abas" style={{ marginBottom: 14 }}>
      <Link href={`${base}?aba=meus`} className={`lv-chip${aba === 'meus' ? ' on' : ''}`}>Meus fornecedores{meus > 0 && <em>{meus}</em>}</Link>
      <Link href={`${base}?aba=diretorio`} className={`lv-chip${aba === 'diretorio' ? ' on' : ''}`}>Diretório do nicho</Link>
    </div>
  )
}
