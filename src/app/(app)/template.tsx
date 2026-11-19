// re-monta a cada troca de tela: dá a entrada suave do conteúdo
export default function Template({ children }: { children: React.ReactNode }) {
  return <div className="lv-entra">{children}</div>
}
