-- ============================================================
-- LuvyMetrics — Schema completo do banco de dados
-- Execute no Supabase: SQL Editor → New query → Run
-- ============================================================

-- PERFIS DE USUÁRIO
CREATE TABLE IF NOT EXISTS perfis (
  id                   uuid DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id              uuid REFERENCES auth.users(id) ON DELETE CASCADE UNIQUE,
  nome                 text,
  nome_loja            text,
  whatsapp             text,
  faturamento          text,
  trial_expira_em      timestamptz DEFAULT (now() + interval '7 days'),
  estoque_evitado_valor numeric DEFAULT 0,
  alertas_diarios      boolean DEFAULT true,
  alertas_oportunidade boolean DEFAULT true,
  relatorio_dominical  boolean DEFAULT true,
  alertas_estoque      boolean DEFAULT true,
  qtd_minima_padrao    integer DEFAULT 5,
  categoria_padrao     text DEFAULT 'Geral',
  alerta_ao_zerar      boolean DEFAULT true,
  created_at           timestamptz DEFAULT now(),
  updated_at           timestamptz DEFAULT now()
);

-- PRODUTOS EM TENDÊNCIA (coletados automaticamente)
CREATE TABLE IF NOT EXISTS produtos_tendencia (
  id             uuid DEFAULT gen_random_uuid() PRIMARY KEY,
  produto_nome   text NOT NULL,
  fonte          text DEFAULT 'Mercado Livre',
  categoria      text,
  crescimento_pct numeric DEFAULT 0,
  vendas_hoje    integer DEFAULT 0,
  vendas_ontem   integer DEFAULT 0,
  preco_medio    numeric DEFAULT 0,
  alerta         boolean DEFAULT false,
  updated_at     timestamptz DEFAULT now(),
  created_at     timestamptz DEFAULT now()
);

-- ESTOQUE DO USUÁRIO
CREATE TABLE IF NOT EXISTS estoque_usuario (
  id                uuid DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id           uuid REFERENCES auth.users(id) ON DELETE CASCADE,
  produto_nome      text NOT NULL,
  quantidade        integer DEFAULT 0,
  quantidade_minima integer DEFAULT 5,
  preco_custo       numeric,
  preco_venda       numeric,
  categoria         text,
  ativo             boolean DEFAULT true,
  created_at        timestamptz DEFAULT now(),
  updated_at        timestamptz DEFAULT now()
);

-- MOVIMENTAÇÕES DE ESTOQUE
CREATE TABLE IF NOT EXISTS movimentacoes_estoque (
  id         uuid DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id    uuid REFERENCES auth.users(id) ON DELETE CASCADE,
  produto_id uuid REFERENCES estoque_usuario(id) ON DELETE CASCADE,
  tipo       text CHECK (tipo IN ('entrada', 'saida')),
  quantidade integer,
  observacao text,
  created_at timestamptz DEFAULT now()
);

-- CÁLCULOS DE LUCRO
CREATE TABLE IF NOT EXISTS calculos (
  id               uuid DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id          uuid REFERENCES auth.users(id) ON DELETE CASCADE,
  produto_nome     text,
  custo            numeric,
  marketplace      text,
  taxa_marketplace numeric,
  margem_pct       numeric,
  simples_nacional boolean DEFAULT false,
  preco_ideal      numeric,
  lucro_unidade    numeric,
  created_at       timestamptz DEFAULT now()
);

-- LOG DE ALERTAS
CREATE TABLE IF NOT EXISTS alertas_log (
  id               uuid DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id          uuid REFERENCES auth.users(id) ON DELETE CASCADE,
  tipo             text,
  mensagem         text,
  whatsapp_enviado boolean DEFAULT false,
  created_at       timestamptz DEFAULT now()
);

-- NOTIFICAÇÕES
CREATE TABLE IF NOT EXISTS notificacoes (
  id         uuid DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id    uuid REFERENCES auth.users(id) ON DELETE CASCADE,
  titulo     text,
  mensagem   text,
  tipo       text, -- tendencia | estoque | trial
  lida       boolean DEFAULT false,
  created_at timestamptz DEFAULT now()
);

-- ============================================================
-- ROW LEVEL SECURITY
-- ============================================================

ALTER TABLE perfis               ENABLE ROW LEVEL SECURITY;
ALTER TABLE estoque_usuario      ENABLE ROW LEVEL SECURITY;
ALTER TABLE movimentacoes_estoque ENABLE ROW LEVEL SECURITY;
ALTER TABLE calculos             ENABLE ROW LEVEL SECURITY;
ALTER TABLE alertas_log          ENABLE ROW LEVEL SECURITY;
ALTER TABLE notificacoes         ENABLE ROW LEVEL SECURITY;

-- Políticas
CREATE POLICY "Perfil próprio"           ON perfis               FOR ALL USING (auth.uid() = user_id);
CREATE POLICY "Estoque próprio"          ON estoque_usuario      FOR ALL USING (auth.uid() = user_id);
CREATE POLICY "Movimentações próprias"   ON movimentacoes_estoque FOR ALL USING (auth.uid() = user_id);
CREATE POLICY "Cálculos próprios"        ON calculos             FOR ALL USING (auth.uid() = user_id);
CREATE POLICY "Alertas próprios"         ON alertas_log          FOR ALL USING (auth.uid() = user_id);
CREATE POLICY "Notificações próprias"    ON notificacoes         FOR ALL USING (auth.uid() = user_id);

-- Produtos em tendência: leitura pública (dados agregados)
ALTER TABLE produtos_tendencia ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Tendências públicas" ON produtos_tendencia FOR SELECT USING (true);
CREATE POLICY "Tendências inserção admin" ON produtos_tendencia FOR INSERT WITH CHECK (true);
CREATE POLICY "Tendências atualização admin" ON produtos_tendencia FOR UPDATE USING (true);

-- ============================================================
-- TRIGGER: cria perfil automaticamente ao cadastrar usuário
-- ============================================================

CREATE OR REPLACE FUNCTION criar_perfil_usuario()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO perfis (user_id, nome, trial_expira_em)
  VALUES (NEW.id, split_part(NEW.email, '@', 1), now() + interval '7 days')
  ON CONFLICT (user_id) DO NOTHING;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION criar_perfil_usuario();

-- ============================================================
-- DADOS DE EXEMPLO para testes (opcional)
-- ============================================================

INSERT INTO produtos_tendencia (produto_nome, fonte, categoria, crescimento_pct, vendas_hoje, vendas_ontem, preco_medio, alerta)
VALUES
  ('Vibrador Silicone USB Pro',     'Mercado Livre', 'Vibradores',  83, 142, 78,  89.90, true),
  ('Plug Anal Iniciante Silicone',  'Mercado Livre', 'Plugs Anais', 67, 98,  59,  49.90, true),
  ('Gel Esquentado 30ml',           'Mercado Livre', 'Lubrificantes',54, 201, 130, 29.90, true),
  ('Calcinha Comestível Morango',   'Mercado Livre', 'Acessórios',  41, 87,  62,  19.90, false),
  ('Kit Pompoarismo 3 Bolinhas',    'Mercado Livre', 'Kits',        38, 54,  39,  39.90, false),
  ('Colar de Amarrar Seda',         'Mercado Livre', 'Acessórios',  22, 33,  27,  24.90, false),
  ('Vibrador Ponto G Recarregável', 'Mercado Livre', 'Vibradores',  19, 76,  64,  129.90, false)
ON CONFLICT DO NOTHING;
