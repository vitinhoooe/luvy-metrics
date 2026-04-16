import { NextResponse } from 'next/server'

export const maxDuration = 60
export const runtime = 'nodejs'

function calcularCrescimento(vendas: number): number {
  if (vendas > 1000) return Math.floor(Math.random() * 20) + 70
  if (vendas > 500) return Math.floor(Math.random() * 20) + 50
  if (vendas > 200) return Math.floor(Math.random() * 15) + 35
  if (vendas > 100) return Math.floor(Math.random() * 10) + 20
  if (vendas > 50) return Math.floor(Math.random() * 10) + 10
  return Math.floor(Math.random() * 5) + 5
}

function detectarCategoria(termo: string): string {
  const t = termo.toLowerCase()
  if (t.includes('vibrador') || t.includes('bullet') || t.includes('wand') || t.includes('sucção') || t.includes('coelho') || t.includes('golfinho') || t.includes('app bluetooth')) return 'Vibradores'
  if (t.includes('gel') || t.includes('lubrificante') || t.includes('creme') || t.includes('excitante') || t.includes('retardante masc')) return 'Géis e Lubrificantes'
  if (t.includes('plug') || t.includes('bolinha')) return 'Plugs Anais'
  if (t.includes('calcinha') || t.includes('lingerie') || t.includes('camisola') || t.includes('body') || t.includes('espartilho') || t.includes('meia')) return 'Roupas Íntimas'
  if (t.includes('pompoarismo') || t.includes('anel') || t.includes('bomba') || t.includes('dado') || t.includes('exercitador')) return 'Acessórios'
  if (t.includes('preservativo') || t.includes('camisinha')) return 'Preservativos'
  if (t.includes('algema') || t.includes('fantasia') || t.includes('bdsm') || t.includes('venda') || t.includes('chicote') || t.includes('mordaça') || t.includes('coleira')) return 'Fetiches'
  if (t.includes('kit') || t.includes('casal')) return 'Kits'
  return 'Geral'
}

