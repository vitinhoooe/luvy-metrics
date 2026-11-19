import { Composition, Folder } from 'remotion'
import { CenaAbas, CenaAlerta, CenaCaos, CenaCompara, CenaCta, CenaPreco, CenaRanking, CenaUmaTela } from './cenas'
import { LuvyVideo, duracaoTotal } from './LuvyVideo'
import { LOOP, LogoLoop } from './LogoLoop'
import { FPS } from './roteiro'
import { quadrosCena } from './ui'
import { ProdutoLuvy } from './produto/ProdutoLuvy'
import { DURACAO, FPS as FPS_PRODUTO } from './produto/sistema'

const CENAS_COMP: [string, React.FC][] = [
  ['abas', CenaAbas], ['caos', CenaCaos], ['umaTela', CenaUmaTela], ['ranking', CenaRanking],
  ['preco', CenaPreco], ['compara', CenaCompara], ['alerta', CenaAlerta], ['cta', CenaCta],
]

export const RemotionRoot: React.FC = () => (
  <>
    <Composition id="ProdutoLuvy" component={ProdutoLuvy} durationInFrames={DURACAO} fps={FPS_PRODUTO} width={1920} height={1080} />
    <Composition id="LuvyMetrics" component={LuvyVideo} durationInFrames={duracaoTotal()} fps={FPS} width={1920} height={1080} />
    <Composition id="LogoLoop" component={LogoLoop} durationInFrames={LOOP} fps={30} width={900} height={900} />
    <Folder name="Cenas">
      {CENAS_COMP.map(([id, C]) => (
        <Composition key={id} id={`Cena-${id}`} component={C} durationInFrames={quadrosCena(id)} fps={FPS} width={1920} height={1080} />
      ))}
    </Folder>
  </>
)
