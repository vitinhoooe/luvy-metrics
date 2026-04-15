-- Migração v3 — execute no Supabase SQL Editor
ALTER TABLE perfis ADD COLUMN IF NOT EXISTS onboarding_completo boolean DEFAULT false;

-- Usuários existentes já passaram pelo onboarding
UPDATE perfis SET onboarding_completo = true WHERE onboarding_completo IS NULL OR onboarding_completo = false;
