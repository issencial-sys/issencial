# Issencial — Setup Supabase CLI

## 1. Instalar Supabase CLI (Windows)

O CLI atual está a dar erro de permissões (EPERM) no Windows por causa do runtime Bun.

**Opção A — Instalar via npm local (recomendado):**

```bash
npm install --save-dev @supabase/cli
npx supabase login
```

**Opção B — Instalar globalmente via Scoop (mais estável no Windows):**

```bash
scoop install supabase
supabase login
```

**Opção C — Instalar binário manual:**

1. Download do [último release](https://github.com/supabase/cli/releases) (`supabase_windows_amd64.tar.gz`)
2. Extrair para `C:\Users\bapti\.supabase\bin\`
3. Adicionar ao PATH

## 2. Login no Supabase

```bash
supabase login
```
Isto abre o browser para autenticação.

## 3. Link ao projeto (já está feito)

```bash
supabase link --project-ref lyqmsluktqdeytpouyvh
```

## 4. Pull do schema local (para desenvolvimento)

```bash
supabase db pull --local
```

## 5. Correr migrations locais

```bash
supabase migration up --local
```

---

## Variáveis de Ambiente (.env.local)

O ficheiro `.env.local` precisa destas variáveis:

```
NEXT_PUBLIC_SUPABASE_URL=https://lyqmsluktqdeytpouyvh.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=<a tua anon key>
```

Para obter a anon key:
1. [Supabase Dashboard](https://supabase.com/dashboard/project/lyqmsluktqdeytpouyvh)
2. **Project Settings → API**
3. Copiar `Project URL` e `anon public key`
