# LuvyMetrics v2 — guia de lançamento

O código está pronto e o build de produção passa. Para o Luvy funcionar com lojistas de verdade,
faltam só os passos abaixo (contas e chaves são suas: o Claude não cria contas nem mexe em chaves).

---

## 1. Supabase (banco, login e fotos) · ~20 min

1. Crie um projeto em **supabase.com** (região: São Paulo).
2. Abra **SQL Editor** e rode, **nesta ordem**, cada arquivo da pasta `supabase/`:
   1. `schema.sql`
   2. `vitrine.sql`
   3. `fornecedores.sql`
   4. `entrada.sql`
   5. `mercadopago.sql`
   6. `vitrine2.sql` (cria também a pasta pública de imagens `vitrine`)
3. **Authentication → URL Configuration**
   - Site URL: o endereço final (ex.: `https://luvymetrics.com.br`)
   - Redirect URLs: `https://SEU-DOMINIO/auth/callback`
4. (Opcional) **Authentication → Providers → Google**: ligar para o botão "Continuar com o Google".
5. Em **Project Settings → API**, copie: `URL`, `anon key` e `service_role key` (essa é secreta).

## 2. Chaves (variáveis de ambiente)

| Variável | De onde vem |
|---|---|
| `NEXT_PUBLIC_SUPABASE_URL` | Supabase → Project Settings → API |
| `NEXT_PUBLIC_SUPABASE_ANON_KEY` | Supabase → Project Settings → API |
| `SUPABASE_SERVICE_ROLE_KEY` | Supabase → Project Settings → API (**secreta**) |
| `LUVY_CHAVE_CRIPTO` | gere no terminal: `openssl rand -base64 32` (guarda o token do Mercado Pago das lojistas criptografado) |
| `ANTHROPIC_API_KEY` | console.anthropic.com → API Keys (crie uma nova) |
| `NEXT_PUBLIC_SITE_URL` | o domínio final, ex.: `https://luvymetrics.com.br` |
| `NEXT_PUBLIC_WPP_SUPORTE` | WhatsApp da equipe com DDD (botão de suporte na landing e “Assinar” nos Planos). Sem ela, os botões somem |
| `NEXT_PUBLIC_INSTAGRAM` | (opcional) Instagram da LuvyMetrics, sem @ |

Nunca coloque essas chaves no código nem no Git. No computador ficam no `.env.local` (já ignorado).

## 3. Deploy na Vercel · ~15 min

1. Envie o código: `git push -u origin feat/luvy-v2` (e faça o merge na `main` quando quiser).
2. Em **vercel.com → Add New → Project**, importe o repositório.
3. Em **Settings → Environment Variables**, cole as variáveis acima (Production).
4. Deploy. Depois, em **Settings → Domains**, ligue o seu domínio.
5. **Não** coloque `LUVY_PREVIA=1` em produção (ela liga as telas de demonstração).

## 4. Teste de ponta a ponta (antes da primeira lojista) · ~30 min

- [ ] Criar conta → "Conte sobre sua loja" → cai no checklist "Deixe sua loja pronta"
- [ ] Importar uma planilha de produtos (testar um CSV salvo pelo Excel)
- [ ] Abrir um produto → enviar 2 fotos pelo celular → escrever a descrição → marcar destaque
- [ ] Vitrine online → enviar logo e capa → escolher cor → ligar a vitrine → configurar entrega (cidade e Brasil, com frete por região)
- [ ] Abrir o link da loja no celular → aviso 18+ → produto → sacola → CEP → pedido
- [ ] Fazer uma venda no balcão e conferir que o estoque baixou e sumiu do site
- [ ] Pedidos → "Avisar cliente" abre o WhatsApp com a mensagem pronta
- [ ] Atendente IA: ligar e perguntar algo na vitrine (só responde com produtos em estoque)
- [ ] Minha conta → baixar produtos, vendas e clientes em planilha

## 5. Mercado Pago (pagamento online na vitrine)

1. Com a conta Mercado Pago **da loja de teste**, crie uma aplicação em **mercadopago.com.br/developers** (Checkout Pro).
2. Copie o **Access Token de produção** (começa com `APP_USR-`) e cole em **Vitrine online → Mercado Pago**.
3. Faça um pedido pequeno na vitrine pagando com Pix.
4. Confira: o pedido vira **"Pago" sozinho**, o estoque baixa e a venda aparece em Vendas como Pix.
5. **Antes de oferecer para lojistas:** confirme com o Mercado Pago se a conta aceita venda de produtos adultos.

O aviso automático (webhook) só funciona com o site em **https** (depois do deploy).

## 6. Antes de abrir para o público

- [ ] **Termos de uso e Política de privacidade (LGPD)**: as páginas ainda não existem (a coluna “Legal” do rodapé está escondida até lá)
- [ ] **WhatsApp e Instagram de suporte**: preencher `NEXT_PUBLIC_WPP_SUPORTE` e `NEXT_PUBLIC_INSTAGRAM`
- [ ] **Cobrança da assinatura**: hoje a tela de Planos manda assinar pelo WhatsApp da equipe
- [ ] Beta com até 10 lojistas fundadoras e uma conversa de feedback por mês

## Onde está cada coisa

- `src/app/(app)/` — app da lojista
- `src/app/loja/` — vitrine pública (o site da loja)
- `src/app/_landing/` — landing page
- `src/lib/mercadopago.ts` — integração com o Mercado Pago
- `supabase/` — banco (rodar na ordem acima)
- `video/` — vídeo do produto em Remotion (`video/out/luvy-produto.mp4`)
