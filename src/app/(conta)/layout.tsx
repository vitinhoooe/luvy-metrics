import Link from 'next/link'
import { Logotipo } from '@/components/Marca'
import { LadoConta } from './LadoConta'
import '../app.css'

export default function ContaLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="lv">
      <div className="lv-conta v2">
        <main className="lv-conta-form">
          <Link href="/" className="lv-brand lv-conta-marca" aria-label="LuvyMetrics, início"><Logotipo tom="escuro" animar /></Link>
          <div className="lv-conta-caixa">{children}</div>
          <p className="lv-conta-pe">Ao continuar, você confirma ter 18 anos ou mais. · <Link href="/">luvymetrics.com.br</Link></p>
        </main>
        <LadoConta />
      </div>
    </div>
  )
}
