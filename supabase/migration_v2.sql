-- Migração v2 — execute no Supabase SQL Editor
ALTER TABLE produtos_tendencia ADD COLUMN IF NOT EXISTS url_produto text;
ALTER TABLE produtos_tendencia ADD COLUMN IF NOT EXISTS imagem_url  text;
ALTER TABLE produtos_tendencia ADD COLUMN IF NOT EXISTS marketplace  text DEFAULT 'Mercado Livre';
