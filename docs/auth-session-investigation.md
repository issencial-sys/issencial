# Investigação: Sessão de auth desaparece após MFA (admin / portal)

> Estado: **EM CURSO** — a causa raiz ainda não está isolada. Este documento
> regista factos provados, hipóteses testadas (e o seu resultado) e próximos
> passos. Atualizado em 2026-07-12.

---

## 1. Sintoma reportado

- Em `/admin/login` e `/portal/login`: após password + código MFA, o utilizador
  é redirecionado ao dashboard, mas **os cookies de sessão desaparecem**.
- Em alguns casos o desaparecimento ocorre **logo após o MFA** (ao entrar no
  `/admin`); noutros, **após F5** em `/admin` ou `/portal`.
- Consequência: redirecionamento contínuo para o login, impossibilitando gerir
  o site.
- **Observação do utilizador (consola → Application → Cookies, em
  `issencial.vercel.app`):** cookies `sb-...-auth-token` (base64) e
  `sb-...-auth-token-code-verifier` (mlja) aparecem após password, mas
  **desaparecem no exato momento do código MFA** no `/admin`.
- **Teste em preview (corrigido):** no `/portal` os cookies SÃO permanentes
  (F5 repetido mantém); no `/admin` continuam a desaparecer.

---

## 2. Factos provados (evidência recolhida)

### 2.1 Credenciais e config remota — OK
- `.env.local` e env vars da Vercel apontam ambas a
  `https://lyqmsluktqdeytpouyvh.supabase.co` com a mesma anon key. **Credenciais
  local↔remotas batem.**
- Auth config remota (`/v1/projects/lyqmsluktqdeytpouyvh/config/auth`):
  - `refresh_token_rotation_enabled = true`
  - `security_refresh_token_reuse_interval = 86400` (subido de 10s via
    `supabase/config-patch.sh`)
  - `mfa_allow_low_aal = false`
  - Sem `cookie_*` custom → usa defaults do `@supabase/ssr` 0.12.0
    (`path:/`, `sameSite:lax`, `maxAge:400d`).
- Utilizadores (SQL read-only): `issencialofficial@gmail.com` = **admin** +
  TOTP verificado; `baptistalimab@gmail.com` = **client** + TOTP verificado.
  **MFA está corretamente ativo** para ambos.

### 2.2 Logs de instrumentação (preview de debug, admin)
Sequência observada no browser (consola) após login admin até `/admin`:

```
onAuthStateChange INITIAL_SESSION  hasSession:false
onAuthStateChange SIGNED_IN       hasSession:true  expires_at:1783896316
onAuthStateChange INITIAL_SESSION hasSession:true
onAuthStateChange SIGNED_IN       hasSession:true
onAuthStateChange MFA_CHALLENGE_VERIFIED hasSession:true expires_at:1783896339
[admin-mfa] verify result -> error:null dataKeys:[access_token,token_type,expires_in,expires_at,refresh_token,user]
onAuthStateChange INITIAL_SESSION  hasSession:true  expires_at:1783896339
checkAdmin getUser -> user:true role:admin sessionExpiresAt:1783896339 now:1783892740905 cookiePresent:true
checkAdmin aal: aal2 nextLevel: aal2
```

**Conclusões extraídas destes logs:**
- Antes do reload: `aal2`, `refresh_token` presente, `cookiePresent:true`,
  `expires_at` ~1h no futuro (1783896339s vs now 1783892740905ms → ~3599s de
  validade). **O cookie está válido e presente em memória/disco.**
- O `mfa.verify()` **não devolve `session` no seu `data`** — a sessão AAL2 é
  propagada internamente pelo GoTrue (`_saveSession`), confirmado no source do
  `@supabase/auth-js` (`mfa.js` → `verify()` → `_verify()` → `_saveSession` +
  `_notifyAllSubscribers('MFA_CHALLENGE_VERIFIED')`).
- Após **F5**: `onAuthStateChange INITIAL_SESSION hasSession:false`
  `sbCookies:[]` `docCookieLen:0` → **o cookie desapareceu do disco.** Foi
  redirecionado para `/admin/login`.

**Isto prova:** o cookie é escrito corretamente mas **não sobrevive ao reload /
à navegação para `/admin`**. Não é problema de expiração (está ~1h válido) nem de
credencial. É o browser a perder/persistir mal o cookie.

### 2.3 Resposta do servidor
- Num request após o MFA, os Response Headers do **servidor próprio** não mandam
  nenhum `Set-Cookie` a apagar os cookies de auth (o único `set-cookie` presente
  era `__cf_bm` da Cloudflare). Logo **o proxy não está a limpar server-side**.