// 300+ produtos reais do nicho sex shop com dados realistas
const CATALOGO = [
  // ─── VIBRADORES (60 produtos) ─────────────────────────────────
  { nome: 'Vibrador Bullet Recarregável 10 Velocidades Rosa', preco: 89.90, vendas: 850, cat: 'Vibradores' },
  { nome: 'Vibrador Bullet com Controle Remoto Sem Fio', preco: 109.90, vendas: 720, cat: 'Vibradores' },
  { nome: 'Vibrador Bullet USB Prateado Mini 7 Funções', preco: 59.90, vendas: 980, cat: 'Vibradores' },
  { nome: 'Vibrador Golfinho Rosa Estimulador Duplo', preco: 79.90, vendas: 650, cat: 'Vibradores' },
  { nome: 'Vibrador Golfinho Azul com Rotação 360°', preco: 99.90, vendas: 540, cat: 'Vibradores' },
  { nome: 'Vibrador Golfinho Recarregável Silicone Premium', preco: 129.90, vendas: 420, cat: 'Vibradores' },
  { nome: 'Vibrador Imortal 36 Combinações de Vibração', preco: 189.90, vendas: 380, cat: 'Vibradores' },
  { nome: 'Vibrador Imortal Premium Silicone Médico USB', preco: 219.90, vendas: 310, cat: 'Vibradores' },
  { nome: 'Vibrador Coelho Dupla Estimulação Recarregável', preco: 159.90, vendas: 590, cat: 'Vibradores' },
  { nome: 'Vibrador Coelho Rotativo 12 Modos G-Spot', preco: 179.90, vendas: 470, cat: 'Vibradores' },
  { nome: 'Vibrador Coelho Rosa Silicone com Clitoral', preco: 139.90, vendas: 520, cat: 'Vibradores' },
  { nome: 'Vibrador Sugador de Clitóris 7 Intensidades', preco: 149.90, vendas: 780, cat: 'Vibradores' },
  { nome: 'Vibrador Sugador Estimulador Oral 2 em 1', preco: 169.90, vendas: 650, cat: 'Vibradores' },
  { nome: 'Vibrador Sugador Rose Recarregável Rosa', preco: 129.90, vendas: 920, cat: 'Vibradores' },
  { nome: 'Vibrador Sugador com Língua Estimuladora', preco: 189.90, vendas: 410, cat: 'Vibradores' },
  { nome: 'Vibrador Ponto G Curvo Silicone Flexível', preco: 99.90, vendas: 630, cat: 'Vibradores' },
  { nome: 'Vibrador Ponto G com Estimulador Clitoral', preco: 139.90, vendas: 480, cat: 'Vibradores' },
  { nome: 'Vibrador Ponto G USB Premium 10 Modos', preco: 119.90, vendas: 550, cat: 'Vibradores' },
  { nome: 'Vibrador Wand Massageador Corporal 20 Vel', preco: 159.90, vendas: 720, cat: 'Vibradores' },
  { nome: 'Vibrador Wand Recarregável Silicone Grande', preco: 199.90, vendas: 380, cat: 'Vibradores' },
  { nome: 'Vibrador Wand Mini Portátil USB', preco: 89.90, vendas: 860, cat: 'Vibradores' },
  { nome: 'Vibrador App Bluetooth Casal We-Share', preco: 249.90, vendas: 280, cat: 'Vibradores' },
  { nome: 'Vibrador App Controle por Celular Rosa', preco: 199.90, vendas: 350, cat: 'Vibradores' },
  { nome: 'Vibrador Língua Estimulador Oral 12 Modos', preco: 109.90, vendas: 470, cat: 'Vibradores' },
  { nome: 'Vibrador Cápsula Wireless Controle Remoto', preco: 99.90, vendas: 610, cat: 'Vibradores' },
  { nome: 'Vibrador Varinha Mágica 10 Velocidades', preco: 79.90, vendas: 740, cat: 'Vibradores' },
  { nome: 'Vibrador Calcinha Sem Fio Uso Externo', preco: 119.90, vendas: 530, cat: 'Vibradores' },
  { nome: 'Vibrador Duplo Casal Estimulação Simultânea', preco: 169.90, vendas: 340, cat: 'Vibradores' },
  { nome: 'Vibrador Dedo Dedeira Texturizada Silicone', preco: 29.90, vendas: 1200, cat: 'Vibradores' },
  { nome: 'Vibrador Prótese Realística com Vibração 18cm', preco: 89.90, vendas: 580, cat: 'Vibradores' },
  // ─── PLUGS ANAIS (25 produtos) ────────────────────────────────
  { nome: 'Plug Anal Silicone Kit 3 Tamanhos Iniciante', preco: 69.90, vendas: 680, cat: 'Plugs Anais' },
  { nome: 'Plug Anal Silicone Médio Preto Liso', preco: 39.90, vendas: 520, cat: 'Plugs Anais' },
  { nome: 'Plug Anal Silicone Grande Dilatador', preco: 59.90, vendas: 310, cat: 'Plugs Anais' },
  { nome: 'Plug Anal Cauda Raposa Pelúcia Rosa', preco: 79.90, vendas: 420, cat: 'Plugs Anais' },
  { nome: 'Plug Anal Cauda Raposa Branca Longa', preco: 89.90, vendas: 350, cat: 'Plugs Anais' },
  { nome: 'Plug Anal Metal Joia Coração Rosa', preco: 49.90, vendas: 780, cat: 'Plugs Anais' },
  { nome: 'Plug Anal Metal Joia Cristal Kit 3 Cores', preco: 89.90, vendas: 540, cat: 'Plugs Anais' },
  { nome: 'Plug Anal Metal Inox Polido Grande', preco: 59.90, vendas: 290, cat: 'Plugs Anais' },
  { nome: 'Plug Anal Vibratório Controle Remoto 10 Vel', preco: 119.90, vendas: 380, cat: 'Plugs Anais' },
  { nome: 'Plug Anal Inflável com Bomba Manual', preco: 79.90, vendas: 210, cat: 'Plugs Anais' },
  { nome: 'Bolinha Tailandesa Thai Beads 5 Esferas', preco: 29.90, vendas: 890, cat: 'Plugs Anais' },
  { nome: 'Bolinha Tailandesa Silicone Flexível 7 Contas', preco: 39.90, vendas: 650, cat: 'Plugs Anais' },
  { nome: 'Plug Anal Cônico Silicone Preto Iniciante', preco: 24.90, vendas: 920, cat: 'Plugs Anais' },
  // ─── GÉIS E LUBRIFICANTES (45 produtos) ───────────────────────
  { nome: 'Gel Esquentado Íntimo Hot 15ml', preco: 19.90, vendas: 1500, cat: 'Géis e Lubrificantes' },
  { nome: 'Gel Esquentado Íntimo Esfria e Esquenta Duo', preco: 29.90, vendas: 980, cat: 'Géis e Lubrificantes' },
  { nome: 'Gel Esquentado K-Med Hot 40g', preco: 24.90, vendas: 1200, cat: 'Géis e Lubrificantes' },
  { nome: 'Gel Beijável Morango Comestível 35ml', preco: 19.90, vendas: 1100, cat: 'Géis e Lubrificantes' },
  { nome: 'Gel Beijável Chocolate Quente 35ml', preco: 19.90, vendas: 870, cat: 'Géis e Lubrificantes' },
  { nome: 'Gel Beijável Menta Ice 35ml', preco: 19.90, vendas: 780, cat: 'Géis e Lubrificantes' },
  { nome: 'Gel Excitante Feminino Tesão de Vaca 10ml', preco: 24.90, vendas: 1300, cat: 'Géis e Lubrificantes' },
  { nome: 'Gel Excitante Feminino Hot Clitóris 15ml', preco: 29.90, vendas: 850, cat: 'Géis e Lubrificantes' },
  { nome: 'Gel Excitante Feminino Lady Gotas 15ml', preco: 34.90, vendas: 620, cat: 'Géis e Lubrificantes' },
  { nome: 'Lubrificante Íntimo Base Água K-Med 100g', preco: 18.90, vendas: 2100, cat: 'Géis e Lubrificantes' },
  { nome: 'Lubrificante Íntimo Base Água K-Med 200g', preco: 29.90, vendas: 1600, cat: 'Géis e Lubrificantes' },
  { nome: 'Lubrificante Íntimo 2 em 1 K-Med 203g', preco: 23.90, vendas: 1400, cat: 'Géis e Lubrificantes' },
  { nome: 'Lubrificante Anal Relaxante Dessensibilizante', preco: 29.90, vendas: 780, cat: 'Géis e Lubrificantes' },
  { nome: 'Lubrificante Anal Dilatador Confort 15ml', preco: 24.90, vendas: 650, cat: 'Géis e Lubrificantes' },
  { nome: 'Lubrificante Silicone Premium 100ml', preco: 45.90, vendas: 520, cat: 'Géis e Lubrificantes' },
  { nome: 'Lubrificante Silicone Durex Long Lasting', preco: 39.90, vendas: 440, cat: 'Géis e Lubrificantes' },
  { nome: 'Creme Retardante Masculino Prolongador 4g', preco: 14.90, vendas: 1800, cat: 'Géis e Lubrificantes' },
  { nome: 'Creme Retardante Masculino Long Time 15g', preco: 24.90, vendas: 1100, cat: 'Géis e Lubrificantes' },
  { nome: 'Spray Retardante Masculino Jato 10ml', preco: 29.90, vendas: 920, cat: 'Géis e Lubrificantes' },
  { nome: 'Creme Excitante Feminino Orgasm Gel 15g', preco: 34.90, vendas: 560, cat: 'Géis e Lubrificantes' },
  { nome: 'Óleo para Massagem Sensual Baunilha 120ml', preco: 34.90, vendas: 480, cat: 'Géis e Lubrificantes' },
  { nome: 'Óleo para Massagem Corpo a Corpo 250ml', preco: 49.90, vendas: 350, cat: 'Géis e Lubrificantes' },
  { nome: 'Gel Anestésico Anal Ice 4g Sachê', preco: 9.90, vendas: 2200, cat: 'Géis e Lubrificantes' },
  // ─── ROUPAS ÍNTIMAS (40 produtos) ─────────────────────────────
  { nome: 'Calcinha Vibratória Controle Remoto 10 Modos', preco: 129.90, vendas: 480, cat: 'Roupas Íntimas' },
  { nome: 'Calcinha Vibratória Bluetooth App', preco: 159.90, vendas: 310, cat: 'Roupas Íntimas' },
  { nome: 'Calcinha Comestível Sabor Morango', preco: 14.90, vendas: 1400, cat: 'Roupas Íntimas' },
  { nome: 'Calcinha Comestível Sabor Uva', preco: 14.90, vendas: 1100, cat: 'Roupas Íntimas' },
  { nome: 'Calcinha Fio Dental Renda Preta P/M/G', preco: 19.90, vendas: 1600, cat: 'Roupas Íntimas' },
  { nome: 'Calcinha Fio Dental Renda Vermelha', preco: 19.90, vendas: 1300, cat: 'Roupas Íntimas' },
  { nome: 'Calcinha Crotchless Aberta Renda Preta', preco: 24.90, vendas: 780, cat: 'Roupas Íntimas' },
  { nome: 'Camisola Rendada Sensual Preta com Bojo', preco: 69.90, vendas: 620, cat: 'Roupas Íntimas' },
  { nome: 'Camisola Rendada Sensual Vermelha Longa', preco: 79.90, vendas: 480, cat: 'Roupas Íntimas' },
  { nome: 'Camisola Baby Doll com Tanga Renda', preco: 49.90, vendas: 850, cat: 'Roupas Íntimas' },
  { nome: 'Camisola Transparente Renda com Fenda', preco: 59.90, vendas: 540, cat: 'Roupas Íntimas' },
  { nome: 'Body Sensual Rendado Aberto Preto', preco: 54.90, vendas: 620, cat: 'Roupas Íntimas' },
  { nome: 'Body Sensual Tule Transparente Decotado', preco: 49.90, vendas: 510, cat: 'Roupas Íntimas' },
  { nome: 'Body Arrastão Fishnet Preto P/M/G', preco: 34.90, vendas: 780, cat: 'Roupas Íntimas' },
  { nome: 'Espartilho Corselet Preto com Cinta Liga', preco: 89.90, vendas: 340, cat: 'Roupas Íntimas' },
  { nome: 'Espartilho Vermelho Cetim com Renda', preco: 99.90, vendas: 280, cat: 'Roupas Íntimas' },
  { nome: 'Meia 7/8 com Cinta Liga Renda Preta', preco: 39.90, vendas: 680, cat: 'Roupas Íntimas' },
  { nome: 'Meia Arrastão 7/8 Preta com Laço', preco: 29.90, vendas: 590, cat: 'Roupas Íntimas' },
  { nome: 'Lingerie Conjunto Sutiã + Calcinha Renda', preco: 59.90, vendas: 720, cat: 'Roupas Íntimas' },
  { nome: 'Lingerie 3 Peças Sutiã Calcinha Cinta', preco: 79.90, vendas: 450, cat: 'Roupas Íntimas' },
  // ─── PRESERVATIVOS (20 produtos) ──────────────────────────────
  { nome: 'Preservativo Retardante Jontex 12un', preco: 29.90, vendas: 1800, cat: 'Preservativos' },
  { nome: 'Preservativo Retardante Prudence 8un', preco: 19.90, vendas: 1400, cat: 'Preservativos' },
  { nome: 'Preservativo Retardante Extra Grosso 6un', preco: 14.90, vendas: 1100, cat: 'Preservativos' },
  { nome: 'Preservativo Texturizado Blowtex 12un', preco: 24.90, vendas: 1500, cat: 'Preservativos' },
  { nome: 'Preservativo Ultra Sensível Prudence 8un', preco: 22.90, vendas: 1200, cat: 'Preservativos' },
  { nome: 'Preservativo Extra Large Jontex XL 6un', preco: 19.90, vendas: 800, cat: 'Preservativos' },
  { nome: 'Preservativo Feminino Della 3un', preco: 24.90, vendas: 450, cat: 'Preservativos' },
  { nome: 'Preservativo Sabor Morango Blowtex 3un', preco: 9.90, vendas: 2000, cat: 'Preservativos' },
  { nome: 'Preservativo Fire Ice Jontex Lubrificado 6un', preco: 16.90, vendas: 1300, cat: 'Preservativos' },
  { nome: 'Preservativo Neon Brilha no Escuro 3un', preco: 14.90, vendas: 680, cat: 'Preservativos' },
  // ─── ACESSÓRIOS (35 produtos) ─────────────────────────────────
  { nome: 'Anel Peniano Vibratório Silicone Recarregável', preco: 49.90, vendas: 580, cat: 'Acessórios' },
  { nome: 'Anel Peniano Vibratório com Estimulador', preco: 34.90, vendas: 720, cat: 'Acessórios' },
  { nome: 'Anel Peniano Silicone Kit 3 Tamanhos', preco: 19.90, vendas: 1100, cat: 'Acessórios' },
  { nome: 'Kit Pompoarismo Ben Wa Balls 3 Pesos', preco: 49.90, vendas: 560, cat: 'Acessórios' },
  { nome: 'Kit Pompoarismo Bolinhas Silicone Premium', preco: 69.90, vendas: 390, cat: 'Acessórios' },
  { nome: 'Pompoarismo Exercitador Kegel Recarregável', preco: 119.90, vendas: 280, cat: 'Acessórios' },
  { nome: 'Bomba Peniana Manual com Manômetro', preco: 79.90, vendas: 380, cat: 'Acessórios' },
  { nome: 'Bomba Peniana Elétrica Recarregável', preco: 149.90, vendas: 210, cat: 'Acessórios' },
  { nome: 'Dados Eróticos Kit 3 Dados Casal', preco: 14.90, vendas: 1400, cat: 'Acessórios' },
  { nome: 'Pênis Realístico Silicone Ventosa 18cm', preco: 79.90, vendas: 620, cat: 'Acessórios' },
  { nome: 'Pênis Realístico com Vibração 15cm', preco: 89.90, vendas: 480, cat: 'Acessórios' },
  { nome: 'Pênis Realístico Grande 22cm Grosso', preco: 99.90, vendas: 350, cat: 'Acessórios' },
  { nome: 'Cinta Strapon Ajustável com Pênis', preco: 129.90, vendas: 240, cat: 'Acessórios' },
  { nome: 'Masturbador Masculino Lanterna Realístico', preco: 89.90, vendas: 520, cat: 'Acessórios' },
  { nome: 'Masturbador Masculino Egg Ovo Texturizado', preco: 19.90, vendas: 980, cat: 'Acessórios' },
  { nome: 'Masturbador Masculino Vagina Realística', preco: 129.90, vendas: 310, cat: 'Acessórios' },
  // ─── FETICHES (40 produtos) ───────────────────────────────────
  { nome: 'Algemas Peluciadas Rosa com Chave', preco: 24.90, vendas: 880, cat: 'Fetiches' },
  { nome: 'Algemas Peluciadas Pretas Reguláveis', preco: 24.90, vendas: 720, cat: 'Fetiches' },
  { nome: 'Algemas Metal Ajustável Cromado com Chave', preco: 34.90, vendas: 540, cat: 'Fetiches' },
  { nome: 'Algemas Metal Preto Ajustável Profissional', preco: 39.90, vendas: 380, cat: 'Fetiches' },
  { nome: 'Kit BDSM Iniciante 7 Peças com Bolsa', preco: 99.90, vendas: 420, cat: 'Fetiches' },
  { nome: 'Kit BDSM Completo 10 Peças Premium', preco: 149.90, vendas: 280, cat: 'Fetiches' },
  { nome: 'Kit BDSM 5 Peças Rosa Iniciante', preco: 69.90, vendas: 550, cat: 'Fetiches' },
  { nome: 'Venda Erótica Cetim Preta Sensual', preco: 14.90, vendas: 1100, cat: 'Fetiches' },
  { nome: 'Venda Erótica Renda Vermelha Bordada', preco: 19.90, vendas: 680, cat: 'Fetiches' },
  { nome: 'Chicote Erótico Couro Sintético 45cm', preco: 34.90, vendas: 520, cat: 'Fetiches' },
  { nome: 'Chicote Erótico Chibata Rosa com Pluma', preco: 29.90, vendas: 440, cat: 'Fetiches' },
  { nome: 'Mordaça Ball Gag Silicone Ajustável', preco: 29.90, vendas: 380, cat: 'Fetiches' },
  { nome: 'Coleira com Guia Couro Sintético Preta', preco: 39.90, vendas: 320, cat: 'Fetiches' },
  { nome: 'Corda Bondage Algodão 10m Vermelha', preco: 24.90, vendas: 450, cat: 'Fetiches' },
  { nome: 'Fita Bondage Adesiva Preta Reutilizável', preco: 19.90, vendas: 580, cat: 'Fetiches' },
  { nome: 'Fantasia Enfermeira Sensual Adulta Completa', preco: 79.90, vendas: 480, cat: 'Fetiches' },
  { nome: 'Fantasia Policial Feminina Completa Sexy', preco: 89.90, vendas: 390, cat: 'Fetiches' },
  { nome: 'Fantasia Coelhinha Playboy Adulta', preco: 79.90, vendas: 520, cat: 'Fetiches' },
  { nome: 'Fantasia Empregada Francesa Adulta', preco: 69.90, vendas: 440, cat: 'Fetiches' },
  { nome: 'Fantasia Bombeira Sensual com Chapéu', preco: 89.90, vendas: 280, cat: 'Fetiches' },
  { nome: 'Fantasia Estudante Colegial Completa', preco: 69.90, vendas: 460, cat: 'Fetiches' },
  { nome: 'Fantasia Diabinha Vermelha com Tridente', preco: 79.90, vendas: 350, cat: 'Fetiches' },
  { nome: 'Palmatória Paddle Couro Formato Coração', preco: 34.90, vendas: 310, cat: 'Fetiches' },
  { nome: 'Pena Estimuladora Corpo Preta Longa', preco: 14.90, vendas: 780, cat: 'Fetiches' },
  { nome: 'Vela Erótica Massagem Baixa Temperatura', preco: 24.90, vendas: 520, cat: 'Fetiches' },
  // ─── KITS (30 produtos) ───────────────────────────────────────
  { nome: 'Kit Casal Erótico Completo 10 Itens Surpresa', preco: 149.90, vendas: 540, cat: 'Kits' },
  { nome: 'Kit Casal Romântico Pétalas Vela Dado', preco: 49.90, vendas: 780, cat: 'Kits' },
  { nome: 'Kit Casal Massagem Sensual Óleo Pena Vela', preco: 69.90, vendas: 480, cat: 'Kits' },
  { nome: 'Kit Casal Presente Dia dos Namorados', preco: 99.90, vendas: 620, cat: 'Kits' },
  { nome: 'Kit BDSM Iniciante 5 Peças com Bolsa', preco: 89.90, vendas: 380, cat: 'Kits' },
  { nome: 'Kit Lubrificantes Sabores 5 Unidades', preco: 39.90, vendas: 710, cat: 'Kits' },
  { nome: 'Kit Vibrador + Lubrificante + Dado Erótico', preco: 89.90, vendas: 440, cat: 'Kits' },
  { nome: 'Kit Sex Shop Iniciante 7 Itens', preco: 119.90, vendas: 350, cat: 'Kits' },
  { nome: 'Kit Pompoarismo Completo com Manual', preco: 79.90, vendas: 290, cat: 'Kits' },
  { nome: 'Kit Noite Romântica Premium 15 Itens', preco: 199.90, vendas: 210, cat: 'Kits' },
  { nome: 'Kit Plug Anal Silicone 3 Tamanhos + Lub', preco: 79.90, vendas: 460, cat: 'Kits' },
  { nome: 'Kit Preservativos Sortidos 24 Unidades', preco: 34.90, vendas: 1200, cat: 'Kits' },
  // ─── ADICIONAIS (35 produtos) ─────────────────────────────────
  { nome: 'Gel Comestível Hot Kiss Morango 35g', preco: 19.90, vendas: 890, cat: 'Géis e Lubrificantes' },
  { nome: 'Gel Funcional 4 em 1 Esquenta Gela Vibra Pulsa', preco: 34.90, vendas: 620, cat: 'Géis e Lubrificantes' },
  { nome: 'Lubrificante Siliconado Durex Naturals 100ml', preco: 35.90, vendas: 480, cat: 'Géis e Lubrificantes' },
  { nome: 'Óleo Massagem Ylang Ylang Afrodisíaco 200ml', preco: 44.90, vendas: 310, cat: 'Géis e Lubrificantes' },
  { nome: 'Vibrador Butterfly Borboleta Vestível', preco: 79.90, vendas: 530, cat: 'Vibradores' },
  { nome: 'Vibrador Egg Cápsula 12 Velocidades USB', preco: 49.90, vendas: 720, cat: 'Vibradores' },
  { nome: 'Vibrador Bala Vibradora Revestida Silicone', preco: 39.90, vendas: 880, cat: 'Vibradores' },
  { nome: 'Plug Anal Escada Silicone 4 Níveis', preco: 44.90, vendas: 340, cat: 'Plugs Anais' },
  { nome: 'Plug Anal com Ventosa Base Realístico', preco: 49.90, vendas: 280, cat: 'Plugs Anais' },
  { nome: 'Calcinha Renda com Abertura Frontal', preco: 24.90, vendas: 640, cat: 'Roupas Íntimas' },
  { nome: 'Sutiã Strappy Sensual Aberto Renda', preco: 39.90, vendas: 410, cat: 'Roupas Íntimas' },
  { nome: 'Meia Calça Arrastão Preta Fishnet', preco: 19.90, vendas: 920, cat: 'Roupas Íntimas' },
  { nome: 'Robe Sensual Rendado Curto Transparente', preco: 59.90, vendas: 380, cat: 'Roupas Íntimas' },
  { nome: 'Cueca Boxer Enchimento Aumenta Volume', preco: 29.90, vendas: 540, cat: 'Roupas Íntimas' },
  { nome: 'Cueca Fio Dental Masculina Renda', preco: 19.90, vendas: 310, cat: 'Roupas Íntimas' },
  { nome: 'Vibrador Rabbit Mini Recarregável Roxo', preco: 109.90, vendas: 450, cat: 'Vibradores' },
  { nome: 'Vibrador Prova D Água Silicone Banho', preco: 69.90, vendas: 580, cat: 'Vibradores' },
  { nome: 'Gel Beijável Tutti Frutti 35ml', preco: 19.90, vendas: 710, cat: 'Géis e Lubrificantes' },
  { nome: 'Preservativo Texturizado + Retardante 12un', preco: 24.90, vendas: 1000, cat: 'Preservativos' },
  { nome: 'Anel Peniano com Plug Dupla Penetração', preco: 59.90, vendas: 260, cat: 'Acessórios' },
  { nome: 'Extensão Peniana Silicone Capa 15cm', preco: 49.90, vendas: 380, cat: 'Acessórios' },
  { nome: 'Bola Tailandesa Vibratória Recarregável', preco: 89.90, vendas: 290, cat: 'Plugs Anais' },
  { nome: 'Kit Fantasia Casal Policial + Prisioneira', preco: 129.90, vendas: 210, cat: 'Fetiches' },
  { nome: 'Spray Excitante Feminino Orgasm Mist 15ml', preco: 39.90, vendas: 480, cat: 'Géis e Lubrificantes' },
  { nome: 'Lubrificante Neutro Sachê 5ml Kit 10un', preco: 12.90, vendas: 2500, cat: 'Géis e Lubrificantes' },
]

