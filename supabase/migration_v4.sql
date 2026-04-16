-- Migração v4 — execute no Supabase SQL Editor

-- Tabela de leads (captação pela landing page)
CREATE TABLE IF NOT EXISTS leads (
  id                 uuid DEFAULT gen_random_uuid() PRIMARY KEY,
  nome               text NOT NULL,
  whatsapp           text NOT NULL,
  nome_loja          text,
  faturamento_mensal text,
  origem             text DEFAULT 'landing',
  convertido         boolean DEFAULT false,
  created_at         timestamptz DEFAULT now()
);

-- Coluna plano e ativo no perfil (caso não existam)
ALTER TABLE perfis ADD COLUMN IF NOT EXISTS plano  text DEFAULT 'trial';
ALTER TABLE perfis ADD COLUMN IF NOT EXISTS ativo  boolean DEFAULT true;

-- RLS para leads (sem acesso de usuário final — só service role)
ALTER TABLE leads ENABLE ROW LEVEL SECURITY;