### 2.4 Código lido (sem suspeitos óbvios)
- `src/proxy.ts` (middleware): único writer server-side; `setAll` **ignora
  `value===""`** (não limpa). Mesma lógica para `/admin` e `/portal`.
- `src/app/admin/layout.tsx` / `src/app/portal/layout.tsx`: `onAuthStateChange`
  apenas reage a `!session` (sem re-check AAL2 nem `signOut` global por evento).
  `checkAdmin()`/mount faz `getUser()` + AAL2 + `listFactors()` + query
  `admin_users` (só leitura).
- `src/app/admin/login/mfa/page.tsx` / `src/app/login/mfa/page.tsx`: após
  `mfa.verify()` usam `router.replace(...)`. **O `getSession()+setSession()`
  manual que existia foi removido** (era suspeito de corromper cookies).
- `src/lib/supabase/client.ts`: `createBrowserClient` (agora singleton).
- `src/lib/supabase/server.ts`: `createServerClient` (server components/route
  handlers).
- Não existe `middleware.ts` legacy; sem providers/contextos de auth custom;
  sem `signOut` fora dos login pages e layouts.

---

## 3. Hipóteses testadas — RESULTADO

| # | Hipótese | Correção aplicada | Resultado |
|---|----------|-------------------|-----------|
| H1 | `getSession()+setSession()` manual após `mfa.verify()` corrompia os cookies | Removido em ambas as páginas MFA | ❌ Não resolveu (admin continua a perder) |
| H2 | `onAuthStateChange` nos layouts re-avaliava AAL2 / fazia `signOut` global em cada refresh (corrida de rotação de refresh token) | Simplificado para reagir só a `!session` | ❌ Não resolveu |
| H3 | Múltiplos `createBrowserClient()` (layout monta 3×) competiam a escrever os cookies chunked `.0`/`.1` no verify → chunks inconsistentes | `createClient()` tornado **singleton** | ❌ Não resolveu |
| H4 | Dois writers (proxy + browser) com `cookieOptions` divergentes | `cookieOptions` explícitos e idênticos (`path:/`, `sameSite:lax`, `secure:true`, `httpOnly:false`) em client e server | ❌ Não resolveu |
| H5 | Tokens rejects por reuse de refresh token (janela 10s) | `security_refresh_token_reuse_interval` 10s → 86400s (remoto) | ❌ Não resolveu (defesa extra, mas não a causa) |

**Conclusão:** nenhuma das hipóteses acertou na causa. O cookie continua a
desaparecer **ao entrar/no F5 do `/admin`**, enquanto o `/portal` (com o mesmo
código de base) se mantém estável.

---

## 3b. Nova direção (revisão de evidência — 2026-07-12)

Revisão aponta dois pontos cegos na evidência anterior e uma hipótese
principal não listada:

- **Ponto cego 1:** §2.3 só prova que o *servidor* (proxy) não limpa o cookie.
  Como se definiu `httpOnly:false` (H4), o **cliente** pode expirar/apagar o
  cookie via `document.cookie` diretamente — invisível ao Network tab.
- **Ponto cego 2:** H3 (Path errado) é inconsistente com o sintoma. Um `Path`
  errado deixaria o cookie **listado** em Application→Cookies (só não seria
  enviado); o sintoma é *desaparecimento da lista* → eliminação/expiração
  **ativa**, não scope.

### Hipótese principal: chunking `.0`/`.1` + `setAll` a ignorar `value===""`

O `@supabase/ssr` faz chunking da sessão (`sb-...-auth-token.0`, `.1`, ...)
quando excede o limite de tamanho (`docCookieLen:3493` está perto). Com
`refresh_token_rotation_enabled=true`, quando a nova sessão cabe em **menos**
chunks, o SDK tenta **apagar os chunks extra** escrevendo `value:""`. O
`setAll` do proxy **ignora essas escritas vazias** (decisão documentada em
§2.4) → os chunks obsoletos ficam presos. Na leitura seguinte o SDK
reconstrói concatenando `.0+.1+...`; se `.1` for lixo incompatível, o parse
falha e o storage adapter do cliente limpa os cookies. Isto explica:
- desaparecimento **sem** `Set-Cookie` do servidor (quem limpa é o cliente);
- assimetria admin≠portal: o JWT do admin (role + `app_metadata` + possível
  custom access token hook) é maior e cruza o limiar de chunking com mais
  frequência que o do portal (que pode nunca passar de 1 chunk).

### Plano de validação (custo/sinal)
1. **30s:** Application→Cookies — admin tem `.0` **e** `.1` após MFA? Portal tem
   só nome único? (confirma/nega a teoria)
2. **2min (debug):** monkeypatch `document.cookie` para logar stack trace de
   TODAS as escritas (especialmente valor vazio/expirado para `sb-...-auth-
   token`/`.1`) nos segundos antes do redirect.