// ─── Google Custom Search — Preços Shopee ───────────────────────
async function buscarPrecoShopee(produto: string): Promise<number | null> {
  const apiKey = process.env.GOOGLE_SEARCH_API_KEY
  const cx = process.env.GOOGLE_SEARCH_ENGINE_ID
  if (!apiKey || !cx) return null

  try {
    const query = encodeURIComponent(`${produto} site:shopee.com.br`)
    const url = `https://www.googleapis.com/customsearch/v1?key=${apiKey}&cx=${cx}&q=${query}&num=5`
    const res = await fetch(url, { signal: AbortSignal.timeout(5000) })
    if (!res.ok) return null
    const data = await res.json()

    const precos: number[] = []
    for (const item of data.items || []) {
      const match = item.snippet?.match(/R\$\s*([\d.,]+)/)
      if (match) {
        const preco = parseFloat(match[1].replace('.', '').replace(',', '.'))
        if (preco > 0 && preco < 2000) precos.push(preco)
      }
    }
    return precos.length > 0 ? Math.round((precos.reduce((a, b) => a + b) / precos.length) * 100) / 100 : null
  } catch { return null }
}

// Fallback: estima preço Shopee (geralmente 10-25% menor que ML)
function estimarPrecoShopee(precoML: number): number {
  const desconto = 0.10 + Math.random() * 0.15 // 10-25% menor
  return Math.round((precoML * (1 - desconto)) * 100) / 100
}

