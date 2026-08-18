# Dashboard Ratos

Sistema interno de dashboards que integra Meta Ads e Google Ads: login por
usuário, cada usuário vinculado a um ou mais clientes, e por cliente 4 telas —
investimento (com projeção), leads/compras (com projeção), análise de
campanhas, e criativos campeões. Os dados chegam via um sync diário (Meta +
Google Ads) que salva snapshots no banco, não consulta ao vivo.

Stack: Next.js 16 (App Router) + TypeScript + Tailwind + shadcn/ui, Postgres +
Auth via Supabase, Prisma 7 (com driver adapter), gráficos com Recharts,
deploy em Vercel com Vercel Cron pro sync.

## 1. Criar o projeto no Supabase

1. Crie uma conta gratuita em [supabase.com](https://supabase.com) e um novo projeto.
2. Em **Project Settings → API**, copie `Project URL`, `anon public key` e `service_role key`.
3. Em **Project Settings → Database → Connection string**, copie:
   - a **Transaction pooler** (porta 6543) → vai em `DATABASE_URL`
   - a **conexão direta** (porta 5432) → vai em `DIRECT_URL`

## 2. Configurar variáveis de ambiente

```bash
cp .env.local.example .env.local
```

Preencha `.env.local`:
- Os 4 valores do Supabase (passo 1).
- `META_ADS_TOKEN` / `META_APP_ID` — mesmos valores já usados pela skill
  `meta-ads-ratos` (`~/.claude/skills/meta-ads-ratos/.env`).
- `GOOGLE_CLIENT_ID` / `GOOGLE_CLIENT_SECRET` / `GOOGLE_DEVELOPER_TOKEN` /
  `GOOGLE_REFRESH_TOKEN` / `GOOGLE_LOGIN_CUSTOMER_ID` — mesmos valores já
  usados pela skill `google-ads-ratos` (`~/.claude/skills/google-ads-ratos/.env`).
- `CRON_SECRET` — qualquer string aleatória (ex: `openssl rand -hex 32`).

## 3. Rodar as migrations e o trigger de auth

```bash
npx prisma migrate dev --name init
```

Depois, no **SQL Editor** do painel do Supabase, cole e rode o conteúdo de
`prisma/sql/auth_trigger.sql` — isso cria a linha em `profiles`
automaticamente sempre que alguém faz login pela primeira vez.

## 4. Popular com dados de exemplo (opcional, recomendado pra ver as telas)

```bash
npx prisma db seed
```

Cria os clientes `winepopper` e `code-collections` com 30 dias de métricas
fictícias — dá pra navegar pelas 4 telas antes mesmo de rodar o sync real.

## 5. Criar seu usuário e virar admin

1. Rode `npm run dev` e acesse `/login`.
2. No painel do Supabase, em **Authentication → Users**, crie seu usuário
   (email + senha) — ou use **Authentication → Users → Invite** pra receber
   um email de convite.
3. Faça login uma vez em `/login` (isso cria seu `profile` via trigger).
4. Rode:
   ```bash
   npx tsx prisma/make-admin.ts seu-email@exemplo.com
   ```
   Admin vê todos os clientes automaticamente, sem precisar de acesso
   granular por cliente.

## 6. Rodar localmente

```bash
npm run dev
```

Abra `/admin/clientes` pra cadastrar clientes reais (ou editar os do seed
com os IDs de conta corretos), e `/admin/sync` pra disparar o sync
manualmente contra Meta Ads e Google Ads.

## Deploy (Vercel)

1. Crie uma conta gratuita em [vercel.com](https://vercel.com) e importe este
   repositório.
2. Em **Settings → Environment Variables**, adicione todas as variáveis do
   `.env.local` (exceto `DIRECT_URL`, que só é usada localmente pelas
   migrations — pode incluir também, não tem problema).
3. Deploy. O `vercel.json` já define o cron (`/api/cron/sync`, todo dia às
   9h UTC / 6h em São Paulo). A Vercel envia automaticamente o header
   `Authorization: Bearer $CRON_SECRET` nessa chamada — não precisa configurar
   nada além da env var.
4. Rode as migrations contra o banco de produção (mesmo banco do passo 1,
   então normalmente não precisa rodar de novo — só se você criou um projeto
   Supabase separado pra produção):
   ```bash
   npx prisma migrate deploy
   ```

## Comandos úteis

| Comando | O que faz |
|---|---|
| `npm run dev` | Servidor de desenvolvimento |
| `npm run build` | Build de produção |
| `npx prisma studio` | Navegador visual do banco |
| `npx prisma migrate dev --name <nome>` | Cria e aplica uma nova migration |
| `npx prisma db seed` | Popula dados de exemplo |
| `npx tsx prisma/make-admin.ts <email>` | Promove um usuário a admin |

## Limitações conhecidas (v1)

- Criativos campeões cobre só Meta Ads — Google Ads não tem hoje uma leitura
  de criativo/asset equivalente (ver `prisma/schema.prisma`, modelo `Creative`).
- Leads vs. compras no Google Ads é inferido pela categoria de conversão
  dominante da campanha (`segments.conversion_action_category`), já que a
  API não tem um "objetivo" de campanha como o Meta.
- A versão da Graph API do Meta (`META_GRAPH_API_VERSION` em
  `src/lib/sync/meta.ts`) precisa ser revisada periodicamente — a Meta
  descontinua versões antigas.
