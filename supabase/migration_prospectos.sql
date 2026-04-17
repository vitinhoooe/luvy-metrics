-- Tabela de prospectos
CREATE TABLE IF NOT EXISTS prospectos (
  id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id uuid REFERENCES auth.users(id),
  email text,
  nome_loja text,
  cidade text,
  telefone text,
  website text,
  place_id text,
  status text DEFAULT 'novo' CHECK (status IN ('novo','enviado','contatado','respondeu','convertido','perdido')),
  enviado_em timestamptz,
  email_aberto boolean DEFAULT false,
  email_aberto_em timestamptz,
  respondeu boolean DEFAULT false,
  respondeu_em timestamptz,
  created_at timestamptz DEFAULT now()
);

-- Adiciona colunas se tabela já existir
ALTER TABLE prospectos ADD COLUMN IF NOT EXISTS email_aberto boolean DEFAULT false;
ALTER TABLE prospectos ADD COLUMN IF NOT EXISTS email_aberto_em timestamptz;
ALTER TABLE prospectos ADD COLUMN IF NOT EXISTS respondeu boolean DEFAULT false;
ALTER TABLE prospectos ADD COLUMN IF NOT EXISTS respondeu_em timestamptz;
ALTER TABLE prospectos ADD COLUMN IF NOT EXISTS telefone text;
ALTER TABLE prospectos ADD COLUMN IF NOT EXISTS website text;
ALTER TABLE prospectos ADD COLUMN IF NOT EXISTS place_id text;
