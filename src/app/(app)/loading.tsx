import { Marca } from '@/components/Marca'

// aparece entre uma tela e outra enquanto os dados carregam
export default function Carregando() {
  return (
    <div className="lv-carregando" role="status" aria-label="Carregando">
      <Marca size={56} tom="escuro" animar />
    </div>
  )
}
