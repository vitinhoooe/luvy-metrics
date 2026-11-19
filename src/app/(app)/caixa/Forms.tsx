'use client'
import { useActionState, useState } from 'react'
import { Enviar, Mensagem } from '@/components/Enviar'
import { brl, paraNumero } from '@/lib/formato'
import { abrirCaixa, fecharCaixa } from './acoes'

export function FormAbrir({ podeEditar }: { podeEditar: boolean }) {
  const [estado, acao] = useActionState(abrirCaixa, null)
  return (
    <form action={acao} className="lv-form" style={{ maxWidth: 360 }}>
      <div className="lv-campo">
        <label htmlFor="troco">Dinheiro na gaveta para troco (R$)</label>
        <input id="troco" name="troco" className="lv-input grande mono" inputMode="decimal" placeholder="0,00" disabled={!podeEditar} />
      </div>
      <Mensagem estado={estado} />
      <div><Enviar className="lv-btn grande" enviando="Abrindo…" disabled={!podeEditar}>Abrir caixa</Enviar></div>
    </form>
  )
}

export function FormFechar({ id, esperado, podeEditar }: { id: string; esperado: number; podeEditar: boolean }) {
  const [estado, acao] = useActionState(fecharCaixa, null)
  const [contado, setContado] = useState('')
  const c = paraNumero(contado)
  const dif = c === null ? null : c - esperado
  return (
    <form action={acao} className="lv-form">
      <input type="hidden" name="id" value={id} />
      <div className="lv-campo">
        <label htmlFor="contado">Quanto tem de dinheiro na gaveta agora? (R$)</label>
        <input id="contado" name="contado" className="lv-input grande mono" inputMode="decimal" value={contado} onChange={(e) => setContado(e.target.value)} placeholder="0,00" disabled={!podeEditar} />
        {dif !== null && (
          <small style={{ color: Math.abs(dif) < 0.01 ? 'var(--ok)' : 'var(--err)', fontWeight: 600, fontSize: 14 }}>
            {Math.abs(dif) < 0.01 ? 'Bateu certinho ✓' : dif > 0 ? `Sobrando ${brl(dif)}` : `Faltando ${brl(-dif)}`}
          </small>
        )}
      </div>
      <div className="lv-campo">
        <label htmlFor="observacao">Observação</label>
        <input id="observacao" name="observacao" className="lv-input" maxLength={200} placeholder="Opcional" disabled={!podeEditar} />
      </div>
      <Mensagem estado={estado} />
      <div><Enviar className="lv-btn" enviando="Fechando…" disabled={!podeEditar}>Fechar caixa</Enviar></div>
    </form>
  )
}
