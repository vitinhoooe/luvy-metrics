CREATE TABLE IF NOT EXISTS movimentacoes_estoque (
  id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id uuid REFERENCES auth.users(id),
  produto_id uuid,
  produto_nome text,
  tipo text CHECK (tipo IN ('entrada','saida')),
  quantidade integer,
  quantidade_anterior integer,
  quantidade_nova integer,
  observacao text,
  created_at timestamptz DEFAULT now()
);