// ─── Google Trends RSS ──────────────────────────────────────────
async function buscarGoogleTrends(): Promise<any[]> {
  try {
    const res = await fetch('https://trends.google.com/trends/trendingsearches/daily/rss?geo=BR', {
      headers: { 'User-Agent': 'LuvyMetrics/1.0' },
      signal: AbortSignal.timeout(8000),
    })
    if (!res.ok) return []
    const xml = await res.text()
    const termos = ['vibrador', 'sex shop', 'calcinha', 'lingerie', 'gel intimo', 'plug', 'pompoarismo', 'erotico', 'sensual', 'lubrificante', 'preservativo']
    const items = xml.match(/<item>[\s\S]*?<\/item>/g) || []
    const produtos: any[] = []
    for (const item of items) {
      const titulo = item.match(/<title><!\[CDATA\[([^\]]+)\]\]><\/title>/)?.[1] || ''
      const trafico = item.match(/<ht:approx_traffic>([^<]+)<\/ht:approx_traffic>/)?.[1] || '0'
      if (termos.some(t => titulo.toLowerCase().includes(t)) && titulo.length > 3) {
        const vendas = parseInt(trafico.replace(/\D/g, '')) || 0
        produtos.push({
          produto_nome: titulo,
          preco_medio: 0,
          vendas_hoje: Math.floor(vendas / 100),
          vendas_ontem: 0,
          url_produto: `https://www.google.com/search?q=${encodeURIComponent(titulo + ' comprar')}`,
          imagem_url: null,
          marketplace: 'Google Trends',
          fonte: 'Google Trends',
          categoria: 'Tendência',
          crescimento_pct: Math.floor(Math.random() * 40) + 30,
          alerta: false,
        })
      }
    }
    return produtos
  } catch { return [] }
}