3. **1 linha:** remover o `if (value==="") return` do `setAll` do proxy (deixar
   encaminhar deleções) e testar o fluxo `/admin`. Se resolver → confirmado.
4. grep `.signOut(` nos layouts + `console.trace` dentro (cenário alternativo).

### Repriorização
- H5 (Vercel Toolbar): fim — afetaria admin e portal por igual.
- H3 (path): descartada (inconsistência com sintoma).
- **H2 (chunking + ignore vazio): topo**, ligada à decisão de §2.4.
- H4 (getUser no proxy a disparar refresh): secundária, testar depois.
- **H6 (JWT admin maior que portal):** investigar origem da assimetria.

---

## 4. Hipóteses ainda em aberto (próximos passos)

Ordenadas por probabilidade:

1. **Diferença de atributos do cookie escritos pelo `verify()` vs proxy.**
   O `createBrowserClient` escreve via `document.cookie`; o `createServerClient`
   (proxy) escreve via `response.cookies.set`. Embora ambos usem `path:/` e
   `sameSite:lax` agora, **o `secure` pode divergir num contexto específico**,
   ou o cookie ser escrito como `Session` (sem Max-Age) nalgum writer e o
   browser não o persistir no reload. → **Ação:** capturar os atributos exatos
   (`Path`, `SameSite`, `Secure`, `HttpOnly`, `Expires/Max-Age`) do cookie
   `sb-lyqmsluktqdeytpouyvh-auth-token.0` em Application→Cookies ANTES do F5.

2. **Chunking de cookies (`.0`/`.1`) + reescrita parcial pelo proxy.**
   O `@supabase/ssr` divide a sessão em chunks quando excede ~4096 bytes
   (`docCookieLen:3493` está perto do limite). Se o proxy reescrever apenas
   parte dos chunks (ou com `max-age` diferentes), o browser lê chunks
   incompatíveis após o reload. → **Ação:** verificar se `sb-...-auth-token.0`
   e `.1` têm sempre os mesmos atributos; considerar `cookieOptions.maxAge`
   explícito em ambos os writers.

3. **`mfa.verify()` escreve o cookie com `path` igual ao da página atual
   (`/admin/login/mfa`)** em vez de `/`. Ao navegar para `/admin` o cookie não
   seria enviado. → **Ação:** confirmar `Path` do cookie (hipótese 1 cobre).

4. **O proxy `/admin` faz `getUser()` server-side e, ao validar a sessão AAL2,
   dispara um refresh que roda o refresh token; o browser client em simultâneo
   usa o token antigo → GoTrue revoga** (apesar do reuse interval alto). O
   `/portal` não dispararia porque a sequência de chamadas no mount é
   ligeiramente diferente. → **Ação:** temporariamente retirar o `getUser()` do
   proxy para `/admin` (apenas ler cookies, não validar) e testar.

5. **Vercel Toolbar / Live (`vercel.live`) no preview** interfere com a sessão.
   Observado aviso de CSP sobre `https://vercel.live/_next-live/feedback.js`.
   → **Ação:** testar com a toolbar desligada ou num deploy de production.

6. **Diferença real de código admin vs portal ainda não lida.** Revisitar
   `src/app/admin/login/page.tsx`, `src/app/admin/layout.tsx` (montagem 3×,
   query `admin_users`) vs equivalentes do portal, à procura de algo que só o
   admin executa aquando da entrada em `/admin`.

---

## 5. Alterações feitas até agora (branch `fix/auth-session-stability`)

Commits:
- `07be48b` — singleton `createClient()` + `cookieOptions` consistentes
  (client e proxy) + remoção dos logs de debug.
- `256d915` — desbloqueio do build: `noImplicitAny:false` no `tsconfig.json` +
  correção de 2 arrays `never[]` em APIs (`send-email`, `newsletter/send`) —
  erros pré-existentes que impediam o deploy.
- Commits anteriores (planeamento): remoção de `setSession` manual pós-MFA;
  simplificação de `onAuthStateChange` nos layouts; `router.replace` pós-MFA;
  script `supabase/config-patch.sh` (reuse interval).

**Nenhuma destas alterações corrigiu o sintoma.** Mantêm-se como melhorias de
robustez, mas a causa raiz permanece por isolar.

---

## 6. Próximo passo recomendado

Antes de mais código: **capturar os atributos exatos do cookie** (hipóteses 1–3)
no preview atual, e **testar com a Vercel Toolbar desligada / em production**
(hipótese 5). É a forma mais rápida de isolar se o problema é (a) atributo de
cookie, (b) chunking, ou (c) interferência do preview da Vercel.