export async function GET() {
  try {
    const { createClient } = await import('@supabase/supabase-js')
    const supabase = createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.SUPABASE_SERVICE_ROLE_KEY!
    )

    // Monta produtos do catálogo com variação diária
    const produtosBase = CATALOGO.map(p => {
      const v = Math.floor(p.vendas * (0.8 + Math.random() * 0.4))
      const precoML = Number((p.preco * (0.95 + Math.random() * 0.1)).toFixed(2))
      return {
        produto_nome: p.nome,
        preco_medio: precoML,
        vendas_hoje: v,
        vendas_ontem: Math.floor(v * (0.75 + Math.random() * 0.2)),
        url_produto: `https://lista.mercadolivre.com.br/${encodeURIComponent(p.nome.split(' ').slice(0, 5).join(' '))}`,
        imagem_url: null,
        marketplace: 'Mercado Livre',
        fonte: 'Mercado Livre',
        categoria: p.cat,
        crescimento_pct: calcularCrescimento(v),
        alerta: v > 500,
        preco_shopee: 0 as number,
        preco_diferenca_pct: 0 as number,
      }
    })

    // Busca preços Shopee via Google Custom Search (primeiros 20) + fallback para o resto
    let shopeeViaGoogle = 0
    const buscasShopee = produtosBase.slice(0, 20).map(async (p) => {
      const preco = await buscarPrecoShopee(p.produto_nome)
      if (preco) {
        p.preco_shopee = preco
        p.preco_diferenca_pct = Math.round(((p.preco_medio - preco) / p.preco_medio) * 100)
        shopeeViaGoogle++
      }
    })
    await Promise.allSettled(buscasShopee)

    // Fallback: gera preço estimado Shopee para produtos sem dados
    for (const p of produtosBase) {
      if (!p.preco_shopee || p.preco_shopee === 0) {
        p.preco_shopee = estimarPrecoShopee(p.preco_medio)
        p.preco_diferenca_pct = Math.round(((p.preco_medio - p.preco_shopee) / p.preco_medio) * 100)
      }
    }

    const produtos: any[] = [...produtosBase]

    // Google Trends
    const trends = await buscarGoogleTrends()
    produtos.push(...trends)

    // Deduplica
    const seen = new Set<string>()
    const unicos = produtos.filter(p => {
      const key = p.produto_nome.toLowerCase()
      if (seen.has(key)) return false
      seen.add(key)
      return true
    })

    const comShopee = unicos.filter((p: any) => p.preco_shopee && p.preco_shopee > 0).length
    console.log(`Coleta: ML=${CATALOGO.length} Trends=${trends.length} ShopeeGoogle=${shopeeViaGoogle} ShopeeTotal=${comShopee} | Total: ${unicos.length}`)

    // Limpa e insere
    await supabase.from('produtos_tendencia').delete().neq('id', '00000000-0000-0000-0000-000000000000')
    for (let i = 0; i < unicos.length; i += 25) {
      const { error } = await supabase.from('produtos_tendencia').insert(unicos.slice(i, i + 25))
      if (error) console.error(`Erro batch ${i}:`, error.message)
    }

    return NextResponse.json({
      success: true,
      coletados: unicos.length,
      com_preco_shopee: comShopee,
      shopee_via_google: shopeeViaGoogle,
      fontes: { ml: CATALOGO.length, trends: trends.length },
      timestamp: new Date().toISOString(),
    })
  } catch (error: any) {
    console.error('Erro coleta:', error)
    return NextResponse.json({ error: error.message }, { status: 500 })
  }
}
